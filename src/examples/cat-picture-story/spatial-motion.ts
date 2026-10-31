/** V2 candidate story controller. Author-owned beats use shared rigid spaces, exact
 * contacts, finite trajectories and directed hinges. V1 controller/media stay separate. */
import type {Vec3,Point2} from '../../core/spatial';
import {type Frame3,pointInFrame3,yawFrame3,unit3,dot3,cross3,sub3,scale3} from '../../core/frame3';
import {sampleStep} from '../../core/contacts';
import {fitVerticalShift} from '../../core/kinematics';
import {createTrajectory} from '../../core/trajectory';
import {smooth,clamp,mix} from '../../core/time';
import {buildSpatialCat,pitchedFrame,relaxedHand,shoulderFrame,torsoLocalRings,type SpatialCatRequest} from './spatial-model';
import {spatialClimbState} from './spatial-climb';
import {spatialWalkAt,spatialFloorEvents} from './spatial-travel';
import {cameraAt,frameTimes,backrestFlex} from './environment';
const e=(t:number,a:number,b:number)=>smooth(clamp((t-a)/(b-a)));
const v=(a:Vec3,b:Vec3,u:number):Vec3=>a.map((q,i)=>mix(q,b[i],u)) as Vec3;
type Support='floor'|'seat'|'chair-edge'|null;
export interface SpatialStoryState {request:SpatialCatRequest;feet:readonly[Support,Support];hands:readonly[Support,Support];pelvis:boolean;beat:string}
export const spatialStoryTimes={climbStart:6.15,climbEnd:11.15,fear:frameTimes.firstImpact+.09,takeoff:24.25,hindLanding:25.35,foreLanding:25.46,landingSettled:25.47,recover:27,groom:29.45,exit:31.3,exitSettled:34.7} as const;
const climbStart=spatialClimbState(0).request,climbEnd=spatialClimbState(5).request;
function jointFrame(body:Frame3,rootLocal:Vec3,target:Vec3):Frame3{
 const origin=pointInFrame3(body,rootLocal),u=unit3(sub3(target,origin));
 const x=unit3(sub3(body.x,scale3(u,dot3(body.x,u))));
 if(dot3(x,body.x)<.2)throw Error('Authored shoulder/hip orientation exceeds directed cone');
 const z=unit3(cross3(x,body.y)),y=cross3(z,x);return{origin,x,y,z};
}
function assemble(request:SpatialCatRequest):SpatialCatRequest{
 const yaw=Math.atan2(request.body.z[0],request.body.z[2]),handFrames=request.handFrames??request.hands.map(p=>yawFrame3(p,yaw)) as [Frame3,Frame3];
 return{...request,handFrames,jointFrames:{arms:request.jointFrames?.arms??request.hands.map((_,i)=>jointFrame(request.body,[i?-27:27,46,0],pointInFrame3(handFrames[i],request.handWristLocal?.[i]??[0,7,0]))) as [Frame3,Frame3],
 legs:request.jointFrames?.legs??request.feet.map((p,i)=>jointFrame(request.body,[i?-12:12,0,0],[p[0],p[1]+8,p[2]])) as [Frame3,Frame3]}};
}
/** Keep authored bend planes continuous across a change of action controller.
 * Blend normals, then re-orthogonalize to the actual held target; never move it. */
