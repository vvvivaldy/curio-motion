import {solveLimbContact} from '../../core/constraints';
import {sampleFootsteps,inspectFootPasses} from '../../core/gait';
import {sampleTravel} from '../../core/time';
import type {Step2D} from '../../core/contacts';
import {cubicPoint} from '../../core/contour';
import {solvePlanarLimb,planarEndpoint,solveTwoBone} from '../../core/kinematics';
import {limbShape} from '../../core/limb';
import {attachAnchor,localPoint,project,unproject,type Vec3,type Point2} from '../../core/spatial';
import {contourAnchor,mapContour} from '../../core/contour';
import {contourView} from '../../core/views';
import {headContour,leftHeadContour,pawContour,footContour,pawPad,pawFloorContact,pawFloorT,soleAnchor,neckAnchor,placeContour,torsoContour} from './design';
export const catDimensions={torso:44,fore:[34,32],hind:[36,34]} as const;
export const foreLimits={bendSide:1 as const,shoulderRange:[-2.1,2.95] as const,elbowRange:[.2,2.4] as const,wristRange:[-1.65,1.65] as const};
const add=(p:Point2,x:number,y:number):Point2=>[p[0]+x,p[1]+y];
type Support='floor'|'seat'|null;
interface HeldControl {frame:number;id:string;hips:Point2;lean:number;headAngle?:number;feet:[Point2,Point2];legSupports:[Support,Support];hands?:[Point2,Point2];handAngles?:[number,number];handSupports?:[Support,Support];gaze?:Point2;pelvisSupport?:Point2;foreAnchor?:'floor';footAngles?:[number,number];facing?:number;turn?:number;footTurns?:[number,number];armOffsets?:[Point2,Point2];}
/** Example-authored drawings, not a universal animal rig or a finished motion schedule. */
export const heldControls:readonly HeldControl[]=[
 {frame:0,id:'floor-stand',hips:[638,529],lean:4,feet:[[646,600],[624,592]],legSupports:['floor','floor']},
 {frame:24,id:'walk-start',hips:[360,529],lean:4,feet:[[368,600],[346,592]],legSupports:['floor','floor']},
 {frame:48,id:'walk-pass-near',hips:[480,529],lean:4,feet:[[496,584],[468,592]],legSupports:[null,'floor']},
 {frame:72,id:'walk-pass-far',hips:[552,529],lean:4,feet:[[568,600],[588,574]],legSupports:['floor',null]},
 {frame:96,id:'jump-prepare',hips:[638,548],lean:14,headAngle:.02,feet:[[646,600],[624,592]],legSupports:['floor','floor'],hands:[[712,515],[679,523]],handAngles:[0,0],gaze:[4,-5]},
 {"frame":128,"id":"hop-flight","hips":[651.1999999999999,509.31111111111113],"lean":8,"headAngle":-0.15,"feet":[[660.1999999999999,574.3111111111111],[637.1999999999999,566.3111111111111]],"legSupports":[null,null],"hands":[[725.1999999999999,475.31111111111113],[693.1999999999999,467.31111111111113]],"handAngles":[0,0],"gaze":[4,-4]},
 {frame:137,id:'seat-grip',hips:[704,500],lean:7,headAngle:-.35,feet:[[685,562],[664,554]],legSupports:[null,null],hands:[[796,454],[764,454]],handAngles:[0,0],handSupports:['seat','seat'],gaze:[3,-5]},
 {frame:162,id:'first-hind-on-seat',hips:[750,466],lean:-20,headAngle:-.2,feet:[[795,436],[719,521]],legSupports:['seat',null],hands:[[796,454],[764,454]],handAngles:[0,0],handSupports:['seat','seat'],gaze:[3,-5]},
 {frame:174,id:'second-hind-on-seat',hips:[770,439],lean:-12,headAngle:-.12,feet:[[814,450],[795,436]],legSupports:['seat','seat'],hands:[[826,436],[775,454]],handAngles:[0,0],handSupports:['seat','seat'],gaze:[3,-4]},
 {frame:192,id:'seat-crouch',hips:[810,418],lean:20,headAngle:0,feet:[[835,451],[814,443]],legSupports:['seat','seat'],hands:[[858,450],[790,421]],handAngles:[0,1.5],handSupports:['seat',null],gaze:[2,-3]},
 {frame:216,id:'seat-stand',hips:[830,380],lean:4,feet:[[838,451],[816,443]],legSupports:['seat','seat']},
 {frame:252,id:'pelvis-sit',hips:[842,435.375],lean:-6,headAngle:.04,feet:[[887,454],[869,446]],legSupports:['seat','seat'],hands:[[868,421],[817,427]],handAngles:[1.05,1.3],pelvisSupport:[841.875,446],gaze:[2,-3]},
 {"frame":287,"id":"jump-down-prepare","hips":[777.9298731220256,403],"lean":-14,"headAngle":0.12,"feet":[[785.9298731220256,454],[771.9298731220256,446]],"legSupports":["seat","seat"],"hands":[[827.9298731220256,393],[737.9298731220256,395]],"handAngles":[0,1.5],"gaze":[-3,-3]},
 {"frame":315,"id":"jump-down-flight","hips":[716.078431372549,385.4722222222223],"lean":27,"headAngle":0.12,"feet":[[714.078431372549,447.4722222222223],[692.078431372549,439.4722222222223]],"legSupports":[null,null],"hands":[[784.078431372549,394.4722222222223],[696.078431372549,397.4722222222223]],"handAngles":[1.05,1.5],"gaze":[-3,1]},
 {"frame":325,"id":"first-rear-touch","hips":[620,532],"lean":43,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[715,588],[692,580]],"handAngles":[0,0],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":326,"id":"first-fore-touch","hips":[612.0405613225682,551.3300653594772],"lean":43,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[715,600],[692,592]],"handAngles":[0,0],"handSupports":["floor","floor"],"foreAnchor":"floor"},
 {"frame":328,"id":"maximum-compression","hips":[606,566],"lean":43,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[715,600],[692,592]],"handAngles":[0,0],"handSupports":["floor","floor"],"foreAnchor":"floor"},
 {"frame":338,"id":"four-paw-hold","hips":[610,552],"lean":43,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[715,600],[692,592]],"handAngles":[0,0],"handSupports":["floor","floor"],"foreAnchor":"floor"},
 {"frame":362,"id":"weight-back-release","hips":[602,560],"lean":43,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[715,600],[692,592]],"handAngles":[0,0],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":366,"id":"hands-free-tucked","hips":[602,560],"lean":43,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[731.7431764205401,549.9475193250007],[690.0242312903865,527.9331082914316]],"handAngles":[-0.6,-0.9999999999999999],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":375,"id":"back-lean-standing","hips":[614,529],"lean":-16,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[684.7431764205401,487.2870953142511],[643.0242312903865,465.2726842806819]],"handAngles":[-0.6,-0.9999999999999999],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":377,"id":"far-arm-dangerous-neighbor","hips":[614,529],"lean":-16,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[684.7431764205401,487.2870953142511],[634.8310678441661,493.63682142083593]],"handAngles":[-0.6,-1],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":379,"id":"far-upper-returned","hips":[614,529],"lean":-16,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[684.7431764205401,487.2870953142511],[594.3962754563099,504.472192772573]],"handAngles":[-0.6,-1],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":383,"id":"far-hand-clears-hip","hips":[614,529],"lean":-16,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[684.7431764205401,487.2870953142511],[553.637413532948,541.6108297350121]],"handAngles":[-0.6,0.3997580764686517],"handSupports":[null,null],"foreAnchor":"floor"},
 {"frame":388,"id":"full-stand","hips":[614,529],"lean":4,"headAngle":0.12,"feet":[[628,600],[598,592]],"legSupports":["floor","floor"],"hands":[[672.1058396042677,540.2597330161319],[560.0066061796273,537.9122168653026]],"handAngles":[1.05,1.5],"handSupports":[null,null],"foreAnchor":"floor"},
];
const smooth=(u:number)=>{const v=Math.max(0,Math.min(1,u));return v*v*v*(10+v*(-15+6*v));};
const mix=(a:number,b:number,u:number)=>a+(b-a)*u;
const between=(a:Point2,b:Point2,u:number):Point2=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
/** A focused action test for the first rear paw, not a finished episode. */
function firstHindStep(time:number):HeldControl|null {
 if(time<6||time>=7.25)return null;
 if(time>=6.75){
  const u=smooth((time-6.75)/.5),advance=smooth((time-7.05)/.2),hipLift=smooth((time-6.75)/.3);
  const hips:Point2=time<7.05?between([750,466],[760,447],hipLift):between([760,447],[770,439],advance);
  const nearU=smooth((time-6.98)/.17),farU=smooth((time-6.98)/.19),nearHandU=smooth((time-7.15)/.1),farHandU=smooth((time-7.17)/.08);
  const nearFoot=between([795,436],[814,450],nearU);nearFoot[1]-=25*Math.sin(Math.PI*nearU);
  const farFoot=time<6.98?between([719,521],[791,483],smooth((time-6.75)/.23)):between([791,483],[795,436],farU);if(time>=6.98&&time<7.17)farFoot[0]+=8*Math.sin(Math.PI*farU);
  const nearHand=between([796,454],[826,436],nearHandU);nearHand[1]-=10*Math.sin(Math.PI*nearHandU);
  const farHand=between([764,454],[775,454],farHandU);farHand[1]-=8*Math.sin(Math.PI*farHandU);
  return {frame:time*24,id:'second-hind-transition',hips,lean:mix(-20,-12,u),headAngle:mix(-.2,-.12,u),feet:[nearFoot,farFoot],legSupports:[time<=6.98||time>=7.15?'seat':null,time>=7.17?'seat':null],hands:[nearHand,farHand],handAngles:[0,0],handSupports:[time<=7.15?'seat':null,time<=7.17?'seat':null],gaze:between([3,-5],[3,-4],u),footAngles:[-.25*Math.sin(Math.PI*nearU),0]};
 }
 const u=(time-6)/.75,s=smooth(u),lift=smooth((time-6)/.6),settle=smooth((time-6.6)/.15);
 const hips:Point2=[mix(713,750,lift),time<6.6?mix(480,454,lift):mix(454,466,settle)];
 const nearFoot=time<6.36?between([694,542],[767,500],smooth((time-6)/.36)):time<6.6?between([767,500],[795,422],smooth((time-6.36)/.24)):between([795,422],[795,436],settle);
 if(time>=6.36&&time<6.6)nearFoot[0]+=10*Math.sin(Math.PI*(time-6.36)/.24);
 return {frame:time*24,id:'first-hind-transition',hips,lean:mix(7,-20,lift),headAngle:mix(-.35,-.2,s),feet:[nearFoot,add(hips,mix(-40,-31,s),mix(54,55,s))],legSupports:[null,null],hands:[[796,454],[764,454]],handAngles:[0,0],handSupports:['seat','seat'],gaze:[3,-5],footAngles:[mix(-.12,0,lift),mix(-.12,0,lift)]};
}
type SpatialBone={root:Vec3;joint:Vec3;end:Vec3;yaw:number;pole?:Vec3;viewDepth?:number;};
type Angles={shoulder:number;elbow:number;wrist:number};
const shouldersAt=(hips:Point2,lean:number):Point2=>add(hips,lean,-Math.sqrt(catDimensions.torso**2-lean**2));
const armRoot=(hips:Point2,lean:number,i:number,offsets?:readonly Point2[]):Point2=>add(shouldersAt(hips,lean),...(offsets?.[i]??[i?-16:16,i?-5:3] as Point2));
const legacyRestAngles:readonly Angles[]=[{shoulder:1.3066917241998048,elbow:1.1063490842951385,wrist:.8496573600953337},{shoulder:2.6742716943071354,elbow:.9745136178384837,wrist:-.1997580764686517}];
const restAngles:readonly Angles[]=[{shoulder:2.1,elbow:1.1,wrist:.2},{shoulder:2.1,elbow:1.1,wrist:.2}];
function armAngles(c:HeldControl):Angles[]{return [0,1].map(i=>{
 const a=solveLimbContact({root:armRoot(c.hips,c.lean,i),...foreLimits,upper:catDimensions.fore[0],lower:catDimensions.fore[1],contact:{local:c.foreAnchor==='floor'?pawFloorContact:pawPad,target:c.hands?.[i]??add(c.hips,i?-50:60,i?5:6)},handAngle:c.handAngles?.[i]??(i?1.5:1.05)});
 if(a.status!=='solved')throw Error(`Angle control ${c.id}/${i}: ${JSON.stringify(a.violations)}`);return a.pose.angles;
});}
function freeArms(hips:Point2,lean:number,angles:readonly Angles[],anchor:'floor'|'grip'='grip',armOffsets?:[Point2,Point2]){
 const handAngles=angles.map(a=>a.shoulder-a.elbow+a.wrist) as [number,number];
 const hands=angles.map((a,i)=>localPoint(anchor==='floor'?pawFloorContact:pawPad,{origin:planarEndpoint(armRoot(hips,lean,i,armOffsets),...catDimensions.fore,a.shoulder,a.elbow,1),angle:handAngles[i],scale:1})) as [Point2,Point2];
 return {hands,handAngles,foreAnchor:anchor==='floor'?'floor' as const:undefined,...(armOffsets?{armOffsets}:{})};
}
const angleMix=(a:readonly Angles[],b:readonly Angles[],u:number)=>a.map((v,i)=>({shoulder:mix(v.shoulder,b[i].shoulder,u),elbow:mix(v.elbow,b[i].elbow,u),wrist:mix(v.wrist,b[i].wrist,u)}));
const held=(id:string)=>{const c=heldControls.find(c=>c.id===id);if(!c)throw Error('Missing cat control '+id);return c;};
const walkX=(time:number)=>138+500*sampleTravel(time,{start:.3,end:3.3,ramp:.25}).progress;
export const walkTracks:[Step2D[],Step2D[]]=[[],[]];
for(let n=0;n<14;n++){
 const i=n%2===0?1:0,start=.34+.22*n,end=start+.19,y=600-8*i;
 const from=walkTracks[i].at(-1)?.to??[i?124:146,y] as Point2;
 const to:Point2=[n>=12?(i?624:646):walkX(end+.11)+(i?-3:9),y];
 walkTracks[i].push({start,end,from,to,lift:12});
}
export const walkPasses=inspectFootPasses(walkTracks,[1,0],.015);
const g=1000,hopStart=5.25,hopDuration=10/24,hopEnd=hopStart+hopDuration,hopV:Point2=[66/hopDuration,(-29-g*hopDuration**2/2)/hopDuration];
const firstRearTime=325/24,downV:Point2=[-230.58823529411765,-Math.sqrt(560**2-2*g*149)],downDuration=(560-downV[1])/g,downStart=firstRearTime-downDuration,downLaunch:Point2=[620-downV[0]*downDuration,383];
/** Cubic contour helper also gives an authored C1 body push/catch with explicit endpoint velocities. */
function boundary(a:Point2,b:Point2,va:Point2,vb:Point2,start:number,end:number,time:number):Point2{
 const d=end-start,u=Math.max(0,Math.min(1,(time-start)/d));return cubicPoint(a,{key:'body-boundary',c1:add(a,va[0]*d/3,va[1]*d/3),c2:add(b,-vb[0]*d/3,-vb[1]*d/3),to:b},u);
}
const ballistic=(start:Point2,v:Point2,t:number):Point2=>add(start,v[0]*t,v[1]*t+g*t*t/2);
const chairFeet:[Point2,Point2]=[[835,451],[814,443]];
const hopLaunchAngles=armAngles({...held('jump-prepare'),hips:[638,529],lean:14}),gripAngles=armAngles(held('seat-grip'));
const crouchAngles=armAngles(held('seat-crouch'));
const sitAngles:readonly Angles[]=[{shoulder:1.85,elbow:.7,wrist:.1},{shoulder:1.95,elbow:.7,wrist:.1}];
const prepareDownAngles=armAngles(held('jump-down-prepare')),rearTouchAngles=armAngles(held('first-rear-touch'));
function prefixControl(time:number):HeldControl|null {
 if(time<0||time>=firstRearTime)return null;
 const frame=time*24;
 if(time<3.55){
  const feet=walkTracks.map(track=>sampleFootsteps(time,track,.015)),active=smooth((time-.1)/.25)*(1-smooth((time-3.3)/.25));
  const hips:Point2=[walkX(time),529+6*active+.4*Math.max(...feet.map(f=>f.compression))],lean=4+2*active;
  const lead=Math.max(-1,Math.min(1,(feet[0].position[0]-feet[1].position[0])/36));
  const angles=restAngles.map((a,i)=>{const phase=(i?lead:-lead)*active;return {shoulder:mix(a.shoulder,1.9-.8*phase,active),elbow:mix(a.elbow,1.05+.15*phase,active),wrist:mix(a.wrist,.15,active)};});
  return {frame,id:'walk',hips,lean,feet:feet.map(f=>f.position) as [Point2,Point2],legSupports:feet.map(f=>f.planted?'floor':null) as [Support,Support],...freeArms(hips,lean,angles,'grip',[[16-8*active,3],[-16+6*active,-5]]),gaze:[3,-3]};
 }
 if(time<4.6){const c=held('floor-stand');return {...c,frame,id:'measure-chair',...freeArms(c.hips,c.lean,restAngles),gaze:[3,-5]};}
 if(time<hopStart){
  const u=smooth((time-4.6)/.45),hips:Point2=time<5.05?[638,mix(529,548,u)]:boundary([638,548],[638,529],[0,0],hopV,5.05,hopStart,time),lean=mix(4,14,u);
  const a=freeArms(hips,lean,restAngles),targets=held('jump-prepare').hands!;
  return {frame,id:'hop-push',hips,lean,headAngle:mix(.12,.02,u),feet:[[646,600],[624,592]],legSupports:['floor','floor'],hands:a.hands.map((v,i)=>between(v,targets[i],u)) as [Point2,Point2],handAngles:a.handAngles.map(v=>mix(v,0,u)) as [number,number],gaze:[4,-5]};
 }
 if(time<6){
  const flying=time<hopEnd,u=smooth((time-hopStart)/hopDuration),hips:Point2=flying?ballistic([638,529],hopV,time-hopStart):time<5.85?boundary([704,500],[710,506],[hopV[0],hopV[1]+g*hopDuration],[0,0],hopEnd,5.85,time):between([710,506],[704,500],smooth((time-5.85)/.15)),lean=mix(14,7,u);
  const offsets=([[[8,71],[-19,62]],[[-14,63],[-40,54]]] as const).map(([a,b])=>between([...a],[...b],u));
  return {frame,id:flying?'hop-flight':'grip-catch',hips,lean,headAngle:mix(.02,-.35,u),feet:offsets.map(v=>add(hips,...v)) as [Point2,Point2],legSupports:[null,null],...(flying?freeArms(hips,lean,angleMix(hopLaunchAngles,gripAngles,u)):{hands:held('seat-grip').hands!,handAngles:[0,0] as [number,number]}),handSupports:flying?[null,null]:['seat','seat'],footAngles:[mix(0,-.12,u),mix(0,-.12,u)],gaze:[3,-5]};
 }
 if(time<7.25)return null; // Existing first-hind/step/regrip fragment owns6..7.25.
 if(time<8){
  const u=smooth((time-7.25)/.75),advance=smooth((time-7.45)/.55),hips=between([770,439],[810,418],advance),lean=mix(-12,20,u);
  const far=sampleFootsteps(time,[{start:7.25,end:7.45,from:[795,436],to:[814,443],lift:8}],.015),near=sampleFootsteps(time,[{start:7.46,end:7.66,from:[814,450],to:[835,451],lift:8}],.015);
  const nearU=smooth((time-7.66)/.24),nearHand=between([826,436],[858,450],nearU);nearHand[1]-=8*Math.sin(Math.PI*nearU);
  const farU=smooth((time-7.45)/.3),farHand=between([775,454],[790,421],farU);farHand[1]-=5*Math.sin(Math.PI*farU);
  return {frame,id:'climb-forward',hips,lean,headAngle:mix(-.12,0,u),feet:[near.position,far.position],legSupports:[near.planted?'seat':null,far.planted?'seat':null],hands:[nearHand,farHand],handAngles:[0,mix(0,1.5,farU)],handSupports:[time<=7.66||time>=7.9?'seat':null,time<=7.45?'seat':null],gaze:between([3,-4],[2,-3],u)};
 }
 if(time<9.3){
  const u=smooth((time-8)/.55),hips=between([810,418],[827,380],u),lean=mix(20,4,u);
  return {frame,id:'seat-rise',hips,lean,headAngle:mix(0,.12,u),feet:chairFeet,legSupports:['seat','seat'],...freeArms(hips,lean,angleMix(crouchAngles,restAngles,u)),gaze:[1,-3]};
 }
 if(time<11.2){
  const u=smooth((time-9.3)/1.2),hips=between([827,380],[842,435.375],u),lean=mix(4,-6,u);
  const far=sampleFootsteps(time,[{start:9.6,end:9.9,from:chairFeet[1],to:[869,446],lift:6}],.015),near=sampleFootsteps(time,[{start:9.92,end:10.2,from:chairFeet[0],to:[887,454],lift:4}],.015);
  if(!near.planted)near.position[0]+=8*Math.sin(Math.PI*(time-9.92)/.28);
  return {frame,id:'sit-down',hips,lean,headAngle:mix(.12,.08,u),feet:[near.position,far.position],legSupports:[near.planted?'seat':null,far.planted?'seat':null],...freeArms(hips,lean,angleMix(restAngles,sitAngles,u)),pelvisSupport:time>=10.5?[841.875,446]:undefined,gaze:[2,-3]};
 }
 if(time<downStart){
  const stand=smooth((time-11.2)/.3);
  const hips:Point2=time<11.5?[842,mix(435.375,404,stand)]:time<11.8?boundary([842,404],[823,404],[0,0],[-80,0],11.5,11.8,time):time<12.11?boundary([823,404],[downLaunch[0],403],[-80,0],[0,0],11.8,12.11,time):time<12.55?[downLaunch[0],403]:boundary([downLaunch[0],403],downLaunch,[0,0],downV,12.55,downStart,time);
  const near=sampleFootsteps(time,[{start:11.5,end:11.8,from:[887,454],to:[downLaunch[0]+8,454],lift:6}],.015),far=sampleFootsteps(time,[{start:11.81,end:12.11,from:[869,446],to:[downLaunch[0]-6,446],lift:6}],.015);
  return {frame,id:'prepare-jump-down',hips,lean:-14,headAngle:mix(.08,.12,stand),feet:[near.position,far.position],legSupports:[near.planted?'seat':null,far.planted?'seat':null],...freeArms(hips,-14,angleMix(sitAngles,prepareDownAngles,smooth((time-11.2)/.91))),gaze:[-3,-3]};
 }
 const u=smooth((time-downStart)/downDuration),hips=ballistic(downLaunch,downV,time-downStart),lean=mix(-14,43,u);
 const offsets=([[[8,71],[8,68]],[[-6,63],[-22,60]]] as const).map(([a,b])=>between([...a],[...b],u));
 return {frame,id:'jump-down-flight',hips,lean,headAngle:.12,feet:offsets.map(v=>add(hips,...v)) as [Point2,Point2],legSupports:[null,null],...freeArms(hips,lean,angleMix(prepareDownAngles,rearTouchAngles,u),'floor'),gaze:between([-3,1],[1,-3],u)};
}
const releaseBase:HeldControl={...held('weight-back-release'),hips:[616,558],lean:43,hands:[[720,600],[702,592]]};
const releaseAngles=armAngles(releaseBase);
const raisedReleaseAngles=armAngles({...releaseBase,hands:releaseBase.hands!.map(p=>add(p,0,-8)) as [Point2,Point2]});
const tuckedAngles:readonly Angles[]=[{shoulder:.4,elbow:1,wrist:0},{shoulder:.4,elbow:1.4,wrist:0}];
/** Example-authored impact/weight-transfer schedule, using the independently checked rig.
 * The remaining subpixel far-chain study guard is explicitly tracked in QA, not relaxed here. */
