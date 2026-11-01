import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {humanPose,humanControl,tracks,approachPasses,departurePasses,phases} from '../src/examples/human-chair/motion';
import {humanChairSettings as settings} from '../src/examples/human-chair/settings';
import {buildHuman} from '../src/examples/human-chair/design';
import {diagnoseFrames} from '../src/examples/human-chair/diagnostics';
import {validateContour} from '../src/core/contour';
const boundaries=[...new Set([0,...Object.values(phases),...tracks.flatMap(t=>t.flatMap(s=>[s.start,s.end])),(phases.turnStart+phases.turnEnd)/2,5.12,5.65,6.05,8.25,9.02])].sort((a,b)=>a-b);
const geometry=(t:number)=>{const p=humanPose(t);return[p.hips,p.headFrame.origin,p.body.start,...p.body.curves.flatMap(c=>[c.c1,c.c2,c.to]),...p.legs.flatMap(l=>[l.root,l.knee,l.ankle,l.sole]),...p.arms.flatMap(a=>[a.root,a.joint,a.wrist])].flat();};
const trunk=(t:number)=>{const p=humanPose(t);return[p.hips,p.bodyPoint(0,112),p.bodyPoint(22,94),p.headFrame.origin].flat();};
let maximumBoundaryDelta=0,maximumTrunkVelocityGap=0,maximumFrameDelta=0;
for(const t of boundaries){
 const h=1e-6,a=geometry(Math.max(0,t-h)),b=geometry(t+h),delta=Math.max(...a.map((v,i)=>Math.abs(v-b[i])));maximumBoundaryDelta=Math.max(maximumBoundaryDelta,delta);assert(delta<.01,`Position discontinuity at ${t}: ${delta}`);
 const e=1e-4,x=trunk(Math.max(0,t-e)),y=trunk(t),z=trunk(t+e),gap=Math.max(...x.map((v,i)=>Math.abs((y[i]-v)/e-(z[i]-y[i])/e)));maximumTrunkVelocityGap=Math.max(maximumTrunkVelocityGap,gap);assert(gap<.5,`Trunk/view velocity cusp at ${t}: ${gap}`);
}
for(let f=0;f<settings.durationInFrames*8;f++){
 const t=f/(settings.fps*8),p=humanPose(t),requested=humanControl(t);assert(p.legs.some(l=>l.planted),'Unsupported flight');
 assert.equal(p.depthOrder.near,p.facing>0?1:0,'Wrong anatomical foreground for whole view');
 if(p.facing===1){assert(p.arms[1].root[0]<p.arms[0].root[0]);assert(p.legs[1].root[1]>p.legs[0].root[1]);}
 if(p.facing===-1){assert(p.arms[0].root[0]>p.arms[1].root[0]);assert(p.legs[0].root[1]>p.legs[1].root[1]);}assert.deepEqual(p.hips,requested.hips,'Reactive root correction returned');
 for(const c of [p.body,p.head,p.face.hair,...p.legs.flatMap(l=>[l.foot,l.shape.contour]),...p.arms.flatMap(a=>[a.hand,a.shape.contour])])validateContour(c);
 if(t>=phases.turnEnd&&t<=phases.departureStart){assert.deepEqual(p.feet,[[720,600],[704,594]]);assert.deepEqual(p.lift,[0,0]);}
 if(p.seat)assert(Math.abs(p.hips[1]+12-500)<1e-9);
}
for(let f=1;f<settings.durationInFrames;f++){const a=geometry((f-1)/settings.fps),b=geometry(f/settings.fps);maximumFrameDelta=Math.max(maximumFrameDelta,...a.map((v,i)=>Math.abs(v-b[i])));}
assert([...approachPasses,...departurePasses].every(p=>p.passed),'Swing failed to pass stationary opposite foot');
const hold=(t:number)=>{const p=humanPose(t);return{hips:p.hips,lean:p.lean,body:p.body,head:p.head,arms:p.arms.map(a=>[a.root,a.joint,a.wrist]),legs:p.legs};};
assert.deepEqual(hold(6.55),hold(6.90),'Seated hold drifts');
assert.throws(()=>buildHuman({...humanControl(0),hips:[270,390]}),RangeError,'Invalid authored root must reject instead of silently lowering the body');
assert.throws(()=>buildHuman({...humanControl(0),feet:[[700,600],[257,594]]}),RangeError);
// Constant authored cruise, not a claim that all real people must be symmetric.
let checkedCruiseSteps=0;
for(const track of tracks)for(let i=1;i<track.length;i++){
 const a=track[i-1],b=track[i],approach=a.end>.8&&b.end+.5<phases.approachEnd-.45,departure=a.end>phases.departureStart+.8&&b.end+.5<phases.departureEnd-.45;
 if(!(approach||departure))continue;
 const bodyAdvance=humanControl(b.end).hips[0]-humanControl(a.end).hips[0],footAdvance=b.to[0]-b.from[0];assert(Math.abs(bodyAdvance-footAdvance)<1e-7,'Accidental short step during constant authored cruise');checkedCruiseSteps++;
}
assert(checkedCruiseSteps>=6,'Missing regular cruise coverage');
const diagnostics=diagnoseFrames(Array.from({length:settings.durationInFrames},(_,i)=>i));assert(diagnostics.every(d=>d.status==='pass'));
await mkdir('qa/human-chair-revision-v3',{recursive:true});await writeFile('qa/human-chair-revision-v3/geometry-check.json',JSON.stringify({frames:settings.durationInFrames,fractionalSamples:settings.durationInFrames*8,boundaries,maximumBoundaryDelta,maximumTrunkVelocityGap,maximumFrameDelta,diagnosticRows:diagnostics.length,checkedCruiseSteps,failures:[],tracks,limitations:['Geometry and continuity checks cannot approve naturalness, face readability or exact cadence.','Owner rejectedV1 despite older checks; new acceptance requires actual encoded before/after and owner feedback.']},null,2)+'\n');
console.log(`PASS HumanChairV3 geometry only: ${settings.durationInFrames*8} fractional poses, C1 trunk/view boundaries, authored root unchanged, fixed contacts and finite hold; visual acceptance remains separate.`);
