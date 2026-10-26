![Curio Motion](docs/assets/header.svg)

# Curio Motion

**Code-authored 2D animation for AI agents.** A whole character reference and an action description become readable TypeScript illustration and motion—not a cut-up image puppet.

This development version contains one reproducible, code-authored animation example and a small local TypeScript API. Shared eye apertures, contact-aware steps, coordinate frames and a two-bone solver now support the example. A general AI scene generator, provider API, queue and platform integration are not implemented.

[![The current code-drawn pink-monkey animation](docs/assets/demo.gif)](docs/assets/demo-v2.mp4)

[Watch the complete 12-second Remotion film](docs/assets/demo-v2.mp4) · [Original visual baseline](docs/assets/baseline.mp4) · [Русский старт](README_RU.md)

## Try it locally

Requires **Node ≥22.12**, npm and a modern WebGL-capable browser.

```sh
node scripts/verify-package.mjs # release ZIP checksums, before editing
npm ci
npm run check
npm run demo
```

Open `http://127.0.0.1:4176/viewer.html` for the film, reference and actual code. Open `/player.html` for the **live Remotion Player** with play/pause/seek. `/index.html` is a small direct-Pixi baseline. A port already in use makes Vite choose another port; use the printed address.

The responsive viewer puts video first on narrow windows. `npm run build` produces `dist/`, including the local media; serve it over HTTP rather than opening files directly. No account or remote service is needed after installing dependencies.

The inline GIF is a 720px, 12 fps preview of the current official Remotion render. The linked MP4 is the full 1280×720, 24 fps film. The original beta movie and approved baseline remain in `docs/assets/demo.mp4` and `docs/assets/baseline.mp4`.

### Render from code

Install Chrome/Chromium separately. Nothing here downloads a browser. The delivery command starts and closes its own local bundler/browser resources:

```sh
# macOS/Linux: point to your installed browser if it is not auto-detected
export CHROME_PATH="/path/to/chrome"
npm run render
```

```powershell
# Windows PowerShell (runtime not yet tested on Windows)
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run render
```

Bundled preview movies live in `docs/assets/`; newly generated exports go to `outputs/`. The default output is `outputs/curio-motion-remotion.mp4`: 1280×720, 24 fps, 288 frames, silent H.264. Remotion's official `renderMedia()` owns the export. It uses its installed compositor/encoder package; no system FFmpeg is needed for the main export. Optional `npm run render:baseline` uses a separately installed FFmpeg (`FFMPEG_PATH` or PATH) for direct-Pixi regression only. Neither command installs tools. `RENDER_OUTPUT` overrides the output location.

`npm run check:port` requires Chrome and compares intrinsic canvas pixels at selected direct-Pixi/Remotion Player frames, including adjacent gesture frames and backward/random seeks. Exact raster hashes depend on browser/GPU; the recorded run is macOS, not a cross-platform promise.

### Rebuild the README GIF

After rendering and reviewing a new film, copy the chosen MP4 to `docs/assets/demo-v2.mp4`, then run:

```sh
npm run preview:gif
```

This documentation-only export uses an existing FFmpeg (`FFMPEG_PATH` or PATH); it installs nothing. `GIF_INPUT` and `GIF_OUTPUT` override its paths. The GIF is never input to the scene.

## Two layers, one drawing

```text
whole reference + action → agent-authored TypeScript
                                  ↓
                      pose(frame / 24)
                                  ↓
                   Pixi Graphics: new contours
                                  ↑
          Remotion useCurrentFrame / Composition / Player
                                  ↓
                   official renderMedia → MP4
```

**PixiJS draws** Bezier silhouettes, fills, face, hands, bag, stairs and original advertisements. Internal joints locate a pose; the visible limb contour is rebuilt around the pose. There are no image textures, sliced PNG parts or prerecorded frames in the scene.

**Remotion composes and exports** the deterministic frames. Its React component awaits Pixi initialization, stops the ticker and delays each frame until the corresponding draw is complete. It never plays the baseline MP4 as the composition. Reference/media images appear only in the separate viewer.

## What the example does

- A sleepy pink monkey approaches frontally with alternating supports and counter-swinging arms.
- Continuous geometric front → three-quarter → profile turn; the far eye/ear disappear by projection, not a dissolve of stills.
- Two deliberate steps onto a horizontal escalator tread, then fixed feet while the station and original ads scroll down-left.
- Uneven blinks, a glance, one lazy nose-scratch gesture with a continuous hand silhouette and a settled return.

[Turn detail](docs/assets/turn.png) · [Approach controls](docs/assets/walk.png) · [Hand continuity](docs/assets/hand-continuity.jpg)

## Read the source

| File | Role |
| --- | --- |
| `src/examples/pink-monkey/motion.ts` | Time, projection, supports, limb constraints, gesture phases |
| `src/examples/pink-monkey/illustration.ts` | Code-drawn character contours and face |
| `src/examples/pink-monkey/environment.ts` | Station, horizontal treads, signs and parallax |
| `src/examples/pink-monkey/scene.ts` | Example settings, display objects and drawing order |
| `src/core/time.ts` | Easing, frame validation and pure pose evaluation |
| `src/core/eye.ts` | Visible eye aperture and clipped pupil geometry |
| `src/core/contacts.ts` | Step position/heading, exact support holds and tread geometry |
| `src/core/spatial.ts` | Local/world/view frames and invertible yaw projection |
| `src/core/kinematics.ts` | Finite two-bone solving with singular-case handling |
| `src/core/stage.ts` | Typed scene/drawing context and stopped Pixi stage |
| `src/stage.ts` | Compatible example entry point; `draw(integerFrame)` |
| `src/remotion/Scene.tsx` | Thin frame/async bridge, no independent clock |
| `src/remotion/Root.tsx` | The 288-frame composition |
| `scripts/render.mjs` | Official Remotion bundler/export |

See the [small TypeScript API](docs/API.md), [architecture](docs/ARCHITECTURE.md), [roadmap](docs/ROADMAP.md) and [agent handoff](AGENT_START_HERE_RU.md).

## Limits and next step

This is an authoring prototype, not a production engine. Scene geometry and timings are still example-specific; the small shared API has only one visual consumer. No general action parser, natural-language runtime, automatic reference reconstruction, audio pipeline, asset marketplace or distributed rendering exists. There is no claim of a particular studio's artistic quality. Browser/GPU raster differences and platform setup need testing. macOS has been exercised; Windows/Linux instructions are prepared, not runtime-verified.

The original baseline remains preserved. The current example uses shared geometric helpers to fix eye artifacts, introduce planted turning steps and give the station one coherent view transform. A separately authorized second short example can later test whether this API generalizes. Do not start by inventing a large language or a platform.

## Contributing and licenses

Original project code: [MIT](LICENSE). **The dependency stack is not all MIT:** PixiJS/React/Vite are MIT; Remotion has its own [Remotion License](docs/licenses/REMOTION-LICENSE.md). Review [third-party notices](THIRD_PARTY_NOTICES.md) and [artwork provenance](ASSETS.md). Published source: [vvvivaldy/curio-motion](https://github.com/vvvivaldy/curio-motion). Publication and CI evidence are recorded in [GITHUB_LAUNCH](docs/GITHUB_LAUNCH.md).

Please read [CONTRIBUTING](CONTRIBUTING.md), [CODE_OF_CONDUCT](CODE_OF_CONDUCT.md) and [SECURITY](SECURITY.md). The owner confirmed the standalone GitHub destination as `vvvivaldy/curio-motion`; publication does not include deployment or platform integration.
