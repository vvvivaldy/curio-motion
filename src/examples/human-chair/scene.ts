import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import type {CubicContour} from '../../core/contour';
import {localPoint,type Point2} from '../../core/spatial';
import {chair,type HumanPose} from './design';
import {humanPose} from './motion';
import {humanChairSettings} from './settings';
function polygon(g:Graphics,p:readonly Point2[],color:number){g.poly(p.flat()).fill(color);}
function shape(g:Graphics,c:CubicContour,color:number){g.moveTo(...c.start);for(const q of c.curves)g.bezierCurveTo(...q.c1,...q.c2,...q.to);g.closePath().fill(color);}
function shade(far:number,near:number,depth:number){const u=(depth+1)/2;return [16,8,0].reduce((color,shift)=>color|(Math.round(((far>>shift)&255)*(1-u)+((near>>shift)&255)*u)<<shift),0);}
function line(g:Graphics,points:Point2[],color:number,width=1.5){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width,cap:'round',join:'round'});}
function drawChair(g:Graphics){
 g.ellipse(833,602,93,5).fill(0xded6cd);
 for(const [i,p] of chair.legs.entries())polygon(g,p,i<2?0xa16242:0x865139);
 line(g,[[775,552],[871,552]],0xa96b49,5);
 polygon(g,[[865,407],[879,399],[881,500],[868,506]],0x89513c);
 polygon(g,[[858,412],[870,406],[871,493],[859,500]],0xb37350);
 polygon(g,[[860,413],[872,405],[873,460],[861,468]],0xbb7b54);
 polygon(g,chair.side,0x8c553d);polygon(g,chair.apron,0xa96b49);polygon(g,chair.seat,0xce956b);
}
function drawHead(g:Graphics,p:HumanPose){
 const at=(q:Point2)=>localPoint(q,p.headFrame),f=p.face;
 // Ears belong behind the same whole skull; the jaw/nose and all face marks
 // interpolate together in face.ts instead of independently sliding over it.
 for(const e of f.ears)if(e.alpha>0){g.ellipse(...at(e.center),4,6).fill({color:0xd6a47e,alpha:e.alpha});}
 shape(g,p.head,0xdfb18b);
 const hair:CubicContour={start:at(f.hair.start),curves:f.hair.curves.map(c=>({...c,c1:at(c.c1),c2:at(c.c2),to:at(c.to)}))};shape(g,hair,0x363c40);
 for(const e of f.eyes)if(e.alpha>0){
  g.ellipse(...at(e.center),3.1,1.7).fill({color:0xfff6e8,alpha:e.alpha});g.circle(...at([e.center[0]+.5*p.facing,e.center[1]]),1.1).fill({color:0x30383b,alpha:e.alpha});
  g.moveTo(...at(e.brow[0])).lineTo(...at(e.brow[1])).stroke({color:0x4b4540,width:1.7,alpha:e.alpha,cap:'round'});
 }
 line(g,f.nose.map(at),0xb58162,1.1);
 g.moveTo(...at(f.mouth[0])).quadraticCurveTo(...at(f.mouth[1]),...at(f.mouth[2])).stroke({color:0x91634e,width:1.3,cap:'round'});
}
interface Drawing{back:Graphics;human:Graphics}
export const humanChairScene:SceneDefinition<HumanPose,Drawing>={settings:humanChairSettings,pose:humanPose,
 createDrawing(root){const back=new Graphics(),human=new Graphics();root.addChild(back,human);return{back,human};},
 draw({back,human:g},p){back.clear();g.clear();
  line(back,[[96,600],[1184,600]],0xd6d0c8,2);drawChair(back);
  // Identities stay anatomical across yaw. Each whole chain owns its details;
  // one signed depth drives attachments, shading and overlap order.
  const {near:front,far:rear}=p.depthOrder;
  const leg=(i:0|1)=>{const l=p.legs[i];shape(g,l.shape.contour,shade(0x364552,0x465766,l.cameraDepth));shape(g,l.foot,shade(0x2c3439,0x30393e,l.cameraDepth));const f=p.headings?Math.cos(p.headings[i]):p.facing;line(g,[[l.sole[0]-8-24*Math.max(0,-f),l.sole[1]-1],[l.sole[0]+8+24*Math.max(0,f),l.sole[1]-1]],0xc9c3b6,2);};
  const arm=(i:0|1)=>{const a=p.arms[i];shape(g,a.shape.contour,shade(0x416574,0x608693,a.cameraDepth));shape(g,a.hand,shade(0xc99b76,0xdfb18b,a.cameraDepth));const at=(x:number,y:number)=>localPoint([x,y],a.handFrame);line(g,[at(-5,0),at(5,0)],0x8aa5ab,2.8);const alpha=(a.cameraDepth+1)/2;if(alpha>0)for(const [x,y,z] of [[0,14,21],[4,13,20]]){g.moveTo(...at(x,y)).lineTo(...at(x===4?3:0,z)).stroke({color:0xad805f,width:.8,alpha,cap:'round'});}};
  for(const [i,l] of p.legs.entries())if(l.planted)g.ellipse(l.sole[0]+8*Math.cos(p.headings?.[i]??(p.facing>=0?0:Math.PI)),l.sole[1]+2,25,3).fill({color:0x36322f,alpha:.08});
  leg(rear);arm(rear);
  g.ellipse(p.hips[0],p.hips[1],24*(1+.12*p.frontView),12).fill(0x465766);
  leg(front);
  shape(g,p.body,0x527b89);
  polygon(g,[[ -7,100],[-7,121],[7,121],[7,100]].map(([x,y])=>p.bodyPoint(x,y)),0xd6a782);
  polygon(g,[[-18,100],[-8,105],[0,94],[-7,87]].map(([x,y])=>p.bodyPoint(x,y)),0x7797a0);
  polygon(g,[[8,105],[18,100],[7,87],[0,94]].map(([x,y])=>p.bodyPoint(x,y)),0x7797a0);
  line(g,[p.bodyPoint(p.facing*6,93),p.bodyPoint(p.facing*6+1,7)],0x3e6473,1.6);
  for(const y of [68,43,18])g.circle(...p.bodyPoint(p.facing*6+1,y),1.4).fill(0xb6c4c1);
  drawHead(g,p);
  arm(front);
 }};
