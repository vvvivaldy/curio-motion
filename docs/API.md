# Minimal TypeScript API

This is a local source API, not an npm package or an automatic scene generator. The registered character examples share the scene/stage/Remotion contracts; each keeps its own anatomy, staging and action timing.

| Import | Contract |
| --- | --- |
| `src/core/time.ts` | `clamp`, `mix`, quintic `smooth`, `tween(time, start, end)` |
| `Timeline` | Positive finite `fps`, positive safe integer `durationInFrames` |
| `evaluateFrame(timeline, pose, frame)` | Validate an integer frame in `0..durationInFrames-1`, evaluate `pose(frame/fps)`, return `{frame, time, pose}` |
| `src/core/stage.ts` | `SceneSettings`, `SceneDefinition<Pose, Drawing>`, `createPixiStage(host, scene)` |

Time is in seconds. `smooth` and `tween` hold at 0/1 outside their interval; `tween` expects finite input and `start < end`. A pose evaluator must be pure: the same time must produce the same pose regardless of seek order. No playback clock, timeline channels or action parser is introduced.

`sampleTravel(time, {start, end, ramp})` in `core/time.ts` returns normalized `{progress, velocity}` with velocity in progress per second. It holds at `{0, 0}` before the interval and `{1, 0}` afterward, uses quintic smooth velocity ramps of `ramp` seconds at each end, and keeps constant speed `1 / (end - start - ramp)` between them. Inputs must be finite, `start < end`, and `0 < ramp <= (end - start) / 2`, with finite representable duration and speed. Multiply progress by an authored distance to advance a root or prop independently of foot swing phases; foot contacts and anatomy still require their own constraints. Sampling is pure and supports arbitrary seek order.


`SceneDefinition` supplies:

- `settings`: canvas width/height, background color, fps and duration. Dimensions must be positive safe integers. Settings are copied when a stage is created.
- `pose(time)`: the example's own pose evaluator; there is no prescribed skeleton or character structure.
- `createDrawing(root)`: allocate and attach Pixi display objects once, returning a typed drawing context. The stage owns their destruction.
- `draw(drawing, pose, {frame, time})`: update contours/transforms in the example's chosen layer order. Draw synchronously and clear/redraw reusable Graphics as needed; do not start a ticker or retain accumulated animation time.

The pose need not describe a character. For a chart it can hold bar heights, text opacity and a brief highlight; use the same scene contract with Pixi `Graphics`/`Text` and existing time easing. Keep one zero baseline and linear data scale, reveal summaries after growth, and hold the final pose long enough to read.

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

The example chooses anatomy, coordinate spaces, contact schedules, hands, colors, environment and all timing landmarks in `src/examples/pink-monkey/`. `pinkMonkeySettings` supplies identical dimensions/fps/duration to Pixi, the Remotion Composition and the live Player. Remotion still owns `useCurrentFrame`, async initialization/frame readiness and official `renderMedia` export.

Scenes are authored in TypeScript without raster scene inputs or a hosted service. Documentation GIFs are export derivatives only. Original code is MIT; Remotion retains its separate license.

## Anatomical bounds when holding a prop

`solveTwoBone` establishes geometric reach, not an anatomically appropriate shoulder or elbow. `solvePlanarLimb` supplies explicit bend/flexion/wrist limits; the example must also declare a suitable upper-arm sector relative to its torso/shoulder frame. Choose those bounds for the action and proportions. Reject and restage an invalid target rather than clamping the wrist or loosening a bound to pass a bad image.

If a two-handed prop turn would swap the hands or force a shoulder backwards, author a release and regrip: one hand keeps ownership while the other moves to its new anchor, then transfers support. Review both complete shoulder–elbow–wrist chains throughout the transition. A reachable hand and an unbroken grip do not establish a natural pose. Keeping elbows below shoulders is appropriate for the courier's low transfer; it is not a universal rule for raised-arm actions.

## Shared quality helpers

These helpers are pure TypeScript and contain no monkey dimensions, colors, timing landmarks or renderer clock. The monkey, Amber robot and cat examples consume applicable subsets; inspect each example and its review evidence rather than treating numeric reuse tests as visual approval.

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


## Foot tracks and weight transfer

`src/core/gait.ts` adds two pure functions; no skeleton, character proportions or action timestamps are prescribed.

