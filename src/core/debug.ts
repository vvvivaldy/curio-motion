import type {Graphics} from 'pixi.js';
import {objectAnchor,objectRegion,type ObjectGeometry} from './relations';
import type {Point2} from './spatial';
export interface DiagnosticPath {readonly points:readonly Point2[];readonly color?:number}
/** Evidence-only overlay. Inputs must share one scene space with the drawing. */
export function drawGeometryOverlay(g:Graphics,objects:readonly ObjectGeometry[],paths:readonly DiagnosticPath[]=[]){
 g.clear();
 for(const object of objects){
  for(const name of Object.keys(object.regions??{})){
   const points=objectRegion(object,name);g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);
   g.closePath().stroke({color:0x009fe3,width:1.5});
  }
  for(const anchor of Object.keys(object.anchors)){
   const p=objectAnchor({object,anchor});g.circle(...p,4).fill(0xe53a76);
  }
 }
 for(const {points,color=0xc83ce5} of paths){
  if(points.length<2)continue;
  if(!points.every(p=>p.every(Number.isFinite)))throw new RangeError('Finite diagnostic trajectory required');
  g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width:2});
  for(const p of points)g.circle(...p,2).fill(color);
 }
}
