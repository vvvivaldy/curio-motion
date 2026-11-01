import {contourAnchor, cubicPoint, validateContour} from '../../core/contour';
import {insideConvex, segmentDistance, type Segment2} from '../../core/relations';
import {localPoint, type Point2} from '../../core/spatial';
import {foundationsPose, barrier, barrierBoundary, docks, armStrokeWidth, capsuleShape, limbLimits, type FoundationsPose} from './motion';
import {motionFoundationsSettings} from './settings';
//64 quadratic chords deviate by <=.003663px. The .02px allowance also
//covers the hook's64 samples per cubic. Conservative envelopes do not approve appearance.
const approximationAllowance = .02, requiredGap = 2;
const rectangle = (x:number,y:number,w:number,h:number):Point2[] => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
function lineDistance(line:Segment2, polygon:readonly Point2[]) {
  if(line.some(p=>insideConvex(p,polygon)))return 0;
  return Math.min(...polygon.map((a,i)=>segmentDistance(line,[a,polygon[(i+1)%polygon.length]])));
}
function envelopeDistance(a:readonly Point2[],b:readonly Point2[]) {
  if(a.some(p=>insideConvex(p,b))||b.some(p=>insideConvex(p,a)))return 0;
  return Math.min(...a.map((p,i)=>lineDistance([p,a[(i+1)%a.length]],b)));
}
export function visibleClearances(p:FoundationsPose) {
  const links:Segment2[]=[[p.arm.root,p.arm.joint],[p.arm.joint,p.arm.end]];
  // Root joint outer radius24 exceeds the22px shaft; other joints are inside it.
  const armDistance=(shape:readonly Point2[])=>Math.min(...links.map(l=>lineDistance(l,shape)-armStrokeWidth/2),lineDistance([p.arm.root,p.arm.root],shape)-24);
  const hookPoints=p.hand.curves.flatMap((c,i)=>Array.from({length:65},(_,j)=>cubicPoint(i?p.hand.curves[i-1].to:p.hand.start,c,j/64)));
  const xs=hookPoints.map(p=>p[0]),ys=hookPoints.map(p=>p[1]);
  const hookEnvelope=rectangle(Math.min(...xs)-approximationAllowance,Math.min(...ys)-approximationAllowance,Math.max(...xs)-Math.min(...xs)+2*approximationAllowance,Math.max(...ys)-Math.min(...ys)+2*approximationAllowance);
  const {width,height,ringY,ringRadius,ringStroke}=capsuleShape,ringOuter=ringRadius+ringStroke/2;
  const body=rectangle(-width/2,-height,width,height).map(q=>localPoint(q,p.capsule.frame));
  const ring=rectangle(-ringOuter,ringY-ringOuter,2*ringOuter,2*ringOuter).map(q=>localPoint(q,p.capsule.frame));
  const curvedStroke=barrier.strokeWidth/2+approximationAllowance;
  return {armBarrier:armDistance(barrierBoundary)-curvedStroke,
    hookBarrier:envelopeDistance(hookEnvelope,barrierBoundary)-curvedStroke,
    capsuleBarrier:Math.min(envelopeDistance(body,barrierBoundary),envelopeDistance(ring,barrierBoundary))-curvedStroke,
    armDocks:Math.min(...docks.map(d=>armDistance(rectangle(d.x,d.y,d.width,d.height))-Math.max(d.strokeWidth,d.topWidth)/2)),
    hookDocks:Math.min(...docks.map(d=>envelopeDistance(hookEnvelope,rectangle(d.x,d.y,d.width,d.height))-Math.max(d.strokeWidth,d.topWidth)/2))};
}
export function inspectFoundationsPose(p:FoundationsPose,frame:number) {
  const rows:{relation:string;frame:number;status:'pass'|'fail';message:string}[]=[];
  const add=(relation:string,pass:boolean,message:string)=>rows.push({relation,frame,status:pass?'pass':'fail',message});
  const distance=(a:Point2,b:Point2)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  add('locked-grip',distance(contourAnchor(p.hand,'touch',1),p.target)<1e-7,'Actual drawn hook endpoint on actual ring inner edge');
  add('joint-limits',(['shoulder','elbow','wrist'] as const).every(j=>p.arm.angles[j]>=limbLimits[`${j}Range`][0]-1e-9&&p.arm.angles[j]<=limbLimits[`${j}Range`][1]+1e-9)
    &&Math.abs(distance(p.arm.root,p.arm.joint)-limbLimits.upper)<1e-7&&Math.abs(distance(p.arm.joint,p.arm.end)-limbLimits.lower)<1e-7,'Rendered links obey authored lengths, branch and unchanged angular limits');
  const clearance=visibleClearances(p);
  add('arm-barrier-clearance',clearance.armBarrier>=requiredGap,`Both whole visible links/root joint vs actual Q dome including strokes: ${clearance.armBarrier.toFixed(5)}px; need${requiredGap}`);
  add('hook-clearance',Math.min(clearance.hookBarrier,clearance.hookDocks)>=requiredGap,`Conservative envelope of actual hook curves vs dome/docks: ${Math.min(clearance.hookBarrier,clearance.hookDocks).toFixed(5)}px; need${requiredGap}`);
  add('arm-dock-clearance',clearance.armDocks>=requiredGap,`Whole link radii/root joint vs actual dock envelopes/strokes: ${clearance.armDocks.toFixed(5)}px; need${requiredGap}`);
  const [x,y]=p.capsule.frame.origin;
  add('capsule-clearance',y<=docks[0].y+1e-7&&clearance.capsuleBarrier>=requiredGap,`Conservative body/ring envelopes vs actual curved dome: ${clearance.capsuleBarrier.toFixed(5)}px; need${requiredGap}`);
  const support=p.time<=.8?docks[0]:p.time>=3&&p.time<=5?docks[1]:p.time>=7.2?docks[0]:null;
  const soleHalfWidth=capsuleShape.width/2-capsuleShape.radius;
  add('supported-holds',!support||Math.abs(y-support.y)<1e-7&&x-soleHalfWidth>=support.x&&x+soleHalfWidth<=support.x+support.width,'Actual flat capsule bottom is on its specific drawn dock throughout held intervals');
  add('rejected-request',p.rejection.some(v=>v.constraint==='reach'),'Out-of-reach request explicitly blocked; no clamped or stale pose');
  add('finite-settle',p.time<8.6||p.response===0,'Finite spring gate ends at exact zero without persistent idle motion');
  let continuous=true;try{validateContour(p.hand);}catch{continuous=false;}
  add('continuous-hook',continuous,'Single closed whole hook contour; silhouette separately reviewed');
  return rows;
}
export function diagnoseFrames(frames:readonly number[]) {
  return frames.flatMap(frame=>{
    if(!Number.isSafeInteger(frame)||frame<0||frame>=motionFoundationsSettings.durationInFrames)throw new RangeError('Foundations diagnostic frame outside composition');
    return inspectFoundationsPose(foundationsPose(frame/motionFoundationsSettings.fps),frame);
  });
}
export function geometryAt(time:number) {
  const p=foundationsPose(time);
  return {objects:[p.capsule],paths:[{points:[p.arm.root,p.arm.joint,p.arm.end]},{points:[p.antennaRoot,p.antennaTip]}, {points:[...barrierBoundary,barrierBoundary[0]]}]};
}
