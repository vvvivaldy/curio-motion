import {catPictureStorySettings} from './cat-picture-story/settings';
import {blackCatChairSettings} from './black-cat-chair/settings';
import { pinkMonkeySettings } from './pink-monkey/settings';
import { amberRobotSettings } from './amber-robot/settings';
// Demo navigation only. The reusable stage and Remotion bridge know no example IDs.
export const examples={
  'cat-picture-story-v3':{title:'Paper cat story',settings:catPictureStorySettings,reference:null,audio:true,film:'docs/assets/cat-picture-story-v3.mp4',description:'An authored 35-second vector story with a finite running plan, rigid spaces, directed joints, opaque surfaces and recorded event-driven foley. The whole authoring references remain private.'},
  'black-cat-chair':{title:'Black cat · chair climb',settings:blackCatChairSettings,
    film:'docs/assets/black-cat-chair-v3.mp4',reference:null,
    description:'An authored vector cat walks, grips and climbs a red chair, sits, turns left, jumps down and rises. The whole reference photograph remains private.'},
  'pink-monkey':{title:'Pink monkey · escalator',settings:pinkMonkeySettings,
    film:'docs/assets/demo-v5.mp4',reference:'reference/pink-monkey-reference.png',
    description:'Walk, turn, board, ride and scratch the nose. The preserved first film.'},
  'amber-robot':{title:'Amber robot · a little care',settings:amberRobotSettings,
    film:'docs/assets/amber-robot-v2.mp4',reference:'reference/amber-robot/design.svg',
    description:'Take the watering can, pour twice, return it, release and hold. A second authored example through the same API.'},
} as const;
