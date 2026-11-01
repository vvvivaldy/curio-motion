import {Html5Audio,Sequence,staticFile}from'remotion';
import{createRemotionScene}from'../../remotion/create-scene';
import{catPictureStoryScene}from'./scene';
import{storySoundCues,soundAssets}from'./cues';
const Picture=createRemotionScene(catPictureStoryScene);
/** Same frozen vector action, recorded one-shots on Remotion's frame clock.
 * Playback/listening approval is separate from alignment and PCM checks. */
export function CatPictureStory(){return <><Picture/>{storySoundCues.map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}>
 <Html5Audio src={staticFile(soundAssets[c.asset].file)} name={c.id} volume={c.endFadeFrames?(frame=>c.gain*Math.max(0,Math.min(1,(c.durationInFrames-1-frame)/c.endFadeFrames))):c.gain}/>
 </Sequence>)}</>;}
