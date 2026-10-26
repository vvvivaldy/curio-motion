import { createStage } from './stage';
import { pinkMonkeySettings } from './examples/pink-monkey/settings';
import { pose as monkeyPose } from './examples/pink-monkey/motion';
import { createPixiStage } from './core/stage';
import { amberRobotScene } from './examples/amber-robot/scene';
import { exampleChoice } from './example-choice';
const robot = exampleChoice(location.search) === 'amber-robot';
const pose = robot ? amberRobotScene.pose : monkeyPose;
// Direct Pixi preview: a small baseline, not the delivery video pipeline.
const stage = await (robot ? createPixiStage(document.body, amberRobotScene) : createStage(document.body));
function render(frame: number) {
  return { frame, pose: stage.draw(frame), graphicsOnly: true, textureAssetCount: 0 };
}
Object.assign(window, { demo: { render, pose, settings: robot ? amberRobotScene.settings : pinkMonkeySettings } });
render(0);
document.documentElement.dataset.ready = '1';
