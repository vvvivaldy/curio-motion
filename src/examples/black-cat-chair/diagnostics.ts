import {catPose,catDimensions,foreLimits} from './motion';
import {blackCatChairSettings} from './settings';
import {floorY,chair} from './layout';
import {insideConvex} from '../../core/relations';
import {cubicPoint,validateContour} from '../../core/contour';
export function diagnoseFrames(frames:readonly number[]){return frames.flatMap(frame=>{
 if(!Number.isSafeInteger(frame)||frame<0||frame>=blackCatChairSettings.durationInFrames)throw new RangeError('Cat control frame outside composition');
 const p=catPose(frame/24),rows:{relation:string;frame:number;status:'pass'|'fail';message:string}[]=[];
 const add=(relation:string,pass:boolean,message:string)=>rows.push({relation,frame,status:pass?'pass':'fail',message});
 const distance=(a:number[],b:number[])=>Math.hypot(a[0]-b[0],a[1]-b[1]);
 const limbs=[...p.arms.map(a=>({...a,lengths:catDimensions.fore})),...p.legs.map(a=>({...a,lengths:catDimensions.hind}))];
 add('rigid-limbs',limbs.every(l=>{const q=l.spatial??l,d=(a:readonly number[],b:readonly number[])=>Math.hypot(...a.map((v,i)=>v-b[i]));return Math.abs(d(q.root,q.joint)-l.lengths[0])<1e-7&&Math.abs(d(q.joint,q.end)-l.lengths[1])<1e-7;}),'Same34/32 fore and36/34 hind; during spatial yaw check actual3D bones, whose exact rendered projections foreshorten. Other phases measure actual2D roots/joints/ends');
 add('joint-ranges',p.arms.every(a=>(['shoulder','elbow','wrist'] as const).every(j=>a.angles[j]>=foreLimits[`${j}Range`][0]-1e-9&&a.angles[j]<=foreLimits[`${j}Range`][1]+1e-9)),'Same fixed branch and non-clamped forelimb ranges in both control drawings');
 const supports=p.legs.every((l,i)=>{
  if(l.support==='floor')return Math.abs(l.sole[1]-(floorY-8*i))<1e-7;
  if(l.support==='seat'){
   const k=l.foot.curves.findIndex(c=>c.key==='sole'),c=l.foot.curves[k],from=k?l.foot.curves[k-1].to:l.foot.start;
   return Array.from({length:17},(_,j)=>cubicPoint(from,c,j/16)).every(q=>insideConvex(q,chair.seat));
  }
  return l.sole[1]<=floorY-8*i+1e-7;
 })&&p.arms.every((a,i)=>a.support==='seat'?(distance(a.pad,a.target)<1e-7&&insideConvex(a.pad,chair.seat)):a.support==='floor'?(distance(a.groundContact,a.target)<1e-7&&Math.abs(a.groundContact[1]-(floorY-8*i))<1e-7):true)&&(!p.pelvisSupport||(distance(p.pelvis,p.pelvisSupport)<1e-7&&insideConvex(p.pelvis,chair.seat)));
 add('actual-supports',supports,'Declared floor soles or whole seat sole curves, actual planted paw pads, and sitting pelvis contour point meet the rendered chair polygon; free hindfeet do not penetrate floor (zero clearance is allowed at lift/touch boundaries, not a mandatory8px MODEL hang gap). Projected support membership is not a collision/force proof.');
 const sample=(c:typeof p.body)=>c.curves.flatMap((q,i)=>Array.from({length:65},(_,j)=>cubicPoint(i?c.curves[i-1].to:c.start,q,j/64)));
 add('floor-contour-clearance',p.arms.every((a,i)=>a.support!=='floor'||sample(a.paw).every(q=>q[1]<=floorY-8*i+1e-7))&&p.legs.every((l,i)=>l.support!=='floor'||sample(l.foot).every(q=>q[1]<=floorY-8*i+1e-7)),'Sampled actual planted paw/foot contours stay above their floor, using separate true lowest claw contact. Not a complete depth/collision proof.');
 const standing=catPose(0),points=standing.head.curves.flatMap((c,i)=>Array.from({length:65},(_,j)=>cubicPoint(i?standing.head.curves[i-1].to:standing.head.start,c,j/64))),height=floorY-Math.min(...points.map(p=>p[1])),ratio=(floorY-chair.topY)/height;
 add('chair-scale',ratio>=1.1&&ratio<=1.25,`Drawn ear-inclusive standing height${height.toFixed(3)}; chair${floorY-chair.topY}; ratio${ratio.toFixed(4)}. Reach is measured separately from shoulders.`);
 let valid=true;try{for(const c of [p.head,p.body,...p.arms.flatMap(a=>[a.shape.contour,a.paw]),...p.legs.flatMap(l=>[l.contour,l.foot])])validateContour(c);}catch{valid=false;}
 add('whole-contours',valid,'Closed actual cat head/body/limb/paw/foot contours; appearance remains independently reviewed');
 const supportsCount=p.legs.filter(l=>l.planted).length+p.arms.filter(a=>a.planted).length+(p.pelvisSupport?1:0),air=p.control==='hop-flight'||p.control==='jump-down-flight';
 const authoredPhases=['walk','measure-chair','hop-push','hop-flight','grip-catch','first-hind-transition','second-hind-transition','climb-forward','seat-rise','sit-down','prepare-jump-down','jump-down-flight','landing-compression','landing-settle','four-paw-hold','weight-back-release','free-rise','final-stand','fixed-grip-pull','seated-hold','restore-seat-feet','rise-before-turn','supported-left-turn','left-jump-push'];
 const logicalSupports=air?supportsCount===0:p.control==='four-paw-hold'?supportsCount===4:p.control==='final-stand'||p.control==='seat-rise'?p.legs.every(l=>l.planted)&&p.arms.every(a=>!a.planted):supportsCount>=1;
 add('implemented-control',authoredPhases.includes(p.control)&&logicalSupports,`Authored phase ${p.control}: ${supportsCount} declared supports. Flights have0, four-paw hold4, standing/rising seat or final2 hind with hands free. Runtime rejects missing phases instead of falling back to held MODEL poses; visual meaning remains separately reviewed.`);
 return rows;
});}
