import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {findTool} from './tools.mjs';
import {mkdir,mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {stages,loadPlan,validatePlan,sampleFrames,ffmpegFrameSelection,validateReview,validateIndependentReview,checkDelivery,digest,sourceSnapshot,qaSnapshot,validateDiagnostics} from './lib/authoring.mjs';
const clone=v=>structuredClone(v);
test('independent video plan validates without bundling the user recording',async()=>{
  const plan=validatePlan(JSON.parse(await readFile('authoring/serious-boar.json','utf8')));
  const input=JSON.parse(await readFile(plan.input,'utf8'));
  assert.equal(input.reference.mediaType,'video/mp4');
  assert.equal(input.reference.runtimeUsage,false);
  assert.match(input.reference.sha256,/^[a-f0-9]{64}$/);
  assert.equal(sampleFrames(plan,'final').at(-1),575);
});
test('pinned unchanged ACTION rejects edited bytes, missing plan linkage and incomplete hashes; legacy inputs remain readable',async()=>{
  await mkdir('qa',{recursive:true});const folder=await mkdtemp('qa/authoring-action-test-');
  try {
    const plan=JSON.parse(await readFile('authoring/amber-robot.json','utf8'));
    const actionPath=`${folder}/ACTION.txt`,inputPath=`${folder}/input.json`,planPath=`${folder}/plan.json`;
    const original='Owner action, byte-for-byte.\n',reference='Whole fixture reference';
    const input={reference:{path:`${folder}/whole.png`,sha256:digest(reference),runtimeUsage:false},action:{path:actionPath,sha256:digest(original),unchanged:true}};
    plan.input=inputPath;plan.actionFiles=[actionPath];
    await writeFile(input.reference.path,reference);await writeFile(actionPath,original);
    const save=async()=>{await writeFile(inputPath,JSON.stringify(input));await writeFile(planPath,JSON.stringify(plan));};
    await save();assert.equal((await loadPlan(planPath)).input.action.sha256,digest(original));
    await writeFile(actionPath,'Different action\n');await assert.rejects(()=>loadPlan(planPath),/ACTION differs from pinned/);
    await writeFile(actionPath,original);plan.actionFiles=[];await save();
    await assert.rejects(()=>loadPlan(planPath),/ACTION must be included/);
    plan.actionFiles=[actionPath];
    for(const action of [{path:actionPath},{sha256:digest(original)},{path:actionPath,sha256:'not-a-hash'}]){
      input.action=action;await save();await assert.rejects(()=>loadPlan(planPath),/Pinned ACTION requires/);
    }
    // Existing v1 manifests use a path string, and some have no action property.
    input.action=actionPath;await save();await loadPlan(planPath);
    delete input.action;plan.actionFiles=[];await save();await loadPlan(planPath);
  }finally{await rm(folder,{recursive:true,force:true});}
});
test('both whole-reference plans validate, keep fps and expand dangerous neighbors',async()=>{
  for(const id of ['pink-monkey','amber-robot']) {
    const {plan}=await loadPlan(`authoring/${id}.json`);
    for(const value of [undefined,123,'', '../escape']) {
      const badIdentity=clone(plan);badIdentity.id=value;
      assert.throws(()=>validatePlan(badIdentity),/identity/);
    }
    const fractional=clone(plan);fractional.settings.fps=29.97;validatePlan(fractional);
    assert(sampleFrames(plan,'motion').length>plan.stages.motion.samples.length);
    assert.equal(sampleFrames(plan,'final').at(-1),plan.settings.durationInFrames-1);
    const bad=clone(plan);bad.stages.model.samples[0].frame=plan.settings.durationInFrames;
    assert.throws(()=>validatePlan(bad),/frame/);
    bad.stages.model.samples[0].frame=-1;assert.throws(()=>validatePlan(bad),/frame/);
    bad.stages.model.samples[0].frame=0;bad.stages.motion.samples[0].radius=100;assert.throws(()=>validatePlan(bad),/frame/);
  }
});
const accepted=(capture,hash)=>({captureSha256:hash,decision:'accept',reviewer:'Fixture reviewer',notes:'Fixture observation',
  checks:capture.criteria.map(criterion=>({criterion,verdict:'pass',notes:'Observed fixture frames'})),playback:{normal:true,slow:true},issues:[]});
test('delivery refuses pending review, stale sources, missing frames and altered evidence',async()=>{
  await mkdir('qa',{recursive:true});const folder=await mkdtemp('qa/authoring-test-');
  try {
    const {plan}=await loadPlan('authoring/amber-robot.json');const loaded={plan,identity:'fixture-identity',source:{sha256:'fixture-source'}},latest={};
    for(const stage of stages) {
      const dir=`${folder}/${stage}`;latest[stage]=stage;await mkdir(`${dir}/frames`,{recursive:true});
      const frames=sampleFrames(plan,stage),names=frames.map(f=>`frames/f${String(f).padStart(6,'0')}.png`);
      if(['motion','final'].includes(stage))names.push('preview.mp4');
      for(const path of names)await writeFile(`${dir}/${path}`,'fixture bytes');
      const capture={stage,identity:loaded.identity,criteria:plan.stages[stage].criteria,frames,
        artifacts:names.map(path=>({path,sha256:digest('fixture bytes')}))};
      const bytes=JSON.stringify(capture);await writeFile(`${dir}/capture.json`,bytes);
      await writeFile(`${dir}/review.json`,JSON.stringify(accepted(capture,digest(bytes))));
    }
    await writeFile(`${folder}/latest.json`,JSON.stringify(latest));
    assert.equal((await checkDelivery(loaded,folder)).results.length,4);
    await assert.rejects(()=>checkDelivery({...loaded,identity:'changed-source'},folder),/stale/);
    const path=`${folder}/motion/review.json`,good=await readFile(path,'utf8'),bad=JSON.parse(good);
    bad.decision='pending';await writeFile(path,JSON.stringify(bad));await assert.rejects(()=>checkDelivery(loaded,folder),/pending/);
    bad.decision='accept';bad.playback.slow=false;await writeFile(path,JSON.stringify(bad));await assert.rejects(()=>checkDelivery(loaded,folder),/playback/);
    await writeFile(path,good);
    const capturePath=`${folder}/model/capture.json`,cap=JSON.parse(await readFile(capturePath,'utf8'));
    await writeFile(`${folder}/model/${cap.artifacts[0].path}`,'altered');await assert.rejects(()=>checkDelivery(loaded,folder),/artifact/);
    await writeFile(`${folder}/model/${cap.artifacts[0].path}`,'fixture bytes');
    cap.artifacts.shift();await writeFile(capturePath,JSON.stringify(cap));await assert.rejects(()=>checkDelivery(loaded,folder),/Missing rendered frame/);
  } finally {await rm(folder,{recursive:true,force:true});}
});
test('an issue needs frame evidence, cause and resolution; limits remain explicit',()=>{
  const capture={stage:'final',frames:[55,120],criteria:['Physical grip']},review=accepted(capture,'hash');
  review.issues=[{id:'arm',frames:[120],symptom:'Bent wrist',cause:'Body pivot',resolution:'Handle pivot',status:'open'}];
  assert.throws(()=>validateReview(review,capture,'hash'),/issue/);
  review.issues[0].status='resolved';validateReview(review,capture,'hash');
  review.issues[0].frames=[121];assert.throws(()=>validateReview(review,capture,'hash'),/evidence/);
  review.issues[0].frames=[120];review.issues[0].status='limitation';validateReview(review,capture,'hash');
  review.captureSha256='old';assert.throws(()=>validateReview(review,capture,'hash'),/different captures/);
});


test('QA-only changes preserve image identity; geometry and export changes invalidate it',async()=>{
  const base=path=>Buffer.from(`fixture:${path}`);
  const qaEdit=path=>Buffer.from(`fixture:${path}${path==='scripts/lib/authoring.mjs'?':new-validator':''}`);
  const geometryEdit=path=>Buffer.from(`fixture:${path}${path==='src/core/time.ts'?':new-geometry':''}`);
  const exportEdit=path=>Buffer.from(`fixture:${path}${path==='scripts/render.mjs'?':new-export':''}`);
  assert.equal((await sourceSnapshot(base)).sha256,(await sourceSnapshot(qaEdit)).sha256);
  assert.notEqual((await qaSnapshot(base)).sha256,(await qaSnapshot(qaEdit)).sha256);
  assert.notEqual((await sourceSnapshot(base)).sha256,(await sourceSnapshot(geometryEdit)).sha256);
  assert.notEqual((await sourceSnapshot(base)).sha256,(await sourceSnapshot(exportEdit)).sha256);
});
const modernFixture=()=>{
  const capture={version:2,planVersion:2,source:{sha256:'source'},stage:'model',frames:[10,11],
    criteria:[{id:'contact',description:'Continuous contact',required:true,frames:[10,11],relations:['hoof-floor']}]};
  const diagnostics={version:1,sourceSha256:'source',frames:[10,11],results:[10,11].map(frame=>({relation:'hoof-floor',frame,status:'pass',message:'Fixture geometric contact'}))};
  const review={captureSha256:'hash',decision:'accept',reviewer:'Fixture reviewer',notes:'Inspected frame pair',
    checks:[{criterion:'contact',verdict:'pass',notes:'Observed complete hoof contour at support',frames:[10,11]}],issues:[]};
  return {capture,diagnostics,review};
};
test('independent gate is opt-in for v2 final, with optional model; existing plans keep their schema',async()=>{
  const plan=JSON.parse(await readFile('authoring/amber-robot.json','utf8'));
  validatePlan(plan);
  plan.independentReview={stages:['final']};
  assert.throws(()=>validatePlan(plan),/version 2/);
  plan.version=2;
  for(const stage of stages)plan.stages[stage].criteria=plan.stages[stage].criteria.map((description,i)=>({id:`criterion-${i}`,description,required:true,frames:[plan.stages[stage].samples[0].frame]}));
  validatePlan(plan);plan.independentReview.stages=['model','final'];validatePlan(plan);
  for(const policy of [null,{},false,{stages:[]},{stages:['model']},{stages:['final','motion']},{stages:['final','final']}]) {
    plan.independentReview=policy;assert.throws(()=>validatePlan(plan),/Independent review/);
  }
  delete plan.independentReview;validatePlan(plan);
});
test('separate declared reviewer must inspect current captures, required frames, defects and playback',()=>{
  const {capture,diagnostics,review:author}=modernFixture();capture.stage='final';
  const review={...clone(author),reviewer:'Separate fixture inspector',role:'independent',authorReviewSha256:'author-hash',
    playback:{normal:true,slow:true,notes:'At 1x the contact lands cleanly; at 0.5x f10–11 retains a joined hoof contour.'}};
  const check=value=>validateIndependentReview(value,author,'author-hash',capture,'hash',diagnostics);
  check(review);
  for(const [patch,error] of [
    [{role:'author'},/declare its role/],
    [{authorReviewSha256:'old-author'},/current author review/],
    [{reviewer:'  FIXTURE   reviewer  '},/separately declared/],
    [{captureSha256:'old-capture'},/different captures/],
    [{decision:'pending'},/pending/],
    [{decision:'reject'},/rejected/],
    [{notes:''},/pending/],
    [{checks:[]},/specific observation/],
    [{checks:[{...review.checks[0],frames:[10]}]},/frame evidence/],
    [{checks:[{...review.checks[0],notes:''}]},/specific observation/],
    [{checks:[{...review.checks[0],verdict:'fail'}]},/blocks acceptance/],
    [{playback:{normal:true,slow:false,notes:'Inspected'}},/playback/],
    [{playback:{normal:true,slow:true,notes:'  '}},/specific observations/]
  ])assert.throws(()=>check({...clone(review),...patch}),error);
  const defect=clone(diagnostics);defect.results[0].status='needs-review';
  assert.throws(()=>validateIndependentReview(review,author,'author-hash',capture,'hash',defect),/requires explicit issue/);
  capture.stage='model';delete review.playback;check(review);
});
test('v2 requires per-criterion frames and refuses mandatory defects as limitations',()=>{
  const {capture,diagnostics,review}=modernFixture();
  validateReview(review,capture,'hash',diagnostics);
  review.checks[0].frames=[10];assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/frame evidence/);
  review.checks[0].frames=[10,11];
  for(const verdict of ['fail','needs-review']) {
    review.checks[0].verdict=verdict;
    assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/blocks acceptance/);
  }
  review.checks[0].verdict='pass';
  review.issues=[{id:'slide',criterion:'contact',frames:[10],symptom:'Hoof slides',cause:'Root offset',resolution:'Known defect',status:'limitation'}];
  assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/cannot be accepted as a limitation/);
});
test('v2 diagnostics bind source, exact frames and every claimed relation',()=>{
  const {capture,diagnostics,review}=modernFixture();
  const bad=clone(diagnostics);bad.sourceSha256='stale';assert.throws(()=>validateDiagnostics(bad,capture),/source\/frame/);
  bad.sourceSha256='source';bad.results.pop();assert.throws(()=>validateDiagnostics(bad,capture),/coverage/);
  for(const status of ['fail','needs-review']) {
    diagnostics.results[0].status=status;
    assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/requires explicit issue/);
    review.issues=[{id:'contact',criterion:'contact',relation:'hoof-floor',frames:[10],symptom:'Uncertain contact',cause:'Offset',resolution:'Adjusted',status:'resolved'}];
    assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/recapture/);
    review.issues=[];
  }
});

