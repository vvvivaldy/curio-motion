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
