import React, {useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {Graphics} from 'pixi.js';
import {createPixiStage} from '../../src/core/stage';
import {createRemotionScene} from '../../src/remotion/create-scene';
import {publicApiScene, settings} from './public-api-scene';

const Scene = createRemotionScene(publicApiScene);
const direct = await createPixiStage(document.querySelector<HTMLElement>('#direct')!, publicApiScene);
direct.draw(0);
const state = {direct, player: null as PlayerRef | null, unmount: () => root.unmount(), verifyLifecycle};
export type PublicApiProbe = typeof state;
Object.assign(window, {apiProbe: state});
function Preview() {
  const ref = useRef<PlayerRef>(null);
  useEffect(() => {state.player = ref.current;}, []);
  return <Player ref={ref} component={Scene} fps={settings.fps} durationInFrames={settings.durationInFrames}
    compositionWidth={settings.width} compositionHeight={settings.height} controls style={{width: 180}} />;
}
const root = createRoot(document.querySelector('#player')!);
root.render(<Preview />);

async function verifyLifecycle() {
  const check = (ok: unknown, message: string) => {if (!ok) throw new Error(message);};
  const host = document.createElement('div'); document.body.append(host);
  let stage: {draw(frame: number): ReturnType<typeof publicApiScene.pose>; destroy(): void} | undefined;
  let art: Graphics | undefined, creates = 0, poses = 0, draws = 0;
  const mutableSettings = {...settings};
  const failure = new Error('expected caller failure');
  let failPose = false, failDraw = false;
  let lastPoseTime: number | undefined;
  try {
    stage = await createPixiStage(host, {...publicApiScene, settings: mutableSettings,
      createDrawing(root) {creates++; art = new Graphics(); root.addChild(art); return art;},
      pose(time) {poses++; lastPoseTime = time; if (failPose) throw failure; return publicApiScene.pose(time);},
      draw(art, pose, context) {draws++; if (failDraw) throw failure; publicApiScene.draw(art, pose, context);},
    });
    check(creates === 1 && poses === 0 && draws === 0 && !host.dataset.frame, 'Creation must not evaluate frame zero');
    mutableSettings.fps = 12; mutableSettings.width = 99;
    const snapshotPose = stage.draw(24);
    check(lastPoseTime === 1 && snapshotPose.point[0] === publicApiScene.pose(1).point[0] &&
      host.querySelector('canvas')?.width === 180, 'Settings snapshot changed');
    const before = {poses, draws, marker: host.dataset.frame};
    for (const f of [-1, .5, 48, NaN, Infinity]) {
      let error: unknown; try {stage.draw(f);} catch (caught) {error = caught;}
      check(error instanceof RangeError, 'Invalid frame must throw RangeError');
    }
    check(poses === before.poses && draws === before.draws && host.dataset.frame === before.marker, 'Invalid frame reached callbacks');
    failPose = true;
    let error: unknown; try {stage.draw(1);} catch (caught) {error = caught;}
    check(error === failure && host.dataset.frame === '24', 'Pose failure/marker contract');
    failPose = false; failDraw = true; error = undefined;
    try {stage.draw(1);} catch (caught) {error = caught;}
    check(error === failure && host.dataset.frame === '24', 'Draw failure/marker contract');
    stage.destroy(); stage = undefined;
    check(host.querySelector('canvas') === null && art?.destroyed, 'Owner destroy must remove canvas and children');
    let failedArt: Graphics | undefined; error = undefined;
    try {await createPixiStage(host, {...publicApiScene, createDrawing(root) {
      failedArt = new Graphics(); root.addChild(failedArt); throw failure;
    }});} catch (caught) {error = caught;}
    check(error === failure && failedArt?.destroyed && host.querySelector('canvas') === null, 'createDrawing failure leaked');
    for (const invalid of [{...settings, width: 0}, {...settings, fps: 0}, {...settings, fps: Number.MIN_VALUE}]) {
      error = undefined;
      try {await createPixiStage(host, {...publicApiScene, settings: invalid});} catch (caught) {error = caught;}
      check(error instanceof RangeError && host.querySelector('canvas') === null, 'Invalid settings created a stage');
    }
    return {creates, noInitialEvaluation: true, snapshot: true, invalidFrames: 5, callerErrorsPropagated: true,
      destroyCanvasAndChildren: true, createDrawingFailureCleanup: true, invalidSettings: 3};
  } finally {stage?.destroy(); host.remove();}
}
