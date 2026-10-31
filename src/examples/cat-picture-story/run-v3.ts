/** V3 replaces floor travel and narrow turn joins; the accepted middle action stays delegated to V2. */
import{createRunPlan}from'../../core/run';
import{runningUpperArm}from'../../core/arm-motion';
import{sampleStep}from'../../core/contacts';
import{pointInFrame3}from'../../core/frame3';
import{fitVerticalShift}from'../../core/kinematics';
import{smooth,clamp,mix}from'../../core/time';
import type{Vec3}from'../../core/spatial';
import{pitchedFrame,buildSpatialCat,spatialCatRunArm}from'./spatial-model';
import{spatialFloorRig,spatialStoryState,type SpatialStoryState}from'./spatial-motion';
import{spatialStoryEvents,type SpatialStoryEvent}from'./spatial-events';
import{spatialStorySoundCues,createStorySoundCue,soundAssets}from'./spatial-cues';
import{cameraAt,projectWorld}from'./environment';
const ease=(t:number,a:number,b:number)=>clamp(smooth(clamp((t-a)/(b-a))));
const dimensions={upper:30,lower:27,soleToAnkle:8};
export const storyRunPlans={entrance:createRunPlan({...dimensions,start:.4,duration:4.35,ramp:.5,from:0,to:675,firstSide:0}),exit:createRunPlan({...dimensions,start:31.3,duration:3.4,ramp:.4,from:0,to:607.5000000000006,firstSide:1})};
const entranceRest=storyRunPlans.entrance.sample(storyRunPlans.entrance.end);
/** The turn consumes the real closing contacts; no extra shuffle or planted-foot interpolation. */
function adaptedTurn(time:number):SpatialStoryState{
 const old=spatialStoryState(time),samples=([0,1]as const).map(i=>sampleStep(time,{start:i?5.30:5.15,end:i?5.43:5.28,from:[-580+entranceRest.feet[i].station,i?32:8],to:[i?128:62,5],lift:0,fromHeading:Math.PI/2,toHeading:Math.PI}));
 const feet=samples.map(q=>[q.position[0],10*16*q.progress**2*(1-q.progress)**2,q.position[1]]as Vec3)as[Vec3,Vec3];
 const desired=mix(storyRunPlans.entrance.heights.rest,old.request.body.origin[1],ease(time,5.15,5.28)),body={...old.request.body,origin:[95,desired,20]as Vec3};
 const shift=fitVerticalShift(feet.map((p,i)=>({root:pointInFrame3(body,[i?-12:12,0,0]),target:[p[0],p[1]+8,p[2]]as Vec3,reach:56.8})),0);body.origin[1]+=shift;
 return{...old,request:spatialFloorRig(body,feet,samples.map(q=>q.heading)as[number,number]),feet:samples.map(q=>q.planted?'floor':null)as['floor'|null,'floor'|null],beat:'turn-from-real-run-contacts'};
}
function prepareExit(time:number):SpatialStoryState{
 const old=spatialStoryState(time),r=old.request,desired=mix(r.body.origin[1],storyRunPlans.exit.heights.rest,ease(time,31.05,31.3)),body={...r.body,origin:[r.body.origin[0],desired,r.body.origin[2]]as Vec3};
 const shift=fitVerticalShift(r.feet.map((p,i)=>({root:pointInFrame3(body,[i?-12:12,0,0]),target:[p[0],p[1]+8,p[2]]as Vec3,reach:56.8})),0);body.origin[1]+=shift;
 return{...old,request:spatialFloorRig(body,r.feet,r.footYaw!),beat:'rise-in-exit-turn-before-running'};
}
export function storyRunState(time:number):SpatialStoryState{
 if(!Number.isFinite(time)||time<0||time>35)throw RangeError('V3 time outside35seconds');
 if(time>=5.15&&time<5.45)return adaptedTurn(time);
 if(time>=31.05&&time<31.3)return prepareExit(time);
 if(time>=5.45&&time<31.05)return spatialStoryState(time);
 const entering=time<5.45,plan=entering?storyRunPlans.entrance:storyRunPlans.exit,q=plan.sample(time),direction=entering?1:-1,base=entering?-580:-144,z=entering?20:-20,yaw=entering?Math.PI/2:-Math.PI/2;
 let feet=q.feet.map((f,i)=>[base+direction*f.station,f.height,z+(entering?(i?12:-12):(i?-12:12))]as Vec3)as[Vec3,Vec3],supports=q.feet.map(f=>f.planted?'floor':null)as ['floor'|null,'floor'|null];
 const height=q.height;
 const centre=mix(-.3,q.pitch,q.envelope),left=runningUpperArm(centre,-q.armSwing,spatialCatRunArm.upper,spatialCatRunArm.backDepth,spatialCatRunArm.referenceSwing),right=runningUpperArm(centre,q.armSwing,spatialCatRunArm.upper,spatialCatRunArm.backDepth,spatialCatRunArm.referenceSwing);
 const body=pitchedFrame([base+direction*q.station,height,z],yaw,q.pitch),request=spatialFloorRig(body,feet,[yaw,yaw],(right-left)/2,q.elbowFlexion,(left+right)/2,mix(.18,.32,smooth(q.envelope/.3)),q.envelope);request.headPitch=-.5*q.pitch;
 if(!entering){const glance=ease(time,32.3,32.65)*(1-ease(time,33,33.35));request.headYaw=1.4*glance;request.gaze=[6*glance,3];}
 return{request,feet:supports,hands:[null,null],pelvis:false,beat:entering?(time<plan.end?'ordinary-run-entrance':'upright-hold-before-turn'):'ordinary-run-exit'};
}
export function storyRunPose(time:number){const state=storyRunState(time);return{...state,cat:buildSpatialCat(state.request),view:cameraAt(time),environmentTime:time};}
export function storyRunTravelEvents():readonly SpatialStoryEvent[]{
 const events:SpatialStoryEvent[]=[];
 for(const[id,plan]of Object.entries(storyRunPlans)){
  const entrance=id==='entrance',base=entrance?-580:-144,direction=entrance?1:-1;
  plan.tracks.forEach((track,side)=>{const z=entrance?(side?32:8):(side?-32:-8);
   for(const[index,step]of track.entries())for(const[time,station,kind]of[[step.start,step.from[0],'hind-release'],[step.end,step.to[0],'hind-land']]as const)events.push({id:`v3-run-${id}-${side}-${index}-${kind}`,time,kind,actor:`hind-${side}`,surface:'floor',point:[base+direction*station,0,z]});
  });
 }
 return events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
}
const travelEvent=(e:SpatialStoryEvent)=>e.actor.startsWith('hind-')&&e.surface==='floor'&&(e.time<5.15||e.time>=31.3);
export function storyRunEvents(){const retained=spatialStoryEvents().filter(e=>!travelEvent(e)).map(e=>e.time>=5.15&&e.time<5.45&&e.actor.startsWith('hind-')?{...e,point:storyRunState(e.time).request.feet[e.actor==='hind-0'?0:1]}:e);return[...retained,...storyRunTravelEvents()].sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));}
const oldTravelIds=new Set(spatialStoryEvents().filter(travelEvent).map(e=>e.id));
const paws=['paw-tile-01','paw-tile-02','paw-tile-03']as const;
const retained=spatialStorySoundCues.filter(c=>!oldTravelIds.has(c.eventId));
const newFootsteps=storyRunTravelEvents().filter(e=>e.kind==='hind-land').flatMap((e,i)=>{const visibility=Math.max(0,Math.min(1,(projectWorld(e.point,e.time)[0]+20)/120)),gain=.55*visibility;return gain>0?[createStorySoundCue(`paw-${e.id}`,e.id,paws[i%paws.length],e.time,gain)]:[];});
/** Existing clock/prop/chair/fright/jump/groom cues are retained exactly; only run contacts change. */
export const storyRunSoundCues=[...retained,...newFootsteps].sort((a,b)=>a.from-b.from||a.id.localeCompare(b.id));
export{soundAssets};
