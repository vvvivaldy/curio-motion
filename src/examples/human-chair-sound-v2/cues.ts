import {tracks,phases,humanPose} from '../human-chair/motion';
import {humanChairSettings as settings} from '../human-chair/settings';
import {soundAssets} from './assets';
export {soundAssets} from './assets';
export type SoundAsset=keyof typeof soundAssets;
export interface SoundCue{id:string;asset:SoundAsset;event:'foot-contact'|'seat-contact';time:number;contactFrame:number;from:number;durationInFrames:number;gain:number;foot?:number;trackIndex?:number}
function cue(id:string,asset:SoundAsset,event:SoundCue['event'],time:number,gain:number):SoundCue{const a=soundAssets[asset];return{id,asset,event,time,contactFrame:Math.ceil(time*settings.fps-1e-8),from:Math.round((time-a.attack)*settings.fps),durationInFrames:Math.ceil(a.duration*settings.fps),gain};}
const landings=tracks.flatMap((track,foot)=>track.map((step,trackIndex)=>({foot,trackIndex,step}))).sort((a,b)=>a.step.end-b.step.end);
const palette=['tile0','tile1','tile3','tile4','tile6','tile8'] as const;
// Same accepted contacts. Each file is a recorded SINGLE hit, never a walking loop.
export const soundCues:readonly SoundCue[]=[...landings.flatMap(({foot,trackIndex,step},index)=>{
 const x=humanPose(step.end).legs[foot].sole[0];if(x<0||x>settings.width)return[];
 return[{...cue(`step-${foot}-${trackIndex}`,palette[index%palette.length],'foot-contact',step.end,step.start>=phases.turnStart&&step.end<=phases.turnEnd ? .18 : .28),foot,trackIndex}];
}),cue('seat-contact','seat','seat-contact',phases.sitContact,.50)].sort((a,b)=>a.from-b.from||a.id.localeCompare(b.id));
