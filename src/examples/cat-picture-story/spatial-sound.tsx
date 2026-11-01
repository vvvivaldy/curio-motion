import {Html5Audio,Sequence,staticFile}from'remotion';
import{createRemotionScene}from'../../remotion/create-scene';
import{catPictureStoryV2Scene}from'./spatial-scene';
import{spatialStorySoundCues as storySoundCues,soundAssets}from'./spatial-cues';
const Picture=createRemotionScene(catPictureStoryV2Scene);
/** Same frozen vector action, recorded one-shots on Remotion's frame clock.
 * Playback/listening approval is separate from alignment and PCM checks. */
export function CatPictureStoryV2(){return <><Picture/>{storySoundCues.map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}>
 <Html5Audio src={staticFile(soundAssets[c.asset].file)} name={c.id} volume={c.endFadeFrames?(frame=>c.gain*Math.max(0,Math.min(1,(c.durationInFrames-1-frame)/c.endFadeFrames))):c.gain}/>
 </Sequence>)}</>;}
