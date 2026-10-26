import { clamp, mix, smooth } from './time';
import type { Point2 } from './spatial';

/** Endpoints share one coordinate space, which can itself be a moving surface. */
export interface Step2D {
  readonly start: number;
  readonly end: number;
  readonly from: Point2;
  readonly to: Point2;
  readonly lift: number;
  /** Unwrapped radians; the caller chooses a short turn or deliberate full rotation. */
  readonly fromHeading?: number;
  readonly toHeading?: number;
}

/** Holds both endpoints exactly; zero endpoint velocity avoids lift/landing snaps. */
export function sampleStep(time: number, step: Step2D) {
  const fromHeading = step.fromHeading ?? 0, toHeading = step.toHeading ?? fromHeading;
  if (![time, step.start, step.end, step.lift, fromHeading, toHeading, ...step.from, ...step.to].every(Number.isFinite)
    || step.end <= step.start || step.lift < 0) throw new RangeError('Invalid step interval, points or lift');
  const u = clamp((time - step.start) / (step.end - step.start)), progress = smooth(u);
  const height = step.lift * 16 * u * u * (1 - u) * (1 - u);
  const position: Point2 = u === 0 ? [...step.from] : u === 1 ? [...step.to]
    : [mix(step.from[0], step.to[0], progress), mix(step.from[1], step.to[1], progress) - height];
  const heading = u === 0 ? fromHeading : u === 1 ? toHeading : mix(fromHeading, toHeading, progress);
  return { position, heading, planted: time <= step.start || time >= step.end, progress };
}

export interface Staircase2D {
  readonly origin: Point2;
  readonly run: number;
  readonly rise: number;
}

/** A horizontal tread is shared by the drawing and its contact targets. */
export function treadPoint(stairs: Staircase2D, index: number, along = 0): Point2 {
  if (!Number.isInteger(index) || !Number.isFinite(along) || along < 0 || along > 1
    || ![...stairs.origin, stairs.run, stairs.rise].every(Number.isFinite)
    || stairs.run <= 0 || stairs.rise < 0) throw new RangeError('Invalid staircase or tread position');
  return [stairs.origin[0] + (index + along) * stairs.run, stairs.origin[1] - index * stairs.rise];
}
