import {cameras,clock,picture,storyChair} from './world';
import {catPictureStorySettings as settings} from './settings';

export type Point2=readonly [number,number];
export type Vec3=readonly [number,number,number];
export interface CameraState {readonly yaw:number;readonly elevation:number;readonly scale:number;readonly origin:Point2}
export interface ClockState {readonly phase:number;readonly angle:number;readonly angularVelocity:number;readonly pivot:Vec3;readonly bob:Vec3}
export interface ClockEvent {readonly id:string;readonly time:number;readonly kind:'tick'|'tock';readonly crossingDirection:-1|1}
export type FramePhase='hanging'|'free-fall'|'corner-to-edge-tip'|'rock-1'|'rock-2'|'rest';
export interface FrameState {
 readonly origin:Vec3;readonly basisU:Vec3;readonly basisV:Vec3;readonly pivot:Vec3|null;readonly phase:FramePhase;
 /** Outer corners: lower left, lower right (first contact), upper right, upper left. */
 readonly corners:readonly [Vec3,Vec3,Vec3,Vec3];
}
export interface FrameEvent {
 readonly id:string;readonly time:number;readonly kind:'corner-impact'|'gentle-edge-load'|'far-edge-impact'|'rock-return';
 readonly pivot?:Vec3;readonly incomingNormalVelocity?:number;readonly rebound?:number;readonly audible?:boolean;
}
const duration=settings.durationInFrames/settings.fps,tau=2*Math.PI;
function checkTime(time:number){if(!Number.isFinite(time)||time<0||time>duration)throw new RangeError('Story time must be finite and within the composition duration');}
const ease=(x:number)=>{const u=Math.max(0,Math.min(1,x));return u*u*u*(10+u*(-15+6*u));};
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;

/** One scene-local projection for every world anchor; the world never depends on camera time. */
export function cameraAt(time:number):CameraState {
 checkTime(time);const u=ease((time-17)/3),a=cameras.A,b=cameras.B;
 return{yaw:mix(a.yaw,b.yaw,u),elevation:mix(a.elevation,b.elevation,u),scale:mix(a.scale,b.scale,u),origin:[mix(a.origin[0],b.origin[0],u),mix(a.origin[1],b.origin[1],u)]};
}
export function projectWorld([x,y,z]:Vec3,time:number):Point2 {
 const c=cameraAt(time),co=Math.cos(c.yaw),si=Math.sin(c.yaw);
 return[c.origin[0]+(x*co+z*si)*c.scale,c.origin[1]-y*c.scale+(-x*si+z*co)*c.elevation*c.scale];
}
export function worldDepth([x,_y,z]:Vec3,time:number):number {const c=cameraAt(time);return-x*Math.sin(c.yaw)+z*Math.cos(c.yaw);}

// Pivot offset and rod length retain this clock's held drawing; period is1second.
const pendulumPivot:Vec3=[clock.x,clock.y-4,clock.z+3],rodLength=49,amplitude=.18;
export function clockAt(time:number):ClockState {
 checkTime(time);const phase=tau*time,angle=amplitude*Math.cos(phase),[x,y,z]=pendulumPivot;
 return{phase,angle,angularVelocity:-amplitude*tau*Math.sin(phase),pivot:[x,y,z],bob:[x+rodLength*Math.sin(angle),y-rodLength*Math.cos(angle),z]};
}
export function clockEvents():readonly ClockEvent[] {
 return Array.from({length:Math.max(0,Math.ceil((duration-.25)/.5))},(_,index)=>({id:`clock-${index}`,time:.25+.5*index,kind:index%2?'tock':'tick',crossingDirection:index%2?1:-1}));
}

const halfW=picture.width/2+picture.frame,halfH=picture.height/2+picture.frame,height=2*halfH;
const roll=-.045,release=20.25,gravity=900,levelDuration=.12,tipSpeed=2.8;
const cr=Math.cos(roll),sr=Math.sin(roll),minimumInitialY=picture.y+halfW*sr-halfH*cr;
if(halfW<=0||halfH<=0||minimumInitialY<0)throw new RangeError('Authored picture must start above the floor');
const fallDuration=Math.sqrt(2*minimumInitialY/gravity),firstImpact=release+fallDuration;
const floorPivot:Vec3=[picture.x+halfW*cr+halfH*sr,0,picture.z];
// For this short negative roll, the entire frame sweep stays to the right of this bound.
if(floorPivot[0]-2*halfW<=storyChair.right)throw new RangeError('Picture sweep overlaps the chair staging');
const firstFlat=firstImpact+Math.PI/(2*tipSpeed),rockAcceleration=3*gravity/(2*height);
const rebound1Speed=tipSpeed*.40,rebound1Duration=2*rebound1Speed/rockAcceleration;
const rebound2Speed=rebound1Speed*.25,rebound2Duration=2*rebound2Speed/rockAcceleration;
const secondFlat=firstFlat+rebound1Duration,settled=secondFlat+rebound2Duration;
export const frameTimes=Object.freeze({release,firstImpact,lowerEdgeLevel:firstImpact+levelDuration,firstFlat,secondFlat,settled});
function frameAngle(time:number):{roll:number;pitch:number;phase:FramePhase} {
 const elapsed=time-firstImpact;
 if(time<firstFlat)return{roll:roll*(1-ease(elapsed/levelDuration)),pitch:tipSpeed*Math.max(0,elapsed),phase:'corner-to-edge-tip'};
 if(time<secondFlat){const s=time-firstFlat,alpha=Math.max(0,rebound1Speed*s-.5*rockAcceleration*s*s);return{roll:0,pitch:Math.PI/2-alpha,phase:'rock-1'};}
 if(time<settled){const s=time-secondFlat,alpha=Math.max(0,rebound2Speed*s-.5*rockAcceleration*s*s);return{roll:0,pitch:Math.PI/2-alpha,phase:'rock-2'};}
 return{roll:0,pitch:Math.PI/2,phase:'rest'};
}
/** Thin planar frame: ballistic translation until the first OUTER corner hits.
 * Forward tipping is authored kinematics, not a solved rigid-body impulse.
 * Small rocking arcs lose speed at their declared floor impacts and stop finitely.
 */