- `sampleFootsteps(time, steps, transfer = 0.12)` samples a nonempty ordered sequence of `Step2D`. Adjacent contacts/heading must join exactly. The same foot needs at least `2 * transfer` between swings to accept and release load. Endpoints and headings stay fixed during support.
- Its result extends `sampleStep` with `ground` (the path without lift), `height`, `index`, raw `load` (0..1), normalized `roll` (+1 toe-off, -1 heel contact) and a single `compression` pulse after landing. Load releases in the interval before lift and is accepted after touchdown; airborne feet have zero load. Compression ends after `2 * transfer`, with no idle oscillation.
- `supportBalance(contacts)` normalizes their nonnegative `load` values and returns `{center, weights}`. `center` is the weighted projected ground point. Zero total load throws: a jump/flight needs a separately authored body trajectory. This is an authoring aid, not a physical center-of-mass simulation.
- `placeOnPivot(anchor, localAnchor, pivot, angle)` in `spatial.ts` returns `{origin, contact}`. Draw the rotated local contour at `origin`; its chosen pivot then stays exactly at `contact`. The pose uses this same origin for the ankle solver. `rotatePoint` applies the matching rotation.
- `fitVerticalShift([{root, target, reach}, ...], desired = 0)` in `kinematics.ts` finds the closest common vertical translation satisfying all maximum reach spheres. An impossible intersection throws. Choosing reach slightly below total bone length reserves knee bend. Actual two-bone solving still checks both reach bounds.

For example, these differently placed contacts can drive any authored two-foot drawing:

```ts
const left = sampleFootsteps(t, [
  { start: 1, end: 1.5, from: [20, 80], to: [40, 90], lift: 16 },
]);
const right = sampleFootsteps(t, [
  { start: 1.8, end: 2.3, from: [70, 80], to: [90, 90], lift: 16 },
]);
const support = supportBalance([left, right]);
// Author the pelvis relative to support.center, then solve the limbs.
// The renderer consumes each sampled contour origin, pivot and rotation.
```

The example's `steps.ts` owns four approach footfalls, two turns and two boarding steps. Its screen-space floor path and body scale advance together; stance points are independent of that scale. The pelvis shifts toward the loaded foot before lift, softens on contact and respects the shared reach constraint. Arm/bag/tail offsets follow delayed footfalls. No gait clock or per-playback state is added. Turn and boarding also use the same foot tracks. The renderer's Pixi transform order agrees with the pivot math; save/rotate/restore alone does not establish the correct rotation center.

The single movie demonstrates one chosen style and set of dimensions. Numeric cases cover other layouts/scales/timings, but visual portability to another character remains future work.

## Compatible contours, local frames and contact anchors

`core/contour.ts` defines a deliberately small closed-cubic representation:

- `CubicContour {start, curves}`; each curve has a unique semantic `key`, `c1`, `c2` and `to`. The last endpoint equals `start`. Authors choose the correspondence between forms; keys do not infer anatomy or repair incompatible shapes.
- `morphContour(a, b, amount)` validates finite closed contours and matching ordered keys, clamps the blend and holds exact endpoint values. `mapContour(contour, pointMap)` maps all controls/endpoints.
- `cubicPoint(from, curve, amount)` and `contourAnchor(contour, key, amount = 0.5)` evaluate an actual curve point, rather than an approximate drawing coordinate. `quadraticPoint` covers the example's existing nose surface.

`LocalFrame2D {origin, angle, scale}` in `spatial.ts` rotates local points, then scales/translates them with `localPoint`. `segmentFrame(from, to, referenceAngle)` aligns local +Y with a nonzero segment ending at `to`; the reference chooses the intended angle winding on any seek. `attachAnchor(frame, localAnchor, target)` preserves angle/scale and places the anchor exactly on the target.

```ts
// shape is the author's compatible CubicContour, with a curve keyed 'tip'.
const tip = contourAnchor(shape, 'tip');
const frame = attachAnchor(
  { origin: [0, 0], angle: -0.5, scale: 1.2 }, tip, [320, 100],
);
const drawing = mapContour(shape, p => localPoint(p, frame));
// Render drawing directly; its chosen tip is at [320, 100].
```

`excursion(time, start, peak, end)` in `core/gesture.ts` returns one smooth 0→1→0 movement and stays zero outside the interval. Each landmark has zero velocity/acceleration. Separate calls with a gap create deliberate still holds; no oscillator or playback state is introduced.

