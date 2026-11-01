import type {Vec3} from './spatial';
import type {PaperTriangle3} from './paper-visibility';
import {cross3,sub3,add3,scale3} from './frame3';

export interface AxisAlignedBox3 {readonly min:Vec3;readonly max:Vec3}
/** Intersections of the actual drawn opaque surface with a declared solid interior.
 * Boundary contact within tolerance is allowed. Not an inferred collider or volume solver:
 * a box wholly enclosed by a closed surface needs a separate containment check. */
export function surfaceBoxIntrusions(surfaces:readonly PaperTriangle3[],box:AxisAlignedBox3,tolerance=1e-6):{id:string;owner:string;polygon:Vec3[]}[]{
 if(![...box.min,...box.max,tolerance].every(Number.isFinite)||tolerance<0||box.min.some((v,i)=>box.max[i]-v<=2*tolerance))throw new RangeError('Finite box with positive interior and small nonnegative tolerance required');
 const result:{id:string;owner:string;polygon:Vec3[]}[]=[];
 for(const t of surfaces){
  if(!t.id||!t.owner||!t.vertices.flat().every(Number.isFinite))throw new RangeError('Finite identified surface required');
  let polygon:Vec3[]=t.vertices.map(v=>[...v]);
  for(const axis of [0,1,2])for(const side of [0,1]){
   if(!polygon.length)break;
   const value=(p:Vec3)=>side?box.max[axis]-tolerance-p[axis]:p[axis]-box.min[axis]-tolerance;
   const output:Vec3[]=[];let a=polygon.at(-1)!,da=value(a);
   for(const b of polygon){const db=value(b);
    if((da>=0)!==(db>=0)){const u=da/(da-db);output.push(add3(a,scale3(sub3(b,a),u)));}
    if(db>=0)output.push(b);a=b;da=db;
   }
   polygon=output;
  }
  if(polygon.length<3)continue;
  let area:Vec3=[0,0,0];for(let i=1;i<polygon.length-1;i++)area=add3(area,cross3(sub3(polygon[i],polygon[0]),sub3(polygon[i+1],polygon[0])));
  if(Math.hypot(...area)>1e-12)result.push({id:t.id,owner:t.owner,polygon});
 }
 return result;
}
