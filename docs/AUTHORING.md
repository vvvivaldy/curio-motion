# From a whole reference to a reviewed film

Curio Motion now has a local, repeatable authoring/review process. A coding agent or developer interprets the **whole reference and explicit action**, writes TypeScript through the existing scene API, renders intermediate evidence, diagnoses visible failures and repairs the source. These commands do not call an image/language model, infer anatomy, parse an action or grade artistic quality automatically. No provider, account, service or platform integration is added.

The three plans in [authoring](../authoring) exercise the same tooling with different characters, timebases, contacts and action criteria. A plan selects review frames and states observations/assumptions; it is not a scene language. Pixi draws vector contours and Remotion still owns time and export.

## Prepare a local example

The project-local [curio-authoring skill](../.agents/skills/curio-authoring/SKILL.md) gives a future coding agent the drawing, relationship and repair workflow without this chat. Start from a whole image/video file and an unchanged UTF-8 ACTION file:

```sh
npm run create:example -- --id new-owl --composition NewOwl \
  --reference inputs/new-owl-whole.png --action-file inputs/new-owl-ACTION.txt \
  --title 'New owl' --provenance 'Owner-supplied whole reference' \
  --width 1280 --height 720 --fps 24 --frames 288
```

Input files may be outside the checkout. The command copies the whole reference into a new `reference/<id>/` directory, copies ACTION bytes unchanged, pins hashes/provenance, and writes typed `settings.ts`/`scene.ts`, a v2 `authoring/<id>.json`, a planning note and an agent task. The task contains concrete manual registry/metadata steps. Existing destinations, invalid settings and paths escaping the repository are rejected. The scene is deliberately blank: no character, action interpretation or automatic reconstruction is generated.

The copied reference defaults to `runtimeUsage: false` and `distribution: 'local-only'`. Its local `.gitignore` protects Git inclusion; the static build separately reads the manifest distribution policy and excludes that file. Change distribution only when redistribution is authorized. Complete the starter observations, assumptions, action beats, samples and criteria before reviewing; placeholder text is not reference inspection.

Before transitions, define objects, whole contours, local frames, visible surface anchors, ownership, support/grip and intended overlaps. Render held control drawings and inspect them against the whole reference. Geometry checks verify declared relationships; visual criteria verify recognizable forms, connected anatomy, readable action and expression. For example, a floating insect label is not a drawn insect, and `happiness = 1` is not evidence of visible happiness.

Check the **finished outline**, not just the bone/contact anchor. A thick round stroke can extend below an ankle and through a boot sole even when the IK target is exact. Calibrate the visible calf, footwear and sole together; inspect planted and airborne feet against the actual floor. For a prop described as lying down, show it resting on the actual surface before the grasp and inspect neighboring frames through the first lift.

For an infographic, inspect the whole frame and measure the rendered bars against the supplied values, common zero and scale. Check labels, totals, sequence and the final still interval separately; passing character/contact tests does not validate a chart. In a fresh-author trial, preserve both the first completed output and the author's own early failures. A separate reviewer records visible findings before reading the author's explanation; repairs remain a separate version.

For a two-handed interaction, inspect each full shoulder–elbow–wrist chain and the upper-arm direction relative to the torso at the action extremes **and every frame of the risky transfer**. The courier trial initially passed grip/containment while the elbow visibly looped up to the eye; that review conclusion was withdrawn after owner feedback. A passing contact report must not override an implausible shoulder. When a turn needs a different grip, show a supported release/regrip sequence instead of keeping incompatible hand anchors attached.

## The passes

| Pass | Author does | Saved evidence and acceptance |
| --- | --- | --- |
| Input | Preserve the whole reference, pin its hash/provenance, write action order, contacts and intentional pauses. Separate visible facts from invented hidden views. | Existing `authoring-input.json`, action text and a small per-example plan. A changed reference fails the pinned-input check. |
| `model` | Write held/static code poses; inspect proportions, silhouettes, hands, feet and overlaps against the whole image. | Native PNGs from official Remotion `renderFrames`, contact report, per-criterion visual notes. No claim of automatically reconstructed front/profile views. |
| `blocking` | Author a few meaningful action poses and contact order before polishing transitions. | Full-frame pose strip: support, grip/load/release and readable holds. Correct these before adding detail. |
| `motion` | Fill transitions, enforce constraints and inspect dangerous frames with neighbors. | Native PNGs plus a half-size official Remotion MP4 for normal/slow playback. Diagnose visible errors rather than decorating them with extra motion. |
| `final` | Run checks, export the full film, watch all of it and compare the affected frames with the previous film. | **Decoded encoded-MP4 frames**, full MP4 copy and render receipt, explicit issue ledger and limitations. The delivery check requires all four current visual reviews. |