The example's `hands.ts` owns three compatible forms with wrist/palm/finger roles. `gesture.ts` owns gather, extension, reach, contact, withdrawal and return times. Pose places both visible hands in local wrist frames, blends forearm alignment with an authored wrist bend and solves the arm to the resulting origin. The drawing consumes contours/creases from pose and has no hand-specific absolute-time logic. `face.ts` supplies the actual nose-front curve to both drawing and contact sampling. Two authored excursions move its curve parameter, so the fingertip follows the surface rather than a small free-space sine.

These helpers are reusable geometry and authoring tools. They do not create hand forms, discover compatible topology, solve arbitrary collisions or guarantee a good morph. The current forms are checked for area/winding and sampled self-intersections and reviewed in actual neighboring frames. One character remains the only visual consumer.

## Authored whole views and solid stairs

`core/views.ts` adds `contourView(views, value)`. Each `ContourView` has a finite `at` coordinate and a closed `contour`. Coordinates must increase strictly and all contours must share ordered semantic curve keys. The function holds the first/last shape outside the range and uses the existing quintic easing between neighboring views, with exact authored endpoints and zero velocity/acceleration at each key. It returns a fresh contour. The value may be yaw, a pose parameter or another author-chosen coordinate; the helper contains no character angles or anatomy.

```ts
const shape = contourView([
  { at: 0, contour: front },
  { at: Math.PI / 4, contour: threeQuarter },
  { at: Math.PI / 2, contour: profile },
], yaw);
const attachment = contourAnchor(shape, 'earRoot', 1);
```

These are authored whole shapes, not slices of the reference. Matching keys do not prove a good interpolation: review the intermediate silhouettes and overlaps. `pink-monkey/model.ts` uses this mechanism for the cranium, near ear, muzzle, torso, belly and soft bag. Tail attachment follows an anchor on the actual hip contour. The front ear root shares the actual rear-jaw curve; the profile exposes the cup over the cranium. `feet.ts` blends full foot contours of consistent winding, avoiding a signed width passing through zero. Their flat sole still includes the previous contact anchor and heel/toe pivots. Action poses and the actual nose contact surface are unchanged.

`core/stair-solid.ts` extends the same `Staircase2D` used by contacts:

- `stairSolid(stairs, index, depth)` returns projected polygon points for a horizontal `tread` and its adjoining `riser`. `depth` is a finite nonzero 2D vector from the contact edge to the rear edge. The front tread endpoints are exactly `treadPoint(stairs, index, 0/1)`; the riser meets the next tread.
- `stairPanel(stairs, first, last, offset, height)` returns a closed side-panel polygon along the incline between two integer steps. `offset` chooses the projected side; `height` is positive. Callers own colors, visibility, transforms and fill/overlap order.

The example draws an opaque rear balustrade and undercarriage, solid treads/risers and a low near apron. Its platform transform is applied to the moving steps; the station shell retains the common camera transform. This is small projected geometry, not a general 3D modeller, escalator simulator or collision system.

## Second example and shared Remotion bridge

The preceding quality-helper sections describe their original monkey consumer. They now also have the independent Amber consumer documented in [REUSE](REUSE.md). The old `createStage(host)` alias remains monkey-specific; `createPixiStage(host, scene)` is the shared entry point. No numeric core API needed to change for the second character.

`createRemotionScene<Pose, Drawing>(scene)` in `src/remotion/create-scene.tsx` returns a stable React component. Define it once at module scope, then register it with a Remotion `Composition` using the same scene settings. The component uses `useCurrentFrame`, per-frame render handles, one scene initialization and cleanup. Background and logical dimensions come from that scene; it never selects a character or owns a playback clock. Both shipped compositions and the live Player use this function.

```tsx
const RobotScene = createRemotionScene(amberRobotScene);
// <Composition id="AmberRobot" component={RobotScene}
//   width={960} height={640} fps={30} durationInFrames={300} />
```

Amber uses 960×640 / 30 fps / 300 frames with a two-Graphics Drawing type, while the preserved monkey uses 1280×720 / 24 fps / 288 frames with its original container/layers. Both support direct and backward frame requests and independent simultaneous stages. Prop attachment reuses `attachAnchor`: the can's actual handle anchors the gripper and its actual base anchors the bench contact. Water trajectory/timing and mechanical anatomy remain example code.

## Planar limbs with joint limits

`solvePlanarLimb(root, target, upperLength, lowerLength, {bendSide, endAngle, wristRange, minFlexion})` in `core/kinematics.ts` returns `joint`, upper/lower segment angles, elbow flexion and signed wrist bend. Points are in one 2D space and angles are radians. `bendSide: +1` chooses the perpendicular `(-dy, dx)`; `-1` chooses its opposite. It stays on that side as the target crosses shoulder height. This avoids the branch flip produced by projecting a fixed world-axis pole into a changing planar target direction.

