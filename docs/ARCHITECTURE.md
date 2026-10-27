# Architecture: what exists

Each of the two examples is a pure pose function plus procedural illustration/environment functions. `createStage(host)` delegates to the shared `createPixiStage(host, pinkMonkeyScene)`, awaits Pixi initialization and returns `draw(frame)`/`destroy()`. Draw validates each scene's integer frame range through `evaluateFrame` (0..287 or 0..299), evaluates `t=frame/fps`, rebuilds Graphics paths and renders once. Ticker and accumulated playback state are absent.

`createRemotionScene(scene)` builds the shared component that receives `useCurrentFrame()`. Both `MonkeyScene` and `RobotScene` are typed instances of that bridge. An initialization promise belongs to the mounted component. Each frame acquires a `delayRender` handle, draws only if its effect is still current, then releases the handle. Cleanup releases obsolete handles and destroys the stage on unmount. The bridge has no character imports or fixed dimensions/fps; the caller supplies a `SceneDefinition<Pose, Drawing>`. It is not a second timeline engine.

Remotion `Composition` declares size/fps/duration. `Player` gives live seek/play; `renderMedia()` exports code frames through the official renderer. Direct Pixi preview uses the same stage and exists only as a small baseline. The movie file is never input to the composition. The reference is authoring input only.

Pink-monkey coordinates: 1280×720 canvas, local character origin at the ground/root; 3D-like numeric joints project to 2D. Visible contours are constructed anew, not rotated image parts. Body offsets affect hips and shoulders before limb solving; planted feet stay in screen/world targets. After boarding, feet remain on one horizontal tread while camera-relative station details move.

The base [local scene/time API](API.md) is in `src/core/time.ts` and `src/core/stage.ts`: easing, validated frame evaluation and a typed `SceneDefinition<Pose, Drawing>`. The example's `scene.ts` owns settings, display objects and drawing order. Remotion Composition and Player read those same settings. Anatomy, illustration, contact schedules and action timings remain in the example; the shared geometry and support helpers are described below. No timeline channels, AI backend, arbitrary-scene generator, parser, server queue, persistence, platform integration or renderer farm exists. Tests cover frame/time bounds, both examples and their contact constraints. Amber provides a second visual consumer with different proportions, prop contact and composition settings.

Read the source in this order: motion → illustration/environment → stage → Remotion Scene/Root → render. Read [ROADMAP](ROADMAP.md) before adding abstraction.

## Shared contacts, eye geometry and spaces

The quality pass adds small pure modules for visible eye apertures/pupil clipping, step position and heading, horizontal tread targets, explicit coordinate frames and robust two-bone solving. Their API is documented in [API.md](API.md). They are exercised with arbitrary numeric layouts, not tied to one reference or action.

The pink-monkey pose now distinguishes platform-local contacts, world root/sole points and a camera view. During turning the camera is stationary: small lift/plant steps change each foot's position and heading, while grounded contacts hold. During riding the platform moves in world space and the camera follows it; station objects share one view transform. Character yaw affects the character only. The eye renderer consumes visible geometry from the shared helper instead of painting a full white ellipse and covering it with skin.

The current film is `docs/assets/demo-v5.mp4`; `demo-v2.mp4`, `demo-v3.mp4` and `demo-v4.mp4` preserve preceding quality passes; `demo.gif` is a documentation derivative. `demo.mp4` and `baseline.mp4` retain the original beta visuals. None of these media files is loaded by the code scene.


## Gait and body support

`core/gait.ts` samples authored per-foot contact sequences, including unloading before lift and weight acceptance after landing. The same functions serve approach, turning and boarding. They return support weights and geometric phases; anatomy, stance width, stride length, style and projected approach remain example decisions in `steps.ts`/`motion.ts`. No procedural walking service or dynamics engine is claimed.

The approach now has separate contact, lift/pass, heel landing and settle poses. Floor contacts advance from y=608 to 650 while the body scale advances from 0.82 to 1 on the same path. The floor extends behind those contacts. Body translation follows the support distribution, and the shared vertical reach intersection reserves some knee bend without changing bone lengths. The foot drawing and IK share a heel/toe pivot placement. The Pixi contour transform order is checked visually against that placement. Landing compression has a finite duration; the settled body has no periodic idle motion. Delayed arms, bag and tail are driven by the actual footfall sequence.

The original example, reference and earlier quality movie are retained. The stage, Remotion ownership, duration and rendering pipeline are unchanged.


## Compatible contours and anchored gestures

