# Architecture: what exists

The example is a pure `pose(t)` plus procedural illustration and environment functions. `createStage(host)` delegates to the shared `createPixiStage(host, pinkMonkeyScene)`, awaits Pixi initialization and returns `draw(frame)`/`destroy()`. Draw validates integer frames 0..287 through `evaluateFrame`, evaluates `t=frame/24`, rebuilds Graphics paths and renders once. Ticker and accumulated playback state are absent.

`MonkeyScene` receives `useCurrentFrame()`. An initialization promise belongs to the mounted component. Each frame acquires a `delayRender` handle, draws only if its effect is still current, then releases the handle. Cleanup releases obsolete handles and destroys the stage on unmount. This is an example-specific thin bridge, not a second timeline engine.

Remotion `Composition` declares size/fps/duration. `Player` gives live seek/play; `renderMedia()` exports code frames through the official renderer. Direct Pixi preview uses the same stage and exists only as a small baseline. The movie file is never input to the composition. The reference is authoring input only.

Coordinates: 1280×720 canvas, local character origin at the ground/root; 3D-like numeric joints project to 2D. Visible contours are constructed anew, not rotated image parts. Body offsets affect hips and shoulders before limb solving; planted feet stay in screen/world targets. After boarding, feet remain on one horizontal tread while camera-relative station details move.

The [minimal local API](API.md) is in `src/core/time.ts` and `src/core/stage.ts`: easing, validated frame evaluation and a typed `SceneDefinition<Pose, Drawing>`. The example's `scene.ts` owns settings, display objects and drawing order. Remotion Composition and Player read those same settings. Anatomy, geometry, supports and action timings remain in the example. No timeline channels, AI backend, arbitrary-scene generator, parser, server queue, persistence, platform integration or renderer farm exists. Tests cover frame/time bounds and existing contacts; a second visual consumer has not been implemented.

Read the source in this order: motion → illustration/environment → stage → Remotion Scene/Root → render. Read [ROADMAP](ROADMAP.md) before adding abstraction.

## Shared contacts, eye geometry and spaces

The quality pass adds small pure modules for visible eye apertures/pupil clipping, step position and heading, horizontal tread targets, explicit coordinate frames and robust two-bone solving. Their API is documented in [API.md](API.md). They are exercised with arbitrary numeric layouts, not tied to one reference or action.

The pink-monkey pose now distinguishes platform-local contacts, world root/sole points and a camera view. During turning the camera is stationary: small lift/plant steps change each foot's position and heading, while grounded contacts hold. During riding the platform moves in world space and the camera follows it; station objects share one view transform. Character yaw affects the character only. The eye renderer consumes visible geometry from the shared helper instead of painting a full white ellipse and covering it with skin.

The improved film is `docs/assets/demo-v2.mp4`; `demo.gif` is a documentation derivative. `demo.mp4` and `baseline.mp4` retain the original beta visuals. None of these media files is loaded by the code scene.
