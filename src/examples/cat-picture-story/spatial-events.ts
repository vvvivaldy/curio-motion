/** Events derive contact points and releases from the candidate's actual pose.
 * Beat boundaries are authored; no old movie's coordinates/cue schedule are reused. */
import type {Vec3} from '../../core/spatial';
import {pointInFrame3} from '../../core/frame3';
import {spatialStoryState,spatialStoryTimes,spatialBackrestContact} from './spatial-motion';
import {spatialFloorTracks} from './spatial-travel';
export interface SpatialStoryEvent {id:string;time:number;kind:string;actor:string;surface:string;point:Vec3}
const climbStart=spatialStoryTimes.climbStart;
const boundaries=[
 ...Object.values(spatialFloorTracks).flatMap(tracks=>tracks.flatMap(track=>track.flatMap(step=>[step.start,step.end]))),
 5.15,5.28,5.30,5.43,5.85,6.07,...[2,2.42,3.8,3.85,4.5,4.98].map(t=>climbStart+t),11.15,
 11.35,11.85,11.9,12.4,12.95,22.15,22.65,23.1,23.15,23.6,24.25,25.35,25.46,27.35,
 28.35,28.65,28.7,29,30.7,30.95,31,31.25
];
export function spatialStoryEvents():readonly SpatialStoryEvent[]{
 const events:SpatialStoryEvent[]=[];
 for(const time of [...new Set(boundaries)].sort((a,b)=>a-b)){
  const before=spatialStoryState(time-1e-7),after=spatialStoryState(time+1e-7),at=spatialStoryState(time);
  for(const part of ['feet','hands']as const)for(const side of[0,1]as const){
   const old=before[part][side],next=after[part][side];if(old===next)continue;
   const hind=part==='feet',actor=`${hind?'hind':'fore'}-${side}`,point=at.request[hind?'feet':'hands'][side];
   if(old)events.push({id:`v2-${actor}-${time}-release`,time,kind:`${hind?'hind':'fore'}-release`,actor,surface:old,point});
   if(next)events.push({id:`v2-${actor}-${time}-contact`,time,kind:hind?'hind-land':next==='chair-edge'?'fore-grip':'fore-land',actor,surface:next,point});
  }
  if(!before.pelvis&&after.pelvis)events.push({id:`v2-pelvis-${time}`,time,kind:'pelvis-seat',actor:'pelvis',surface:'seat',point:pointInFrame3(at.request.body,[0,-16,12])});
 }
 events.push({id:'v2-backrest-contact',time:13.35,kind:'body-backrest',actor:'torso',surface:'backrest',point:spatialBackrestContact(13.35).point});
 for(const[time,kind]of[[29.45,'groom-cheek-start'],[30.35,'groom-chest']]as const){const r=spatialStoryState(time).request;events.push({id:`v2-${kind}`,time,kind,actor:'fore-0',surface:kind==='groom-chest'?'chest':'cheek',point:pointInFrame3(r.handFrames![0],[5,4,10])});}
 return events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
}