function blendPlanes(request:SpatialCatRequest,reference:SpatialCatRequest,amount:number):SpatialCatRequest{
 const target=assemble(request),frames={} as {arms:[Frame3,Frame3];legs:[Frame3,Frame3]};
 for(const kind of ['arms','legs'] as const){frames[kind]=target.jointFrames![kind]!.map((to,i)=>{
  const from=reference.jointFrames![kind]![i],contact=kind==='arms'?pointInFrame3(target.handFrames![i],target.handWristLocal?.[i]??[0,7,0]):[request.feet[i][0],request.feet[i][1]+8,request.feet[i][2]] as Vec3;
  const axis=unit3(sub3(contact,to.origin)),normal=v(from.x,to.x,amount),x=unit3(sub3(normal,scale3(axis,dot3(normal,axis))));
  const y=unit3(sub3(request.body.y,scale3(x,dot3(request.body.y,x))));return{origin:to.origin,x,y,z:cross3(x,y)};
 }) as [Frame3,Frame3];}
 return{...target,jointFrames:frames};
}
function free(body:Frame3,feet:readonly[Vec3,Vec3],heading:readonly[number,number],swing=0,bend=.6,upper=-.3):SpatialCatRequest{
 return{body,headYaw:0,feet,hands:[relaxedHand(body,0,upper-swing,bend),relaxedHand(body,1,upper+swing,bend)],shoulderYaw:[0,0],footYaw:heading};
}
function step(t:number,a:number,b:number,from:Vec3,to:Vec3,fromYaw:number,toYaw:number,lift=10){
 const q=sampleStep(t,{start:a,end:b,from:[from[0],from[2]],to:[to[0],to[2]],lift:0,fromHeading:fromYaw,toHeading:toYaw});
 return{point:[q.position[0],mix(from[1],to[1],q.progress)+lift*16*q.progress**2*(1-q.progress)**2,q.position[1]] as Vec3,yaw:q.heading,planted:q.planted};
}
function bodyFit(hips:Vec3,yaw:number,pitch:number,feet:readonly[Vec3,Vec3]){
 const body=pitchedFrame(hips,yaw,pitch),shift=fitVerticalShift(feet.map((p,i)=>({root:pointInFrame3(body,[i?-12:12,0,0]),target:[p[0],p[1]+8,p[2]] as Vec3,reach:56.8})),0);
 return pitchedFrame([hips[0],hips[1]+shift,hips[2]],yaw,pitch);
}
const seated=(pitch:number):Frame3=>pitchedFrame([124,128+16*Math.cos(pitch)-12*Math.sin(pitch),-156+16*Math.sin(pitch)+12*Math.cos(pitch)],2*Math.PI,pitch);
/** The backrest gap samples actual torso triangles/edge intersections, including the
 * panel's lower border, rather than a separate approximate torso contact point. */
function backrestGap(pitch:number,time:number){
 const b=seated(pitch),rings=torsoLocalRings.map(r=>r.map(p=>pointInFrame3(b,p))),triangles:Vec3[][]=[];
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<12;i++){const a=rings[j][i],c=rings[j+1][(i+1)%12],bb=rings[j][(i+1)%12],d=rings[j+1][i];triangles.push([a,bb,c],[a,c,d]);}
 let gap=Infinity,point:Vec3=[0,0,0];
 for(const triangle of triangles)for(const[bottom,top,front]of[[158,175,-158],[175,227,-157.6],[227,245,-158]]){const candidates=triangle.filter(p=>p[1]>=bottom&&p[1]<=top);
  for(const bound of[bottom,top])for(let i=0;i<3;i++){const a=triangle[i],bb=triangle[(i+1)%3];if((a[1]-bound)*(bb[1]-bound)<0)candidates.push(v(a,bb,(bound-a[1])/(bb[1]-a[1])));}
  for(const p of candidates){const wood=front-(38+backrestFlex(time))*(p[1]-128)/124;if(p[2]-wood<gap){gap=p[2]-wood;point=p;}}
 }
 return{gap,point};
}
function contactBackPitch(t:number){let low=-.6,high=0;for(let i=0;i<30;i++){const mid=(low+high)/2;if(backrestGap(mid,t).gap<0)low=mid;else high=mid;}return(low+high)/2;}
const hopLaunchY=54,hopPushV=(73-hopLaunchY+.5*780*.3**2)/.3,gripTime=6.07;
const catchStartY=hopLaunchY+hopPushV*(gripTime-5.85)-.5*780*(gripTime-5.85)**2;
const hopCatch=createTrajectory([{time:5.73,position:[48,0]},{time:5.85,position:[hopLaunchY,0],velocity:[hopPushV,0],acceleration:[-780,0]},{time:gripTime,position:[catchStartY,0],velocity:[hopPushV-780*(gripTime-5.85),0],acceleration:[-780,0]}, {time:6.15,position:[73,0]}]);
const hopFootRelative=([0,1]as const).map(side=>createTrajectory([
 {time:5.73,position:[-48,5]},
 {time:5.85,position:[-hopLaunchY,5],velocity:[-hopPushV,0],acceleration:[780,0]},
 {time:5.90,position:[-54,5]},
 {time:6.15,position:[side?-43:-49,-10]}
]));
const flightDuration=1.1,jumpGravity=2*(160*flightDuration+126)/flightDuration**2,vx=(-130-95)/flightDuration,vz=(-20+85)/flightDuration;
const incoming=160-jumpGravity*flightDuration,landX=-130+vx*.12/2,landZ=-20+vz*.12/2;
const vertical=createTrajectory([{time:23.6,position:[176,0]},{time:23.9,position:[152,0]},
 {time:24.25,position:[180,0],velocity:[160,0],acceleration:[-jumpGravity,0]},
 {time:25.35,position:[54,0],velocity:[incoming,0],acceleration:[-jumpGravity,0]},
 {time:25.47,position:[42,0]},{time:25.85,position:[42,0]},{time:26.2,position:[44,0]}]);
