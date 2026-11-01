import{storyEvents,storyTimes}from'./motion';
import{clockEvents,frameEvents,frameTimes,backrestTimes}from'./environment';
import{catPictureStorySettings as settings}from'./settings';
import{projectWorld}from'./environment';
import{soundAssets,type SoundAsset}from'./audio-assets';
export{soundAssets}from'./audio-assets';
export interface StorySoundCue{readonly id:string;readonly eventId:string;readonly asset:SoundAsset;readonly time:number;readonly eventFrame:number;readonly from:number;readonly durationInFrames:number;readonly gain:number;readonly technicalAnchor:number;readonly alignmentErrorSeconds:number;readonly endFadeFrames:number}
const fps=settings.fps,frames=settings.durationInFrames;
function cue(id:string,eventId:string,asset:SoundAsset,time:number,gain:number):StorySoundCue{const a=soundAssets[asset],from=Math.round((time-a.technicalAnchor)*fps),durationInFrames=Math.min(Math.ceil(a.duration*fps),frames-from),cut=durationInFrames<Math.ceil(a.duration*fps);if(from<0||durationInFrames<=0||gain<=0||gain>1)throw Error('Invalid authored sound cue');return{id,eventId,asset,time,eventFrame:Math.ceil(time*fps-1e-8),from,durationInFrames,gain,technicalAnchor:a.technicalAnchor,alignmentErrorSeconds:from/fps+a.technicalAnchor-time,endFadeFrames:cut?Math.min(2,durationInFrames):0};}
const events=storyEvents(),paws=['paw-tile-01','paw-tile-02','paw-tile-03']as const;
const cues:StorySoundCue[]=clockEvents().map(e=>cue(e.id,e.id,e.kind==='tick'?'clock-tick':'clock-tock',e.time,.22));
const floorTimes=new Set<number>(),seatTimes=new Set<number>();let pawIndex=0;
for(const e of events){
 if(e.kind==='hind-land'&&e.surface==='floor'&&!floorTimes.has(e.time)){floorTimes.add(e.time);const walking=e.id.startsWith('entrance')||e.id.startsWith('exit'),visibility=walking?Math.max(0,Math.min(1,(projectWorld(e.point,e.time)[0]+20)/120)):1,gain=(e.time===storyTimes.hindLanding?.85:walking?.55:.42)*visibility;if(gain>0)cues.push(cue(`paw-${e.id}`,e.id,paws[pawIndex++%paws.length],e.time,gain));}
 if(e.kind==='fore-land'&&e.surface==='floor'&&e.actor==='fore-0')cues.push(cue(`paw-${e.id}`,e.id,'paw-tile-02',e.time,.70));
 if(e.kind==='hind-land'&&e.surface==='seat'&&!seatTimes.has(e.time)){seatTimes.add(e.time);cues.push(cue(`wood-${e.id}`,e.id,'frame-impact',e.time,.10));}
 if(e.kind==='fore-grip'&&e.actor==='fore-0')cues.push(cue(`wood-${e.id}`,e.id,'frame-impact',e.time,.09));
 if(e.kind==='pelvis-seat')cues.push(cue('chair-pelvis',e.id,'chair-creak',e.time,.35));
 if(e.kind==='body-backrest')cues.push(cue('chair-backrest',e.id,'chair-creak',e.time,.22));
}
cues.push(cue('wall-tap','backrest-wall-43','frame-impact',backrestTimes.wallContact,.20),cue('frame-edge-slip','frame-edge-slip','frame-slide',backrestTimes.edgeSlip,.70),cue('frame-release','frame-release','frame-slide',frameTimes.release,.85),cue('cat-fright','fear-onset','cat-hiss',storyTimes.fearOnset,.70));
for(const e of frameEvents()){
 if(e.kind==='corner-impact')cues.push(cue('frame-first-corner',e.id,'frame-impact',e.time,.90));
 if(e.kind==='far-edge-impact')cues.push(cue('frame-first-flat',e.id,'frame-bounce',e.time,.45));
 if(e.id==='frame-second-flat')cues.push(cue('frame-second-flat',e.id,'frame-impact',e.time,.12));
}
cues.push(cue('groom-cheek','groom-cheek-start','groom-rustle',29.45,.55),cue('groom-chest','groom-cheek-end','groom-rustle',30.15,.45));
/** Recorded one-shots only; never pitch/time-stretched. Quiet clock continues
 * across all shot phases. Activity alignment and gains still need listening. */
export const storySoundCues:readonly StorySoundCue[]=cues.sort((a,b)=>a.from-b.from||a.id.localeCompare(b.id));
