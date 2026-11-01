import assert from 'node:assert/strict';
import {boarPose,boarTracks,biteWindows,cartHandle,foodGrip} from '../src/examples/serious-boar/motion';
import {localPoint,type Point2} from '../src/core/spatial';
import {solvePlanarLimb} from '../src/core/kinematics';
const distance=(a:Point2,b:Point2)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
let maxGrip=0,maxBone=0;
for(let n=0;n<2304;n++){
 const t=n/96,q=boarPose(t);
 assert(q.root.every(Number.isFinite));assert(q.support.weights.some(w=>w>0));
 maxBone=Math.max(maxBone,Math.abs(distance(q.shoulder,q.elbow)-105),Math.abs(distance(q.elbow,q.hand)-109));
 if(!q.seated){
  assert.equal(q.happiness,0);
  for(const [i,foot] of q.feet.entries()){
   if(!foot.planted)assert.equal(foot.load,0);
   const hip:Point2=[q.root[0]+(i?32:-35),q.root[1]-126],ankle:Point2=[foot.position[0],foot.position[1]-13];
   solvePlanarLimb(hip,ankle,77,82,{bendSide:-1,endAngle:0,wristRange:[-Math.PI,Math.PI],minFlexion:0});
   const active=boarTracks[i][foot.index];
   if(foot.planted)assert.deepEqual(foot.position,t<=active.start?active.from:active.to);
  }
  if(t>=9.65)maxGrip=Math.max(maxGrip,distance(q.hand,localPoint(cartHandle,{origin:q.cart,angle:0,scale:1})));
 }else{
  assert(distance(localPoint(foodGrip,q.food),q.hand)<1e-8);
  if(q.holdingFood)assert(q.happiness>.99);
 }
}
assert(maxGrip<1e-8);assert(maxBone<1e-8);
for(const [,peak,end] of biteWindows){
 const q=boarPose((peak+end)/2);
 assert(distance(q.hand,[q.mouth[0]-12,q.mouth[1]+1])<1e-8,'food hand must reach the drawn mouth');
}
const a=boarPose(18.1),b=boarPose(19.1);assert.deepEqual(a.root,b.root);assert.deepEqual(a.hand,b.hand);assert.equal(a.chew,0);assert.equal(b.chew,0);
console.log('PASS independent boar trial: planted hooves, reachable limbs, cart grip, bag/food/mouth anchors and satisfied holds');