const horizontal=createTrajectory([{time:23.6,position:[124,-95]},{time:23.9,position:[124,-95]},
 {time:24.25,position:[95,-85],velocity:[vx,vz]},
 {time:25.35,position:[-130,-20],velocity:[vx,vz]},
 {time:25.47,position:[landX,landZ]}]);
export const spatialJump={gravity:jumpGravity,incomingVerticalVelocity:incoming,vertical,horizontal,landX,landZ};
function rawState(t:number):SpatialStoryState{
 if(!Number.isFinite(t)||t<0||t>35)throw RangeError('Spatial story time outside35s');
 if(t<5.15||t>=31.3){const id=t<5.15?'entrance':'exit',q=spatialWalkAt(id,t),body=pitchedFrame(q.hips,q.yaw,q.pitch),r=free(body,q.feet,q.footYaw,q.swing);
  if(id==='exit'){r.headYaw=1.4*e(t,32.3,32.65)*(1-e(t,33,33.35));r.gaze=[6*e(t,32.3,32.65)*(1-e(t,33,33.35)),3];}
  return{request:assemble(r),feet:q.supports as [Support,Support],hands:[null,null],pelvis:false,beat:id};
 }
 if(t<6.15){
  const left=step(t,5.15,5.28,[105,0,8],[62,0,5],Math.PI/2,Math.PI),right=step(t,5.30,5.43,[85,0,32],[128,0,5],Math.PI/2,Math.PI);
  const yaw=mix(Math.PI/2,Math.PI,e(t,5.15,5.45)),z=20;let y=mix(57,48,e(t,5.45,5.7));
  if(t>=5.73)y=hopCatch.sample(t).position[0];
  const feet=t<5.85?[left.point,right.point] as [Vec3,Vec3]:([0,1]as const).map(i=>{const relative=hopFootRelative[i].sample(t).position;return[i?128:62,y+relative[0],relative[1]] as Vec3;}) as [Vec3,Vec3];
  const body=t<5.85?bodyFit([95,y,z],yaw,.06*e(t,5.15,5.45),feet):pitchedFrame([95,y,mix(20,-15,e(t,5.91,gripTime))],Math.PI,.06),r=free(body,feet,[left.yaw,right.yaw]);
  const reach=e(t,5.65,6.15),liftHands=e(t,5.65,6.00),placeHands=e(t,6.00,gripTime);
  r.hands=r.hands.map((hand,i)=>v(v(hand,[climbStart.hands[i][0],136,-40],liftHands),climbStart.hands[i],placeHands)) as [Vec3,Vec3];
  r.handWristLocal=[[0,mix(7,7.5,reach),-9*reach],[0,mix(7,7.5,reach),-9*reach]];
  return{request:blendPlanes(r,climbStart,1-e(t,5.95,6.15)),feet:t<5.85?[left.planted?'floor':null,right.planted?'floor':null]:[null,null],hands:t>=gripTime?['chair-edge','chair-edge']:[null,null],pelvis:false,beat:'turn-crouch-hop-reach'};
 }
 if(t<11.15){const local=t-6.15,q=spatialClimbState(local);return{request:q.request,feet:[local>=2&&local<=3.85||local>=4.5?'seat':null,local>=3.8?'seat':null],hands:[local<=2.42?'chair-edge':null,local<=2?'chair-edge':null],pelvis:local>=4.98,beat:'climb-candidate-pending-visual-gate'};}
 if(t<22.65){
  let body:Frame3,feet:[Vec3,Vec3],heading:[number,number],supports:[Support,Support]=['seat','seat'];
  if(t<12.4){
   const a=step(t,11.35,11.85,climbEnd.feet[0],[136,128,-114],Math.PI,2*Math.PI),b=step(t,11.9,12.4,climbEnd.feet[1],[112,128,-114],Math.PI,2*Math.PI);
   feet=[a.point,b.point];heading=[a.yaw,b.yaw];supports=[a.planted?'seat':null,b.planted?'seat':null];
   body=bodyFit([mix(95,124,e(t,11.35,12.4)),mix(climbEnd.body.origin[1],176,e(t,11.15,11.35)),mix(-80,-144,e(t,11.35,12.4))],mix(Math.PI,2*Math.PI,e(t,11.35,12.4)),mix(.06,0,e(t,11.15,11.35)),feet);
  }else{
   feet=[[136,128,-114],[112,128,-114]];heading=[2*Math.PI,2*Math.PI];
   const recovery=1-e(t,21.65,22.15),pitch=contactBackPitch(t)*e(t,12.95,13.35)*recovery;
   body=t<12.95?pitchedFrame([124,mix(176,144,e(t,12.4,12.95)),-144],2*Math.PI,0):seated(pitch);
   if(t>=22.15)body=pitchedFrame([124,mix(144,176,e(t,22.15,22.65)),-144],2*Math.PI,0);
  }
  const lean=e(t,12.95,13.35)*(1-e(t,21.65,22.15)),r=free(body,feet,heading,0,1.2-.4*lean,-.5+.7*lean);r.neckPitch=-Math.atan2(body.y[2],body.y[1])*e(t,11.15,11.35)+.75*lean;r.headPitch=-.75*lean;const bodyYaw=mix(Math.PI,2*Math.PI,e(t,11.35,12.4));r.tailYaw=mix(-.35,2*Math.PI-2*bodyYaw,e(t,11.15,11.35));
  const transition=e(t,11.15,11.35);if(t<11.35){r.hands=[v(climbEnd.hands[0],r.hands[0],transition),v(climbEnd.hands[1],r.hands[1],transition)];r.handWristLocal=[[0,mix(7.5,7,transition),mix(-9,0,transition)],[0,mix(7.5,7,transition),mix(-9,0,transition)]];}
  r.fear=e(t,spatialStoryTimes.fear,spatialStoryTimes.fear+.2);r.headYaw=.4*r.fear;r.gaze=[2+4*r.fear,3-5*r.fear];
  return{request:t<11.35?blendPlanes(r,climbEnd,transition):assemble(r),feet:supports,hands:[null,null],pelvis:t>=12.95&&t<22.15,beat:t<13.35?'seat-turn-settle':'proud-backrest-camera-fright'};
 }
 if(t<24.25){
  const a=step(t,22.65,23.1,[136,128,-114],[124,128,-83],0,-Math.PI/2),b=step(t,23.15,23.6,[112,128,-114],[124,128,-107],0,-Math.PI/2),feet:[Vec3,Vec3]=[a.point,b.point];
  const yaw=mix(0,-Math.PI/2,e(t,22.65,23.6)),xz=horizontal.sample(t).position,y=t<23.6?176:vertical.sample(t).position[0],z=t<23.6?mix(-144,-95,e(t,22.65,23.6)):xz[1];
  const body=bodyFit([t<23.6?124:xz[0],y,z],yaw,.38*e(t,23.6,23.9),feet),r=free(body,feet,[a.yaw,b.yaw],0,mix(1.2,.6,e(t,22.65,22.95))+.55*e(t,23.9,24.25),mix(-.5,-.3,e(t,22.65,22.95))+.65*e(t,23.9,24.25));r.fear=1;r.headPitch=-.45*e(t,23.9,24.25);r.tailYaw=-2*Math.PI-2*yaw;r.headYaw=.4*(1-e(t,22.65,23.1));r.gaze=[6,-2];
  return{request:assemble(r),feet:[a.planted?'seat':null,b.planted?'seat':null],hands:[null,null],pelvis:false,beat:'gather-turn-crouch-push'};
 }
 if(t<27.35){
  const xz=horizontal.sample(t).position,y=vertical.sample(t).position[0],pitch=mix(.38,.90,e(t,24.6,25.35))+.20*e(t,25.35,25.46),body=pitchedFrame([xz[0],y,xz[1]],-Math.PI/2,pitch);
  let feet:[Vec3,Vec3],hands:[Vec3,Vec3];
  if(t<25.35){const tuck=e(t,24.25,24.55),extend=e(t,24.95,25.35);feet=([0,1]as const).map(i=>{const rel=v(v([29,-52,i?-22:2],[16,-34,i?-12:12],tuck),[-14,-54,i?-12:12],extend);return[body.origin[0]+rel[0],body.origin[1]+rel[1],body.origin[2]+rel[2]] as Vec3;}) as [Vec3,Vec3];
   const freeHands=free(body,feet,[-Math.PI/2,-Math.PI/2],0,1.15,.35).hands;
   hands=[v(freeHands[0],[body.origin[0]-65,body.origin[1]-22,body.origin[2]+19],e(t,25,25.35)),v(freeHands[1],[body.origin[0]-65,body.origin[1]-22,body.origin[2]-19],e(t,25,25.35))];
  }else{feet=[[-144,0,-8],[-144,0,-32]];hands=[[-195,mix(32,0,e(t,25.35,25.46)),-1],[-195,mix(32,0,e(t,25.35,25.46)),-39]];}
  const r:SpatialCatRequest={body,headYaw:.35*e(t,27,27.35),headPitch:-.45,fear:1,feet,hands,shoulderYaw:[0,0],footYaw:[-Math.PI/2,-Math.PI/2],tailYaw:mix(-Math.PI,-.35,e(t,24.25,24.6)),floorHands:t>=25.35,floorHandBlend:clamp(e(t,25.1,25.46))};
  return{request:assemble(r),feet:t<25.35?[null,null]:['floor','floor'],hands:t<25.46?[null,null]:['floor','floor'],pelvis:false,beat:t<25.35?'ballistic-escape':'hind-fore-absorb-hold'};
 }
 const floorFeet:[Vec3,Vec3]=[[-144,0,-8],[-144,0,-32]],floorHands:[Vec3,Vec3]=[[-195,0,-1],[-195,0,-39]];
 if(t<28.35){const recover=e(t,27.65,28.35),body=pitchedFrame([mix(landX,-144,recover),mix(44,55,recover),mix(landZ,-20,recover)],-Math.PI/2,mix(1.1,0,recover)),r=free(body,floorFeet,[-Math.PI/2,-Math.PI/2],0,mix(1.6,.6,recover),mix(.25,-.3,recover));
  const lift=e(t,27.35,27.65);r.hands=[v(floorHands[0],r.hands[0],lift),v(floorHands[1],r.hands[1],lift)];r.floorHandBlend=clamp(1-lift);r.headPitch=mix(-.45,0,recover);r.headYaw=.35*(1-recover);r.fear=1-e(t,27.35,28.8);
  return{request:assemble(r),feet:['floor','floor'],hands:[null,null],pelvis:false,beat:'lift-forepads-before-rise'};
 }
 const exiting=t>=30.7,turn=exiting?e(t,30.7,31.3):e(t,28.35,29.05),yaw=exiting?-Math.PI/2*turn:mix(-Math.PI/2,0,turn),frontFeet:[Vec3,Vec3]=[[-129,0,-12],[-159,0,-12]];
 const a=exiting?step(t,30.7,30.95,frontFeet[0],floorFeet[0],0,-Math.PI/2):step(t,28.35,28.65,floorFeet[0],frontFeet[0],-Math.PI/2,0);
 const b=exiting?step(t,31,31.25,frontFeet[1],floorFeet[1],0,-Math.PI/2):step(t,28.7,29,floorFeet[1],frontFeet[1],-Math.PI/2,0);
 const feet:[Vec3,Vec3]=[a.point,b.point],body=bodyFit([-144,mix(55,57,exiting?turn:0),-20],yaw,0,feet),r=free(body,feet,[a.yaw,b.yaw]);r.fear=1-e(t,27.35,28.8);r.headYaw=exiting?0:1.25*e(t,28.35,28.65)*(1-e(t,28.65,29.05));
 if(t>=29.2&&t<30.7){
  const base=buildSpatialCat(assemble(r)),stroke=e(t,29.45,29.9),last=e(t,29.9,30.15);
  const local:Point2=t<29.9?[mix(45,49,stroke),mix(5,14,stroke)]:[mix(49,45,last),mix(14,24,last)];
  let target=base.headSurface(local);
  if(t>=30.15){const u=e(t,30.15,30.35);target=v(base.headSurface([45,24]),base.bodySurface([18,30]),u);target[2]+=12*16*u*u*(1-u)*(1-u);}
  const reach=e(t,29.2,29.45)*(1-e(t,30.35,30.65)),palmYaw=Math.PI*reach;
  const frame=yawFrame3([0,0,0],palmYaw),tip=pointInFrame3(frame,[5,4,10]),origin=sub3(target,tip);
  r.hands=[v(r.hands[0],origin,reach),r.hands[1]];r.handFrames=[yawFrame3(r.hands[0],palmYaw),yawFrame3(r.hands[1],yaw)];
 }
 return{request:assemble(r),feet:[a.planted?'floor':null,b.planted?'floor':null],hands:[null,null],pelvis:false,beat:exiting?'turn-for-exit':'look-camera-groom-real-surface'};
}
export function spatialStoryState(time:number){try{return rawState(time);}catch(error){throw Error(`V2 control ${time.toFixed(6)}: ${error instanceof Error?error.message:error}`);}}
export function spatialStoryPose(time:number){const state=spatialStoryState(time);try{return{...state,cat:buildSpatialCat(state.request),view:cameraAt(time),environmentTime:time};}catch(error){throw Error(`V2 drawing ${time.toFixed(6)}: ${error instanceof Error?error.message:error}`);}}
export{spatialFloorEvents};

/** Contact comes from the exact torso surface used by the panel fit. */
export function spatialBackrestContact(t:number){const b=spatialStoryState(t).request.body;return backrestGap(Math.atan2(b.y[2],b.y[1]),t);}

/** Example-local floor rig adapter shared by the accepted story and opt-in V3 travel.
 * Geometry/pose choices stay in the example; the core run planner owns no cat anatomy. */
export function spatialFloorRig(body:Frame3,feet:readonly[Vec3,Vec3],headings:readonly[number,number],swing=0,bend=.6,upper=-.3,roll?:number,armPlaneAmount=1){
 const r=free(body,feet,headings,swing,bend,upper);if(roll===undefined)return assemble(r);
 r.hands=[relaxedHand(body,0,upper-swing,bend,0,roll),relaxedHand(body,1,upper+swing,bend,0,-roll)];r.shoulderRoll=[roll,-roll];
 const rest=assemble(r);r.jointFrames={arms:[shoulderFrame(body,[27,46,0],0,roll),shoulderFrame(body,[-27,46,0],0,-roll)]};
 // Restore the existing held-pose planes continuously as the run envelope reaches zero.
 return blendPlanes(r,rest,armPlaneAmount);
}
