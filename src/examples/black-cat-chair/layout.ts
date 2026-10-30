import type {Point2} from '../../core/spatial';
import type {ObjectGeometry} from '../../core/relations';
export const floorY=600;
export const chair={seatY:454,backY:436,topY:320,nearLeft:760,width:212,depth:[-18,-18] as Point2,thickness:14,
 seat:[[760,454],[972,454],[954,436],[742,436]] as Point2[],
 front:[[760,454],[972,454],[972,468],[760,468]] as Point2[],
 side:[[742,436],[760,454],[760,468],[742,450]] as Point2[],
 legs:[[[745,446],[756,446],[747,582],[734,582]],[[941,446],[953,446],[966,582],[953,582]],[[762,464],[775,464],[763,600],[749,600]],[[957,464],[970,464],[986,600],[972,600]]] as Point2[][]};
export const seatGeometry:ObjectGeometry={id:'red-chair-seat',frame:{origin:[760,454],angle:0,scale:1},anchors:{nearGrip:[36,0],farGrip:[4,0],seatCentre:[100,-9]}};
// Both actual pads hook the near front lip; they are separated, not an occluded clone.
