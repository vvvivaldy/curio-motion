# Changes

## Unreleased — repository housekeeping

- Remove completed production plans, progress receipts, review dumps and superseded media from the maintained checkout. Their history remains in the unchanged v1.0.0 tag.
- Separate beta studies from current examples in documentation and demo navigation. Keep selected films, API contracts, privacy manifests and media credits.
- Update setup/release links to the published stable version; runtime dependencies and animation geometry are unchanged.

## 1.0.0 — 2026-11-01

Promotes the owner-accepted 1.0.0-rc.1 source project to version 1.0.0. The20 stable source API names, scripts, dependency graph, drawings, recorded audio and accepted films are unchanged; root version metadata and current release documentation are updated. macOS arm64 remains the officially verified end-to-end scope.

The versioned release ZIP and external verification identify the actual tag/commit, newly checked stable payload and downloaded public bytes. [Stable release and verification reports](https://github.com/vvvivaldy/curio-motion/releases/tag/v1.0.0) are published. Earlier beta/RC archives and receipts are preserved.

## 1.0.0-rc.1 — local candidate, 2026-11-01

Historical local candidate, later accepted and promoted to stable 1.0.0. The items below describe that preparation, not the current publication status.

- Names 20 stable source API exports and eight stable commands, with numeric/time/lifecycle contracts, experimental/internal boundaries and a migration policy. Existing import paths remain available.
- Rejects a timeline whose final frame time would overflow to Infinity before pose evaluation. Fixes the observed Player reverse-seek audio-pool exhaustion through the supported Remotion Player option.
- Adds the owner-accepted 36-second MorningDelivery pilot, editable educational chart values and the exact preserved film.
- Provides repeatable deterministic source packaging, complete root/nested checksums, SFX provenance bindings, known-pattern credential checks, backed-up cached-page redaction and exact Git/ZIP/outgoing-history checks.
- Records the stage 4 macOS arm64 baseline: Node 22.12.0 / npm 10.9.0 and Node 26.13.0 LTS / npm 11.20.0, four clean Git/ZIP routes, 25 configured scenes / 1920 comparisons plus MorningDelivery / 150, Player/API/objects/starter, four full MP4s and bounded resource/error cleanup. Linux/Windows remain unverified by explicit owner scope.
- RC preparation changes only root version metadata and current release documentation relative to that tested baseline; source, scripts, recorded media and dependency versions are preserved. The root version changes the image-export-v2 fingerprint, so old receipts are not relabeled as current RC runs.

Original code remains MIT. Remotion, artwork and recorded audio retain their separate terms and attribution. The project remains an editable TypeScript source project (`private: true`), not an npm package.

The sections below preserve earlier release history and its version-specific evidence.

## Changes for 0.2.0-beta.1

GitHub prerelease: [v0.2.0-beta.1](https://github.com/vvvivaldy/curio-motion/releases/tag/v0.2.0-beta.1). The preceding public prerelease is 0.1.0-beta.1. The attached source ZIP preserves the exact clean-tested payload; this tag also includes publication documentation and a corresponding manifest. Rendering inputs are unchanged.

- Consolidates reusable motion, contact, coordinate/limb and illustration helpers, code-authored examples and preserved films into one source project.
- Adds the accepted raccoon courier and independent educational infographic. Three infographic values now derive totals/percentages and select the actual unique maximum, with explicit input bounds.
- Includes recorded effects, complete material/source credits and 16 new courier WAV variants from 13 recordings.
- Ships the example scaffold, private-input distribution filter, current user/agent instructions and author/critic task examples.
- Adds setup/export aliases and a checksum verifier for the initial source payload. Direct dependencies stay pinned; the project does not install global tools.

Beta APIs may change. This archive is a local TypeScript source project, not an npm package. Rendering support is verified only for the recorded macOS environment; browser/export on Windows/Linux is not claimed. See [BETA](https://github.com/vvvivaldy/curio-motion/blob/v1.0.0/BETA.md) and the verification report supplied next to the ZIP. Historical films and reports are evidence for their own versions, not automatic approval of every changed scene.

## Dependency corrections found during the clean-install trial

The initial candidate reported 12 npm advisories. Vite is updated to 6.4.5, Puppeteer Core to 25.16.0, and only transitive zod@4.5.4 is overridden to 4.6.6. The intermediate Vite 6.4.4 result was retained, then replaced with the additional [6.4.5 fix](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj). See the [earlier Vite advisory](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22) and [Zod fix](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd). The final preparation audit reports zero known advisories; this is not a claim of a full security audit.

## Source-page provenance cleanup before publication

GitHub push protection found an embedded third-party map-service token in cached sound-source HTML. The publication redacts Mapbox tokens from 21 page snapshots, updates their page-SHA metadata and records the limited transformation in [REDACTIONS](assets/sfx/provenance/REDACTIONS.md). Audio, attribution, licensing text and rendering inputs are unchanged. Protection was not bypassed; the rejected unpublished commit is replaced rather than retained in the new branch history.
