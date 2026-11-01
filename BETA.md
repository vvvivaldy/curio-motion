# Curio Motion 0.2.0-beta.1 — source-project beta

Historical 0.2 beta record. The current local source is 1.0.0-rc.1; see [RC status](docs/RC_1_0_0_RU.md). Statements below apply to the published 0.2 beta artifact, not a claim that the RC is published.
This is a **source-project beta**, with `private: true` in `package.json`; it is not an npm-published package. The [GitHub prerelease](https://github.com/vvvivaldy/curio-motion/releases/tag/v0.2.0-beta.1) supplies the exact ZIP that passed the recorded clean-install trial. The Git tag adds publication documentation and its own manifest; rendering inputs are identical. A version number, preserved film or old CI badge alone does not establish verification.

## Included and changed

- The existing typed Pixi/Remotion scene path, vector drawing helpers, explicit spatial/contact/limb constraints, code-authored character examples and preserved films.
- An independently authored raccoon courier example, repaired after frame-based review, and a separate educational delivery infographic with three editable values and derived totals/percentages.
- Recorded event-based sound and a larger local effects catalog, including 16 courier WAV variants from 13 new source recordings. Materials and licenses are recorded separately; variants do not imply independent source recordings.
- Pinned tooling updates after the clean-install audit: Vite 6.4.5, Puppeteer Core 25.16.0 and a narrow Zod 4.5.4 → 4.6.6 override. The animation engine stack and accepted media are preserved.
- Updated setup, author/critic instructions, scaffold entry point and practical usage guidance. The scaffold prepares files; it does not draw or interpret a prompt automatically.

## Support and boundaries

Node ≥22.12 and the pinned npm dependencies are required. Preview needs WebGL; official export needs an installed Chrome/Chromium. No runtime account or AI API key is required. npm installation needs network access. Main MP4 export uses Remotion's installed encoder; system FFmpeg is needed only for optional baseline/GIF/review tools that explicitly request it.

Browser preview/export has been exercised on **macOS**. Linux CI covers types, numeric tests and build; it does not verify Linux browser rendering. Windows and Linux browser/export remain unverified. Exact raster equality depends on browser/GPU. Record the actual environment when reporting failures.

Geometry checks do not infer anatomy, depth or artistic quality. Drawing, proportions, action timing, sound selection and approval remain authored. Whole local-only user references are excluded from the package/build; included scenes can preview/export without them, while repeating their original reference-based reviews needs the matching input. Optional historical QA may refer to the environment in which that version was reviewed.

Original code is [MIT](LICENSE). Remotion, artwork and audio have separate terms: [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES.md), [ASSETS](ASSETS.md), [sound catalog](docs/SFX_CATALOG_RU.md). This project does not provide a blanket license grant for dependencies or all assets.

## Delivery checks

[Verification](docs/BETA_0_2_0_VERIFICATION_RU.md) records the actual results and SHA-256 of the delivered ZIP. The report is also attached to the [prerelease](https://github.com/vvvivaldy/curio-motion/releases/tag/v0.2.0-beta.1) as `BETA_VERIFICATION_RU.md`; the tested archive itself stays unchanged. The completed checks were:

1. Assemble one portable payload; preserve prior films, notices and private-input exclusions.
2. Verify the exact archive manifest, unpack into a new folder and run `npm ci` and `npm run check`.
3. A fresh tester follows the bundled instructions, opens live Player, changes a small scene detail and infographic data, and exports both through the official renderer.
4. Record what actually worked and remaining limits; distinguish technical checks, inspected frames, observed playback and audio actually heard.

The report distinguishes completed technical checks, inspected frames and remaining limits. It does not grant new artistic or listening acceptance to every included film. Future publication requires the owner's applicable instruction.

## Beta → 1.0

A short plan is useful; a feature quota is not. The next beta is for real use and concrete fixes. Consider stable 1.0 when:

1. A new user can complete the documented install → change → preview → export path without hidden local files or chat context.
2. The supported OS/browser scope is explicitly declared and tested for that scope. Supporting every platform is not a prerequisite if support is honestly narrower.
3. The supported public/local API is named and documented; compatibility and migration expectations are clear. Beta APIs may change with recorded explanations; stable APIs need a maintained compatibility policy.
4. Repeated problems from new authors have been fixed or clearly bounded. Additional styles, sound packs or abstraction layers are added only for an observed need.

1.0 would promise reliable documented behavior and compatibility within that scope, not automatically perfect animation for every reference. Future published betas and 1.0 need their own verification and authorization.

[Quick start](README.md) · [Руководство пользователю](docs/USAGE_RU.md) · [Current next steps](docs/NEXT_STEPS_RU.md)
