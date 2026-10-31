import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import type {Vec3,Point2} from '../../core/spatial';
import {type AffineView,type Frame3,affineProject,affineDepth,affineViewRay,facingSide,cross3,sub3,
 vectorFromFrame3,pointInFrame3,yawFrame3,add3,scale3,dot3} from '../../core/frame3';
import {visibleTriangleFragments} from '../../core/paper-visibility';
import {fillPaperFragments} from '../../core/paper-fill';
import {sampleStep} from '../../core/contacts';
import {clamp,smooth,mix} from '../../core/time';
import {buildSpatialCat,pitchedFrame,relaxedHand,type SpatialCat,type ColoredTriangle} from './spatial-model';
import {spatialClimbState} from './spatial-climb';
import {cameraAt,frameAt,framePoint,frameTimes} from './environment';
import {picture,storyChair,boxFaces} from './world';
export const spatialProbeIds=['body-turn','head-only','arm-crossing','camera-change','picture-flip','landing-pads','climb-back'] as const;
export type SpatialProbeId=typeof spatialProbeIds[number];
const lengths:Record<SpatialProbeId,number>={'body-turn':168,'head-only':96,'arm-crossing':144,'camera-change':72,'picture-flip':84,'landing-pads':72,'climb-back':120};
const ease=(t:number,a:number,b:number)=>smooth(clamp((t-a)/(b-a)));
const lerp3=(a:Vec3,b:Vec3,u:number):Vec3=>a.map((v,i)=>mix(v,b[i],u)) as Vec3;
function aimedPlane(body:Frame3,root:Vec3,end:Vec3,reference=0,range:readonly[number,number]=[-1.45,1.45]){
 const d=vectorFromFrame3(body,sub3(end,pointInFrame3(body,root)));
 if(Math.hypot(d[0],d[2])<1e-8)return reference;
 const raw=Math.atan2(d[0],d[2]),candidates=Array.from({length:7},(_,i)=>raw+(i-3)*Math.PI).filter(v=>v>=range[0]-1e-9&&v<=range[1]+1e-9);
 if(!candidates.length)throw Error('Authored shoulder/hip plane outside its directed range');
 return candidates.reduce((best,v)=>Math.abs(v-reference)<Math.abs(best-reference)?v:best);
}
function standing(yaw=0,headYaw=0,feetOverride?:[Vec3,Vec3],handsOverride?:[Vec3,Vec3],shoulderYaw:readonly[number,number]=[0,0],gaze:Point2=[2,3],footYaw?:readonly[number,number]){
 const body=yawFrame3([0,57,0],yaw),feet=feetOverride??([0,1] as const).map(i=>pointInFrame3(body,[i?-15:15,-57,8])) as [Vec3,Vec3];
 const hands=handsOverride??[relaxedHand(body,0,-.3,.6,shoulderYaw[0]),relaxedHand(body,1,-.3,.6,shoulderYaw[1])];
 return buildSpatialCat({body,headYaw,gaze,feet,hands,shoulderYaw,
 hipYaw:feet.map((p,i)=>aimedPlane(body,[i?-12:12,0,0],add3(p,[0,8,0]))) as [number,number],footYaw:footYaw??[yaw,yaw]});
}
export function spatialProbePose(id:SpatialProbeId,time:number){
 let cat:SpatialCat|undefined,view:AffineView={yaw:-.15,elevation:.22,scale:2.65,origin:[640,660]},environmentTime=0,chair=false,pictureOnly=false;
 let diagnosticSide:AffineView|undefined;
 if(id==='body-turn'){
  const stepAngle=Math.PI/6,period=.8,start=.6;
  const yaw=stepAngle*Array.from({length:6},(_,i)=>ease(time,start+i*period,start+i*period+.62)).reduce((s,v)=>s+v,0);
  const body=yawFrame3([0,57,0],yaw);
  const headings:[number,number]=[0,0];
  const feet=([0,1] as const).map(side=>{
   let contact=pointInFrame3(yawFrame3([0,0,0],0),[side?-15:15,0,8]);
   for(let i=0;i<6;i++){
    const from=pointInFrame3(yawFrame3([0,0,0],i*stepAngle),[side?-15:15,0,8]);
    const to=pointInFrame3(yawFrame3([0,0,0],(i+1)*stepAngle),[side?-15:15,0,8]);
    const a=start+i*period+side*.3,b=a+.27;
    if(time<a)break;
    const step=sampleStep(time,{start:a,end:b,from:[from[0],from[2]],to:[to[0],to[2]],lift:0,fromHeading:i*stepAngle,toHeading:(i+1)*stepAngle});
    const h=8*16*step.progress**2*(1-step.progress)**2;
    contact=[step.position[0],h,step.position[1]];headings[side]=step.heading;
   }
   return contact;
  }) as [Vec3,Vec3];
  cat=standing(yaw,0,feet,undefined,[0,0],[2,3],headings); // Pure explicitly lifted turn contacts, no ground sliding.
 }else if(id==='head-only'){
  const headYaw=1.7*(ease(time,.5,1.5)-ease(time,2.4,3.4));
  cat=standing(.32,headYaw,undefined,undefined,[0,0],[2+4*ease(time,1.7,2.1),3]);
 }else if(id==='arm-crossing'){
  const body=yawFrame3([0,57,0],.32);
  // Route the whole chain outside the torso: first extend forward, then cross;
  // uncross before swinging behind. A palm visible through an intersected chest is invalid.
  const lift=ease(time,.6,1.5),cross=ease(time,1.5,2.2),uncross=ease(time,2.8,3.4),lower=ease(time,3.4,4.3),behind=ease(time,4.3,5);
  const upper=mix(-.65,1.05,lift)-2.05*lower,flex=mix(.5,.7,lift)-.4*lower,shoulder=-.5*cross+.5*uncross+.45*behind;
  const hand=relaxedHand(body,0,upper,flex,shoulder);
  cat=standing(.32,0,undefined,[hand,relaxedHand(body,1)],[shoulder,0]);
 }else if(id==='camera-change'){
  environmentTime=17+Math.min(3,time);view=cameraAt(environmentTime);chair=true;
  const body=yawFrame3([124,144,-92],0);
  cat=buildSpatialCat({body,headYaw:0,feet:[[136,128,-62],[112,128,-62]],hands:[relaxedHand(body,0,-.5,1.2),relaxedHand(body,1,-.5,1.2)],shoulderYaw:[0,0],footYaw:[0,0]});
 }else if(id==='picture-flip'){
  environmentTime=20+time;pictureOnly=true;view={yaw:.38,elevation:.26,scale:1.55,origin:[155,650]};
 }else if(id==='landing-pads'){
  // Same body/actual mesh in both main and optional side view, not a substitute skeleton.
  const elapsed=time,hind=.7,fore=.81,compression=ease(elapsed,hind,.81),settle=ease(elapsed,1.2,1.55);
  const height=elapsed<hind?28*(1-(elapsed/hind)**2):0;
  const hips:Vec3=[-144,mix(48,42,compression)+2*settle+height,-20],pitch=.90+.20*compression;
  const body=pitchedFrame(hips,-Math.PI/2,pitch);
  const feet:[[number,number,number],[number,number,number]]=[[-144,height,-8],[-144,height,-32]];
  const preHandLift=elapsed<fore?12*(1-ease(elapsed,hind,fore)):0;
  const hands:[Vec3,Vec3]=[[-195,height+preHandLift,-1],[-195,height+preHandLift,-39]];
  cat=buildSpatialCat({body,headYaw:0,headPitch:-.45,fear:1,feet,hands,
   shoulderYaw:hands.map((p,i)=>aimedPlane(body,[i?-27:27,46,0],add3(p,[0,7,0]))) as [number,number],
   hipYaw:feet.map((p,i)=>aimedPlane(body,[i?-12:12,0,0],add3(p,[0,8,0]))) as [number,number],
   footYaw:[-Math.PI/2,-Math.PI/2],floorHands:true,shoulderRoll:[0,0]});
  view={yaw:.38,elevation:.14,scale:2.6,origin:[1045,645]};
  diagnosticSide={yaw:0,elevation:0,scale:2.6,origin:[1045,645]};
 }else if(id==='climb-back'){
  chair=true;environmentTime=6.3+time;view={yaw:-.22,elevation:.3,scale:1.65,origin:[440,670]};
  cat=buildSpatialCat(spatialClimbState(time).request);
  diagnosticSide={yaw:Math.PI/2,elevation:0,scale:1.65,origin:[640,670]};

 }
 return {id,time,cat,view,environmentTime,chair,pictureOnly,diagnosticSide};
}
export type SpatialProbePose=ReturnType<typeof spatialProbePose>;
function poly(g:Graphics,p:readonly Point2[],color:number){if(p.length>=3)g.poly(p.flat()).fill(color);}
function worldPoly(g:Graphics,p:readonly Vec3[],view:AffineView,color:number){poly(g,p.map(v=>affineProject(v,view)),color);}
/** Bounded example renderer: actual authored opaque paper triangles, shared depth clipping.
 * Screen bounds only prune disjoint pairs; no average-depth or shoulder sorting decides visibility. */
