import {carrierTiming,ivoryCarrierSettings} from '../src/examples/ivory-carrier/settings';
import assert from 'node:assert/strict';
import {sampleHandling,balancePayload,type HandlingSchedule} from '../src/core/handling';
import {carrierPose} from '../src/examples/ivory-carrier/motion';
import {diagnoseFrames,inspectCarrierPose} from '../src/examples/ivory-carrier/diagnostics';
const schedule:HandlingSchedule={grip:[1,2],load:[3,4],lift:[5,6],place:[8,9],unload:[10,11],release:[12,13]};
for(let t=-1;t<=15;t+=.03125){
 const p=sampleHandling(t,schedule);
 assert(p.grip>=0&&p.grip<=1&&p.handLoad>=0&&p.handLoad<=1);
 assert(Math.abs(p.surfaceLoad+p.handLoad-1)<1e-12);
 if(p.handLoad>0)assert.equal(p.grip,1,'loaded object cannot be released');
 if(t>6&&t<8)assert.equal(p.handLoad,1,'airborne payload fully assigned to hands');
}
for(const key of ['grip','load','lift','place','unload','release'] as const){
 assert.throws(()=>sampleHandling(0,{...schedule,[key]:[9,8]}));
 for(const t of schedule[key]){
  const a=sampleHandling(t-1e-6,schedule),b=sampleHandling(t+1e-6,schedule);
  for(const k of ['grip','handLoad','lifted','placed'] as const)assert(Math.abs(a[k]-b[k])<1e-8);
 }
}
assert.throws(()=>sampleHandling(0,{...schedule,release:[8.5,9.5]}));
assert.throws(()=>balancePayload(0,1,-1));
assert.throws(()=>balancePayload(Infinity,1,1));
for(const [support,payload,ratio] of [[0,100,.5],[-40,-180,.2],[600,550,2],[0,0,0]]){
 const body=balancePayload(support,payload,ratio);
 assert(Math.abs((body+ratio*payload)/(1+ratio)-support)<1e-9);
}
const frames=Array.from({length:ivoryCarrierSettings.durationInFrames},(_,i)=>i),diagnostics=diagnoseFrames(frames);
assert.deepEqual(diagnostics.filter(d=>d.status!=='pass'),[]);
let maximumFrameTravel=0;
for(let f=1;f<ivoryCarrierSettings.durationInFrames;f++){
 const a=carrierPose(carrierTiming.actionTime((f-1)/24)),b=carrierPose(carrierTiming.actionTime(f/24));
 for(const side of [0,1]){
  if(a.feet[side].planted&&b.feet[side].planted)assert.deepEqual(a.feet[side].position,b.feet[side].position,'plant slides');
  for(const joint of ['root','joint','end'] as const){
   const dist=Math.hypot(...a.arms[side][joint].map((v,i)=>v-b.arms[side][joint][i]));
   maximumFrameTravel=Math.max(maximumFrameTravel,dist);
   assert(dist<20,`arm discontinuity f${f}: ${dist}`);
  }
 }
}
for(const t of [0,4.92,6.7,11.7,14.87]){
 const a=carrierPose(t),b=carrierPose(t+(t>14?.02:.05));
 assert.deepEqual(a.arms,b.arms,'intentional hold moves');
 assert.deepEqual(a.box,b.box,'box moves during hold');
}
console.log('PASS handling order/conservation/continuity/rejections; payload balance; current carrier poses, planted feet and arm continuity',maximumFrameTravel);
// Optional smoothing must join both contour sides with one tangent and preserve joints.
import {limbShape,rigidLimbShape} from '../src/core/limb';
import {checkClearance} from '../src/core/relations';
import {validateContour} from '../src/core/contour';
for(const joint of [[30,35],[40,-20],[-30,30]] as [number,number][]){
 const legacy=limbShape([0,0],joint,[70,60],[15,12,10]);
 assert.deepEqual(legacy,limbShape([0,0],joint,[70,60],[15,12,10],{jointSmoothing:0}));
 const rounded=limbShape([0,0],joint,[70,60],[15,12,10],{jointSmoothing:1});validateContour(rounded.contour);
 const a=rounded.contour.curves[0],b=rounded.contour.curves[1];
 const u=a.to.map((v,i)=>v-a.c2[i]),v=b.c1.map((v,i)=>v-a.to[i]);
 assert(Math.abs(u[0]*v[1]-u[1]*v[0])<1e-8,'joint tangents mismatch');
 assert(u[0]*v[0]+u[1]*v[1]>0,'joint tangent reversed');
 assert.deepEqual(rounded.joint,joint);
}
assert.throws(()=>limbShape([0,0],[30,20],[60,50],[10,10,10],{jointSmoothing:2}));

