import assert from 'node:assert/strict';
import './check-delivery-data';
import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {raccoonPose,paperPoint,runPlans,paperGrip,counterTop,bottomGrip,topGrip,farRegrip,armSector} from '../src/examples/raccoon-courier/motion';
import {infographicPose,chart} from '../src/examples/delivery-infographic/motion';
import {deliveryData} from '../src/examples/delivery-infographic/data';
const d=(a:readonly number[],b:readonly number[])=>Math.hypot(...a.map((x,i)=>x-b[i]));
let maxLengthError=0,maxHandJump=0,maxSoleDrift=0;let old:ReturnType<typeof raccoonPose>|undefined;
for(let n=0;n<=1536;n++){
 const t=n/96,q=raccoonPose(t);
 for(const arm of q.arms)maxLengthError=Math.max(maxLengthError,Math.abs(d(arm.shoulder,arm.elbow)-77),Math.abs(d(arm.elbow,arm.hand)-74));
 for(const leg of q.legs)maxLengthError=Math.max(maxLengthError,Math.abs(d(leg.hip,leg.knee)-62),Math.abs(d(leg.knee,leg.ankle)-58));
 const nearAnchor=t>=4.4&&t<=5.75?paperGrip:t>=6.1&&t<=7.45?bottomGrip:t>=7.8&&t<=10.5?topGrip:null;
 if(nearAnchor)assert(d(q.arms[1].hand,paperPoint(q.envelope,...nearAnchor))<1e-7,`primary grip at ${t}`);
 if(t>=4.65&&t<=10.5)assert(q.gripping||q.supporting,`paper has no holder at ${t}`);
 for(const a of q.arms){
  const theta=Math.atan2(a.elbow[1]-a.shoulder[1],a.elbow[0]-a.shoulder[0]),relative=Math.atan2(Math.sin(theta-q.bodyDownAngle),Math.cos(theta-q.bodyDownAngle));
  assert(relative>=armSector.min&&relative<=armSector.max,`wrong shoulder direction at ${t}`);
  if(t>=3.45&&t<=11.05)assert(a.elbow[1]>a.shoulder[1]+5,'action elbow rises above shoulder');
  assert(a.flexion>=.1&&a.flexion<=2.72&&Math.abs(a.wristBend)<=1.45);
 }
 if(t>=5.1&&t<=6.15)assert(d(q.arms[0].hand,paperPoint(q.envelope,42,15))<1e-7,`first support at ${t}`);
 if(t>=7.4&&t<=8)assert(d(q.arms[0].hand,paperPoint(q.envelope,...farRegrip))<1e-7,`regrip support at ${t}`);
 if(t>=4.1&&t<=4.15)assert(d(q.arms[1].hand,[691,427])<1e-7);
 if(old){for(let i=0;i<2;i++){
  maxHandJump=Math.max(maxHandJump,d(q.arms[i].hand,old.arms[i].hand));
  const a=q.run.feet[i],b=old.run.feet[i];if(a.planted&&b.planted&&a.stepStart===b.stepStart)maxSoleDrift=Math.max(maxSoleDrift,d(q.legs[i].sole,old.legs[i].sole));
 }}old=q;
}
// The complete resting sheet lies on the same polygon consumed by illustration.ts.
const paperCorners=(time:number)=>[-1,1].flatMap(x=>[-1,1].map(y=>paperPoint(raccoonPose(time).envelope,x*56,y*34)));
for(const time of [0,4.1,4.4,4.65]){
 assert.deepEqual(paperCorners(time),paperCorners(0),'sheet must hold on the table until lift');
 for(const point of paperCorners(time))for(let i=0;i<counterTop.length;i++){
  const a=counterTop[i],b=counterTop[(i+1)%counterTop.length];
  assert((b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0])>=0,'paper outside actual counter top');
 }
}
for(const t of [3.45,3.65,4.1,4.15,4.4,4.65,4.85,5.1,5.35,5.75,5.9,6.1,6.15,6.35,6.4,7,7.15,7.4,7.45,7.6,7.8,8,8.2,8.8,8.85,9.28,9.5,10.3,10.5,10.65,11.05,12.1,14.75]){
 const a=raccoonPose(t-1e-7),b=raccoonPose(t+1e-7);assert(d([a.bodyX,a.rootY],[b.bodyX,b.rootY])<.001);for(let i=0;i<2;i++)assert(d(a.arms[i].hand,b.arms[i].hand)<.001,`arm boundary ${t}`);
}
const release=raccoonPose(10.5);assert(Math.min(...[-1,1].flatMap(x=>[-1,1].map(y=>paperPoint(release.envelope,x*56,y*34)[1])))>release.bag.y);
assert(raccoonPose(6).envelope.turn===0&&raccoonPose(7.5).envelope.turn===Math.PI);
assert(maxLengthError<1e-7&&maxSoleDrift<1e-7&&maxHandJump<25);
const expectedValues=deliveryData.categories.map(c=>c.value),expectedTotal=expectedValues.reduce((sum,value)=>sum+value,0);
assert(deliveryData.total===expectedTotal&&expectedTotal>0&&deliveryData.categories.length===3);
for(const category of deliveryData.categories)assert(Math.abs(category.sharePercent-category.value/expectedTotal*100)<1e-9);
for(let f=0;f<288;f++){const q=infographicPose(f/24);q.bars.forEach((b,i)=>{assert(b.height>=0&&b.height<=300);assert(Math.abs(b.height-expectedValues[i]*chart.pixelsPerDelivery*q.growth)<1e-9);assert(b.x===chart.centers[i]);});if(f>=216){assert(q.growth===1&&q.totals===1&&q.accent===0);assert.deepEqual(q.bars.map(b=>b.valueShown),expectedValues);}}
mkdirSync('qa/stage6',{recursive:true});const result={samples:1537,maxLengthError,maxSoleDrift,maxHandJump,primaryGrip:'pickup, bottom pivot, top carry with explicit supported regrips',supportGrip:'5.1–6.15 and 7.4–8 seconds exact',releaseBelowBagLip:true,tableTouch:'4.1–4.15 seconds exact',runPlans:Object.fromEntries(Object.entries(runPlans).map(([id,p])=>[id,{count:p.count,brakingStart:p.brakingStart,end:p.end}])),infographic:{scale:chart.pixelsPerDelivery,heights:expectedValues.map(value=>value*chart.pixelsPerDelivery),shares:deliveryData.categories.map(c=>c.sharePercent),total:expectedTotal,finalHoldFrom:9},pass:true};writeFileSync('qa/stage6/numeric.json',JSON.stringify(result,null,2));console.log(result);

// Actual bad poses from the preceding official film must fail the anatomical sector.
const badArms=JSON.parse(readFileSync('scripts/fixtures/raccoon-revised-bad-arms.json','utf8')) as {frame:number;side:number;shoulder:number[];elbow:number[];upperAngle:number}[];
for(const a of badArms){
 const rel=Math.atan2(Math.sin(a.upperAngle-Math.PI/2),Math.cos(a.upperAngle-Math.PI/2));
 assert(rel<armSector.min||rel>armSector.max,'old upside-down arm accidentally accepted');
 const now=raccoonPose(a.frame/24).arms[a.side];assert(now.elbow[1]>now.shoulder[1]+5,'regression at the actual old bad frame');
}
console.log('PASS rejected four old raised-elbow poses; current old-bad frames stay in body shoulder sector');
