import { Graphics } from 'pixi.js';
import { localPoint, type Point2, type LocalFrame2D } from '../../core/spatial';
import { mapContour, type CubicContour } from '../../core/contour';
import { eyeShape } from '../../core/eye';
import { robotModel, canBody, canSpout, canHandle, gripperShapes } from './model';
import { benchY, soil, type RobotPose } from './motion';
const INK=0x263f46,AMBER=0xefad54,CREAM=0xffdfaa,TEAL=0x527f76,METAL=0x596c70;
function contour(g:Graphics,c:CubicContour,fill:number,width=3) {
  g.moveTo(...c.start);for(const p of c.curves)g.bezierCurveTo(...p.c1,...p.c2,...p.to);
  g.closePath().fill(fill);if(width)g.stroke({color:INK,width,join:'round',cap:'round'});
}
function line(g:Graphics,a:Point2,b:Point2,color:number,width:number) {
  g.moveTo(...a).lineTo(...b).stroke({color,width,cap:'round'});
}
function circle(g:Graphics,p:Point2,r:number,color:number,width=3) {
  g.circle(...p,r).fill(color);if(width)g.stroke({color:INK,width});
}
function local(g:Graphics,frame:LocalFrame2D,draw:()=>void) {
  g.save().rotateTransform(frame.angle).scaleTransform(frame.scale,frame.scale).translateTransform(...frame.origin);
  draw();g.restore();
}
export function drawGarden(g:Graphics) {
  g.clear().rect(0,0,960,640).fill(0xf4ebd9);
  g.roundRect(60,77,516,373,34).fill(0xc8dbcd).stroke({color:0x869e91,width:5});
  g.roundRect(73,89,490,346,25).fill(0xe2ecdc);
  // Opaque window panes and a quiet garden silhouette.
  g.moveTo(320,90).lineTo(320,435).moveTo(74,257).lineTo(562,257).stroke({color:0xa4bbaa,width:5});
  g.ellipse(165,406,78,28).ellipse(461,408,83,27).fill(0xc3d5be);
  g.moveTo(150,427).quadraticCurveTo(122,376,128,337).moveTo(445,431).quadraticCurveTo(477,380,466,338)
    .stroke({color:0xb0c7ae,width:9,cap:'round'});
  g.roundRect(642,100,180,110,15).fill(0xe4dac3).stroke({color:0xbcae91,width:3});
  g.moveTo(731,186).lineTo(731,143).bezierCurveTo(702,141,702,120,721,128)
    .moveTo(731,161).bezierCurveTo(755,157,769,138,751,138).stroke({color:0x7e9a78,width:6,cap:'round'});
  g.rect(0,566,960,74).fill(0xe1d5bb);
  line(g,[0,566],[960,566],0xb8b399,3);
  g.ellipse(400,570,104,10).fill({color:INK,alpha:.12});
  g.ellipse(692,571,172,10).fill({color:INK,alpha:.09});
  // Bench dimensions and the can contact share benchY.
  g.roundRect(511,benchY+11,18,78,5).roundRect(824,benchY+11,18,78,5).fill(0x927659).stroke({color:INK,width:3});
  g.roundRect(491,benchY,369,19,6).fill(0xc7a67e).stroke({color:INK,width:3});
  line(g,[501,benchY+5],[848,benchY+5],0xe1c59c,3);
  // Whole pot, its soil and plant. Water lands on the exposed soil, not the rim.
  const x=soil[0]+15,y=soil[1];
  g.moveTo(x-36,y).lineTo(x-27,benchY-2).quadraticCurveTo(x,benchY+4,x+27,benchY-2)
    .lineTo(x+36,y).closePath().fill(0xc78368).stroke({color:INK,width:3});
  g.ellipse(x,y,36,10).fill(0x735b49).stroke({color:INK,width:3});
  g.moveTo(x,y).bezierCurveTo(x-5,y-35,x+8,y-55,x+2,y-82).stroke({color:0x537c60,width:6,cap:'round'});
  g.moveTo(x,y-38).bezierCurveTo(x-35,y-36,x-47,y-68,x-21,y-62)
    .quadraticCurveTo(x-4,y-61,x,y-38).closePath().fill(0x83aa74).stroke({color:INK,width:2.5});
  g.moveTo(x+2,y-55).bezierCurveTo(x+31,y-52,x+46,y-85,x+20,y-78)
    .quadraticCurveTo(x+6,y-74,x+2,y-55).closePath().fill(0x6c9968).stroke({color:INK,width:2.5});
  circle(g,[x+2,y-86],10,0xf1bc68,2.5);
}
function limb(g:Graphics,a:Point2,k:Point2,b:Point2,width:number) {
  for(const [u,v] of [[a,k],[k,b]]) {
    line(g,u,v,INK,width+5);line(g,u,v,METAL,width);
    line(g,[u[0]-2,u[1]],[v[0]-2,v[1]],0x8b9a94,3);
  }
  circle(g,k,width*.67,CREAM,2.5);
}
function gripper(g:Graphics,frame:LocalFrame2D,close:number) {
  local(g,frame,()=>{
    g.roundRect(-6,-10,23,20,6).fill(AMBER).stroke({color:INK,width:3});
    for(const jaw of gripperShapes(close))contour(g,jaw,AMBER,2.5);
    circle(g,[4,0],3,0xc88743,0);
  });
}
function can(g:Graphics,frame:LocalFrame2D) {
  local(g,frame,()=>{
    // Stroke both sides of the handle; the actual curve is also the gripper target.
    for(const [width,color] of [[11,INK],[6,TEAL]]) {
      g.moveTo(...canHandle.start);for(const c of canHandle.curves)g.bezierCurveTo(...c.c1,...c.c2,...c.to);
      g.closePath().stroke({color,width,join:'round'});
    }
    contour(g,canSpout,TEAL);
    contour(g,canBody,TEAL);
    g.moveTo(-25,-9).quadraticCurveTo(-29,20,-21,32).stroke({color:0x8eb09c,width:5,cap:'round'});
    g.ellipse(0,-20,34,8).fill(0x9cbaa6).stroke({color:INK,width:2.5});
    g.ellipse(0,-20,21,4).fill(0x4c7169);
    const mouth=canSpout.curves[1];
    g.moveTo(...canSpout.curves[0].to).bezierCurveTo(...mouth.c1,...mouth.c2,...mouth.to).stroke({color:INK,width:4,cap:'round'});
  });
}
export function drawRobot(g:Graphics,q:RobotPose) {
  g.clear();
  const model=robotModel(q.view);
  for(const [i,leg] of q.legs.entries()) {
    limb(g,leg.hip,leg.knee,leg.ankle,16);
    g.roundRect(leg.sole[0]-(i===0?29:23),leg.sole[1]-18,56,18,7).fill(TEAL).stroke({color:INK,width:3});
    line(g,[leg.sole[0]-20,leg.sole[1]-12],[leg.sole[0]+20,leg.sole[1]-12],0x8eb09c,3);
  }
  const far=q.arms[0];limb(g,far.shoulder,far.elbow,far.wrist,14);gripper(g,far.frame,far.close);
  local(g,q.body,()=>{
    contour(g,model.torso,AMBER);
    g.roundRect(-31,-110,59,101,14).fill(0xf9d795);
    g.roundRect(-22,-49,43,29,5).fill(TEAL).stroke({color:INK,width:2.5});
    g.moveTo(-15,-42).lineTo(14,-42).stroke({color:0x9cbaa6,width:2});
    circle(g,[-35,-112],3,0xc88743,0);circle(g,[34,-112],3,0xc88743,0);
  });
  local(g,q.head,()=>{
    line(g,[-13,-43],[-13,-72],INK,4);circle(g,[-13,-78],7,TEAL,3);
    contour(g,model.head,AMBER);
    g.moveTo(-44,-35).quadraticCurveTo(-13,-41,30,-35).stroke({color:0xffdb96,width:5,cap:'round'});
    const vx=5*q.view,w=116-17*q.view;
    g.roundRect(vx-w/2,-28,w,53,16).fill(INK);
    for(const side of [-1,1]) {
      const x=vx+side*(26-4*q.view)+7*q.view;
      const eye=eyeShape({center:[x,-12],radius:[12,18],openness:1-q.blink,
        pupil:{center:[x+3,-4],radius:[5,8]}});
      if(eye.aperture.length)g.poly(eye.aperture.flat()).fill(0xe1efe0);
      if(eye.pupil.length)g.poly(eye.pupil.flat()).fill(0x537f74);
      g.moveTo(...eye.lid[0]);for(const p of eye.lid.slice(1))g.lineTo(...p);
      g.stroke({color:0xa4c5ad,width:2,cap:'round'});
    }
    g.moveTo(vx-9,15).quadraticCurveTo(vx+1,21,vx+12,15).stroke({color:0x9cbaa6,width:2.5,cap:'round'});
    circle(g,[-55,39],3,0xc88743,0);circle(g,[46,39],3,0xc88743,0);
  });
  can(g,q.can);
  for(const drop of q.water) {
    if(drop.impact)g.ellipse(...drop.point,2+drop.age*38,1+drop.age*6).stroke({color:0x6ca4b3,alpha:drop.alpha,width:2});
    else g.ellipse(...drop.point,2.4,4).fill({color:0x6c9dab,alpha:drop.alpha});
  }
  const near=q.arms[1];limb(g,near.shoulder,near.elbow,near.wrist,15);
  circle(g,near.shoulder,14,CREAM,3);gripper(g,near.frame,near.close);
}