function landingControl(time:number):HeldControl|null {
 if(time<firstRearTime)return null;
 const t=Math.min(2.6,time-firstRearTime),stop=40/560,frame=time*24;
 const base={frame,id:'floor-recovery',headAngle:.12,feet:[[628,600],[598,592]] as [Point2,Point2],legSupports:['floor','floor'] as [Support,Support],foreAnchor:'floor' as const,gaze:[1,-3] as Point2};
 if(t<=1.55){
  let hips:Point2;
  if(t<=stop)hips=[620+downV[0]*t-downV[0]/stop*t*t/2,532+560*t-560/stop*t*t/2];
  else if(t<=.55)hips=between([620+downV[0]*stop/2,552],[610,550],smooth((t-stop)/(.55-stop)));
  else if(t<=1.1)hips=[610,550];
  else hips=between([610,550],[616,558],smooth((t-1.1)/.45));
  const touched=time>=firstRearTime+.06,planted=touched&&t<1.55;
  const hands=([[728,600],[710,592]] as [Point2,Point2]).map((p,i)=>[p[0]-(i?18:13)*(1-smooth(t/.06)),p[1]-12*(1-smooth(t/.06))]) as [Point2,Point2];
  return {...base,id:t<=stop?'landing-compression':t<=.55?'landing-settle':t<=1.1?'four-paw-hold':'weight-back-release',hips,lean:43,hands,handAngles:[0,0],handSupports:planted?['floor','floor']:[null,null]};
 }
 const tau=t-1.55;
 let hips:Point2,lean:number,angles:Angles[];
 if(tau<=.05){return {...base,id:'free-rise',hips:[616,558],lean:43,hands:releaseBase.hands!.map(p=>add(p,0,-8*smooth(tau/.05))) as [Point2,Point2],handAngles:[0,0],handSupports:[null,null]};}
 if(tau<=.15){hips=[616,558];lean=43;angles=angleMix(raisedReleaseAngles,tuckedAngles,smooth((tau-.05)/.1));}
 else if(tau<=.55){const u=smooth((tau-.15)/.4);hips=between([616,558],[614,529],u);lean=mix(43,-16,u);angles=tuckedAngles.map(a=>({...a}));}
 else if(tau<=.7){
  const u=smooth((tau-.55)/.15),far={shoulder:mix(.4,legacyRestAngles[1].shoulder,u),elbow:mix(1.4,2.35,u),wrist:0};far.wrist=-1-(far.shoulder-far.elbow);
  hips=[614,529];lean=-16;angles=[{...tuckedAngles[0]},far];
 }else if(tau<=.85){
  const u=smooth((tau-.7)/.15),far={shoulder:legacyRestAngles[1].shoulder,elbow:mix(2.35,legacyRestAngles[1].elbow,u),wrist:mix(-1-(legacyRestAngles[1].shoulder-2.35),-1.3,u)};
  hips=[614,529];lean=-16;angles=[{...tuckedAngles[0]},far];
 }else{
  const u=smooth((tau-.85)/.2);hips=[614,529];lean=mix(-16,4,u);angles=angleMix(tuckedAngles,legacyRestAngles,u);angles[1]={...legacyRestAngles[1],wrist:mix(-1.3,legacyRestAngles[1].wrist,u)};
 }
 return {...base,id:t<2.6?'free-rise':'final-stand',hips,lean,...freeArms(hips,lean,angles,'floor'),handSupports:[null,null]};
}
// Revision timeline: space for visible pull and a supported whole-character turn.
export const catTiming={pullStart:6,pullEnd:6.7,sitStart:10,pelvisTouch:11.2,
 seatedHold:[11.7,12.4] as const,turnStart:13.45,turnEnd:14.6,
 rearTouch:380/24,downStart:380/24-downDuration,end:20};
