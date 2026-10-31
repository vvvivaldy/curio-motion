/** Opt-in ordinary flat-floor biped run, transferred from the Math candidate. No rig/dynamics engine.
 * Coordinates: station increases along caller's forward axis; height is world-up.
 * Sole→ankle is the REAL artwork anchor, not a guessed leg-length correction.
 * Existing sampleFootsteps/sampleStep semantics remain unchanged. */
import {sampleStep,type Step2D} from './contacts';
import {sampleTravel,smooth} from './time';
export interface RunDimensions {upper:number;lower:number;soleToAnkle:number}
export interface RunFoot {side:0|1;station:number;height:number;planted:boolean;stepStart:number;stepEnd:number}
export interface RunOptions extends RunDimensions {start?:number;duration?:number;from?:number;to?:number;ramp?:number;firstSide?:0|1;forwardLean?:number}
export const ordinaryRunDefaults=Object.freeze({stepInterval:.24,stancePerStep:.76,maximumStepAdvance:.72,stanceEndFlexion:.32,midStanceFlexion:.82,swingLift:.32,armSwing:.45,elbowFlexion:1.30,forwardLean:Math.PI/8,brakingSteps:2});
export function createRunPlan(options:RunOptions){
 const {upper,lower,soleToAnkle}=options,L=upper+lower,start=options.start??0,duration=options.duration??4,ramp=options.ramp??.5,from=options.from??0,to=options.to??from+3*L*(duration-ramp),firstSide=options.firstSide??0,end=start+duration;
 if(![upper,lower,soleToAnkle,start,duration,ramp,from,to].every(Number.isFinite)||upper<=0||lower<=0||soleToAnkle<0||duration<=0||ramp<=0||ramp>duration/2||to<=from||![0,1].includes(firstSide))throw RangeError('Positive leg lengths, forward finite path and finite smooth ramps required');
 const forwardLean=options.forwardLean??ordinaryRunDefaults.forwardLean;
 if(!Number.isFinite(forwardLean)||forwardLean<0)throw RangeError('Finite nonnegative forwardLean required');
 const span=to-from,speed=span/(duration-ramp),radius=(theta:number)=>Math.sqrt(upper*upper+lower*lower+2*upper*lower*Math.cos(theta)),extension=radius(ordinaryRunDefaults.stanceEndFlexion),compression=radius(ordinaryRunDefaults.midStanceFlexion);
 const maximumHalfTravel=Math.sqrt(Math.max(0,extension*extension-(compression+.02*L)**2));
 if(maximumHalfTravel<=0)throw RangeError('Proportions need a separately authored run, not a lowered default pelvis');
 const maxInterval=Math.min(ordinaryRunDefaults.stepInterval,ordinaryRunDefaults.maximumStepAdvance*L/speed,2*maximumHalfTravel/(ordinaryRunDefaults.stancePerStep*speed));
 const count=Math.max(4,Math.ceil(duration/maxInterval)),interval=duration/count,stance=ordinaryRunDefaults.stancePerStep*interval,flight=interval-stance;
 const horizontalHalfTravel=speed*stance/2,Hrest=soleToAnkle+extension,Hmid=soleToAnkle+compression,Hcontact=soleToAnkle+Math.sqrt(extension**2-horizontalHalfTravel**2),amplitude=Hcontact-Hmid,V=4*amplitude/stance,g=2*V/flight;
 const travel=(time:number)=>sampleTravel(time,{start,end,ramp});
 const station=(time:number)=>from+span*travel(time).progress;
 const brakingStart=end-ordinaryRunDefaults.brakingSteps*interval;
 // Two genuinely shorter advancing contacts, ending in a small staggered stance.
 // Body station is unchanged; do not pull it to a support midpoint.
 const beforeClosing=station(end-2*interval+stance/2),precedingAdvance=beforeClosing-station(end-3*interval+stance/2);
 const closingHalfSpan=Math.min(.07*L,(to-beforeClosing)/4,precedingAdvance/4);
 const contacts=Array.from({length:count+1},(_,n)=>({side:(firstSide+n%2)%2 as 0|1,time:start+n*interval,station:n===0?from:n===count-1?to-closingHalfSpan:n===count?to+closingHalfSpan:station(start+n*interval+stance/2)}));
 const tracks:[Step2D[],Step2D[]]=[[],[]];
 for(const side of [0,1]as const){let previous=from,previousLanding:number|undefined;
  for(const c of contacts.filter(c=>c.side===side)){
   if(c.time===start){previous=c.station;previousLanding=c.time;continue;}
   const liftTime=previousLanding===undefined?start:previousLanding+stance;
   tracks[side].push({start:liftTime,end:c.time,from:[previous,0],to:[c.station,0],lift:ordinaryRunDefaults.swingLift*L,fromHeading:0,toHeading:0});previous=c.station;previousLanding=c.time;
  }
 }
 function sample(time:number){
  if(!Number.isFinite(time))throw RangeError('Finite seek time required');
  const q=travel(time),envelope=q.velocity*(duration-ramp),x=station(time);
  const phase=((time-start)%interval+interval)%interval;
  const active=time>start&&time<end;
  const base=phase<=stance?Hmid+amplitude*(2*phase/stance-1)**2:Hcontact+V*(phase-stance)-.5*g*(phase-stance)**2;
  const height=Hrest+envelope*(base-Hrest);
  const feet=tracks.map((track,side)=>{
   let current=track[0];for(const step of track)if(time>=step.start)current=step;
   const s=sampleStep(time,current);
   // Early heel recovery while the foot is still behind the pelvis.
   // Preserve the late swing exactly: early lift only adds reach margin.
   const u=Math.max(0,Math.min(1,(time-current.start)/(current.end-current.start)));
   const footHeight=-s.position[1]*(2-smooth(u/.65));
   return {side:side as 0|1,station:s.position[0],height:footHeight,planted:s.planted,stepStart:current.start,stepEnd:current.end};
  }) as [RunFoot,RunFoot];
  // Contralateral from ACTUAL foot lead, not camera-relative near/far order.
  const lead=(feet[0].station-feet[1].station)/(.7*L),armSwing=ordinaryRunDefaults.armSwing*Math.tanh(1.5*lead)*envelope;
  const pitch=forwardLean*smooth((time-start)/ramp)*(1-smooth((time-brakingStart)/(end-brakingStart)));
  return {time,station:x,height,velocity:q.velocity*span,envelope,feet,armSwing,elbowFlexion:.6+(ordinaryRunDefaults.elbowFlexion-.6)*envelope,pitch,phase:!active?'hold':feet.every(f=>!f.planted)?'flight':'support'};
 }
 return {dimensions:{upper,lower,soleToAnkle},start,end,duration,ramp,from,to,firstSide,interval,stance,flight,count,speed,brakingStart,closingHalfSpan,heights:{rest:Hrest,midStance:Hmid,contact:Hcontact,flightApex:Hcontact+V*flight/4},effectiveFlightGravity:g,tracks,contacts,sample};
}
