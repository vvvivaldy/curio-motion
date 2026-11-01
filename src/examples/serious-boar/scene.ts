import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {boarPose,type BoarPose} from './motion';
import {drawBoar,drawCart,drawCartWheels,makeLettering} from './illustration';
import {drawStore,drawSavanna} from './environment';
import {seriousBoarSettings} from './settings';
export {seriousBoarSettings} from './settings';
type Drawing={back:Graphics;cart:Graphics;wheels:Graphics;boar:Graphics;overlay:Graphics;lettering:ReturnType<typeof makeLettering>;backgroundScene?:boolean;settledCart?:boolean};
export const seriousBoarScene:SceneDefinition<BoarPose,Drawing>={
 settings:seriousBoarSettings,pose:boarPose,
 createDrawing(root){const back=new Graphics(),cart=new Graphics(),wheels=new Graphics(),boar=new Graphics(),overlay=new Graphics();root.addChild(back,wheels,cart,boar,overlay);return {back,cart,wheels,boar,overlay,lettering:makeLettering(root)};},
 draw(drawing,q){
  const {back,cart,wheels,boar,overlay,lettering:l}=drawing;
  if(drawing.backgroundScene!==q.seated){if(q.seated)drawSavanna(back);else drawStore(back);drawing.backgroundScene=q.seated;}
  const settled=q.t>=8.93;
  if(!settled||!drawing.settledCart){cart.clear();drawCart(cart,0,0,q.cargo);}
  drawing.settledCart=settled;
  const cx=q.seated?1112:q.cart[0],cy=q.seated?684:q.cart[1];
  cart.position.set(cx,cy);drawCartWheels(wheels,cx,cy);
  drawBoar(boar,q);overlay.clear();
  l.rule.visible=l.big.visible=!q.seated;l.rule.alpha=q.rule;l.big.alpha=q.bigText;
  // Reveal the large red message with its original editorial hierarchy.
  l.big.text=q.t<12.4?'заплатишь':'заплатишь\nбольше!!!';
  if(!q.seated&&q.underline>0)overlay.moveTo(84,500).lineTo(84+546*q.underline,500).stroke({color:0xc82f26,width:5,cap:'round'});
  for(const label of l.shelf)label.visible=false;
  for(const [i,label] of l.cargo.entries()){
   const c=q.cargo[i];label.visible=c.visible;label.rotation=c.angle;
   label.position.set((q.seated?1112:q.cart[0])+c.x-30,(q.seated?684:q.cart[1])+c.y-37);
  }
  l.snack.visible=q.seated;l.snack.position.set(q.bag.origin[0]-31,q.bag.origin[1]-39);l.snack.rotation=q.bag.angle;
 },
};
