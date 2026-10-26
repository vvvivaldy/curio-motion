# Architecture: what exists

The example is a pure `pose(t)` plus procedural illustration and environment functions. `createStage(host)` awaits Pixi initialization and returns `draw(frame)`/`destroy()`. Draw validates integer frames 0..287, evaluates `t=frame/24`, rebuilds Graphics paths and renders once. Ticker and accumulated playback state are absent.

`MonkeyScene` receives `useCurrentFrame()`. An initialization promise belongs to the mounted component. Each frame acquires a `delayRender` handle, draws only if its effect is still current, then releases the handle. Cleanup releases obsolete handles and destroys the stage on unmount. This is an example-specific thin bridge, not a second timeline engine.

Remotion `Composition` declares size/fps/duration. `Player` gives live seek/play; `renderMedia()` exports code frames through the official renderer. Direct Pixi preview uses the same stage and exists only as a small baseline. The movie file is never input to the composition. The reference is authoring input only.

Coordinates: 1280×720 canvas, local character origin at the ground/root; 3D-like numeric joints project to 2D. Visible contours are constructed anew, not rotated image parts. Body offsets affect hips and shoulders before limb solving; planted feet stay in screen/world targets. After boarding, feet remain on one horizontal tread while camera-relative station details move.

Current constants are in the example, not a public reusable API. No AI backend, arbitrary-scene generator, parser, server queue, persistence, platform integration or renderer farm exists. Future typed helpers should be extracted after the unchanged example is reproduced, with tests for time bounds, channel conflicts and contact behavior where appropriate.

Read the source in this order: motion → illustration/environment → stage → Remotion Scene/Root → render. Read [ROADMAP](ROADMAP.md) before adding abstraction.
