import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import type {CubicContour} from '../../core/contour';
import {eyeShape} from '../../core/eye';
import {localPoint,type Point2} from '../../core/spatial';
import {blackCatChairSettings} from './settings';
import {catPose,type CatPose} from './motion';
import {chair} from './layout';
const ink=0x0c0d0f;
function polygon(g:Graphics,p:Point2[],color:number){g.poly(p.flat()).fill(color);}
function shape(g:Graphics,c:CubicContour,color=ink){g.moveTo(...c.start);for(const q of c.curves)g.bezierCurveTo(...q.c1,...q.c2,...q.to);g.closePath().fill(color);}
function drawChair(g:Graphics){
 g.ellipse(860,604,134,7).fill({color:0x000000,alpha:.055});
 for(const p of chair.legs)polygon(g,p,0xc9252d);
 g.moveTo(756,550).lineTo(975,550).stroke({color:0xd52b31,width:8,cap:'round'});
 g.roundRect(742,chair.topY,12,124,4).fill(0xd72c32);g.roundRect(950,chair.topY,12,124,4).fill(0xd72c32);
 polygon(g,[[747,328],[956,328],[956,416],[747,416]],0xe53a3c);
 g.moveTo(755,337).lineTo(946,337).stroke({color:0xf15b54,width:3,cap:'round'});
 polygon(g,chair.side,0xb9212a);polygon(g,chair.front,0xd52c32);polygon(g,chair.seat,0xf04a45);
}
function drawEyes(g:Graphics,p:CatPose){
 const facing=p.facing,u=(1-facing)/2;
 const positions=[[-13-10*u,2+8*u],[23-10*u,10-8*u]];
 for(const [index,radius] of [[0,[17,16]],[1,[15.5,14]]] as const){
  const center=positions[index],tilt=(index?-.12:.16)*facing;
  const e=eyeShape({center:[0,0],radius:[...radius],openness:index?.78:.8,pupil:{center:p.gaze,radius:[5.5,9]}});
  const eyeFrame={origin:[...center] as Point2,angle:tilt,scale:1},place=(q:Point2)=>localPoint(localPoint(q,eyeFrame),p.headFrame);
  polygon(g,e.aperture.map(place),0xffffff);polygon(g,e.pupil.map(place),ink);
 }
}
interface Drawing{back:Graphics;cat:Graphics}
export const blackCatChairScene:SceneDefinition<CatPose,Drawing>={settings:blackCatChairSettings,pose:catPose,
 createDrawing(root){const back=new Graphics(),cat=new Graphics();root.addChild(back,cat);return{back,cat};},
 draw({back,cat},p){back.clear();cat.clear();drawChair(back);
  if(p.legs.some(l=>l.planted))for(const l of p.legs.filter(l=>l.planted))cat.ellipse(l.sole[0],l.sole[1]+1.5,18,3).fill({color:0x000000,alpha:.08});
  else cat.ellipse(p.hips[0],602,30,3.5).fill({color:0x000000,alpha:.025});
  for(const a of p.arms.filter(a=>a.support==='floor'))cat.ellipse(a.groundContact[0],a.groundContact[1]+1,12,2.5).fill({color:0x000000,alpha:.07});
  shape(cat,p.legs[1].contour);shape(cat,p.legs[1].foot);shape(cat,p.arms[1].shape.contour);shape(cat,p.arms[1].paw);
  shape(cat,p.body);shape(cat,p.legs[0].contour);shape(cat,p.legs[0].foot);shape(cat,p.head);drawEyes(cat,p);
  // Actual foreground arm may occlude the face; never paint eyes over a bad limb pose.
  shape(cat,p.arms[0].shape.contour);shape(cat,p.arms[0].paw);
 }};
