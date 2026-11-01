# Public source API: 1.0 contract baseline

This is the agreed boundary for 1.x, implemented and checked during stage 1. The source version is `1.0.1`, `private: true`; there is no npm import entrypoint. Use relative imports from existing source files. No import relocation is required.

The machine-readable [registry](API_STABILITY.json) classifies every export of all 27 core modules and the shared Remotion bridge: a module default applies unless a name is explicitly stable. `npm run check:api` resolves the names with TypeScript and rejects missing modules/exports, duplicate classifications and missing stable consumer imports. The registry format is an internal checking artifact, not an application configuration API.

| Status | Meaning |
| --- | --- |
| stable | The named contract below is the 1.0 compatibility commitment; retain it during preparation and test intended changes. |
| experimental | Available authoring helpers, including running, anatomy, 3D frames and paper visibility. Use them when useful, pin the source revision and review updates. Their existing examples/tests remain valuable; the contract is not frozen. |
| internal | Diagnostic overlay, entrypoints, registries, example-specific drawings/data/timelines and tooling implementation. Examples may be copied/edited; their exported names are not a compatibility promise. |

## Exact stable names (20: 12 values, 8 types)

| Source path | Stable exports |
| --- | --- |
| `src/core/time.ts` | `Timeline`, `FrameContext`, `clamp`, `mix`, `smooth`, `tween`, `validateTimeline`, `evaluateFrame` |
| `src/core/stage.ts` | `SceneSettings`, `SceneDefinition`, `createPixiStage` |
| `src/core/spatial.ts` | `Point2`, `Frame2D`, `transformPoint`, `inverseTransformPoint` |
| `src/core/contacts.ts` | `Step2D`, `Staircase2D`, `sampleStep`, `treadPoint` |
| `src/remotion/create-scene.tsx` | `createRemotionScene` |

Other exports in these same files keep their module's experimental default. All exports of the other core modules are experimental, except `core/debug.ts` (internal). For instance, `retimeTimeline`, `sampleTravel`, `Frame3`, `solveHingeLimb` and `createRunPlan` remain usable without becoming part of this small stable boundary. [API.md](API.md) describes these helpers, not their stability.

## Inputs, units and failure behavior

All supported numeric arithmetic must stay representable in JavaScript numbers. Coordinates are logical drawing units, usually pixels before transforms; +X is right and +Y is down in the 2D drawing. Values/tuples are caller-owned: treat passed scene configuration and pose data as immutable. TypeScript types do not validate arbitrary JSON. A successful numeric check does not accept anatomy or a physical simulation.

| API | Supported contract |
| --- | --- |
| `Timeline` / `validateTimeline` | `fps` is finite and positive; `durationInFrames` is a positive safe integer; `(durationInFrames - 1) / fps` must be finite. Fractional fps is allowed. Invalid timeline throws `RangeError`. Duration is a frame count; the last sampled time is `(N-1)/fps`, not `N/fps`. |
| `FrameContext` / `evaluateFrame` | `frame` is an integer in `0…N-1`, `time` is seconds (`frame/fps`). Validate timeline and frame before calling `pose`; invalid frame throws `RangeError` without calling it. Return `{frame,time,pose}`; callback errors propagate unchanged. No clamping, playback state or promise support. A pure callback produces the same result on reverse/random seeks. |
| `clamp(x)` | Finite input; return in `0…1`, holding endpoints. |
| `mix(a,b,t)` | Finite inputs and representable intermediate/result; linear interpolation, with extrapolation allowed for `t` outside `0…1`. |
| `smooth(x)` | Finite input; quintic easing, holds 0/1 outside `0…1`; midpoint 0.5. |
| `tween(time,start,end)` | Finite seconds, `start < end` and representable nonzero duration/normalized time; normalized quintic easing, holds 0/1 outside interval. These four small arithmetic helpers do **not** validate their preconditions or promise an exception for NaN/invalid bounds. |
| `Point2` / `Frame2D` | `[x,y]`; finite origin, finite positive uniform scale. No rotation, mirroring or perspective in `Frame2D`. |
| `transformPoint` / `inverseTransformPoint` | Finite point/frame; validate input, throw `RangeError` for nonfinite coordinates/origin/scale or nonpositive scale. Transform local → parent, or parent → local; preserve caller data. Round-trip equality is subject to floating point tolerance. Finite input alone does not guarantee that huge intermediate products remain representable. |
| `Step2D` / `sampleStep` | Finite time/start/end/coordinates/headings/lift; `end > start`, lift ≥0. Violations of those explicit input guards throw `RangeError`. Duration and arithmetic must additionally remain representable; overflow is unsupported and not locally checked. Seconds; optional headings are **unwrapped radians** (no shortest-angle rewrite), default `fromHeading=0`, `toHeading=fromHeading`. Endpoint positions/headings hold before/after swing; `planted` is true at and outside both endpoints. Inside, height is a single nonnegative arc subtracted from Y; progress uses quintic easing. No load, skeleton or collision solver. |
| `Staircase2D` / `treadPoint` | Finite origin/run/rise, run >0, rise ≥0; integer index (negative permitted), finite along in `0…1` (default 0). Invalid inputs throw `RangeError`. Index zero starts at origin, positive indices rise toward smaller Y. Stair dimensions and coordinates use the same drawing units. |

