import {Html5Audio,Sequence,staticFile} from 'remotion';
import {createRemotionScene} from '../../remotion/create-scene';
import {confidentNeonScene,cautiousNeonScene} from './scene';
import {actingCues,soundAssets} from './cues';
import type {Performance} from './settings';
const ConfidentPicture=createRemotionScene(confidentNeonScene),CautiousPicture=createRemotionScene(cautiousNeonScene);
function Soundtrack({performance}:{performance:Performance}){return <>{actingCues[performance].map(c=><Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none" name={c.id}>
 <Html5Audio src={staticFile(soundAssets[c.asset].file)} volume={c.gain} name={c.id}/>
 </Sequence>)}</>;}
export function HumanChairNeonConfident(){return <><ConfidentPicture/><Soundtrack performance="confident"/></>;}
export function HumanChairNeonCautious(){return <><CautiousPicture/><Soundtrack performance="cautious"/></>;}