`endAngle` is the drawn hand's forward axis. `wristRange` bounds its signed angle relative to the forearm; `minFlexion` reserves elbow bend before full extension. Unreachable targets, a zero target direction and violated limits throw. The solver never silently clamps a joint and detaches a held object. Authors must place the root/contact/prop trajectory within the declared anatomy limits. `relativeAngle(angle, reference)` returns the shortest signed angular difference and validates finite input.

The 3D `solveTwoBone` contract and existing monkey motion are unchanged. Amber uses the new planar solver with a 20° minimum elbow flexion and ±75° wrist limits. These are explicit mechanical illustration constraints, not a dynamics simulation or automatic anatomical inference. The [authoring process](AUTHORING.md) couples numerical checks with actual frame review.

## Nested Graphics frames and example registration

`withGraphicsFrame(graphics, frame, draw)` in `core/graphics-frame.ts` appends a `LocalFrame2D` to the current Pixi Graphics transform, executes `draw`, then restores the parent even if drawing throws. Origin/angle/scale must be finite and scale positive. Nested calls compose the same coordinates as `localPoint(localPoint(point, child), parent)`. This keeps a packet's insect illustration, or food held by a hand, inside its actual parent frame. It does not load textures or split a reference into parts.

```ts
withGraphicsFrame(g, {origin: [320, 200], angle: -0.1, scale: 1.2}, () => {
  g.rect(-30, -50, 60, 100).fill(0xc7a86d);
  withGraphicsFrame(g, {origin: [0, 5], angle: 0.2, scale: 1}, () => {
    g.ellipse(0, 0, 10, 7).fill(0x637452);
  });
});
```

`examples/scenes.ts` is the demo registry outside core. One typed entry supplies its composition ID, settings, pose evaluator, shared Remotion component and direct stage factory. Root, Player and direct preview select that same entry; viewer metadata supplies labels and documentation paths separately. `seriousBoarScene` uses 1280×720 / 24 fps / 576 frames. Its gait, cart/snack anchors and planar limbs reuse existing helpers. Its proportions, mouth curve, snack timing and original drawing remain example code.

## Object ownership, labels and visible geometry

`core/relations.ts` defines `ObjectGeometry {id, frame, anchors, regions?}`. Anchors and rectangular regions are local to the object's `LocalFrame2D`. `objectAnchor({object, anchor})` and `objectRegion(object, name)` return transformed scene coordinates. `checkContact`, `checkContainment`, `checkOwnership` and `checkClearance` return a named `pass`/`fail` result with an observation. Segment clearance handles crossing and degenerate segments. Every operand must be in the same scene space; these helpers do not discover silhouettes, depth or collision bodies.

`createIllustratedObject(root, geometry)` in `core/objects.ts` owns a Pixi Container, art Graphics and masked Text labels as one depth unit. Draw the package in `object.art`, then use `addLabel({id, text, region, fontSize, minFontSize, padding})` for its named label region. It measures actual Pixi Text, rejects content that cannot fit at the minimum size, and clips to the object's region. `setFrame` moves/rotates/scales art and labels together; `inspectLabels` checks measured fit and parent ownership. The object and its peers must use the same untransformed scene root (or an explicitly composed common frame for geometric diagnostics). It does not wrap text, choose readable copy or solve occlusion/layout automatically. Review small labels at normal viewing size.

`limbShape(root, joint, end, [rootWidth, jointWidth, endWidth])` in `core/limb.ts` returns a continuous closed tapered cubic contour and the same `upper`/`lower` segments for diagnostics. Authors supply meaningful proportions and a solved joint; a nearly folded-back limb is rejected rather than given an invented overlap. Widths, bends, clothes, hands, feet and depth remain authored and require native-frame review.

`drawGeometryOverlay(graphics, objects, paths)` in `core/debug.ts` draws anchor dots, region outlines and supplied joint/trajectory paths in one common scene space. This is an optional evidence-only drawing; keep it out of the final film. It consumes the same geometry, not a second diagnostic skeleton, and does not award an artistic score.


### Finite walking passage evidence

