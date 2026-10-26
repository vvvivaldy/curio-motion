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

No dependencies, raster assets, second scene, hosted service or platform integration were added. Original code is MIT; Remotion retains its separate license.
