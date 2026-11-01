---
name: curio-authoring
description: Author or repair a Curio Motion example from a whole reference and explicit action using the local typed scene API and staged visual evidence.
---

# Curio authoring

Use this project-local skill for a new character/action example or a visual repair. This is coding-agent authoring, not automatic reference conversion. Keep example anatomy and action timing outside shared core.

Read `AGENTS.md`, `README.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/API.md` and `docs/AUTHORING.md`. Existing examples are implementation evidence, not anatomy templates to rename. Preserve approved films and inspect the visible baseline before refactoring.

## Prepare a new example

Run from the repository root with a whole input file (inside or outside the checkout) and the user's unchanged UTF-8 ACTION file:

```sh
node scripts/create-example.mjs --id new-owl --composition NewOwl \
  --reference inputs/new-owl-whole.png \
  --action-file inputs/new-owl-ACTION.txt \
  --title 'New owl' --provenance 'Owner-supplied whole reference' \
  --width 1280 --height 720 --fps 24 --frames 288
```

The command creates only new files and refuses overwrite, traversal and symlink escape. It copies the whole reference into a new reference/<id>/ directory with a .gitignore excluding the copied media by default, copies ACTION bytes unchanged, records SHA-256/provenance, and writes a blank typed scene, v2 review plan and registration instructions. It does not draw, interpret ACTION, render or register automatically.

Read `authoring/<id>.agent.md` and `.plan.md`. Complete starter observations, assumptions, action beats and review samples in `authoring/<id>.json` before review. Keep the reference whole and authoring-only (`runtimeUsage: false`). The manifest defaults to `reference.distribution: local-only`: exclude that input from Git and static distribution. A `.gitignore` alone cannot enforce build privacy; verify the build filter before sharing. Change this privacy option only with explicit permission to redistribute the whole input. Hashes record identity, not licensing permission. Artwork notices are separate from code licensing; Remotion has its own license.

## Establish the drawing before motion

Inspect the whole reference. Separate visible facts from invented hidden views and requested substitutions. Decompose the visible scene into objects, contours, local frames, layer order, surface anchors and relationships: support, grip, containment, attachment, overlap and clearance. Match relationships to geometry the renderer consumes. Consult `docs/API.md` for current shared helpers; avoid separate approximate surfaces for drawing and contact diagnostics.

Draw held control poses at useful views and action extremes first: whole silhouette, characteristic anatomy, continuous hands, feet, props and readable environment. Specify a visible criterion for every requested action and emotion. Review native full frames against the whole reference before transitions. Passing pose/contact reports cannot approve a poorly drawn model.

For an ordinary running request use the opt-in `core/run.ts` plan with its normal defaults; crouching/stalking is a separately authored intention, not a permanent pelvis lowering to compensate for unreachable footsteps.

For running backswing inspect the actual elbow against the drawn back contour, not only the wrist. The optional `core/arm-motion.ts` helper uses actual drawing dimensions and explicit motion calibration; keep the FK and hinge frame consistent.

Author blocking, then transitions and deliberate holds. `pose(time)` is pure and seekable; Pixi creates/reuses vector display objects and draws synchronously; Remotion owns composition, frame time and export. No ticker, accumulated clock, prerecorded movie, reference texture, sliced reference parts or new scene language. Use shared helper contracts where they fit; author actual forms and timing in the example.

## Spatial character controls before a full film

When a scene uses depth/turning, keep one explicit rigid body space and permanent anatomical left/right IDs. The torso, shoulder/hip roots, tail and authored views must agree. Compose relative neck/head orientation from that body space; keep gaze separate. Consult the opt-in `Frame3`, directed hinge and opaque paper surface contracts in `docs/API.md`; older 2D examples keep their original defaults.

Author clean front, profile, back and action-extreme drawings before the full timeline. A numerical yaw does not create a convincing side/back drawing. Preserve the accepted character's identifying features, proportions and paper style when repairing hidden views. A turning head must not move the torso or silently switch an entire arm layer.

Check the signed elbow/knee branch in its authored shoulder/hip frame. A target can be reachable with correct lengths and still have a backwards joint. Do not project a held wrist into a convenient plane; orient the shoulder explicitly or revise the action. Correct partial visibility requires actual drawn surfaces/depth, not shoulder/root or average-depth sorting. If a hand floats in the middle of a torso without a readable chain, check for physical penetration before calling it occlusion.

At action boundaries compare orientations and corresponding actual contour/mesh vertices as well as anchor positions. A stationary head origin can hide a large rotation jump. Capture the adjacent frames around takeoff, contact and controller changes; a geometry check that only compares roots and endpoints is insufficient.

For floor/seat support inspect actual foot/paw contours or volumes and the knee/shin/pelvis clearance, not only the endpoint/contact flag. Require a clean action view and, when ambiguous, the same pose from a diagnostic side. If knee versus foot or elbow versus hand remains unclear in the main view, keep the criterion OPEN. Front/back prop materials follow the surface normal and actual projection ray, including camera elevation. Paint facial details on the real surface; they must not cut under its shell or show through its back.

Repair a small failing pose and its dangerous neighbors first. Send exact clean native evidence to a separate reviewer before repeating a large capture or exporting the full film. Diagnostics clarify the same pose after the clean image; colored joints and passing geometry cannot approve a confusing drawing. A final acceptance claim must distinguish frames inspected, continuous playback actually observed, and audio actually heard.

## Two levels of QA and repairs

Read [review-rules.md](references/review-rules.md) when defining criteria or diagnosing a failure. Check geometry/contracts and visible meaning; neither substitutes for the other.

Use `docs/AUTHORING.md` for current model → blocking → motion → final commands and review schema. Inspect actual native images, contact regions, dangerous neighbors, normal/slow playback and decoded final MP4 frames. Generated pending reviews stay pending until viewed. Never fill acceptance notes from scalars, source inspection, hash validity or successful tool exits.

Record each material failure: film/version → frame/time → visible symptom → source cause → focused repair → affected checks → inspected after-frames → limitations. Repair the cause, recapture affected evidence and inspect it. Keep unresolved failures explicit. Do not accept a pass while its required visual criterion fails; do not add idle oscillation to conceal missing intentional motion.

Run `npm run check`; rendering/bridge changes also require `npm run check:port` and `npm run render` with existing Chrome. Use pinned local dependencies and `npm ci`; no global install, hosted AI or publication unless requested. Report checks, images/playback actually viewed and remaining uncertainty.
