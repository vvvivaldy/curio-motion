import { createRemotionScene } from './create-scene';
import { pinkMonkeyScene } from '../examples/pink-monkey/scene';
import { amberRobotScene } from '../examples/amber-robot/scene';

export const MonkeyScene = createRemotionScene(pinkMonkeyScene);
export const RobotScene = createRemotionScene(amberRobotScene);
