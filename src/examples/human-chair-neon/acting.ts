import {humanControl,tracks as acceptedTracks,phases} from '../human-chair/motion';
import {buildHuman,humanDesign,chair,type Control,type HumanPose} from '../human-chair/design';
import {sampleFootsteps} from '../../core/gait';
import {mix,tween} from '../../core/time';
import {localPoint,rotatePoint,type Point2} from '../../core/spatial';
import {mapContour} from '../../core/contour';
import {limbShape} from '../../core/limb';
import {relativeAngle,solveTwoBone,solvePlanarLimb} from '../../core/kinematics';
import type {Step2D} from '../../core/contacts';
import {actingTimeline,type Performance} from './settings';

const lerpPoint=(a:Point2,b:Point2,u:number):Point2=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
/** Accepted gait geometry and timing; caution inserts a genuine planted inspection
 * before the same supported turn. Departure contacts are intentionally absent. */
export function performanceTracks(performance:Performance):[Step2D[],Step2D[]]{
 const shift=actingTimeline[performance].turnStart-phases.turnStart;
 return acceptedTracks.map(track=>track.filter(s=>s.end<=phases.turnEnd).map(s=>({...s,from:[...s.from],to:[...s.to],start:s.start+(s.start>=phases.turnStart?shift:0),end:s.end+(s.start>=phases.turnStart?shift:0)}))) as [Step2D[],Step2D[]];
}
export const actingTracks={confident:performanceTracks('confident'),cautious:performanceTracks('cautious')};
function sourceTime(time:number,performance:Performance){
 const b=actingTimeline[performance];
 if(time<=phases.approachEnd)return time;
 if(time<b.turnStart)return phases.approachEnd;
 if(time<b.turnEnd)return phases.turnStart+time-b.turnStart;
 if(time<b.lowerStart)return mix(phases.turnEnd,phases.sitStart,(time-b.turnEnd)/(b.lowerStart-b.turnEnd));
 if(time<b.seatContact)return mix(phases.sitStart,phases.sitContact,(time-b.lowerStart)/(b.seatContact-b.lowerStart));
 return phases.sitContact+Math.min(.6,time-b.seatContact);
}
/** New authored wrist pose, existing two-bone solver and contour. There is no
 * invented seat contact: these guarded palms remain freely held in front. */
function guardArm(a:HumanPose['arms'][number],hips:Point2,amount:number){
 if(amount===0)return a;
 const target:Point2=[hips[0]-(a.side===0?47:58),hips[1]-(a.side===0?29:35)];
 const wrist=lerpPoint(a.wrist,target,amount),{upperArm:upper,lowerArm:lower}=humanDesign;
 const dx=wrist[0]-a.root[0],dy=wrist[1]-a.root[1];
 const k=solveTwoBone([...a.root,0],[...wrist,0],upper,lower,[dy,-dx,0]);
 const forearmAngle=Math.atan2(wrist[1]-k[1],wrist[0]-k[0]);
 const originalAngle=a.handFrame.angle+Math.PI/2;
 const desired=forearmAngle+a.wristBend*(1-amount);
 const endAngle=originalAngle+relativeAngle(desired,originalAngle);
 const solved=solvePlanarLimb(a.root,wrist,upper,lower,{bendSide:-1,endAngle,wristRange:[-1.1,1.1],minFlexion:.04,maxFlexion:2.3});
 const handFrame={origin:wrist,angle:endAngle-Math.PI/2,scale:1};
 const hand=mapContour(a.hand,q=>{
  const local=rotatePoint([q[0]-a.handFrame.origin[0],q[1]-a.handFrame.origin[1]],-a.handFrame.angle);
  return localPoint(local,handFrame);
 });
 return{...a,...solved,wrist,handFrame,hand,shape:limbShape(a.root,solved.joint,wrist,[19,15,11],{jointSmoothing:.3})};
}
export function actingPose(time:number,performance:Performance){
 if(!Number.isFinite(time)||time<0)throw new RangeError('Finite nonnegative performance time required');
 const b=actingTimeline[performance],cautious=performance==='cautious',t=sourceTime(time,performance);
 const base=humanControl(t),feet=actingTracks[performance].map(track=>sampleFootsteps(time,track,.05));
 const prepare=cautious?tween(time,b.turnEnd,b.prepareEnd):0;
 const lowering=tween(time,b.lowerStart,b.seatContact),release=tween(time,b.seatContact,b.relaxed);
 const guard=prepare*(1-.15*lowering)*(1-release);
 const inspect=cautious?tween(time,3.45,3.75)*(1-tween(time,4.18,b.turnEnd)):0;
 const notice=cautious?inspect:tween(time,3.02,3.3)*(1-tween(time,3.55,4.05));
 const extraLean=cautious?-.055*prepare*(1-.45*lowering)*(1-release):0;
 const control:Control={...base,frame:time*24,label:`${performance}: ${time<b.turnStart?'notice':time<b.turnEnd?'turn':time<b.lowerStart?'prepare':time<b.seatContact?'lower':'seated'}`,
  feet:feet.map(f=>f.ground) as [Point2,Point2],lift:feet.map(f=>f.ground[1]-f.position[1]) as [number,number],headings:feet.map(f=>f.heading) as [number,number],
  hips:[base.hips[0],base.hips[1]+3*prepare*(1-lowering)],lean:base.lean+extraLean+.02*release,
  seat:time>=b.seatContact,preserveRoot:true};
 const p=buildHuman(control);
 const arms=cautious?p.arms.map(a=>guardArm(a,p.hips,guard)):p.arms;
 // Small downward pitch around the real neck; facing remains the whole-view
 // blend in -1..1 and is never interpreted as a head angle in radians.
 const pitch=p.facing*((cautious?.19:.085)*notice+(cautious?.065*prepare*(1-release):0));
 const neck=p.bodyPoint(0,112),headOffset=rotatePoint([p.headFrame.origin[0]-neck[0],p.headFrame.origin[1]-neck[1]],pitch);
 const headFrame={...p.headFrame,origin:[neck[0]+headOffset[0],neck[1]+headOffset[1]] as Point2,angle:p.headFrame.angle+pitch};
 const head=mapContour(p.face.head,q=>localPoint(q,headFrame));
 const seatCentre:Point2=[chair.seat.reduce((s,q)=>s+q[0],0)/chair.seat.length,chair.seat.reduce((s,q)=>s+q[1],0)/chair.seat.length];
 const toward=rotatePoint([seatCentre[0]-headFrame.origin[0],seatCentre[1]-headFrame.origin[1]],-headFrame.angle),distance=Math.hypot(...toward);
 const attention=notice*.95;
 const gaze:Point2=[.5*p.facing*(1-attention)+1.15*toward[0]/distance*attention,.55*toward[1]/distance*attention];
 return{...p,arms,headFrame,head,time,performance,sourceTime:t,guard,notice,pitch,gaze,tension:cautious?Math.max(inspect,.8*guard):0,relaxation:release,seatContact:b.seatContact};
}
export type ActingPose=ReturnType<typeof actingPose>;
