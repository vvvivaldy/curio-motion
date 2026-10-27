# From a whole reference to a reviewed film

Curio Motion now has a local, repeatable authoring/review process. A coding agent or developer interprets the **whole reference and explicit action**, writes TypeScript through the existing scene API, renders intermediate evidence, diagnoses visible failures and repairs the source. These commands do not call an image/language model, infer anatomy, parse an action or grade artistic quality automatically. No provider, account, service or platform integration is added.

The two plans in [authoring](../authoring) exercise the same tooling with different characters, timebases, contacts and action criteria. A plan selects review frames and states observations/assumptions; it is not a scene language. Pixi still draws new contours and Remotion still owns time and export.

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
- Each criterion needs a `pass` verdict and a specific observation, not an aggregate score.
- Set playback observations for motion/final. Record issues with captured frame numbers, visible symptom, cause, resolution and `resolved` or an explicit remaining `limitation` status.
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

`render.mjs` now records the source hash and exported-film hash and rejects source changes or browser errors during export. Final capture rejects a different/stale film receipt. `--check` rejects stale source/input/plan fingerprints, changed/missing artifacts, absent frames/playback and unfinished visual reviews. It writes `delivery.json`. This is evidence integrity plus a recorded reviewer decision; it cannot verify that someone honestly watched a movie or determine whether a drawing is good.

`qa/` remains local and ignored. Promote a small selected comparison and a concise review summary to `docs/reviews/`, and update documentation media only after review. Keep earlier approved films/reference files. Do not copy the entire QA workspace into Git.

## Repair loop and frame error ledger

Use a concrete row for every material failure: **film/version → frame/time → visible symptom → likely source cause → focused repair → affected checks → reviewed after-frames → remaining limits**. A bad silhouette or implausible pose remains a failure even if all lengths and hashes pass.

The first exercise found robot elbow flips at f78→79 and f197→198, plus a near-reversed wrist. Reviewing the first repair also exposed a spout/leaf intersection; staging was repaired and stale evidence was recaptured. [The process review](reviews/process/README.md) compares actual old/new film frames. The shared planar solver preserves a chosen bend side and rejects wrist/extension violations without moving the held contact. The example places the can within reach and tips around its handle; anatomy, staging and timing remain authored.

This is a first process validation on two known examples. It does not measure unseen-reference generation quality, improve a model's weights or prove a success rate. Such a claim needs held-out tasks and repeated trials with recorded repairs; none were run here.
