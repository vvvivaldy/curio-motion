import assert from 'node:assert/strict';
import {spatialStoryPose,spatialStoryTimes} from '../src/examples/cat-picture-story/spatial-motion';
// Regression: continuous head.origin hid an abrupt -.45rad rotation of the actual
// shell at takeoff. Check drawn vertices; do not approve the picture from this scalar.
const epsilon=1e-8,time=spatialStoryTimes.takeoff;
const before=spatialStoryPose(time-epsilon).cat,after=spatialStoryPose(time+epsilon).cat;
const right=new Map(after.triangles.map(t=>[t.id,t]));let maximumGap=0,checked=0;
for(const triangle of before.triangles.filter(t=>t.owner.startsWith('head/'))){
 const next=right.get(triangle.id);assert.ok(next,'Head shell correspondence must exist through takeoff');
 triangle.vertices.forEach((point,i)=>{maximumGap=Math.max(maximumGap,Math.hypot(...point.map((v,j)=>v-next.vertices[i][j])));checked++;});
}
assert.ok(checked>0,'Inspect actual drawn head shell');
assert.ok(maximumGap<.001,`Head shell jumps ${maximumGap} world units at takeoff despite any continuous root`);
console.log('PASS actual head-shell vertices continuous across takeoff; orientation regression only, not visual acceptance');