test('v2 delivery checks hashed diagnostic artifacts and the complete frame-evidence chain',async()=>{
  await mkdir('qa',{recursive:true});const folder=await mkdtemp('qa/authoring-v2-test-');
  try {
    const fixture=modernFixture(),plan={version:2,settings:{durationInFrames:20},stages:Object.fromEntries(stages.map(stage=>[stage,{samples:[{frame:10},{frame:11}],criteria:fixture.capture.criteria}]))};
    const loaded={plan,identity:'modern-identity',source:{sha256:'source'},qa:{sha256:'qa-version'}},latest={};
    for(const stage of stages) {
      const dir=`${folder}/${stage}`;await mkdir(`${dir}/frames`,{recursive:true});latest[stage]=stage;
      const contents={'frames/f000010.png':'fixture pixels 10','frames/f000011.png':'fixture pixels 11','diagnostics.json':JSON.stringify(fixture.diagnostics)};
      if(['motion','final'].includes(stage))contents['preview.mp4']='fixture playback';
      for(const [path,bytes] of Object.entries(contents))await writeFile(`${dir}/${path}`,bytes);
      const capture={...fixture.capture,stage,identity:loaded.identity,artifacts:Object.entries(contents).map(([path,bytes])=>({path,sha256:digest(bytes)}))};
      const bytes=JSON.stringify(capture);await writeFile(`${dir}/capture.json`,bytes);
      await writeFile(`${dir}/review.json`,JSON.stringify({...fixture.review,captureSha256:digest(bytes),playback:{normal:true,slow:true}}));
    }
    await writeFile(`${folder}/latest.json`,JSON.stringify(latest));
    const result=await checkDelivery(loaded,folder);assert.equal(result.results.length,4);assert(result.results.every(r=>r.schema==='frame-evidence-v2'));
    const path=`${folder}/model/diagnostics.json`,good=await readFile(path,'utf8');
    await writeFile(path,'altered');await assert.rejects(()=>checkDelivery(loaded,folder),/artifact/);await writeFile(path,good);
    const reviewPath=`${folder}/final/review.json`,review=JSON.parse(await readFile(reviewPath,'utf8'));
    review.checks[0].frames=[10];await writeFile(reviewPath,JSON.stringify(review));
    await assert.rejects(()=>checkDelivery(loaded,folder),/frame evidence/);
    review.checks[0].frames=[10,11];await writeFile(reviewPath,JSON.stringify(review));
    await assert.rejects(()=>checkDelivery({...loaded,identity:'changed-plan-input-or-geometry'},folder),/stale/);
    assert.equal((await checkDelivery({...loaded,qa:{sha256:'new-validator'}},folder)).results.length,4);
    // The same complete author reviews cannot satisfy an opted-in independent gate.
    plan.independentReview={stages:['final']};
    await assert.rejects(()=>checkDelivery(loaded,folder),/independent-review.json/);
    const writeIndependent=async stage=>{
      const dir=`${folder}/${stage}`,authorBytes=await readFile(`${dir}/review.json`);
      const review={...JSON.parse(authorBytes),role:'independent',reviewer:'Separate fixture inspector',authorReviewSha256:digest(authorBytes),
        playback:{normal:true,slow:true,notes:'At 1x the step reads clearly; at 0.5x f10–11 the supported hoof stays joined.'}};
      await writeFile(`${dir}/independent-review.json`,JSON.stringify(review));
    };
    await writeIndependent('final');
    let delivery=await checkDelivery(loaded,folder);
    assert.equal(delivery.results.find(r=>r.stage==='final').independentReview.reviewer,'Separate fixture inspector');
    plan.independentReview.stages.push('model');
    await assert.rejects(()=>checkDelivery(loaded,folder),/independent-review.json/);
    await writeIndependent('model');delivery=await checkDelivery(loaded,folder);
    assert.equal(delivery.results.filter(r=>r.independentReview).length,2);
    // Even editing the author's notes after approval requires an explicit new independent review.
    review.notes='New author observation';await writeFile(reviewPath,JSON.stringify(review));
    await assert.rejects(()=>checkDelivery(loaded,folder),/current author review/);
  } finally {await rm(folder,{recursive:true,force:true});}
});

