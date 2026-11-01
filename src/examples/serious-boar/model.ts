import {quadraticPoint} from '../../core/contour';
import type {Point2} from '../../core/spatial';
/** The drawn smile and food destination share this actual surface geometry. */
export function boarMouth(happiness:number,chew:number){
 const start:Point2=[64-35*happiness,51-3*happiness],control:Point2=[91,61+happiness*26+chew*3],end:Point2=[119+14*happiness,47];
 return {start,control,end,contact:quadraticPoint(start,control,end,.78)};
}
