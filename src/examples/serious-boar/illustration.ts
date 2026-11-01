import {Graphics,Text,Container} from 'pixi.js';
import {type Point2,type LocalFrame2D} from '../../core/spatial';
import {eyeShape} from '../../core/eye';
import type {BoarPose} from './motion';
import {withGraphicsFrame} from '../../core/graphics-frame';
import {boarMouth} from './model';

const INK=0x403d32,FUR=0x77604b,LIGHT=0xa48665,DARK=0x554b3d,MUZZLE=0xb69b7c,IVORY=0xf7e8c6;
export const local=withGraphicsFrame;
function line(g:Graphics,a:Point2,b:Point2,color:number,width:number){g.moveTo(...a).lineTo(...b).stroke({color,width,cap:'round'});}
function limb(g:Graphics,a:Point2,k:Point2,b:Point2,width=28){
  g.moveTo(...a).lineTo(...k).lineTo(...b).stroke({color:INK,width:width+5,cap:'round',join:'round'});
  g.moveTo(...a).lineTo(...k).lineTo(...b).stroke({color:FUR,width,cap:'round',join:'round'});
}
function hoof(g:Graphics,p:Point2,angle=0,size=1){local(g,{origin:p,angle,scale:size},()=>{
  g.moveTo(-17,-10).quadraticCurveTo(-22,7,-11,14).quadraticCurveTo(0,19,15,10)
    .lineTo(20,-1).quadraticCurveTo(11,-13,-17,-10).closePath().fill(DARK).stroke({color:INK,width:2.5});
  line(g,[3,0],[2,13],0x2f302a,2.5);
});}
export const packageNames=['ЧЕРВЯЧКИ','ЖУЧКИ','ПАУЧКИ','ЛИЧИНКИ'];
const packetColors=[0xc89b55,0x809282,0xb58372,0xd5ba7b,0x879b60];
export function insect(g:Graphics,kind:number,x:number,y:number,s=1){local(g,{origin:[x,y],angle:0,scale:s},()=>{
  if(kind===0||kind===3||kind===4){
    const fill=kind===4?0x8ea75c:kind===0?0x9f6b4e:0xe2c383;
    for(let i=0;i<6;i++)g.ellipse(-17+i*6,Math.sin(i*.8)*4,5.2,7-i*.3).fill(fill).stroke({color:INK,width:1.2});
    g.circle(14,-2,1.2).fill(INK);
    if(kind===4)for(let i=0;i<5;i++)line(g,[-15+i*6,6],[-13+i*6,9],INK,1.4);
  }else{
    const legs=kind===2?4:3;
    for(const side of [-1,1])for(let i=0;i<legs;i++)g.moveTo(side*5,-8+i*5).lineTo(side*(15+i%2*3),-16+i*8).lineTo(side*21,-10+i*8).stroke({color:INK,width:1.7,cap:'round'});
    g.ellipse(0,2,kind===2?8:10,kind===2?9:13).fill(kind===2?0x65564b:0x526d55).stroke({color:INK,width:1.5});
    g.circle(0,-10,5).fill(DARK);if(kind===1)line(g,[0,-5],[0,14],0xa4ad7a,1.5);
  }
});}
export function packet(g:Graphics,kind:number,x:number,y:number,angle=0,scale=1,open=false){
 local(g,{origin:[x,y],angle,scale},()=>{
  g.moveTo(-40,-49).lineTo(-33,-57).lineTo(33,-57).lineTo(40,-49)
    .quadraticCurveTo(32,-10,43,41).lineTo(35,51).lineTo(-35,51).lineTo(-43,41)
    .quadraticCurveTo(-32,0,-40,-49).closePath().fill(packetColors[kind]).stroke({color:INK,width:2.1});
  g.moveTo(-35,-47).lineTo(35,-47).moveTo(-35,41).lineTo(35,41).stroke({color:0xf2e0b5,width:3});
  g.roundRect(-30,-32,60,62,5).fill(0xf4e9c9).stroke({color:0xa4916a,width:1.2});
  g.ellipse(0,-1,23,20).fill(0xd9d7b4);insect(g,kind,0,-1,.83);
  line(g,[-22,24],[22,24],INK,1);
  if(open){g.moveTo(-35,-49).lineTo(-22,-54).lineTo(-11,-48).lineTo(3,-54).lineTo(14,-47).lineTo(29,-52).lineTo(36,-48).lineTo(28,-37).lineTo(-28,-37).closePath().fill(0x4b4839).stroke({color:INK,width:1.6});}
 });
}
export function drawCart(g:Graphics,x:number,y:number,full:BoarPose['cargo']|null,side=false){
 local(g,{origin:[x,y],angle:0,scale:1},()=>{
  g.ellipse(177,22,178,12).fill({color:0x514f42,alpha:.15});
  line(g,[45,-18],[316,-18],0x617777,6);line(g,[51,-23],[67,-40],0x677d7c,5);
  line(g,[311,-24],[326,-43],0x677d7c,5);
  // Back mesh precedes opaque packages, front mesh is drawn afterwards.
  g.moveTo(7,-99).lineTo(338,-99).lineTo(309,-34).lineTo(53,-34).closePath().fill({color:0xc4d0c5,alpha:.28}).stroke({color:0x667976,width:4});
  if(full)for(const c of full)if(c.visible)packet(g,c.kind,c.x,c.y,c.angle,1.02);
  for(let i=0;i<16;i++)line(g,[15+i*21,-97],[57+i*16.5,-35],0x687a76,1.8);
  for(const y of [-80,-62,-46])line(g,[13+(y+99)*.58,y],[338-(y+99)*.44,y],0x6b7e7a,1.6);
  g.moveTo(-34,-119).lineTo(-8,-111).lineTo(49,-21).lineTo(311,-21).stroke({color:0x4e686a,width:6,join:'round',cap:'round'});
  line(g,[-42,-122],[-17,-114],0x75a3ad,10);
  if(side)line(g,[0,-99],[330,-99],0x829592,4);
 });
}
export function drawCartWheels(g:Graphics,x:number,y:number){
 g.clear();
 for(const wx of [81,286]){
  g.circle(x+wx,y+12,17).fill(0x3f4946).stroke({color:INK,width:2});g.circle(x+wx,y+12,9).fill(0xa5aaa0);
  const angle=x/17;line(g,[x+wx-Math.cos(angle)*7,y+12-Math.sin(angle)*7],[x+wx+Math.cos(angle)*7,y+12+Math.sin(angle)*7],0x596460,2);
 }
}
function head(g:Graphics,q:BoarPose){local(g,q.head,()=>{
  // Far ear and tusk belong to the head silhouette, not floating overlays.
  g.moveTo(-38,-55).quadraticCurveTo(-67,-121,-26,-100).lineTo(4,-63).closePath().fill(DARK).stroke({color:INK,width:3});
  g.moveTo(79,39).quadraticCurveTo(88,7,101,15).quadraticCurveTo(97,48,81,57).closePath().fill(IVORY).stroke({color:INK,width:2});
  g.moveTo(-73,56).bezierCurveTo(-105,-11,-77,-69,-34,-77).bezierCurveTo(3,-98,55,-70,65,-38)
   .bezierCurveTo(84,-27,111,-16,132,-7).bezierCurveTo(161,11,158,43,139,58)
   .bezierCurveTo(116,74,82,70,55,66).bezierCurveTo(25,96,-30,95,-73,56).closePath().fill(FUR).stroke({color:INK,width:3.5,join:'round'});
  g.moveTo(-66,-28).quadraticCurveTo(-21,-68,15,-43).bezierCurveTo(31,-24,58,-16,91,-6)
   .quadraticCurveTo(103,30,79,57).quadraticCurveTo(40,83,-5,65).quadraticCurveTo(-68,70,-66,-28).closePath().fill(LIGHT);
  // Broad leather snout, cheek warts and a small mane identify a boar.
  g.moveTo(90,-14).bezierCurveTo(142,-27,166,-2,160,29).bezierCurveTo(155,52,119,53,92,38)
    .quadraticCurveTo(80,15,90,-14).closePath().fill(MUZZLE).stroke({color:INK,width:3});
  g.ellipse(142,7,6,9).ellipse(117,4,5,8).fill(0x6f5848);
  g.ellipse(9,33,15,10).fill(0x937457).stroke({color:INK,width:2});
  g.moveTo(-45,-44).bezierCurveTo(-90,-83,-67,-118,-34,-101).quadraticCurveTo(-14,-82,-20,-44)
    .quadraticCurveTo(-31,-31,-45,-44).closePath().fill(FUR).stroke({color:INK,width:3});
  g.moveTo(-47,-52).quadraticCurveTo(-67,-92,-42,-92).quadraticCurveTo(-24,-77,-30,-53).closePath().fill(0xa2816c);
  for(let i=0;i<6;i++)line(g,[-59+i*12,-70-4*Math.sin(i)],[-65+i*12,-91-3*(i%2)],DARK,4);
  const eye=eyeShape({center:[41,-19],radius:[15,11],openness:(.39+.46*q.happiness)*(1-q.blink),pupil:{center:[46,-18],radius:[4.7,6.5]}});
  if(eye.aperture.length)g.poly(eye.aperture.flat()).fill(0xf7edcf);
  if(eye.pupil.length)g.poly(eye.pupil.flat()).fill(0x343b2e);
  g.moveTo(...eye.lid[0]);for(const p of eye.lid.slice(1))g.lineTo(...p);g.stroke({color:INK,width:2.4,cap:'round'});
  g.moveTo(22,-36+q.happiness*7).quadraticCurveTo(39,-34-q.happiness*9,58,-27-q.happiness*9).stroke({color:DARK,width:7,cap:'round'});
  const mouth=boarMouth(q.happiness,q.chew);
  g.moveTo(...mouth.start).quadraticCurveTo(...mouth.control,...mouth.end).stroke({color:INK,width:2.6,cap:'round'});
  g.moveTo(71,51).bezierCurveTo(47,23,64,3,72,8).quadraticCurveTo(70,32,91,48).closePath().fill(IVORY).stroke({color:INK,width:2.5});
  if(q.happiness>.2)g.moveTo(16,3).quadraticCurveTo(8,11,13,19).stroke({color:0xb39570,width:3,cap:'round'});
  for(const [x,y] of [[-41,20],[-29,44],[-3,60]])line(g,[x,y],[x+7,y-5],0x68533f,1.5);
});}
export function drawBoar(g:Graphics,q:BoarPose){g.clear();const [x,y]=q.root;
  if(!q.seated&&x< -230)return;
  g.ellipse(x+6,y+7,q.seated?154:101,13).fill({color:0x403c2b,alpha:.16});
  // Tail has a purposeful fixed curl; no arbitrary idle oscillation.
  g.moveTo(x-78,y-(q.seated?91:143)).bezierCurveTo(x-124,y-94,x-148,y-113,x-127,y-132)
    .bezierCurveTo(x-107,y-151,x-101,y-126,x-119,y-124).stroke({color:INK,width:8,cap:'round'});
  if(q.seated){
    for(const side of [-1,1]){g.ellipse(x+side*76,y-9,63,38).fill(FUR).stroke({color:INK,width:3});hoof(g,[x+side*104,y+7],side*-.18,1.6);}
  }else{
    for(const [i,f] of q.feet.entries()){
      const hip:Point2=[x+(i?32:-35),y-126],ankle:Point2=[f.position[0],f.position[1]-13];
      // Long enough to cover authored root/support transfer without detaching a hoof.
      const knee=solveLeg(hip,ankle,i);
      limb(g,hip,knee,ankle,32);hoof(g,ankle,0,1.25);
    }
  }
  const top=y-(q.seated?204:252),bottom=y-(q.seated?12:72);
  g.moveTo(x-73,bottom).bezierCurveTo(x-128,y-108,x-109,top+20,x-45,top)
    .bezierCurveTo(x+19,top-34,x+69,top+19,x+76,top+66)
    .bezierCurveTo(x+127,y-75,x+70,bottom+29,x-73,bottom).closePath().fill(FUR).stroke({color:INK,width:3.5});
  g.moveTo(x+7,top+42).bezierCurveTo(x+64,top+48,x+92,y-74,x+44,bottom+5)
    .quadraticCurveTo(x-8,bottom+29,x-35,bottom-15).bezierCurveTo(x-18,y-103,x-35,top+64,x+7,top+42).closePath().fill(LIGHT);
  for(let i=0;i<9;i++)line(g,[x-74+i*7,top+22-i*3],[x-94+i*7,top+4-i*3],DARK,5);
  if(q.seated){
    limb(g,[x-35,y-135],[x-65,y-68],[x-19,y-65],32);
    packet(g,4,...q.bag.origin,q.bag.angle,q.bag.scale,true);hoof(g,[x-18,y-56],-.3,1.05);
  }else{
    limb(g,[x+5,y-190],[x+69,y-127],[q.hand[0]-15,q.hand[1]-5],25);
    hoof(g,[q.hand[0]-15,q.hand[1]-5],-.25,.8);
  }
  head(g,q);
  limb(g,q.shoulder,q.elbow,q.hand,30);
  if(q.holdingFood)local(g,q.food,()=>insect(g,4,0,0,1));
  hoof(g,q.hand,-.3-.25*q.bite,.95);
}
import {solvePlanarLimb} from '../../core/kinematics';
function solveLeg(a:Point2,b:Point2,_i:number):Point2{return solvePlanarLimb(a,b,77,82,{bendSide:-1,endAngle:0,wristRange:[-Math.PI,Math.PI],minFlexion:0}).joint;}

export function makeLettering(root:Container){
 const make=(text:string,size:number,fill:number,weight:'bold'|'normal'='bold')=>{
  const t=new Text({text,style:{fontFamily:'Arial, sans-serif',fontSize:size,fontWeight:weight,fill}});root.addChild(t);return t;
 };
 const rule=make('правило: не купишь сейчас —',27,0x292e29);rule.position.set(84,236);rule.style.fontStyle='italic';
 const big=make('заплатишь\nбольше!!!',110,0xc82f26);big.position.set(79,282);big.style.lineHeight=104;
 const shelf=packageNames.map((name,i)=>{const label=make(name,11,INK);label.position.set(1163,284+i*72);return label;});
 const cargo=Array.from({length:32},(_,i)=>make(packageNames[i%4],10,INK));
 const snack=make('ГУСЕНИЦЫ',12,INK);
 return {rule,big,shelf,cargo,snack};
}
