# Local beta verification

The recorded run used macOS arm64, Node 26.4.0 and an existing Chrome headless shell 152.0.7977.30. Dependencies were installed with this project's own `npm ci`; no adjacent workspace's node_modules or symlink is required.

- `npm run check`: TypeScript, 575 integer/half-frame pose/contact samples and Vite build passed.
- Official Remotion `renderMedia`: 1280×720, 24 fps, 288 frames, silent H.264, 12 seconds. One run used concurrency 1; bundle approximately 11.5 s and renderMedia approximately 47.1 s. These are observations, not a benchmark or cross-platform guarantee.
- All 288 decoded frames of that export match the included reviewed baseline exactly (FFmpeg decoded frame hashes), despite different container bytes.
- 35 direct-Pixi versus Remotion Player intrinsic canvas captures match exactly, including neighboring hand transition/contact frames and backward/random seeks. No runtime image requests or page errors were observed.
- The owner found this visual trial “already pretty good” and requested standalone packaging. This does not validate every future scene or arbitrary-reference generation.

The handoff includes checksums and a separate clean-extraction report. GitHub Actions subsequently passed the [baseline](https://github.com/vvvivaldy/curio-motion/actions/runs/40373226829) and [API branch](https://github.com/vvvivaldy/curio-motion/actions/runs/40373227357) source checks (`npm ci` / `npm run check`) on Ubuntu/Node 22; browser/render verification remains macOS-only. Windows/Linux setup is documented but runtime unverified. The build can emit a dependency-level `use client` directive warning under Vite; Node 26 can emit a tsx module-registration deprecation warning. Neither prevented the recorded checks. No security audit is claimed.

## Minimal API extraction — 2026-10-26

The standalone directory passed its original 65-file manifest before edits. The baseline is preserved in the first Git commit and all seven files in `docs/assets/` retain their original SHA-256 hashes. The extraction used macOS 26.6.2 arm64, Node 26.4.0 and the already installed Chrome headless shell 152.0.7977.30. No browser or dependency version was changed.

- Before and after: `npm ci`, then `npm run check` (types, time/frame contracts, 575 pose/contact samples and build), `npm run check:port`, and official `npm run render` passed. `npm ci` was run once before edits; the lockfile/dependencies stayed unchanged.
- All 288 decoded H.264 frames from the new export match both the pre-extraction export and `docs/assets/baseline.mp4` exactly using FFmpeg `framemd5`. The output remains 1280×720, 24 fps, 12 seconds, silent.
- All 35 intrinsic PNG hashes from direct Pixi versus live Remotion Player are unchanged, including random/reverse seeks and neighboring gesture frames. No scene image requests or uncaught page errors were recorded by `check:port`.
- All 575 full poses at 1/48-second spacing compare exactly with the original TypeScript evaluator, including signed zero. Anatomy, projection, illustration and environment paths were not rewritten.
- Visually reviewed the live Player and decoded full-film contact sheets: alternating approach/weight shift, gradual turn, both boarding arcs, horizontal treads, settled supports, continuous hand/nose contact and held poses. Reviewed the hand at closer scale. Pixel equality is regression evidence, not a claim of universal artistic quality.
- Viewer at 1440×950 and 390×950: film loads, play/pause/seek work, frame 204 is visible after seeking, no horizontal overflow or Vite overlay. Live Player advances code frames and pauses/seeks to 204.
- Browser lifecycle checks: invalid frames do not alter the displayed frame, backward draw returns to frame 0, destruction removes the canvas, and an example setup failure destroys its initialized stage and propagates the error.
- Dev-console warnings remain: Remotion's license reminder, React 18 ref warnings inside Remotion `AbsoluteFill`, and software-WebGL readback warnings. A separately served copy of the original source produces the same Remotion/React warnings. They did not prevent playback, seek or export; the API extraction does not suppress them. Build/Node warnings described above also remain.

Local reproducibility evidence is in ignored `qa/` (before/after hashes, render records and UI/lifecycle results); newly rendered films are in ignored `outputs/`. The source API is documented in [API.md](API.md). A second example remains outside this change; Windows/Linux rendering has not been runtime-tested.

## Shared quality foundations — 2026-10-26

The first quality package adds library-level eye apertures/convex pupil clipping, steps with planted position and heading, coordinate transforms/inverse projection, common tread geometry and a finite two-bone solver. The pink-monkey example consumes these helpers. Core code contains no character dimensions, colors or action timestamps; unit cases exercise different coordinates, sizes, view angles, headings and singular solver inputs. Only one visual example has been implemented.

The character now approaches at a fixed location left of the escalator, turns with two small lift/plant steps in a stationary view, then boards. Foot heading changes during swing and holds during support. A single camera transform is shared by the station and its attached fixtures; the tracked tread and both soles share the moving platform frame. The station no longer depends on character yaw. Closed eyes have no white arcs; pupil geometry is clipped to the actual visible aperture even for very narrow far eyes.

- `npm ci` and `npm run check` passed with unchanged pinned dependencies: type checking, shared geometry/contact/IK cases, 575 full/half-frame scene samples and build.
- Planted foot and projected sole errors measured 0 in the sampled supported intervals, including the previously unchecked deceleration/turn. Bone-length error was at most 5.69e-14; maximum half-frame knee displacement was 7.31 px. Phase boundaries and grounded headings are checked explicitly.
- `npm run check:port`: 55 direct-Pixi/Player native frames match, including full blinks, narrow far eyes, turning steps, boarding and reverse/random seek. No scene image requests or uncaught page errors were recorded.
- Official Remotion export remains 12 seconds, 1280×720, 24 fps, 288 silent H.264 frames. Examined decoded full-film sheets and close neighboring frames of eyes, turning and boarding. The top 150px station strip is pixel-identical in native frames 0 and 96, confirming that character rotation no longer distorts it.
- `docs/assets/demo-v2.mp4` is the new code-rendered movie. `demo.gif` is its 720×405, 12 fps, 144-frame, 12-second infinite-loop README derivative (~3.2 MiB). The GIF is produced by `npm run preview:gif` with an existing FFmpeg; it is never a scene input.
- SHA-256 checks confirm that the original `demo.mp4`, `baseline.mp4` and whole reference image are unchanged. Both earlier movies remain available; this quality pass intentionally does not match the old artwork frame for frame.

The rendering environment is the same macOS 26.6.2 arm64 / Node 26.4.0 / existing Chrome 152.0.7977.30. Known development warnings from Remotion/React and the Vite `use client` warning remain documented above. Windows/Linux browser rendering is still unverified. Numeric checks establish constraints and reproducibility, not complete artistic quality: the reference/model fidelity, walk weight, hand morph and scratch readability in the original audit are later passes, not claimed fixed by this package.

UI verification also passed at 1440×950 and 390×950: the viewer loads `demo-v2.mp4`, plays/pauses/seeks to frame 204, and has no overflow or Vite overlay. The live Player advances code frames and seeks to the same frame. Chrome loads the README GIF at 720×405 and its pixels advance automatically; metadata independently confirms 144 frames, 12 seconds and infinite looping. Stage invalid-frame and cleanup checks pass. Known dev warnings were reproduced against the original source. The Browser plugin was unavailable; checks used the project's pinned Puppeteer/Chrome workflow.

A final official export after the exact-endpoint library adjustment matches all 288 decoded frames of `demo-v2.mp4` (the GIF input). Evidence: [before/after eyes](reviews/quality-foundations/eyes-comparison.jpg), [turning steps](reviews/quality-foundations/turn.jpg); detailed local records remain in ignored `qa/quality-foundations/`.
