![Curio Motion](docs/assets/header.svg)

# Curio Motion

**Editable 2D animation in TypeScript.** PixiJS draws vector geometry; Remotion controls frames, live preview and MP4 export.

[Release 1.0.1 and source ZIP](https://github.com/vvvivaldy/curio-motion/releases/tag/v1.0.1) · [Русский](README_RU.md) · [Documentation](docs/README.md)

## Start

This is a source project, not an npm package. The verified environment is **macOS arm64** with Node ≥22.12 (release test versions: 22.12.0 and 26.13.0), npm and a WebGL browser. Windows/Linux browser playback and export are unverified.

Download the release ZIP or clone the repository, then run:

```sh
npm ci
npm run check
npm run demo:raccoon
```

Open the address printed by Vite. Click play to hear sound. `npm run dev` starts the server without opening a page. No AI account, API key or hosted service is required.

## Examples

[![Cat story: running, climbing and a falling picture](docs/assets/cat-picture-story-v3.gif)](docs/assets/cat-picture-story-v3.mp4)

| Example | Live Player | Film |
| --- | --- | --- |
| November Cancelled: a vertical cartoon with English voices | `/player.html?example=november-cancelled` | [50 seconds](docs/assets/november-cancelled-en.mp4) |
| Morning delivery: character, sound and infographic | `/player.html?example=morning-delivery` | [36 seconds](docs/assets/morning-delivery-accepted-v1.mp4) |
| Raccoon courier: envelope, grips and bag | `/player.html?example=raccoon-courier` | [16 seconds](docs/assets/raccoon-courier-anatomy-sound-v3.mp4) |
| Educational infographic with editable synthetic data | `/player.html?example=delivery-infographic` | [12 seconds](docs/assets/delivery-infographic-first-pass.mp4) |
| Cat: chair, clock and falling picture | `/player.html?example=cat-picture-story-v3` | [35 seconds](docs/assets/cat-picture-story-v3.mp4) |
| Neon drawing with glow and floor reflection | `/player.html?example=human-chair-neon-confident` | [8 seconds](docs/assets/human-chair-neon-confident-v1.mp4) |

[All current examples and beta archive](docs/EXAMPLES.md). Version 1.0.1 includes the cleaned source archive; the original 1.0.0 ZIP is unchanged. Earlier experiments are labelled separately; superseded exports and production logs are available in Git history rather than the current checkout. These examples are authored scenes, not automatic conversion of an arbitrary reference.

`/viewer.html?example=…` shows the saved film and source; `/index.html?example=…` shows direct Pixi rendering. Private authoring references are not needed to run the included scenes.

## Export

Install Chrome/Chromium separately. No browser is downloaded automatically.

```sh
# Set this only if the installed browser is not detected.
export CHROME_PATH="/path/to/installed/chrome"
COMPOSITION_ID=RaccoonCourier RENDER_AUDIO_CODEC=aac npm run render
```

The result is `outputs/raccoon-courier-remotion.mp4`. [Other compositions, PowerShell and troubleshooting](docs/DEVELOPMENT.md).

## Create your own scene

Open this folder in a coding agent and provide the whole reference and an explicit action. Start with [AGENTS.md](AGENTS.md), [the local authoring skill](.agents/skills/curio-authoring/SKILL.md) and [practical user/team guidance](docs/USAGE_RU.md). A small task needs an author and a human reviewer; complex interactions benefit from an independent critic.

`npm run create:example -- …` creates a blank typed scene and instructions. The author still draws the character and plans motion. [Authoring](docs/AUTHORING.md) · [API](docs/API.md) · [Stable contracts](docs/API_STABILITY.md) · [Sound catalog](docs/SFX_CATALOG_RU.md).

## Rights and support

Original code is [MIT](LICENSE). Artwork, audio and Remotion have separate terms: [ASSETS](ASSETS.md), [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md).

[Support scope](docs/SUPPORT_RU.md) · [Compatibility](docs/COMPATIBILITY_RU.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md) · [Changelog](CHANGELOG.md).
