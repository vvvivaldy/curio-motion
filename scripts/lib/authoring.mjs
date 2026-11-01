import {readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve, relative, isAbsolute} from 'node:path';
export const stages=['model','blocking','motion','final'];
export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export const json=async path=>JSON.parse(await readFile(path,'utf8'));
export function projectPath(name) {
  const path=resolve(name),local=relative(resolve('.'),path);
  if(isAbsolute(name)||local.split(/[\\/]/)[0]==='..')throw Error(`Expected project-relative path: ${name}`);
  return path;
}
export async function snapshotFiles(files,read=readFile) {
  const records=await Promise.all([...new Set(files)].sort().map(async path=>({path,sha256:digest(await read(path))})));
  return {sha256:digest(JSON.stringify(records)),files:records};
}
// Image/export inputs only. Review policy has its own snapshot and does not force a new film.
export async function sourceSnapshot(read=readFile) {
  const files=['package.json','package-lock.json','vite.config.ts','scripts/render.mjs','scripts/tools.mjs'];
  async function walk(dir) {
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      const path=`${dir}/${entry.name}`;
      if(entry.isDirectory())await walk(path);
      else if(/\.tsx?$/.test(path))files.push(path);
    }
  }
  await walk('src');return snapshotFiles(files,read);
}
export const qaSnapshot=(read=readFile)=>snapshotFiles(['scripts/review.mjs','scripts/lib/authoring.mjs','scripts/lib/diagnostics.mjs'],read);
export const criterionId=c=>typeof c==='string'?c:c.id;
export const criterionText=c=>typeof c==='string'?c:c.description;
export const needsIndependentReview=(plan,stage)=>plan.independentReview?.stages.includes(stage)??false;
export function validatePlan(plan) {
  if(![1,2].includes(plan.version)||typeof plan.id!=='string'||!/^[-a-z0-9]+$/.test(plan.id)||
    typeof plan.composition!=='string'||!plan.composition.trim()||typeof plan.input!=='string'||!plan.input.trim())throw Error('Invalid authoring plan identity');
  const s=plan.settings;
  if(!s||!['width','height','durationInFrames'].every(k=>Number.isInteger(s[k])&&s[k]>0)||!Number.isFinite(s.fps)||s.fps<=0)throw Error('Invalid plan settings');
  for(const field of ['observations','assumptions','actionBeats'])if(!Array.isArray(plan[field])||!plan[field].length)throw Error(`Missing ${field}`);
  for(const stage of stages) {
    const pass=plan.stages?.[stage];
    if(!pass||!Array.isArray(pass.samples)||!pass.samples.length||!Array.isArray(pass.criteria)||!pass.criteria.length)throw Error(`Missing ${stage} pass`);
    if(new Set(pass.criteria.map(criterionId)).size!==pass.criteria.length)throw Error('Invalid duplicate criteria');
    for(const c of pass.criteria) {
      if(plan.version===1 ? typeof c!=='string'||!c.trim() : !c||typeof c.id!=='string'||!/^[-a-z0-9]+$/.test(c.id)||typeof c.description!=='string'||!c.description.trim()||typeof c.required!=='boolean')throw Error('Invalid criteria');
      if(plan.version===2) {
        if(!Array.isArray(c.frames)||!c.frames.length||c.frames.some(f=>!sampleFrames(plan,stage).includes(f)))throw Error('Criterion needs captured frame evidence');
        if(c.relations!==undefined&&(!Array.isArray(c.relations)||c.relations.some(id=>typeof id!=='string'||!id.trim())))throw Error('Invalid criterion relations');
      }
    }
    for(const shot of pass.samples)if(!Number.isInteger(shot.frame)||shot.frame<0||shot.frame>=s.durationInFrames||!shot.label||
      !Number.isInteger(shot.radius??0)||(shot.radius??0)<0||(shot.radius??0)>12)throw Error(`Invalid ${stage} frame`);
  }
  if(plan.diagnosticModule!==undefined) {
    projectPath(plan.diagnosticModule);
    if(!/^src\/.*\.tsx?$/.test(plan.diagnosticModule))throw Error('Diagnostic module must be a source-hashed TypeScript file under src/');
  }
  if(plan.independentReview!==undefined) {
    const selected=plan.independentReview?.stages;
    if(plan.version!==2||!Array.isArray(selected)||!selected.includes('final')||
      selected.some(stage=>!['model','final'].includes(stage))||new Set(selected).size!==selected.length)
      throw Error('Independent review requires a version 2 plan and unique stages: final, optionally model');
  }
  return plan;
}
export function sampleFrames(plan,stage) {
  return [...new Set(plan.stages[stage].samples.flatMap(s=>Array.from({length:2*(s.radius??0)+1},(_,i)=>s.frame+i-(s.radius??0))))]
    .filter(f=>f>=0&&f<plan.settings.durationInFrames).sort((a,b)=>a-b);
}
/** Balanced predicates avoid FFmpeg expression-depth failure with dense review sets. */
export function ffmpegFrameSelection(frames) {
  if(!Array.isArray(frames)||!frames.length||frames.some(f=>!Number.isSafeInteger(f)||f<0))throw Error('Expected nonempty nonnegative integer frames');
  const terms=[...new Set(frames)].sort((a,b)=>a-b).map(f=>`eq(n\\,${f})`);
  const sum=(first,last)=>{
    if(last-first===1)return terms[first];
    const middle=Math.floor((first+last)/2);
    return `(${sum(first,middle)}+${sum(middle,last)})`;
  };
  return sum(0,terms.length);
}
export async function loadPlan(path) {
  const bytes=await readFile(projectPath(path)),plan=validatePlan(JSON.parse(bytes));
  const inputBytes=await readFile(projectPath(plan.input)),input=JSON.parse(inputBytes),ref=input.reference;
  if(ref?.runtimeUsage!==false)throw Error('Whole reference must be authoring-only');
  const referenceBytes=await readFile(projectPath(ref.path));
  if(digest(referenceBytes)!==ref.sha256)throw Error('Reference differs from pinned whole input');
  const actionFiles=plan.actionFiles??[];
  const actions=await Promise.all(actionFiles.map(async path=>({path,sha256:digest(await readFile(projectPath(path)))})));
  // New scaffolds pin the owner's original ACTION as well as the whole media.
  // Keep legacy manifests whose action is a path string (or absent) readable.
  if(input.action!==null&&typeof input.action==='object') {
    const pinned=input.action;
    if(typeof pinned.path!=='string'||!pinned.path.trim()||typeof pinned.sha256!=='string'||!/^[a-f0-9]{64}$/.test(pinned.sha256))
      throw Error('Pinned ACTION requires a project-relative path and SHA-256');
    const path=projectPath(pinned.path),action=actions.find(item=>projectPath(item.path)===path);
    if(!action)throw Error('Pinned ACTION must be included in plan actionFiles');
    if(action.sha256!==pinned.sha256)throw Error('ACTION differs from pinned unchanged input');
  }
  const [source,qa]=await Promise.all([sourceSnapshot(),qaSnapshot()]);
  const identityForSource=sha=>digest(JSON.stringify({source:sha,plan:digest(bytes),input:digest(inputBytes),actions}));
  return {plan,input,source,qa,referenceBytes,identity:identityForSource(source.sha256),identityForSource};
}
export function validateDiagnostics(report,capture) {
  if(report.version!==1||report.sourceSha256!==capture.source.sha256||JSON.stringify(report.frames)!==JSON.stringify(capture.frames)||!Array.isArray(report.results))throw Error('Diagnostic source/frame mismatch');
  const keys=new Set();
  for(const r of report.results) {
    const key=`${r.relation}:${r.frame}`;
    if(!r.relation||!capture.frames.includes(r.frame)||!['pass','fail','needs-review'].includes(r.status)||!r.message?.trim()||keys.has(key))throw Error('Invalid diagnostic frame evidence');
    keys.add(key);
  }
  for(const c of capture.criteria)for(const relation of c.relations??[])for(const frame of c.frames)
    if(!keys.has(`${relation}:${frame}`))throw Error(`Missing diagnostic coverage: ${relation} f${frame}`);
  return report;
}
export function validateReview(review,capture,captureHash,diagnostics) {
  if(review.captureSha256!==captureHash||review.decision!=='accept'||!review.reviewer?.trim()||!review.notes?.trim())throw Error('Review pending, rejected or refers to different captures');
  const checks=review.checks??[],modern=capture.planVersion===2;
  if(checks.length!==capture.criteria.length)throw Error('Every visual criterion needs a specific observation');
  for(const c of capture.criteria) {
    const matching=checks.filter(v=>v.criterion===criterionId(c)),v=matching[0];
    if(matching.length!==1||!v.notes?.trim())throw Error('Every visual criterion needs a specific observation');
    if(modern&&(!Array.isArray(v.frames)||!v.frames.length||v.frames.some(f=>!capture.frames.includes(f))||c.frames.some(f=>!v.frames.includes(f))))throw Error('Criterion missing required frame evidence');
    if(v.verdict!=='pass') {
      // Legacy criteria and required v2 criteria retain the passing-verdict contract.
      if(!modern||c.required||v.verdict!=='limitation')throw Error('Required criteria need pass; failure/needs-review or unsupported verdict blocks acceptance');
      const limits=Array.isArray(review.issues)?review.issues.filter(i=>i.criterion===c.id&&i.status==='limitation'):[];
      if(!limits.length||limits.some(i=>!Array.isArray(i.frames)||!i.frames.length||i.frames.some(f=>!v.frames.includes(f))))throw Error('Optional limitation needs a linked limitation issue and matching frame evidence');
    }
  }
  if(['motion','final'].includes(capture.stage)&&(!review.playback?.normal||!review.playback?.slow))throw Error('Normal and slow playback review required');
  if(!Array.isArray(review.issues))throw Error('Issue ledger required (may be empty after review)');
  for(const issue of review.issues) {
    if(!issue.id||!issue.symptom||!issue.cause||!issue.resolution||!['resolved','limitation'].includes(issue.status)||
      !Array.isArray(issue.frames)||!issue.frames.length||issue.frames.some(f=>!capture.frames.includes(f)))throw Error('Open/incomplete issue or missing captured frame evidence');
    if(modern) {
      const criterion=capture.criteria.find(c=>c.id===issue.criterion);
      if(!criterion)throw Error('Issue needs a declared criterion');
      if(issue.status==='limitation'&&criterion.required)throw Error('Required visual defect cannot be accepted as a limitation');
      if(issue.status==='limitation'&&!checks.some(v=>v.criterion===criterion.id&&v.verdict==='limitation'&&issue.frames.every(f=>v.frames.includes(f))))throw Error('Optional issue limitation needs an explicit limitation check with matching frame evidence');
    }
  }
  if(modern) {
    if(!diagnostics)throw Error('Diagnostic report required for version 2 capture');
    validateDiagnostics(diagnostics,capture);
    for(const result of diagnostics.results)if(result.status!=='pass') {
      const issue=review.issues.find(i=>i.relation===result.relation&&i.frames.includes(result.frame));
      if(!issue||issue.status!=='limitation')throw Error('Diagnostic failure/needs-review requires explicit issue evidence and recapture after repair');
      const criterion=capture.criteria.find(c=>c.id===issue.criterion);
      const owners=capture.criteria.filter(c=>(c.relations??[]).includes(result.relation)&&c.frames.includes(result.frame));
      if(!owners.some(c=>c.id===criterion?.id)||owners.some(c=>c.required))throw Error('Required or unassigned diagnostic defect blocks acceptance');
    }
  }
}
export function validateIndependentReview(review,authorReview,authorReviewHash,capture,captureHash,diagnostics) {
  if(review.role!=='independent'||review.authorReviewSha256!==authorReviewHash)
    throw Error('Independent review must declare its role and bind the current author review');
  const identity=name=>typeof name==='string'?name.normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase():'';
  if(!identity(review.reviewer)||identity(review.reviewer)===identity(authorReview.reviewer))
    throw Error('Independent review requires a separately declared reviewer');
  validateReview(review,capture,captureHash,diagnostics);
  if(['motion','final'].includes(capture.stage)&&!review.playback.notes?.trim())
    throw Error('Independent playback requires specific observations at normal and slow speed');
}
export async function checkDelivery(loaded,folder) {
  const latest=await json(`${folder}/latest.json`),results=[];
  for(const stage of stages) {
    const run=latest[stage];
    if(typeof run!=='string'||!/^[-a-zA-Z0-9_]+$/.test(run))throw Error(`Missing ${stage} capture`);
    const dir=`${folder}/${run}`,bytes=await readFile(`${dir}/capture.json`),capture=JSON.parse(bytes);
    if(capture.stage!==stage||capture.identity!==loaded.identity)throw Error(`${stage} captures are stale: source/input/plan changed`);
    if(loaded.plan.version===2&&(capture.version!==2||capture.planVersion!==2))throw Error('Version 2 plan requires version 2 evidence');
    if(capture.pageErrors?.length)throw Error(`${stage} capture has browser errors`);
    if(JSON.stringify(capture.frames)!==JSON.stringify(sampleFrames(loaded.plan,stage))||JSON.stringify(capture.criteria)!==JSON.stringify(loaded.plan.stages[stage].criteria))throw Error('Capture plan mismatch');
    for(const artifact of capture.artifacts)if(digest(await readFile(projectPath(`${dir}/${artifact.path}`)))!==artifact.sha256)throw Error(`Altered/missing artifact: ${artifact.path}`);
    for(const frame of capture.frames)if(!capture.artifacts.some(a=>a.path===`frames/f${String(frame).padStart(6,'0')}.png`))throw Error('Missing rendered frame');
    if(!capture.artifacts.some(a=>a.path==='preview.mp4')&&['motion','final'].includes(stage))throw Error('Missing playback evidence');
    let diagnostics;
    if(capture.planVersion===2) {
      if(!capture.artifacts.some(a=>a.path==='diagnostics.json'))throw Error('Missing diagnostic artifact');
      diagnostics=await json(`${dir}/diagnostics.json`);
    }
    const authorBytes=await readFile(`${dir}/review.json`),authorReview=JSON.parse(authorBytes),captureHash=digest(bytes);
    validateReview(authorReview,capture,captureHash,diagnostics);
    let independentReview;
    if(needsIndependentReview(loaded.plan,stage)) {
      const reviewBytes=await readFile(`${dir}/independent-review.json`),review=JSON.parse(reviewBytes);
      validateIndependentReview(review,authorReview,digest(authorBytes),capture,captureHash,diagnostics);
      independentReview={reviewer:review.reviewer,reviewSha256:digest(reviewBytes),authorReviewSha256:digest(authorBytes)};
    }
    results.push({stage,run,frames:capture.frames.length,decision:'accepted visual review',schema:capture.planVersion===2?'frame-evidence-v2':'legacy-v1',captureSha256:captureHash,...(independentReview?{independentReview}:{})});
  }
  return {identity:loaded.identity,source:loaded.source.sha256,qa:loaded.qa,results,note:'Recorded visual review plus artifact integrity, not an automated beauty score.'};
}
