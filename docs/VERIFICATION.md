# Local beta verification

The recorded run used macOS arm64, Node 26.4.0 and an existing Chrome headless shell 152.0.7977.30. Dependencies were installed with this project's own `npm ci`; no adjacent workspace's node_modules or symlink is required.

- `npm run check`: TypeScript, 575 integer/half-frame pose/contact samples and Vite build passed.
- Official Remotion `renderMedia`: 1280×720, 24 fps, 288 frames, silent H.264, 12 seconds. One run used concurrency 1; bundle approximately 11.5 s and renderMedia approximately 47.1 s. These are observations, not a benchmark or cross-platform guarantee.
- All 288 decoded frames of that export match the included reviewed baseline exactly (FFmpeg decoded frame hashes), despite different container bytes.
- 35 direct-Pixi versus Remotion Player intrinsic canvas captures match exactly, including neighboring hand transition/contact frames and backward/random seeks. No runtime image requests or page errors were observed.
- The owner found this visual trial “already pretty good” and requested standalone packaging. This does not validate every future scene or arbitrary-reference generation.

The handoff includes checksums and a separate clean-extraction report. GitHub Actions is only configured, not run on GitHub. Windows/Linux setup is documented but runtime unverified. The build can emit a dependency-level `use client` directive warning under Vite; Node 26 can emit a tsx module-registration deprecation warning. Neither prevented the recorded checks. No security audit is claimed.

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
