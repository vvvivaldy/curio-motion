import {Html5Audio, Sequence, staticFile} from 'remotion';
import {createRemotionScene} from '../../remotion/create-scene';
import {courierSoundCues, courierSoundAssets} from '../raccoon-courier/sound';
import {runPlans} from '../raccoon-courier/motion';
import {morningDeliveryScene} from './scene';
import {morningSegments} from './motion';
import {morningDeliverySettings} from './settings';

const Picture = createRemotionScene(morningDeliveryScene);
const {fps} = morningDeliverySettings;
export interface MorningSoundCue {
  id: string;
  asset: string;
  from: number;
  durationInFrames: number;
  gain: number;
  targetSeconds: number;
  sourceDurationSeconds: number;
  action: string;
  sourceCueId?: string;
  offscreen?: boolean;
  station?: number;
}
const courierOffset = morningSegments.courier.from;
const existing: MorningSoundCue[] = courierSoundCues.map(c => ({...c, id: `courier-${c.id}`, sourceCueId: c.id,
  from: courierOffset + c.from, targetSeconds: courierOffset / fps + c.targetSeconds}));

// Continue the actual exit contact plan beyond the old image-edge audio filter.
// Full recorded tails survive; distance attenuation changes gain, never run timing.
export const distantExitCues: MorningSoundCue[] = runPlans.exit.contacts
  .filter(c => c.time > runPlans.exit.start && c.station >= 1370)
  .map((contact, i) => {
    const recording = contact.side === 0 ? courierSoundAssets.shoe0 : courierSoundAssets.shoe1;
    const distance = contact.station - 1370;
    return {id: `distant-exit-${i}`, asset: `audio/sfx/courier/${recording.id}.wav`,
      from: courierOffset + Math.round((contact.time - recording.activityAnchorSeconds) * fps),
      durationInFrames: Math.ceil(recording.durationSeconds * fps), sourceDurationSeconds: recording.durationSeconds,
      targetSeconds: courierOffset / fps + contact.time, gain: .5 / (1 + (distance / 180) ** 2),
      offscreen: true, station: contact.station, action: 'Удаляющиеся шаги по деревянному полу за краем кадра'};
  });
const intro: MorningSoundCue = {id: 'intro-envelope', asset: 'audio/sfx/courier/paper-soft-brush.wav',
  from: 12, durationInFrames: Math.ceil(courierSoundAssets.settle.durationSeconds * fps),
  gain: .25, targetSeconds: .5 + courierSoundAssets.settle.activityAnchorSeconds,
  sourceDurationSeconds: courierSoundAssets.settle.durationSeconds, action: 'Короткий бумажный фоли появления векторного конверта'};
export const morningSoundCues = [intro, ...existing, ...distantExitCues].sort((a, b) => a.from - b.from);

export function MorningDelivery() {
  return <><Picture/>{morningSoundCues.map(c => <Sequence key={c.id} from={c.from}
    durationInFrames={c.durationInFrames} layout="none">
    <Html5Audio src={staticFile(c.asset)} volume={c.gain}/>
  </Sequence>)}</>;
}
