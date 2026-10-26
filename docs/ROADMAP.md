# Small steps, visible evidence

1. Completed: reproduced the packaged baseline after `npm ci` on macOS with existing Chrome 152; compared supports, hands, silhouette and frame timing.
2. Completed: extracted the [minimal TypeScript API](API.md) for time/easing, pose evaluation and drawing context. The example stays readable; no parser or universal engine was introduced. See [verification](VERIFICATION.md) for before/after evidence.
3. Quality foundations implemented: shared eye aperture/pupil clipping, contact-aware step position/heading, coordinate frames, tread targets and robust two-bone solving. The example uses a fixed view while turning and one coherent tracking view while riding. The subsequent gait package implements shared foot tracks, load transfer, heel/toe pivots and support-height constraints, with four advancing steps in the example. The third quality package implements compatible hand contours, local wrist frames, shared surface anchors and two deliberate scratch strokes. The fourth quality package adds whole-view contour interpolation, authored front/¾/profile model forms, non-collapsing foot contours and opaque stair solids/panels. Action poses remain unchanged. Review and remaining limits are recorded in [QUALITY_PLAN_RU](QUALITY_PLAN_RU.md).
4. Prove reuse with a separately authorized short second example, perhaps an event-driven prop or simple infographic. Only then settle shared shape/timeline/camera/event primitives.
5. Improve tests and cross-platform rendering. Add real Linux/Windows evidence before claiming support.
6. Evaluate an authoring-agent workflow (reference + explicit action → reviewed source) independently of any provider or product integration.

Outside the current implementation: new scenes, automatic arbitrary character conversion, hosted inference, production queues or integration into another platform. Repository publication is recorded separately in [GITHUB_LAUNCH](GITHUB_LAUNCH.md). Future scope belongs to the owner.
