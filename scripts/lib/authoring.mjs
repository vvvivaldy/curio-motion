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
export async function sourceSnapshot() {
  const files=['package.json','package-lock.json','vite.config.ts','scripts/render.mjs','scripts/review.mjs','scripts/tools.mjs','scripts/lib/authoring.mjs'];
  async function walk(dir) {
    for(const entry of await readdir(dir,{withFileTypes:true})) {
      const path=`${dir}/${entry.name}`;
      if(entry.isDirectory())await walk(path);
      else if(/\.tsx?$/.test(path))files.push(path);
    }
  }
  await walk('src');files.sort();
  const records=await Promise.all(files.map(async path=>({path,sha256:digest(await readFile(path))})));
  return {sha256:digest(JSON.stringify(records)),files:records};
}
export function validatePlan(plan) {
  if(plan.version!==1||typeof plan.id!=='string'||!/^[-a-z0-9]+$/.test(plan.id)||
    typeof plan.composition!=='string'||!plan.composition.trim()||typeof plan.input!=='string'||!plan.input.trim())throw Error('Invalid authoring plan identity');
  const s=plan.settings;
  if(!s||!['width','height','durationInFrames'].every(k=>Number.isInteger(s[k])&&s[k]>0)||!Number.isFinite(s.fps)||s.fps<=0)throw Error('Invalid plan settings');
  for(const field of ['observations','assumptions','actionBeats'])if(!Array.isArray(plan[field])||!plan[field].length)throw Error(`Missing ${field}`);
  for(const stage of stages) {
    const pass=plan.stages?.[stage];
    if(!pass||!Array.isArray(pass.samples)||!pass.samples.length||!Array.isArray(pass.criteria)||!pass.criteria.length)throw Error(`Missing ${stage} pass`);
    if(new Set(pass.criteria).size!==pass.criteria.length||pass.criteria.some(s=>typeof s!=='string'||!s.trim()))throw Error('Invalid criteria');
    for(const shot of pass.samples)if(!Number.isInteger(shot.frame)||shot.frame<0||shot.frame>=s.durationInFrames||!shot.label||
      !Number.isInteger(shot.radius??0)||(shot.radius??0)<0||(shot.radius??0)>12)throw Error(`Invalid ${stage} frame`);
  }
  return plan;
}
export function sampleFrames(plan,stage) {
  return [...new Set(plan.stages[stage].samples.flatMap(s=>Array.from({length:2*(s.radius??0)+1},(_,i)=>s.frame+i-(s.radius??0))))]
    .filter(f=>f>=0&&f<plan.settings.durationInFrames).sort((a,b)=>a-b);
}
export async function loadPlan(path) {
  const bytes=await readFile(projectPath(path)),plan=validatePlan(JSON.parse(bytes));
  const inputBytes=await readFile(projectPath(plan.input)),input=JSON.parse(inputBytes),ref=input.reference;
  if(ref?.runtimeUsage!==false)throw Error('Whole reference must be authoring-only');
  const referenceBytes=await readFile(projectPath(ref.path));
  if(digest(referenceBytes)!==ref.sha256)throw Error('Reference differs from pinned whole input');
  const actionFiles=plan.actionFiles??[];
  const actions=await Promise.all(actionFiles.map(async path=>({path,sha256:digest(await readFile(projectPath(path)))})));
  const source=await sourceSnapshot();
  return {plan,input,source,referenceBytes,identity:digest(JSON.stringify({source:source.sha256,plan:digest(bytes),input:digest(inputBytes),actions}))};
}
export function validateReview(review,capture,captureHash) {
  if(review.captureSha256!==captureHash||review.decision!=='accept'||!review.reviewer?.trim()||!review.notes?.trim())throw Error('Review pending, rejected or refers to different captures');
  const checks=review.checks??[];
  if(checks.length!==capture.criteria.length||capture.criteria.some(c=>checks.filter(v=>v.criterion===c&&v.verdict==='pass'&&v.notes?.trim()).length!==1))
    throw Error('Every visual criterion needs a specific passing observation');
  if(['motion','final'].includes(capture.stage)&&(!review.playback?.normal||!review.playback?.slow))throw Error('Normal and slow playback review required');
  if(!Array.isArray(review.issues))throw Error('Issue ledger required (may be empty after review)');
  for(const issue of review.issues) {
    if(!issue.id||!issue.symptom||!issue.cause||!issue.resolution||!['resolved','limitation'].includes(issue.status)||
      !Array.isArray(issue.frames)||!issue.frames.length||issue.frames.some(f=>!capture.frames.includes(f)))throw Error('Open/incomplete issue or missing captured frame evidence');
  }
}
export async function checkDelivery(loaded,folder) {
  const latest=await json(`${folder}/latest.json`),results=[];
  for(const stage of stages) {
    const run=latest[stage];
    if(typeof run!=='string'||!/^[-a-zA-Z0-9_]+$/.test(run))throw Error(`Missing ${stage} capture`);
    const dir=`${folder}/${run}`,bytes=await readFile(`${dir}/capture.json`),capture=JSON.parse(bytes);
    if(capture.stage!==stage||capture.identity!==loaded.identity)throw Error(`${stage} captures are stale: source/input/plan changed`);
    if(capture.pageErrors?.length)throw Error(`${stage} capture has browser errors`);
    if(JSON.stringify(capture.frames)!==JSON.stringify(sampleFrames(loaded.plan,stage))||JSON.stringify(capture.criteria)!==JSON.stringify(loaded.plan.stages[stage].criteria))throw Error('Capture plan mismatch');
    for(const artifact of capture.artifacts)if(digest(await readFile(projectPath(`${dir}/${artifact.path}`)))!==artifact.sha256)throw Error(`Altered/missing artifact: ${artifact.path}`);
    for(const frame of capture.frames)if(!capture.artifacts.some(a=>a.path===`frames/f${String(frame).padStart(6,'0')}.png`))throw Error('Missing rendered frame');
    if(!capture.artifacts.some(a=>a.path==='preview.mp4')&&['motion','final'].includes(stage))throw Error('Missing playback evidence');
    validateReview(await json(`${dir}/review.json`),capture,digest(bytes));
    results.push({stage,run,frames:capture.frames.length,decision:'accepted visual review',captureSha256:digest(bytes)});
  }
  return {identity:loaded.identity,source:loaded.source.sha256,results,note:'Recorded visual review plus artifact integrity, not an automated beauty score.'};
}
