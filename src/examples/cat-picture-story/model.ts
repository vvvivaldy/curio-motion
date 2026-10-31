import {solveTwoBone} from '../../core/kinematics';
import {limbShape,type LimbShape} from '../../core/limb';
import type {Point2,Vec3} from '../../core/spatial';
import {viewPoint,storyChair,type StoryView} from './world';
export type ControlId='room-a'|'room-b'|'pull'|'proud'|'panic'|'land';
export const controlIds:readonly ControlId[]=['room-a','room-b','pull','proud','panic','land'];
export const catDesign={torso:49,fore:[32,29] as const,hind:[30,27] as const};
const add=(p:Vec3,x:number,y:number,z=0):Vec3=>[p[0]+x,p[1]+y,p[2]+z];
export interface Held{headTurn?:number;leanZ?:number;armRootOffsets?:readonly [Vec3,Vec3];facing?:number;footHeadings?:readonly [number,number];headOffset?:number;fear?:number;bristle?:number;gaze?:Point2;armPoles?:readonly [Vec3,Vec3];hindPoles?:readonly [Vec3,Vec3];hindRootOffsets?:readonly [Vec3,Vec3];view:StoryView;hips:Vec3;lean:number;feet:[Vec3,Vec3];hands:[Vec3,Vec3];supports:{feet:readonly ('floor'|'seat'|null)[];hands:readonly ('floor'|'chair'|null)[];pelvis:boolean};expression:'cheeky'|'proud'|'panic';pictureDown:boolean;label:string}
const neutral={hips:[-230,60,-25] as Vec3,lean:4,feet:[[-212,0,-11],[-248,0,-39]] as [Vec3,Vec3],hands:[[-194,60,-11],[-260,60,-38]] as [Vec3,Vec3],supports:{feet:['floor','floor'],hands:[null,null],pelvis:false},expression:'cheeky',pictureDown:false} as const;
// Pose-local poles/hip offsets route the two far chains around the actual
// chair front. Bone lengths and world support targets are never stretched.
export const heldControls:Record<ControlId,Held>={
 'room-a':{...neutral,view:'A',label:'Whole paper room A · neutral world pose'},
 'room-b':{...neutral,view:'B',label:'Same room and neutral world pose · new lower side B'},
 pull:{view:'A',hips:[95,73,-45],lean:14,armPoles:[[0,-1,0],[0,0,1]],feet:[[103,24,-15],[64,30,-50]],hands:storyChair.grips,supports:{feet:[null,null],hands:['chair','chair'],pelvis:false},expression:'cheeky',pictureDown:false,label:'Arm traction · pelvis hangs below seat · hind paws airborne'},
 proud:{view:'A',hips:[124,144,-72],lean:0,hindRootOffsets:[[10,0,10],[-10,3,6]],hindPoles:[[1,0,.12],[0,0,1]],feet:[[148,94,-35],[111,97,-46]],hands:[[146,151,-42],[107,154,-62]],supports:{feet:[null,null],hands:[null,null],pelvis:true},expression:'proud',pictureDown:false,label:'Proud throne seat · real pelvis support'},
 panic:{view:'B',hips:[128,151,-110],lean:-13,feet:[[146,128,-58],[110,128,-82]],hands:[[180,190,-87],[70,215,-122]],supports:{feet:['seat','seat'],hands:[null,null],pelvis:false},expression:'panic',pictureDown:true,label:'Fright after fallen picture · flat ears and connected bristling fur'},
 land:{view:'B',hips:[-151,32,-20],lean:40,feet:[[-145,0,-2],[-182,0,-29]],hands:[[-86,0,-3],[-111,0,-30]],supports:{feet:['floor','floor'],hands:['floor','floor'],pelvis:false},expression:'panic',pictureDown:true,label:'Low landing absorption · four actual floor pads'},
};
const pawLocal:Point2[]=[[-8,-5],[-4,-7],[4,-7],[8,-4],[11,0],[10,4],[7,7],[0,7],[-3,6],[-8,4],[-10,0]];
const footLocal:Point2[]=[[-9,0],[-11,-3],[-8,-10],[-2,-12],[5,-10],[8,-6],[15,-4],[18,-1],[15,0]];
/** Extrude the authored foot profile across a small real sole width. The
 * camera selects its visible hull, while its world vertices/contact stay fixed.
 * Held baseline drawings retain their original profile exactly. */