`inspectFootPasses([nearTrack, farTrack], forward = [1, 0], transfer = .12)` in `core/gait.ts` reports each swing's signed station at lift/landing relative to the opposite foot, whether that foot stays fixed, and `passed`. It uses the same world contacts as `sampleFootsteps`; `forward` chooses the projected route direction. Negative `behind` and positive `ahead` detect a rear-to-front pass. This catches repeated rear catch-up before visual review; it neither chooses footfalls nor proves natural motion. Treat startup/closing deliberately in the action plan, rather than exempting every swing. `sampleFootsteps.load` stays in0..1 including floating-point roundoff at transfer boundaries.

The carrier probe retains its planted start/end contacts and uses the rear foot first; ordinary body travel still comes from `sampleTravel`, not a jumping support midpoint. Proportions and action choices stay in the example. Inspect swing-knee shape, grounded stance height and real playback after a topology pass.


The carrier's compact carry reuses `sampleHandling`, `balancePayload`, actual object frames/anchors and planar FK/IK. Its authored tuck moves the entire carton55*heightScale toward the body after lift and returns to the established world endpoint during placement; grip anchors do not slide. The carrying torso cue uses the real payload ratio times its world-space lever, with an authored0.85visual gain, and blends into the deliberate placement reach. This is staging, not a dynamics model. The previous artistic settling offset is kept separate from actual payload mass. `pose.body` and `pose.boxFaces` supply the same contours/faces to rendering and clearance diagnostics. The constant walking squat was removed; the existing height fitter retains reach constraints instead of forcing an anatomically impossible height. Free approach arms use existing FK/quadratic interpolation tied to the actual opposing foot, then yield to the established pickup preparation.

## Trajectories, damping and explicit contacts

The recovered [motion-foundations study](../src/examples/motion-foundations/scene.ts) is one opt-in consumer of these modules; existing character solvers are unchanged.

- **trajectory.ts:** `createTrajectory(keys)` samples quintic Hermite position, velocity and acceleration in seconds and the caller's coordinates. Keys are C2; omitted derivatives mean zero, so supply velocity at a through-point. End derivatives must be zero, with exact holds outside the authored interval. `parameterizeByDistance(trajectory, samplesPerSegment)` builds a chord-table approximation, then samples position/unit tangent by clamped distance. Density is explicit (default256,8..4096); it is not a guaranteed error bound or collision planner. Apply a separate speed profile such as `sampleTravel`.
- **spring.ts:** `sampleDampedSpring(elapsed, initial, {frequencyHz,dampingRatio})` is an analytic homogeneous response around a fixed equilibrium, including under/critical/overdamping. Reevaluate from the same initial state on each seek. `sampleSpringImpulse(time, impulse)` adds an authored finite duration and smooth final fade; it returns exact zero at and after `start+duration`. The fade is an authoring gate; impulses, equilibrium and coupling are supplied by the author, not a rigid-body simulation.
- **constraints.ts:** `attachContacts(orientation, contacts, tolerance)` solves translation for prescribed rotation/scale and rejects incompatible anchors instead of averaging them. `solveLimbContact(request)` adds a fixed root, rigid two-link lengths, chosen bend side and explicit shoulder/elbow/wrist ranges. Expected conflicts return `status:'blocked'` with reasons and no drawable pose; invalid API data throws. It does not clamp joints, reuse the previous frame, move the root or plan obstacle avoidance. Visible contour clearance remains a separate scene check using rendered geometry.

## Human locomotion: authored travel and reach validation

The [human-chair motion](../src/examples/human-chair/motion.ts) uses existing `sampleTravel`, `sampleFootsteps` and `createTrajectory` helpers. Foot contacts and finite body travel are authored together. A smooth hip path keeps reach margin; the example rejects unreachable authored roots. Proportions and action timing remain authoring decisions.

`fitPlanarPostureHeight` in [kinematics](../src/core/kinematics.ts) computes a geometrically feasible vertical correction for supplied limb targets. It does not promise a smooth animation when evaluated independently each frame. Switching the limiting limb can preserve position and contacts while abruptly changing vertical velocity. Check a planned walking path instead of silently using that correction as body motion. Rejected human-chair v1 exposed this problem; v2 uses the existing helpers without changing their contracts. Review whole figures, consecutive steps and encoded motion alongside numerical reach checks.


## Opt-in rigid paper spaces and directed joints

`core/frame3.ts` adds a separate `Frame3` contract: right-handed orthonormal axes, no scale/reflection, with finite values checked. For a character using this convention, +X is anatomical left, +Y up, +Z forward. `yawFrame3` keeps the full signed angle; `composeFrame3`, `pointInFrame3`, `vectorInFrame3` and `vectorFromFrame3` connect local body, shoulder and relative neck spaces. Anatomical side IDs stay fixed when the camera moves. A relative head turn changes the head frame; gaze is separate authored feature data. These functions do not choose a character's proportions, views or pose.

