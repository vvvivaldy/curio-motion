import assert from 'node:assert/strict';
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { robotPose, canAt, homeCan, feet, benchY, soil, armLimits } from '../src/examples/amber-robot/motion';
import { canAnchors, gripperContact, robotModel, gripperShapes } from '../src/examples/amber-robot/model';
import { localPoint, type Point2 } from '../src/core/spatial';
import { evaluateFrame } from '../src/core/time';
import { amberRobotSettings } from '../src/examples/amber-robot/settings';
import { cubicPoint } from '../src/core/contour';
import { exampleChoice } from '../src/example-choice';
const distance=(a:number[],b:number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
let maxBone=0,maxGrip=0,maxMotionStep=0,maxElbowStep=0,maxWristBend=0,minFlexion=Infinity;
let previous:ReturnType<typeof robotPose>|undefined;
for(let n=0;n<600;n++) {
  const t=n/60,q=robotPose(t);
  assert(q.support.weights.every(w=>w>0)&&Math.abs(q.support.weights.reduce((a,b)=>a+b)-1)<1e-10);
  for(const [i,leg] of q.legs.entries()) {
    assert.deepEqual(leg.sole,feet[i]);
    assert.equal(leg.ankle[1]+12,leg.sole[1]);
    maxBone=Math.max(maxBone,Math.abs(distance(leg.hip,leg.knee)-61),Math.abs(distance(leg.knee,leg.ankle)-62));
  }
  for(const [i,arm] of q.arms.entries())maxBone=Math.max(maxBone,
    Math.abs(distance(arm.shoulder,arm.elbow)-(i===0?62:64)),Math.abs(distance(arm.elbow,arm.wrist)-(i===0?65:66)));
  if(t>=1.85&&t<=7.2)maxGrip=Math.max(maxGrip,distance(localPoint(gripperContact,q.arms[1].frame),q.grip));
  if(t<2.1||t>=7.1) {
    assert.deepEqual(q.can,homeCan);
    assert(Math.abs(localPoint(canAnchors.base,q.can)[1]-benchY)<1e-9);
  }
  for(const drop of q.water) {
    assert(drop.point.every(Number.isFinite)&&drop.alpha>=0&&drop.alpha<=1);
    if(drop.impact)assert(drop.point[1]===soil[1]&&Math.abs(drop.point[0]-soil[0])<=5);
  }
  if(previous) {
    maxMotionStep=Math.max(maxMotionStep,distance(q.arms[1].wrist,previous.arms[1].wrist));
    maxElbowStep=Math.max(maxElbowStep,distance(q.arms[1].elbow,previous.arms[1].elbow));
  }
  maxWristBend=Math.max(maxWristBend,Math.abs(q.nearLimb.wristBend));
  minFlexion=Math.min(minFlexion,q.nearLimb.flexion);
  const arm=q.arms[1],dx=arm.wrist[0]-arm.shoulder[0],dy=arm.wrist[1]-arm.shoulder[1];
  assert(dx*(arm.elbow[1]-arm.shoulder[1])-dy*(arm.elbow[0]-arm.shoulder[0])>0,'stable elbow branch');
  previous=q;
}
assert(maxBone<1e-8&&maxGrip<1e-8&&maxMotionStep<8,JSON.stringify({maxBone,maxGrip,maxMotionStep}));
assert(maxElbowStep<4&&maxWristBend<=armLimits.wristRange[1]&&minFlexion>=armLimits.minFlexion);
assert(distance(robotPose(3.95).grip,robotPose(4.8).grip)<1e-9,'pour pivots around held handle');
for(const t of [.65,1.45,1.5,1.85,2.1,2.95,3.35,3.45,3.95,4.25,4.7,4.85,5.35,5.65,6.1,6.25,6.65,7.1,7.2,7.5,8.25,8.45,8.7,9.05]) {
  const a=robotPose(t-1e-6),b=robotPose(t+1e-6);
  assert(distance(a.arms[1].wrist,b.arms[1].wrist)<.002&&distance(a.can.origin,b.can.origin)<.002);
}
assert(robotPose(2.05).close===1&&canAt(2.05).origin[1]===homeCan.origin[1],'grip before lift');
assert(robotPose(7.15).close===1&&canAt(7.15).origin[1]===homeCan.origin[1],'land before release');
for(const [a,b] of [[0,.2],[9.2,9.8]]) {
  assert.deepEqual(robotPose(a).can,robotPose(b).can);
  assert.deepEqual(robotPose(a).arms,robotPose(b).arms);
}
for(const t of [3.9,4.2,5.35,5.6])assert(robotPose(t).water.some(d=>!d.impact));
assert(!robotPose(4.95).water.length&&!robotPose(6.3).water.length,'finite pours with a quiet gap');
for(const view of [0,.2,.5,.8,1])for(const contour of [robotModel(view).head,robotModel(view).torso,...gripperShapes(view)]) {
  const points=contour.curves.flatMap((c,i,curves)=>Array.from({length:12},(_,n)=>cubicPoint(i===0?contour.start:curves[i-1].to,c,n/12)));
  const area=points.reduce((s,p,i)=>{const q=points[(i+1)%points.length];return s+p[0]*q[1]-q[0]*p[1]},0)/2;
  assert(Math.abs(area)>70,'second character contour must not collapse');
}
for(const f of [299,0,213,44,120,0])assert.equal(evaluateFrame(amberRobotSettings,robotPose,f).time,f/30);
assert.throws(()=>evaluateFrame(amberRobotSettings,robotPose,300));
assert.equal(exampleChoice(''),'pink-monkey');assert.equal(exampleChoice('?example=amber-robot'),'amber-robot');assert.throws(()=>exampleChoice('?example=unknown'));
for(const file of readdirSync('src/examples/amber-robot').filter(n=>n.endsWith('.ts')))assert(!readFileSync(`src/examples/amber-robot/${file}`,'utf8').includes('pink-monkey'),'independent example must not import monkey code');
mkdirSync('qa/reuse',{recursive:true});
writeFileSync('qa/reuse/constraints.json',JSON.stringify({samples:600,maxBone,maxGrip,maxHalfFrameWristStep:maxMotionStep,maxHalfFrameElbowStep:maxElbowStep,
  maxWristBendDegrees:maxWristBend*180/Math.PI,minElbowFlexionDegrees:minFlexion*180/Math.PI,
  feet:'fixed',gripBeforeLift:true,landBeforeRelease:true,finitePours:true},null,2));
console.log('PASS second-character dimensions, IK, fixed soles, prop anchors, grip/release order, finite water and deliberate holds');