const seatedFeet:[Point2,Point2]=[[882,492],[861,484]];
const restoredFeet:[Point2,Point2]=[[875,454],[869,446]];
const turnEndFeet:[Point2,Point2]=[[798,454],[815,446]];
const newPrepAngles:readonly Angles[]=[{shoulder:1.8,elbow:1.25,wrist:.4},{shoulder:2.05,elbow:1.3,wrist:.4}];
function revisionControl(time:number):HeldControl {
 const frame=time*24;
 if(time<6)return prefixControl(time)!;
 if(time<6.7){
  const u=smooth((time-6)/.7),hips=between([704,500],[713,480],u);
  return {frame,id:'fixed-grip-pull',hips,lean:7,headAngle:-.35,footAngles:[-.12,-.12],feet:[add(hips,-19,62),add(hips,-40,54)],legSupports:[null,null],hands:[[796,454],[764,454]],handAngles:[0,0],handSupports:['seat','seat'],gaze:[3,-5]};
 }
 if(time<10){const old=time-.7;return firstHindStep(old)??prefixControl(old)!;}
 if(time<11.2){
  const u=smooth((time-10)/1.2),hips=between([827,380],[842,435.375],u),lean=mix(4,-6,u);
  const far=sampleFootsteps(time,[{start:10.3,end:10.6,from:chairFeet[1],to:[869,446],lift:6}],.015);
  const near=sampleFootsteps(time,[{start:10.62,end:10.9,from:chairFeet[0],to:[887,454],lift:4}],.015);
  if(!near.planted)near.position[0]+=8*Math.sin(Math.PI*(time-10.62)/.28);
  return {frame,id:'sit-down',hips,lean,headAngle:mix(.12,.04,u),feet:[near.position,far.position],legSupports:[near.planted?'seat':null,far.planted?'seat':null],...freeArms(hips,lean,angleMix(restAngles,sitAngles,u)),gaze:[2,-3]};
 }
 if(time<13.05){
  const foot=(i:number)=>{
   const start=i?11.45:11.2,end=i?11.7:11.45;
   const t=smooth((time-start)/(end-start)),seat=held('pelvis-sit').feet[i];
   if(time<12.4)return between(seat,seatedFeet[i],t);
   return between(seatedFeet[i],restoredFeet[i],smooth((time-(i?12.7:12.4))/.3));
  };
  const hips:Point2=[842,435.375],lean=-6;
  return {frame,id:time<12.4?'seated-hold':'restore-seat-feet',hips,lean,headAngle:.04,feet:[foot(0),foot(1)],legSupports:[time>=12.7?'seat':null,time>=13?'seat':null],...freeArms(hips,lean,sitAngles),pelvisSupport:[841.875,446],gaze:[2,-3]};
 }
 if(time<13.45){
  const u=smooth((time-13.05)/.4),hips=between([842,435.375],[842,388],u),lean=mix(-6,4,u);
  return {frame,id:'rise-before-turn',hips,lean,headAngle:mix(.04,.12,u),feet:restoredFeet,legSupports:['seat','seat'],...freeArms(hips,lean,angleMix(sitAngles,restAngles,u)),gaze:[1,-3]};
 }
 if(time<14.6){
  const t=time-13.45,u=smooth(t/1.15),hips:Point2=t<.25?[842,mix(388,405,smooth(t/.25))]:between([842,405],[806,405],smooth((t-.25)/.9));
  const far=sampleFootsteps(time,[{start:13.7,end:14.08,from:restoredFeet[1],to:turnEndFeet[1],lift:12}],.015);
  const near=sampleFootsteps(time,[{start:14.09,end:14.5,from:restoredFeet[0],to:turnEndFeet[0],lift:12}],.015);
  return {frame,id:'supported-left-turn',hips,lean:4,headAngle:.12,feet:[near.position,far.position],legSupports:[near.planted?'seat':null,far.planted?'seat':null],turn:u,footTurns:[smooth((time-14.09)/.41),smooth((time-13.7)/.38)],...freeArms(hips,4,restAngles),gaze:[1,-3]};
 }
 if(time<catTiming.downStart){
  const near=sampleFootsteps(time,[{start:14.6,end:14.75,from:turnEndFeet[0],to:[downLaunch[0]+20-8,454],lift:5}],.015);
  const far=sampleFootsteps(time,[{start:14.76,end:14.9,from:turnEndFeet[1],to:[downLaunch[0]+20+6,446],lift:5}],.015);
  const hipWorld:Point2=time<14.9?between([806,405],[downLaunch[0]+20,403],smooth((time-14.6)/.3)):boundary([downLaunch[0]+20,403],add(downLaunch,20,0),[0,0],downV,14.9,catTiming.downStart,time);
  // Canonical left-view coordinates are reflected locally only after the supported turn.
  const hips=add(hipWorld,-20,0),inverse=(p:Point2):Point2=>[2*hips[0]+20-p[0],p[1]];
  return {frame,id:'left-jump-push',hips,lean:mix(4,14,smooth((time-14.6)/.3)),headAngle:.12,feet:[inverse(near.position),inverse(far.position)],legSupports:[near.planted?'seat':null,far.planted?'seat':null],...freeArms(hips,mix(4,14,smooth((time-14.6)/.3)),angleMix(restAngles,newPrepAngles,smooth((time-14.6)/.3))),facing:-1,gaze:[mix(1,3,smooth((time-14.6)/.3)),-3]};
 }
 if(time<catTiming.rearTouch){
  const t=time-catTiming.downStart,u=smooth(t/downDuration),hips=ballistic(downLaunch,downV,t),lean=mix(14,43,u);
  const offsets=([[[8,71],[8,68]],[[-6,63],[18,60]]] as const).map(([a,b])=>between([...a],[...b],u));
  return {frame,id:'jump-down-flight',hips,lean,headAngle:.12,feet:offsets.map(v=>add(hips,...v)) as [Point2,Point2],legSupports:[null,null],...freeArms(hips,lean,angleMix(newPrepAngles,rearTouchAngles,u),'floor'),facing:-1,gaze:[mix(3,1,u),-3]};
 }
 const floor=landingControl(firstRearTime+time-catTiming.rearTouch)!;
 // A local facing change must NOT drag world-fixed supports with the pelvis.
 // Preimage every planted floor target through this frame's actor placement.
 const shift=2*(floor.hips[0]-620),preimage=(p:Point2)=>add(p,shift,0);
 return {...floor,frame,facing:-1,feet:floor.feet.map((p,i)=>preimage(add(p,i?40:0,0))) as [Point2,Point2],
  hands:time-catTiming.rearTouch<=1.55?floor.hands!.map(preimage) as [Point2,Point2]:floor.hands};
}
/** Build the actual right-view drawing from authored controls; left view is local actor geometry. */
function evaluateControl(c:HeldControl,time:number){
 const hips=c.hips,lean=c.lean,shoulders:Point2=add(hips,lean,-Math.sqrt(catDimensions.torso**2-lean**2));
 const headFrame=attachAnchor({origin:[0,0],scale:1,angle:c.headAngle??.12},neckAnchor,add(shoulders,0,-4));
 const legs=c.feet.map((contact,i)=>{
  const frame=attachAnchor({origin:[0,0],scale:1,angle:c.footAngles?.[i]??(c.id==='seat-grip'?-.12:0)},soleAnchor,contact),end=localPoint([0,-5],frame),root=add(hips,i?-9:3,i?-8:0);
  let solved;try{solved=solvePlanarLimb(root,end,...catDimensions.hind,{bendSide:-1,endAngle:Math.PI/2+frame.angle,wristRange:[-1.65,1.65],minFlexion:.2,maxFlexion:2.4});}catch(e){throw Error(`${c.id} hind${i} root=${root} sole=${contact}: ${e instanceof Error?e.message:e}`);}
  return {spatial:undefined as SpatialBone|undefined,...limbShape(root,solved.joint,end,i?[14,11,8]:[17,13,9],{jointSmoothing:.7}),flexion:solved.flexion,foot:placeContour(footContour,frame),sole:localPoint(soleAnchor,frame),contact,support:c.legSupports[i],planted:c.legSupports[i]!==null};
 });
 const arms=[0,1].map(i=>{
  const root=armRoot(hips,lean,i,c.armOffsets),angle=c.handAngles?.[i]??(i?1.5:1.05),target=c.hands?.[i]??add(hips,i?-50:60,i?5:6);
  const solved=solveLimbContact({root,...foreLimits,upper:catDimensions.fore[0],lower:catDimensions.fore[1],contact:{local:c.foreAnchor==='floor'?pawFloorContact:pawPad,target},handAngle:angle});
  if(solved.status!=='solved')throw Error(`${c.id} fore${i}: ${JSON.stringify(solved.violations)}`);
  const paw=placeContour(pawContour,solved.pose.handFrame),support=c.handSupports?.[i]??null;
  return {spatial:undefined as SpatialBone|undefined,...solved.pose,shape:limbShape(root,solved.pose.joint,solved.pose.end,i?[11,9,8]:[12,10,9],{jointSmoothing:.7}),paw,pad:contourAnchor(paw,'pad',.5),groundContact:contourAnchor(paw,'clawInner',pawFloorT),target,support,planted:support!==null};
 });
 const body=torsoContour(hips,shoulders);
 return {time,control:c.id,hips,shoulders,headFrame,head:placeContour(headContour,headFrame),body,pelvis:contourAnchor(body,'rump',.5),pelvisSupport:c.pelvisSupport,arms,legs,gaze:c.gaze??[1,-3] as Point2,facing:1};
}
/** Mirror just the fully turned actor around its root; chair, root travel and camera stay fixed.
 * The preceding turn carries the contacts to these exact positions with explicit steps. */
