import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('qa',{recursive:true});
import {writeFile} from 'node:fs/promises';
import {torsoContour} from '../src/examples/black-cat-chair/design';
import {catPose,catTiming} from '../src/examples/black-cat-chair/motion';
import {diagnoseFrames} from '../src/examples/black-cat-chair/diagnostics';
import {project,type Point2} from '../src/core/spatial';
import {cubicPoint,type CubicContour} from '../src/core/contour';
const near=(a:readonly number[],b:readonly number[],e=1e-6)=>assert(Math.hypot(...a.map((v,i)=>v-b[i]))<=e,`${a} != ${b}`);
const sub=(a:readonly number[],b:readonly number[])=>a.map((v,i)=>v-b[i]);
const rows=diagnoseFrames(Array.from({length:480},(_,i)=>i));assert(rows.every(r=>r.status==='pass'));
let spatial=0,footHolds=0,handHolds=0,minimumFlexion=Math.PI,maximumFlexion=0;
for(let i=0;i<=4800;i++){
 const t=i/240,p=catPose(t),before=i?catPose(t-1/240):null;
 for(const [j,l]of p.legs.entries()){
  minimumFlexion=Math.min(minimumFlexion,l.flexion);maximumFlexion=Math.max(maximumFlexion,l.flexion);
  if(before&&l.planted&&before.legs[j].planted){near(l.sole,before.legs[j].sole);footHolds++;}
 }
 for(const [j,a]of p.arms.entries())if(before&&a.planted&&before.arms[j].planted){near(a.target,before.arms[j].target);handHolds++;}
 for(const [l,lengths] of [...p.legs.map(l=>[l,[36,34]] as const),...p.arms.map(l=>[l,[34,32]] as const)]){
  if(!l.spatial)continue;spatial++;
  const q=l.spatial;
  assert(Math.abs(Math.hypot(...sub(q.root,q.joint))-lengths[0])<1e-7);
  assert(Math.abs(Math.hypot(...sub(q.end,q.joint))-lengths[1])<1e-7);
  for(const k of ['root','joint','end'] as const){const v=project(q[k],q.yaw,0);near([v[0]+p.hips[0],v[1]+p.hips[1]],l[k]);}
 }
}
// Contralateral upper-arm drive, measured from the actual drawn joints.
let armCounterphase=0;
for(let i=1;i<75;i++){
 const p=catPose(i/24),lead=p.legs[0].sole[0]-p.legs[1].sole[0];
 const upper0=p.arms[0].joint[0]-p.arms[0].root[0],upper1=p.arms[1].joint[0]-p.arms[1].root[0];
 assert((upper0-upper1)*lead<=1e-7);armCounterphase++;
}
const pull0=catPose(6),pull1=catPose(6.7-1e-7);
assert(pull1.shoulders[1]<pull0.shoulders[1]-19.9);
for(let i=0;i<2;i++){
 near(pull0.arms[i].pad,pull1.arms[i].pad);
 assert(pull1.arms[i].angles.elbow>pull0.arms[i].angles.elbow);
 assert(!pull1.legs[i].planted&&pull1.legs[i].sole[1]>520);
}
const firstHind=catPose(7.45);assert(firstHind.legs[0].support==='seat');
const sit=catPose(12);assert(sit.pelvisSupport);near(sit.pelvis,sit.pelvisSupport);
assert(sit.legs.every(l=>!l.planted&&l.sole[1]>470));assert(sit.arms.every(a=>a.target[1]>sit.hips[1]+10));
for(const t of [14.6,catTiming.downStart+1e-7,catTiming.rearTouch+.2,19])assert(catPose(t).facing===-1);
const planted=catPose(catTiming.rearTouch+.2),hold=catPose(catTiming.rearTouch+1.1);
for(let i=0;i<2;i++){near(planted.legs[i].sole,hold.legs[i].sole);near(planted.arms[i].groundContact,hold.arms[i].groundContact);assert(planted.arms[i].groundContact[0]<planted.legs[i].sole[0]);}
// Surface correspondence reverses winding for a whole left foot; compare actual
// curve geometry as point sets instead of incorrectly equating old curve indices.
const points=(c:CubicContour)=>c.curves.flatMap((q,i)=>Array.from({length:33},(_,j)=>cubicPoint(i?c.curves[i-1].to:c.start,q,j/32)));
const distance=(a:Point2,b:Point2)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const surface=(p:ReturnType<typeof catPose>)=>[p.head,p.body,...p.legs.flatMap(l=>[l.contour,l.foot]),...p.arms.flatMap(a=>[a.shape.contour,a.paw])];
const bounds=[.3,3.3,3.55,4.6,5.05,5.25,5.25+10/24,5.85,6,6.7,7.45,7.95,8.7,10,11.2,12.4,13.05,13.45,14.6,14.9,catTiming.downStart,catTiming.rearTouch,...[68/560,.55,1.1,1.55,1.7,2.1,2.25,2.4,2.6].map(x=>catTiming.rearTouch+x)];
let maximumBoundaryGap=0;
for(const t of bounds){const a=surface(catPose(t-1e-7)),b=surface(catPose(t+1e-7));for(let i=0;i<a.length;i++){
 const aa=points(a[i]),bb=points(b[i]);for(const [from,to]of [[aa,bb],[bb,aa]])for(const p of from)maximumBoundaryGap=Math.max(maximumBoundaryGap,Math.min(...to.map(q=>distance(p,q))));
}}
assert(maximumBoundaryGap<.001,`Real surface boundary gap ${maximumBoundaryGap}`);
for(const t of [0,.5,7.1,12,14.1,15.5,18,19.99]){const a=catPose(t);catPose(19);catPose(0);assert.deepEqual(catPose(t),a);}
// Exact cubic ordinate extrema, including free paws during the newly guarded
// release. A non-planted flag must not hide a contour dipping through the floor.
const maximumY=(c:CubicContour)=>Math.max(...c.curves.flatMap((q,i)=>{
 const p=i?c.curves[i-1].to:c.start,a=-p[1]+3*q.c1[1]-3*q.c2[1]+q.to[1],b=3*p[1]-6*q.c1[1]+3*q.c2[1],cc=-3*p[1]+3*q.c1[1];
 const aa=3*a,bb=2*b,disc=bb*bb-4*aa*cc;
 const roots=Math.abs(aa)<1e-10?(Math.abs(bb)<1e-10?[]:[-cc/bb]):disc<0?[]:[(-bb+Math.sqrt(disc))/(2*aa),(-bb-Math.sqrt(disc))/(2*aa)];
 return [p[1],q.to[1],...roots.filter(t=>t>0&&t<1).map(t=>cubicPoint(p,q,t)[1])];
}));
let releaseMaximumBelowFloor=-Infinity;
for(let n=0;n<=1500;n++){
 const p=catPose(catTiming.rearTouch+1.55+n/10000);
 p.arms.forEach((a,i)=>{releaseMaximumBelowFloor=Math.max(releaseMaximumBelowFloor,maximumY(a.paw)-(600-8*i));});
}
assert(releaseMaximumBelowFloor<1e-7,`Free release paw below floor ${releaseMaximumBelowFloor}`);

