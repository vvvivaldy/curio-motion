/** Candidate repair model. Whole authored paper forms; no reference textures or V1 changes.
 * The same surfaces supply drawing, occlusion and pad/clearance evidence. */
import type {Vec3,Point2} from '../../core/spatial';
import {type Frame3,type AnatomicalSide,composeFrame3,yawFrame3,pointInFrame3,vectorInFrame3,vectorFromFrame3,
 add3,sub3,scale3,cross3,unit3,dot3,validateFrame3} from '../../core/frame3';
import {solveHingeLimb} from '../../core/hinge';
import type {PaperTriangle3} from '../../core/paper-visibility';
import {eyeShape,clipConvex} from '../../core/eye';
export interface ColoredTriangle extends PaperTriangle3 {color:number}
export interface SpatialCatRequest {
 body:Frame3;headYaw:number;headPitch?:number;neckPitch?:number;gaze?:Point2;fear?:number;
 jointFrames?:{arms?:readonly[Frame3,Frame3];legs?:readonly[Frame3,Frame3]};
 handFrames?:readonly[Frame3,Frame3];
 feet:readonly [Vec3,Vec3];hands:readonly [Vec3,Vec3];
 /** Authored shoulder rotation about body up: each strict elbow has its own local frame. */
 shoulderYaw:readonly [number,number];shoulderRoll?:readonly [number,number];hipYaw?:readonly [number,number];
 footYaw?:readonly [number,number];floorHands?:boolean;
 /** Optional authored morph for the same paw during airborne/floor transitions. Defaults preserve all control drawings. */
 floorHandBlend?:number;
 /** Optional authored tail heading in body space; original control poses keep -.35. */
 tailYaw?:number;
 /** Optional wrist anchor in the same real local paw frame used by its artwork. */
 handWristLocal?:readonly [Vec3,Vec3];
}
export const anatomySides:readonly AnatomicalSide[]=['left','right'];
const torsoLevels=[[-16,14,12],[0,24,18],[24,29,21],[43,24,17],[52,10,10]];
export const torsoLocalRings:Vec3[][]=torsoLevels.map(([h,w,d])=>Array.from({length:12},(_,i)=>[w*Math.cos(i*Math.PI/6),h,d*Math.sin(i*Math.PI/6)]));
/** Actual drawn dimensions, plus explicit authored swing calibration (.9 of .45rad). */
export const spatialCatRunArm={upper:32,backDepth:Math.max(...torsoLocalRings.flat().map(p=>-p[2])),referenceSwing:.405} as const;
const colors={cat:0x3b3e46,side:0x343944,back:0x303640,light:0x484b54,belly:0xb4b5a8,muzzle:0xd0cdbc,eye:0xf4f0df,ink:0x20242b};
export function pitchedFrame(origin:Vec3,yaw:number,pitch:number):Frame3{
 const c=Math.cos(pitch),s=Math.sin(pitch);
 return composeFrame3(yawFrame3(origin,yaw),{origin:[0,0,0],x:[1,0,0],y:[0,c,s],z:[0,-s,c]});
}
/** Forward authored arm pose, with its own shoulder plane; signed elbow flexion is negative. */
function rollFrame(angle:number):Frame3{const c=Math.cos(angle),s=Math.sin(angle);return{origin:[0,0,0],x:[c,s,0],y:[-s,c,0],z:[0,0,1]};}
export function shoulderFrame(body:Frame3,origin:Vec3,yaw:number,roll:number){return composeFrame3(composeFrame3(body,yawFrame3(origin,yaw)),rollFrame(roll));}
export function relaxedHand(body:Frame3,side:0|1,upperAngle=-.3,flexion=.6,shoulderYaw=0,shoulderRoll=side?-.18:.18):Vec3{
 const frame=shoulderFrame(body,[side?-27:27,46,0],shoulderYaw,shoulderRoll);
 const local:Vec3=[0,-32*Math.cos(upperAngle)-29*Math.cos(upperAngle+flexion),32*Math.sin(upperAngle)+29*Math.sin(upperAngle+flexion)];
 return add3(pointInFrame3(frame,local),[0,-7,0]);
}
const headOutline:Point2[]=[[-49,20],[-53,0],[-47,-21],[-40,-27],[-13,-38],[11,-39],[43,-25],[51,-13],[54,7],[48,25],[27,37],[-3,41],[-29,35]];
// Explicit whole front/profile/back volume: front cap, angular side silhouette, back cap.
// Eyes/muzzle belong only to the front cap. The back is deliberately undecorated charcoal.
export function buildSpatialCat(r:SpatialCatRequest){
 validateFrame3(r.body);
 const body=r.body;
 const head=r.neckPitch===undefined?composeFrame3(body,composeFrame3(yawFrame3([0,83,2],r.headYaw),pitchedFrame([0,0,0],0,r.headPitch??0))):
  composeFrame3(body,composeFrame3(pitchedFrame([0,49,0],0,r.neckPitch),composeFrame3(yawFrame3([0,34,2],r.headYaw),pitchedFrame([0,0,0],0,r.headPitch??0))));
 const triangles:ColoredTriangle[]=[],bones:{id:string;root:Vec3;joint:Vec3;end:Vec3;signedFlexion:number;normal:Vec3}[]=[],pads:{id:string;vertices:Vec3[];contact:Vec3}[]=[];
 const tri=(id:string,owner:string,v:readonly[Vec3,Vec3,Vec3],color:number,rank=0)=>{
  if(Math.hypot(...cross3(sub3(v[1],v[0]),sub3(v[2],v[0])))>1e-10)triangles.push({id:`${owner}/${id}`,owner,vertices:v,color,coplanarRank:rank});
 };
 const polygon=(owner:string,verts:Vec3[],color:number,rank=0)=>{for(let i=1;i<verts.length-1;i++)tri(String(i),owner,[verts[0],verts[i],verts[i+1]],color,rank);};
 const quad=(id:string,a:Vec3,b:Vec3,c:Vec3,d:Vec3,color:number)=>polygon(id,[a,b,c,d],color);
 // Small drawn paper solids; geometry remains authored here, not inferred by core.
 const capsule=(id:string,a:Vec3,b:Vec3,ra:number,rb:number,reference:Vec3,color:number)=>{
  const along=unit3(sub3(b,a)),side=unit3(cross3(along,reference)),front=unit3(cross3(side,along));
  const ring=(at:Vec3,radius:number)=>Array.from({length:8},(_,i)=>add3(at,add3(scale3(side,radius*Math.cos(i*Math.PI/4)),scale3(front,radius*Math.sin(i*Math.PI/4)))));
  const av=ring(a,ra),bv=ring(b,rb);
  for(let i=0;i<8;i++)quad(`${id}/side-${i}`,av[i],av[(i+1)%8],bv[(i+1)%8],bv[i],color);
  polygon(`${id}/root`,[...av].reverse(),color);polygon(`${id}/end`,bv,color);
 };
 const ball=(id:string,c:Vec3,rx:number,ry:number,rz:number,frame:Frame3,color:number)=>{
  const levels=[[-1,0],[-.6,.8],[0,1],[.6,.8],[1,0]];
  const rings=levels.map(([h,r])=>Array.from({length:10},(_,i)=>add3(c,vectorInFrame3(frame,[rx*r*Math.cos(i*Math.PI/5),ry*h,rz*r*Math.sin(i*Math.PI/5)]))));
  for(let j=0;j<rings.length-1;j++)for(let i=0;i<10;i++)quad(`${id}/${j}-${i}`,rings[j][i],rings[j][(i+1)%10],rings[j+1][(i+1)%10],rings[j+1][i],color);
 };
 // Torso shell uses the same local basis at every height, including pelvis and shoulder roots.
 const rings=torsoLocalRings.map(ring=>ring.map(p=>pointInFrame3(body,p)));
 const bodyFaces:ColoredTriangle[]=[];
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<12;i++){
  const before=triangles.length;
  quad(`torso/${j}-${i}`,rings[j][i],rings[j][(i+1)%12],rings[j+1][(i+1)%12],rings[j+1][i],i<6?colors.cat:colors.back);
  bodyFaces.push(...triangles.slice(before));
 }
 polygon('torso/top',rings.at(-1)!,colors.cat);polygon('torso/bottom',[...rings[0]].reverse(),colors.back);
 // Interpolate depth from the actual triangulated shell/cap, never a parallel proxy surface.
 function onSurface(local:Point2,faces:readonly {vertices:readonly[Vec3,Vec3,Vec3]}[],frame:Frame3):Vec3{
  let z=-Infinity;
  for(const face of faces){
   const p=face.vertices.map(v=>vectorFromFrame3(frame,sub3(v,frame.origin))),[a,b,c]=p;
   const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-10)continue;
   const u=((b[1]-c[1])*(local[0]-c[0])+(c[0]-b[0])*(local[1]-c[1]))/det;
   const v=((c[1]-a[1])*(local[0]-c[0])+(a[0]-c[0])*(local[1]-c[1]))/det;
   if(u>=-1e-7&&v>=-1e-7&&u+v<=1+1e-7)z=Math.max(z,u*a[2]+v*b[2]+(1-u-v)*c[2]);
  }
  if(!Number.isFinite(z))throw Error('Authored feature outside its drawn surface: '+local);
  return pointInFrame3(frame,[local[0],local[1],z+.12]);
 }
 const belly=Array.from({length:24},(_,i)=>[17*Math.cos(i*Math.PI/12),18+24*Math.sin(i*Math.PI/12)] as Point2);
 // Fan with sampled actual surface (the cream patch wraps instead of floating in front).
 const surfacePatch=(id:string,p:Point2[],at:(p:Point2)=>Vec3,color:number,
   surface?:{faces:readonly ColoredTriangle[];frame:Frame3;screenY:boolean;lift:number})=>{
  const centre:Point2=[p.reduce((s,q)=>s+q[0],0)/p.length,p.reduce((s,q)=>s+q[1],0)/p.length];
  if(!surface){for(let i=0;i<p.length;i++)tri(String(i),id,[at(centre),at(p[i]),at(p[(i+1)%p.length])],color,2);return;}
  // A decal is clipped to each actual shell triangle before lifting. Merely sampling its
  // perimeter would put the intervening chords underneath a convex faceted shell.
  for(const face of surface.faces){
   const local=face.vertices.map(v=>vectorFromFrame3(surface.frame,sub3(v,surface.frame.origin)));
   if(local.reduce((s,v)=>s+v[2],0)<-1e-8)continue;
   const boundary=local.map(v=>[v[0],surface.screenY?-v[1]:v[1]] as Point2),[a,b,c]=local;
   const det=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(det)<1e-10)continue;
   const map=([x,sy]:Point2):Vec3=>{
    const y=surface.screenY?-sy:sy,u=((b[1]-c[1])*(x-c[0])+(c[0]-b[0])*(y-c[1]))/det,
      v=((c[1]-a[1])*(x-c[0])+(a[0]-c[0])*(y-c[1]))/det;
    return pointInFrame3(surface.frame,[x,y,u*a[2]+v*b[2]+(1-u-v)*c[2]+surface.lift]);
   };
   for(let i=0;i<p.length;i++){
    const clipped=clipConvex([centre,p[i],p[(i+1)%p.length]],boundary);
    if(clipped.length>=3)polygon(`${id}/${face.id}/${i}`,clipped.map(map),color,2);
   }
  }
 };
 surfacePatch('belly',belly,p=>onSurface(p,bodyFaces,body),colors.belly,{faces:bodyFaces,frame:body,screenY:false,lift:.12});
 // Neck is connected spatial geometry and shares the trunk orientation.
 capsule('neck',pointInFrame3(body,[0,44,-4]),pointInFrame3(head,[0,-24,-3]),11,8,body.z,colors.cat);
 // Angular characteristic head with distinct drawn front/back and small side shell.
 const frontCentre=pointInFrame3(head,[0,0,38]),backCentre=pointInFrame3(head,[0,0,-35]);
 const frontFaces:ColoredTriangle[]=[];
 const edge=headOutline.map(([x,y])=>pointInFrame3(head,[x,-y,0]));
 const frontRing=headOutline.map(([x,y])=>pointInFrame3(head,[x*.72,-y*.72,32]));
 const backRing=headOutline.map(([x,y])=>pointInFrame3(head,[x*.75,-y*.75,-28]));
 for(let i=0;i<edge.length;i++){
  const n=(i+1)%edge.length,before=triangles.length;
  tri(`cap-${i}`,'head/front',[frontCentre,frontRing[i],frontRing[n]],colors.cat);
  quad(`head/front-side-${i}`,frontRing[i],edge[i],edge[n],frontRing[n],colors.cat);
  frontFaces.push(...triangles.slice(before));
  tri(`cap-${i}`,'head/back',[backCentre,backRing[n],backRing[i]],colors.back);
  quad(`head/back-side-${i}`,backRing[n],edge[n],edge[i],backRing[i],colors.back);
 }
 const fear=r.fear??0;
 if(!Number.isFinite(fear)||fear<0||fear>1)throw new RangeError('Authored fear must be within0..1');
 for(const side of [-1,1]){
  const calm:Point2[]=[[side*16,31],[side*38,63],[side*43,23]],flat:Point2[]=[[side*23,28],[side*60,33],[side*45,7]];
  const outer=calm.map((p,i)=>[p[0]+(flat[i][0]-p[0])*fear,p[1]+(flat[i][1]-p[1])*fear] as Point2);
  const faces=[-6,6].map(z=>outer.map(([x,y],i)=>pointInFrame3(head,[x,y,i===1?(fear===0?0:z*fear):z])));
  polygon(`ear/${side}/front`,faces[1],colors.cat);polygon(`ear/${side}/back`,[...faces[0]].reverse(),colors.back);
  for(let i=0;i<3;i++)quad(`ear/${side}/edge${i}`,faces[0][i],faces[0][(i+1)%3],faces[1][(i+1)%3],faces[1][i],colors.side);
 }
 const headDecal={faces:frontFaces,frame:head,screenY:true,lift:.12};
 const headSurface=(p:Point2)=>onSurface([p[0],-p[1]],frontFaces,head);
 const ellipse=(x:number,y:number,rx:number,ry:number,n=24):Point2[]=>Array.from({length:n},(_,i)=>[x+rx*Math.cos(i*2*Math.PI/n),y+ry*Math.sin(i*2*Math.PI/n)]);
 surfacePatch('muzzle',ellipse(2,20,23,12),headSurface,colors.muzzle,headDecal);
 for(const side of [-1,1]){
  const centre:Point2=[side*20,-3],gaze=r.gaze??[2,3];
  const eye=eyeShape({center:centre,radius:[18,22],openness:.6+.4*fear,pupil:{center:[centre[0]+gaze[0],centre[1]+gaze[1]],radius:[3.4,4.5]}});
  surfacePatch(`eye/${side}`,eye.aperture,headSurface,colors.eye,headDecal);
  const pupil=clipConvex(ellipse(centre[0]+gaze[0],centre[1]+gaze[1],3.4,4.5),eye.aperture);
  if(pupil.length)surfacePatch(`pupil/${side}`,pupil,p=>add3(headSurface(p),vectorInFrame3(head,[0,0,.13])),colors.ink,{...headDecal,lift:.25});
 }
 surfacePatch('nose',[[0,8],[8,8],[5,13]],p=>add3(headSurface(p),vectorInFrame3(head,[0,0,.18])),0x555052,{...headDecal,lift:.3});
 // Same six authored landmarks: the calm ribbon opens into a small surprised oval.
 // Only the face-local shape changes; its existing conformal surface attachment stays.
 const calmMouth:Point2[]=[[-6,23],[1,25],[12,21],[9,24],[1,27],[-6,25]];
 const openMouth:Point2[]=Array.from({length:6},(_,i)=>{const angle=(-150+60*i)*Math.PI/180;return[2+6*Math.cos(angle),24+7*Math.sin(angle)];});
 const mouth=calmMouth.map((p,i)=>[p[0]+(openMouth[i][0]-p[0])*fear,p[1]+(openMouth[i][1]-p[1])*fear] as Point2);
 surfacePatch('mouth',mouth,p=>add3(headSurface(p),vectorInFrame3(head,[0,0,.18])),0x555151,{...headDecal,lift:.3});
 const surfaceStroke=(id:string,a:Point2,b:Point2,width:number,color:number)=>{
  const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy),x=-dy/length*width/2,y=dx/length*width/2;
  surfacePatch(id,[[a[0]+x,a[1]+y],[b[0]+x,b[1]+y],[b[0]-x,b[1]-y],[a[0]-x,a[1]-y]],headSurface,color,{...headDecal,lift:.35});
 };
 if(fear<.7){surfaceStroke('brow/left',[-31,-24],[-9,-19],2.1,0x232730);surfaceStroke('brow/right',[8,-21],[30,-25],2.1,0x232730);}
 for(const side of [-1,1])for(const y of [12,18])surfaceStroke(`whisker/${side}/${y}`,[side*28,y],[side*43,y+(y===12?-2:1)],1.1,0x5c6063);
 // Whole curled tail, with explicit depth and a continuous attachment to the back of pelvis.
 const tail:Point2[]=[[0,0],[-24,-3],[-46,8],[-54,25],[-51,44],[-40,46],[-38,34],[-42,23],[-36,16],[-20,11],[0,12]];
 const tailFrame=composeFrame3(body,yawFrame3([-18,2,-15],r.tailYaw??-.35));
 // Strip rather than a fan across the concave curl.
 const tailOuter=tail.slice(0,5),tailInner=[tail[10],tail[9],tail[8],tail[7],tail[6]];
 for(let i=0;i<4;i++)quad(`tail/${i}`,pointInFrame3(tailFrame,[...tailOuter[i],0]),pointInFrame3(tailFrame,[...tailOuter[i+1],0]),pointInFrame3(tailFrame,[...tailInner[i+1],0]),pointInFrame3(tailFrame,[...tailInner[i],0]),colors.back);
 // Fixed anatomical sides, independent of camera and relative head yaw.
 for(const side of [0,1] as const){
  const name=anatomySides[side],x=side?-27:27;
  for(const kind of ['arm','leg'] as const){
   const isArm=kind==='arm',origin:Vec3=isArm?[x,46,0]:[side?-12:12,0,0];
   const authoredFrame=isArm?r.jointFrames?.arms?.[side]:r.jointFrames?.legs?.[side];
   if(authoredFrame&&Math.hypot(...sub3(authoredFrame.origin,pointInFrame3(body,origin)))>1e-7)throw Error('Joint frame must stay attached to its body root');
   const jointFrame=authoredFrame??(isArm?shoulderFrame(body,origin,r.shoulderYaw[side],r.shoulderRoll?.[side]??(side?-.18:.18)):composeFrame3(body,yawFrame3(origin,r.hipYaw?.[side]??0)));
   const contact=isArm?r.hands[side]:r.feet[side];
   const padFrame=isArm&&r.handFrames?r.handFrames[side]:yawFrame3(contact,r.footYaw?.[side]??Math.atan2(body.z[0],body.z[2]));
   if(Math.hypot(...sub3(padFrame.origin,contact))>1e-7)throw Error('Pad frame must share its actual contact origin');
   const end=isArm&&(r.handWristLocal||r.handFrames)?pointInFrame3(padFrame,r.handWristLocal?.[side]??[0,7,0]):add3(contact,[0,isArm?7:8,0]);
   const solved=solveHingeLimb({frame:jointFrame,rootLocal:[0,0,0],targetWorld:end,upper:isArm?32:30,lower:isArm?29:27,
    normalLocal:[1,0,0],bendSign:isArm?-1:1,signedFlexionRange:isArm?[-2.65,-.07]:[.07,2.65],planeTolerance:1e-7});
   if(solved.status!=='solved')throw Error(`${name} ${kind}: ${solved.reason}; target ${contact}`);
   const id=`${name}/${kind}`;bones.push({id,root:solved.root,joint:solved.joint,end:solved.end,signedFlexion:solved.signedFlexion,normal:jointFrame.x});
   capsule(`${id}/upper`,solved.root,solved.joint,isArm?9.5:11,isArm?8.5:9.5,jointFrame.x,colors.cat);
   capsule(`${id}/lower`,solved.joint,solved.end,isArm?8.5:9.5,7.5,jointFrame.x,colors.cat);
   ball(`${id}/joint`,solved.joint,isArm?8.5:9.5,isArm?8.5:9.5,isArm?8.5:9.5,jointFrame,colors.cat);
   if(isArm){
    const floor=r.floorHands,blend=r.floorHandBlend??(floor?1:0);
    if(!Number.isFinite(blend)||blend<0||blend>1)throw RangeError('Paw morph must be finite in [0,1]');
    const grounded:Point2[]=[[-9,0],[-10,3],[-7,10],[0,13],[8,9],[11,3],[9,0]],free:Point2[]=[[-8,0],[-10,6],[-6,13],[1,15],[9,10],[10,4],[7,0]];
    const shape:Point2[]=blend===1?grounded:blend===0?free:free.map((p,i)=>[p[0]+(grounded[i][0]-p[0])*blend,p[1]+(grounded[i][1]-p[1])*blend]);
    const verts=[-5,5].map(d=>shape.map(([z,y])=>pointInFrame3(padFrame,[d,y,z])));
    for(let i=0;i<shape.length;i++)quad(`${id}/paw-side${i}`,verts[0][i],verts[0][(i+1)%shape.length],verts[1][(i+1)%shape.length],verts[1][i],colors.cat);
    polygon(`${id}/paw-left`,[...verts[0]].reverse(),colors.cat);polygon(`${id}/paw-right`,verts[1],colors.cat);
    for(const x of [-2,2]){
     const at=(z:number,dx:number)=>pointInFrame3(padFrame,[x+dx,((15-.625*(z-1))*(1-blend)+(13-.5*z)*blend)+.12,z]);
     quad(`${id}/toe-${x}`,at(4,-.22),at(7,-.22),at(7,.22),at(4,.22),0x7b7d80);
    }
    pads.push({id,vertices:verts.flat(),contact});
   }else{
    const profile:Point2[]=[[-9,0],[-10,4],[-5,10],[3,11],[8,6],[18,3],[19,0]];
    const verts=[-7,7].map(d=>profile.map(([z,y])=>pointInFrame3(padFrame,[d,y,z])));
    for(let i=0;i<profile.length;i++)quad(`${id}/foot-side${i}`,verts[0][i],verts[0][(i+1)%profile.length],verts[1][(i+1)%profile.length],verts[1][i],colors.cat);
    polygon(`${id}/foot-left`,[...verts[0]].reverse(),colors.cat);polygon(`${id}/foot-right`,verts[1],colors.cat);
    for(const x of [-3,2]){
     const at=(z:number,dx:number)=>pointInFrame3(padFrame,[x+dx,6-.3*(z-8)+.12,z]);
     quad(`${id}/toe-${x}`,at(11,-.22),at(15,-.22),at(15,.22),at(11,.22),0x7b7d80);
    }
    pads.push({id,vertices:verts.flat(),contact});
   }
  }
 }
 return {triangles,bones,pads,body,head,request:r,headSurface,bodySurface:(p:Point2)=>onSurface(p,bodyFaces,body),anchors:{cheek:[headSurface([45,5]),headSurface([49,14]),headSurface([45,24])] as readonly Vec3[],chest:onSurface([18,30],bodyFaces,body)},shoulders:anatomySides.map((_,i)=>pointInFrame3(body,[i?-27:27,46,0]))};
}
export type SpatialCat=ReturnType<typeof buildSpatialCat>;
