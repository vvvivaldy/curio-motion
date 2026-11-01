import {handGeometry} from './hands';
import {quadraticPoint} from '../../core/contour';
import {mix,tween,sampleTravel} from '../../core/time';
import {sampleFootsteps,supportBalance} from '../../core/gait';
import {sampleHandling,balancePayload,type HandlingSchedule} from '../../core/handling';
import {solvePlanarLimb,fitPlanarPostureHeight,planarEndpoint} from '../../core/kinematics';
import {rigidLimbShape,limbShape} from '../../core/limb';
import {objectAnchor,type ObjectGeometry} from '../../core/relations';
import type {Point2} from '../../core/spatial';
import type {Step2D} from '../../core/contacts';
export const handling:HandlingSchedule={grip:[4.6,4.9],load:[5,5.18],lift:[5.25,6.65],place:[11.9,12.55],unload:[12.58,13.05],release:[13.1,13.3]};
export const floor=612;
export interface CarrierDesign {readonly heightScale:number;readonly boxScale:number;readonly tableHeight:number}
export const defaultDesign:CarrierDesign={heightScale:1,boxScale:1,tableHeight:152};
const pair=(a:Point2,b:Point2,u:number):Point2=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
const offset=(a:Point2,x:number,y:number):Point2=>[a[0]+x,a[1]+y];
const step=(start:number,end:number,from:Point2,to:Point2,lift:number):Step2D=>({start,end,from,to,lift});
/** Example-specific proportions/staging; all variants use the same contact and posture mechanisms. */
export function createCarrierModel(input:CarrierDesign=defaultDesign){
 const design=Object.freeze({...input}),s=design.heightScale,b=design.boxScale;
 if(![s,b,design.tableHeight].every(Number.isFinite)||s<=0||b<=0||design.tableHeight<=0||design.tableHeight>=floor)throw new RangeError('Positive carrier dimensions and a table above the floor required');
 const tableTop=floor-design.tableHeight,boxShape={width:104*b,height:92*b,depth:[-24*b,-18*b] as Point2};
 const bench={top:tableTop,topPolygon:[[840,tableTop],[1104,tableTop],[1074,tableTop-22],[810,tableTop-22]] as Point2[],frontPolygon:[[840,tableTop],[1104,tableTop],[1104,tableTop+16],[840,tableTop+16]] as Point2[],legs:[[826,tableTop-6],[1060,tableTop-6],[854,tableTop+16],[1088,tableTop+16]].map(([x,y])=>({x,y,width:11,height:floor-y}))};

 // Authored placement reserve (.35rad); actual limb limits remain .04..2.35.
 const lastSupport=758+(1-s)*100-19*s+8;
 const fullPlaceBody=balancePayload(lastSupport,886+40*b,.22);
 const reserveR2=((88*s)**2+(90*s)**2+2*88*90*s*s*Math.cos(.35));
 const reserveHeights=[0,1].map(i=>{
   const rootX=fullPlaceBody+(i===0?11.4:-9.6)*s;
   const wristX=886-(i===0?0:24*b)-8*s;
   const wristY=floor-design.tableHeight-(i===0?76:106)*b+6*s;
   const rootOffsetY=-Math.sqrt((103*s)**2-(8*s)**2)+(i===0?2:-8)*s;
   const verticalReach2=reserveR2-(wristX-rootX)**2;
   if(verticalReach2<0)throw new RangeError('Carrier placement needs horizontal staging before vertical preparation');
   return wristY-rootOffsetY-Math.sqrt(verticalReach2);
 });
 const placementLower=Math.max(0,...reserveHeights.map(y=>y-(floor-192*s)));
 const smallLoad=Math.min(1,Math.max(0,(1-b)/.2));
 const pickupAdvance=45*s-Math.max(0,100*(s-1))*(1-smallLoad),carryDistance=338-pickupAdvance;
 const highBench=design.tableHeight+22>181*s;
 let releaseAngles:Point2[]=[],releaseRetreat=0;
 const nearStart=252,nearStop=420+pickupAdvance+(1-s)*100,stanceOffset=-38*s,farPlaneY=-10*s;
 const tracks:[Step2D[],Step2D[]]=[[],[]];
 for(let side=0;side<2;side++){
   const depth=side===0?0:stanceOffset,y=floor+(side?farPlaneY:0),phase=1-side;
   tracks[side].push(step(.55+phase*.56,1.05+phase*.56,[nearStart+depth,y],[340+pickupAdvance/2+depth,y],18*s));
   tracks[side].push(step(1.67+phase*.56,2.17+phase*.56,[340+pickupAdvance/2+depth,y],[nearStop+depth,y],18*s));
   const carrySteps=Math.ceil(carryDistance/(80*s));
   for(let i=0;i<carrySteps;i++){
     const previous=tracks[side].at(-1)!.to;
     tracks[side].push(step(7.08+(i+phase*.5)*4.4/carrySteps,7.08+(i+phase*.5)*4.4/carrySteps+1.8/carrySteps,[...previous],[nearStop+depth+carryDistance*(i+1)/carrySteps,y],13*s));
   }
 }
 const pickupX=568+40*(b-1);
 const carryBottom=Math.min(floor-172*s,tableTop-20*s);
 function boxGeometry(time:number):ObjectGeometry{
   const h=sampleHandling(time,handling),travel=sampleTravel(time,{start:7,end:11.6,ramp:.3}).progress;
   return {id:'box',frame:{origin:[pickupX+(548+pickupAdvance-pickupX)*h.lifted+carryDistance*travel-55*s*h.lifted*(1-h.placed),floor+(carryBottom-floor)*h.lifted+(tableTop-carryBottom)*h.placed],angle:0,scale:1},
     anchors:{nearGrip:[0,-76*b],farGrip:[-24*b,-106*b],base:[40*b,0],centre:[40*b,-50*b]},
     regions:{front:{x:0,y:-92*b,width:104*b,height:92*b}}};
 }
 function pose(time:number){
   const h=sampleHandling(time,handling),box=boxGeometry(time);
   const feet=tracks.map(track=>sampleFootsteps(time,track,.04));
   const balance=supportBalance(feet),approach=sampleTravel(time,{start:.4,end:2.8,ramp:.25}).progress;
   const travel=sampleTravel(time,{start:7,end:11.6,ramp:.3}).progress;
   const nominal=nearStart+stanceOffset/2+(nearStop-nearStart)*approach+carryDistance*travel;
   const supportX=nominal+.025*(balance.center[0]-nominal)+20*h.lifted*(1-tween(time,handling.release[1],14.85))-12*h.placed-releaseRetreat*tween(time,handling.unload[0],handling.release[1]);
   // Lower the body before the final reach to a low grip. Both paths use finite travel.
   const preparedCrouch=mix(tween(time,3,4.2),sampleTravel(time,{start:2.8,end:3.6,ramp:.15}).progress,smallLoad);
   const crouch=preparedCrouch*(1-h.lifted),hinge=smallLoad*preparedCrouch*(1-tween(h.lifted,0,1));
   const centre=objectAnchor({object:box,anchor:'centre'}),massRatio=.22*h.handLoad*h.lifted;
   // The actual payload lever drives the carrying counterpose; placement deliberately
   // returns toward the established reaching pose as the box extends onto the bench.
   const compact=h.lifted*(1-h.placed),moment=massRatio*(centre[0]-supportX);
   const lean=mix(15,62,crouch)*s+20*s*hinge-mix(7*s*h.handLoad*h.lifted,.85*moment,compact);
   // Do not lurch toward the bench as it takes the load: keep a small authored
   // counterpose until the hands have withdrawn. Actual payload ratio stays separate.
   const counterpose=.09*h.lifted*(1-h.handLoad)*(1-tween(time,14.2,14.85));
   const bodyCentre=balancePayload(supportX,centre[0],massRatio)-counterpose*(centre[0]-supportX);
   const hips:Point2=[bodyCentre-.55*lean-1.2*s-(8-.55*20)*s*hinge,floor-192*s+(60*s+54*(1-b))*crouch-34*s*hinge+placementLower*tween(time,11.6,12.0)*(1-tween(time,13.3,14.85))];
   const legRoots=()=>feet.map((_,i)=>offset(hips,7*s,i===0?0:farPlaneY));
   // The far leg is translated in the same projection as its foot, not shortened.
   const legLengths=[92*s,94*s] as const;
   const reach=mix(tween(time,3,4.4+.2*Math.min(1,Math.max(0,(s-b)/.12))),sampleTravel(time,{start:3.6,end:4.6,ramp:.15}).progress,smallLoad);
   const withdrawEnd=highBench?14.1:14;
   const withdraw=highBench?sampleTravel(time,{start:handling.release[1],end:withdrawEnd,ramp:.15}).progress:tween(time,handling.release[1],withdrawEnd);
   const lowerHands=highBench?sampleTravel(time,{start:withdrawEnd,end:14.85,ramp:.15}).progress:tween(time,withdrawEnd,14.85);
   const restVector=planarEndpoint([0,0],88*s,90*s,Math.PI/2-.13,.14,1);
   const walking=tween(time,.05,.85);
   // Opposite arm accompanies the actual advancing leg, then yields to the reach.
   // No independent oscillator or movement after the feet have stopped.
   const prepared=(i:number)=>{
     const lead=Math.max(-1,Math.min(1,(feet[i].position[0]-feet[1-i].position[0])/(68*s)));
     const armSwing=planarEndpoint([0,0],88*s,90*s,Math.PI/2+.5+.18*lead,i===0?1.08:1,1);
     const swinging=quadraticPoint(restVector,[restVector[0]+20*s,restVector[1]-45*s],armSwing,walking);
     return pair(pair(restVector,swinging,1-tween(time,1.5,2.8)),[140*s,10*s+(i?106:76)*Math.max(0,s-b)],tween(time,1.75,3.45));
   };
   // First clear the bench at a safe body-relative point, then lower beside the thigh.
   // Each phase has zero endpoint velocity; the exact affine form is also used by IK.
   const safeVector:Point2=[65*s,90*s];
   // This segment moves the whole palm left of the table corner before lowering.
   // Its endpoint radius grows inside the same allowed IK annulus; bones never stretch.
   const lowered=pair(safeVector,restVector,lowerHands);
   const contactWeight=time<=handling.release[1]?reach:highBench?0:1-withdraw;
   // Free arms may fold around a high bench; the final IK solve still enforces its limits.
   const folded:Point2=[2.05,2.2];
   const freeAngles=(i:number)=>pair(quadraticPoint(releaseAngles[i],[1,2.35],folded,withdraw),[Math.PI/2-.13,.14],lowerHands);
   const freeOffset=(i:number):Point2=>time<=handling.release[1]?prepared(i).map(v=>v*(1-reach)) as Point2:
     highBench?planarEndpoint([0,0],88*s,90*s,...freeAngles(i),1):lowered.map(v=>v*withdraw) as Point2;
   // Rotate the far palm around its real contact; wrist and IK follow the same geometry.
   const handRotation=(i:number)=>i===1?-smallLoad*Math.PI/3*reach*(1-h.lifted):0;
   const handTarget=(i:number)=>{
    const target=objectAnchor({object:box,anchor:i===0?'nearGrip':'farGrip'});
    const contactOffset=handGeometry([0,0],h.grip,s,handRotation(i)).contact;
    return offset(target,-contactOffset[0],-contactOffset[1]);
   };
   const posture:{root:Point2;target:Point2;upper:number;lower:number;minFlexion:number;maxFlexion:number;rootSide?:'above'|'either'}[]=feet.map((f,i)=>({root:legRoots()[i],target:offset(f.position,0,-7*s),upper:legLengths[0],lower:legLengths[1],minFlexion:.08,maxFlexion:2.01}));
   // Exact affine hand path: wrist-root = a*(target-root)+freeOffset.
   // Dividing by a converts its reachable-radius bands to the shared height fit.
   // This also prepares a reachable crouch continuously BEFORE grip closes.
   if(contactWeight>1e-5)for(const i of [0,1]){
     const target=handTarget(i),free=freeOffset(i);
     posture.push({root:offset(hips,lean+(i===0?9:-12)*s,-Math.sqrt((103*s)**2-lean**2)+(i===0?2:-8)*s),target:offset(target,free[0]/contactWeight,free[1]/contactWeight),upper:88*s/contactWeight,lower:90*s/contactWeight,minFlexion:.04,maxFlexion:2.35,rootSide:'either'});
   }
   try{hips[1]+=fitPlanarPostureHeight(posture);}catch(e){throw new RangeError(`${(e as Error).message} t=${time}: ${JSON.stringify(posture)}`);}
   const shoulders:Point2=[hips[0]+lean,hips[1]-Math.sqrt((103*s)**2-lean**2)],head=offset(shoulders,(6+18*crouch)*s,-65*s);
   const legs=feet.map((f,i)=>{
     const root=legRoots()[i],end=offset(f.position,0,-7*s),[upper,lower]=legLengths;
     const solved=solvePlanarLimb(root,end,upper,lower,{bendSide:-1,endAngle:Math.PI/2,wristRange:[-Math.PI,Math.PI],minFlexion:.08,maxFlexion:2.01});
     return {...rigidLimbShape(root,solved.joint,end,14*s),foot:f,flexion:solved.flexion};
   });
   const arms=feet.map((_,i)=>{
     const root=offset(shoulders,(i===0?9:-12)*s,(i===0?2:-8)*s);
     const target=handTarget(i),free=freeOffset(i);
     const wrist=offset(pair(root,target,contactWeight),free[0],free[1]);
     let solved;try{solved=solvePlanarLimb(root,wrist,88*s,90*s,{bendSide:1,endAngle:Math.PI/2+handRotation(i),wristRange:[-Math.PI,Math.PI],minFlexion:.04,maxFlexion:2.35});}catch(e){throw new RangeError(`Arm ${i} at ${time.toFixed(3)}: ${(e as Error).message} root=${root} wrist=${wrist}`);}
     const hand=handGeometry(wrist,h.grip,s,handRotation(i));
     return {...rigidLimbShape(root,solved.joint,wrist,12*s),wrist,hand,contact:hand.contact,flexion:solved.flexion};
   });
   // Drawing and payload-clearance diagnostics consume these exact same surfaces.
   const body=limbShape(shoulders,[(hips[0]+shoulders[0])/2-3*s,(hips[1]+shoulders[1])/2],hips,[28*s,21*s,24*s],{jointSmoothing:1});
   const face=(points:Point2[])=>points.map(([x,y])=>offset(box.frame.origin,x*b,y*b));
   const boxFaces={top:face([[-24,-110],[80,-110],[104,-92],[0,-92]]),side:face([[-24,-110],[0,-92],[0,0],[-24,-18]]),front:face([[0,-92],[104,-92],[104,0],[0,0]])};
   const drawnBodyCentre=.45*hips[0]+.35*shoulders[0]+.2*head[0];
   return {time,h,box,feet,hips,shoulders,head,legs,arms,crouch,reach,massRatio,supportX,design,boxShape,tableTop,bench,
     body,boxFaces,combinedCentre:(drawnBodyCentre+massRatio*centre[0])/(1+massRatio),effort:h.handLoad*(1-tween(time,13.05,14.2))};
 }
 // Derive controls once from real release geometry; pose(time) never accumulates state.
 if(highBench){
  const reference=pose(handling.release[1]),root=reference.arms[0].root;
  const [cornerX,cornerY]=bench.topPolygon[3],dy=cornerY-root[1],radius=(88+6+6)*s;
  if(Math.abs(dy)<radius)releaseRetreat=Math.max(0,(root[0]-(cornerX-Math.sqrt(radius**2-dy**2)))/1.09);
 }
 releaseAngles=highBench?pose(handling.release[1]).arms.map(a=>[Math.atan2(a.joint[1]-a.root[1],a.joint[0]-a.root[0]),a.flexion] as Point2):[];
 return {design,pose,boxGeometry,tracks,boxShape,tableTop,bench};
}
const model=createCarrierModel();
export const carrierPose=model.pose,boxGeometry=model.boxGeometry,boxShape=model.boxShape,tableTop=model.tableTop;
export type CarrierPose=ReturnType<typeof carrierPose>;