function solidFoot(contact:Vec3,heading:number,view:StoryView){
 const co=Math.cos(heading),si=Math.sin(heading),vertices=footLocal.flatMap(([x,y])=>[-6,6].map(z=>[contact[0]+x*co-z*si,contact[1]-y,contact[2]+x*si+z*co]as Vec3));
 const points=vertices.map(world=>({world,screen:viewPoint(world,view)})).sort((a,b)=>a.screen[0]-b.screen[0]||a.screen[1]-b.screen[1]);
 const turn=(a:typeof points[number],b:typeof points[number],c:typeof points[number])=>(b.screen[0]-a.screen[0])*(c.screen[1]-a.screen[1])-(b.screen[1]-a.screen[1])*(c.screen[0]-a.screen[0]);
 const lower:typeof points=[],upper:typeof points=[];for(const p of points){while(lower.length>1&&turn(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}for(const p of[...points].reverse()){while(upper.length>1&&turn(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
 return{vertices,outline:[...lower.slice(0,-1),...upper.slice(0,-1)].map(p=>p.world)};
}
function chain(root:Vec3,end:Vec3,lengths:readonly[number,number],pole:Vec3,view:StoryView,widths:readonly[number,number,number]){
 const joint=solveTwoBone(root,end,...lengths,pole),distance=Math.hypot(...root.map((v,i)=>v-end[i]));
 const cosine=(distance*distance-lengths[0]**2-lengths[1]**2)/(2*lengths[0]*lengths[1]);
 const flexion=Math.acos(Math.max(-1,Math.min(1,cosine)));
 if(flexion<.10||flexion>2.65)throw Error('Authored held chain outside joint limits: '+flexion);
 const screen={root:viewPoint(root,view),joint:viewPoint(joint,view),end:viewPoint(end,view)};
 const shape=limbShape(screen.root,screen.joint,screen.end,widths,{jointSmoothing:.45});
 return{world:{root,joint,end},shape,flexion,lengths};
}
function bodyOutline(at:(x:number,h:number)=>Vec3){return{start:at(-23,43),curves:[
 {key:'shoulders',c1:at(-20,57),c2:at(19,57),to:at(24,43)},
 {key:'front',c1:at(29,30),c2:at(31,3),to:at(22,-5)},
 {key:'rumpRight',c1:at(17,-13),c2:at(5,-16),to:at(0,-16)},
 {key:'rumpLeft',c1:at(-7,-16),c2:at(-20,-12),to:at(-24,-5)},
 {key:'back',c1:at(-31,9),c2:at(-29,29),to:at(-23,43)},
]};}
export function catFrame(c:Held){
 const hips=c.hips,upY=Math.sqrt(catDesign.torso**2-c.lean**2-(c.leanZ??0)**2),shoulders=add(hips,c.lean,upY,c.leanZ??0),f=c.facing??1,s=Math.sqrt(Math.max(0,1-f*f));
 const offset=([x,y,z]:Vec3):Vec3=>[x*f-z*s,y,x*s+z*f];
 const armRoots=([0,1] as const).map(i=>add(shoulders,...offset(c.armRootOffsets?.[i]??[i?-16:16,i?4:-2,i?-10:10])));
 const legRoots=([0,1] as const).map(i=>add(hips,...offset(c.hindRootOffsets?.[i]??[i?-10:10,i?3:0,i?-10:10])));
 const bodyAt=(x:number,h:number):Vec3=>[hips[0]+upY/Math.sqrt(catDesign.torso**2-(c.leanZ??0)**2)*x+c.lean/catDesign.torso*h,hips[1]-c.lean/Math.sqrt(catDesign.torso**2-(c.leanZ??0)**2)*x+upY/catDesign.torso*h,hips[2]+(c.leanZ??0)/catDesign.torso*h];
 return{hips,shoulders,bodyAt,armRoots,legRoots,offset};
}
export function buildCat(c:Held,id:ControlId='room-a'){
 const view=c.view,{hips,shoulders,bodyAt,armRoots,legRoots}=catFrame(c);
 const bodyWorld=bodyOutline(bodyAt);
 const legs=([0,1] as const).map(i=>{
  const contact=c.feet[i],root=legRoots[i],ankle=add(contact,0,8);
  const solved=chain(root,ankle,catDesign.hind,c.hindPoles?.[i]??[1,0,.12],view,[22,19,15]);
  const volume=c.facing===undefined?undefined:solidFoot(contact,c.footHeadings?.[i]??0,view);return{...solved,contact,support:c.supports.feet[i],foot:volume?.outline??footLocal.map(([x,y])=>add(contact,x*Math.cos(c.footHeadings?.[i]??0),-y,x*Math.sin(c.footHeadings?.[i]??0))),footVolume:volume?.vertices};
 });
 const arms=([0,1] as const).map(i=>{
  const contact=c.hands[i],root=armRoots[i],wrist=add(contact,0,7);
  const solved=chain(root,wrist,catDesign.fore,c.armPoles?.[i]??(c.supports.hands[i]==='chair'?[0,-1,0]:[1,0,.15]),view,[19,17,15]);
  return{...solved,contact,support:c.supports.hands[i],paw:pawLocal.map(([x,y])=>add(wrist,x,-y)),wrist};
 });
 const headCentre=add(shoulders,c.headOffset??(id==='pull'?-9:4),36,5),panic=c.expression==='panic';
 let headLocal:Point2[]=panic?[[-49,21],[-57,24],[-52,12],[-61,7],[-53,0],[-57,-8],[-49,-16],[-62,-35],[-32,-27],[-18,-37],[13,-38],[33,-26],[62,-34],[48,-10],[57,-3],[52,6],[61,13],[51,19],[46,29],[25,38],[-3,41],[-29,35]]:[[-49,20],[-53,0],[-47,-21],[-40,-27],[-38,-63],[-13,-38],[11,-39],[38,-61],[43,-25],[51,-13],[54,7],[48,25],[27,37],[-3,41],[-29,35]];
 if(c.fear!==undefined){
  const calm:Point2[]=[[-49,20],[-49,20],[-51,10],[-52,5],[-53,0],[-47,-21],[-40,-27],[-38,-63],[-13,-38],[-1,-38.5],[11,-39],[24.5,-50],[38,-61],[43,-25],[51,-13],[54,7],[52,13],[50,19],[48,25],[27,37],[-3,41],[-29,35]];
  const frightened:Point2[]=[[-49,21],[-57,24],[-52,12],[-61,7],[-53,0],[-57,-8],[-49,-16],[-62,-35],[-32,-27],[-18,-37],[13,-38],[33,-26],[62,-34],[48,-10],[57,-3],[52,6],[61,13],[51,19],[46,29],[25,38],[-3,41],[-29,35]];
  const calmLeft:Point2[]=[[-54,23],[-54,23],[-59,14],[-57,4],[-46,-8],[-35,-26],[-32,-30],[-29,-61],[-9,-37],[6,-38],[16,-38],[27,-51],[43,-59],[44,-24],[50,-8],[51,10],[50,16],[46,22],[40,30],[20,38],[-9,40],[-34,34]];
  const frightenedLeft:Point2[]=[[-54,23],[-60,26],[-60,14],[-63,6],[-48,-5],[-46,-14],[-38,-24],[-53,-36],[-28,-29],[-14,-37],[10,-38],[30,-27],[58,-32],[47,-8],[54,0],[50,7],[58,15],[49,20],[42,29],[20,38],[-9,40],[-34,34]],turn=Math.max(0,Math.min(1,-(c.headTurn??0)));
  headLocal=calm.map((q,i)=>{const u=i<=5||i>=14?(c.bristle??c.fear!):c.fear!,a:Point2=[q[0]+(calmLeft[i][0]-q[0])*turn,q[1]+(calmLeft[i][1]-q[1])*turn],b:Point2=[frightened[i][0]+(frightenedLeft[i][0]-frightened[i][0])*turn,frightened[i][1]+(frightenedLeft[i][1]-frightened[i][1])*turn];return[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u];});
 }
 const headAt=([x,y]:Point2):Vec3=>add(headCentre,x,-y);
 const pelvisContact=bodyAt(0,-16),tailBase=add(bodyAt(-22*(c.facing??1),4),0,0,-22*Math.sqrt(Math.max(0,1-(c.facing??1)**2)));
 return{id,...c,hips,shoulders,bodyAt,bodyWorld,headCentre,headLocal,headAt,headWorld:headLocal.map(headAt),legs,arms,pelvisContact,tailBase,catDesign};
}
export function controlPose(id:ControlId,viewOverride?:StoryView){return buildCat({...heldControls[id],view:viewOverride??heldControls[id].view},id);}
export type StoryControlPose=ReturnType<typeof buildCat>;
