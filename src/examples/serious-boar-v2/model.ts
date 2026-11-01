import type {Graphics} from 'pixi.js';
import {quadraticPoint,type CubicContour} from '../../core/contour';
import type {Point2} from '../../core/spatial';
import {localPoint,type LocalFrame2D} from '../../core/spatial';
import {limbShape} from '../../core/limb';
import {solvePlanarLimb} from '../../core/kinematics';
import type {ObjectGeometry} from '../../core/relations';
export const ink=0x302b25,fur=0x766051,lightFur=0x997d66,coat=0xc7b88b;
export function contour(g:Graphics,c:CubicContour,color:number,width=2.4){g.moveTo(...c.start);for(const s of c.curves)g.bezierCurveTo(...s.c1,...s.c2,...s.to);g.closePath().fill(color).stroke({color:ink,width,join:'round'});}
export function line(g:Graphics,points:Point2[],color=ink,width=2){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width,cap:'round',join:'round'});}
export function arm(root:Point2,end:Point2,side:1|-1=1,handAngle=0){
 const solved=solvePlanarLimb(root,end,82,80,{bendSide:side,endAngle:handAngle,wristRange:[-2.9,2.9],minFlexion:.18});
 return limbShape(root,solved.joint,end,[44,32,23]);
}
/** The renderer and clearance checks consume this identical continuous hand contour. */
export function handContour([x,y]:Point2):CubicContour{return {start:[x-14,y-7],curves:[
 {key:'knuckles',c1:[x-9,y-17],c2:[x+3,y-18],to:[x+10,y-11]},
 {key:'fingers',c1:[x+19,y-8],c2:[x+19,y+2],to:[x+10,y+6]},
 {key:'palm',c1:[x+7,y+16],c2:[x-7,y+15],to:[x-12,y+8]},
 {key:'wrist',c1:[x-12.7,y+3],c2:[x-13.3,y-2],to:[x-14,y-7]},
 ]};}
export const seatedUpperOffset=68;
// Conservative extrema of the drawn head paths, including ear tip, snout ellipse and tusks.
export const nearEarTip:Point2=[-75,-345];
export const headEnvelope={x:-81,y:nearEarTip[1],width:232,height:151};
export const warningLayout={area:{x:60,y:80,width:500,height:210},rule:{x:65,y:88,size:25},first:{x:61,y:136,size:64},second:{x:61,y:210,size:64},underlineY:288};
export function happyMouth(chew:number){return {start:[50,-232] as Point2,control:[75,-211-chew*3] as Point2,end:[107,-244] as Point2};}
export function mouthAnchor(chew:number):Point2{const m=happyMouth(chew);const p=quadraticPoint(m.start,m.control,m.end,.75);return [p[0],p[1]+seatedUpperOffset];}
export const happyEye={start:[25,-271] as Point2,control:[38,-281] as Point2,end:[51,-269] as Point2};
export const foodTipOffset:Point2=[-23,-20];
export function drawCaterpillar(g:Graphics,grip:Point2,length:number){
 const tip:Point2=[grip[0]+foodTipOffset[0],grip[1]+foodTipOffset[1]];
 for(let i=5;i>=0;i--){const u=i/5*length,x=tip[0]+23*u,y=tip[1]+20*u-5*Math.sin(Math.PI*u);g.circle(x,y,5.4).fill(0xa5b649).stroke({color:0x52612e,width:1.4});g.circle(x-1.2,y-1.8,1.4).fill(0xdbeaa2);}
 g.circle(tip[0]-1,tip[1]-1,1.5).fill(ink);line(g,[[tip[0]-2,tip[1]-3],[tip[0]-5,tip[1]-8]],0x52612e,1.3);
}
export const packageOpening:Point2=[0,-105];
export function packageGeometry(id:string,frame:LocalFrame2D):ObjectGeometry{return {id,frame,anchors:{grip:[-48,-56],mouth:packageOpening,base:[0,0]},regions:{label:{x:-43,y:-38,width:86,height:23},insect:{x:-38,y:-87,width:76,height:46}}};}
export const packageNames=['ЧЕРВЯЧКИ','ЖУЧКИ','ПАУЧКИ','ЛИЧИНКИ','ГУСЕНИЦЫ'];
export const packageColors=[0xe7b68c,0xb4cb91,0xd4bddb,0xe8d38c,0xb9d78a];
/** The same local points are used for package art and containment diagnostics. */
export function insectPoints(kind:number):Point2[]{if(kind%5===1)return [[-13,-68],[0,-82],[13,-68],[0,-52]];if(kind%5===2)return [[-25,-80],[0,-64],[25,-80],[25,-47],[0,-64],[-25,-47]];return [[-25,-65],[-12,-74],[1,-64],[14,-70],[25,-62]];}
export function drawPackage(g:Graphics,kind:number){
 const c=packageColors[kind%5];g.moveTo(-46,0).quadraticCurveTo(-51,-44,-45,-97).lineTo(-51,-105).lineTo(47,-105).lineTo(43,-96).quadraticCurveTo(51,-44,45,0).closePath().fill(c).stroke({color:ink,width:2});
 g.moveTo(-46,-100).lineTo(44,-100).moveTo(-43,-6).lineTo(42,-6).stroke({color:0x927e56,width:2});
 g.roundRect(-40,-89,80,45,10).fill({color:0xfff4d1,alpha:.78});const p=insectPoints(kind);
 if(kind%5===1){g.ellipse(0,-66,12,17).fill(0x454f30).stroke({color:ink,width:1.4});line(g,[[0,-82],[0,-50]],0xc0a757,1.6);for(const y of [-76,-66,-56]){line(g,[[-10,y],[-21,y-5]],ink,2);line(g,[[10,y],[21,y-5]],ink,2);}g.circle(-4,-80,2).fill(ink);g.circle(4,-80,2).fill(ink);}
 else if(kind%5===2){g.ellipse(0,-65,10,12).fill(0x645073);g.circle(0,-78,7).fill(0x645073);for(const s of [-1,1])for(let i=0;i<4;i++)line(g,[[s*6,-74+i*6],[s*19,-84+i*9],[s*29,-78+i*10]],ink,2);}
 else {g.moveTo(...p[0]);for(let i=1;i<p.length;i++)g.quadraticCurveTo(p[i-1][0]+5,p[i-1][1]-7,...p[i]);g.stroke({color:kind%5===0?0xa75e4b:0x70873c,width:12,cap:'round'});for(let i=0;i<5;i++)g.circle(-24+i*12,-66+(i%2?-4:0),3).fill({color:0xfff1bc,alpha:.6});g.circle(23,-64,2).fill(ink);}
 g.roundRect(-43,-38,86,23,3).fill(0xfff5d9);
 if(kind===4){g.ellipse(...packageOpening,40,6).fill(0x465331).stroke({color:ink,width:1.5});g.moveTo(-40,-105).quadraticCurveTo(0,-98,40,-105).stroke({color:0xeee2aa,width:2});}
}
export function worldInsect(geometry:ObjectGeometry,kind:number){return insectPoints(kind).map(p=>localPoint(p,geometry.frame));}
