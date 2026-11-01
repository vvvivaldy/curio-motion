import {raccoonCourierScene} from './raccoon-courier/scene';
import {morningDeliveryScene} from './morning-delivery/scene';
import {MorningDelivery} from './morning-delivery/sound';
import {RaccoonCourier} from './raccoon-courier/sound';
import {deliveryInfographicScene} from './delivery-infographic/scene';
import {CatPictureStoryV3} from './cat-picture-story/sound-v3';
import {catPictureStoryV3Scene} from './cat-picture-story/scene-v3';
import {CatPictureStoryV2} from './cat-picture-story/spatial-sound';
import {catPictureStoryV2Scene} from './cat-picture-story/spatial-scene';
import {CatPictureStory} from './cat-picture-story/sound';
import {catPictureStoryScene} from './cat-picture-story/scene';
import {confidentNeonScene,cautiousNeonScene} from './human-chair-neon/scene';
import {HumanChairNeonConfident,HumanChairNeonCautious} from './human-chair-neon/sound';
import {humanChairInkScene} from './human-chair-art/ink';
import {humanChairPaperScene} from './human-chair-art/paper';
import {HumanChairInk,HumanChairPaper} from './human-chair-art/sound';
import {HumanChairSoundV2} from './human-chair-sound-v2/sound';
import {HumanChairSound} from './human-chair-sound/sound';
import {humanChairScene} from './human-chair/scene';
import {blackCatChairScene} from './black-cat-chair/scene';
import {motionFoundationsScene} from './motion-foundations/scene';
import {carrierVariants} from './ivory-carrier/variants';
import {ivoryCarrierScene,createCarrierScene} from './ivory-carrier/scene';
import {createPixiStage,type SceneDefinition} from '../core/stage';
import {pinkMonkeyScene} from './pink-monkey/scene';
import {amberRobotScene} from './amber-robot/scene';
import {seriousBoarV2Scene} from './serious-boar-v2/scene';
import {seriousBoarScene} from './serious-boar/scene';
import {createRemotionScene} from '../remotion/create-scene';
function entry<P,D>(id:string,scene:SceneDefinition<P,D>){
 return {id,settings:scene.settings,pose:scene.pose,Component:createRemotionScene(scene),createStage:(host:HTMLElement)=>createPixiStage(host,scene)};
}
// Demo registration stays outside core. All preview/export entry points select
// the same typed scene; a third example needs no new renderer branch.
export const scenes={
 'morning-delivery':{...entry('MorningDelivery',morningDeliveryScene),Component:MorningDelivery},
 'raccoon-courier':{...entry('RaccoonCourier',raccoonCourierScene),Component:RaccoonCourier},
 'delivery-infographic':entry('DeliveryInfographic',deliveryInfographicScene),
 'cat-picture-story-v3':{...entry('CatPictureStoryV3',catPictureStoryV3Scene),Component:CatPictureStoryV3},
 'cat-picture-story-v2':{...entry('CatPictureStoryV2',catPictureStoryV2Scene),Component:CatPictureStoryV2},
 'cat-picture-story':{...entry('CatPictureStory',catPictureStoryScene),Component:CatPictureStory},
 'human-chair-neon-confident':{...entry('HumanChairNeonConfident',confidentNeonScene),Component:HumanChairNeonConfident},
 'human-chair-neon-cautious':{...entry('HumanChairNeonCautious',cautiousNeonScene),Component:HumanChairNeonCautious},
 'human-chair-ink':{...entry('HumanChairInk',humanChairInkScene),Component:HumanChairInk},
 'human-chair-paper':{...entry('HumanChairPaper',humanChairPaperScene),Component:HumanChairPaper},
 'human-chair':entry('HumanChair',humanChairScene),
 'human-chair-sound':{...entry('HumanChairSound',humanChairScene),Component:HumanChairSound},
 'human-chair-sound-v2':{...entry('HumanChairSoundV2',humanChairScene),Component:HumanChairSoundV2},
 'black-cat-chair':entry('BlackCatChair',blackCatChairScene),
 'motion-foundations':entry('MotionFoundations',motionFoundationsScene),
 ...Object.fromEntries(carrierVariants.map(v=>[v.key,entry(v.id,createCarrierScene(v.design))])),
 'ivory-carrier':entry('IvoryCarrier',ivoryCarrierScene),
 'pink-monkey':entry('PinkMonkey',pinkMonkeyScene),
 'amber-robot':entry('AmberRobot',amberRobotScene),
 'serious-boar':entry('SeriousBoar',seriousBoarScene),
 'serious-boar-v2':entry('SeriousBoarV2',seriousBoarV2Scene),
} as const;
