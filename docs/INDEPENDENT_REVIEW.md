# Independent visual review (opt-in)

A v2 plan can require a separate recorded inspection of the same evidence:

```json
"independentReview": {"stages": ["model", "final"]}
```

`final` is mandatory when this property is present; `model` is optional. Other stages,
duplicates and v1 opt-in are rejected. Omit the property to preserve the existing
v1/v2 workflow. Set the policy before capture: the plan is part of capture identity,
so adding it to an old plan requires recapture, though a QA-only change does not by
itself require exporting a new film.

Capture with the existing commands (replace the example and output paths):

```sh
npm run review -- --plan authoring/new-example.json --stage model
npm run review -- --plan authoring/new-example.json --stage final \
  --film outputs/new-example.mp4 --receipt qa/NewExample-render.json
```

Each selected run directory receives `review.json` and, for gated stages,
`independent-review.json`, both pending. The separate inspector should read the
whole reference, declared criteria, actual frames and full final playback at 1×
and 0.5×, then write their own observations. The author must complete their
`review.json` first. Independent review has the same per-criterion checks, frames,
issues, acceptance rules and capture hash, plus:

```json
{
  "captureSha256": "SHA-256 of this run's capture.json",
  "role": "independent",
  "authorReviewSha256": "SHA-256 of this run's completed review.json bytes",
  "reviewer": "Actual separate inspector identity",
  "decision": "accept",
  "notes": "Specific observations from this inspection",
  "checks": [
    {"criterion": "declared-id", "verdict": "pass", "frames": [10, 11],
     "notes": "What was actually visible in these frames"}
  ],
  "playback": {"normal": true, "slow": true,
    "notes": "Specific observations at 1× and 0.5×, including pace and contacts"},
  "issues": []
}
```

Use all declared criteria and their actual required frames, rather than the example
IDs above. Model review does not require playback. Required visual or geometric
defects block acceptance; optional limitations retain the existing explicit linked
issue rules. Do not set `accept` or playback flags before inspection.

Find run names in `qa/authoring/<id>/latest.json`. To hash the completed author
review without changing its bytes:

```sh
node --input-type=module -e 'import {readFile} from "node:fs/promises"; import {createHash} from "node:crypto"; console.log(createHash("sha256").update(await readFile(process.argv[1])).digest("hex"));' \
  qa/authoring/new-example/final-RUN/review.json
npm run review -- --plan authoring/new-example.json --check
```

Delivery checks both reviews against the same `captureSha256`. Missing, pending,
rejected, stale, incomplete-frame or unobserved-playback reviews block delivery.
Editing the author review also invalidates the independent review until it is
explicitly reconsidered and rebound. Delivery records the independent review hash,
declared reviewer and author-review hash.

The tool checks a **declared separate identity**, with case/whitespace/Unicode
normalization to catch accidental self-review. A different name cannot prove
independence or that playback occurred. Organizational independence must come from
an actual separate agent/person, who supplies their own findings. Hashes establish
evidence identity, not artistic quality.

This gate does not measure first-attempt generation quality. Preserve initial
captures and failed reviews before repairs when evaluating a new task; later
recaptures are repaired attempts. The already repaired ivory example cannot be
relabelled as a clean first-pass generation.
