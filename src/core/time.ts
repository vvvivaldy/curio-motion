/** Small numeric helpers; tween uses seconds and holds at either endpoint. */
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (x: number) => {
  x = clamp(x);
  return x * x * x * (10 - 15 * x + 6 * x * x);
};
export const tween = (t: number, a: number, b: number) => smooth((t - a) / (b - a));

export interface Timeline {
  readonly fps: number;
  readonly durationInFrames: number;
}

export interface FrameContext {
  readonly frame: number;
  readonly time: number;
}

export function validateTimeline(timeline: Timeline): void {
  if (!Number.isFinite(timeline.fps) || timeline.fps <= 0)
    throw new RangeError('fps must be finite and positive');
  if (!Number.isSafeInteger(timeline.durationInFrames) || timeline.durationInFrames <= 0)
    throw new RangeError('durationInFrames must be a positive safe integer');
}

/** No clock or accumulated state: seeking evaluates the requested pose directly. */
export function evaluateFrame<Pose>(timeline: Timeline, pose: (time: number) => Pose, frame: number) {
  validateTimeline(timeline);
  if (!Number.isInteger(frame) || frame < 0 || frame >= timeline.durationInFrames)
    throw new RangeError(`Frame must be an integer in 0..${timeline.durationInFrames - 1}`);
  const context: FrameContext = { frame, time: frame / timeline.fps };
  return { ...context, pose: pose(context.time) };
}

export interface TravelInterval {
  readonly start: number;
  readonly end: number;
  readonly ramp: number;
}

/** Smoothly enter/leave a constant travel speed, independent of foot swing phases. */
export function sampleTravel(time: number, {start, end, ramp}: TravelInterval): {progress: number; velocity: number} {
  const duration = end - start;
  if (![time, start, end, ramp, duration].every(Number.isFinite) || duration <= 0 || ramp <= 0 || ramp > duration / 2)
    throw new RangeError('Finite time and ordered travel bounds with 0 < ramp <= duration/2 required');
  const maximumVelocity = 1 / (duration - ramp);
  if (!Number.isFinite(maximumVelocity))throw new RangeError('Travel velocity must be representable and finite');
  if (time <= start)return {progress: 0, velocity: 0};
  if (time >= end)return {progress: 1, velocity: 0};
  // Integral of quintic smooth(u), from 0 to u. Each ramp has half its width in area.
  const integral = (u: number) => u ** 4 * (u * u - 3 * u + 2.5);
  const elapsed = time - start, remaining = end - time;
  if (elapsed < ramp) {
    const u = elapsed / ramp;
    return {progress: clamp(maximumVelocity * ramp * integral(u)), velocity: maximumVelocity * smooth(u)};
  }
  if (remaining < ramp) {
    const u = remaining / ramp;
    return {progress: clamp(1 - maximumVelocity * ramp * integral(u)), velocity: maximumVelocity * smooth(u)};
  }
  return {progress: clamp(maximumVelocity * (elapsed - ramp / 2)), velocity: maximumVelocity};
}