export function drawSpatialCat(g:Graphics,cat:SpatialCat,view:AffineView){
 const prepared=cat.triangles.map(t=>{const p=t.vertices.map(v=>affineProject(v,view));return{t,p,b:[Math.min(...p.map(p=>p[0])),Math.min(...p.map(p=>p[1])),Math.max(...p.map(p=>p[0])),Math.max(...p.map(p=>p[1]))],fragments:[] as Point2[][]};});
 for(const a of prepared){
  const candidates=prepared.filter(b=>b!==a&&b.b[0]<a.b[2]&&b.b[2]>a.b[0]&&b.b[1]<a.b[3]&&b.b[3]>a.b[1]).map(b=>b.t);
  a.fragments=visibleTriangleFragments(a.t,candidates,view,1e-5);

 }
 fillPaperFragments(g,prepared.flatMap(a=>a.fragments.map(points=>({color:a.t.color,points}))),{seamCoveragePx:.55});
 // Draw only original limb silhouette edges, clipped to the same visible fragments.
 // Never stroke triangulation/depth-cut borders; no contour appears through the torso.
 type Edge={a:Vec3;b:Vec3;faces:typeof prepared};const edges=new Map<string,Edge>(),ray=affineViewRay(view);
 const key=(p:Vec3)=>p.map(v=>v.toFixed(7)).join(',');
 for(const face of prepared){if(!/^(left|right)\/(arm|leg)\/(upper|lower|joint|paw|foot)/.test(face.t.owner)||face.t.owner.includes('/toe-'))continue;
  for(let i=0;i<3;i++){const a=face.t.vertices[i],b=face.t.vertices[(i+1)%3],ka=key(a),kb=key(b),id=ka<kb?`${ka}|${kb}`:`${kb}|${ka}`;
   const edge=edges.get(id);if(edge)edge.faces.push(face);else edges.set(id,{a,b,faces:[face]});
  }
 }
 const lineInterval=(a:Point2,b:Point2,p:Point2[]):[number,number]|null=>{
  const area=p.reduce((s,v,i)=>{const n=p[(i+1)%p.length];return s+v[0]*n[1]-n[0]*v[1];},0),sign=Math.sign(area);let low=0,high=1;
  for(let i=0;i<p.length;i++){
   const v=p[i],n=p[(i+1)%p.length],value=(q:Point2)=>sign*((n[0]-v[0])*(q[1]-v[1])-(n[1]-v[1])*(q[0]-v[0]))+.0001,
    da=value(a),db=value(b);
   if(da<0&&db<0)return null;
   if((da>=0)!==(db>=0)){const t=da/(da-db);if(da<0)low=Math.max(low,t);else high=Math.min(high,t);}
   if(low>high)return null;
  }
  return [low,high];
 };
 for(const edge of edges.values()){
  if(edge.faces.some(f=>/\/(root|end)$/.test(f.t.owner)))continue;
  const signs=edge.faces.map(f=>dot3(cross3(sub3(f.t.vertices[1],f.t.vertices[0]),sub3(f.t.vertices[2],f.t.vertices[0])),ray));
  if(edge.faces.length>1&&!(signs.some(v=>v>1e-8)&&signs.some(v=>v < -1e-8)))continue;
  const a=affineProject(edge.a,view),b=affineProject(edge.b,view),intervals=edge.faces.flatMap(f=>f.fragments.map(p=>lineInterval(a,b,p)).filter((v):v is [number,number]=>!!v)).sort((x,y)=>x[0]-y[0]);
  const merged:[number,number][]=[];for(const interval of intervals){const prev=merged.at(-1);if(prev&&prev[1]>=interval[0]-.0001)prev[1]=Math.max(prev[1],interval[1]);else merged.push([...interval]);}
  for(const [low,high]of merged){if(high-low<1e-5)continue;g.moveTo(mix(a[0],b[0],low),mix(a[1],b[1],low)).lineTo(mix(a[0],b[0],high),mix(a[1],b[1],high)).stroke({color:0x202630,alpha:.45,width:Math.max(.7,view.scale*.42),cap:'round',join:'round'});}
 }
}

