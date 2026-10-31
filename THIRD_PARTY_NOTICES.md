# Third-party notices

Original Curio Motion code is MIT. The installed dependency stack is **not** all MIT. These facts are taken from the pinned installed packages, not inferred from a renderer's name. Full dependencies are installed by npm from package-lock; node_modules and native tools are not distributed in the ZIP.

| Package | Version | Declared license | Evidence |
| --- | --- | --- | --- |
| pixi.js | 8.22.0 | MIT | [installed text](docs/licenses/pixi.js-LICENSE) |
| vite | 5.4.21 | MIT | [installed text](docs/licenses/vite-LICENSE.md) |
| typescript | 5.9.3 | Apache-2.0 | [installed text](docs/licenses/typescript-LICENSE.txt) |
| tsx | 4.20.6 | MIT | [installed text](docs/licenses/tsx-LICENSE) |
| puppeteer-core | 25.12.0 | Apache-2.0 | package metadata; dependencies retain their own notices |
| @types/node | 22.15.30 | MIT | [installed text](docs/licenses/types-node-LICENSE) |
| react | 18.3.1 | MIT | [installed text](docs/licenses/react-LICENSE) |
| react-dom | 18.3.1 | MIT | [installed text](docs/licenses/react-dom-LICENSE) |
| remotion | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/REMOTION-LICENSE.md) |
| @remotion/player | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/remotion-player-LICENSE.md) |
| @remotion/renderer | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/remotion-renderer-LICENSE.md) |
| @remotion/bundler | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/remotion-bundler-LICENSE.md) |

Remotion's installed license is its own [Remotion License](docs/licenses/REMOTION-LICENSE.md), with Free/Company terms; read the actual text for the intended entity and use. Do not call it MIT or infer a blanket prohibition of an open-source project. [Upstream license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). PixiJS [upstream](https://github.com/pixijs/pixijs) is MIT. Transitive packages retain their own metadata/licenses; this table is a top-level inventory, not a replacement for all notices in an installed distribution.

Chrome/Chromium and optional system FFmpeg are external tools, not bundled. The official renderer installs its own platform compositor dependency; inspect those package notices for a binary redistribution. This package performs no independent Chrome download. Current Puppeteer docs require Node 22.12+; pinned puppeteer-core 25.12.0 also declares >=22.12.0. [Official requirements](https://pptr.dev/guides/system-requirements).


## Selected recorded story audio

Original code MIT does not license recordings. [Story credits](public/audio/sfx/story/CREDITS.md), [catalog](public/audio/sfx/story/catalog.json), [chair credit](public/audio/sfx/chair/CREDITS.md) and [selected chair catalog](public/audio/sfx/catalog.json) identify the 11 processed WAVs. “Cat Hiss” by cdonahueucsd, Freesound620962, is CC BY 4.0 with retained author/source/license and processing notice. Recordings by sounds-mp3, CosmoX45, SpliceSound, seema_grewal, IENBA and the unkleceeg chair cut retain CC0 notices. They derive from official HQ MP3 previews; no native lossless-master quality or listening approval is inferred. These rights remain separate from PixiJS MIT and the Remotion License.
