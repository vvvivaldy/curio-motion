# Contributing

Start with README and the architecture note. For a change, explain the visible problem, keep a small branch/PR and run `npm run check`. Changes to rendering, timing or async frame ownership also need `check:port`, a real `render`, and before/after frames at affected boundaries. Declare browser/OS; do not infer cross-platform support from one machine.

Keep example-specific artwork separate from shared helpers. Preserve code-based contours and reference provenance. Add no remote AI service, install script, telemetry, publishing workflow or platform integration without discussion. Do not bundle credentials, caches, dependency trees or media with unclear provenance.

The original project code is MIT; preserve third-party notices and Remotion's separate terms. No contributor license agreement or external governance service is configured. Issues/PR templates are ready for the future repository.