function drawChair(g:Graphics,view:AffineView){
 const cube=(x:number,y:number,z:number,w:number,h:number,d:number)=>{const f=boxFaces(x,y,z,w,h,d);worldPoly(g,view.yaw<0?f.right:f.left,view,0x98433d);worldPoly(g,f.front,view,0xb95045);worldPoly(g,f.top,view,0xdd8766);};
 for(const l of storyChair.legs)cube(l.x-6,0,l.z-5,12,l.h,10);
 cube(45,158,-177,160,87,12);cube(40,118,-175,170,10,120);
}
export function drawSpatialPicture(g:Graphics,view:AffineView,time:number){
 const state=frameAt(time),n=cross3([...state.basisU],[...state.basisV]),side=facingSide(n,affineViewRay(view),1e-5),w=picture.width/2,h=picture.height/2,t=picture.frame;
 const at=(x:number,y:number):Vec3=>[...framePoint(state,x,y)];
 const rect=(l:number,b:number,r:number,top:number,color:number)=>worldPoly(g,[at(l,b),at(r,b),at(r,top),at(l,top)],view,color);
 // Actual edge thickness is scene art; front/back selection uses the exact projection ray.
 const outward=scale3(n,3),back=state.corners.map(p=>sub3([...p],outward));
 for(let i=0;i<4;i++)worldPoly(g,[[...state.corners[i]],[...state.corners[(i+1)%4]],back[(i+1)%4],back[i]],view,0x62442f);
 rect(-w-t,-h-t,w+t,h+t,0x805035);
 if(side==='front'){
  rect(-w-5,-h-5,w+5,h+5,0xc49a66);rect(-w,-h,w,h,0xe9d1a2);
  worldPoly(g,[at(-w,-9),at(-30,27),at(16,-5),at(51,30),at(w,3),at(w,-h),at(-w,-h)],view,0x8caa87);
  worldPoly(g,[at(-w,-28),at(-15,4),at(45,-24),at(w,-10),at(w,-h),at(-w,-h)],view,0x5d877c);
  worldPoly(g,Array.from({length:18},(_,i)=>at(45+14*Math.cos(i*Math.PI/9),29+14*Math.sin(i*Math.PI/9))),view,0xcf8650);
 }else if(side==='back'){
  rect(-w,-h,w,h,0x9b8a6a);rect(-w+8,-h+8,w-8,h-8,0x8b7d64);
  // Mounting strips/staples distinguish the opaque cardboard back without a text label.
  for(const x of [-65,65])for(const y of [-43,43])rect(x-4,y-1.4,x+4,y+1.4,0x4f514b);
  rect(-3,-h+8,3,h-8,0xa39473);
 }
 rect(-w-t,h,w+t,h+t,0xa8784c);rect(-w-t,-h-t,w+t,-h,0x754a33);rect(-w-t,-h,-w,h,0x98623c);rect(w,-h,w+t,h,0x8a5938);
}
export function createSpatialProbeScene(id:SpatialProbeId,options:{side?:boolean;diagnostic?:boolean}={}):SceneDefinition<SpatialProbePose,{paper:Graphics}>{return{
 settings:{width:1280,height:720,fps:24,durationInFrames:lengths[id],background:0x94bca7},pose:t=>spatialProbePose(id,t),
 createDrawing(root){const paper=new Graphics();root.addChild(paper);return{paper};},
 draw({paper:g},p){
  g.clear();const view=options.side&&p.diagnosticSide?p.diagnosticSide:p.view;
  g.rect(0,0,1280,720).fill(0x94bca7);
  worldPoly(g,[[-1800,0,-210],[1800,0,-210],[1800,0,1800],[-1800,0,1800]],view,0xb6afa8);
  for(let z=-180;z<1000;z+=100){const a=affineProject([-1800,0,z],view),b=affineProject([1800,0,z],view);g.moveTo(...a).lineTo(...b).stroke({color:0x93928e,width:1,alpha:.35});}
  if(options.side){const y=affineProject([0,0,0],view)[1];g.moveTo(0,y).lineTo(1280,y).stroke({color:0x4e5652,width:2});}
  if(p.chair)drawChair(g,view);
  if(p.pictureOnly)drawSpatialPicture(g,view,p.environmentTime);
  if(p.cat){drawSpatialCat(g,p.cat,view);
   if(options.diagnostic)for(const [i,b] of p.cat.bones.entries()){
    const points=[b.root,b.joint,b.end].map(v=>affineProject(v,view)),color=[0xff5555,0x3355ff,0xffcc00,0x00aa88][i];
    g.moveTo(...points[0]).lineTo(...points[1]).lineTo(...points[2]).stroke({color,width:2});for(const q of points)g.circle(...q,3).fill(color);
   }
  }
 },
};}
