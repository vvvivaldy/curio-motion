# Third-party notices

Original Curio Motion code is MIT. The installed dependency stack is **not** all MIT. These facts are taken from the pinned installed packages, not inferred from a renderer's name. Full dependencies are installed by npm from package-lock; node_modules and native tools are not distributed in the ZIP.

| Package | Version | Declared license | Evidence |
| --- | --- | --- | --- |
| pixi.js | 8.22.0 | MIT | [installed text](docs/licenses/pixi.js-LICENSE) |
| vite | 6.4.5 | MIT | [installed text](docs/licenses/vite-LICENSE.md) |
| typescript | 5.9.3 | Apache-2.0 | [installed text](docs/licenses/typescript-LICENSE.txt) |
| tsx | 4.20.6 | MIT | [installed text](docs/licenses/tsx-LICENSE) |
| puppeteer-core | 25.16.0 | Apache-2.0 | package metadata; dependencies retain their own notices |
| @types/node | 22.15.30 | MIT | [installed text](docs/licenses/types-node-LICENSE) |
| react | 18.3.1 | MIT | [installed text](docs/licenses/react-LICENSE) |
| react-dom | 18.3.1 | MIT | [installed text](docs/licenses/react-dom-LICENSE) |
| remotion | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/REMOTION-LICENSE.md) |
| @remotion/player | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/remotion-player-LICENSE.md) |
| @remotion/renderer | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/remotion-renderer-LICENSE.md) |
| @remotion/bundler | 4.0.539 | SEE LICENSE IN LICENSE.md | [installed text](docs/licenses/remotion-bundler-LICENSE.md) |

Remotion's installed license is its own [Remotion License](docs/licenses/REMOTION-LICENSE.md), with Free/Company terms; read the actual text for the intended entity and use. Do not call it MIT or infer a blanket prohibition of an open-source project. [Upstream license](https://github.com/remotion-dev/remotion/blob/main/LICENSE.md). PixiJS [upstream](https://github.com/pixijs/pixijs) is MIT. Transitive packages retain their own metadata/licenses; this table is a top-level inventory, not a replacement for all notices in an installed distribution.

Chrome/Chromium and optional system FFmpeg are external tools, not bundled. The official renderer installs its own platform compositor dependency; inspect those package notices for a binary redistribution. This package performs no independent Chrome download. Current Puppeteer docs require Node 22.12+; pinned puppeteer-core 25.16.0 also declares >=22.12.0. [Official requirements](https://pptr.dev/guides/system-requirements).

## Recorded audio assets

Original code MIT does not license the recorded SFX. `public/audio/sfx/CREDITS.md`, `public/audio/sfx/catalog.json` and seven original per-material notices retain congusbongus and all recording authors, exact sources, pack CC BY3.0 and separate current-source license facts. Recorded chair cuts retain their own CC0 or CC BY4.0 notices and MP3-preview provenance. Processing changes and input/output hashes are catalogued; the pack must not be relabeled MIT or CC0. These audio rights are separate from PixiJS MIT and the Remotion License.

The separate paper-cat story selection is documented in [story SFX credits](public/audio/sfx/story/CREDITS.md) and its [catalog](public/audio/sfx/story/catalog.json). "Cat Hiss" — cdonahueucsd, Freesound620962 — is CC BY4.0. Clock, wood drop, barefoot tile, frame scrape and fabric recordings from sounds-mp3, CosmoX45, SpliceSound, seema_grewal and IENBA are CC0; the reused unkleceeg chair cut remains CC0. The prepared files derive from official HQMP3 previews, with declared cuts/gains/fades and preserved attribution; they are not relabeled MIT or described as native lossless masters. No listening approval is inferred from their provenance or signal checks.


The separate courier selection contains 16 prepared WAV variants from 13 CC0 source recordings. [Courier credits](public/audio/sfx/courier/CREDITS.md), [catalog](public/audio/sfx/courier/catalog.json) and `assets/sfx/courier/` retain creator accounts, primary URLs/license evidence, downloaded official MP3 previews, processing and hashes. The source-recording count is distinct from the cut count. These additions do not change the CC BY notices for older packs or the separate terms of dependencies.


The beta pins Vite 6.4.5 and Puppeteer Core 25.16.0 after checking the concrete dependency advisories reported by a clean installation. An exact-version npm override upgrades only transitive `zod@4.5.4` to `4.6.6`; it does not force Zod 3 callers onto a new major. Remotion/React/Pixi/TypeScript versions are unchanged. Dependency audit results are time-specific metadata, not a complete security audit.
