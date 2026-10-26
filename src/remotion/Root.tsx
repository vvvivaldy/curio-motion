import { pinkMonkeySettings } from '../examples/pink-monkey/scene';
import { amberRobotSettings } from '../examples/amber-robot/scene';
import { Composition, registerRoot } from 'remotion';
import { MonkeyScene, RobotScene } from './Scene';
registerRoot(() => <>
  <Composition id="PinkMonkey" component={MonkeyScene} {...pinkMonkeySettings} />
  <Composition id="AmberRobot" component={RobotScene} {...amberRobotSettings} />
</>);