`RangeError` class is contractual for explicitly validated domains; exact English error text and stack traces are diagnostic, not stable. Runtime callback/drawing errors keep their original identity. Arithmetic outside the stated representable domain is unsupported, not an implicit geometry clamp.

## Scene lifecycle and ownership

`SceneSettings` combines Timeline with positive safe integer logical `width`/`height` and a caller-supplied integer RGB `background` in `0x000000…0xffffff`. The stage checks timeline/dimensions; background is a caller precondition, not a promised local validation error. Canvas dimensions must also fit the actual browser/GPU limits: accepting a safe integer does not promise allocation of arbitrarily large canvases.

`SceneDefinition<Pose,Drawing>` supplies synchronous `pose(seconds)`, `createDrawing(root)` and `draw(drawing,pose,context)`. Drawing can be a chart, character or other vector scene. The author owns anatomy, layers, resource preparation and pose meaning. No ticker, accumulated clock, asynchronous drawing or automatic rig is introduced.

`await createPixiStage(host,scene)` snapshots settings, creates one stopped Pixi application, appends its canvas to the supplied live HTMLElement and calls `createDrawing` once. It does not evaluate/draw frame zero automatically. Use one dedicated host per stage; keep scene functions/configuration fixed during its lifetime.

- `draw(frame)` validates the frame, evaluates pose, updates drawing, renders once, then sets `host.dataset.frame`; it returns the pose. Arbitrary valid seek order is supported. On callback failure, the frame marker is not advanced by the stage.
- The stage owns display objects attached to its root. Do not also destroy those objects from another owner. `destroy()` is called **once**, after successful creation, by the owner when done; it removes the canvas and destroys children. Repeated destroy/draw-after-destroy are outside this contract. A host's frame marker is diagnostic and is not cleared on destroy.
- A `createDrawing` exception destroys the initialized application/children and is rethrown. There is no general recovery/retry promise for browser/WebGL initialization, host append or rendering failures. After a successful creation the caller retains cleanup responsibility even if pose/draw throws; use `try/finally`. Resources created by the author but never attached to the root remain the author's responsibility.

`createRemotionScene(scene)` returns a React component using this same stage and `useCurrentFrame`; call the factory once at module scope. Keep settings fixed, register the component with identical dimensions/fps/frame count and use the pinned Remotion context. The bridge handles frame readiness and unmount cleanup; it does not register a composition, mix audio or create a second clock. The returned component's React/Pixi internals, DOM layout and dependency warning strings are not stable APIs. Pixel equality across browsers/GPUs is not promised.

## Commands and consumer example

The stable command names are `dev`, `demo`, `typecheck`, `test`, `build`, `check`, `render` and `create:example`; use the documented options in [DEVELOPMENT](DEVELOPMENT.md) and [AUTHORING](AUTHORING.md). For `render`, `COMPOSITION_ID`, `CHROME_PATH`, `RENDER_OUTPUT`, `RENDER_AUDIO_CODEC=aac` and inclusive `RENDER_RANGE=first:last` retain their documented meanings. Whole-film export remains the default. For `create:example`, the documented id/composition/reference/action-file/title/provenance/dimensions/fps/frames options create new files and refuse overwrite; it remains a blank starter with explicit registration. Log text, generated review/receipt JSON schemas, utility demos and QA tools are experimental/internal as classified in the registry. Third-party APIs keep their own licensing and compatibility rules.

A runnable consumer is [scripts/fixtures/public-api-scene.ts](../scripts/fixtures/public-api-scene.ts); it imports only the stable Curio names and pinned Pixi, authors a moving marker over two treads, and has no reference/image input. A minimal consumer does not need a new barrel or package.

```sh
npm run check:api          # export registry, types via check/typecheck, numeric contracts
npm run check:api:browser  # existing Chrome: real pixels, Player seek and lifecycle
```

The first command checks compiler-resolved availability and numeric contracts; `npm run typecheck` also checks consumer types/negative type cases. The second produces QA evidence, not a new gallery artwork or human visual/sound acceptance. [Support limits](SUPPORT_RU.md) · [Compatibility/migration](COMPATIBILITY_RU.md).