For existing examples, these passes capture **the current authored source**. They do not recreate historical model/blocking drafts or establish that a model generated those drafts. For a new example, run them as the source develops. Every capture has an input/plan/source fingerprint and timestamp; source changes require fresh evidence before delivery. Old capture directories remain available for comparison.

## Run locally

Use the pinned dependencies (`npm ci`) and an existing Chrome (`CHROME_PATH` if needed). No browser or other tool is downloaded. Intermediate `model`/`blocking`/`motion` rendering needs Chrome only. Final decoded-frame review and README GIF generation also need an existing FFmpeg.

```sh
npm run review -- --plan authoring/amber-robot.json --stage model
npm run review -- --plan authoring/amber-robot.json --stage blocking
npm run review -- --plan authoring/amber-robot.json --stage motion
```

Open the printed `report.html` locally. Each run directory contains native `frames/`, `capture.json` with hashes and `review.json` initially marked **pending**. Motion also contains `preview.mp4`. Inspect the whole frame, enlarged contact regions, neighbors, and playback at normal and half speed. Write the review only after that inspection:

- `reviewer` identifies who actually inspected the evidence (a coding agent is allowed and must be named).
- `captureSha256` ties observations to those exact captures; leave the generated value.
- Each required criterion needs a `pass` verdict and a specific observation, not an aggregate score; a v2 optional criterion may instead use explicit `limitation` with a complete linked limitation issue and matching frame evidence. For v2, use its stable criterion ID and include the declared captured frames in the check’s `frames` array; `fail` or `needs-review` verdicts block acceptance.
- Set playback observations for motion/final. Record issues with captured frame numbers, visible symptom, cause, resolution and `resolved` or an explicit remaining `limitation` status. In v2 each issue names its declared `criterion`; diagnostic issues also identify their `relation`. A required defect cannot be accepted as a limitation.
- Set `decision` to `accept` only when the visible result meets the criteria. A pending/rejected review or an open/incomplete issue cannot pass delivery.

After any repair, recapture the affected pass and inspect it. For final source verification, `--stage drafts` captures model/blocking/motion together with one bundle; it still leaves all three reviews pending. This is useful after earlier passes have been inspected and a local repair has changed the source fingerprint.

```sh
npm run check
npm run check:port
COMPOSITION_ID=AmberRobot RENDER_OUTPUT=outputs/amber-robot-final.mp4 npm run render
npm run review -- --plan authoring/amber-robot.json --stage final \
  --film outputs/amber-robot-final.mp4 --receipt qa/AmberRobot-render.json
# Complete the real visual review, then:
npm run review -- --plan authoring/amber-robot.json --check
```

For PinkMonkey use `authoring/pink-monkey.json`, `COMPOSITION_ID=PinkMonkey`, its output filename, and `qa/remotion-render.json`. `--stage all` captures all passes together when an existing current final film/receipt is supplied. In PowerShell, assign `$env:COMPOSITION_ID` and `$env:RENDER_OUTPUT` before the render command.

`render.mjs` records the image/export source hash and exported-film hash and rejects source changes or browser errors during export. Final capture rejects a different/stale film receipt. `--check` rejects stale source/input/plan fingerprints, changed/missing artifacts, absent frames/playback and unfinished visual reviews, then writes `delivery.json`. This checks evidence integrity and recorded decisions; it cannot determine artistic quality or prove someone watched the film.

Image/export identity includes all `src/**/*.ts(x)`, package files, Vite configuration, `scripts/render.mjs` and `scripts/tools.mjs`. QA policy has a separate recorded snapshot of `scripts/review.mjs`, `scripts/lib/authoring.mjs` and `scripts/lib/diagnostics.mjs`. Editing only those QA tools does not force a new MP4: rerun the delivery check under the current validator. Geometry/export changes invalidate image identity; input, ACTION or plan changes invalidate capture identity. A scene diagnostic module under `src/` is also source-hashed. Schema changes or newly required evidence can still require new captures; separating hashes does not bypass validation.

`qa/` remains local and ignored. Promote a small selected comparison and a concise review summary to `docs/reviews/`, and update documentation media only after review. Keep earlier approved films/reference files. Do not copy the entire QA workspace into Git.

## Structured criteria and geometry evidence

Legacy v1 string criteria remain readable. New plans use `version: 2` and structured criteria inside each stage, for example:

