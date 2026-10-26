import { contourView } from '../../core/views';
import { contourAnchor, type CubicContour } from '../../core/contour';
import { smooth, mix } from '../../core/time';
import type { Point2 } from '../../core/spatial';
const keys=['ankle','rightUpper','rightLower','sole','leftLower','leftUpper'];
const outline=(rows:number[][]):CubicContour=>({start:[-10,-11],curves:rows.map((v,i)=>({key:keys[i],
  c1:[v[0],v[1]],c2:[v[2],v[3]],to:[v[4],v[5]]}))});
const left=outline([[-4,-8,7,-10,10,-6],[14,-3,18,3,18,8],[18,11,18,13,18,13],
  [-2,13,-27,13,-42,13],[-48,13,-49,5,-43,2],[-31,-2,-17,0,-10,-11]]);
const right=outline([[-4,-8,7,-10,10,-6],[20,-1,38,-1,43,3],[49,9,46,13,42,13],
  [25,13,-2,13,-18,13],[-23,12,-20,4,-17,1],[-15,-2,-12,-8,-10,-11]]);
const profile=outline([[-4,-8,7,-10,10,-6],[19,-1,37,-1,43,3],[48,8,47,13,42,13],
  [24,13,-2,13,-18,13],[-22,12,-20,4,-17,1],[-14,-2,-12,-7,-10,-11]]);

/** Full contours retain area when a left-facing foot turns right; never a signed width scale. */
export function footShape(side:number,heading:number) {
  const contour=contourView([{at:0,contour:side<0?left:right},{at:Math.PI/2,contour:profile}],heading);
  const turn=smooth(heading/(Math.PI/2));
  const creases=[0,1].map(i=>{
    const anchor=contourAnchor(contour,'sole',mix(side<0?.76+i*.14:.12+i*.2,.12+i*.2,turn));
    return [[anchor[0]-3,anchor[1]-9],[anchor[0]+4,anchor[1]-7],anchor] as [Point2,Point2,Point2];
  });
  return {contour,creases};
}
