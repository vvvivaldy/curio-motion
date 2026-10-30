import {createPixiStage,type SceneDefinition} from '../core/stage';
import {createRemotionScene} from '../remotion/create-scene';
import {pinkMonkeyScene} from './pink-monkey/scene';
import {amberRobotScene} from './amber-robot/scene';
import {blackCatChairScene} from './black-cat-chair/scene';
function entry<P,D>(id:string,scene:SceneDefinition<P,D>){
 return {id,settings:scene.settings,pose:scene.pose,Component:createRemotionScene(scene),createStage:(host:HTMLElement)=>createPixiStage(host,scene)};
}
// Exactly the three public authored examples share these preview/export entries.
export const scenes={
 'pink-monkey':entry('PinkMonkey',pinkMonkeyScene),
 'amber-robot':entry('AmberRobot',amberRobotScene),
 'black-cat-chair':entry('BlackCatChair',blackCatChairScene),
} as const;
