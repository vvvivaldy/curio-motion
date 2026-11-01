import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {raccoonPose,type RaccoonPose} from './motion';
import {drawPostOffice,drawCourier} from './illustration';
import {raccoonCourierSettings} from './settings';
export {raccoonCourierSettings} from './settings';
export const raccoonCourierScene:SceneDefinition<RaccoonPose,{back:Graphics;ink:Graphics}>={
 settings:raccoonCourierSettings,pose:raccoonPose,
 createDrawing(root){const back=new Graphics(),ink=new Graphics();root.addChild(back,ink);return{back,ink};},
 draw({back,ink},q){drawPostOffice(back);drawCourier(ink,q);},
};
