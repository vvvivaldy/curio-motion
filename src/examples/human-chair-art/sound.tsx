import {Html5Audio,Sequence,staticFile} from 'remotion';
import {createRemotionScene} from '../../remotion/create-scene';
import {humanChairInkScene} from './ink';
import {humanChairPaperScene} from './paper';
// Exact accepted recorded SoundV2 selections and event schedule, no copied table.
import {soundAssets,soundCues} from '../human-chair-sound-v2/cues';
const InkVisual=createRemotionScene(humanChairInkScene),PaperVisual=createRemotionScene(humanChairPaperScene);
function RecordedAudio(){return <>{soundCues.map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}>
 <Html5Audio src={staticFile(soundAssets[c.asset].file)} volume={c.gain} name={c.id}/>
 </Sequence>)}</>;}
export function HumanChairInk(){return <><InkVisual/><RecordedAudio/></>;}
export function HumanChairPaper(){return <><PaperVisual/><RecordedAudio/></>;}