`AffineView` / `affineProject` use world +Y up and `screenY = originY + scale * (-Y + elevation * depth)`, where `depth = -X sin(yaw) + Z cos(yaw)`. `affineViewRay` includes elevation; `facingSide` returns front/back/edge from the actual normal and ray. `affineUnprojectAtDepth` round-trips a screen point at a declared depth. The older `spatial.project` / `unproject` conventions and defaults are unchanged.

`core/hinge.ts` offers `solveHingeLimb` above the existing free `solveTwoBone`. The caller supplies a rigid shoulder/hip frame, directed unit hinge normal, branch sign, signed flexion range and plane tolerance. It returns solved geometry with the exact target, or blocked reach/off-plane/singular/joint-limit. It never fixes a conflict by projecting the target, flipping the elbow, clamping a joint or moving a held contact. A shoulder reaching outside the torso's sagittal plane needs its own authored orientation. The shared helper does not infer anatomical limits or correct staging.

## Opt-in opaque paper surface clipping

`core/paper-visibility.ts` accepts explicitly authored `PaperTriangle3` surfaces and the same affine camera. `visibleTriangleFragments` clips each target by the actual per-pixel affine depth of overlapping triangles; an occluder may hide only half of one forearm. A root-depth or average-depth sort cannot express this. IDs must identify unique triangles. `coplanarRank` breaks ties only within the supplied depth tolerance; it must not force a hidden hand through the body.

This bounded helper handles opaque planar triangles, including self occlusion, coplanar ties and edge-on surfaces. The example owns the actual torso/head/limb surfaces, finite thickness, front/back materials, curves and anatomical meaning. It is not an anatomy generator, intersection repairer, transparent renderer or dynamics engine. Drawing and diagnostics must consume the same real surfaces. Use returned fragments as fills/masks for original artwork; do not outline new triangulation/cut edges. Curved artwork needs a declared approximation. Features painted onto a faceted convex surface must be split at its actual triangle boundaries; connecting sampled perimeter points by chords can put the feature underneath the shell.

`check-spatial-controls.ts` exercises rigid parent/child turns, mirrored signed bends, the elevation-dependent projection ray and a crossing surface whose root/mean depth is identical on both sides. These are geometry tests, not visual acceptance. The candidate cat control scenes under `examples/cat-picture-story/spatial-*` exercise the new opt-in path separately from preserved V1; they are not yet an accepted V2 film or an automatic generation service.


`core/surface-clearance.ts` supplies `surfaceBoxIntrusions` for a declared world-space axis-aligned solid box and the actual drawn triangles. It clips surfaces against the solid interior and returns offending triangle IDs/fragments. Boundary contact within the small supplied tolerance is permitted. This catches a thigh/shin/torso entering a support even when the chosen contact point or knee centre is valid. The author must declare the real solid and intentional contacts; it does not infer colliders or resolve penetration. Surface intersection alone also cannot detect a box completely enclosed by a closed mesh without touching its boundary; that case needs a separate containment check. Tests include boundary support, translation/winding and a point-only false positive.


`core/paper-fill.ts` fills explicit opaque `PaperFillFragment` polygons grouped by pigment. Optional `seamCoveragePx` (default0, limited to0..1 output pixels) adds matching-color subpixel coverage at rasterized cut edges. The candidate paper character opts into0.55px total stroke width (0.275px on each side) after depth clipping; original silhouette ink follows separately. This reduces antialias pinholes and is not a physical contour, collision fix, transparent material or way to reveal a hidden arm. Existing scenes/stage are not changed. Native before/after tests on identical meshes distinguish true art/geometry failures from these raster seams.

## Opt-in ordinary running

`src/core/run.ts` provides `createRunPlan({upper, lower, soleToAnkle, ...})` using the actual `ordinaryRunDefaults` preset for a finite flat-floor run with fixed support soles and recurring flight, sampled in forward station and world-up height; existing `gait.ts` defaults and semantics stay unchanged.

`runningUpperArm(centre,drive,upperLength,backDepth,referenceSwing)` in `core/arm-motion.ts` is an optional dimension-aware rear shoulder excursion. Forward and neutral poses are preserved; the caller supplies actual drawn dimensions and explicit angular calibration, not a pixel elbow offset or universal anatomical norm. Inspect the actual elbow/back contour and solved chain.
