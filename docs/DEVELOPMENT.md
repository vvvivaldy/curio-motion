# Local development and rendering

[README](../README.md) · [User/agent guide](USAGE_RU.md) · [Support scope](SUPPORT_RU.md)

## Requirements and first run

The verified scope is macOS arm64 with the recorded Chrome/WebGL environment; Linux/Windows are unverified. Node 22.12.0 / npm 10.9.0 is the compatibility minimum; the recommended control runtime is Node 26.13.0 LTS / npm 11.20.0. See [release status](RELEASE_1_0_0_RU.md) for the exact archive receipt and public-verification state.

Use **Node ≥22.12**, npm and a WebGL-capable browser. This is the 1.0.0 source project (`private: true`), not an npm-distributed library package. Unpack the matching archive into a writable project folder. Installation needs npm registry access; included scene preview/export needs no account, API key or remote AI service.

```sh
npm ci
npm run check
npm run demo:raccoon
```

Use the URL printed by Vite. The usual address is `http://127.0.0.1:4176/player.html?example=raccoon-courier`; a busy port can change it. Click play to start sound. `npm run dev` starts without opening a browser.

| Page | Purpose |
| --- | --- |
| `/player.html?example=raccoon-courier` | Live code-rendered Remotion Player; play, pause, seek and sound |
| `/player.html?example=delivery-infographic` | Live educational infographic |
| `/viewer.html?example=…` | Preserved exported movie, available whole reference and source |
| `/index.html?example=…` | Direct Pixi baseline using the same scene |

Private local-only references are intentionally absent from the package. The included code scenes still run and export; their original reference-based reviews need the matching input. `npm run build` creates `dist/`, including distributable references/films and runtime audio. The manifest-driven filter excludes declared `local-only` references independently of Git ignore. Serve the build over HTTP rather than opening HTML with `file://`.

## Chrome and official MP4

Install Chrome/Chromium separately. The project never downloads a browser. Auto-detection checks PATH and common installation locations; if it fails, set `CHROME_PATH` to the **executable**, not an application folder. Use a path that exists on your computer.

```sh
# macOS example for a standard Chrome installation
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
COMPOSITION_ID=RaccoonCourier RENDER_AUDIO_CODEC=aac npm run render
COMPOSITION_ID=DeliveryInfographic npm run render
```

```powershell
# PowerShell syntax; Windows browser/export has not been verified
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$env:COMPOSITION_ID = 'RaccoonCourier'
$env:RENDER_AUDIO_CODEC = 'aac'
npm run render
$env:COMPOSITION_ID = 'DeliveryInfographic'
Remove-Item Env:RENDER_AUDIO_CODEC
npm run render
```

On Linux use your installed executable, such as `export CHROME_PATH="/usr/bin/google-chrome"`, after verifying that path. Linux browser/export is unverified. The shell examples describe syntax, not a platform test.

| Example query key | `COMPOSITION_ID` | Default output |
| --- | --- | --- |
| `raccoon-courier` | `RaccoonCourier` | `outputs/raccoon-courier-remotion.mp4` |
| `delivery-infographic` | `DeliveryInfographic` | `outputs/delivery-infographic-remotion.mp4` |
| `amber-robot` | `AmberRobot` | `outputs/amber-robot-remotion.mp4` |
| `cat-picture-story-v3` | `CatPictureStoryV3` | `outputs/cat-picture-story-v3-remotion.mp4` |
| `black-cat-chair` | `BlackCatChair` | `outputs/black-cat-chair-remotion.mp4` |
| `pink-monkey` (default) | `PinkMonkey` | `outputs/curio-motion-remotion.mp4` |

Query keys and composition IDs are different. Set `RENDER_AUDIO_CODEC=aac` for the recorded-sound examples. Plain `npm run render` selects the default monkey unless `COMPOSITION_ID` remains set in your shell; remove the variable to return to defaults. `RENDER_OUTPUT` overrides the output path.

The official exporter uses Remotion `renderMedia()`, H.264/yuv420p and the installed compositor/encoder. It does **not** require system FFmpeg. The receipt is `qa/<CompositionId>-render.json` (default monkey: `qa/remotion-render.json`) and records source/output identity, settings and browser errors. Review the encoded result before treating it as a replacement for a preserved film.

`RENDER_RANGE=first:last` exports an inclusive excerpt under `qa/excerpts/` with a separate excerpt receipt. It is useful for a focused repair and cannot stand in for a full final-film receipt. Omit `RENDER_RANGE` for delivery.

## Commands

