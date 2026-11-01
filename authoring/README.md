# Authoring inputs and review plans

These files support the included scenes and the review tools; they are not release-progress reports.

- `*.inputs.json` and reference manifests declare whole-input identity and `local-only` distribution. Keep them: build/package privacy filtering reads these declarations.
- `*.action.txt` and pinned feedback preserve the actual task bytes.
- Scene JSON files specify settings, sample frames, criteria and diagnostics.
- The scaffold creates `*.agent.md` / `*.plan.md` instructions for new tasks. Completed assignments for the bundled examples remain in Git history.

The current scene/movie selection is in [EXAMPLES](../docs/EXAMPLES.md). Historical artifact hashes in older plans identify that old film and source; do not rebind them to a newer movie. To repeat an old review, use its original Git tag/commit and required private input. Superseded movies are available in the [v1.0.0 snapshot](https://github.com/vvvivaldy/curio-motion/tree/v1.0.0/docs/assets), rather than duplicated in the current checkout.

Keep new temporary reports, captures and intermediate exports under ignored `qa/` or `outputs/`. Only selected final media and useful user/developer guides belong in the maintained documentation.
