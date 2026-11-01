import type {Graphics} from 'pixi.js';
import type {LocalFrame2D} from './spatial';

/** Append a local frame to its parent, including nested package/hand details.
 * Pixi's separate rotate/scale operations also transform the current translation;
 * composing one local matrix preserves the parent origin and restores it on exit.
 */
export function withGraphicsFrame(graphics:Graphics,frame:LocalFrame2D,draw:()=>void):void{
 const {origin,angle,scale}=frame;
 if(![...origin,angle,scale].every(Number.isFinite)||scale<=0)throw new RangeError('Finite local frame and positive scale required');
 const c=Math.cos(angle)*scale,s=Math.sin(angle)*scale;
 graphics.save();
 try{graphics.transform(c,s,-s,c,...origin);draw();}finally{graphics.restore();}
}
