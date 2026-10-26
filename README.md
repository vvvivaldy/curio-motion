![Curio Motion — illustration in code, motion with intent](docs/assets/header.svg)

# Curio Motion

**Code-authored 2D animation with PixiJS and Remotion.** Draw characters as TypeScript contours, author their motion, and export a film you can inspect frame by frame.

[![Checks](https://github.com/vvvivaldy/curio-motion/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/vvvivaldy/curio-motion/actions/workflows/ci.yml) [![Original code: MIT](https://img.shields.io/badge/original_code-MIT-e9959a)](LICENSE) [![Status: experimental beta](https://img.shields.io/badge/status-experimental_beta-dac5a5)](#project-status) [![GitHub stars](https://img.shields.io/github/stars/vvvivaldy/curio-motion?style=flat)](https://github.com/vvvivaldy/curio-motion/stargazers)

[Quick start](#quick-start) · [Code example](#use-the-local-api) · [Documentation](#documentation) · [Contributing](CONTRIBUTING.md) · [Русский](README_RU.md)

[![Actual code-rendered demo: a pink monkey walks, turns, boards an escalator and scratches its nose](docs/assets/demo.gif)](https://github.com/vvvivaldy/curio-motion/blob/main/docs/assets/demo-v5.mp4)

**12 seconds · 1280 × 720 · 24 fps · silent.** [Watch the full film](https://github.com/vvvivaldy/curio-motion/blob/main/docs/assets/demo-v5.mp4). The GIF above comes from the actual Remotion export; the scene itself draws new contours for every frame.

## Why Curio Motion?

Curio Motion explores how developers and coding agents can author animation as readable, reviewable source. A whole character reference and an explicit action guide the author; TypeScript defines the resulting drawing and motion.

- **Editable geometry.** PixiJS draws continuous silhouettes, faces, hands and scenery, without sliced image parts or raster scene textures.
- **Seekable motion.** A pure pose function evaluates the requested time directly, including backward and random seeks.
- **One frame owner.** Remotion controls composition, the live Player and official MP4 export. PixiJS draws the frame.
- **Local workflow.** Inspect the example, change the source and render with an existing Chrome installation. No hosted AI service or account is required.

The included example combines four advancing footfalls, support transfer, a geometric turn, escalator boarding, blinks and two nose-scratch strokes with deliberate holds. Shared TypeScript helpers cover eye apertures, foot tracks, coordinate spaces, limb constraints, compatible contours, contact anchors, authored whole views and solid stair geometry.

## Quick start

Requires **Node ≥22.12**, npm and a modern WebGL-capable browser.

```sh
git clone https://github.com/vvvivaldy/curio-motion.git
cd curio-motion
npm ci
npm run demo
```

Open the address printed by Vite, usually **http://127.0.0.1:4176/viewer.html**.

| Try | Open |
| --- | --- |
| Film, reference and source | `/viewer.html` |
| Live Remotion Player: play, pause and seek | `/player.html` |
| Direct Pixi baseline | `/index.html` |

To check the project and export the film:

```sh
npm run check
npm run render
```

Rendering requires an **existing Chrome/Chromium**; no browser is downloaded. Set `CHROME_PATH` if detection fails. The default export is `outputs/curio-motion-remotion.mp4`. See [development and rendering](docs/DEVELOPMENT.md) for platform commands, troubleshooting and GIF regeneration.

## Use the local API

Inside a browser TypeScript module in this checkout, render a specific frame into an HTML element:

```ts
import { createStage } from './src/stage';

const host = document.createElement('div');
document.body.append(host);
const stage = await createStage(host);

stage.draw(204); // 8.5 seconds at 24 fps
stage.draw(0);   // seek backward; no accumulated playback state
stage.destroy(); // clean up when finished
```

The example has 288 frames (`0`–`287`). This is a local source API; there is no npm package. See the [API reference](docs/API.md) to define a scene or use individual helpers.

```text
Reference + action → authored TypeScript → pose(frame / fps)
                                                  ↓
                                         PixiJS contours
                                                  ↓
                              Remotion composition / Player / MP4
```

## Project status

**Experimental beta with one authored example.** The shared API has one visual consumer so far. Geometry and timing remain partly example-specific; automatic reference reconstruction, arbitrary scene generation, an action parser, audio and a hosted rendering service are not implemented.

macOS rendering has been exercised. Linux CI checks types, numerical behavior and the static build; Windows/Linux browser rendering is not yet verified. See [verification evidence](docs/VERIFICATION.md) and the [roadmap](docs/ROADMAP.md).

## Documentation

| Start here | What you will find |
| --- | --- |
| [Development and rendering](docs/DEVELOPMENT.md) | Setup, commands, Chrome configuration, exports and previews |
| [TypeScript API](docs/API.md) | Frame evaluation, scenes, eyes, contacts, gait and geometry |
| [Architecture](docs/ARCHITECTURE.md) | How PixiJS and Remotion share one deterministic drawing |
| [Example source](src/examples/pink-monkey) | Character illustration, motion, contacts and environment |
| [Roadmap](docs/ROADMAP.md) | Completed work, next steps and scope |
| [Visual review](docs/reviews/gait/approach.jpg) | Rendered contact and gait evidence |

## Get involved

Bug reports, documentation improvements and focused pull requests are welcome. Start with [CONTRIBUTING.md](CONTRIBUTING.md) for setup, useful first contributions and the checks expected for each kind of change.

[Report a bug](https://github.com/vvvivaldy/curio-motion/issues/new?template=bug.yml) · [Propose an improvement](https://github.com/vvvivaldy/curio-motion/issues/new?template=feature.yml) · [Code of conduct](CODE_OF_CONDUCT.md) · [Security reporting](SECURITY.md)

Maintained by [@vvvivaldy](https://github.com/vvvivaldy). Please use repository issues for reproducible problems and small proposals.

## License and artwork

Original project code is licensed under **[MIT](LICENSE)**. Dependencies retain their own terms: **Remotion uses the [Remotion License](docs/licenses/REMOTION-LICENSE.md)**. See [third-party notices](THIRD_PARTY_NOTICES.md) before reuse.

The character reference was AI-generated for this experiment; the animation is authored as code. [Artwork provenance](ASSETS.md) documents the reference, films and review images separately from source-code licensing.
