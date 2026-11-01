import {boarPose,pile,pileGeometry} from './motion';
import {insectPoints,worldInsect,mouthAnchor,happyEye,seatedUpperOffset,headEnvelope,warningLayout,handContour} from './model';
import {checkContact,checkContainment,objectRegion,segmentDistance,checkClearance,insideConvex,type ObjectGeometry,type GeometryCheck,type Segment2} from '../../core/relations';
import {localPoint,type Point2} from '../../core/spatial';
import {cubicPoint,quadraticPoint,validateContour,type CubicContour} from '../../core/contour';
function contourPoints(c:CubicContour){const points:Point2[]=[c.start];let from=c.start;for(const curve of c.curves){for(let i=1;i<=8;i++)points.push(cubicPoint(from,curve,i/8));from=curve.to;}return points;}
const segments=(p:readonly Point2[]):Segment2[]=>p.slice(1).map((b,i)=>[p[i],b]);
export function geometryAt(time:number){
 const p=boarPose(time);
 const boar:ObjectGeometry={id:'boar',frame:p.actor,anchors:{near:p.nearHand,far:p.farHand,soleA:p.feet[0],soleB:p.feet[1],...(p.seated?{mouth:mouthAnchor(p.chew)}:{})},regions:{head:{...headEnvelope,y:headEnvelope.y+(p.seated?seatedUpperOffset:0)}}};
 const cart:ObjectGeometry={id:'cart',frame:p.cart,anchors:{grip:[-128,-118],farGrip:[-114,-118]}};
 const objects:ObjectGeometry[]=[boar,cart];
 if(!p.seated&&p.warning>0)objects.push({id:'warning',frame:{origin:[0,0],angle:0,scale:1},anchors:{},regions:{text:warningLayout.area}});
 if(p.seated){objects.push(p.packet);if(p.foodVisible)objects.push({id:'held-caterpillar',frame:p.actor,anchors:{tip:p.foodTip,grip:p.food}});}
 const paths=[p.nearArm,p.farArm,...p.legs].map(limb=>({points:[limb.root,limb.joint,limb.end].map(v=>localPoint(v,p.actor)),color:0xd547a0}));
 if(p.seated){
  paths.push({points:Array.from({length:25},(_,i)=>{const a=boarPose(20+i*1.8/24);return localPoint(a.foodTip,a.actor);}),color:0x009cbd});
  const mouth=mouthAnchor(p.chew);paths.push({points:[localPoint(mouth,p.actor),localPoint(p.foodTip,p.actor)],color:0xec5423});
 }
 return {objects,paths};
}
export function diagnoseFrames(frames:readonly number[]):(GeometryCheck&{frame:number})[]{return frames.flatMap(frame=>{
 const p=boarPose(frame/24),checks:GeometryCheck[]=[];
 const geometry=geometryAt(frame/24),hand=geometry.objects[0],cart=geometry.objects[1];
 if(p.location==='shop'&&p.time>=8.85){
  checks.push(checkContact('cart/near-grip',{object:hand,anchor:'near'},{object:cart,anchor:'grip'},.01));
  checks.push(checkContact('cart/far-grip',{object:hand,anchor:'far'},{object:cart,anchor:'farGrip'},.01));
 }
 if(!p.seated){
  const previous=boarPose(Math.max(0,frame-1)/24);
  for(const [i,sample]of p.walking.samples.entries()){
   if(sample.planted){const target:ObjectGeometry={id:'shop-floor',frame:{origin:[0,0],angle:0,scale:1},anchors:{sole:sample.ground}};checks.push(checkContact(`support/foot-${i}-planted`,{object:hand,anchor:i===0?'soleA':'soleB'},{object:target,anchor:'sole'},.001));}
   else checks.push({relation:`support/foot-${i}-swing`,status:sample.position[1]<sample.ground[1]?'pass':'fail',message:`Airborne visible sole lift ${(sample.ground[1]-sample.position[1]).toFixed(3)}px.`});
   const before=previous.walking.samples[i];
   if(sample.planted&&before.planted&&sample.index===before.index){const a=localPoint(p.feet[i],p.actor),b=localPoint(previous.feet[i],previous.actor),slip=Math.hypot(a[0]-b[0],a[1]-b[1]);checks.push({relation:`support/foot-${i}-no-slip`,status:slip<.001?'pass':'fail',message:`Rendered sole movement during continuous plant: ${slip.toFixed(6)}px.`});}
  }
  for(const [i,sample]of p.walking.samples.entries())if(sample.planted&&sample.load>=.95){
   const limb=p.legs[i],a=[limb.joint[0]-limb.root[0],limb.joint[1]-limb.root[1]],b=[limb.end[0]-limb.joint[0],limb.end[1]-limb.joint[1]];
   const flexion=Math.acos(Math.max(-1,Math.min(1,(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b)))))*180/Math.PI;
   const moving=p.walking.nominalVelocity>1e-6,maximum=moving?70:55;
   checks.push({relation:`support/loaded-knee-${i}`,status:flexion<=maximum?'pass':'fail',message:`Authored shop ${moving?'travel':'held'} loaded stance: actual contour knee flexion ${flexion.toFixed(2)}°, max ${maximum}°; load ${sample.load.toFixed(3)}.`});
  }
  if(p.time>=9.45&&p.time<15.58){
   const previousX=previous.cart.origin[0],advance=p.cart.origin[0]-previousX;
   checks.push({relation:'cart/forward',status:advance>0||p.time===9.45?'pass':'fail',message:`Actual cart advance over one frame: ${advance.toFixed(4)}px; independent of foot swing.`});
   if(p.time>=9.75&&p.time<=15.29){const expected=p.walking.nominalVelocity/24;checks.push({relation:'cart/uniform-progress',status:Math.abs(advance-expected)<.001?'pass':'fail',message:`Cart per-frame advance ${advance.toFixed(6)}px, cruise expectation ${expected.toFixed(6)}px.`});}
  }
  const invalid=p.walking.samples.filter(s=>!s.planted&&s.load>1e-8).length;
  checks.push({relation:'support/weight',status:invalid===0&&p.walking.samples.some(s=>s.load>0)?'pass':'fail',message:'Actual foot loads are zero in swing; supportBalance has at least one loaded contact and drives the drawn actor frame.'});
  if(p.time>=15.9){const actorLeft=p.actor.origin[0]-125*p.actor.scale,cartLeft=p.cart.origin[0]-139*p.cart.scale;checks.push({relation:'shop/offscreen',status:Math.min(actorLeft,cartLeft)>1280?'pass':'fail',message:`Conservative visible left bounds: actor ${actorLeft.toFixed(2)}, cart ${cartLeft.toFixed(2)}px, screen right 1280px.`});}
 }
 if(p.location==='shop'&&p.warning>0){const warning=geometry.objects.find(o=>o.id==='warning')!,area=objectRegion(warning,'text'),head=objectRegion(hand,'head');checks.push(checkClearance('warning/head-clearance',[area[3],area[2]],[head[0],head[1]],12));}
 if(p.seated)checks.push(checkContact('snack/far-grip',{object:hand,anchor:'far'},{object:p.packet,anchor:'grip'},.01));
 for(let i=0;i<pile.length;i++){const obj=pileGeometry(p,i);checks.push(checkContainment(`load-${i}/insect-contained`,worldInsect(obj,pile[i].kind),objectRegion(obj,'insect')));}
 let closed=true;try{for(const limb of [p.nearArm,p.farArm,...p.legs])validateContour(limb.contour);}catch{closed=false;}
 checks.push({relation:'anatomy/closed-contours',status:closed?'pass':'fail',message:'Validate finite closed keyed cubic contours actually consumed by the four visible limbs.'});
 if(p.seated){
  checks.push(checkContainment('snack/insect-contained',insectPoints(4).map(v=>localPoint(v,p.packet.frame)),objectRegion(p.packet,'insect')));
  const handBoundary=contourPoints(handContour(p.nearHand)).map(v=>localPoint(v,p.actor)),label=objectRegion(p.packet,'label');
  const handLabelGap=Math.min(...segments(handBoundary).flatMap(a=>segments([...label,label[0]]).map(b=>segmentDistance(a,b))));
  const handInsideLabel=handBoundary.some(v=>insideConvex(v,label));
  checks.push({relation:'hand/packet-label-clearance',status:handLabelGap>=2&&!handInsideLabel?'pass':'fail',message:`Actual foreground hand contour to owned packet label: ${handLabelGap.toFixed(2)}px; 2px includes stroke allowance.`});
  const eye=Array.from({length:17},(_,i)=>{const v=quadraticPoint(happyEye.start,happyEye.control,happyEye.end,i/16);return [v[0],v[1]+seatedUpperOffset] as Point2;});
  const boundary=segments(contourPoints(p.nearArm.contour)),eyeSegments=segments(eye);
  const clearance=Math.min(...boundary.flatMap(a=>eyeSegments.map(b=>segmentDistance(a,b))));
  checks.push({relation:'face/arm-eye-clearance',status:clearance>=14?'pass':'fail',message:`Actual sampled arm contour to visible eye path: ${clearance.toFixed(2)} local px; minimum 14px.`});
  if(p.foodVisible&&((p.time>=20.45&&p.time<=20.5)||(p.time>=22.45&&p.time<=22.5))){const food=geometry.objects.find(o=>o.id==='held-caterpillar')!;checks.push(checkContact('food/packet-contact',{object:food,anchor:'tip'},{object:p.packet,anchor:'mouth'},.01));}
  if(p.bite&&p.foodVisible){const food=geometry.objects.find(o=>o.id==='held-caterpillar')!;checks.push(checkContact('food/mouth-contact',{object:food,anchor:'tip'},{object:hand,anchor:'mouth'},.01));}
 }
 return checks.map(check=>({...check,frame}));
});}
