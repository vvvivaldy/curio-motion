/** V2 authored floor travel. World contacts and signed headings are independent of
 * the torso/head orientation; supports do not rotate with a looking-back head. */
import {sampleTravel,mix} from '../../core/time';
import {sampleFootsteps} from '../../core/gait';
import {fitPlanarPostureHeight} from '../../core/kinematics';
import type {Step2D} from '../../core/contacts';
import type {Vec3} from '../../core/spatial';
export const spatialTravel={
 entrance:{start:.4,end:5.15,ramp:.45,from:-580,to:95,heading:Math.PI/2,z:20,cadence:.18,swing:.14,lead:.15,starts:26,firstSide:0},
 exit:{start:31.3,end:34.7,ramp:.25,from:-144,to:-144-((590-117.5)/(34-31.3-.25))*(34.7-31.3-.25),heading:-Math.PI/2,z:-20,cadence:.17,swing:.13,lead:.14,starts:19,firstSide:1},
} as const;
export type SpatialTravelId=keyof typeof spatialTravel;
const location=(id:SpatialTravelId,t:number)=>{const q=spatialTravel[id];return mix(q.from,q.to,sampleTravel(t,q).progress);};
function makeTracks(id:SpatialTravelId):[Step2D[],Step2D[]]{
 const q=spatialTravel[id],tracks:[Step2D[],Step2D[]]=[[],[]];
 for(const side of [0,1] as const){let from:[number,number]=[q.from+(id==='entrance'?(side?-10:10):0),0];
  const starts=Array.from({length:q.starts},(_,i)=>q.start+.1+i*q.cadence).filter((_,i)=>i%2===(side===q.firstSide?0:1));
  for(const[index,start]of starts.entries()){
   const end=start+q.swing,last=index===starts.length-1,to:[number,number]=[last?q.to+(id==='entrance'?(side?-10:10):0):location(id,end+q.lead),0];
   tracks[side].push({start,end,from,to,lift:12,fromHeading:q.heading,toHeading:q.heading});from=to;
  }
 }
 return tracks;
}
export const spatialFloorTracks={entrance:makeTracks('entrance'),exit:makeTracks('exit')};
export function spatialWalkAt(id:SpatialTravelId,time:number){
 const q=spatialTravel[id],samples=spatialFloorTracks[id].map(track=>sampleFootsteps(time,track,.02));
 const x=location(id,time),speed=sampleTravel(time,q).velocity*(q.end-q.start-q.ramp),direction=id==='entrance'?1:-1;
 // +X anatomical left: yaw+PI/2 puts it at lower worldZ; yaw-PI/2 at higherZ.
 const zs:[number,number]=id==='entrance'?[q.z-12,q.z+12]:[q.z+12,q.z-12];
 const feet=samples.map((s,i)=>[s.position[0],-s.position[1],zs[i]] as Vec3) as [Vec3,Vec3];
 const desired=57-7*speed-1.2*Math.max(...samples.map(s=>s.compression))*speed;
 // The existing planar helper uses screen-Y down; adapt world-Y up explicitly.
 const shift=fitPlanarPostureHeight(feet.map(p=>({root:[x,-desired],target:[p[0],-p[1]-8],upper:30,lower:27,minFlexion:.10,maxFlexion:2.65})),0);
 const swing=Math.max(-.3,Math.min(.3,direction*(feet[0][0]-feet[1][0])/55*.3))*speed;
 return{hips:[x,desired-shift,q.z] as Vec3,yaw:q.heading,pitch:.06*speed,feet,footYaw:[q.heading,q.heading] as const,
  swing,supports:samples.map(s=>s.planted?'floor':null),velocity:sampleTravel(time,q).velocity*(q.to-q.from),speed};
}
export function spatialFloorEvents(){return(['entrance','exit']as const).flatMap(id=>spatialFloorTracks[id].flatMap((track,side)=>{
 const q=spatialTravel[id],z=id==='entrance'?q.z+(side?12:-12):q.z+(side?-12:12);
 return track.flatMap((step,index)=>[{id:`${id}-${side}-${index}-release`,time:step.start,kind:'hind-release',point:[step.from[0],0,z]as Vec3,actor:`hind-${side}`,surface:'floor'},
 {id:`${id}-${side}-${index}-land`,time:step.end,kind:'hind-land',point:[step.to[0],0,z]as Vec3,actor:`hind-${side}`,surface:'floor'}]);
}));}
