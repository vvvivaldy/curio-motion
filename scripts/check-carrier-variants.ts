import {mkdir,writeFile} from 'node:fs/promises';
import {sourceSnapshot} from './lib/authoring.mjs';
import {carrierVariants} from '../src/examples/ivory-carrier/variants';
import {createCarrierModel,handling} from '../src/examples/ivory-carrier/motion';
import {inspectCarrierPose} from '../src/examples/ivory-carrier/diagnostics';
import {inspectFootPasses} from '../src/core/gait';
import {carrierTiming,ivoryCarrierSettings} from '../src/examples/ivory-carrier/settings';
const frames=Array.from({length:ivoryCarrierSettings.durationInFrames},(_,f)=>f);
const reportPath='qa/carrier-variants-check.json';
const sourceBefore=await sourceSnapshot(),reports=[];
for(const v of carrierVariants){
 const failures:{relation:string;frame:number;status:'fail';message:string}[]=[];
 let maximum=0,maximumFrame=0,maximumBoneError=0,maximumEventJump=0,samples=0;
 try{
  const model=createCarrierModel(v.design),s=v.design.heightScale,passes=inspectFootPasses(model.tracks,[1,0],.04);
  const events=[0,.05,.4,.55,.85,1.05,1.67,1.75,2.17,2.73,2.8,3,3.45,4.2,4.4,4.6,7,11.6,12,13.45,13.95,14,14.1,14.2,14.25,14.7,14.85,
   ...Object.values(handling).flat(),...model.tracks.flatMap(track=>track.flatMap(step=>[step.start-.04,step.start,step.end,step.end+.04]))];
  const lastTime=carrierTiming.actionTime((ivoryCarrierSettings.durationInFrames-1)/ivoryCarrierSettings.fps);
  const sampleStep=carrierTiming.actionTime(1/ivoryCarrierSettings.fps)/8;
  const times=[...new Set([...Array.from({length:Math.round(lastTime/sampleStep)+1},(_,i)=>i*sampleStep),...events.flatMap(t=>[t-1e-7,t,t+1e-7])])].filter(t=>t>=0&&t<=lastTime).sort((a,b)=>a-b);
  for(const time of times){
   samples++;const frame=time/sampleStep/8;
   try{
    const p=model.pose(time);
    failures.push(...inspectCarrierPose(p,frame,passes).filter(r=>r.status!=='pass').map(r=>({...r,status:'fail' as const})));
    for(const [limbs,lengths] of [[p.legs,[92*s,94*s]],[p.arms,[88*s,90*s]]] as const)for(const limb of limbs){
     maximumBoneError=Math.max(maximumBoneError,Math.abs(Math.hypot(limb.joint[0]-limb.root[0],limb.joint[1]-limb.root[1])-lengths[0]),Math.abs(Math.hypot(limb.end[0]-limb.joint[0],limb.end[1]-limb.joint[1])-lengths[1]));
    }
   }catch(e){failures.push({relation:'pose-validity',frame,status:'fail',message:(e as Error).message});}
  }
  const output=frames.map(f=>model.pose(carrierTiming.actionTime(f/ivoryCarrierSettings.fps)));
  for(let f=1;f<output.length;f++)for(const side of [0,1]){
   const a=output[f-1],b=output[f];
   if(a.feet[side].planted&&b.feet[side].planted&&JSON.stringify(a.feet[side].position)!==JSON.stringify(b.feet[side].position))failures.push({relation:'plant-continuity',frame:f,status:'fail',message:'World-fixed planted contact moved between output frames'});
   for(const joint of ['root','joint','end'] as const){const d=Math.hypot(...a.arms[side][joint].map((x,i)=>x-b.arms[side][joint][i]));if(d>maximum){maximum=d;maximumFrame=f;}}
  }
  for(const t of events.filter(t=>t>1e-7&&t<lastTime-1e-7)){
   const a=model.pose(t-1e-7),b=model.pose(t+1e-7);
   for(const side of [0,1])for(const joint of ['root','joint','end'] as const)maximumEventJump=Math.max(maximumEventJump,Math.hypot(...a.arms[side][joint].map((x,i)=>x-b.arms[side][joint][i])));
  }
  for(const t of [0,4.92,6.7,14.87]){const a=model.pose(t),b=model.pose(t+(t>14?.02:.05));if(JSON.stringify(a.arms)!==JSON.stringify(b.arms)||JSON.stringify(a.box)!==JSON.stringify(b.box))failures.push({relation:'deliberate-hold',frame:t/sampleStep/8,status:'fail',message:'Declared approach/grip/raised/rest hold moved'});}
  if(maximumBoneError>1e-6)failures.push({relation:'fixed-bone-lengths',frame:0,status:'fail',message:`Maximum actual bone error ${maximumBoneError}px exceeds1e-6`});
  if(maximumEventJump>=.001)failures.push({relation:'event-continuity',frame:0,status:'fail',message:`Event±1e-7 arm jump ${maximumEventJump}px exceeds.001`});
 }catch(e){failures.push({relation:'variant-evaluation',frame:0,status:'fail',message:(e as Error).message});}
 const row={example:v.key,design:v.design,samples,failures,maximumBoneError,maximumEventJump,maximumArmDisplacement:{pixels:maximum,frame:maximumFrame,limitExclusive:20},status:failures.length||maximum>=20?'fail':'pass'};
 reports.push(row);
 console.log(JSON.stringify({...row,failures:failures.slice(0,12),totalFailures:failures.length,completeEvidence:reportPath}));
}
const sourceAfter=await sourceSnapshot(),sourceStable=sourceBefore.sha256===sourceAfter.sha256;
await mkdir('qa',{recursive:true});await writeFile(reportPath,JSON.stringify({sourceBefore:sourceBefore.sha256,sourceAfter:sourceAfter.sha256,sourceStable,scope:'Exactly8 declared designs; dense real-pose geometry, events and actual output-frame arm displacement. No visual acceptance.',reports},null,2));
console.log('Finite parameter diagnostics; appearance and complete normal/slow movie acceptance remain independent. All failures are retained in',reportPath);
if(!sourceStable||reports.some(r=>r.status!=='pass'))process.exitCode=1;
