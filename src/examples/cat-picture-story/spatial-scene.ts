import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {affineProject} from '../../core/frame3';
import {catPictureStorySettings} from './settings';
import {drawRoom,drawClock,drawPictureHook,drawChair} from './scene';
import {drawSpatialCat,drawSpatialPicture} from './spatial-controls';
import {spatialStoryPose} from './spatial-motion';
import {frameAt,framePoint,frameTimes} from './environment';
import {picture} from './world';
export const catPictureStoryV2Scene:SceneDefinition<ReturnType<typeof spatialStoryPose>,{paper:Graphics}>={
 settings:catPictureStorySettings,pose:spatialStoryPose,
 createDrawing(root){const paper=new Graphics();root.addChild(paper);return{paper};},
 draw({paper:g},p){
  g.clear();const t=p.environmentTime,view=p.view;drawRoom(g,view);drawClock(g,view,t);drawPictureHook(g,view);
  if(t<frameTimes.release){const frame=frameAt(t),wire=[framePoint(frame,-60,59),[picture.x,432,picture.z] as const,framePoint(frame,60,59)].map(v=>affineProject([...v],view));
   g.moveTo(...wire[0]).lineTo(...wire[1]).lineTo(...wire[2]).stroke({color:0x5e6558,width:1.1});}
  drawSpatialPicture(g,view,t);drawChair(g,view,t);drawSpatialCat(g,p.cat,view);
 },
};
