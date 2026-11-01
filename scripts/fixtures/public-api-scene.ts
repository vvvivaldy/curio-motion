import { Graphics } from 'pixi.js';
import { clamp, mix, smooth, tween, validateTimeline, evaluateFrame, type Timeline, type FrameContext } from '../../src/core/time';
import { transformPoint, inverseTransformPoint, type Frame2D, type Point2 } from '../../src/core/spatial';
import { sampleStep, treadPoint, type Step2D, type Staircase2D } from '../../src/core/contacts';
import type { SceneDefinition, SceneSettings } from '../../src/core/stage';

// A small executable consumer of stable imports, independent of example internals.
export const settings: SceneSettings = { width: 180, height: 108, background: 0xf5f0e6, fps: 24, durationInFrames: 48 };
const timeline: Timeline = settings;
validateTimeline(timeline);
const stairs: Staircase2D = { origin: [20, 68], run: 120, rise: 12 };
const step: Step2D = { start: .25, end: 1.5, from: treadPoint(stairs, 0), to: treadPoint(stairs, 1), lift: 24 };
const frame: Frame2D = { origin: [0, 20], scale: 1 };
export function markerPose(time: number) {
  const contact = sampleStep(time, step);
  const point: Point2 = transformPoint(contact.position, frame);
  return { point, local: inverseTransformPoint(point, frame), progress: contact.progress, planted: contact.planted,
    radius: mix(5, 7, smooth(clamp(time))), opacity: mix(.5, 1, tween(time, 0, .25)) };
}
export const publicApiScene: SceneDefinition<ReturnType<typeof markerPose>, Graphics> = {
  settings,
  pose: markerPose,
  createDrawing(root) { const art = new Graphics(); root.addChild(art); return art; },
  draw(art, pose, context: FrameContext) {
    art.clear();
    art.rect(12, 88, 100, 3).fill(0x7a756e).rect(132, 76, 36, 3).fill(0x7a756e);
    art.circle(...pose.point, pose.radius).fill({color: 0x007d8c, alpha: pose.opacity});
    art.rect(12, 99, 156 * clamp(context.frame / (settings.durationInFrames - 1)), 2).fill(0x007d8c);
  },
};
export const sampleMarkerFrame = (frame: number) => evaluateFrame(timeline, markerPose, frame);

// Compile-only consumer failures: public readonly settings and tuple/scene shapes.
if (false) {
  // @ts-expect-error Settings cannot be mutated through the public type.
  settings.fps = 12;
  // @ts-expect-error Point2 has exactly two coordinates.
  const invalidPoint: Point2 = [1, 2, 3];
  // @ts-expect-error SceneDefinition requires a draw callback.
  const incomplete: SceneDefinition<{}, Graphics> = { settings, pose: () => ({}), createDrawing: () => new Graphics() };
  void invalidPoint; void incomplete;
}
