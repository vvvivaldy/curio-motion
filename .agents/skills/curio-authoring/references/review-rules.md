# Geometry and visible meaning

Geometry QA verifies finite values, closed compatible contours, deterministic seeks, valid joint ranges, stable contact position/heading, ownership of anchors, containment and clearances. Use actual rendered contour points and coordinate frames; an unrelated diagnostic skeleton does not prove the illustration follows it.

Use the actual local helpers: `createIllustratedObject` and its `addLabel`/`inspectLabels` methods in `src/core/objects.ts`; `objectAnchor`, `objectRegion`, `checkContact`, `checkContainment`, `checkOwnership`, `checkClearance` and `segmentDistance` in `src/core/relations.ts`; `limbShape` in `src/core/limb.ts` for a continuous contour tied to the measured joints. These helpers check authored geometry, not resemblance or emotion.

An optional `diagnoseFrames(frames)` report may use `needs-review` for a specific relation/frame with actionable geometric ambiguity, such as projected overlap whose intended depth must be inspected. State what is ambiguous and which visible evidence resolves it. Do not return an unconditional `needs-review` for every capture merely because appearance or emotion needs human/agent judgment. Keep resemblance, expression and action readability as required visual criteria with relevant frames and explicit observations. A real numeric failure remains a failure; do not relabel it as ambiguity.

Visual QA asks whether the whole image communicates the requested subject, action and mood: recognizable silhouette, connected anatomy, continuous hands, convincing weight, prop ownership, coherent overlaps/background, deliberate pauses and visible expression. Inspect whole frames and details. Playback reveals timing failures static samples miss.

| Misleading evidence | Required observation or repair |
| --- | --- |
| An insect name is printed near an empty package. | Draw a recognizable insect belonging to the package geometry. A floating label is an orphan, not the depicted object. |
| Pose passes lengths, but the film draws disconnected ovals. | Repair continuous authored contours; ensure drawing consumes checked pose and anchors. |
| `happiness = 1` passes an assertion. | Inspect face, posture, gesture, rhythm and context. Happiness must read in the rendered image. |
| Hand target equals prop target. | Inspect visible fingers, contact, grip closure, layers and load/release order. |
| Distance is positive in local coordinates. | Compare actual geometry in a common world/view frame and inspect encoded overlaps. |
| Every sampled frame passes. | Watch full normal/slow playback and hazardous neighbors; sampling can miss brief collapse. |

A repair ledger names the film/version and frame/time, describes what the viewer sees, identifies a concrete source cause, records a narrow repair and affected checks, and cites newly inspected after-frames. State remaining visible limits; do not change a criterion after a failure merely to turn it into a pass.

Starter frames and criteria are scaffolding. Replace them with action-specific control drawings, transitions, contact onset/release, critical silhouettes and expression evidence. Reference observations cannot be invented by the preparation command. For video input inspect the whole recording; inspection stills remain evidence and never runtime scene parts.

## Motion causes to check

Keep forward body/prop travel independent of individual foot swing interpolation. A midpoint of two sampled foot targets can stop between swings and make a cart visibly surge despite perfect contact distances. Use the shared `sampleTravel` profile where a finite smooth start, steady travel and smooth stop are intended; use support balance for a bounded weight shift, then solve limbs to the world-fixed contacts. Reserve extension and inspect the actual stance silhouette; long bones are not a reason to accept a permanent crouch.

A list of individually eased waypoints can create unwanted stops or fast throws, especially when large movements are assigned only one or two frames. For a continuous reach around a prop, use the existing quadratic/cubic curve evaluation with an authored clear path and adequate duration; keep intentional grip/bite holds explicit. Inspect the entire encoded reach and its neighboring frames, not only its endpoints. These are authoring rules, not automatic trajectory or anatomy generation.


## Walking with a carried object

- Inspect consecutive passing poses and touchdown order: both feet must alternately pass the stance foot in a walking passage. World-fixed contacts alone can still produce a repeated step-together gait. Distinguish the final closing step from the repeated walking pattern; inspect the swing knee and continuing body travel. Keep the foreground free palm distinguishable from the actual knee/thigh during passing; intentional depth overlap is acceptable when the anatomical chain remains readable.
- Measure and inspect the actual object-to-torso distance and hand anchors. For a heavy carried prop, merely drawing bent elbows or shifting a numerical centre is insufficient: arrange the real prop close to the torso, retain two readable grips and check its drawn faces against torso/legs. Deliberate extension for placement is a separate action.
- Couple the visible counterpose to authored load and its actual lever, then inspect loading, carrying and unloading. Do not constrain dynamic walking to static COM-over-one-foot or add idle sway as a substitute for load response. Confirm the preserved pickup and final support poses after changing the carry.

For running, inspect a complete actual cycle with support-leg extension, visible clearance of both real soles during flight, opposing arms and smooth starts/stops; valid joint lengths and phase labels alone do not approve an ordinary-looking run.
