import {Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import type {Point2,Vec3} from '../../core/spatial';
import {cubicPoint,type CubicContour} from '../../core/contour';
import {eyeShape,clipConvex} from '../../core/eye';
import {catPictureStorySettings} from './settings';
import {controlPose,type ControlId,type StoryControlPose} from './model';
import {viewPoint,viewDepth,room,storyChair,chairParts,clock,picture,boxFaces,viewCamera,type StoryView} from './world';
import {clockAt,frameAt,framePoint,frameTimes,backrestPoint} from './environment';
import {storyPose} from './motion';
const palette={wall:0x94bca7,side:0x6b9c93,floor:0xb6afa8,trim:0xe7d9ba,ink:0x252830,cat:0x3b3e46,far:0x2d333c,muzzle:0xd0cdbc,belly:0xb4b5a8};
function polygon(g:Graphics,points:readonly Point2[],color:number,alpha=1){g.poly(points.flat()).fill({color,alpha});}
function line(g:Graphics,points:readonly Point2[],color:number,width=1,alpha=1){g.moveTo(...points[0]);for(const p of points.slice(1))g.lineTo(...p);g.stroke({color,width,alpha,cap:'round',join:'round'});}
function paper(g:Graphics,points:readonly Point2[],color:number,edge=true){
 polygon(g,points.map(([x,y])=>[x+1.15,y+1.55] as Point2),0x292734,.15);polygon(g,points,color);
 if(edge)g.poly(points.flat()).stroke({color:0x34333a,width:.7,alpha:.55,join:'round'});
}
function worldPaper(g:Graphics,points:readonly Vec3[],view:StoryView,color:number,edge=true){paper(g,points.map(p=>viewPoint(p,view)),color,edge);}
function worldLine(g:Graphics,p:readonly Vec3[],view:StoryView,color:number,width=1,alpha=1){line(g,p.map(p=>viewPoint(p,view)),color,width,alpha);}
function flatEllipse(centre:Vec3,rx:number,ry:number,count=24):Vec3[]{return Array.from({length:count},(_,i)=>{const a=2*Math.PI*i/count;return[centre[0]+rx*Math.cos(a),centre[1]+ry*Math.sin(a),centre[2]];});}
function contourPoints(c:CubicContour){const points:Point2[]=[];let from=c.start;for(const curve of c.curves){for(let j=0;j<6;j++)points.push(cubicPoint(from,curve,j/6));from=curve.to;}return points;}
function screenContour(g:Graphics,c:CubicContour,color:number){paper(g,contourPoints(c),color);}
function bodyShape(p:StoryControlPose):CubicContour{return{start:viewPoint(p.bodyWorld.start,p.view),curves:p.bodyWorld.curves.map(c=>({...c,c1:viewPoint(c.c1,p.view),c2:viewPoint(c.c2,p.view),to:viewPoint(c.to,p.view)}))};}
function drawRoom(g:Graphics,view:StoryView){
 g.rect(0,0,1280,720).fill(palette.wall);const{left:l,right:r,back:b,front:f,height:h}=room;
 worldPaper(g,[[l,0,b],[r,0,b],[r,h,b],[l,h,b]],view,palette.wall,false);
 worldPaper(g,[[l,0,b],[r,0,b],[r,0,f],[l,0,f]],view,palette.floor,false);
 // Open interior staging: only the back wall and continuous floor. Their
 // finite far edges lie outside both camera frames; no miniature-room border.
 // A colored lower wall and cream cut-paper baseboard remain world anchored.
 worldPaper(g,[[l,0,b+1],[r,0,b+1],[r,87,b+1],[l,87,b+1]],view,0x7ca68d,false);
 for(let x=-1680;x<=1680;x+=120)worldLine(g,[[x,0,b],[x,0,f]],view,0x8f918d,1.2,.48);
 for(let z=-210;z<=1800;z+=90)worldLine(g,[[l,0,z],[r,0,z]],view,0x93928e,1.2,.5);
 worldPaper(g,[[l,0,b+2],[r,0,b+2],[r,14,b+2],[l,14,b+2]],view,palette.trim);
 worldLine(g,[[l,89,b+2],[r,89,b+2]],view,0xb0c8ad,2);
 // Stable sparse fibers, fixed to world panels rather than screen/time noise.
 for(let i=0;i<32;i++){const x=-440+(i*137)%900,y=110+(i*67)%300;worldLine(g,[[x,y,b+2],[x+5+(i%4),y+.5,b+2]],view,0xf1e8cf,.8,.075);}
}
function drawClock(g:Graphics,view:StoryView,time?:number){
 const{x,y,z,width:w,height:h}=clock,x0=x-w/2,y0=y-h/2;
 worldPaper(g,[[x0,y0,z],[x0+w,y0,z],[x0+w+3,y0+h-7,z],[x0+w-7,y0+h,z],[x0+4,y0+h-2,z]],view,0x855b40);
 worldPaper(g,[[x0+8,y0+8,z+1],[x0+w-8,y0+8,z+1],[x0+w-8,y0+h-9,z+1],[x0+8,y0+h-9,z+1]],view,0xb18453);
 worldPaper(g,[[x-27,255,z+2],[x+27,255,z+2],[x+27,326,z+2],[x-27,326,z+2]],view,0xb5bca0);
 const pendulum=time===undefined?null:clockAt(time),angle=.18,pivot:Vec3=pendulum?[...pendulum.pivot]:[x,326,z+3],bob:Vec3=pendulum?[...pendulum.bob]:[x+Math.sin(angle)*49,326-Math.cos(angle)*49,z+3];
 worldLine(g,[pivot,bob],view,0x554b3a,3);worldPaper(g,flatEllipse(bob,9,11),view,0xd4af48);
 const face:Vec3=[x,367,z+4];worldPaper(g,flatEllipse(face,29,29),view,0xf4e7bf);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;worldLine(g,[[x+23*Math.sin(a),367+23*Math.cos(a),z+5],[x+26*Math.sin(a),367+26*Math.cos(a),z+5]],view,0x49413a,1.5);}
 worldLine(g,[face,[x-12,381,z+5]],view,0x383a35,3);worldLine(g,[face,[x+17,361,z+5]],view,0x383a35,2);
 worldPaper(g,flatEllipse(face,2.4,2.4,12),view,0x373a34,false);
}
function drawPictureHook(g:Graphics,view:StoryView){
 worldPaper(g,flatEllipse([picture.x,432,picture.z-1],2.6,2.6,10),view,0x65594d,false);
}
function drawPicture(g:Graphics,view:StoryView,down:boolean,time?:number){
 const angle=-.045,cos=Math.cos(angle),sin=Math.sin(angle),w=picture.width/2,h=picture.height/2,t=picture.frame;
 const falling=time===undefined?null:frameAt(time);
 const at=(x:number,y:number):Vec3=>falling?[...framePoint(falling,x,y)]:down?[355+x,1,-55+y]:[picture.x+x*cos-y*sin,picture.y+x*sin+y*cos,picture.z];
 if(time===undefined?!down:time<frameTimes.release)worldLine(g,time===undefined?[[picture.x-60,picture.y+59,picture.z],[picture.x,432,picture.z],[picture.x+60,picture.y+59,picture.z]]:[at(-60,59),[picture.x,432,picture.z],at(60,59)],view,0x5e6558,1.1);
 const rect=(l:number,b:number,r:number,top:number)=>[[l,b],[r,b],[r,top],[l,top]].map(([x,y])=>at(x,y));
 worldPaper(g,rect(-w-t,-h-t,w+t,h+t),view,0x805035);worldPaper(g,rect(-w-5,-h-5,w+5,h+5),view,0xc49a66);worldPaper(g,rect(-w,-h,w,h),view,0xe9d1a2);
 worldPaper(g,[at(-w,-9),at(-30,27),at(16,-5),at(51,30),at(w,3),at(w,-h),at(-w,-h)],view,0x8caa87,false);
 worldPaper(g,[at(-w,-28),at(-15,4),at(45,-24),at(w,-10),at(w,-h),at(-w,-h)],view,0x5d877c,false);
 const sun=Array.from({length:18},(_,i)=>{const a=i*2*Math.PI/18;return at(45+14*Math.cos(a),29+14*Math.sin(a));});worldPaper(g,sun,view,0xcf8650,false);
 // Four bevel strips make it a wooden frame around a canvas, not a glass pane.
 worldPaper(g,rect(-w-t,h,w+t,h+t),view,0xa8784c);worldPaper(g,rect(-w-t,-h-t,w+t,-h),view,0x754a33);worldPaper(g,rect(-w-t,-h,-w,h),view,0x98623c);worldPaper(g,rect(w,-h,w+t,h),view,0x8a5938);
}
function drawChair(g:Graphics,view:StoryView,time?:number){
 const chairPoint=(p:Vec3):Vec3=>time===undefined?p:[...backrestPoint(p,time)];
 const chairPaper=(points:readonly Vec3[],color:number)=>worldPaper(g,points.map(chairPoint),view,color);
 const c=storyChair,legOrder=[...c.legs].sort((a,b)=>viewDepth([a.x,0,a.z],view)-viewDepth([b.x,0,b.z],view));
 const cube=(x:number,y:number,z:number,w:number,h:number,d:number,front:number,side:number,top:number)=>{const faces=boxFaces(x,y,z,w,h,d);chairPaper(viewCamera(view).yaw<0?faces.right:faces.left,side);chairPaper(faces.front,front);chairPaper(faces.top,top);};
 for(const l of legOrder){const part=chairParts.legs[c.legs.indexOf(l)];cube(...part.origin,...part.size,l.z<-100?0x9b4840:0xb95749,0x8f403a,0xda7960);}
 cube(...(time===undefined?[c.left+5,158,c.back-2] as Vec3:chairParts.backrest.origin),...chairParts.backrest.size,0xc76451,0x9b4840,0xd78665);
 // Small inset panel is a separate matte paper layer, same world plane.
 const inset=c.back+(time===undefined?11:17.4);chairPaper([[c.left+20,175,inset],[c.right-20,175,inset],[c.right-20,227,inset],[c.left+20,227,inset]],0xd67c60);
 worldLine(g,[[c.left+20,218,inset+1],[c.right-20,218,inset+1]].map(q=>chairPoint(q as Vec3)),view,0xdf9878,1.6,.8);
 cube(...chairParts.seat.origin,...chairParts.seat.size,0xb95045,0x98433d,0xdd8766);
 worldLine(g,[[57,51,-61],[194,51,-61]],view,0xa85042,6);
}
function headPaper(g:Graphics,p:StoryControlPose){
 const{view,expression}=p,panic=expression==='panic',fear=p.fear,turn=Math.max(0,Math.min(1,-(p.headTurn??0))),feature=(a:Point2,b:Point2):Point2=>[a[0]+(b[0]-a[0])*turn,a[1]+(b[1]-a[1])*turn];
 worldPaper(g,p.headWorld,view,palette.cat);
 const muzzle=p.headAt(feature([2,19],[-33,19])),patch=flatEllipse([muzzle[0],muzzle[1],muzzle[2]+1],24-3*turn,13+turn);worldPaper(g,patch,view,palette.muzzle,false);
 for(const i of [0,1]){
  const centre=feature([i?20:-20,-3],i?[-5,-4]:[-36,-8]),eyeRX=18-(i?0:7.5)*turn,eyeRY=22-(i?0:3)*turn,panicRX=20-(i?0:8)*turn,panicRY=23-(i?0:4)*turn,openness=panic?1:expression==='proud'?.36:(i?.58:.66);
  if(fear!==undefined){
   const e=eyeShape({center:centre,radius:[eyeRX,eyeRY],openness:expression==='cheeky'?.66:.36,pupil:{center:[centre[0]+2,centre[1]+3],radius:[3.4,4.5]}});
   const aperture=e.aperture.map((q,j)=>{const u=j<=24?-1+2*j/24:1-2*(j-25)/24,sign=j<=24?-1:1;return[q[0]+(centre[0]+panicRX*u-q[0])*fear,q[1]+(centre[1]+sign*panicRY*Math.sqrt(Math.max(0,1-u*u))-q[1])*fear]as Point2;});
   const gaze=p.gaze??[2,3],rx=3.4-.4*fear,ry=4.5-1.5*fear,pupil=Array.from({length:48},(_,j)=>{const a=j*Math.PI*2/48;return[centre[0]+gaze[0]+rx*Math.cos(a),centre[1]+gaze[1]+ry*Math.sin(a)]as Point2;});
   worldPaper(g,aperture.map(p.headAt),view,0xf4f0df,false);worldPaper(g,clipConvex(pupil,aperture).map(p.headAt),view,0x20242b,false);
  }else if(panic){
   // Full panic whites are authored round paper pieces; the shared aperture
   // helper intentionally retains an upper lid even at openness1.
   const white=flatEllipse(p.headAt(centre),20,23,32),pupil=flatEllipse(p.headAt([centre[0]+3,centre[1]+2]),3,3,20);
   worldPaper(g,white,view,0xf4f0df,false);worldPaper(g,pupil,view,0x20242b,false);
  }else{
   const e=eyeShape({center:centre,radius:[18,22],openness,pupil:{center:[centre[0]+2,centre[1]+3],radius:[3.4,4.5]}});
   worldPaper(g,e.aperture.map(q=>p.headAt([q[0],q[1]])),view,0xf4f0df,false);worldPaper(g,e.pupil.map(q=>p.headAt([q[0],q[1]])),view,0x20242b,false);
  }
  if(fear===undefined?!panic:fear<.7){const brow:Point2[]=i?[[8,-21],[30,-25]]:[[-31,-24],[-9,-19]];worldLine(g,brow.map(q=>p.headAt(feature(q,[q[0]*(i?.7:.65)-(i?20:25),q[1]]))),view,0x232730,2.1);}
 }
 worldPaper(g,([[0,8],[8,8],[5,13]]as Point2[]).map((q,i)=>p.headAt(feature(q,([[-52,8],[-40,8],[-49,14]]as Point2[])[i]))),view,0x555052,false);
 if(fear!==undefined&&fear>0)worldPaper(g,flatEllipse(p.headAt(feature([3,25],[-35,25])),5*fear,7*fear,16),view,0x25272d,false);
 else if(panic&&fear===undefined)worldPaper(g,flatEllipse(p.headAt(feature([3,25],[-35,25])),5,7,16),view,0x25272d,false);
 else{const mouth=([[-7,23],[1,26],[12,21]]as Point2[]).map((q,i)=>p.headAt(feature(q,([[-42,23],[-34,26],[-22,21]]as Point2[])[i])));worldLine(g,mouth,view,0x555151,1.5);}
 for(const side of [-1,1])for(const y of [12,18])worldLine(g,[p.headAt(feature([side*28,y],[side<0?-45:-4,y])),p.headAt(feature([side*43,y+(y===12?-2:1)],[side<0?-63:14,y+(y===12?-2:1)]))],view,0x5c6063,1.1);
}
function drawCat(g:Graphics,p:StoryControlPose){
 const{view}=p,panic=p.expression==='panic',root=p.tailBase;
 const relaxedTail:Point2[]=[[0,0],[-24,-3],[-46,8],[-54,25],[-51,44],[-45.5,45],[-40,46],[-38,34],[-40,28.5],[-42,23],[-36,16],[-28,13.5],[-20,11],[0,12]],spikyTail:Point2[]=[[0,0],[-17,-3],[-39,5],[-61,23],[-71,21],[-62,13],[-76,13],[-68,2],[-78,-2],[-64,-7],[-66,-17],[-47,-12],[-24,-20],[0,-12]];
 const tailAmount=p.bristle??(panic?1:0),f=p.facing??1,s=Math.sqrt(Math.max(0,1-f*f));
 const tailLocal:Point2[]=p.bristle===undefined?(panic?spikyTail:[[0,0],[-24,-3],[-46,8],[-54,25],[-51,44],[-40,46],[-38,34],[-42,23],[-36,16],[-20,11],[0,12]]):relaxedTail.map(([x,y],i)=>[x+(spikyTail[i][0]-x)*tailAmount,y+(spikyTail[i][1]-y)*tailAmount]);
 const tail:Vec3[]=tailLocal.map(([x,y])=>[root[0]+x*f,root[1]+y,root[2]-3+x*s]);
 worldPaper(g,tail,view,palette.far);
 const near=(kind:'legs'|'arms'):0|1=>p.facing===undefined?0:viewDepth(p[kind][0].world.root,view)>=viewDepth(p[kind][1].world.root,view)?0:1;
 const legNear=near('legs'),armNear=near('arms');
 const limb=(kind:'legs'|'arms',i:0|1)=>{const l=p[kind][i],d=viewDepth(l.world.root,view)-viewDepth(p[kind][1-i].world.root,view),u=p.facing===undefined?(i?0:1):Math.max(0,Math.min(1,.5+d/24));let color=0;for(const shift of[16,8,0])color|=Math.round(((palette.far>>shift)&255)*(1-u)+((palette.cat>>shift)&255)*u)<<shift;screenContour(g,l.shape.contour,color);if(kind==='legs')worldPaper(g,p.legs[i].foot,view,color);else worldPaper(g,p.arms[i].paw,view,color);};
 limb('legs',(1-legNear)as 0|1);limb('arms',(1-armNear)as 0|1);
 screenContour(g,bodyShape(p),palette.cat);
 const belly=Array.from({length:24},(_,i)=>{const a=i*2*Math.PI/24;return p.bodyAt(18*Math.cos(a),19+25*Math.sin(a));});worldPaper(g,belly,view,palette.belly,false);
 if((p.bristle??(panic?1:0))>0)for(const side of [-1,1])for(const h of [13,29])worldPaper(g,[[side*24,h-5],[side*(24+11*(p.bristle??1)),h+3],[side*25,h+9]].map(([x,y])=>p.bodyAt(x,y)),view,palette.cat);
 limb('legs',legNear);
 const neck:Vec3[]=[[p.shoulders[0]-10,p.shoulders[1]-3,p.shoulders[2]],[p.shoulders[0]+11,p.shoulders[1]-3,p.shoulders[2]],[p.headCentre[0]+11,p.headCentre[1]-24,p.headCentre[2]],[p.headCentre[0]-11,p.headCentre[1]-24,p.headCentre[2]]];worldPaper(g,neck,view,palette.cat,false);
 headPaper(g,p);limb('arms',armNear);
 for(const i of [0,1]){const a=p.arms[i];for(const dx of [-3,3])worldLine(g,[[a.wrist[0]+dx,a.wrist[1]-3,a.wrist[2]+1],[a.wrist[0]+dx+1,a.wrist[1]-5,a.wrist[2]+1]],view,0x858a8d,.9,.8);}
}
interface Drawing{paper:Graphics}
/** First gate ONLY: an explicitly held drawing, not a35second authored motion.
 * Registration/animation/audio follow root's next gate after visible review. */
