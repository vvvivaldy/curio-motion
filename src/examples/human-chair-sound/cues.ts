import {tracks,phases,humanPose} from '../human-chair/motion';
import {humanChairSettings as settings} from '../human-chair/settings';

// Authored local SOUND trial. Assets are original offline procedural WAVs.
// Read actual contact landmarks; never emit sound as a side effect of pose/draw.
export const soundAssets={
 step1:{file:'step-hard-01.wav',duration:0.22,attack:0.006020833333333334},
 step2:{file:'step-hard-02.wav',duration:0.224,attack:0.006020833333333334},
 step3:{file:'step-hard-03.wav',duration:0.216,attack:0.006020833333333334},
 seat:{file:'seat-soft-01.wav',duration:0.4,attack:0.010020833333333333},
 creak:{file:'chair-load-01.wav',duration:0.46,attack:0.012020833333333333},
} as const;
export type SoundAsset=keyof typeof soundAssets;
export interface SoundCue{id:string;asset:SoundAsset;event:'foot-contact'|'seat-contact'|'seat-release';time:number;contactFrame:number;from:number;durationInFrames:number;gain:number;foot?:number;trackIndex?:number}
function cue(id:string,asset:SoundAsset,event:SoundCue['event'],time:number,gain:number):SoundCue{
 const a=soundAssets[asset],from=Math.round((time-a.attack)*settings.fps);
 return{id,asset,event,time,contactFrame:Math.ceil(time*settings.fps-1e-8),from,durationInFrames:Math.ceil(a.duration*settings.fps),gain};
}
const landings=tracks.flatMap((track,foot)=>track.map((step,trackIndex)=>({foot,trackIndex,step}))).sort((a,b)=>a.step.end-b.step.end);
export const soundCues:readonly SoundCue[]=[
 ...landings.flatMap(({foot,trackIndex,step},index)=>{
  const p=humanPose(step.end),x=p.legs[foot].sole[0];
  // Foot outside the authored frame has no visible strike in this small trial.
  if(x<0||x>settings.width)return[];
  const asset=(['step1','step2','step3'] as const)[index%3];
  return[{...cue(`step-${foot}-${trackIndex}`,asset,'foot-contact',step.end,step.start>=phases.turnStart&&step.end<=phases.turnEnd ? .36 : .56),foot,trackIndex}];
 }),
 cue('seat-contact','seat','seat-contact',phases.sitContact,.60),
 // Optional chair-load WAV is retained in the asset manifest, deliberately unscheduled
 // until an actual listener approves its character. No sound on release in this draft.
].sort((a,b)=>a.from-b.from||a.id.localeCompare(b.id));
