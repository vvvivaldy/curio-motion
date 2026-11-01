import {morphContour,mapContour,contourAnchor,type CubicContour} from '../../core/contour';
import {localPoint,type Point2} from '../../core/spatial';
// Authored compatible mitten contours. Contact is a real named curve endpoint.
const closed:CubicContour={start:[-5,-7],curves:[
 {key:'palm',c1:[-9,0],c2:[-8,11],to:[-2,15]},
 {key:'fingers',c1:[5,20],c2:[14,12],to:[13,6]},
 {key:'curl',c1:[13,2],c2:[9,1],to:[7,4]},
 {key:'gap',c1:[6,7],c2:[4,8],to:[3,5]},
 {key:'thumb',c1:[2,0],c2:[5,-6],to:[8,-6]},
 {key:'tip',c1:[13,-3],c2:[17,-5],to:[15,-9]},
 {key:'root',c1:[11,-14],c2:[2,-11],to:[-5,-7]},
]};
const open:CubicContour={start:[-5,-7],curves:[
 {key:'palm',c1:[-8,0],c2:[-7,14],to:[0,17]},
 {key:'fingers',c1:[9,21],c2:[16,15],to:[15,11]},
 {key:'curl',c1:[13,8],c2:[9,10],to:[6,12]},
 {key:'gap',c1:[3,13],c2:[3,5],to:[4,2]},
 {key:'thumb',c1:[5,-1],c2:[6,-4],to:[8,-6]},
 {key:'tip',c1:[11,-4],c2:[17,-4],to:[15,-9]},
 {key:'root',c1:[11,-13],c2:[2,-11],to:[-5,-7]},
]};
export function handGeometry(wrist:Point2,closure:number,scale=1,angle=0):{contour:CubicContour;contact:Point2;crease?:Point2[]}{
 const local=morphContour(open,closed,closure);
 const frame={origin:wrist,scale,angle};
 const contour=mapContour(local,p=>angle===0?[p[0]*scale+wrist[0],p[1]*scale+wrist[1]]:localPoint(p,frame));
 const geometry={contour,contact:contourAnchor(contour,'thumb',1)};
 return angle===0?geometry:{...geometry,crease:[[6,8],[11,6]].map(p=>localPoint(p as Point2,frame))};
}