`core/contour.ts` provides closed cubic contours with named segment correspondence, interpolation, mapping and curve anchors. `LocalFrame2D` in `spatial.ts` places those contours using a wrist/segment frame; `attachAnchor` places a chosen contour point on its contact target. `core/gesture.ts` supplies a finite out-and-back excursion. These are small authoring tools, not a hand rig, automatic topology matcher or dynamics engine.

The example owns the relaxed/gathered/pointing forms in `hands.ts` and action landmarks in `gesture.ts`. Pose evaluates the gesture, derives wrist orientation from the forearm with an authored bend, places the fingertip, then solves the arm. Both visible hands use the compatible contour path. The illustration draws the supplied contour/creases and does not derive hand phases from absolute time. The actual nose front in `face.ts` is shared by the face drawing and contact target; no approximate duplicate nose formula is used.

Two excursions move the fingertip along that surface and return, separated by still holds. Withdrawal, finger folding and lowering have separate phases. The previous gait/body/support samples remain exactly unchanged; hand shape changes are intentional. The stage and Remotion frame/export ownership remain unchanged.

## Authored volume and opaque scenery

The fourth quality package reuses semantic cubic contours through `core/views.ts`: ordered whole views are sampled with exact endpoint holds and smooth transitions. The example owns front/¾/profile cranium, near ear, muzzle, torso, belly and bag forms in `model.ts`, plus complete foot forms in `feet.ts`. Ear roots and the actual head boundary share geometry in front views; the profile draws the revealed cup over the cranium. The model affects illustration only. All 575 sampled full action poses, including hands, legs, camera and supports, remain exactly equal to the preceding version.

`core/stair-solid.ts` builds tread/riser and panel polygons from the existing shared rise/run/origin. The environment fills the rear balustrade, undercarriage and low near apron opaquely. The undercarriage begins at the projected rear edge, closing the triangular gaps that a front-edge-only fill left behind the treads. It does not hide the occupied contact edge. The current film is `docs/assets/demo-v5.mp4`; all preceding films remain available. The reference stays whole and is never a scene texture.

## Second consumer: Amber robot

`examples/amber-robot` owns the whole casing/jaw/can contours, dimensions, pure action timing, fixed supports, bench/plant and finite analytic droplets. It imports shared time, excursion, view/contour, eye, coordinate/anchor, IK and support helpers; it imports no monkey source or assets. Gripper, can base and spout targets are points on the actual drawn curves. A pickup hold precedes lifting; leveling/landing precedes release; two pours have finite lifetimes and a quiet gap.

Scene settings live in small pure per-example modules so Player, composition, direct preview and viewer metadata share the same dimensions and timebase. The old monkey settings export and `createStage(host)` alias remain. Root declares two compositions through the same bridge; render selects `COMPOSITION_ID` (default `PinkMonkey`). Demo navigation is a two-entry module outside core. The first movie/GIF are unchanged; all 288 re-exported first-film frames and 207 native comparisons match their baseline. The new movie/GIF are `docs/assets/amber-robot.mp4` and `amber-robot.gif`.

This tests reuse of existing geometry and frame ownership rather than a new DSL. The robot reference is an original whole vector design study, not an automatic reference conversion. The [reuse report](REUSE.md) distinguishes concrete reuse, remaining example decisions and helpers that still have one visual consumer.

## Authoring and evidence, outside the scene runtime

`authoring/*.json` records whole-input provenance, observed/assumed forms, action beats, review criteria and sample frames. `scripts/review.mjs` consumes the same Remotion composition for model snapshots, blocking poses and motion-neighbor PNGs; its motion preview uses official `renderMedia`. The final pass decodes the actual full-resolution MP4, rather than reusing ideal pre-encode frames. `scripts/lib/authoring.mjs` validates plans/reviews and hashes source/input/artifacts. Rendering produces pending reviews; only a subsequent explicit visual inspection can fill their observations and issue ledger. The final check verifies evidence freshness and recorded decisions, not artistic quality by algorithm. No new model backend, scene interpreter, runtime animation state or external integration is introduced.

Amber's arm now uses an explicit planar bend side and rejects wrist/extension limits. The old fixed projected pole flipped at shoulder height while the hand stayed continuous. Its can placement was also too close for a forward-pointing gripper. The corrected example reaches to a bench position within its declared limits, lifts/extends, then tips about the actual handle anchor. Gravity-driven droplets start at the actual spout. These authored choices preserve the two-pour action and rests; the new helper is independent of robot anatomy. The current film is `amber-robot-v2.mp4`; the preceding `amber-robot.mp4` and `amber-robot-v1.gif` remain as baseline. The monkey's source action and approved media are unchanged.
