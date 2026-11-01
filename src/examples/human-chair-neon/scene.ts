import {BlurFilter,Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {mapContour,type CubicContour} from '../../core/contour';
import {localPoint,type Point2} from '../../core/spatial';
import {chair} from '../human-chair/design';
import {actingPose,type ActingPose} from './acting';
import {actingSettings,type Performance} from './settings';

const cyan=0xc3ffff,magenta=0xffc1ef;
function shade(far:number,near:number,depth:number){const u=(depth+1)/2;return[16,8,0].reduce((c,s)=>c|(Math.round(((far>>s)&255)*(1-u)+((near>>s)&255)*u)<<s),0);}
function line(g:Graphics,points:readonly Point2[],color:number,width=1.4,alpha=1){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width,alpha,cap:'round',join:'round'});}
function shape(g:Graphics,c:CubicContour,fill:number,edge:number,glow:boolean,width=1.7){
 g.moveTo(...c.start);for(const p of c.curves)g.bezierCurveTo(...p.c1,...p.c2,...p.to);g.closePath();
 if(!glow)g.fill(fill);g.stroke({color:edge,width:glow?2.6:width,alignment:1,cap:'round',join:'round'});
}
function polygon(g:Graphics,p:readonly Point2[],fill:number,edge:number,glow:boolean,width=1.5){g.poly(p.flat());if(!glow)g.fill(fill);g.stroke({color:edge,width:glow?2.4:width,alignment:1,join:'round'});}
function drawChair(g:Graphics,glow:boolean){
 for(const [i,p] of chair.legs.entries())polygon(g,p,i<2?0x281925:0x1a1019,i<2?0xb06498:0x60354f,glow);
 line(g,[[775,552],[871,552]],0x733751,glow?3:2);
 polygon(g,[[865,407],[879,399],[881,500],[868,506]],0x1c101a,0x814267,glow);
 polygon(g,[[858,412],[870,406],[871,493],[859,500]],0x281421,0xb36c9c,glow);
 polygon(g,[[860,413],[872,405],[873,460],[861,468]],0x301a2b,magenta,glow);
 polygon(g,chair.side,0x251321,0x9e5887,glow);polygon(g,chair.apron,0x321b2a,0xb9679c,glow);polygon(g,chair.seat,0x422637,magenta,glow,2);
}
function drawHead(g:Graphics,p:ActingPose,glow:boolean){
 const at=(q:Point2)=>localPoint(q,p.headFrame),f=p.face;
 for(const e of f.ears)if(e.alpha>0){g.ellipse(...at(e.center),4,6);if(!glow)g.fill({color:0x193841,alpha:e.alpha});g.stroke({color:0x65aab5,width:glow?2.2:1,alpha:e.alpha});}
 shape(g,p.head,0x19353f,cyan,glow);
 const hair={start:at(f.hair.start),curves:f.hair.curves.map(c=>({...c,c1:at(c.c1),c2:at(c.c2),to:at(c.to)}))};
 shape(g,hair,0x0b171f,0x609da9,glow,1.2);
 if(glow)return;
 for(const e of f.eyes)if(e.alpha>0){
  g.ellipse(...at(e.center),3.1,1.7).fill({color:0x416970,alpha:e.alpha});
  g.circle(...at([e.center[0]+p.gaze[0],e.center[1]+p.gaze[1]]),.9).fill({color:0xd0ffff,alpha:e.alpha});
  const brow=e.brow.map((q,i)=>[q[0],q[1]+p.tension*(i===0?-.7:.9)] as Point2);
  line(g,brow.map(at),0xb5edf0,1.35,e.alpha);
 }
 line(g,f.nose.map(at),0x70acb6,1.1);
 const mouth=f.mouth.map((q,i)=>[q[0],q[1]+(i===1?1.15*(1-p.tension):0)] as Point2);
 g.moveTo(...at(mouth[0])).quadraticCurveTo(...at(mouth[1]),...at(mouth[2])).stroke({color:0xa2d6dc,width:1.2,cap:'round'});
}
function drawHuman(g:Graphics,p:ActingPose,glow:boolean){
 const {near,far}=p.depthOrder;
 const leg=(i:0|1)=>{const l=p.legs[i],edge=shade(0x416e7c,cyan,l.cameraDepth);
  shape(g,l.shape.contour,shade(0x101c27,0x172c39,l.cameraDepth),edge,glow);
  shape(g,l.foot,0x101d29,edge,glow);
  if(!glow){const f=Math.cos(p.headings?.[i]??(p.facing>=0?0:Math.PI));line(g,[[l.sole[0]-8-24*Math.max(0,-f),l.sole[1]-1],[l.sole[0]+8+24*Math.max(0,f),l.sole[1]-1]],0x87c1cd,1.8);}};
 const arm=(i:0|1)=>{const a=p.arms[i],edge=shade(0x426c79,cyan,a.cameraDepth);
  shape(g,a.shape.contour,shade(0x101c27,0x172f3b,a.cameraDepth),edge,glow);
  shape(g,a.hand,shade(0x112934,0x1d4048,a.cameraDepth),edge,glow,1.45);
  if(!glow){const at=(q:Point2)=>localPoint(q,a.handFrame);line(g,[at([-5,0]),at([5,0])],0x497c88,1.5);const alpha=(a.cameraDepth+1)/2;
   for(const [x,y,z] of [[0,14,21],[4,13,20]])line(g,[at([x,y]),at([x===4?3:0,z])],0x80b4bb,.75,alpha);}};
 leg(far);arm(far);
 g.ellipse(p.hips[0],p.hips[1],24*(1+.12*p.frontView),12);if(!glow)g.fill(0x152a36);g.stroke({color:0x639ba9,width:glow?2.3:1.4,alignment:1});
 leg(near);shape(g,p.body,0x1b3642,cyan,glow);
 polygon(g,[[-7,100],[-7,121],[7,121],[7,100]].map(([x,y])=>p.bodyPoint(x,y)),0x1b3942,0x71bac4,glow,1.1);
 if(!glow){
  polygon(g,[[-18,100],[-8,105],[0,94],[-7,87]].map(([x,y])=>p.bodyPoint(x,y)),0x254652,0x5d97a5,false,1);
  polygon(g,[[8,105],[18,100],[7,87],[0,94]].map(([x,y])=>p.bodyPoint(x,y)),0x254652,0x5d97a5,false,1);
  line(g,[p.bodyPoint(p.facing*6,93),p.bodyPoint(p.facing*6+1,7)],0x3e6d7b,1.1);
  for(const y of [68,43,18])g.circle(...p.bodyPoint(p.facing*6+1,y),1.2).fill(0x8fc5cc);
 }
 drawHead(g,p,glow);arm(near);
}
/** Scene-local stylized floor reflection. Each limb mirrors in its real fixed
 * floor lane, including an airborne sole's gap. Vertical compression suggests
 * a grazing view; exponential alpha fades the echo away from the contact. */
