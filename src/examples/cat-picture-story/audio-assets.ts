// Exact imported WAV candidates. Timing anchors are technical, not heard attacks.
export const soundAssets={
  "clock-tick": {
    "file": "audio/sfx/story/clock-tick.wav",
    "sha256": "e33e43368898b9b759aef64e24f80eb60da385f111ba7b328207b5e7bca80e66",
    "duration": 0.185,
    "technicalAnchor": 0.04,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/sounds-mp3/sounds/539880/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "clock-tock": {
    "file": "audio/sfx/story/clock-tock.wav",
    "sha256": "275c2f14c4247b5c6499e666bea4142efd8f4b396443e31064be42e5041cba80",
    "duration": 0.23,
    "technicalAnchor": 0.045,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/sounds-mp3/sounds/539880/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "paw-tile-01": {
    "file": "audio/sfx/story/paw-tile-01.wav",
    "sha256": "f00b4232df974fb8b33b9e2919562ee9c6bd63894c604d84ec99ab0dcd91a099",
    "duration": 0.24,
    "technicalAnchor": 0.045,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/SpliceSound/sounds/197402/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "paw-tile-02": {
    "file": "audio/sfx/story/paw-tile-02.wav",
    "sha256": "f897c9ffd40a5a0cd4b297604471d50ed63991c08fe0e429315302b97fa09b81",
    "duration": 0.235,
    "technicalAnchor": 0.04,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/SpliceSound/sounds/197402/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "paw-tile-03": {
    "file": "audio/sfx/story/paw-tile-03.wav",
    "sha256": "87de7f2d2efbb470e1fb00ba630e3ef0b4cf4ab071661a70bc9378000d88b845",
    "duration": 0.26,
    "technicalAnchor": 0.055,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/SpliceSound/sounds/197402/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "frame-impact": {
    "file": "audio/sfx/story/frame-impact.wav",
    "sha256": "f2518b37452f707263de87045b60f84b5f59a18f7970ebc87ab930acd437547e",
    "duration": 0.285,
    "technicalAnchor": 0,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/CosmoX45/sounds/723568/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "frame-bounce": {
    "file": "audio/sfx/story/frame-bounce.wav",
    "sha256": "b80c3392144189976e46caa070343c4eee66a5c13eb604ac09ac4d76293358ec",
    "duration": 0.505,
    "technicalAnchor": 0.025,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/CosmoX45/sounds/723568/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "frame-slide": {
    "file": "audio/sfx/story/frame-slide.wav",
    "sha256": "7d1d3e5a854749686c2c46a74dd6fed30b6d7d4ea8c7c69564da512075846413",
    "duration": 0.5,
    "technicalAnchor": 0.135,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/seema_grewal/sounds/842107/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "cat-hiss": {
    "file": "audio/sfx/story/cat-hiss.wav",
    "sha256": "e700dfb458d3998f140b6f3298e68e31a25a1424b6f76bdb68d59b0621b2861f",
    "duration": 0.65,
    "technicalAnchor": 0.015,
    "license": "CC-BY-4.0",
    "sourcePage": "https://freesound.org/people/cdonahueucsd/sounds/620962/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "groom-rustle": {
    "file": "audio/sfx/story/groom-rustle.wav",
    "sha256": "ed0398291050e84387dc05fb56360803beaa0486492af5ee5beae246cb8a71e0",
    "duration": 0.6,
    "technicalAnchor": 0.01,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/IENBA/sounds/850704/",
    "anchorMeaning": "5ms RMS threshold; perceived onset not reviewed"
  },
  "chair-creak": {
    "file": "audio/sfx/chair/chair-creak-cc0-01.wav",
    "sha256": "889c62fb45b269682e60a8afe56c3c961d0d9f3915e003c78b868c79494c6bbc",
    "duration": 0.548,
    "technicalAnchor": 0.008,
    "license": "CC0-1.0",
    "sourcePage": "https://freesound.org/people/unkleceeg/sounds/276473/",
    "anchorMeaning": "Existing technical onset reference, not new listening evidence"
  }
} as const;
export type SoundAsset=keyof typeof soundAssets;
