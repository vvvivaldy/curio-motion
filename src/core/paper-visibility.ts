import type { Point2, Vec3 } from './spatial';
import { type AffineView, affineProject, affineDepth, cross3, sub3 } from './frame3';
import { clipConvex } from './eye';

/** An actual opaque drawn surface, not a root/mean depth proxy. Rank only breaks coplanar ties. */
export interface PaperTriangle3 { readonly id: string; readonly owner: string; readonly vertices: readonly [Vec3,Vec3,Vec3]; readonly coplanarRank?: number }
const epsilon=1e-8;
const area=(p:readonly Point2[])=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1];},0)/2;
function clean(p:Point2[]):Point2[]{
  const q=p.filter((v,i)=>{const prev=p[(i+p.length-1)%p.length];return Math.hypot(v[0]-prev[0],v[1]-prev[1])>epsilon;});
  return q.length>=3&&Math.abs(area(q))>epsilon?q:[];
}
function cut(p:Point2[],value:(q:Point2)=>number):Point2[]{
  if(!p.length)return [];
  const out:Point2[]=[];
  let a=p.at(-1)!,da=value(a);
  for(const b of p){const db=value(b);
    if((da>=0)!==(db>=0)){const u=da/(da-db);out.push([a[0]+u*(b[0]-a[0]),a[1]+u*(b[1]-a[1])]);}
    if(db>=0)out.push(b);
    a=b;da=db;
  }
  return clean(out);
}
/** Subtract one convex aperture, retaining convex fragments rather than bridging a hole. */
function subtract(subject:Point2[],hidden:Point2[]):Point2[][] {
  const out:Point2[][]=[],sign=Math.sign(area(hidden)); let inside=subject;
  for(let i=0;i<hidden.length&&inside.length;i++){
    const a=hidden[i],b=hidden[(i+1)%hidden.length];
    const value=(p:Point2)=>sign*((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]));
    const outside=cut(inside,p=>-value(p));if(outside.length)out.push(outside);
    inside=cut(inside,value);
  }
  return out;
}
function projectTriangle(t:PaperTriangle3,view:AffineView){
  if(!t.id||!t.owner||!t.vertices.flat().every(Number.isFinite)||!Number.isFinite(t.coplanarRank??0))throw new RangeError('Finite identified paper triangle required');
  if(Math.hypot(...cross3(sub3(t.vertices[1],t.vertices[0]),sub3(t.vertices[2],t.vertices[0])))<1e-12)throw new RangeError('Nondegenerate world triangle required');
  const points=t.vertices.map(p=>affineProject(p,view)),signedArea=area(points);
  if(Math.abs(signedArea)<epsilon)return null; // Real edge-on surface: no invented width.
  const [a,b,c]=points,[da,db,dc]=t.vertices.map(p=>affineDepth(p,view));
  const det=2*signedArea;
  const x=((db-da)*(c[1]-a[1])-(dc-da)*(b[1]-a[1]))/det;
  const y=((b[0]-a[0])*(dc-da)-(c[0]-a[0])*(db-da))/det;
  return {points,depth:(p:Point2)=>da+x*(p[0]-a[0])+y*(p[1]-a[1])};
}
/** Exact depth clipping for explicitly authored opaque planar triangles in this affine camera.
 * Intended fragments may mask the original contour; never stroke internal cut boundaries.
 * Does not repair intersecting anatomy, build surfaces, or handle translucency. */
export function visibleTriangleFragments(target:PaperTriangle3,occluders:readonly PaperTriangle3[],view:AffineView,depthTolerance=1e-6):Point2[][] {
  if(!Number.isFinite(depthTolerance)||depthTolerance<0)throw new RangeError('Nonnegative depth tolerance required');
  const a=projectTriangle(target,view);if(!a)return [];
  let fragments:Point2[][]=[a.points];
  for(const t of occluders){
    if(t.id===target.id)continue;
    const b=projectTriangle(t,view);if(!b)continue;
    let hidden=clean(clipConvex(a.points,b.points));if(!hidden.length)continue;
    const difference=(p:Point2)=>b.depth(p)-a.depth(p);
    const coplanar=hidden.every(p=>Math.abs(difference(p))<=depthTolerance);
    if(coplanar){if((t.coplanarRank??0)<=(target.coplanarRank??0))continue;}
    else hidden=cut(hidden,p=>difference(p)-depthTolerance);
    if(hidden.length)fragments=fragments.flatMap(f=>subtract(f,hidden));
    if(!fragments.length)break;
  }
  return fragments;
}
