# November Cancelled

[Watch the English film](assets/november-cancelled-en.mp4). The 50-second, 720 × 1280 cartoon uses the original CurioWorks vector artwork, animation and cuts. Its on-screen lettering, captions and four speaking voices are in English. The newsroom music and effects come from the original mix.

Run `npm run dev` and open `/player.html?example=november-cancelled`. For a new MP4 export with an installed Chrome:

```sh
COMPOSITION_ID=NovemberCancelled RENDER_AUDIO_CODEC=aac npm run render
```

[Scene source](../src/examples/november-cancelled) separates drawing, on-screen lettering, caption cues and the sound track. The English voices were made locally with [Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) via [Kokoro ONNX](https://github.com/thewh1teagle/kokoro-onnx): `af_heart`, `af_sky`, `am_michael` and `bm_george`. The finished mix is bundled; preview and export need no speech model.