export function createStoryControlScene(id:ControlId):SceneDefinition<StoryControlPose,Drawing>{return{
 settings:catPictureStorySettings,pose:()=>controlPose(id),createDrawing(root){const paper=new Graphics();root.addChild(paper);return{paper};},
 draw({paper:g},p){g.clear();drawRoom(g,p.view);drawClock(g,p.view);drawPictureHook(g,p.view);if(!p.pictureDown)drawPicture(g,p.view,false);drawChair(g,p.view);if(p.pictureDown)drawPicture(g,p.view,true);drawCat(g,p);},
};}
/** Pure35second story blocking. Drawing, contacts and environment use one
 * world and absolute time; independent motion review and sound are pending. */
export const catPictureStoryScene:SceneDefinition<StoryControlPose&{environmentTime:number},Drawing>={
 settings:catPictureStorySettings,
 pose(time){return{...storyPose(time),environmentTime:time};},
 createDrawing(root){const paper=new Graphics();root.addChild(paper);return{paper};},
 draw({paper:g},p){g.clear();const t=p.environmentTime;drawRoom(g,p.view);drawClock(g,p.view,t);drawPictureHook(g,p.view);drawPicture(g,p.view,false,t);drawChair(g,p.view,t);drawCat(g,p);},
};

// Reuse the same authored room/furniture in the opt-in V2 candidate.
export {drawRoom,drawClock,drawPictureHook,drawChair};