| Command | Actual behavior |
| --- | --- |
| `npm run dev` / `npm run demo` | Vite server without opening a page / opens the viewer |
| `npm run demo:cat` / `demo:raccoon` / `demo:infographic` | Open the selected live Player |
| `npm run check` | TypeScript, numeric/authoring tests and production build; no browser or artistic acceptance |
| `npm run create:example -- …` | Blank typed scene, whole-input copy, unchanged ACTION, provenance and v2 plan; manual registration instructions |
| `npm run test:authoring` | Non-browser scaffold, identity, review-rejection and distribution tests |
| `npm run check:starter` | Isolated scaffold exercised through direct Pixi/Player; needs Chrome |
| `npm run check:objects` | Browser checks of owned objects/labels/transforms; needs Chrome |
| `npm run check:port` | Configured direct-Pixi/Player pixel comparisons and backward/random seeks; needs Chrome |
| `npm run render` | Full official selected composition MP4; needs Chrome |
| `npm run capture:controls -- --example raccoon-courier --frames 154,161,216,220 --out qa/controls/raccoon` | Native direct-Pixi controls with source identity; does not approve appearance |
| `npm run review -- --plan authoring/amber-robot.json --stage model` | Staged inspection evidence and a pending decision; see [AUTHORING](AUTHORING.md) |
| `npm run verify:package` | Check `MANIFEST.sha256` in a complete packaged archive; before intentional edits |
| `npm run render:baseline` | Optional direct-Pixi regression movie; needs Chrome and system FFmpeg |
| `npm run preview:gif` | Documentation GIF from a chosen exported MP4; needs system FFmpeg |

For a focused parity check, use `EXAMPLE=raccoon-courier npm run check:port`; a subset is not the complete configured suite. See `src/examples/scenes.ts` and `metadata.ts` for all registrations. The scaffold prints the explicit scene/metadata edits needed for a new example.

System FFmpeg is only required by the optional tools that use it, including final-review frame decoding. Set `FFMPEG_PATH` or add it to PATH. `GIF_INPUT`, `GIF_OUTPUT` and `GIF_FPS` select a preview source/destination/rate. GIFs and preserved movies are documentation outputs, never scene inputs.

## A small clean-install trial

Use an unpacked candidate copy, not the maintainer's working checkout. Verify the package before changes, install, run checks and open both new live examples. Then change one drawing detail of the raccoon without altering its action, and change only the three values in `src/examples/delivery-infographic/data.ts` (for example, 9/21/30). Totals and percentages are derived. This example supports exactly three categories, integer values 0…30 and a positive total; a different layout/range needs an explicit design change. Export both through the official commands above and inspect that the visible results match the edits.

For a scaffold smoke, save a short UTF-8 action file outside existing source files and use the distributable `reference/amber-robot/design.svg` as the whole reference. Run the documented `create:example` command with a fresh ID; inspect the generated blank files/instructions. This trial does not require inventing another large film. Generated starter files are a preparation check, not a finished animation.

Record environment, commands, actual exported files, blockers and any undocumented steps. Do not call the archive accepted just because one preserved example was accepted earlier. [Release verification](RELEASE_1_0_0_RU.md) separate these claims.

## Troubleshooting and limits

- **Node/dependency error:** check `node --version`, then use `npm ci` from the project root. Keep the shipped lockfile; do not solve setup by updating all dependencies.
- **Missing Chrome:** set `CHROME_PATH` to an installed executable. No browser or FFmpeg download is performed by these commands.
- **Blank canvas/WebGL failure:** use a WebGL-capable browser and record OS, Chrome version and console error. A build/type pass is not browser rendering evidence.
- **No sound:** use a sound-enabled example and click play/unmute; inspect the exported MP4 separately. The infographic and several older scenes are intentionally silent.
- **Missing reference:** local-only originals are intentionally excluded. Do not substitute scene input with the documentation film. Code preview/export should work without the private reference.
- **Missing/stale package manifest:** `verify:package` is for the exact packaged payload; a source checkout may have no manifest, and intentional edits require a newly generated one when repackaging. It is not a development build failure.

macOS browser rendering has been exercised. Linux CI tests installation/types/numerical behavior/build; Windows/Linux browser rendering remains unverified. Exact raster hashes vary by browser/GPU. For visual changes inspect actual contour continuity, both limb chains, grips, supports and dangerous neighbors in the final MP4. Record frames inspected, observed continuous playback and audio actually heard separately. [Architecture](ARCHITECTURE.md), [API](API.md), [AUTHORING](AUTHORING.md) and [local skill](../.agents/skills/curio-authoring/SKILL.md) provide deeper details.