/** Upper chair members rake toward the wall; seat and floor legs stay fixed.
 * The two actual rear top corners reach wallZ at the finite press maximum. */
export const backrestTimes=Object.freeze({bodyContact:13.35,wallContact:13.55,edgeSlip:13.58,edgeSlipped:13.9});
export function backrestFlex(time:number):number{return 2*ease((time-13.35)/.2)*(1-.4*ease((time-13.55)/.35));}
export function backrestPoint(point:Vec3,time:number):Vec3{const[x,y,z]=point;return[x,y,z-(38+backrestFlex(time))*Math.max(0,Math.min(1,(y-128)/124))];}
export function frameAt(time:number):FrameState {
 checkTime(time);let origin:Vec3,basisU:Vec3,basisV:Vec3,pivot:Vec3|null=null,phase:FramePhase;
 if(time<firstImpact){
  const s=Math.max(0,time-release);
  origin=[picture.x,picture.y-.5*gravity*s*s,picture.z];basisU=[cr,sr,0];basisV=[-sr,cr,0];
  // One retained left wire anchor: the right edge slips lower after the tap.
  // By edgeSlipped this map exactly equals the unchanged release pose.
  if(time<backrestTimes.edgeSlipped){const r=mix(.025,roll,ease((time-backrestTimes.edgeSlip)/(backrestTimes.edgeSlipped-backrestTimes.edgeSlip))),co=Math.cos(r),si=Math.sin(r);basisU=[co,si,0];basisV=[-si,co,0];const pin:Vec3=[picture.x-60*cr-59*sr,picture.y-60*sr+59*cr,picture.z];origin=[pin[0]+60*co+59*si,pin[1]+60*si-59*co,pin[2]];}
  phase=time<release?'hanging':'free-fall';
 }else{
  const a=frameAngle(time),co=Math.cos(a.roll),si=Math.sin(a.roll),cp=Math.max(0,Math.cos(a.pitch)),sp=Math.sin(a.pitch);
  basisU=[co,si*cp,si*sp];basisV=[-si,co*cp,co*sp];pivot=[floorPivot[0],floorPivot[1],floorPivot[2]];phase=a.phase;
  origin=[pivot[0]-halfW*basisU[0]+halfH*basisV[0],pivot[1]-halfW*basisU[1]+halfH*basisV[1],pivot[2]-halfW*basisU[2]+halfH*basisV[2]];
 }
 const pose={origin,basisU,basisV,pivot,phase};
 return{...pose,corners:[framePoint(pose,-halfW,-halfH),framePoint(pose,halfW,-halfH),framePoint(pose,halfW,halfH),framePoint(pose,-halfW,halfH)]};
}
/** All canvas/bevel layers use this same frame-local map as the collision corners. */
export function framePoint(pose:Pick<FrameState,'origin'|'basisU'|'basisV'>,x:number,y:number):Vec3 {
 return[pose.origin[0]+x*pose.basisU[0]+y*pose.basisV[0],pose.origin[1]+x*pose.basisU[1]+y*pose.basisV[1],pose.origin[2]+x*pose.basisU[2]+y*pose.basisV[2]];
}
export function frameEvents():readonly FrameEvent[] {return[
 {id:'frame-first-corner',time:firstImpact,kind:'corner-impact',pivot:[floorPivot[0],floorPivot[1],floorPivot[2]],incomingNormalVelocity:-gravity*fallDuration},
 {id:'frame-lower-edge',time:frameTimes.lowerEdgeLevel,kind:'gentle-edge-load',audible:false},
 {id:'frame-first-flat',time:firstFlat,kind:'far-edge-impact',incomingNormalVelocity:-height*tipSpeed,rebound:.40},
 {id:'frame-second-flat',time:secondFlat,kind:'rock-return',incomingNormalVelocity:-height*rebound1Speed,rebound:.25},
 {id:'frame-rest',time:settled,kind:'rock-return',incomingNormalVelocity:-height*rebound2Speed,rebound:0},
 ];}
