import { pinkMonkeySettings } from './pink-monkey/settings';
import { amberRobotSettings } from './amber-robot/settings';
// Demo navigation only. The reusable stage and Remotion bridge know no example IDs.
export const examples={
  'pink-monkey':{title:'Pink monkey · escalator',settings:pinkMonkeySettings,
    film:'docs/assets/demo-v5.mp4',reference:'reference/pink-monkey-reference.png',
    description:'Walk, turn, board, ride and scratch the nose. The preserved first film.'},
  'amber-robot':{title:'Amber robot · a little care',settings:amberRobotSettings,
    film:'docs/assets/amber-robot.mp4',reference:'reference/amber-robot/design.svg',
    description:'Take the watering can, pour twice, return it, release and hold. A second authored example through the same API.'},
} as const;
