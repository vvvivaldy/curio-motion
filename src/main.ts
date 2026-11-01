import {scenes} from './examples/scenes';
import { exampleChoice } from './example-choice';
const entry=scenes[exampleChoice(location.search)];
// Direct Pixi preview: a small baseline, not the delivery video pipeline.
const stage = await entry.createStage(document.body);
function render(frame: number) {
  return { frame, pose: stage.draw(frame), graphicsOnly: true, textureAssetCount: 0 };
}
Object.assign(window, { demo: { render, pose:entry.pose, settings:entry.settings } });
render(0);
document.documentElement.dataset.ready = '1';
