# Local development and rendering

[Back to README](../README.md) · [Contributing](../CONTRIBUTING.md)

## Requirements and setup

Use Node **22.12 or newer**, npm and a WebGL-capable browser. Dependencies are pinned in `package-lock.json`; install with `npm ci`. The project is source-only and is not published to npm.

```sh
git clone https://github.com/vvvivaldy/curio-motion.git
cd curio-motion
npm ci
npm run check
npm run demo
```

Use the Vite address printed in the terminal; the default is `http://127.0.0.1:4176/viewer.html`. An occupied port makes Vite choose another port.

| Page | Purpose |
| --- | --- |
| `/viewer.html` | Exported film, reference and source, with a responsive layout |
| `/player.html` | Live, code-rendered Remotion Player with play, pause and seeking |
| `/index.html` | Direct Pixi baseline for comparison |

No account or remote AI service is needed. Installation requires access to the npm registry; rendering stays local. `npm run build` creates `dist/` with local media and reference assets. Serve that folder over HTTP, rather than opening HTML files directly.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite without opening a browser |
| `npm run demo` | Start Vite and open the viewer |
| `npm run check` | TypeScript, numerical tests and production build |
| `npm run check:port` | Compare direct-Pixi and Remotion Player pixels and seek behavior; needs Chrome |
| `npm run render` | Export the official Remotion composition; needs Chrome |
| `npm run render:baseline` | Optional direct-Pixi regression export; needs Chrome and FFmpeg |
| `npm run preview:gif` | Rebuild the documentation preview from the chosen film; needs FFmpeg |

## Render from code

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

## Rebuild the README GIF

After rendering and reviewing a new film, copy the chosen MP4 to `docs/assets/demo-v5.mp4`, then run:

```sh
npm run preview:gif
```

This documentation-only export uses an existing FFmpeg (`FFMPEG_PATH` or PATH); it installs nothing. `GIF_INPUT` and `GIF_OUTPUT` override its paths. The GIF is never input to the scene.

## Visual evidence and compatibility

macOS browser rendering has been exercised. Ubuntu CI runs installation, TypeScript, numerical tests and the static build; it does not render the film. Windows/Linux browser rendering is not yet verified. Record OS and browser when reporting results.

The original beta film and approved baseline remain in `docs/assets/demo.mp4` and `docs/assets/baseline.mp4`; `demo-v2.mp4`, `demo-v3.mp4` and `demo-v4.mp4` preserve preceding quality passes. The current GIF is a 720px, 12 fps derivative of `demo-v5.mp4`. None of these media files is used as scene input.

For drawing or timing changes, review actual frames around contact, blink, turn and gesture boundaries. Numeric checks alone cannot establish visual quality. See [verification](VERIFICATION.md), [architecture](ARCHITECTURE.md) and [artwork provenance](../ASSETS.md).

`node scripts/verify-package.mjs` checks the payload snapshot in `MANIFEST.sha256`. Intentional file edits require regenerating that manifest before packaging; an old release manifest applies only to that matching snapshot.

## Choose an example

The viewer and Player offer both examples. Default URLs and `npm run render` keep the pink monkey. Add `?example=amber-robot` to `/viewer.html`, `/player.html` or `/index.html` for Amber. Its settings are 960×640, 30 fps and 300 frames; the first scene retains 1280×720, 24 fps and 288 frames.

Render the second scene with the same official script (existing Chrome required):

```sh
COMPOSITION_ID=AmberRobot npm run render
GIF_INPUT=docs/assets/amber-robot-v2.mp4 GIF_OUTPUT=docs/assets/amber-robot.gif GIF_FPS=15 npm run preview:gif
```

In PowerShell, set `$env:COMPOSITION_ID = "AmberRobot"` before `npm run render`; set `$env:GIF_INPUT`, `$env:GIF_OUTPUT` and `$env:GIF_FPS` similarly. Remove the variables to return to defaults. The default new robot export is `outputs/amber-robot-remotion.mp4`. Review it before promoting it to documentation media. `npm run check:port` checks both examples; `EXAMPLE=pink-monkey` or `EXAMPLE=amber-robot` selects one case for diagnosis. A diagnostic subset is not the complete two-example check.

## Staged authoring and review

See [AUTHORING](AUTHORING.md) for the four-pass workflow, both plans and the frame error ledger. `npm run review -- --plan authoring/amber-robot.json --stage drafts` writes real intermediate PNGs and a motion MP4; visual reviews start pending. Final review consumes a current official render and receipt, decodes its actual frames, and `--check` refuses stale/unfinished evidence. `npm run check` also runs plan/review rejection tests; it does not render or perform artistic review in CI.

The current robot documentation film is `docs/assets/amber-robot-v2.mp4`. To rebuild its GIF use `GIF_INPUT=docs/assets/amber-robot-v2.mp4 GIF_OUTPUT=docs/assets/amber-robot.gif GIF_FPS=15 npm run preview:gif`. Its original film and `amber-robot-v1.gif` are preserved.
