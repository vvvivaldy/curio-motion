import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import type {CubicContour} from '../../core/contour';
import type {Point2} from '../../core/spatial';
import {createCarrierModel,defaultDesign,type CarrierDesign,type CarrierPose} from './motion';
import {ivoryCarrierSettings,carrierTiming} from './settings';
const ivory=0xece9dc,farInk=0xb5b5b0,dark=0x090b0e;
function contour(g:Graphics,c:CubicContour,color:number){g.moveTo(...c.start);for(const s of c.curves)g.bezierCurveTo(...s.c1,...s.c2,...s.to);g.closePath().fill(color);}
function line(g:Graphics,points:Point2[],color:number,width:number,alpha=1){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width,alpha,cap:'round',join:'round'});}
function hand(g:Graphics,p:CarrierPose,i:number,color:number){
 contour(g,p.arms[i].hand.contour,color);
 const [x,y]=p.arms[i].wrist,s=p.design.heightScale;
 if(p.h.grip>.05)line(g,p.arms[i].hand.crease??[[x+6*s,y+8*s],[x+11*s,y+6*s]],0x323638,1.1,p.h.grip);
}
function drawBox(g:Graphics,p:CarrierPose){
 const [x,y]=p.box.frame.origin,b=p.design.boxScale;
 const q=(points:number[])=>points.map((v,i)=>v*b+(i%2?y:x));
 g.poly(p.boxFaces.top.flat()).fill(0x54585b).stroke({color:0xa4a5a0,width:1.4});
 g.poly(p.boxFaces.side.flat()).fill(0x292e32).stroke({color:0x797f81,width:1.4});
 g.poly(p.boxFaces.front.flat()).fill(0x3b4043).stroke({color:0x9c9f9d,width:1.5});
 g.poly(q([33,-92,43,-92,19,-110,9,-110])).fill(0x7b7d78);
 g.rect(x+33*b,y-92*b,10*b,31*b).fill(0x72756f);
 for(const dx of [70,84])line(g,[[x+dx*b,y-24*b],[x+dx*b,y-42*b],[x+(dx-4)*b,y-37*b]],0x9fa19b,1.6);
 line(g,[[x+64*b,y-20*b],[x+91*b,y-20*b]],0x9fa19b,1.6);
}
function environment(g:Graphics,bench:CarrierPose['bench']){
 const top=bench.top;
 g.rect(0,0,1280,720).fill(0x080a0d);
 for(let i=0;i<28;i++)g.ellipse(620,470,610-i*13,315-i*6).fill({color:0x22282d,alpha:.012});
 g.rect(0,560,1280,160).fill(0x101318);
 line(g,[[0,560],[1280,560]],0x20262c,1);
 g.poly([1030,top,1156,top+61,1156,625,1030,top+104]).fill({color:0x000000,alpha:.45});
 g.poly(bench.topPolygon.flat()).fill(0x444a4d).stroke({color:0x777f80,width:1});
 g.poly(bench.frontPolygon.flat()).fill(0x30373b);
 for(const leg of bench.legs)g.rect(leg.x,leg.y,leg.width,leg.height).fill(0x353c40);
 line(g,[[854,584],[1098,584]],0x30373b,7);
 line(g,[[840,top],[1104,top]],0xb2b5ae,2);
}
function character(g:Graphics,p:CarrierPose){
 const s=p.design.heightScale;
 for(const i of [1,0]){
   contour(g,p.legs[i].contour,i?farInk:ivory);
   const [x,y]=p.feet[i].position;
   g.moveTo(x-7*s,y-12*s).bezierCurveTo(x+2*s,y-14*s,x+7*s,y-7*s,x+19*s,y-5*s)
    .bezierCurveTo(x+29*s,y-3*s,x+30*s,y+1*s,x+24*s,y+2*s).lineTo(x-7*s,y+2*s)
    .bezierCurveTo(x-13*s,y+1*s,x-12*s,y-8*s,x-7*s,y-12*s).closePath().fill(i?farInk:ivory);
 }
 contour(g,p.arms[1].contour,farInk);
 contour(g,p.body.contour,ivory);
 line(g,[[p.shoulders[0],p.shoulders[1]+5*s],[p.head[0]-5*s,p.head[1]+28*s]],ivory,17*s);
 g.ellipse(...p.head,43*s,46*s).fill(ivory);
 const [hx,hy]=p.head;
 g.ellipse(hx+11*s,hy+s,3.2*s,(5.5-2*p.effort)*s).fill(dark);
 g.ellipse(hx+31*s,hy-s,2.5*s,(5.1-2*p.effort)*s).fill(dark);
 line(g,[[hx+7*s,hy-(12+2*p.effort)*s],[hx+16*s,hy-11*s]],dark,2.1);
 line(g,[[hx+27*s,hy-12*s],[hx+34*s,hy-(14+2*p.effort)*s]],dark,1.7);
 g.moveTo(hx+17*s,hy+20*s).quadraticCurveTo(hx+24*s,hy+(24-8*p.effort)*s,hx+30*s,hy+18*s).stroke({color:dark,width:2,cap:'round'});
 drawBox(g,p);
 // The far palm stays behind the carton; its curled fingers wrap the exposed side edge.
 hand(g,p,1,farInk);
 contour(g,p.arms[0].contour,ivory);hand(g,p,0,ivory);
}
interface Drawing{back:Graphics;shadow:Graphics;ink:Graphics}
export function createCarrierScene(design:CarrierDesign=defaultDesign):SceneDefinition<CarrierPose,Drawing>{
 const model=createCarrierModel(design);
 return {
 settings:ivoryCarrierSettings,pose:time=>model.pose(carrierTiming.actionTime(time)),
 createDrawing(root){const back=new Graphics(),shadow=new Graphics(),ink=new Graphics();root.addChild(back,shadow,ink);environment(back,model.bench);return {back,shadow,ink};},
 draw({shadow,ink},p){
   shadow.clear();ink.clear();shadow.ellipse(p.hips[0]+15,617,82,10).fill({color:0x000000,alpha:.65});
   const [bx,by]=p.box.frame.origin;shadow.ellipse(bx+40,615,76,7+6*(612-by)/172).fill({color:0x000000,alpha:.45});
   character(ink,p);
 },
 };
}
export const ivoryCarrierScene=createCarrierScene();
