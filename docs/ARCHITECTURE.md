# Architecture: what exists

Each authored example is a pure pose function plus procedural illustration/environment functions. Scene settings define its dimensions, fps and duration; the shared stage validates frames in `0..durationInFrames-1`, evaluates `t=frame/fps`, updates Graphics paths and renders once. `createStage(host)` remains the compatible pink-monkey entry point and delegates to `createPixiStage(host, pinkMonkeyScene)`. Ticker and accumulated playback state are absent.

`createRemotionScene(scene)` builds the shared component that receives `useCurrentFrame()`. The typed example registry supplies bridge instances to Composition and Player. An initialization promise belongs to the mounted component. Each frame acquires a `delayRender` handle, draws only if its effect is still current, then releases the handle. Cleanup releases obsolete handles and destroys the stage on unmount. The bridge has no character imports or fixed dimensions/fps; the caller supplies a `SceneDefinition<Pose, Drawing>`. It is not a second timeline engine.

Remotion `Composition` declares size/fps/duration. `Player` gives live seek/play; `renderMedia()` exports code frames through the official renderer. Direct Pixi preview uses the same stage and exists only as a small baseline. The movie file is never input to the composition. The reference is authoring input only.

Pink-monkey coordinates: 1280×720 canvas, local character origin at the ground/root; 3D-like numeric joints project to 2D. Visible contours are constructed anew, not rotated image parts. Body offsets affect hips and shoulders before limb solving; planted feet stay in screen/world targets. After boarding, feet remain on one horizontal tread while camera-relative station details move.

The base [local scene/time API](API.md) is in `src/core/time.ts` and `src/core/stage.ts`: easing, validated frame evaluation and a typed `SceneDefinition<Pose, Drawing>`. The example's `scene.ts` owns settings, display objects and drawing order. Remotion Composition and Player read those same settings. Anatomy, illustration, contact schedules and action timings remain in the example; the shared geometry and support helpers are described below. No timeline channels, AI backend, arbitrary-scene generator, parser, server queue, persistence, platform integration or renderer farm exists. Tests cover frame/time bounds, reusable geometry and example contact constraints. Amber provides a second visual consumer with different proportions, prop contact and composition settings; the boar tasks exercise locomotion and object handling.

Read the source in this order: motion → illustration/environment → stage → Remotion Scene/Root → render. Read [ROADMAP](ROADMAP.md) before adding abstraction.

## Shared contacts, eye geometry and spaces

The quality pass adds small pure modules for visible eye apertures/pupil clipping, step position and heading, horizontal tread targets, explicit coordinate frames and robust two-bone solving. Their API is documented in [API.md](API.md). They are exercised with arbitrary numeric layouts, not tied to one reference or action.

The pink-monkey pose now distinguishes platform-local contacts, world root/sole points and a camera view. During turning the camera is stationary: small lift/plant steps change each foot's position and heading, while grounded contacts hold. During riding the platform moves in world space and the camera follows it; station objects share one view transform. Character yaw affects the character only. The eye renderer consumes visible geometry from the shared helper instead of painting a full white ellipse and covering it with skin.

The current film is `docs/assets/demo-v5.mp4`. Preceding demo/baseline films and the unused GIF remain in the historical v1.0.0 Git snapshot; they have been removed from the maintained checkout. The code scene loads none of these movies.


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

Scene settings live in small pure per-example modules so Player, composition, direct preview and viewer metadata share the same dimensions and timebase. The old monkey settings export and `createStage(host)` alias remain. Root declares compositions through the same bridge; render selects `COMPOSITION_ID` (default `PinkMonkey`). Demo navigation stays outside core. At the second-example extraction all 288 re-exported first-film frames and 207 native comparisons matched their baseline. The robot's initial movie/GIF were `docs/assets/amber-robot.mp4` and `amber-robot.gif`.

This tests reuse of existing geometry and frame ownership rather than a new DSL. The robot reference is an original whole vector design study, not an automatic reference conversion. The [reuse report](REUSE.md) distinguishes concrete reuse, remaining example decisions and helpers that still have one visual consumer.

## Authoring and evidence, outside the scene runtime

`authoring/*.json` records whole-input provenance, observed/assumed forms, action beats, review criteria and sample frames. `scripts/review.mjs` consumes the same Remotion composition for model snapshots, blocking poses and motion-neighbor PNGs; its motion preview uses official `renderMedia`. The final pass decodes the actual full-resolution MP4, rather than reusing ideal pre-encode frames. Rendering produces pending reviews; only a subsequent explicit visual inspection can fill their observations and issue ledger. No new model backend, scene interpreter, runtime animation state or external integration is introduced.

Version 2 criteria declare stable IDs, descriptions, `required`, captured `frames` and optional relation IDs. A source-hashed `diagnosticModule` may export pure `diagnoseFrames(frames)`; the report must cover every declared relation/frame pair. Missing evidence, changed artifacts and stale source/input/plan identities are rejected. Required criteria need explicit passing observations; required diagnostic failures or actionable `needs-review` results need repair, recapture and inspection. A declared optional criterion can retain a limitation only with an explicit `limitation` verdict and a complete linked issue with matching frame evidence. A passing scalar never approves appearance or emotion. Legacy version 1 plans remain readable; they do not acquire stronger v2 evidence retrospectively.

