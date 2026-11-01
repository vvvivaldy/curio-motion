# Changes for 0.2.0-beta.1

GitHub prerelease: [v0.2.0-beta.1](https://github.com/vvvivaldy/curio-motion/releases/tag/v0.2.0-beta.1). The preceding public prerelease is 0.1.0-beta.1. The attached source ZIP preserves the exact clean-tested payload; this tag also includes publication documentation and a corresponding manifest. Rendering inputs are unchanged.

- Consolidates reusable motion, contact, coordinate/limb and illustration helpers, code-authored examples and preserved films into one source project.
- Adds the accepted raccoon courier and independent educational infographic. Three infographic values now derive totals/percentages and select the actual unique maximum, with explicit input bounds.
- Includes recorded effects, complete material/source credits and 16 new courier WAV variants from 13 recordings.
- Ships the example scaffold, private-input distribution filter, current user/agent instructions and author/critic task examples.
- Adds setup/export aliases and a checksum verifier for the initial source payload. Direct dependencies stay pinned; the project does not install global tools.

Beta APIs may change. This archive is a local TypeScript source project, not an npm package. Rendering support is verified only for the recorded macOS environment; browser/export on Windows/Linux is not claimed. See [BETA](BETA.md) and the verification report supplied next to the ZIP. Historical films and reports are evidence for their own versions, not automatic approval of every changed scene.

## Dependency corrections found during the clean-install trial

The initial candidate reported 12 npm advisories. Vite is updated to 6.4.5, Puppeteer Core to 25.16.0, and only transitive zod@4.5.4 is overridden to 4.6.6. The intermediate Vite 6.4.4 result was retained, then replaced with the additional [6.4.5 fix](https://github.com/vitejs/vite/security/advisories/GHSA-8g5g-mxqh-grgj). See the [earlier Vite advisory](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22) and [Zod fix](https://github.com/colinhacks/zod/commit/a0ebf970f2d752e5f58527cd2942ff48be4f46bd). The final preparation audit reports zero known advisories; this is not a claim of a full security audit.

## Source-page provenance cleanup before publication

GitHub push protection found an embedded third-party map-service token in cached sound-source HTML. The publication redacts Mapbox tokens from 21 page snapshots, updates their page-SHA metadata and records the limited transformation in [REDACTIONS](assets/sfx/provenance/REDACTIONS.md). Audio, attribution, licensing text and rendering inputs are unchanged. Protection was not bypassed; the rejected unpublished commit is replaced rather than retained in the new branch history.