function leftPose(p:ReturnType<typeof evaluateControl>){
 const point=(q:Point2):Point2=>[2*p.hips[0]+20-q[0],q[1]],contour=(c:typeof p.body)=>mapContour(c,point);
 const head=contourView([{at:-1,contour:leftHeadContour},{at:1,contour:headContour}],-1);
 const body=torsoContour(point(p.hips),point(p.shoulders));
 const headFrame=attachAnchor({origin:[0,0],scale:1,angle:-p.headFrame.angle},contourAnchor(head,'neck',1),add(point(p.shoulders),0,-4));
 return {...p,hips:point(p.hips),shoulders:point(p.shoulders),headFrame,head:placeContour(head,headFrame),body,pelvis:contourAnchor(body,'rump',.5),pelvisSupport:p.pelvisSupport?point(p.pelvisSupport):undefined,facing:-1,gaze:[-p.gaze[0],p.gaze[1]] as Point2,
 legs:p.legs.map(l=>({...l,root:point(l.root),joint:point(l.joint),end:point(l.end),upper:l.upper.map(point) as [Point2,Point2],lower:l.lower.map(point) as [Point2,Point2],contour:contour(l.contour),foot:contour(l.foot),sole:point(l.sole),contact:point(l.contact)})),
 arms:p.arms.map(a=>({...a,root:point(a.root),joint:point(a.joint),end:point(a.end),handFrame:{...a.handFrame,origin:point(a.handFrame.origin),angle:-a.handFrame.angle},contact:point(a.contact),shape:{...a.shape,root:point(a.root),joint:point(a.joint),end:point(a.end),upper:a.shape.upper.map(point) as [Point2,Point2],lower:a.shape.lower.map(point) as [Point2,Point2],contour:contour(a.shape.contour)},paw:contour(a.paw),pad:point(a.pad),groundContact:point(a.groundContact),target:point(a.target)}))};
}
/** A local spatial turn uses existing 3D IK and projection only while yaw changes.
 * Bone lengths are checked in 3D here; projected bones genuinely foreshorten.
 * Head/body retain authored screen volume, and feet move through separate support tracks.
 */