// Regression: a closed finite torso can still self-cross and leave an unfilled
// slit. Test the actual body, including fractional landing/recovery moments.
const bodyPolygon=(c:CubicContour)=>c.curves.flatMap((q,i)=>Array.from({length:48},(_,j)=>cubicPoint(i?c.curves[i-1].to:c.start,q,j/48)));
const cross=(a:Point2,b:Point2)=>a[0]*b[1]-a[1]*b[0];
const delta=(a:Point2,b:Point2):Point2=>[a[0]-b[0],a[1]-b[1]];
function selfCrosses(p:Point2[]){
 for(let i=0;i<p.length;i++)for(let j=i+2;j<p.length;j++){
  if(i===0&&j===p.length-1)continue;
  const a=p[i],b=p[j],u=delta(p[(i+1)%p.length],a),v=delta(p[(j+1)%p.length],b),d=cross(u,v);
  if(Math.abs(d)<1e-9)continue;
  const w=delta(b,a),t=cross(w,v)/d,s=cross(w,u)/d;
  if(t>1e-8&&t<1-1e-8&&s>1e-8&&s<1-1e-8)return true;
 }return false;
}
function insideBody(q:Point2,p:Point2[]){
 let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){
  const a=p[i],b=p[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
 }return yes;
}
let bodyMoments=0;
for(let i=0;i<=1200;i++){
 const t=14.6+i/240,p=catPose(t),poly=bodyPolygon(p.body),d=delta(p.hips,p.shoulders),length=Math.hypot(...d),side:Point2=[d[1]/length,-d[0]/length];
 assert(!selfCrosses(poly),`Actual body self-intersection at${t}`);
 for(let n=0;n<=20;n++)for(const offset of [-4,0,4]){
  const u=n/20,q:Point2=[p.shoulders[0]+u*d[0]+offset*side[0],p.shoulders[1]+u*d[1]+offset*side[1]];
  assert(insideBody(q,poly),`Unfilled central torso at${t}, spine${u}, side${offset}`);
 }bodyMoments++;
}
let torsoBlendBoundaryGap=0;
for(const x of [-34,-22,22,34]){
 const c=(d:number)=>torsoContour([0,0],[d,-Math.sqrt(44*44-d*d)]),a=bodyPolygon(c(x-1e-7)),b=bodyPolygon(c(x+1e-7));
 torsoBlendBoundaryGap=Math.max(torsoBlendBoundaryGap,...a.map((v,i)=>distance(v,b[i])));
}
assert(torsoBlendBoundaryGap<.00001,`Torso blend C0 gap${torsoBlendBoundaryGap}`);

const report={status:'pass',bodyMoments,torsoBlendBoundaryGap,releaseMaximumBelowFloor,poses:4801,diagnosticRows:rows.length,spatialBones:spatial,footHoldComparisons:footHolds,handHoldComparisons:handHolds,armCounterphase,maximumBoundaryGap,minimumHindFlexion:minimumFlexion,maximumHindFlexion:maximumFlexion,firstHindTouch:{seconds:7.45,fractionalFrame:178.8,firstIntegerFrame:179},pull:{start:6,end:6.7,shoulderRise:pull0.shoulders[1]-pull1.shoulders[1],elbowStart:pull0.arms.map(a=>a.angles.elbow),elbowEnd:pull1.arms.map(a=>a.angles.elbow)},note:'Geometry, source purity and supports only; artistic meaning and whole playback require separate observation.'};
await writeFile('qa/black-cat-revision-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
