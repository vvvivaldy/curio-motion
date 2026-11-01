import {evaluateFrame,tween} from '../../core/time';
import {raccoonPose} from '../raccoon-courier/motion';
import {raccoonCourierSettings} from '../raccoon-courier/settings';
import {infographicPose} from '../delivery-infographic/motion';
import {deliveryInfographicSettings} from '../delivery-infographic/settings';
import {deliveryData} from '../delivery-infographic/data';
import {morningDeliverySettings} from './settings';

export const morningSegments = {
  intro: {from: 0, frames: 72},
  courier: {from: 72, frames: 384},
  bridge: {from: 456, frames: 48},
  infographic: {from: 504, frames: 288},
  outro: {from: 792, frames: 72},
} as const;
export type MorningSegment = keyof typeof morningSegments;
export const morningFadeFrames = 8;

const {fps,durationInFrames} = morningDeliverySettings;
type CourierSample = ReturnType<typeof evaluateFrame<ReturnType<typeof raccoonPose>>>;
type InfographicSample = ReturnType<typeof evaluateFrame<ReturnType<typeof infographicPose>>>;
export interface MorningDeliveryPose {
  readonly frame: number;
  readonly time: number;
  readonly segment: MorningSegment;
  readonly localFrame: number;
  readonly localTime: number;
  readonly opacity: number;
  readonly envelopeProgress: number;
  readonly courier: CourierSample | null;
  readonly infographic: InfographicSample | null;
  readonly total: number;
}

/** Fixed authored seconds, one output frame clock; child samples never escape their span. */
export function morningDeliveryPose(time: number): MorningDeliveryPose {
  if (!Number.isFinite(time) || time < 0 || time > (durationInFrames - 1) / fps)
    throw new RangeError('MorningDelivery time must lie within its finite frame range');
  const frame = Math.round(time * fps);
  return evaluateFrame(morningDeliverySettings, () => {
    const segment = (Object.keys(morningSegments) as MorningSegment[]).find(name => {
      const span = morningSegments[name];
      return frame >= span.from && frame < span.from + span.frames;
    })!;
    const span = morningSegments[segment];
    const localFrame = frame - span.from, localTime = localFrame / fps;
    const fadeIn = tween(localTime, 0, morningFadeFrames / fps);
    const fadeOut = 1 - tween(localTime, (span.frames - 1 - morningFadeFrames) / fps, (span.frames - 1) / fps);
    return {
      frame, time: frame / fps, segment, localFrame, localTime,
      opacity: segment === 'outro' || segment === 'infographic' ? fadeIn : fadeIn * fadeOut,
      envelopeProgress: segment === 'intro' ? tween(localTime, 0, 16 / fps) : 1,
      courier: segment === 'courier' ? evaluateFrame(raccoonCourierSettings, raccoonPose, localFrame) : null,
      infographic: segment === 'infographic' ? evaluateFrame(deliveryInfographicSettings, infographicPose, localFrame) : null,
      total: deliveryData.total,
    };
  }, frame).pose;
}
