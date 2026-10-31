import {catPictureStoryV3Scene} from './cat-picture-story/scene-v3';
import {CatPictureStoryV3} from './cat-picture-story/sound-v3';
import {createPixiStage,type SceneDefinition} from '../core/stage';
import {createRemotionScene} from '../remotion/create-scene';
import {pinkMonkeyScene} from './pink-monkey/scene';
import {amberRobotScene} from './amber-robot/scene';
import {blackCatChairScene} from './black-cat-chair/scene';
function entry<P,D>(id:string,scene:SceneDefinition<P,D>){
 return {id,settings:scene.settings,pose:scene.pose,Component:createRemotionScene(scene),createStage:(host:HTMLElement)=>createPixiStage(host,scene)};
}
// Public authored examples share the same preview/export entries.
export const scenes={
 'pink-monkey':entry('PinkMonkey',pinkMonkeyScene),
 'amber-robot':entry('AmberRobot',amberRobotScene),
 'black-cat-chair':entry('BlackCatChair',blackCatChairScene),
 'cat-picture-story-v3':{...entry('CatPictureStoryV3',catPictureStoryV3Scene),Component:CatPictureStoryV3},
} as const;
