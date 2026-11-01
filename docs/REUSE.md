# Reuse evidence and its limits

The original reuse extraction compared two authored characters. Amber is a compact garden robot that takes a watering can, pours twice with a pause, returns the can to its bench contact, releases and holds. The preserved pink monkey walks, turns, boards an escalator and scratches its nose. The later boar task and fresh A/B implementation are described below. These are code-authored examples, not an automatic generation service or a benchmark success rate.

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

Before this pass, the Remotion component closed over the monkey stage, size and background; Player and the render script also selected that example directly. `src/remotion/create-scene.tsx` now builds the same asynchronous frame/cleanup bridge from any typed scene. The compositions use it. Player derives fps, duration and aspect ratio from the selected scene settings; `COMPOSITION_ID` selects an official export. The demo registry, metadata and navigation remain outside the reusable core.

No anatomy or action constants were found in the existing numeric core that required a new abstraction. The new example consumes those functions directly. This is why the pass adds a shared render bridge rather than another modelling language, rig system, event framework or timeline engine.

## What stays authored

Casing shapes, grippers, proportions, palettes, bench/plant layout, exact timing and the finite analytic water trajectory belong to the robot example. The reference is an original whole vector design study created before the animation source; it is not a network-generated image or a render of the finished film. This pass tests reuse of the animation API, not automatic interpretation of arbitrary artwork.

At the second-example extraction, a stationary watering action did not provide a second visual test for `sampleFootsteps`, `fitVerticalShift` or the staircase helpers. The later boar task exercises walking/support constraints; solid stairs still have only the monkey as a visual consumer. Water is an authored analytic trajectory, not a fluid simulation. Concrete reuse does not establish universal anatomy, arbitrary-object collision handling or general scene generation.

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

## Independent third trial

The owner later supplied a whole shop video and a replacement action before implementation. `serious-boar` reuses the scene/Remotion bridge, time helpers, `sampleFootsteps`, `supportBalance`, planar IK, `localPoint` and `attachAnchor` for walking, a cart grip and snacks. It imports no other example's anatomy or artwork. Its package illustrations exposed an actual missing drawing utility: nested Graphics transforms changed the parent translation. The shared `withGraphicsFrame` fixes that composition; generic nested-coordinate/error-cleanup tests accompany real repaired frames. The demo registry now supplies all rendering entry points from one scene entry.

The boar's contours, proportions, gait schedule, smile, mouth curve, cargo layout and snack trajectory still require authoring. This trial demonstrates reuse on one independently supplied task and records several manual repairs; it does not establish automatic video reconstruction, universal physical motion or a success rate. See the [trial report](reviews/independent-boar/README.md).

## Shared improvements after the owner's visual review

The owner rejected important parts of the first boar result despite passing technical checks: labels appeared detached from their packages, seated limbs were unclear and the requested satisfaction did not read. A is preserved as the comparison baseline. The response is a set of general contracts plus stricter visible evidence, not boar-specific fixes hidden in core.

| Shared mechanism | Concrete consumer/evidence | Remaining author responsibility |
| --- | --- | --- |
| `ObjectGeometry` and named anchors/regions | Fresh B declares package/hand/food/support relationships in the same geometry its drawing uses. Pure checks cover transformed anchors, containment and selected segment clearances. | Choose actual surfaces, common space, tolerances, layers and which projected overlaps are intentional. |
| `createIllustratedObject` | B package art, labels and masks share an owner/depth unit. Browser fixtures check real measured Text fit, mask clipping, owner occlusion, reparenting and transformed label vertices. | Draw recognizable contents, set readable regions/minimum size and inspect normal-size typography. |
| `limbShape` | B draws continuous tapered contours from the same root/joint/end segments used for diagnostics. | Author anatomy, widths, pose, hands/feet and overlap views; a closed contour does not guarantee a good drawing. |
| `sampleTravel` | B separates actor/cart progression from per-foot swing after decoded motion showed stop/start surges. Numeric tests cover normalized progress/velocity and endpoint behavior. | Coordinate stride, body/support shift, reach and rhythm, then inspect the encoded motion. |
| `drawGeometryOverlay` | Actual B inspection frames show the drawing's anchors, regions and joint paths. | Select useful diagnostics and inspect them; keep overlays out of final media. |
| `create:example` and local authoring skill | An isolated blank starter was created through the CLI and exercised through direct Pixi/Player, including backward/random seek and play/pause. | Inspect the whole input, replace placeholders, author code and register the finished scene. A blank starter is not an artistic result. |
| v2 criteria/diagnostics and separate image/QA identities | The same local process supports frame-linked required checks, explicit optional limitations, artifact/identity rejection and QA-only changes without automatic re-export. | Actually view current evidence, record specific observations and repair required failures. |
| Manifest-driven local-only exclusion | Build filtering/tests exclude an explicitly private whole input while preserving public references and generated films. | Obtain redistribution permission and verify the built files before sharing. |

`serious-boar-v2` is a fresh authoring pass from the same whole video and unchanged ACTION, without taking A's boar source as a template. It tests whether the new tools and instructions help on a known task. Intermediate model and motion failures have been kept rather than counted as successful output. B has a full official 576-frame export and current inspected frame evidence, with final project checks and 505 native parity cases passing. The 423 old-example PNG comparisons remain equal to baseline, and the default monkey export's 288 decoded frames match v5.

B has completed agent visual review: full final and motion MP4s were inspected at normal and half speed through a narrowly scoped local playback page, alongside actual frame evidence. All four current reviews pass delivery; no scene/core source change was needed in this follow-up. [The comparison report](reviews/boar-ab/README.md) records actual playback timings, views and remaining style limits. Callback completion and geometry checks alone never establish appearance or perceived motion quality.

The new object/limb/travel helpers currently have B as their scene consumer plus dedicated numeric/browser cases. They have not been visually validated on another independently chosen task. Reusing the starter/review tools is stronger evidence for file preparation and deterministic rendering than for automatic drawing quality. Further abstraction should follow another concrete need, rather than anticipating a universal engine.
