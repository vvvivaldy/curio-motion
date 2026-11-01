import {cameraDepth,hipRoot,shoulderLocal,depthOrder} from './depth';
import {humanFace} from './face';
import type {Point2} from '../../core/spatial';
import {localPoint} from '../../core/spatial';
import {mapContour,type CubicContour} from '../../core/contour';
import {limbShape} from '../../core/limb';
import {fitPlanarPostureHeight,planarEndpoint,solvePlanarLimb,solveTwoBone} from '../../core/kinematics';

export const humanDesign={upperLeg:90,lowerLeg:86,upperArm:64,lowerArm:58,torso:100,shoeHeight:10} as const;
export const chair={seatY:500,floorY:600,front:755,rear:878,depth:[16,-12] as Point2,
 seat:[[755,500],[862,500],[878,488],[771,488]] as Point2[],
 apron:[[755,500],[862,500],[863,513],[755,513]] as Point2[],
 side:[[862,500],[878,488],[878,501],[863,513]] as Point2[],
 legs:[[[773,505],[783,505],[777,600],[765,600]],[[862,505],[873,505],[882,600],[869,600]],[[778,500],[788,496],[789,590],[779,598]],[[867,500],[878,496],[885,590],[874,597]]] as Point2[][]};
export interface Control {frame:number;label:string;hips:Point2;feet:readonly [Point2,Point2];facing:number;lean:number;lift?:readonly [number,number];swing?:number;seat?:boolean;restHands?:number;headings?:readonly [number,number];preserveRoot?:boolean}
export const controls:readonly Control[]=[
 {frame:0,label:'Neutral adult · right ¾',hips:[270,414],feet:[[282,594],[257,600]],facing:1,lean:0},
 {frame:24,label:'Side 0 (far in right view) passing · side 1 planted',hips:[480,414],feet:[[478,594],[465,600]],lift:[17,0],facing:1,lean:.025,swing:.18},
 {frame:48,label:'Side 1 (near in right view) passing · side 0 planted',hips:[580,414],feet:[[593,594],[578,600]],lift:[0,17],facing:1,lean:.025,swing:-.18},
 {frame:72,label:'Braking · two feet on floor',hips:[735,414],feet:[[750,594],[723,600]],facing:1,lean:0},
 {frame:96,label:'Supported turn · front view',hips:[748,414],feet:[[760,600],[736,594]],facing:0,lean:0},
 {frame:120,label:'Ready to sit · left ¾',hips:[726,414],feet:[[720,600],[704,594]],facing:-1,lean:-.035},
 {frame:144,label:'Controlled lowering · fixed soles',hips:[774,453],feet:[[720,600],[704,594]],facing:-1,lean:-.27,restHands:1},
 {frame:168,label:'Pelvis touches seat · feet on floor',hips:[809,488],feet:[[720,600],[704,594]],facing:-1,lean:-.065,seat:true,restHands:1},
 {frame:192,label:'Lean forward before rising · seat retained',hips:[783,488],feet:[[720,600],[704,594]],facing:-1,lean:-.65,seat:true,restHands:1},
 {frame:216,label:'Seat release · weight over soles',hips:[770,478],feet:[[720,600],[704,594]],facing:-1,lean:-.65,restHands:1},
 {frame:240,label:'Rising · both soles remain planted',hips:[742,440],feet:[[720,600],[704,594]],facing:-1,lean:-.28,restHands:1},
 {frame:264,label:'Standing after rise · left ¾',hips:[714,414],feet:[[720,600],[704,594]],facing:-1,lean:0},
 {frame:288,label:'Departure passing · leftward',hips:[510,414],feet:[[507,600],[523,594]],lift:[17,0],facing:-1,lean:-.025,swing:-.18},
];
function contour(start:Point2,curves:readonly (readonly [Point2,Point2,Point2])[]):CubicContour{return{start,curves:curves.map(([c1,c2,to],i)=>({key:`edge${i}`,c1,c2,to}))};}
const torsoLocal=contour([-22,-4],[
 [[-25,30],[-33,81],[-28,91]], [[-25,100],[-13,105],[-8,104]],
 [[-4,102],[4,102],[8,104]], [[13,105],[25,100],[28,91]],
 [[33,81],[25,30],[22,-4]], [[7,-11],[-7,-11],[-22,-4]],
]);
const palm=contour([-5,0],[ [[-7,4],[-10,7],[-10,10]],[[-9,13],[-7,12],[-6,9]],[[-6,14],[-5,19],[-3,21]],[[-1,24],[3,24],[5,20]],[[8,16],[8,10],[6,5]],[[6,3],[5,1],[5,0]],[[2,-1],[-2,-1],[-5,0]] ]);
function shoeContour(direction:number):CubicContour{
 const left=-9-24*Math.max(0,-direction),right=9+24*Math.max(0,direction);
 return contour([left,0],[
 [[left,-4],[-9,-9],[-6,-11]],[[-2,-12],[4,-11],[7,-7]],
 [[right-9,-6],[right,-4],[right,-2]],[[right,-1],[right,0],[right-1,0]],
 [[12,0],[-2,0],[left,0]],
 ]);
}
export function buildHuman(input:Control){
 const c={...input,hips:[...input.hips] as Point2};
 const shift=fitPlanarPostureHeight(([0,1] as const).map(i=>({root:hipRoot(c.hips,i,c.facing),target:[c.feet[i][0],c.feet[i][1]-(c.lift?.[i]??0)-humanDesign.shoeHeight] as Point2,upper:humanDesign.upperLeg,lower:humanDesign.lowerLeg,minFlexion:.1,maxFlexion:2.6})));
 if((c.seat||c.preserveRoot)&&Math.abs(shift)>1e-8)throw new RangeError(`Authored pelvis conflicts with foot reach: ${shift}`);
 c.hips[1]+=shift;
 // Smooth front-volume blend: no velocity cusp when yaw passes through0.
 const frontView=1-c.facing*c.facing,width=1+.22*frontView;
 const frame={origin:c.hips,angle:c.lean,scale:1};
 const bodyPoint=(x:number,h:number):Point2=>localPoint([x*width,-h],frame);
 const f=c.facing>=0?1:-1;
 const legs=([0,1] as const).map(i=>{
  const root=hipRoot(c.hips,i,c.facing);
  const sole:Point2=[c.feet[i][0],c.feet[i][1]-(c.lift?.[i]??0)];
  const ankle:Point2=[sole[0],sole[1]-humanDesign.shoeHeight];
  const k=solveTwoBone([...root,0],[...ankle,0],humanDesign.upperLeg,humanDesign.lowerLeg,[c.facing,0,Math.sqrt(Math.max(0,1-c.facing*c.facing))]);
  const knee:Point2=[k[0],k[1]],shape=limbShape(root,knee,ankle,[24,17,12],{jointSmoothing:.35});
  const direction=c.headings?Math.cos(c.headings[i]):c.facing;
  const foot=mapContour(shoeContour(direction),q=>[sole[0]+q[0],sole[1]+q[1]]);
  return{side:i,cameraDepth:cameraDepth(i,c.facing),root,knee,ankle,sole,foot,shape,spatial:{root:[...root,0],joint:k,end:[...ankle,0]},planted:!(c.lift?.[i])};
 });
 const arms=([0,1] as const).map(i=>{
  const attachment=shoulderLocal(i,c.facing),root=bodyPoint(...attachment);
  const upperAngle=Math.PI/2+c.facing*.08+c.lean*.4+(i===0?1:-1)*(c.swing??0);
  const flexion=.28*Math.abs(c.facing),rest=c.restHands??0;
  const relaxed=planarEndpoint(root,humanDesign.upperArm,humanDesign.lowerArm,upperAngle,flexion,f);
  const target:Point2=[c.hips[0]-(i===0?52:65),c.hips[1]-(i===0?4:10)];
  const wrist:Point2=[relaxed[0]+(target[0]-relaxed[0])*rest,relaxed[1]+(target[1]-relaxed[1])*rest];
  const endAngle=(upperAngle-f*flexion)*(1-rest)+(Math.PI-.36)*rest;
  const solved=solvePlanarLimb(root,wrist,humanDesign.upperArm,humanDesign.lowerArm,{bendSide:f,endAngle,wristRange:[-1.1,1.1],minFlexion:Math.abs(c.facing)<.2?0:.04,maxFlexion:2.3});
  const handFrame={origin:wrist,angle:endAngle-Math.PI/2,scale:1};
  const shape=limbShape(root,solved.joint,wrist,[19,15,11],{jointSmoothing:.3});
  return{side:i,cameraDepth:cameraDepth(i,c.facing),attachment,root,wrist,shape,hand:mapContour(palm,p=>localPoint(p,handFrame)),handFrame,...solved};
 });
 const headFrame={origin:bodyPoint(0,139),angle:c.lean*.4,scale:1};
 const face=humanFace(c.facing),head=mapContour(face.head,p=>localPoint(p,headFrame));
 return{...c,legs,arms,body:mapContour(torsoLocal,p=>bodyPoint(p[0],p[1])),bodyPoint,head,headFrame,face,frontView,depthOrder:depthOrder(c.facing)};
}
export type HumanPose=ReturnType<typeof buildHuman>;
