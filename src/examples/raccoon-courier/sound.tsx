import {Html5Audio, Sequence, staticFile} from 'remotion';
import {createRemotionScene} from '../../remotion/create-scene';
import {raccoonCourierScene} from './scene';
import {courierBeats, runPlans} from './motion';
import {raccoonCourierSettings} from './settings';

const Picture = createRemotionScene(raccoonCourierScene);
const {fps} = raccoonCourierSettings;

// Exact local WAV metadata from assets/sfx/courier/manifest.json.
// CC0 sources/credits and source-range/gain/fades remain with that package.
// These 5ms RMS activity anchors are technical references, not heard attacks.
export const courierSoundAssets = {
  shoe0: {id: 'shoe-wood-leather-01', durationSeconds: .4, activityAnchorSeconds: .04},
  shoe1: {id: 'shoe-wood-leather-02', durationSeconds: .4, activityAnchorSeconds: .045},
  wood: {id: 'wood-desk-touch', durationSeconds: .17, activityAnchorSeconds: .03},
  pickup: {id: 'paper-pickup-note', durationSeconds: .145, activityAnchorSeconds: .025},
  handling: {id: 'paper-finger-pass', durationSeconds: .85, activityAnchorSeconds: .005},
  turn: {id: 'paper-turn-book', durationSeconds: .78, activityAnchorSeconds: .13},
  leather: {id: 'bag-leather-flex', durationSeconds: .75, activityAnchorSeconds: .27},
  settle: {id: 'paper-soft-brush', durationSeconds: .48, activityAnchorSeconds: .01},
} as const;

type Recording = typeof courierSoundAssets[keyof typeof courierSoundAssets];
function cue(id: string, recording: Recording, targetSeconds: number, gain: number, action: string) {
  return {
    id,
    recordingId: recording.id,
    asset: `audio/sfx/courier/${recording.id}.wav`,
    from: Math.max(0, Math.round((targetSeconds - recording.activityAnchorSeconds) * fps)),
    // Keep the complete file tail; duration is rounded up, never cut to one step interval.
    durationInFrames: Math.ceil(recording.durationSeconds * fps),
    sourceDurationSeconds: recording.durationSeconds,
    technicalActivityAnchorSeconds: recording.activityAnchorSeconds,
    targetSeconds,
    gain,
    action,
  };
}

// One leather-shoe/wood bank throughout. Actual different recorded contacts are
// selected by the controller's permanent foot side, with no random/pitch changes.
const shoeBySide = [courierSoundAssets.shoe0, courierSoundAssets.shoe1] as const;
const footsteps = Object.entries(runPlans).flatMap(([run, plan]) => plan.contacts
  // Retain the prior entry/exit contact selection, including the two frame-edge contacts.
  .filter(c => c.time > plan.start && c.station > -40 && c.station < 1370)
  .map((c, i) => ({
    ...cue(`${run}-${i}`, shoeBySide[c.side], c.time, .5, 'Обувь касается деревянного пола'),
    kind: 'footstep' as const,
    run,
    side: c.side,
    station: c.station,
  })));

// Geometric first overlap with the real bag lip in anatomy-v3/sound-moments.json.
// It is a visible contact landmark, not a measured perceived audio onset.
const firstBagLipOverlap = 9.004346095095391;
const details = [
  cue('table-edge-tap', courierSoundAssets.wood, courierBeats.tableTouch, .5,
    'Лапа касается деревянного края стойки'),
  cue('paper-lift-grip', courierSoundAssets.pickup, courierBeats.lift, .65,
    'Хват удерживает бумагу при начале подъёма; банкнота используется как фоли конверта'),
  cue('paper-lift-rustle', courierSoundAssets.handling, courierBeats.lift + .15, .28,
    'Бумага поднимается и получает вторую опору; отдельная запись пальцев по листу'),
  cue('paper-turn', courierSoundAssets.turn, courierBeats.turnStart, .7,
    'Освобождение второй лапы и переворот конверта; книжная страница как фоли'),
  // Put this short handling transient within the final closing motion, before the held grip.
  cue('paper-top-regrip', courierSoundAssets.pickup, courierBeats.nearTopGrip - .05, .5,
    'Основная лапа заканчивает перехват верхнего края'),
  cue('bag-lip-leather', courierSoundAssets.leather, firstBagLipOverlap, .4,
    'Бумага проходит горловину; движение кожаной куртки как фоли кожи сумки'),
  cue('paper-through-mouth', courierSoundAssets.handling, firstBagLipOverlap, .36,
    'Бумага проходит кромку и опускается внутрь сумки'),
  cue('paper-settle-inside', courierSoundAssets.settle, courierBeats.releaseInside, .45,
    'Последний хват отпущен, бумага слегка опускается внутри; не скольжение по стойке'),
].map(c => ({...c, kind: 'detail' as const}));

export const courierSoundCues = [...footsteps, ...details].sort((a, b) => a.from - b.from);

export function RaccoonCourier() {
  return <><Picture/>{courierSoundCues.map(c =>
    <Sequence key={c.id} from={c.from} durationInFrames={c.durationInFrames} layout="none">
      <Html5Audio src={staticFile(c.asset)} volume={c.gain}/>
    </Sequence>,
  )}</>;
}