test('v2 optional limitations are explicit and require linked complete frame evidence',()=>{
  const {capture,diagnostics,review}=modernFixture();capture.criteria[0].required=false;
  const issue={id:'projected-contact',criterion:'contact',relation:'hoof-floor',frames:[10],symptom:'Projected gap at one frame',cause:'Authored perspective',resolution:'Accepted optional perspective limitation',status:'limitation'};
  review.checks[0].verdict='limitation';review.checks[0].notes='Observed the optional gap at f10; f11 contact is clear';
  assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/linked limitation issue/);
  review.issues=[issue];validateReview(review,capture,'hash',diagnostics);
  for(const status of ['fail','needs-review']) {
    diagnostics.results[0].status=status;validateReview(review,capture,'hash',diagnostics);
  }
  review.checks[0].verdict='pass';assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/explicit limitation check/);
  review.checks[0].verdict='limitation';
  review.issues[0]={...issue,cause:''};assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/incomplete issue/);
  review.issues[0]={...issue,criterion:'other'};assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/linked limitation issue/);
  review.issues[0]={...issue,frames:[11]};assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/requires explicit issue/);
  review.issues[0]=issue;capture.criteria[0].required=true;
  assert.throws(()=>validateReview(review,capture,'hash',diagnostics),/blocks acceptance/);
  const legacy={stage:'model',frames:[10],criteria:['Legacy optional concern']},old=accepted(legacy,'legacy');
  old.checks[0].verdict='limitation';assert.throws(()=>validateReview(old,legacy,'legacy'),/blocks acceptance/);
});


test('dense final review selects exact decoded frame timestamps beyond FFmpeg flat-expression depth',t=>{
  for(const bad of [[],[-1],[.5],[NaN]])assert.throws(()=>ffmpegFrameSelection(bad),/integer frames/);
  let ffmpeg;try{ffmpeg=findTool('ffmpeg');}catch{t.skip('Installed FFmpeg unavailable; no tool download');return;}
  const wanted=[...Array.from({length:120},(_,i)=>i*2),239];
  const output=execFileSync(ffmpeg,['-v','error','-f','lavfi','-i','color=c=black:s=2x2:r=24:d=10',
    '-vf',`select=${ffmpegFrameSelection([...wanted].reverse().concat(0,239))}`,'-fps_mode','passthrough','-f','framemd5','-'],{encoding:'utf8',timeout:10000});
  const timestamps=output.split('\n').filter(line=>line&&!line.startsWith('#')).map(line=>Number(line.split(',')[2]));
  assert.deepEqual(timestamps,wanted,'selected decoded timestamps must match requested frames, including last frame and deduplication');
});
