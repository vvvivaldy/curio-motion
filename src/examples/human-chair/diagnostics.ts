import {humanPose,humanControl} from './motion';
import {humanChairSettings} from './settings';
import {humanDesign,chair} from './design';
import {cubicPoint,validateContour,type CubicContour} from '../../core/contour';
import {insideConvex} from '../../core/relations';
import {localPoint,type Point2} from '../../core/spatial';
const distance=(a:readonly number[],b:readonly number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));
const sample=(c:CubicContour)=>c.curves.flatMap((q,i)=>Array.from({length:33},(_,j)=>cubicPoint(i?c.curves[i-1].to:c.start,q,j/32)));
// QA only: a sampled filled-contour check, not an anatomy or appearance oracle.
function inside(point:Point2,c:CubicContour){const p=sample(c);let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++)if((p[i][1]>point[1])!==(p[j][1]>point[1])&&point[0]<(p[j][0]-p[i][0])*(point[1]-p[i][1])/(p[j][1]-p[i][1])+p[i][0])yes=!yes;return yes;}
export function diagnoseFrames(frames:readonly number[]){return frames.flatMap(frame=>{
 if(!Number.isSafeInteger(frame)||frame<0||frame>=humanChairSettings.durationInFrames)throw new RangeError('Human frame outside composition');
 const time=frame/24,p=humanPose(time),rows:{relation:string;frame:number;status:'pass'|'fail';message:string}[]=[];
 const add=(relation:string,pass:boolean,message:string)=>rows.push({relation,frame,status:pass?'pass':'fail',message});
 const lengths=p.legs.every(l=>Math.abs(distance(l.spatial.root,l.spatial.joint)-humanDesign.upperLeg)<1e-7&&Math.abs(distance(l.spatial.joint,l.spatial.end)-humanDesign.lowerLeg)<1e-7)&&p.arms.every(a=>Math.abs(distance(a.root,a.joint)-humanDesign.upperArm)<1e-7&&Math.abs(distance(a.joint,a.wrist)-humanDesign.lowerArm)<1e-7);
 add('bone-lengths',lengths,'Actual90/86 legs and64/58 arms; during yaw the3D knee projects continuously and projected shafts foreshorten. No target or joint clamps.');
 const floor=p.legs.every((l,i)=>l.sole[1]<=p.feet[i][1]+1e-7&&sample(l.foot).every(q=>q[1]<=l.sole[1]+1e-7));
 add('actual-floor-soles',floor&&p.legs.some(l=>l.planted),'Actual shoe sole is a horizontal contour edge with its stroke inside the floor; at least one foot is planted, free soles never penetrate their floor lane.');
 const seat=!p.seat||(Math.abs(p.hips[1]+12-chair.seatY)<1e-7&&insideConvex([p.hips[0],p.hips[1]+12],chair.seat));
 add('actual-seat-contact',seat,'Seated support uses the actual drawn pelvis ellipse bottom and drawn seat polygon. Free pelvis is not declared as seat support.');
 let closed=true;try{for(const c of [p.body,p.head,...p.legs.flatMap(l=>[l.shape.contour,l.foot]),...p.arms.flatMap(a=>[a.shape.contour,a.hand])])validateContour(c);}catch{closed=false;}
 const centers=[10,25,40,55,70,85,98].every(y=>inside(p.bodyPoint(0,y),p.body));
 add('filled-torso',closed&&centers,'Same rendered closed body is filled along its anatomical axis; no screen-horizontal handle collapse. Sampled geometry is partial evidence; silhouette/attachments still require independent visual inspection.');
 const before=humanPose(Math.max(0,time-1e-5)),after=humanPose(Math.min((humanChairSettings.durationInFrames-1)/24,time+1e-5));
 const fixed=p.legs.every((l,i)=>!(l.planted&&before.legs[i].planted&&after.legs[i].planted)||(distance(l.sole,before.legs[i].sole)<1e-7&&distance(l.sole,after.legs[i].sole)<1e-7));
 add('authored-root',distance(p.hips,humanControl(time).hips)<1e-9,'Authored pelvis is consumed unchanged; reach validation may reject it but never applies reactive per-frame height corrections. This is not a natural-motion verdict.');
 const features=[...p.face.eyes.filter(e=>e.alpha>1e-6).map(e=>e.center),...p.face.mouth,...p.face.nose].map(q=>localPoint(q,p.headFrame));
 add('face-geometry',features.every(q=>inside(q,p.head)),'Visible eye centers/nose/mouth belong inside the same rendered whole-view skull; cohesion/readability still require visual review.');
 add('chair-join',chair.legs.every(l=>l.slice(0,2).every(p=>p[1]>=Math.min(...chair.seat.map(q=>q[1])))),'Actual drawn leg roots do not protrude above the back seat edge; intentional chair back remains a separate member. Inspect actual seams.');
 const near=p.depthOrder.near,far=p.depthOrder.far;
 const expectedNear=p.facing>0?1:0;
 const binding=near===expectedNear&&near!==far&&p.arms[near].cameraDepth>=p.arms[far].cameraDepth&&p.legs[near].cameraDepth>=p.legs[far].cameraDepth&&p.arms.every((a,i)=>a.side===i&&a.cameraDepth===p.legs[i].cameraDepth&&Math.hypot(a.root[0]-p.bodyPoint(...a.attachment)[0],a.root[1]-p.bodyPoint(...a.attachment)[1])<1e-9);
 add('anatomical-depth',binding,'Stable anatomical chains share signed camera depth at their actual shoulder/hip attachments; expected rightwardnear side1/leftwardnear side0. Native/encoded occlusion must still be inspected; field labels alone do not prove layering.');
 add('locked-supports',fixed,'At a planted interior contact, nearby actual drawn soles stay at the same world point. Finite step endpoints have zero velocity.');
 return rows;
});}
