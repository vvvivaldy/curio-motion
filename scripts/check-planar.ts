import assert from 'node:assert/strict';
import { solvePlanarLimb, relativeAngle } from '../src/core/kinematics';
const limits={bendSide:1,endAngle:0,wristRange:[-Math.PI,Math.PI],minFlexion:.1} as const;
// Cross the old pole singularity in either direction, including arbitrary translated/rotated layouts.
for(const side of [-1,1] as const)for(const angle of [0,.7,2.9]) {
  const root:[number,number]=[23,-17];let previous:number[]|undefined;
  for(let n=-100;n<=100;n++) {
    const x=80,y=n/100,c=Math.cos(angle),s=Math.sin(angle);
    const target:[number,number]=[root[0]+x*c-y*s,root[1]+x*s+y*c];
    const q=solvePlanarLimb(root,target,60,50,{...limits,bendSide:side,endAngle:angle});
    assert(Math.abs(Math.hypot(q.joint[0]-root[0],q.joint[1]-root[1])-60)<1e-9);
    assert(Math.abs(Math.hypot(q.joint[0]-target[0],q.joint[1]-target[1])-50)<1e-9);
    const cross=(target[0]-root[0])*(q.joint[1]-root[1])-(target[1]-root[1])*(q.joint[0]-root[0]);
    assert(cross*side>0);
    if(previous)assert(Math.hypot(q.joint[0]-previous[0],q.joint[1]-previous[1])<.02);
    previous=q.joint;
  }
}
assert(Math.abs(relativeAngle(-Math.PI+.1,Math.PI-.1)-.2)<1e-9);
assert.throws(()=>solvePlanarLimb([0,0],[80,0],60,50,{...limits,wristRange:[-.01,.01]}),/joint limits/);
assert.throws(()=>solvePlanarLimb([0,0],[109.99,0],60,50,{...limits,minFlexion:.2}),/joint limits/);
for(const target of [[111,0],[0,0],[NaN,0]] as [number,number][])
  assert.throws(()=>solvePlanarLimb([0,0],target,60,50,limits));
console.log('PASS planar branch continuity, rigid lengths, winding and wrist/extension rejection');
