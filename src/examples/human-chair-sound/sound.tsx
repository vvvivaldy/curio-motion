import {Html5Audio,Sequence,staticFile} from 'remotion';
import {humanChairScene} from '../human-chair/scene';
import {createRemotionScene} from '../../remotion/create-scene';
import {soundAssets,soundCues} from './cues';
const Visual=createRemotionScene(humanChairScene);
/** Opt-in soundtrack over the accepted visual scene. Remotion owns both clocks. */
export function HumanChairSound(){return <><Visual/>{soundCues.map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}>
 <Html5Audio src={staticFile(`audio/human-chair/${soundAssets[c.asset].file}`)} volume={c.gain} name={c.id}/>
 </Sequence>)}</>;}
