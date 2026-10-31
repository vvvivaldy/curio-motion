---
name: curio-authoring
description: Author or repair a Curio Motion vector character scene from a whole reference and explicit action using its typed scene API and real frame review.
---

Use the existing PixiJS/Remotion pipeline. Read AGENTS.md, docs/API.md and the relevant example first. Reference input is authoring material: inspect it whole, preserve provenance, keep private inputs outside the public package and draw new vector geometry at runtime.

Establish readable held poses before connecting motion. Define visible criteria for anatomy, emotion, silhouette, support and grips; inspect the whole native frame. Distinguish observed reference facts from invented hidden views. Passing dimensions or reachable endpoints does not approve a poor drawing.

Keep anatomy and action beats in the example. Reuse core frames, surface visibility, directed hinges and finite trajectories where they fit. In depth scenes keep permanent anatomical left/right IDs, compose head/limb frames from the torso and place facial marks on actual surfaces. Use the surfaces consumed by rendering for overlap/contact checks.

For ordinary running use createRunPlan from core/run.ts with actual leg lengths and sole-to-ankle artwork anchor. Its output is forward station/world-up height; explicitly adapt it into the character space. The sample includes support/flight, lean, arm timing and finite braking. Author the character's arm rig separately. Crouching/stalking needs explicit intent; do not lower a running pelvis permanently to hide unreachable targets.

Review toe-off, rear heel recovery, forward extension, landing and both braking steps from a useful view. In a running backswing check the actual elbow against the drawn back contour; moving only the wrist does not establish shoulder excursion. The optional arm-motion helper takes actual dimensions and explicit motion calibration. Keep planted soles fixed and held wrists exact; revise pose or shoulder orientation instead of moving a contact into a convenient plane. Around controller changes compare corresponding actual contour/mesh vertices and orientation as well as roots.

For new actions prefer a brisk default tempo with deliberate holds, and judge speed at normal playback before retiming. Preserve approved timelines unless the user asks to change them.

Keep pose(time) pure and seekable. Pixi draws synchronously; Remotion owns frame time, Player and renderMedia. Preserve approved films before changes. Run npm run check; for preview/export changes also check:port and render with an existing Chrome. Inspect native images, dangerous neighboring frames, normal/slow playback and decoded final MP4 frames. State separately which frames were inspected, what playback was observed and what audio was heard. Numerical checks alone cannot approve meaning or sound.

Use docs/CAT_PICTURE_STORY.md for the paper-cat entry points and recorded-SFX credits. Existing examples are authored demonstrations, not an automatic reference converter or a general anatomy template. This skill grants no publication or integration permission.

For lossy audio, distinguish measurable cue presence/timing from signals below coding residual; retain an unresolved-cue limit rather than claiming every quiet event is proven. Keep actual listening separate.
