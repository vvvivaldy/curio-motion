import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {mapContour,type CubicContour} from '../../core/contour';
import {localPoint,type Point2} from '../../core/spatial';
import {humanPose} from '../human-chair/motion';
import {chair,type HumanPose} from '../human-chair/design';
import {humanChairInkSettings} from './settings';
import {path,polygon,line,inkOutline,boneMarks,shade,chairBackPanels} from './marks';
const graphite=0x363c40;
function drawing(g:Graphics,c:CubicContour,color:number,id:string){path(g,c).fill(color);inkOutline(g,c,id);}
function poly(g:Graphics,points:readonly Point2[],fill:number,id:string){drawing(g,polygon(points),fill,id);}
function head(g:Graphics,p:HumanPose){const at=(q:Point2)=>localPoint(q,p.headFrame),f=p.face;
 for(const [i,e] of f.ears.entries())if(e.alpha>0)g.ellipse(...at(e.center),4,6).fill({color:0xe4ddce,alpha:e.alpha}).stroke({color:graphite,width:.55,alignment:1,alpha:e.alpha});
 drawing(g,p.head,0xf4ecda,'head');drawing(g,mapContour(f.hair,at),0x737671,'hair');
 for(const e of f.eyes)if(e.alpha>0){g.ellipse(...at(e.center),3.1,1.7).fill({color:0xfffcf0,alpha:e.alpha});g.circle(...at([e.center[0]+.5*p.facing,e.center[1]]),1.1).fill({color:graphite,alpha:e.alpha});line(g,e.brow.map(at),graphite,1.25,e.alpha);}
 line(g,f.nose.map(at),0x6b695f,.9);g.moveTo(...at(f.mouth[0])).quadraticCurveTo(...at(f.mouth[1]),...at(f.mouth[2])).stroke({color:0x65645d,width:1,cap:'round'});
 for(let i=0;i<5;i++)line(g,[at([-13+i*5,-18]),at([-10+i*5,-13])],0x383e40,.6,.4);
}
function drawChair(g:Graphics){
 for(const [i,c] of chair.legs.entries())poly(g,c,0xe7dfce,`chair-leg${i}`);
 line(g,[[775,552],[871,552]],0x999487,4);line(g,[[775,551],[871,551]],graphite,.8);
 for(const [i,c] of chairBackPanels.entries())poly(g,c,0xe8deca,`chair-back${i}`);
 poly(g,chair.side,0xdad2bf,'chair-side');poly(g,chair.apron,0xe6ddc9,'chair-apron');poly(g,chair.seat,0xf0e7d4,'chair-seat');
 for(let i=0;i<10;i++)line(g,[[764+i*9,504],[768+i*9,510]],graphite,.7,.34);
 for(let i=0;i<6;i++)line(g,[[779-i*.3,524+i*10],[775-i*.3,529+i*10]],graphite,.6,.26);
}
interface Drawing{back:Graphics;human:Graphics}
export const humanChairInkScene:SceneDefinition<HumanPose,Drawing>={settings:humanChairInkSettings,pose:humanPose,
 createDrawing(root){const back=new Graphics(),human=new Graphics();root.addChild(back,human);return{back,human};},
 draw({back,human:g},p){back.clear();g.clear();line(back,[[96,600],[1184,600]],0xbbb8ad,.8);drawChair(back);
  const {near,far}=p.depthOrder;
  const leg=(i:0|1)=>{const l=p.legs[i];drawing(g,l.shape.contour,shade(0xd4d5cf,0xe4e4dc,l.cameraDepth),`leg${i}`);boneMarks(g,l.shape,`leg${i}`,graphite,'hatch');drawing(g,l.foot,0x7d827d,`shoe${i}`);const f=p.headings?Math.cos(p.headings[i]):p.facing;line(g,[[l.sole[0]-8-24*Math.max(0,-f),l.sole[1]-1],[l.sole[0]+8+24*Math.max(0,f),l.sole[1]-1]],0xe1dfd0,1.4);};
  const arm=(i:0|1)=>{const a=p.arms[i];drawing(g,a.shape.contour,shade(0xe4e3d8,0xf1eee2,a.cameraDepth),`arm${i}`);boneMarks(g,a.shape,`arm${i}`,graphite,'hatch');drawing(g,a.hand,0xf1e7d2,`hand${i}`);const at=(x:number,y:number)=>localPoint([x,y],a.handFrame);line(g,[at(-5,0),at(5,0)],graphite,.75);if(a.cameraDepth>-1)for(const [x,y,z] of [[0,14,21],[4,13,20]])line(g,[at(x,y),at(x===4?3:0,z)],0x77736b,.6,(a.cameraDepth+1)/2);};
  for(const l of p.legs)if(l.planted)back.ellipse(l.sole[0],l.sole[1]+1,22,1.7).fill({color:0x65655d,alpha:.07});
  leg(far);arm(far);g.ellipse(p.hips[0],p.hips[1],24*(1+.12*p.frontView),12).fill(0xdbddd4);leg(near);
  drawing(g,p.body,0xf0ede1,'shirt');for(let i=0;i<9;i++){const y=13+i*8;line(g,[p.bodyPoint(13,y),p.bodyPoint(21,y+5)],graphite,.65,.30);}
  poly(g,[[-7,100],[-7,121],[7,121],[7,100]].map(([x,y])=>p.bodyPoint(x,y)),0xf0e5cf,'neck');
  poly(g,[[-18,100],[-8,105],[0,94],[-7,87]].map(([x,y])=>p.bodyPoint(x,y)),0xe2dfd0,'collarL');poly(g,[[8,105],[18,100],[7,87],[0,94]].map(([x,y])=>p.bodyPoint(x,y)),0xe2dfd0,'collarR');
  line(g,[p.bodyPoint(p.facing*6,93),p.bodyPoint(p.facing*6+1,7)],graphite,.7,.65);for(const y of [68,43,18])g.circle(...p.bodyPoint(p.facing*6+1,y),1.3).fill(0x85887d);
  head(g,p);arm(near);
 }};
