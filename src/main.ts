import { createStage } from './stage';
import { pose } from './examples/pink-monkey/motion';
// Direct Pixi preview: a small baseline, not the delivery video pipeline.
const stage = await createStage(document.body);
function render(frame: number) {
  return { frame, pose: stage.draw(frame), graphicsOnly: true, textureAssetCount: 0 };
}
Object.assign(window, { demo: { render, pose } });
render(0);
document.documentElement.dataset.ready = '1';
