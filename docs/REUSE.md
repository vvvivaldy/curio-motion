# Reuse evidence: two authored characters

Amber is a compact garden robot that takes a watering can, pours twice with a pause, returns the can to its bench contact, releases and holds. The preserved pink monkey walks, turns, boards an escalator and scratches its nose. This second example was explicitly authorized to test API reuse; it is not an automatic generation service or a benchmark of unseen-reference reconstruction.

| Contract | Pink monkey | Amber robot |
| --- | --- | --- |
| Typed `SceneDefinition<Pose, Drawing>` | Character container and five drawing layers | Two independent Graphics layers |
| `createPixiStage` | 1280×720, 24 fps, 288 frames | 960×640, 30 fps, 300 frames |
| `createRemotionScene` | Preserved `PinkMonkey` Composition | New `AmberRobot` Composition |
| Time/easing and `excursion` | Authored walk/turn/gesture landmarks | Reach, grip, lift, two finite pours, return, release and one nod |
| `contourView` / `morphContour` | Organic whole views and hand forms | Front/¾ casing views and open/closed mechanical jaws; normalized view coordinates rather than yaw radians |
| `localPoint` / `attachAnchor` / `contourAnchor` | Wrist/fingertip to actual nose curve | Gripper to actual can-handle curve; can base to bench; water starts on actual spout curve |
| `solveTwoBone` | Long organic arms and short legs | Different limb lengths and visible mechanical joints |
| `supportBalance` | Advancing and turning foot contacts | Fixed feet, small authored load shift during reaching |
| `eyeShape` | Skin, white aperture and clipped dark pupil | Visor, light aperture and clipped green pupil |

The robot files import their own geometry/timing and `src/core` helpers. They do not import monkey illustration, anatomy, motion, hands, feet or assets. The original `createStage(host)` entry point remains a monkey convenience wrapper; the reusable entry point is `createPixiStage(host, scene)`.

## Coupling removed

Before this pass, the Remotion component closed over the monkey stage, size and background; Player and the render script also selected that example directly. `src/remotion/create-scene.tsx` now builds the same asynchronous frame/cleanup bridge from any typed scene. Both compositions use it. Player derives fps, duration and aspect ratio from the selected scene settings; `COMPOSITION_ID` selects an official export. The demo's two-entry metadata/navigation module is outside the reusable core.

No anatomy or action constants were found in the existing numeric core that required a new abstraction. The new example consumes those functions directly. This is why the pass adds a shared render bridge rather than another modelling language, rig system, event framework or timeline engine.

## What stays authored

Casing shapes, grippers, proportions, palettes, bench/plant layout, exact timing and the finite analytic water trajectory belong to the robot example. The reference is an original whole vector design study created before the animation source; it is not a network-generated image or a render of the finished film. This pass tests reuse of the animation API, not automatic interpretation of arbitrary artwork.

`sampleFootsteps`, `fitVerticalShift` and the staircase helpers remain useful to the first film; a stationary watering action does not provide a second visual test for those particular mechanisms. Water is an authored analytic trajectory, not a fluid simulation. Two characters establish concrete reuse for the functions above; they do not establish universal anatomy, arbitrary-object collision handling or general scene generation.

## Add another code scene

```ts
import { createPixiStage } from '../src/core/stage';
import { createRemotionScene } from '../src/remotion/create-scene';
import { amberRobotScene } from '../src/examples/amber-robot/scene';

const stage = await createPixiStage(host, amberRobotScene);
stage.draw(120); // 4 seconds in this scene
stage.draw(0);   // backward seek
stage.destroy();

const RobotComposition = createRemotionScene(amberRobotScene);
// Register with Remotion Composition using this scene's width/height/fps/duration.
```

The same definitions are exercised by direct Pixi, live Player and official `renderMedia`. Validation and visual evidence are recorded in [VERIFICATION](VERIFICATION.md). The first film/GIF and whole monkey reference are preserved. Windows/Linux browser rendering and any automated authoring-agent evaluation remain future work.

## Subsequent mechanics/process pass

The second example exposed a reusable planar-IK failure: a fixed projected pole can flip the elbow when the target crosses shoulder height. `solvePlanarLimb` now chooses an explicit signed planar branch and checks wrist/elbow limits. Amber uses it with a reachable prop layout and a handle pivot; the previous 3D solver and monkey remain unchanged. Both examples now also use the same [staged review tooling](AUTHORING.md), with their own input/timebase/contact criteria. This tests tooling reuse on known scenes; it is not an unseen-reference generation trial.
