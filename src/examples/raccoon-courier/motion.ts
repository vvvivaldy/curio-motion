import {createRunPlan} from '../../core/run';
import {runningUpperArm} from '../../core/arm-motion';
import {solveTwoBone,solvePlanarLimb,relativeAngle,fitVerticalShift} from '../../core/kinematics';
import {mix,tween} from '../../core/time';
import type {Point2} from '../../core/spatial';
export const floor=635;
export const counterTop:readonly Point2[]=[[676,420],[1210,420],[1242,441],[707,443]];
export const paperGrip:Point2=[-50,-24];
export const armSector={min:-1.49,max:1.31} as const;
export const anatomy={upperLeg:62,lowerLeg:58,soleToAnkle:15,upperArm:77,lowerArm:74};
export const runPlans={
 entrance:createRunPlan({upper:62,lower:58,soleToAnkle:15,start:.2,duration:3.25,ramp:.48,from:-170,to:590,forwardLean:.22}),
 exit:createRunPlan({upper:62,lower:58,soleToAnkle:15,start:12.1,duration:2.65,ramp:.4,from:590,to:1620,firstSide:1,forwardLean:.24}),
};
export type Envelope={center:Point2;angle:number;turn:number;insert:number;visible:boolean;flat:number};
export function paperPoint(e:Envelope,x:number,y:number):Point2{
 x*=.84;y*=.84;
 const a=e.angle,c=Math.cos(a),s=Math.sin(a),w=Math.cos(e.turn),px=x*w+y*(.25*31/23)*e.flat,py=y*mix(1,.25,e.flat);
 return [e.center[0]+px*c-py*s,e.center[1]+px*s+py*c];
}
const toward=(a:Point2,b:Point2,u:number):Point2=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
/** Interactions are staged around low chest holds, with explicit releases/regrips. */
export const courierBeats={tableTouch:4.1,firstGrip:4.4,lift:4.65,liftEnd:5.35,support:5.1,
 nearReleaseForTurn:5.75,nearBottomGrip:6.1,farReleaseForTurn:6.15,turnStart:6.4,turnEnd:7,
 farRegrip:7.4,nearReleaseForTopGrip:7.45,nearTopGrip:7.8,farReleaseForCarry:8,
 carryStart:8.2,carryEnd:8.8,insertStart:8.85,vertical:9.5,insertEnd:10.3,releaseInside:10.5} as const;
