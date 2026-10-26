# Minimal TypeScript API

This is a local source API, not an npm package or an automatic scene generator. The pink-monkey example is its only visual consumer so far; a second example remains separate work.

| Import | Contract |
| --- | --- |
| `src/core/time.ts` | `clamp`, `mix`, quintic `smooth`, `tween(time, start, end)` |
| `Timeline` | Positive finite `fps`, positive safe integer `durationInFrames` |
| `evaluateFrame(timeline, pose, frame)` | Validate an integer frame in `0..durationInFrames-1`, evaluate `pose(frame/fps)`, return `{frame, time, pose}` |
| `src/core/stage.ts` | `SceneSettings`, `SceneDefinition<Pose, Drawing>`, `createPixiStage(host, scene)` |

Time is in seconds. `smooth` and `tween` hold at 0/1 outside their interval; `tween` expects finite input and `start < end`. A pose evaluator must be pure: the same time must produce the same pose regardless of seek order. No playback clock, timeline channels or action parser is introduced.

`SceneDefinition` supplies:

- `settings`: canvas width/height, background color, fps and duration. Dimensions must be positive safe integers. Settings are copied when a stage is created.
- `pose(time)`: the example's own pose evaluator; there is no prescribed skeleton or character structure.
- `createDrawing(root)`: allocate and attach Pixi display objects once, returning a typed drawing context. The stage owns their destruction.
- `draw(drawing, pose, {frame, time})`: update contours/transforms in the example's chosen layer order. Draw synchronously and clear/redraw reusable Graphics as needed; do not start a ticker or retain accumulated animation time.

Use the existing scene directly:

```ts
import { createPixiStage } from '../src/core/stage';
import { pinkMonkeyScene } from '../src/examples/pink-monkey/scene';

const stage = await createPixiStage(host, pinkMonkeyScene);
stage.draw(204); // pose(8.5), rebuilt contours, one render
stage.draw(0);   // backward seek, same output as a fresh frame 0
stage.destroy(); // once, when the owner unmounts; do not draw afterwards
```

`draw(frame)` returns the evaluated pose and marks `host.dataset.frame` only after rendering. An invalid frame throws before evaluating or drawing. `createDrawing` failures destroy the initialized stage and propagate the error. `createStage(host)` in `src/stage.ts` remains the compatible pink-monkey entry point.

The example owns anatomy, projection, supports, hands, colors, environment and all timing landmarks in `src/examples/pink-monkey/`. `pinkMonkeySettings` supplies identical dimensions/fps/duration to Pixi, the Remotion Composition and the live Player. Remotion still owns `useCurrentFrame`, async initialization/frame readiness and official `renderMedia` export.

No dependencies, raster scene inputs, second scene, hosted service or platform integration were added. The documentation GIF is an export derivative only. Original code is MIT; Remotion retains its separate license.

## Shared quality helpers

These helpers are pure TypeScript and contain no monkey dimensions, colors, timing landmarks or renderer clock. The single visual consumer remains the pink-monkey example; reuse is covered with differently sized numeric cases, not claimed as a validated second character.

| Import | Contract |
| --- | --- |
| `src/core/eye.ts` | `eyeShape({center, radius, openness, pupil})` returns the visible aperture, clipped pupil and lid path. A zero opening/width yields no visible white or pupil. All points are in the caller's chosen local space. |
| `clipConvex(subject, boundary)` | Polygon clipping against a convex boundary of either winding. Degenerate boundaries yield an empty result. |
| `src/core/contacts.ts` | `sampleStep(time, {start, end, from, to, lift, fromHeading?, toHeading?})` returns `{position, heading, planted, progress}`. Endpoints and headings hold outside the swing interval; position/lift/heading have zero endpoint velocity. Time is seconds, headings are unwrapped radians. |
| `treadPoint({origin, run, rise}, index, along)` | One horizontal tread coordinate shared by artwork and support targets; `along` is 0..1. |
| `src/core/spatial.ts` | `Frame2D {origin, scale}`, `transformPoint`, `inverseTransformPoint`; positive uniform scale. Call sites explicitly name actor, platform and camera spaces. |
| `project` / `unproject` | Orthographic yaw and its inverse with an explicit view-depth coordinate. `depthLift` defaults to 0.08; inverse projection stays defined at front/profile views. |
| `src/core/kinematics.ts` | `solveTwoBone(start, target, firstLength, secondLength, poleDirection)`; validates reachability in both directions, returns finite joints for coincident equal-length targets and collinear poles. Impossible targets throw. |

For a planted contact on a moving surface, transform its fixed surface-local point into world space, then into the view. Inverse-transform that world point into the actor frame before solving the limb. The same view transform must be applied to both the visible surface and the actor. Holding position alone is insufficient: a planted foot's heading must also hold. `sampleStep` interpolates heading only during swing.

The example's `layout.ts` owns the station dimensions and boarding slots. `motion.ts` authors two small turning steps, boarding, the moving tread frame and its tracking view. `environment.ts` draws fixed world geometry; wall fixtures inherit the wall/view transform and do not use character yaw. The stage/Remotion ownership contract is unchanged.

These are geometric building blocks, not an automatic gait or anatomy generator. The author still chooses key poses, limb shapes, staging and contact intervals, then reviews the rendered result. Future shapes can consume the same aperture/contact/frame helpers without copying this example's action timeline.
