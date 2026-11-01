import {actingTracks,actingPose} from './acting';
import {actingSettings,actingTimeline,type Performance} from './settings';
import {soundAssets} from '../human-chair-sound-v2/assets';
import type {SoundCue,SoundAsset} from '../human-chair-sound-v2/cues';
export {soundAssets} from '../human-chair-sound-v2/assets';
const palette=['tile0','tile1','tile3','tile4','tile6','tile8'] as const;
/** New events come from each performance's actual tracks/seat moment. The
 * accepted recorded single hits retain natural duration, pitch and gain. */
export function performanceCues(performance:Performance):readonly SoundCue[]{
 const settings=actingSettings(performance),beat=actingTimeline[performance];
 const cue=(id:string,asset:SoundAsset,event:SoundCue['event'],time:number,gain:number):SoundCue=>{
  const a=soundAssets[asset];return{id,asset,event,time,gain,contactFrame:Math.ceil(time*settings.fps-1e-8),from:Math.round((time-a.attack)*settings.fps),durationInFrames:Math.ceil(a.duration*settings.fps)};
 };
 const landings=actingTracks[performance].flatMap((track,foot)=>track.map((step,trackIndex)=>({foot,trackIndex,step}))).sort((a,b)=>a.step.end-b.step.end);
 return[...landings.map(({foot,trackIndex,step},index)=>{
  const sole=actingPose(step.end,performance).legs[foot].sole;
  if(sole[0]<0||sole[0]>settings.width)throw Error('Declared new contact outside picture');
  return{...cue(`step-${foot}-${trackIndex}`,palette[index%palette.length],'foot-contact',step.end,step.start>=beat.turnStart?.18:.28),foot,trackIndex};
 }),cue('seat-contact','seat','seat-contact',beat.seatContact,.5)].sort((a,b)=>a.from-b.from||a.id.localeCompare(b.id));
}
export const actingCues={confident:performanceCues('confident'),cautious:performanceCues('cautious')};
