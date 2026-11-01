import type {Point2} from '../../core/spatial';
/** Stable anatomical side IDs. Camera-nearness changes with the authored whole view.
 * Projected attachments and painter order consume the SAME signed depth.
 */
export type BodySide=0|1;
export const cameraDepth=(side:BodySide,yaw:number)=>(side===0?-1:1)*yaw;
export const hipRoot=(hips:Point2,side:BodySide,yaw:number):Point2=>[hips[0]+(side===0?10:-10),hips[1]-3+3*cameraDepth(side,yaw)];
export const shoulderLocal=(side:BodySide,yaw:number):Point2=>[side===0?21:-21,96-2*cameraDepth(side,yaw)];
/** Contact lanes are chosen only when authoring a step, never moved under a planted foot. */
export const contactFloor=(side:BodySide,yaw:number)=>597+3*cameraDepth(side,yaw);
export function depthOrder(yaw:number){const near:BodySide=cameraDepth(0,yaw)>=cameraDepth(1,yaw)?0:1;return{near,far:(1-near) as BodySide};}