export const bottomGrip:Point2=[0,30],topGrip:Point2=[-50,-25],farRegrip:Point2=[-50,25];
function paper(t:number,x:number,rootY:number):Envelope{
 const table:Point2=[742,431],lift:Point2=[x+102,rootY-128],chest:Point2=[x+56,rootY-110],overBag:Point2=[x-61,rootY-67];
 let center=toward(table,lift,tween(t,4.65,5.35));
 center=toward(center,chest,tween(t,5.35,5.75));
 center=toward(center,overBag,tween(t,8.2,8.8));
 // Once horizontally aligned over the mouth, lower early while tipping: the wrist stays below the shoulder.
 center=toward(center,[x-61,rootY+13],tween(t,8.85,9.28));
 center=toward(center,[x-61,rootY+29],tween(t,9.5,10.3));
 center=[center[0],center[1]+8*tween(t,10.5,10.8)];
 const angle=-.12*tween(t,4.65,5.35)*(1-tween(t,5.35,5.75))-Math.PI/2*tween(t,8.85,9.5);
 return {center,angle,turn:Math.PI*tween(t,6.4,7),insert:tween(t,8.85,10.3),visible:t<10.85,flat:1-tween(t,4.65,5.35)};
}
export function raccoonPose(t:number){
 const q=(t<12.1?runPlans.entrance:runPlans.exit).sample(t),bodyX=q.station;
 const feet=q.feet.map((f,i)=>({sole:[f.station+(i?-20:20),floor-f.height+(i?3:-3)] as Point2,planted:f.planted,side:i}));
 let rootY=floor-q.height;
 const hip=(i:number):Point2=>[bodyX+(i?-13:13),rootY+(i?3:-3)];
 const delta=fitVerticalShift(feet.map((f,i)=>({root:[...hip(i),0],target:[f.sole[0],f.sole[1]-15,0],reach:119.85})),0);rootY+=delta;
 const bodyLean=q.pitch,leanX=bodyLean*116,headNod=8*(tween(t,11,11.24)-tween(t,11.35,11.7));
 const shoulders: [Point2,Point2]=[[bodyX+43+leanX,rootY-131],[bodyX-35+leanX,rootY-130]];
 const e=paper(t,bodyX,rootY),first=paperPoint(e,...paperGrip),bottom=paperPoint(e,...bottomGrip),top=paperPoint(e,...topGrip),farPickup=paperPoint(e,42,15),farNew=paperPoint(e,...farRegrip);
 const resting: [Point2,Point2]=[[bodyX+66,rootY-37],[bodyX-44,rootY-48]];
 const hands=shoulders.map((sh,i)=>{
  const drive=i?-q.armSwing:q.armSwing;
  const swing=runningUpperArm(.08,drive,77,44,.45),upperAngle=Math.PI/2-swing,lowerAngle=upperAngle-q.elbowFlexion;
  const running:Point2=[sh[0]+77*Math.cos(upperAngle)+74*Math.cos(lowerAngle),sh[1]+77*Math.sin(upperAngle)+74*Math.sin(lowerAngle)];
  const neutral=toward(resting[i],running,q.envelope);
  if(i===0){
   const pickup=toward(neutral,farPickup,tween(t,4.5,5.1));
   const clear=toward(pickup,neutral,tween(t,6.15,6.35));
   const regrip=toward(clear,farNew,tween(t,7.15,7.4));
   return toward(regrip,neutral,tween(t,8,8.2));
  }
  let h=toward(neutral,toward([691,427],first,tween(t,4.15,4.4)),tween(t,3.65,4.1));
  h=toward(h,[bodyX+16,rootY-68],tween(t,5.75,5.9));
  h=toward(h,bottom,tween(t,5.9,6.1));
  h=toward(h,[bodyX+60,rootY-148],tween(t,7.45,7.6));
  h=toward(h,top,tween(t,7.6,7.8));
  return toward(h,neutral,tween(t,10.5,11.05));
 }) as [Point2,Point2];
 const bodyDownAngle=Math.atan2(154,-leanX);
 const arms=shoulders.map((sh,i)=>{
  const h=hands[i],handAngle=Math.atan2(h[1]-sh[1],h[0]-sh[0]);
  const solved=solvePlanarLimb(sh,h,77,74,{bendSide:1,endAngle:handAngle,wristRange:[-1.45,1.45],minFlexion:.1,maxFlexion:2.72});
  // Body-relative upper-arm direction is an authored constraint, not just endpoint reach.
  const shoulderFromBody=relativeAngle(solved.upperAngle,bodyDownAngle);
  if(shoulderFromBody<armSector.min||shoulderFromBody>armSector.max)throw new RangeError(`Shoulder direction outside low arm arc: t=${t}, side=${i}, upper=${solved.upperAngle}`);
  return {shoulder:sh,elbow:solved.joint,hand:h,side:i,handAngle,shoulderFromBody,...solved};
 });
 const legs=feet.map((f,i)=>{const h:Point2=[bodyX+(i?-13:13),rootY+(i?3:-3)],ankle:Point2=[f.sole[0],f.sole[1]-15],k=solveTwoBone([...h,0],[...ankle,0],62,58,[1,.1,0]);return{hip:h,knee:[k[0],k[1]] as Point2,ankle,sole:f.sole,planted:f.planted};});
 const gripping=(t>=4.4&&t<=5.75)||(t>=6.1&&t<=7.45)||(t>=7.8&&t<=10.5);
 const supporting=(t>=5.1&&t<=6.15)||(t>=7.4&&t<=8);
 return {t,bodyX,rootY,bodyLean,leanX,headNod,bodyDownAngle,feet,legs,arms,envelope:e,gripping,supporting,bag:{x:bodyX-61,y:rootY-22},run:q};
}
export type RaccoonPose=ReturnType<typeof raccoonPose>;
