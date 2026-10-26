# Local beta verification

The recorded run used macOS arm64, Node 26.4.0 and an existing Chrome headless shell 152.0.7977.30. Dependencies were installed with this project's own `npm ci`; no adjacent workspace's node_modules or symlink is required.

- `npm run check`: TypeScript, 575 integer/half-frame pose/contact samples and Vite build passed.
- Official Remotion `renderMedia`: 1280×720, 24 fps, 288 frames, silent H.264, 12 seconds. One run used concurrency 1; bundle approximately 11.5 s and renderMedia approximately 47.1 s. These are observations, not a benchmark or cross-platform guarantee.
- All 288 decoded frames of that export match the included reviewed baseline exactly (FFmpeg decoded frame hashes), despite different container bytes.
- 35 direct-Pixi versus Remotion Player intrinsic canvas captures match exactly, including neighboring hand transition/contact frames and backward/random seeks. No runtime image requests or page errors were observed.
- The owner found this visual trial “already pretty good” and requested standalone packaging. This does not validate every future scene or arbitrary-reference generation.

The handoff includes checksums and a separate clean-extraction report. GitHub Actions is only configured, not run on GitHub. Windows/Linux setup is documented but runtime unverified. The build can emit a dependency-level `use client` directive warning under Vite; Node 26 can emit a tsx module-registration deprecation warning. Neither prevented the recorded checks. No security audit is claimed.
