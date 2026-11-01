import {localPoint, type LocalFrame2D, type Point2} from './spatial';

export interface Rect2 {readonly x:number;readonly y:number;readonly width:number;readonly height:number}
/** Author-declared local geometry. Drawing and checks consume this same object. */
export interface ObjectGeometry {
  readonly id:string;
  readonly frame:LocalFrame2D;
  readonly anchors:Readonly<Record<string,Point2>>;
  readonly regions?:Readonly<Record<string,Rect2>>;
}
export interface AnchorRef {readonly object:ObjectGeometry;readonly anchor:string}
export interface GeometryCheck {readonly relation:string;readonly status:'pass'|'fail'|'needs-review';readonly message:string}
export type Segment2=readonly [Point2,Point2];

export function rectCorners(rect:Rect2):Point2[]{
  if(![rect.x,rect.y,rect.width,rect.height].every(Number.isFinite)||rect.width<=0||rect.height<=0)
    throw new RangeError('Finite rectangle with positive dimensions required');
  return [[rect.x,rect.y],[rect.x+rect.width,rect.y],[rect.x+rect.width,rect.y+rect.height],[rect.x,rect.y+rect.height]];
}
export function objectAnchor(ref:AnchorRef):Point2{
  const p=ref.object.anchors[ref.anchor];
  if(!ref.object.id||!p)throw new RangeError(`Missing object anchor: ${ref.object.id}/${ref.anchor}`);
  return localPoint(p,ref.object.frame);
}
export function objectRegion(object:ObjectGeometry,name:string):Point2[]{
  const rect=object.regions?.[name];
  if(!rect)throw new RangeError(`Missing object region: ${object.id}/${name}`);
  return rectCorners(rect).map(p=>localPoint(p,object.frame));
}
const finitePoint=(p:Point2)=>p.length===2&&p.every(Number.isFinite);
const distance=(a:Point2,b:Point2)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function check(relation:string,pass:boolean,message:string):GeometryCheck{
  if(!relation.trim())throw new RangeError('Relation id required');
  return {relation,status:pass?'pass':'fail',message};
}
export function checkContact(relation:string,a:AnchorRef,b:AnchorRef,tolerance:number):GeometryCheck{
  if(!Number.isFinite(tolerance)||tolerance<0)throw new RangeError('Nonnegative finite contact tolerance required');
  const error=distance(objectAnchor(a),objectAnchor(b));
  return check(relation,error<=tolerance,`${a.object.id}/${a.anchor} → ${b.object.id}/${b.anchor}: ${error.toFixed(4)}px, allowed ${tolerance}px`);
}
/** Convex owner region, including rotated rectangles. A boundary point is contained. */
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
export function checkContainment(relation:string,points:readonly Point2[],region:readonly Point2[]):GeometryCheck{
  if(!points.length)throw new RangeError('Visible geometry points required');
  const outside=points.filter(p=>!insideConvex(p,region)).length;
  return check(relation,outside===0,`${outside}/${points.length} measured points outside owner region`);
}
export function checkOwnership(relation:string,ownerId:string,actualParentId:string|null):GeometryCheck{
  if(!ownerId.trim())throw new RangeError('Owner id required');
  return check(relation,ownerId===actualParentId,`Expected parent ${ownerId}; actual ${actualParentId??'none'}`);
}
function pointSegmentDistance(p:Point2,[a,b]:Segment2){
  const dx=b[0]-a[0],dy=b[1]-a[1],length2=dx*dx+dy*dy;
  const u=length2?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length2)):0;
  return distance(p,[a[0]+u*dx,a[1]+u*dy]);
}
export function segmentDistance(a:Segment2,b:Segment2):number{
  if(![...a,...b].every(finitePoint))throw new RangeError('Finite segments required');
  const [p,q]=a,[r,s]=b,ux=q[0]-p[0],uy=q[1]-p[1],vx=s[0]-r[0],vy=s[1]-r[1];
  const cross=ux*vy-uy*vx;
  if(Math.abs(cross)>1e-10){
    const dx=r[0]-p[0],dy=r[1]-p[1],t=(dx*vy-dy*vx)/cross,u=(dx*uy-dy*ux)/cross;
    if(t>=0&&t<=1&&u>=0&&u<=1)return 0;
  }
  return Math.min(pointSegmentDistance(p,b),pointSegmentDistance(q,b),pointSegmentDistance(r,a),pointSegmentDistance(s,a));
}
/** Explicitly selected geometry only; projected overlap may be intentional. */
export function checkClearance(relation:string,a:Segment2,b:Segment2,minimum:number):GeometryCheck{
  if(!Number.isFinite(minimum)||minimum<0)throw new RangeError('Nonnegative finite clearance required');
  const gap=segmentDistance(a,b);
  return check(relation,gap>=minimum,`Segment clearance ${gap.toFixed(4)}px; required ${minimum}px`);
}
