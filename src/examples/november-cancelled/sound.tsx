import {Html5Audio, staticFile} from 'remotion';
import {createRemotionScene} from '../../remotion/create-scene';
import {scene} from './reel';

const Picture = createRemotionScene(scene);

export function NovemberCancelled() {
  return <><Picture/><Html5Audio src={staticFile('audio/november-cancelled/english.flac')}/></>;
}