Image/export identity includes all `src` TypeScript, package/lock files, Vite configuration and render/tools scripts. QA-policy identity separately records the review, authoring validator and diagnostics tooling. A QA-only edit does not automatically invalidate the MP4, but delivery must pass the current validator; new schema requirements may still need new evidence. Diagnostic adapters under `src` remain part of the conservative image snapshot. Plan, input manifest and ACTION hashes contribute to capture identity. These hashes establish freshness and identity, not artistic quality or permission to redistribute input.

Amber's arm now uses an explicit planar bend side and rejects wrist/extension limits. The old fixed projected pole flipped at shoulder height while the hand stayed continuous. Its can placement was also too close for a forward-pointing gripper. The corrected example reaches to a bench position within its declared limits, lifts/extends, then tips about the actual handle anchor. Gravity-driven droplets start at the actual spout. These authored choices preserve the two-pour action and rests; the new helper is independent of robot anatomy. The current film is `amber-robot-v2.mp4`; the preceding robot film and GIF remain as baselines only in the historical v1.0.0 Git snapshot. The monkey's source action and approved media are unchanged.

## Independent video trial: serious boar

`examples/serious-boar` uses the same stage, foot tracks/load transfer, planar limbs, local points and attachment anchors for a third character. The owner supplied a whole video before scene implementation, then requested a serious boar, packaged insects and a satisfied savanna snack. Its local input manifest pins the recording; the film is never runtime input and is excluded from Git/static distribution. The author interprets the video and writes TypeScript; there is no automatic upload/inference step.

`examples/scenes.ts` replaces repeated example-selection branches with a typed registry shared by direct preview, Player and compositions. Core remains free of example imports. The first boar trial introduced `withGraphicsFrame` to fix a visible nested-coordinate failure by appending one local affine matrix and restoring the parent. The boar's mouth curve is shared by illustration and food contact. Shop/savanna backgrounds and settled cart contours retain their vector Graphics between frames; backward seeking rebuilds the appropriate vectors. These are geometry caches, without rendered image frames or textures of the reference. The [trial report](https://github.com/vvvivaldy/curio-motion/blob/v1.0.0/docs/reviews/independent-boar/README.md) records repairs and limits; one new trial does not establish a generation success rate.

## Owned objects, shared surfaces and finite travel

The later shared mechanisms address defects the owner identified in that boar trial. The original beta A film remains in Git history. Fresh `serious-boar-v2` uses these helpers and has a full official 576-frame export, inspected current frame evidence and completed final/motion playback review at 1×/0.5×. The four historical reviews passed their delivery gate; that follow-up required no scene/core source change. Current evidence and style limits belong to [the A/B report](https://github.com/vvvivaldy/curio-motion/blob/v1.0.0/docs/reviews/boar-ab/README.md), not to a technical API claim or an automatic quality score.

`core/relations.ts` defines `ObjectGeometry`: an ID, local frame, named anchors and optional named rectangular regions. `objectAnchor` and `objectRegion` map them to scene coordinates. Contact, containment, ownership and selected segment-clearance checks return named observations; all operands must share one coordinate space. Crossing and degenerate segments have defined distance behavior. The author selects surfaces, tolerances and intentional overlaps; the module does not infer collision bodies or depth.

`core/objects.ts` groups art Graphics, Text labels and masks under one Container so a foreground object occludes the whole owned unit. Labels fit using actual intrinsic `Text.bounds`; mask-clipped local bounds would hide overflow. `inspectLabels` transforms intrinsic text vertices and the owner region through their actual Pixi ancestry, including text rotation, pivot, scale and skew. It checks ownership, fit and minimum size. A mask clips to the declared region, while a minimum-size failure forces a layout change. This does not choose a readable composition, wrap copy or infer which product a floating word means.

`core/limb.ts` returns a continuous tapered closed cubic contour around an authored root/joint/end, plus those same upper/lower segments for checks. Impossible zero segments and near-folded silhouettes are rejected. The helper does not choose anatomy, widths, a hand, a foot or an overlap view. `core/debug.ts` can draw the same named anchors/regions and supplied joint/trajectory paths over an inspection frame. The overlay is evidence-only and stays out of final films; a separate approximate diagnostic skeleton would not validate the drawing.

`sampleTravel` in `core/time.ts` samples normalized progress and velocity through finite smooth acceleration, constant travel and deceleration, with exact endpoint holds. It separates intended root/prop advance from individual foot swing phases. Foot tracks, bounded support shifts and reach constraints still need coordination in the example. No physics simulation or automatic motion planner is introduced.

## Local author preparation and input distribution

`scripts/create-example.mjs` writes only new files: a blank typed scene/settings, a copied whole reference and unchanged ACTION, pinned hashes/provenance, a v2 plan and explicit agent/registration instructions. It refuses overwrite, traversal and symlink escape. Registration remains a reviewable edit to the registry/metadata; the command does not interpret ACTION or produce a character. The [project-local skill](../.agents/skills/curio-authoring/SKILL.md) gives the next author control-drawing, relationship, motion and review rules without chat history.

The copied input defaults to `runtimeUsage: false` and `reference.distribution: "local-only"`. A generated ignore rule protects Git inclusion; `scripts/lib/distribution.mjs` independently reads manifests under `reference` and `authoring` and filters the exact local-only path from static distribution. It validates project-relative paths rather than matching a boar filename. Public references and generated films remain distributable under their own notices. This targeted build filter is not a general private-file scanner, and changing the manifest policy requires authorization to redistribute the input.