```json
{
  "id": "hand-grip",
  "description": "The visible hand closes around the actual handle before lifting",
  "required": true,
  "frames": [55, 56],
  "relations": ["hand-handle"]
}
```

Criterion IDs are unique within a stage. `frames` is nonempty and must belong to the stage’s expanded captured samples (including requested neighbors). `relations` is optional. The stage still supplies `samples` with `frame`, `label` and optional `radius`; the plan still supplies settings, input, action files, observations, assumptions and ordered action beats. Required checks need explicit passing observations. Optional checks may use `pass` or explicit `limitation`; `limitation` requires a complete issue with the same `criterion`, `status: "limitation"` and affected frames covered by the check, plus specific check notes. An optional limitation issue also requires that explicit check verdict, so it cannot accompany a misleading `pass`.

For declared geometry relations, add `diagnosticModule` pointing to an authored TypeScript file under `src/`, exporting a pure `diagnoseFrames(frames)` function. It returns records of this shape:

```json
{"relation":"hand-handle","frame":55,"status":"pass","message":"Measured contact distance within the authored tolerance"}
```

Allowed statuses are `pass`, `fail` and `needs-review`. The report must cover every declared relation at every criterion frame, with unique relation/frame pairs. v2 captures save and hash `diagnostics.json` even when no relations are declared; the latter report has no geometric results and proves no contact quality. Drawing and diagnostics must consume the same authored geometry. Shared object/contact/containment/clearance helpers are documented in [API](API.md).

Use `needs-review` for a specific actionable geometric ambiguity, such as projected overlap whose intended depth needs inspection. Do not emit it unconditionally for appearance or emotion; those remain required visual criteria. A required relation’s `fail`/`needs-review`, missing coverage or an unassigned diagnostic defect blocks acceptance. Only a declared optional criterion can retain an explicit diagnostic limitation tied to the relation and affected captured frames. Repair required failures, recapture and inspect them before acceptance.

## Repair loop and frame error ledger

Use a concrete row for every material failure: **film/version → frame/time → visible symptom → likely source cause → focused repair → affected checks → reviewed after-frames → remaining limits**. A bad silhouette or implausible pose remains a failure even if all lengths and hashes pass.

The first exercise found robot elbow flips at f78→79 and f197→198, plus a near-reversed wrist. Reviewing the first repair also exposed a spout/leaf intersection; staging was repaired and stale evidence was recaptured. [The process review](reviews/process/README.md) compares actual old/new film frames. The shared planar solver preserves a chosen bend side and rejects wrist/extension violations without moving the held contact. The example places the can within reach and tips around its handle; anatomy, staging and timing remain authored.

This is a first process validation on two known examples. It does not measure unseen-reference generation quality, improve a model's weights or prove a success rate. Such a claim needs held-out tasks and repeated trials with recorded repairs; none were run here.

## Independent video input

The later [boar trial](reviews/independent-boar/README.md) uses `authoring/serious-boar.json` and the same four passes. Its whole MP4 is authoring-only: reports embed a local video instead of a reference image. It is pinned by SHA-256 but excluded from Git and static distribution. A fresh clone can check/build/render the boar from code; repeating its reference-based review also requires the owner's matching local `reference/serious-boar/source.mp4`.

Use `COMPOSITION_ID=SeriousBoar` for export, `qa/SeriousBoar-render.json` for the receipt and `authoring/serious-boar.json` for review. No frames are cut from the recording for scene assembly. Observations and requested substitutions are distinguished from the new authored design and silent continuation. This is one independently supplied task, not a benchmark of an automatic generator.


The starter's object-shaped `input.action` declaration is enforced: `path` must be listed in plan `actionFiles`, and actual bytes must match the declared SHA-256. Older string/absent action declarations remain compatible. The whole reference is also pinned. These checks establish input identity, not quality. Private-input exclusion follows both the manifest path and the actual filesystem spelling (including case-insensitive macOS paths); Git ignore alone is insufficient.


### Local encoded-playback review

Serve a narrow QA directory containing copies of the authored MP4s and simple review controls. Do not serve an entire authoring workspace: its local-only reference and private reports can otherwise become accessible. Keep this media inspection outside the runtime scene. Use normal browser controls for 1× and 0.5×, retain the visible completion record and representative screen evidence, then inspect actual contacts and timing. Native video-frame callback counts establish decoding/completion only; they cannot approve anatomy, emotion or motion quality. Record the examined sequences and remaining visual limits before filling review decisions. If access is denied, narrow the scope or stop for the missing access; never bypass the browser policy or mark unviewed playback as true.