import {retimeTimeline} from '../src/core/time';
const fast=retimeTimeline({fps:24,durationInFrames:432});
assert.deepEqual(fast.timeline,{fps:24,durationInFrames:288});
assert.equal(fast.actionTime(2),3);assert.equal(fast.actionTime(1000),431/24);
assert.equal(retimeTimeline({fps:30,durationInFrames:301},2).timeline.durationInFrames,151);
for(const factor of [0,-1,NaN,Infinity])assert.throws(()=>retimeTimeline({fps:24,durationInFrames:432},factor));
assert.throws(()=>fast.actionTime(-1));

import {inspectFootPasses} from '../src/core/gait';
import {createCarrierModel} from '../src/examples/ivory-carrier/motion';
assert(inspectFootPasses(createCarrierModel().tracks,[1,0],.04).every(p=>p.passed),'regular carrier swing must pass the fixed opposite foot');


import {cubicPoint} from '../src/core/contour';
// Base authored heavy-carry goal: inspect actual rendered surfaces, not a proxy COM.
for(let frame=107;frame<=185;frame++){
 const p=carrierPose(carrierTiming.actionTime(frame/24)),c=p.body.contour;
 const bodyPoints=c.curves.flatMap((curve,i,curves)=>Array.from({length:24},(_,j)=>cubicPoint(i?curves[i-1].to:c.start,curve,j/24)));
 const gap=Math.min(...Object.values(p.boxFaces).flat().map(v=>v[0]))-Math.max(...bodyPoints.map(v=>v[0]));
 assert(gap>2&&gap<p.boxShape.width*.75,`base cargo no longer close to the actual torso f${frame}: ${gap}`);
 assert(p.shoulders[0]<p.hips[0],'base heavy-carry counterpose must be visible in the drawn torso');
}
console.log('PASS base close-carry contour gap and visible counterpose preflight; artistic weight still requires film review');

// Actual near-surface coordinates from the visually rejected Q-small control.
// Its knee-point clearance passes while the foreground shin is crossed.
const validLowPickup=createCarrierModel({heightScale:1,boxScale:.8,tableHeight:152}).pose(4.9);
const crossedArm={...validLowPickup.arms[0],...rigidLimbShape([477.7,459.27430523570945],[462.70127792193034,545.9866938317159],[552,557.2],12),flexion:1.6171556268119498};
const crossedLeg={...validLowPickup.legs[0],...rigidLimbShape([387.7,510.8],[479.6900217945965,512.1549502683407],[465,605],14)};
assert.equal(checkClearance('knee-point',crossedArm.lower,[crossedLeg.joint,crossedLeg.joint],16).status,'pass');
const rejectedControl={...validLowPickup,arms:[crossedArm,validLowPickup.arms[1]],legs:[crossedLeg,validLowPickup.legs[1]],crouch:1};
const rejection=inspectCarrierPose(rejectedControl,78.4,inspectFootPasses(createCarrierModel({heightScale:1,boxScale:.8,tableHeight:152}).tracks,[1,0],.04));
assert.equal(rejection.find(r=>r.relation==='forearm-shin-clearance')?.status,'fail');
console.log('PASS confirmed knee-point false positive rejected by actual foreground forearm/shin inspection');
