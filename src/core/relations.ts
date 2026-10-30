import type {LocalFrame2D,Point2} from './spatial';

export interface Rect2 {readonly x:number;readonly y:number;readonly width:number;readonly height:number}
/** Author-declared local geometry. Drawing and checks consume this same object. */
export interface ObjectGeometry {
  readonly id:string;
  readonly frame:LocalFrame2D;
  readonly anchors:Readonly<Record<string,Point2>>;
  readonly regions?:Readonly<Record<string,Rect2>>;
}
const finitePoint=(p:Point2)=>p.length===2&&p.every(Number.isFinite);

/** Convex owner region, including boundaries. */
export function insideConvex(point:Point2,polygon:readonly Point2[],epsilon=1e-6):boolean{
  if(!finitePoint(point)||polygon.length<3||!polygon.every(finitePoint)||!Number.isFinite(epsilon)||epsilon<0)
    throw new RangeError('Finite point and convex polygon required');
  let sign=0;
  for(let i=0;i<polygon.length;i++){
    const a=polygon[i],b=polygon[(i+1)%polygon.length];
    const cross=(b[0]-a[0])*(point[1]-a[1])-(b[1]-a[1])*(point[0]-a[0]);
    if(Math.abs(cross)<=epsilon)continue;
    const next=Math.sign(cross);if(sign&&next!==sign)return false;sign=next;
  }
  return true;
}