function reflectContour(g:Graphics,c:CubicContour,plane:number,color:number){
 const reflected=mapContour(c,([x,y])=>[x,plane+(plane-y)*.3]);
 g.moveTo(...reflected.start);for(const q of reflected.curves)g.bezierCurveTo(...q.c1,...q.c2,...q.to);g.closePath().fill({color,alpha:.018});
 let previous=reflected.start;
 for(const q of reflected.curves){const distance=Math.max(0,((previous[1]+q.to[1])/2)-plane),alpha=.27*Math.exp(-distance/13);
  g.moveTo(...previous).bezierCurveTo(...q.c1,...q.c2,...q.to).stroke({color,width:1.9,alpha,cap:'round'});previous=q.to;}
}
function reflectedPolygon(g:Graphics,points:readonly Point2[],plane:number,color:number){
 const mirrored=points.map(([x,y])=>[x,plane+(plane-y)*.3] as Point2);
 g.poly(mirrored.flat()).fill({color,alpha:.018});
 for(let i=0;i<mirrored.length;i++){const from=mirrored[i],to=mirrored[(i+1)%mirrored.length],distance=Math.max(0,(from[1]+to[1])/2-plane);
  line(g,[from,to],color,1.8,.25*Math.exp(-distance/13));}
}
function chairReflection(g:Graphics){
 for(const leg of chair.legs)reflectedPolygon(g,leg,Math.max(...leg.map(p=>p[1])),0xf05bbe);
 // The top is farther from the floor and thus much dimmer than the grounded legs.
 for(const p of [chair.seat,chair.apron,chair.side])reflectedPolygon(g,p,600,0xe557b7);
}
function humanReflection(g:Graphics,p:ActingPose){
 for(const i of [p.depthOrder.far,p.depthOrder.near]){const leg=p.legs[i],plane=p.feet[i][1],color=i===p.depthOrder.near?0x4fe3f8:0x308299;
  reflectContour(g,leg.shape.contour,plane,color);reflectContour(g,leg.foot,plane,color);}
}
interface Drawing{back:Graphics;chairReflection:Graphics;humanReflection:Graphics;chairHalo:Graphics;chairGlow:Graphics;chairArt:Graphics;humanHalo:Graphics;humanGlow:Graphics;humanArt:Graphics}
/** One light treatment for BOTH performances. Broad colored scatter surrounds
 * a narrow bright halo and crisp core; opaque forms remain in front of light. */
export function createNeonScene(performance:Performance,lightEnabled=true):SceneDefinition<ActingPose,Drawing>{
 return{settings:actingSettings(performance),pose:time=>actingPose(time,performance),
  createDrawing(root){
   const back=new Graphics(),chairRef=new Graphics(),humanRef=new Graphics(),chairHalo=new Graphics(),chairGlow=new Graphics(),chairArt=new Graphics(),humanHalo=new Graphics(),humanGlow=new Graphics(),humanArt=new Graphics();
   root.addChild(back,chairRef,humanRef,chairHalo,chairGlow,chairArt,humanHalo,humanGlow,humanArt);
   back.poly([96,590,1184,590,1280,720,0,720]).fill(0x080f17);
   line(back,[[96,600],[1184,600]],0x253442,1.4);
   for(const ref of [chairRef,humanRef]){ref.filters=[new BlurFilter({strength:1.65,quality:3})];ref.alpha=lightEnabled?1:0;}
   for(const[halo,narrow,tint]of [[chairHalo,chairGlow,0xff4bbf],[humanHalo,humanGlow,0x35d9f9]] as const){
    halo.filters=[new BlurFilter({strength:9,quality:5})];halo.alpha=lightEnabled?.55:0;halo.tint=tint;
    narrow.filters=[new BlurFilter({strength:2.8,quality:3})];narrow.alpha=lightEnabled?.9:0;narrow.tint=tint;
   }
   chairReflection(chairRef);drawChair(chairHalo,true);drawChair(chairGlow,true);drawChair(chairArt,false);
   return{back,chairReflection:chairRef,humanReflection:humanRef,chairHalo,chairGlow,chairArt,humanHalo,humanGlow,humanArt};
  },
  draw({humanReflection:reflection,humanHalo,humanGlow,humanArt},p){reflection.clear();humanHalo.clear();humanGlow.clear();humanArt.clear();humanReflection(reflection,p);drawHuman(humanHalo,p,true);drawHuman(humanGlow,p,true);drawHuman(humanArt,p,false);},
 };
}
export const confidentNeonScene=createNeonScene('confident');
export const cautiousNeonScene=createNeonScene('cautious');
