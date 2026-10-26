import { Graphics } from 'pixi.js';
import type { SceneDefinition } from '../../core/stage';
import { robotPose, type RobotPose } from './motion';
import { drawGarden, drawRobot } from './illustration';
import { amberRobotSettings } from './settings';
export { amberRobotSettings } from './settings';
interface Drawing {back:Graphics;ink:Graphics}
export const amberRobotScene:SceneDefinition<RobotPose,Drawing>={
  settings:amberRobotSettings,pose:robotPose,
  createDrawing(root) {const back=new Graphics(),ink=new Graphics();root.addChild(back,ink);return {back,ink};},
  draw({back,ink},q) {drawGarden(back);drawRobot(ink,q);},
};
