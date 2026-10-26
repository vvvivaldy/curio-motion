import { contourView } from '../../core/views';
import { morphContour, contourAnchor, mapContour, type CubicContour } from '../../core/contour';
import type { Point2 } from '../../core/spatial';

const shape = (start: Point2, keys: string[], rows: number[][]): CubicContour => ({ start,
  curves: rows.map((p,i)=>({key:keys[i],c1:[p[0],p[1]],c2:[p[2],p[3]],to:[p[4],p[5]]})) });
function shell(x:number,y:number,w:number,h:number,r:number):CubicContour {
  const k=.55228475;
  return shape([x+r,y],['top','topRight','right','bottomRight','bottom','bottomLeft','left','topLeft'],[
    [x+w-r,y,x+w-r,y,x+w-r,y],[x+w-r+k*r,y,x+w,y+r-k*r,x+w,y+r],
    [x+w,y+h-r,x+w,y+h-r,x+w,y+h-r],[x+w,y+h-r+k*r,x+w-r+k*r,y+h,x+w-r,y+h],
    [x+r,y+h,x+r,y+h,x+r,y+h],[x+r-k*r,y+h,x,y+h-r+k*r,x,y+h-r],
    [x,y+r,x,y+r,x,y+r],[x,y+r-k*r,x+r-k*r,y,x+r,y],
  ]);
}
const headViews=[{at:0,contour:shell(-75,-47,150,98,25)},{at:1,contour:shell(-68,-47,128,98,24)}];
const torsoViews=[{at:0,contour:shell(-49,-133,98,146,21)},{at:1,contour:shell(-44,-133,89,146,21)}];
export const canBody=shape([-34,-20],['lip','right','baseRight','baseLeft','left'],[
  [-18,-28,18,-28,34,-20],[39,-7,42,23,36,39],[30,46,10,46,0,46],
  [-12,46,-32,46,-38,38],[-42,18,-39,-8,-34,-20],
]);
export const canSpout=shape([30,-8],['upper','mouth','lower','root'],[
  [45,-9,64,-29,82,-38],[86,-35,92,-26,94,-21],[75,-8,53,16,34,21],[33,10,31,-2,30,-8],
]);
export const canHandle=shape([-24,-30],['upper','lower','root'],[
  [-52,-53,-77,-19,-63,3],[-53,23,-31,18,-26,1],[-23,-8,-23,-20,-24,-30],
]);
export const canAnchors={base:contourAnchor(canBody,'baseRight',1),grip:contourAnchor(canHandle,'upper',.5),
  spout:contourAnchor(canSpout,'mouth',.5)};
const jawKeys=['outer','tip','inner','root'];
const closed=shape([7,-9],jawKeys,[[14,-17,27,-17,29,-7],[34,-6,34,-3,29,-2],
  [25,-2,20,-1,17,-3],[10,-1,8,-4,7,-9]]);
const open=shape([7,-9],jawKeys,[[15,-20,28,-26,34,-20],[39,-18,38,-14,33,-12],
  [27,-13,21,-9,17,-5],[10,-2,8,-4,7,-9]]);
export const gripperContact:Point2=[30,0];
export function gripperShapes(close:number) {
  const upper=morphContour(open,closed,close);
  return [upper,mapContour(upper,p=>[p[0],-p[1]])];
}
export function robotModel(view:number) {
  return {head:contourView(headViews,view),torso:contourView(torsoViews,view)};
}
