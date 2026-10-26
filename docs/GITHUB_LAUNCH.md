# Publication handoff — not executed here

Prepared name: **Curio Motion** / `curio-motion`. Proposed About: “Code-authored 2D animation for AI agents — procedural illustration with PixiJS and deterministic composition/export with Remotion.” Topics are in [repository metadata](../repository-metadata.json).

The owner has already assigned GitHub publication to the receiving agent. General publication permission does not need to be requested again at each step. What remains unspecified is the destination owner/account and exact repository name (proposed: `curio-motion`). This mandate covers the agreed repository/release publication, not deployment or platform integration.

1. Before creating the repository, clarify that destination owner/account and exact name, then verify access through the available authenticated GitHub tools. No destination URL exists yet. Do not reuse a repository from another project.
2. Extract this ZIP in a new location; verify checksums and npm ci/check. Review source/media provenance, notices and Remotion's separate license for the intended use.
3. Initialize Git in that standalone location. Use `main` for the stable baseline and `codex/...` feature branches with PR checks. Do not initialize Git inside the originating workspace.
4. Create the agreed repository, enable Issues and pull requests, preserve LICENSE/community files and confirm default-branch checks. GitHub Actions is configured here but has not run on GitHub; do not claim a passing remote badge.
5. Publish source and the included small demo assets. Exclude node_modules, build/cache/temp frames, qa output and local secrets. No automated deploy or token is configured.
6. Prepare release tag `v0.1.0-beta.1` with scope: one code-authored example, not arbitrary-scene generation. Describe Mac verification and Windows/Linux runtime gaps. Push, tag and release as part of that agreed publication stage; do not treat this as permission for unrelated future work.

This handoff has not created a repository or published anything. Publication is performed by the receiving agent after the missing destination is clarified. See [community-file documentation](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/creating-a-default-community-health-file).
