import {mapContour,morphContour,contourAnchor,type CubicContour} from '../../core/contour';
import {localPoint,type LocalFrame2D,type Point2} from '../../core/spatial';
// Whole, screen-ordered views: two compact large ears and a clean forehead.
// No extra tuft and no thin isolated horn copied from an ambiguous photo pixel.
export const headContour:CubicContour={start:[8,36],curves:[
 {key:'chin',c1:[-15,37],c2:[-31,29],to:[-39,19]},
 {key:'leftCheek',c1:[-60,15],c2:[-71,0],to:[-70,-22]},
 {key:'leftEarOuter',c1:[-69,-39],c2:[-61,-58],to:[-48,-65]},
 {key:'leftEarTip',c1:[-39,-70],c2:[-29,-57],to:[-26,-43]},
 {key:'forehead',c1:[-13,-43],c2:[4,-37],to:[18,-31]},
 {key:'rightEar',c1:[30,-49],c2:[52,-63],to:[63,-49]},
 {key:'rightCheek',c1:[79,-30],c2:[77,7],to:[61,20]},
 {key:'neck',c1:[47,33],c2:[25,39],to:[8,36]},
]};
// Same screen winding/landmarks through a front view; interpolation cannot
// collapse the whole head to a line as a signed-scale mirror would.
export const leftHeadContour:CubicContour={start:[-8,36],curves:[
 {key:'chin',c1:[-25,39],c2:[-47,33],to:[-61,20]},
 {key:'leftCheek',c1:[-77,7],c2:[-79,-30],to:[-63,-49]},
 {key:'leftEarOuter',c1:[-52,-63],c2:[-30,-49],to:[-18,-31]},
 {key:'leftEarTip',c1:[-4,-37],c2:[13,-43],to:[26,-43]},
 {key:'forehead',c1:[29,-57],c2:[39,-70],to:[48,-65]},
 {key:'rightEar',c1:[61,-58],c2:[69,-39],to:[70,-22]},
 {key:'rightCheek',c1:[71,0],c2:[60,15],to:[39,19]},
 {key:'neck',c1:[31,29],c2:[15,37],to:[-8,36]},
]};
export const pawContour:CubicContour={start:[-6,-4],curves:[
 {key:'back',c1:[-3,-8],c2:[9,-7],to:[13,-3]},
 {key:'clawOuter',c1:[16,1],c2:[15,7],to:[11,8]},
 {key:'clawInner',c1:[9,9],c2:[9,7],to:[10,4]},
 {key:'pad',c1:[8,4],c2:[5,4],to:[3,4]},
 {key:'wrist',c1:[-3,4],c2:[-7,1],to:[-6,-4]},
]};
export const footContour:CubicContour={start:[-7,0],curves:[
 {key:'heel',c1:[-10,-2],c2:[-10,-8],to:[-4,-10]},
 {key:'ankle',c1:[1,-12],c2:[6,-9],to:[8,-6]},
 {key:'toes',c1:[13,-5],c2:[18,-3],to:[19,0]},
 {key:'sole',c1:[12,0],c2:[0,0],to:[-7,0]},
]};
export const pawPad=contourAnchor(pawContour,'pad',.5);
// dy/dt of clawInner is 3-18t+6t²; the inner root is the real lowest contour point.
// Grip pad and floor contact are intentionally distinct authored surface anchors.
export const pawFloorT=(3-Math.sqrt(7))/2;
export const pawFloorContact=contourAnchor(pawContour,'clawInner',pawFloorT);
export const soleAnchor=contourAnchor(footContour,'sole',.5);
export const neckAnchor=contourAnchor(headContour,'neck',1);
export const placeContour=(contour:CubicContour,frame:LocalFrame2D)=>mapContour(contour,p=>localPoint(p,frame));
export function torsoContour(hips:Point2,shoulders:Point2):CubicContour {
 const [hx,hy]=hips,[sx,sy]=shoulders;
 const screen:CubicContour={start:[sx-13,sy-8],curves:[
  {key:'shoulder',c1:[sx-2,sy-12],c2:[sx+14,sy-7],to:[sx+16,sy+3]},
  {key:'front',c1:[sx+20,sy+18],c2:[hx+17,hy-10],to:[hx+15,hy+4]},
  {key:'rump',c1:[hx+12,hy+13],c2:[hx-12,hy+13],to:[hx-16,hy+3]},
  {key:'back',c1:[hx-17,hy-10],c2:[sx-21,sy+10],to:[sx-13,sy-8]},
 ]};
 // Screen-horizontal widths cross when a deeply bent shoulder is nearly level
 // with the pelvis. Transport the same whole contour in its anatomical frame;
 // keep approved upright/shallow poses byte-for-byte unchanged.
 const length=Math.hypot(hx-sx,hy-sy),u=Math.max(0,Math.min(1,(Math.abs(hx-sx)-22)/12));
 if(!u)return screen;
 const down:Point2=[(hx-sx)/length,(hy-sy)/length],side:Point2=[down[1],-down[0]];
 const at=(origin:Point2,x:number,y:number):Point2=>[origin[0]+side[0]*x+down[0]*y,origin[1]+side[1]*x+down[1]*y];
 const s=(x:number,y:number)=>at(shoulders,x,y),h=(x:number,y:number)=>at(hips,x,y);
 const axial:CubicContour={start:s(-13,-8),curves:[
  {key:'shoulder',c1:s(-2,-12),c2:s(14,-7),to:s(16,3)},
  {key:'front',c1:s(20,18),c2:h(17,-10),to:h(15,4)},
  {key:'rump',c1:h(12,13),c2:h(-12,13),to:h(-16,3)},
  {key:'back',c1:h(-17,-10),c2:s(-21,10),to:s(-13,-8)},
 ]};
 return morphContour(screen,axial,u*u*(3-2*u));
}

