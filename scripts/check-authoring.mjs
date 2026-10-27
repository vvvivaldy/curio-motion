import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {stages,loadPlan,validatePlan,sampleFrames,validateReview,checkDelivery,digest} from './lib/authoring.mjs';
const clone=v=>structuredClone(v);
test('both whole-reference plans validate, keep fps and expand dangerous neighbors',async()=>{
  for(const id of ['pink-monkey','amber-robot']) {
    const {plan}=await loadPlan(`authoring/${id}.json`);
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