function turnPose(c:HeldControl,time:number):ReturnType<typeof evaluateControl>{
 const yaw=Math.PI*c.turn!,hips=c.hips,cos=Math.cos(yaw),sin=Math.sin(yaw);
 const view=(p:Vec3):Point2=>add(project(p,yaw,0),...hips);
 const shoulder3:Vec3=[4,-Math.sqrt(catDimensions.torso**2-16),0],shoulders=view(shoulder3);
 const legs=c.feet.map((contact,i)=>{
  const root3:Vec3=[i?-9:3,i?-8:0,i?-8:8],root=view(root3),footYaw=Math.PI*c.footTurns![i];
  const end:Point2=add(contact,-6*Math.cos(footYaw),-5);
  const end3=unproject([end[0]-hips[0],end[1]-hips[1]],yaw,root3[2]*cos-root3[0]*sin,0);
  const d:Vec3=[end3[0]-root3[0],end3[1]-root3[1],end3[2]-root3[2]];
  const pole:Vec3=[d[1],-d[0],0],joint3=solveTwoBone(root3,end3,...catDimensions.hind,pole),joint=view(joint3);
  const dist=Math.hypot(...d),flexion=Math.acos(Math.max(-1,Math.min(1,(dist*dist-36*36-34*34)/(2*36*34))));
  if(flexion<.2-1e-7||flexion>2.4+1e-7)throw Error('Turn hind flexion outside unchanged limits: '+flexion);
  // Reverse screen winding when authoring the left whole foot, maintaining a
  // finite end-on view rather than multiplying all contour x by zero.
  const normalized=mapContour(footContour,p=>[p[0]-soleAnchor[0],p[1]]);
  const q=normalized.curves;
  const left={start:[-q[2].to[0],q[2].to[1]] as Point2,curves:[2,1,0,3].map((j,k)=>({key:q[k].key,c1:[-q[j].c2[0],q[j].c2[1]] as Point2,c2:[-q[j].c1[0],q[j].c1[1]] as Point2,to:[-(j?q[j-1].to[0]:normalized.start[0]),j?q[j-1].to[1]:normalized.start[1]] as Point2}))};
  const front={start:[-7,0] as Point2,curves:[
   {key:'heel',c1:[-8,-2] as Point2,c2:[-7,-8] as Point2,to:[-3,-10] as Point2},
   {key:'ankle',c1:[-1,-12] as Point2,c2:[3,-12] as Point2,to:[5,-8] as Point2},
   {key:'toes',c1:[8,-7] as Point2,c2:[9,-3] as Point2,to:[7,0] as Point2},
   {key:'sole',c1:[3,0] as Point2,c2:[-3,0] as Point2,to:[-7,0] as Point2}]};
  const foot=mapContour(contourView([{at:0,contour:normalized},{at:.5,contour:front},{at:1,contour:left}],c.footTurns![i]),p=>add(p,...contact));
  return {spatial:{root:root3,joint:joint3,end:end3,yaw,pole,viewDepth:root3[2]*cos-root3[0]*sin},...limbShape(root,joint,end,i?[14,11,8]:[17,13,9],{jointSmoothing:.7}),flexion,foot,sole:contact,contact,support:c.legSupports[i],planted:c.legSupports[i]!==null};
 });
 const arms=[0,1].map(i=>{
  const z=i?-10:10,root3:Vec3=[shoulder3[0]+(i?-16:16),shoulder3[1]+(i?-5:3),z],a=restAngles[i];
  const joint3:Vec3=[root3[0]+34*Math.cos(a.shoulder),root3[1]+34*Math.sin(a.shoulder),z];
  const end3:Vec3=[joint3[0]+32*Math.cos(a.shoulder-a.elbow),joint3[1]+32*Math.sin(a.shoulder-a.elbow),z];
  const root=view(root3),joint=view(joint3),end=view(end3),angle=a.shoulder-a.elbow+a.wrist;
  const frame={origin:[end3[0],end3[1]] as Point2,angle,scale:1};
  const paw=mapContour(placeContour(pawContour,frame),p=>view([p[0],p[1],z]));
  const pad=contourAnchor(paw,'pad',.5),groundContact=contourAnchor(paw,'clawInner',pawFloorT);
  return {spatial:{root:root3,joint:joint3,end:end3,yaw},root,joint,end,angles:{...a},handFrame:{origin:end,angle,scale:1},shape:limbShape(root,joint,end,i?[11,9,8]:[12,10,9],{jointSmoothing:.7}),paw,pad,groundContact,target:pad,contact:pad,support:null,planted:false};
 });
 const head=contourView([{at:-1,contour:leftHeadContour},{at:1,contour:headContour}],cos);
 const headFrame=attachAnchor({origin:[0,0],scale:1,angle:.12*cos},contourAnchor(head,'neck',1),add(shoulders,0,-4));
 const body=torsoContour(hips,shoulders);
 return {time,control:c.id,hips,shoulders,headFrame,head:placeContour(head,headFrame),body,pelvis:contourAnchor(body,'rump',.5),pelvisSupport:undefined,arms,legs,gaze:[cos,-3],facing:cos};
}
export function catPose(time:number){
 if(!Number.isFinite(time)||time<0)throw new RangeError('Cat pose requires finite nonnegative seconds');
 const c=revisionControl(time);
 if(c.turn!==undefined)return turnPose(c,time);
 const p=evaluateControl(c,time);return c.facing===-1?leftPose(p):p;
}
export type CatPose=ReturnType<typeof evaluateControl>;
