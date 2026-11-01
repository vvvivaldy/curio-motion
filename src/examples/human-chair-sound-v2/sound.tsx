import {Html5Audio,Sequence,staticFile} from 'remotion';
import {humanChairScene} from '../human-chair/scene';
import {createRemotionScene} from '../../remotion/create-scene';
import {soundAssets,soundCues} from './cues';
const Visual=createRemotionScene(humanChairScene);
/** Recorded-sound variant: accepted vector picture and one Remotion clock. */
export function HumanChairSoundV2(){return <><Visual/>{soundCues.map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}>
 <Html5Audio src={staticFile(soundAssets[c.asset].file)} volume={c.gain} name={c.id}/>
 </Sequence>)}</>;}
