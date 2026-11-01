import {Graphics} from 'pixi.js';
import {cubicPoint,type CubicContour} from '../../core/contour';
import type {Point2} from '../../core/spatial';
import type {LimbShape} from '../../core/limb';
// Private drawing primitives for these TWO authored illustrations; no style engine.
export function path(g:Graphics,c:CubicContour){g.moveTo(...c.start);for(const q of c.curves)g.bezierCurveTo(...q.c1,...q.c2,...q.to);return g.closePath();}
export function polygon(points:readonly Point2[]):CubicContour{return{start:points[0],curves:points.map((a,i)=>{const b=points[(i+1)%points.length];return{key:`edge${i}`,c1:[a[0]+(b[0]-a[0])/3,a[1]+(b[1]-a[1])/3],c2:[a[0]+2*(b[0]-a[0])/3,a[1]+2*(b[1]-a[1])/3],to:b};})};}
export function line(g:Graphics,points:readonly Point2[],color:number,width=1,alpha=1){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width,alpha,cap:'round',join:'round'});}
export function seed(id:string,index:number){let n=2166136261;for(const c of `${id}:${index}`)n=Math.imul(n^c.charCodeAt(0),16777619);return(n>>>0)/4294967296;}
export function shade(far:number,near:number,depth:number){const u=(depth+1)/2;return[16,8,0].reduce((color,s)=>color|(Math.round(((far>>s)&255)*(1-u)+((near>>s)&255)*u)<<s),0);}
export function inkOutline(g:Graphics,c:CubicContour,id:string,color=0x383a3a){
 // The closed structural edge stays INSIDE the accepted contour/contact boundary.
 path(g,c).stroke({color,width:.55,alignment:1,alpha:.55,join:'round'});
 const samples=c.curves.flatMap((q,i)=>[0,.25,.5,.75].map(t=>cubicPoint(i?c.curves[i-1].to:c.start,q,t)));let area=0;
 for(let i=0;i<samples.length;i++){const a=samples[i],b=samples[(i+1)%samples.length];area+=a[0]*b[1]-b[0]*a[1];}
 const inward=area>=0?1:-1;
 for(const [i,q] of c.curves.entries())for(let j=0;j<4;j++){
  const from=i?c.curves[i-1].to:c.start,points:Point2[]=[];
  for(let k=0;k<=5;k++){const t=(j+k/5)/4,p=cubicPoint(from,q,t),a=cubicPoint(from,q,Math.max(0,t-.002)),b=cubicPoint(from,q,Math.min(1,t+.002)),dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;points.push([p[0]-inward*dy/length*.68,p[1]+inward*dx/length*.68]);}
  const r=seed(id+q.key,j);line(g,points,color,.65+.48*r,.58+.30*r);
  if(r>.78){const short=points.slice(1,5);line(g,short,color,.35,.23);}
 }
}
export function boneMarks(g:Graphics,l:LimbShape,id:string,color:number,kind:'hatch'|'fiber'){
 for(const [part,[a,b]] of [l.upper,l.lower].entries()){
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),u:Point2=[dx/length,dy/length],n:Point2=[-u[1],u[0]];
  const count=kind==='hatch'?6:13;
  for(let i=0;i<count;i++){const t=.20+i*(.62/(count-1)),r=seed(id+part,i),offset=kind==='hatch'?2.5:(r-.5)*5,centre:Point2=[a[0]+dx*t+n[0]*offset,a[1]+dy*t+n[1]*offset];
   const end:Point2=kind==='hatch'?[centre[0]+n[0]*3.0+u[0]*3.3,centre[1]+n[1]*3.0+u[1]*3.3]:[centre[0]+u[0]*(1.3+r),centre[1]+u[1]*(1.3+r)];
   line(g,[centre,end],color,kind==='hatch'?.65:.45,kind==='hatch'?.34:.22);
  }
 }
}
export const chairBackPanels:readonly Point2[][]=[[[865,407],[879,399],[881,500],[868,506]],[[858,412],[870,406],[871,493],[859,500]],[[860,413],[872,405],[873,460],[861,468]]];
