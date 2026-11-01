import {inspectFootPasses} from '../../core/gait';
import {carrierVariants} from './variants';
import {carrierTiming,ivoryCarrierSettings} from './settings';
import {createCarrierModel,defaultDesign,handling,type CarrierPose,type CarrierDesign} from './motion';
import {checkContact,checkClearance,objectAnchor,insideConvex,rectCorners,segmentDistance,type ObjectGeometry} from '../../core/relations';
import {validateContour,cubicPoint} from '../../core/contour';
const pointObject=(id:string,p:[number,number]):ObjectGeometry=>({id,frame:{origin:p,angle:0,scale:1},anchors:{touch:[0,0]}});
/** Inspect the exact rendered pose; shared by integer captures and dense time audits. */
export function inspectCarrierPose(p:CarrierPose,frame:number,passes:ReturnType<typeof inspectFootPasses>){
 const s=p.design.heightScale,results:{relation:string;frame:number;status:'pass'|'fail';message:string}[]=[];
  const add=(relation:string,pass:boolean,message:string)=>results.push({relation,frame,status:pass?'pass':'fail',message});
  for(const i of [0,1]){
   const a=pointObject(`hand-${i}`,p.arms[i].hand.contact);
   const contact=checkContact(`grip-${i}`,{object:a,anchor:'touch'},{object:p.box,anchor:i===0?'nearGrip':'farGrip'},.001);
   add(`grip-${i}`,p.time<handling.grip[0]||p.time>handling.release[1]||contact.status==='pass',p.time>=handling.grip[0]&&p.time<=handling.release[1]?contact.message:'Rest/reaching/released hand is not claimed to grip');
  }
  const bottom=objectAnchor({object:p.box,anchor:'base'})[1],bx=p.box.frame.origin[0];
  add('handoff-order',!(p.h.handLoad>0&&p.h.grip<1-1e-9)&&!(p.time>=handling.release[0]&&Math.abs(bottom-p.tableTop)>.001),'Grip complete before load; actual box base on drawn bench before release');
  const overlapsBench=bx+p.boxShape.width>Math.min(...p.bench.topPolygon.map(v=>v[0]))&&bx+p.boxShape.depth[0]<Math.max(...p.bench.topPolygon.map(v=>v[0]));
  add('surface',bottom<=612+.001&&(!overlapsBench||bottom<=p.tableTop+.001),'Actual box base above floor and bench while horizontally overlapping');
  add('rest-support',p.time<handling.place[1]||Math.abs(bottom-p.tableTop)<.001,'Actual box base stays on actual bench plane after landing');
  add('projected-balance',Math.abs(p.combinedCentre-p.supportX)<20,`Authored projected body/payload centre offset ${(p.combinedCentre-p.supportX).toFixed(2)}px; 20px staging tolerance, not dynamics`);
  let continuous=true;try{for(const l of [...p.arms,...p.legs])validateContour(l.contour);for(const a of p.arms)validateContour(a.hand.contour);}catch{continuous=false;}
  add('continuous-contours',continuous,'Actual rendered limb and mitten contours finite and closed; appearance requires inspection');
  const deep=(p.crouch>=.5||p.time>=handling.grip[0]&&p.time<=handling.lift[1])&&p.h.lifted<.8;
  const kneeGaps=p.arms.flatMap(a=>p.legs.map(l=>checkClearance('knee',a.lower,[l.joint,l.joint],16*s)));
  add('knee-clearance',!deep||kneeGaps.every(c=>c.status==='pass'),deep?`Forearm/knee centreline gap >= radii13+visible gap3, scaled: ${kneeGaps.map(c=>c.message).join('; ')}`:'Deep pickup clearance not claimed in this phase');
  const shin=checkClearance('forearm-shin',p.arms[0].lower,p.legs[0].lower,16*s);
  add('forearm-shin-clearance',!deep||shin.status==='pass',deep?'Foreground forearm and actual near shin remain separate; same radii13+visible gap3: '+shin.message:'Loaded pickup/lift shin check not active in this phase; free thigh/depth overlap is not forbidden');
  const benchPolygons=[p.bench.topPolygon,p.bench.frontPolygon,...p.bench.legs.map(rectCorners)];
  const handPoints=p.arms.flatMap(a=>a.hand.contour.curves.flatMap((c,i,cs)=>Array.from({length:12},(_,j)=>cubicPoint(i?a.hand.contour.curves[i-1].to:a.hand.contour.start,c,j/12))));
  const handClear=handPoints.every(v=>benchPolygons.every(poly=>!insideConvex(v,poly)));
  const armClear=p.arms.every(a=>benchPolygons.every(poly=>!insideConvex(a.joint,poly)&&!insideConvex(a.end,poly)&&poly.every((v,i)=>segmentDistance(a.lower,[v,poly[(i+1)%poly.length]])>6*s)));
  add('release-clearance',p.time<handling.release[0]||handClear&&armClear,'Sampled actual mitten contour and actual forearm radius clear drawn tabletop/front/legs after release begins');
  const solids=[p.body,...p.legs].map(l=>l.contour.curves.flatMap((c,i,cs)=>Array.from({length:12},(_,j)=>cubicPoint(i?cs[i-1].to:l.contour.start,c,j/12))));
  const payloadClear=Object.values(p.boxFaces).every(face=>solids.every(poly=>poly.every((v,i)=>!insideConvex(v,face)&&face.every((w,j)=>segmentDistance([v,poly[(i+1)%poly.length]],[w,face[(j+1)%face.length]])>2*s))));
  add('payload-clearance',payloadClear,'Actual rendered torso/leg contours sampled12points per cubic and same drawn carton faces: no interior/edge crossing,2px contour reserve; not continuous collision proof');
  const loadedSupport=p.feet.reduce((sum,f)=>sum+f.load,0)>0&&p.feet.every(f=>(f.planted||f.load===0)&&(!f.planted||f.position.every((v,i)=>v===f.ground[i])));
  const nearHand=p.arms[0].hand.contour;
  const nearPalm=nearHand.curves.flatMap((c,i,cs)=>Array.from({length:12},(_,j)=>cubicPoint(i?cs[i-1].to:nearHand.start,c,j/12)));
  add('free-hand-knee',p.time>=3||nearPalm.every(v=>Math.hypot(v[0]-p.legs[0].joint[0],v[1]-p.legs[0].joint[1])>=10*s),'Approach: actual near-palm contour clears actual near knee radius7+visible gap3; deliberate depth overlap of far arm not forbidden');
  const activePasses=passes.filter(step=>p.time>=step.start&&p.time<=step.end);
  add('foot-passing',activePasses.every(step=>step.passed),activePasses.length?activePasses.map(step=>`foot${step.foot}: projected start ${step.behind.toFixed(2)}px, landing ${step.ahead.toFixed(2)}px relative to fixed opposite support`).join('; '):'No active swing at this held contact');
  add('foot-support',loadedSupport,'A loaded grounded support remains; airborne feet carry no load and planted positions equal world-fixed contacts. Does not impose static COM on dynamic walking');
  const limits=p.arms.every(a=>a.flexion>=.04-1e-7&&a.flexion<=2.35+1e-7)&&p.legs.every(l=>l.flexion>=.08-1e-7&&l.flexion<=2.01+1e-7);
  add('joint-limits',limits,'Same non-clamped IK limits on rendered joints for every design');
  return results;
}
/** Capture frames keep the integer composition contract. */
export function diagnoseCarrierFrames(frames:readonly number[],design:CarrierDesign=defaultDesign){
 const model=createCarrierModel(design),passes=inspectFootPasses(model.tracks,[1,0],.04);
 return frames.flatMap(frame=>{
  if(!Number.isSafeInteger(frame)||frame<0||frame>=ivoryCarrierSettings.durationInFrames)throw new RangeError('Carrier diagnostic frame outside composition');
  return inspectCarrierPose(model.pose(carrierTiming.actionTime(frame/ivoryCarrierSettings.fps)),frame,passes);
 });
}
export function diagnoseFrames(frames:readonly number[]){return diagnoseCarrierFrames(frames);}
/** Deferred parameter package: explicit separate diagnostic, never silently approved. */
export function diagnoseVariantFrames(frames:readonly number[]){
 const matrix=carrierVariants.flatMap(v=>diagnoseCarrierFrames(frames,v.design).map(r=>({...r,example:v.key})));
 return frames.map(frame=>{
   const failures=matrix.filter(r=>r.frame===frame&&r.status!=='pass');
   return {relation:'parameter-matrix',frame,status:failures.length?'fail' as const:'pass' as const,message:failures.length?failures.map(r=>`${r.example}/${r.relation}: ${r.message}`).join('; '):'Existing eight designs satisfy declared geometry at this frame; appearance still requires their actual controls'};
 });
}
export function geometryAt(time:number){const p=createCarrierModel().pose(carrierTiming.actionTime(time));return {objects:[p.box],paths:[...p.arms,...p.legs].map(l=>({points:[l.root,l.joint,l.end]}))};}
