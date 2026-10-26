# Contributing to Curio Motion

Thanks for helping make code-authored animation easier to understand and improve. This is an experimental project with one visual example; small, reviewable changes are especially useful. Read the [README](README.md), [architecture](docs/ARCHITECTURE.md) and [roadmap](docs/ROADMAP.md) first.

## Useful first contributions

- Improve setup instructions or report an unclear API example.
- Test browser rendering on Linux or Windows and record the exact environment and commands.
- Report a visual defect with its frame number and a small screenshot or contact sheet.
- Add a focused numerical regression case for a reproducible helper bug.

For a new character, broad API extraction, dependency change or new integration, open a [small feature proposal](https://github.com/vvvivaldy/curio-motion/issues/new?template=feature.yml) first so the scope can be agreed before implementation.

## Set up a change

Fork the repository, clone your fork, and create a branch:

```sh
git clone https://github.com/YOUR-USERNAME/curio-motion.git
cd curio-motion
git switch -c docs/describe-your-change
npm ci
npm run check
npm run demo
```

Use Node ≥22.12 and pinned local dependencies. Do not install global tooling or regenerate the lockfile incidentally. See [development and rendering](docs/DEVELOPMENT.md) for Chrome, exports and the live Player.

## Validate the behavior you changed

| Change | Expected evidence |
| --- | --- |
| Documentation or repository metadata | Check links, commands and GitHub formatting; run `npm run check` |
| Shared numeric helpers | `npm run check` and a focused regression case where useful |
| Drawing, motion, contacts or the Remotion bridge | `npm run check`, `npm run check:port`, `npm run render`, and review actual affected frames |

Visual changes need before/after frames around the affected boundaries: supports, foot planting, turns, blinks or hand transitions. Include OS, Node and Chrome versions. Keep silhouettes whole, feet supported, hand contours continuous and holds deliberate. Numeric checks alone do not prove artistic quality. Do not claim cross-platform rendering from a typecheck or static build.

## Keep the architecture readable

- PixiJS draws contours; Remotion owns composition, time and export. Preserve direct-Pixi/Player agreement and backward seeking.
- Keep character artwork, proportions and action timing in `src/examples/`; shared helpers belong in `src/core/` only when they have a concrete use.
- Preserve the original visual baseline. Do not replace code drawing with a prerecorded movie, image sprites or cut-up reference parts.
- Avoid adding a new language or broad framework before another real example demonstrates the need.
- Discuss remote AI services, telemetry, install scripts, publishing workflows and platform integrations before adding them.

## Submit a pull request

Describe the concrete problem, resulting behavior and validation performed. Link a related issue when available; an issue is not required for a small fix. Keep unrelated cleanup separate and use the [PR template](.github/PULL_REQUEST_TEMPLATE.md). Do not commit credentials, `.env` files, caches, `node_modules/`, `dist/` or local `outputs/`.

Preserve the [MIT source license](LICENSE), [dependency notices](THIRD_PARTY_NOTICES.md), Remotion's separate terms and [artwork provenance](ASSETS.md). Include provenance for new artwork; do not bundle media with unclear rights. No CLA is configured.

## Questions and security

Use [issues](https://github.com/vvvivaldy/curio-motion/issues) for setup problems and focused proposals. Follow the [code of conduct](CODE_OF_CONDUCT.md). For sensitive vulnerabilities, follow [SECURITY.md](SECURITY.md) instead of posting exploit details publicly. No response SLA is promised.
