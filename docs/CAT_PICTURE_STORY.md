# Paper cat story

This authored 35-second example draws a charcoal cat, room, chair, clock and falling picture as vector geometry. A coding agent studied whole references and authored the shapes/action; there is no automatic reference-to-film service. The owner references remain private and are not needed to run the code.

## Run and export

```sh
npm ci
npm run check
npm run dev
```

Open `http://127.0.0.1:4176/player.html?example=cat-picture-story-v3` for live code rendering or `viewer.html?example=cat-picture-story-v3` for the exported film and source view. Both use the same typed scene. The current checkout includes V3; superseded V1/V2 exports remain in Git history.

```sh
CHROME_PATH='/path/to/existing/Chrome' COMPOSITION_ID=CatPictureStoryV3 RENDER_AUDIO_CODEC=aac npm run render
```

Use an installed Chrome/Chromium executable; the renderer refuses an automatic browser download. The output is `outputs/cat-picture-story-v3-remotion.mp4`. The [README GIF](assets/cat-picture-story-v3.gif) is a derivative of the [official MP4](assets/cat-picture-story-v3.mp4); runtime geometry never samples those files.

## Source responsibilities

- `src/core/run.ts`: dimension-aware forward path, planted contacts, swing/flight and finite braking; it owns no cat anatomy.
- `src/core/arm-motion.ts`: optional rear shoulder excursion from actual drawing dimensions and explicit angular calibration.
- `src/examples/cat-picture-story/spatial-model.ts`: the example's rigid spaces, directed limb chains and actual paper surfaces.
- `run-v3.ts`: adapts that plan into the story, including short transition windows and actual contact events.
- `spatial-climb.ts`, `spatial-motion.ts` and `environment.ts`: other authored actions, shared room/prop geometry and camera.
- `scene-v3.ts`, `sound-v3.tsx`: the shared Pixi/Remotion bridge and recorded event-driven one-shots.

The ordinary-run default uses 22.5° forward lean; the example's head/arms remain coherent with that body. Distinct dimensions are checked separately from the authored cat. Reach/length/support tests, corresponding physical-shell boundary checks and actual native/decoded images answer different questions. They do not establish unrestricted physics, automatic anatomy or artistic correctness for future characters. An agent must still inspect silhouette, action order and normal/slow playback.

## Sound and rights

The 11 distributed WAVs are prepared excerpts of official public HQ MP3 previews, not native lossless recording masters. Ten story cuts come from six recordings; one CC0 chair cut is reused. Barefoot-tile and fabric recordings serve as foley for paws/grooming, not recordings of actual cat paws/fur. Technical activity anchors are distinct from perceived onset.

[Story credits](../public/audio/sfx/story/CREDITS.md), [story catalog](../public/audio/sfx/story/catalog.json), [selected chair credit](../public/audio/sfx/chair/CREDITS.md) and [selected chair catalog](../public/audio/sfx/catalog.json) retain authors, sources, hashes and cut/gain/fade processing. “Cat Hiss” by cdonahueucsd ([Freesound620962](https://freesound.org/people/cdonahueucsd/sounds/620962/)) is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/); keep that attribution with the derived audio/film. Other selected recordings are CC0 with provenance retained.

Original source code is MIT; PixiJS is MIT; Remotion has its separate Remotion License. Recording and reference-artwork rights are separate from code licensing. See ASSETS.md and THIRD_PARTY_NOTICES.md.

Technical AAC checks do not individually resolve one extremely attenuated entrance paw cue because its signal is below the coding residual. The other 127 scheduled cues are measurable; no listening approval is claimed.
