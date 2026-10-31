import{Html5Audio,Sequence,staticFile}from'remotion';
import{createRemotionScene}from'../../remotion/create-scene';
import{catPictureStoryV3Scene}from'./scene-v3';
import{storyRunSoundCues,soundAssets}from'./run-v3';
const Picture=createRemotionScene(catPictureStoryV3Scene);
export function CatPictureStoryV3(){return<><Picture/>{storyRunSoundCues.map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}><Html5Audio src={staticFile(soundAssets[c.asset].file)} name={c.id} volume={c.endFadeFrames?(frame=>c.gain*Math.max(0,Math.min(1,(c.durationInFrames-1-frame)/c.endFadeFrames))):c.gain}/></Sequence>)}</>;}
