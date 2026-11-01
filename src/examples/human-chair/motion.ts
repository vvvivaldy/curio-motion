import {contactFloor} from './depth';
import {sampleFootsteps,inspectFootPasses} from '../../core/gait';
import type {Step2D} from '../../core/contacts';
import {mix,tween,sampleTravel} from '../../core/time';
import {createTrajectory} from '../../core/trajectory';
import type {Point2} from '../../core/spatial';
import {buildHuman,type Control} from './design';
const transfer=.05;
const period=.42,swingDuration=.36,stanceDuration=2*period-swingDuration;
export const phases={approachStart:.15,approachEnd:3.55,turnStart:3.8,farTurnEnd:4.24,nearTurnStart:4.30,turnEnd:4.74,sitStart:5,sitContact:6.35,holdEnd:7,prepareEnd:7.8,releaseThrough:8.15,riseEnd:9.05,departureStart:9.3,departureEnd:14.18} as const;
export const tracks:[Step2D[],Step2D[]]=[[],[]];
const approachTravel={start:phases.approachStart,end:phases.approachEnd,ramp:.45};
const departureTravel={start:phases.departureStart,end:phases.departureEnd,ramp:.45};
function travel(time:number,departure:boolean){const s=sampleTravel(time,departure?departureTravel:approachTravel),from=departure?714:270,to=departure?-45:735;return {x:mix(from,to,s.progress),speed:Math.abs(to-from)*s.velocity};}
function append(foot:0|1,start:number,end:number,to:Point2,lift:number,heading:number){
 const previous=tracks[foot].at(-1),from=previous?.to??(foot===0?[282,contactFloor(0,1)]:[257,contactFloor(1,1)]);
 tracks[foot].push({start,end,from:[...from],to,lift,fromHeading:previous?.toHeading??0,toHeading:heading});
}
/** Contacts are sampled from the SAME finite body travel, with a half-stance lead.
 * Acceleration/braking shorten steps gradually; no manual short step mid-cruise.
 */
function walkingSteps(departure:boolean,count:number){
 const dir=departure?-1:1,start=departure?phases.departureStart:phases.approachStart;
 for(let i=0;i<count;i++){
  const foot:0|1=departure?(i%2===0?0:1):(i%2===0?1:0),lift=start+i*period,land=lift+swingDuration,body=travel(land,departure);
  const interval=departure?departureTravel:approachTravel;
  const strength=sampleTravel(land,interval).velocity*(interval.end-interval.start-interval.ramp);
  // A small forward reserve covers the interval while a newly lifted foot
  // accelerates past the moving hip; it is shared by both alternating feet.
  const lead=Math.abs(travel(land+stanceDuration,departure).x-body.x)/2+5*strength;
  append(foot,lift,land,[body.x+(foot===0?10:-10)+dir*lead,contactFloor(foot,dir)],10,departure?Math.PI:0);
 }
}
walkingSteps(false,8);
append(1,phases.turnStart,phases.farTurnEnd,[704,594],9,Math.PI);
append(0,phases.nearTurnStart,phases.turnEnd,[720,600],9,Math.PI);
walkingSteps(true,12);
const seatPath=createTrajectory([
 {time:phases.sitStart,position:[726,415.3]},
 {time:5.65,position:[773,453],velocity:[86,91]},
 {time:phases.sitContact,position:[809,488]},
 {time:phases.holdEnd,position:[809,488]},
 {time:phases.prepareEnd,position:[783,488],velocity:[-44,0]},
 {time:phases.releaseThrough,position:[766,476],velocity:[-52,-60]},
 {time:phases.riseEnd,position:[714,414.5]},
]);
const leanPath=createTrajectory([
 {time:phases.sitStart,position:[-.02,0]},
 {time:5.65,position:[-.26,0],acceleration:[.8,0]},
 {time:phases.sitContact,position:[-.06,0]},
 {time:phases.holdEnd,position:[-.06,0]},
 {time:phases.prepareEnd,position:[-.60,0],velocity:[-.05,0]},
 {time:phases.releaseThrough,position:[-.58,0],velocity:[.2,0]},
 {time:phases.riseEnd,position:[0,0]},
]);
export const approachPasses=inspectFootPasses(tracks.map(t=>t.filter(s=>s.start<phases.turnStart)) as [Step2D[],Step2D[]],[1,0],transfer);
export const departurePasses=inspectFootPasses(tracks.map(t=>t.filter(s=>s.start>=phases.departureStart)) as [Step2D[],Step2D[]],[-1,0],transfer);
function walkBody(time:number,departure:boolean){
 const interval=departure?departureTravel:approachTravel,s=sampleTravel(time,interval),strength=s.velocity*(interval.end-interval.start-interval.ramp),firstLand=interval.start+swingDuration;
 const body=travel(time,departure),bob=3.9+2.7*Math.cos(2*Math.PI*(time-firstLand)/period);
 const lastLand=interval.start+(departure?11:7)*period+swingDuration;
 const verticalEnd=departure?lastLand+.10:interval.end;
 const vertical=tween(time,interval.start,interval.start+.32)*(1-tween(time,departure?verticalEnd-.30:interval.end-.45,verticalEnd));
 return{hips:[body.x,414.5+(!departure?tween(time,interval.end-.5,interval.end):0)+vertical*bob] as Point2,lean:(departure?-1:1)*.02*strength,swing:(departure?-1:1)*.20*Math.cos(Math.PI*(time-(firstLand+(departure?0:period)))/period)*strength};
}
/** Pure authored kinematics with C2 body through-points; geometry checks reject
 * an unreachable authored root instead of reactively lowering it each frame.
 */
export function humanControl(time:number):Control{
 const feet=tracks.map(t=>sampleFootsteps(time,t,transfer));
 const common={frame:time*24,feet:feet.map(f=>f.ground) as [Point2,Point2],lift:feet.map(f=>f.ground[1]-f.position[1]) as [number,number],headings:feet.map(f=>f.heading) as [number,number],preserveRoot:true};
 let hips:Point2=[270,414.5],facing=1,lean=0,restHands=0,seat=false,swing=0,label='Approach';
 if(time<phases.turnStart){({hips,lean,swing}=walkBody(time,false));}
 else if(time<phases.sitStart){const u=tween(time,phases.turnStart,phases.turnEnd);hips=[mix(735,726,u),mix(415.5,415.3,u)];facing=mix(1,-1,tween(time,phases.turnStart,phases.turnEnd));lean=mix(0,-.02,tween(time,phases.turnEnd,phases.sitStart));label='Supported turn';}
 else if(time<phases.departureStart){hips=seatPath.sample(time).position;facing=-1;lean=leanPath.sample(time).position[0];restHands=tween(time,5.12,6.05)*(1-tween(time,8.25,9.02));seat=time>=phases.sitContact&&time<=phases.prepareEnd;label=time<phases.sitContact?'Controlled sitting':time<phases.holdEnd?'Seated hold':time<phases.prepareEnd?'Forward weight preparation':time<phases.riseEnd?'Continuous supported rise':'Standing before departure';}
 else{({hips,lean,swing}=walkBody(time,true));facing=-1;label='Departure';}
 return{...common,hips,facing,lean,restHands,seat,swing,label};
}
export function humanPose(time:number){return buildHuman(humanControl(time));}
