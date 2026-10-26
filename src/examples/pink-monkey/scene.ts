import { Container, Graphics } from 'pixi.js';
import type { SceneDefinition } from '../../core/stage';
import { pose, type Pose } from './motion';
import { drawMonkey } from './illustration';
import { drawEnvironment } from './environment';

import { pinkMonkeySettings } from './settings';
export { pinkMonkeySettings } from './settings';

interface MonkeyDrawing {
  back: Graphics;
  shadow: Graphics;
  character: Container;
  ink: Graphics;
  front: Graphics;
}

export const pinkMonkeyScene: SceneDefinition<Pose, MonkeyDrawing> = {
  settings: pinkMonkeySettings,
  pose,
  createDrawing(root) {
    const back = new Graphics(), shadow = new Graphics(), character = new Container();
    const ink = new Graphics(), front = new Graphics();
    character.addChild(ink);
    root.addChild(back, shadow, character, front);
    return { back, shadow, character, ink, front };
  },
  draw({ back, shadow, character, ink, front }, q) {
    drawEnvironment(back, front, q);
    shadow.clear().ellipse(q.root[0], q.root[1] + 3, 70 * q.scale, 8).fill({ color: 0x3e4942, alpha: 0.15 });
    character.position.set(...q.root);
    character.scale.set(q.scale);
    character.rotation = 0;
    drawMonkey(ink, q);
  },
};
