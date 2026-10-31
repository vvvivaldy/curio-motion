import type { Point2, Vec3 } from './spatial';

/** Right-handed rigid frame. For characters: +X anatomical left, +Y up, +Z forward.
 * Axes are columns expressed in the parent space. No scale, reflection or silent repair. */
export interface Frame3 { readonly origin: Vec3; readonly x: Vec3; readonly y: Vec3; readonly z: Vec3 }
export type AnatomicalSide = 'left' | 'right';
export const add3 = (a: Vec3, b: Vec3): Vec3 => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub3 = (a: Vec3, b: Vec3): Vec3 => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const scale3 = (a: Vec3, s: number): Vec3 => [a[0]*s,a[1]*s,a[2]*s];
export const dot3 = (a: Vec3, b: Vec3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross3 = (a: Vec3, b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export function unit3(v: Vec3): Vec3 {
  const length=Math.hypot(...v);
  if(!v.every(Number.isFinite)||length<1e-12) throw new RangeError('Finite nonzero vector required');
  return scale3(v,1/length);
}
export function validateFrame3(f: Frame3): void {
  const axes=[f.x,f.y,f.z];
  if(![...f.origin,...axes.flat()].every(Number.isFinite) || axes.some(a=>Math.abs(dot3(a,a)-1)>1e-8)
    || Math.abs(dot3(f.x,f.y))>1e-8 || Math.abs(dot3(f.x,f.z))>1e-8 || Math.abs(dot3(f.y,f.z))>1e-8
    || Math.abs(dot3(cross3(f.x,f.y),f.z)-1)>1e-8) throw new RangeError('Finite right-handed orthonormal frame required');
}
export function yawFrame3(origin: Vec3, yaw: number): Frame3 {
  if(![...origin,yaw].every(Number.isFinite)) throw new RangeError('Finite origin and yaw required');
  const c=Math.cos(yaw),s=Math.sin(yaw);
  return {origin:[...origin],x:[c,0,-s],y:[0,1,0],z:[s,0,c]};
}
export function vectorInFrame3(f: Frame3, v: Vec3): Vec3 {
  validateFrame3(f);
  if(!v.every(Number.isFinite)) throw new RangeError('Finite vector required');
  return add3(add3(scale3(f.x,v[0]),scale3(f.y,v[1])),scale3(f.z,v[2]));
}
export function pointInFrame3(f: Frame3, p: Vec3): Vec3 { return add3(f.origin,vectorInFrame3(f,p)); }
export function vectorFromFrame3(f: Frame3, v: Vec3): Vec3 {
  validateFrame3(f);
  if(!v.every(Number.isFinite)) throw new RangeError('Finite vector required');
  return [dot3(v,f.x),dot3(v,f.y),dot3(v,f.z)];
}
export function composeFrame3(parent: Frame3, child: Frame3): Frame3 {
  validateFrame3(child);
  return {origin:pointInFrame3(parent,child.origin),x:vectorInFrame3(parent,child.x),y:vectorInFrame3(parent,child.y),z:vectorInFrame3(parent,child.z)};
}

/** Affine paper camera, world +Y up. Separate from the older spatial.project convention. */
export interface AffineView { readonly yaw: number; readonly elevation: number; readonly scale: number; readonly origin: readonly [number,number] }
function validateView(v: AffineView) {
  if(![v.yaw,v.elevation,v.scale,...v.origin].every(Number.isFinite)||v.scale<=0) throw new RangeError('Finite view and positive scale required');
}
export function affineViewRay(v: AffineView): Vec3 {
  validateView(v); return unit3([-Math.sin(v.yaw),v.elevation,Math.cos(v.yaw)]);
}
export function affineDepth(p: Vec3, v: AffineView): number {
  validateView(v);
  if(!p.every(Number.isFinite)) throw new RangeError('Finite point required');
  return -p[0]*Math.sin(v.yaw)+p[2]*Math.cos(v.yaw);
}
export function affineProject(p: Vec3, v: AffineView): Point2 {
  const d=affineDepth(p,v);
  return [v.origin[0]+(p[0]*Math.cos(v.yaw)+p[2]*Math.sin(v.yaw))*v.scale,v.origin[1]+(-p[1]+v.elevation*d)*v.scale];
}
export function affineUnprojectAtDepth(p: Point2, depth: number, v: AffineView): Vec3 {
  validateView(v);
  if(![...p,depth].every(Number.isFinite)) throw new RangeError('Finite screen point and depth required');
  const u=(p[0]-v.origin[0])/v.scale,w=(p[1]-v.origin[1])/v.scale,c=Math.cos(v.yaw),s=Math.sin(v.yaw);
  return [c*u-s*depth,v.elevation*depth-w,s*u+c*depth];
}
export function facingSide(normal: Vec3, ray: Vec3, angularEpsilon=1e-6): 'front'|'back'|'edge' {
  if(!Number.isFinite(angularEpsilon)||angularEpsilon<0||angularEpsilon>=1) throw new RangeError('Angular tolerance must be in [0,1)');
  const d=dot3(unit3(normal),unit3(ray)); return d>angularEpsilon?'front':d < -angularEpsilon?'back':'edge';
}
