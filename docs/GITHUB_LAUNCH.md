# GitHub publication

The owner confirmed the standalone destination [vvvivaldy/curio-motion](https://github.com/vvvivaldy/curio-motion). The public repository, source and original small demo assets were published on 2026-10-26 using the authenticated owner account. No credentials, dependency trees, caches, QA captures or local render outputs are included.

- Default branch: `main`; feature branch: `codex/minimal-typescript-api`; API extraction: [PR #1](https://github.com/vvvivaldy/curio-motion/pull/1).
- The original visual baseline is preserved in commit `0a30becd5a4ac5c5ec00deb3d60bb184f665c4bd` and unchanged `docs/assets/` files.
- About and topics are tracked in `repository-metadata.json`; Issues and pull requests are enabled. No deployment is configured.
- GitHub Actions passed for the [baseline](https://github.com/vvvivaldy/curio-motion/actions/runs/40373226829) and [API branch](https://github.com/vvvivaldy/curio-motion/actions/runs/40373227357): `npm ci` and `npm run check` on Ubuntu/Node 22. These checks do not establish Linux browser/render support. Subsequent runs and PR checks are visible in [Actions](https://github.com/vvvivaldy/curio-motion/actions).
- Release tag/destination: [v0.1.0-beta.1](https://github.com/vvvivaldy/curio-motion/releases/tag/v0.1.0-beta.1). The release process tags the checked `main` commit, verifies the source ZIP manifest and attaches the source ZIP, its SHA-256 file and the original Remotion demo. Actual publication state is shown on that release page.

Scope: one authored example and a minimal local TypeScript API. No arbitrary-scene generator, second example, hosted inference, deployment or platform integration. Mac rendering verification and Windows/Linux runtime gaps are recorded in [VERIFICATION](VERIFICATION.md). Original code is MIT; preserve [ASSETS](../ASSETS.md), [THIRD_PARTY_NOTICES](../THIRD_PARTY_NOTICES.md) and Remotion's separate license.

Further publication or repository operations must verify the owner, exact repository and authentication again as appropriate; this completed launch is not permission for unrelated future changes.

## Repository presentation — 2026-10-26

The presentation pass simplifies the English README, aligns the Russian quick start, adds a development/rendering guide, expands contributor guidance and improves issue/PR templates. Badges show the actual main-branch check, original-code license, experimental status and GitHub stars. No coverage or package-download claim is made.

The About description and 12 relevant topics are defined in `repository-metadata.json`. Existing settings were saved outside the repository before updating them. No deployment or external promotion is part of this change.

### Social preview and profile pin

Prepared artwork: [`docs/assets/social-preview.png`](assets/social-preview.png), 1280×640, under 1 MB. It uses the existing palette and a real frame from the current film. Preparing this file does **not** upload it as GitHub's social preview.

Two UI actions remain; the available GitHub API does not expose them:

1. In [repository Settings](https://github.com/vvvivaldy/curio-motion/settings), find **Social preview → Edit → Upload an image** and select `docs/assets/social-preview.png`. See [GitHub's social-preview guide](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/customizing-your-repositorys-social-media-preview).
2. On [the owner profile](https://github.com/vvvivaldy), choose **Customize your pins**, select `curio-motion` while keeping the existing pins, then **Save pins**. See [GitHub's pinning guide](https://docs.github.com/en/account-and-profile/how-tos/profile-customization/pinning-items-to-your-profile).

The current render/bridge and baseline remain unchanged by this presentation pass. Documentation validation runs against a clean copy of the published base so concurrent local animation work is excluded.
