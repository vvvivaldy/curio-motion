import {Graphics} from 'pixi.js';
import type {Point2} from '../../core/spatial';
import {paperPoint,type RaccoonPose,type Envelope,floor,counterTop} from './motion';
const c={ink:0x403932,fur:0x928373,furLight:0xc5b59b,cream:0xf4dfb8,dark:0x3d3430,jacket:0x28666b,jacketLight:0x397d80,tealDark:0x1e4e53,bag:0xc78d38,bagEdge:0x996127,bagDark:0x56391e,boot:0x423b34,paper:0xffecca,red:0xb84630};
const stroke=(g:Graphics,color=c.ink,width=2)=>g.stroke({color,width,cap:'round',join:'round'});
function poly(g:Graphics,p:readonly Point2[],color:number,outline=true){g.poly(p.flat()).fill(color);if(outline)stroke(g);}
function line(g:Graphics,a:Point2,b:Point2,width:number,color:number){g.moveTo(...a).lineTo(...b).stroke({color,width,cap:'round',join:'round'});}
function limb(g:Graphics,a:Point2,b:Point2,d:Point2,color:number,width:number){g.moveTo(...a).lineTo(...b).lineTo(...d).stroke({color:c.ink,width:width+4,join:'round',cap:'round'});g.moveTo(...a).lineTo(...b).lineTo(...d).stroke({color,width,join:'round',cap:'round'});}
export function drawPostOffice(g:Graphics){
 g.clear();g.rect(0,0,1280,720).fill(0xf5edda);g.rect(0,floor+4,1280,100).fill(0xd0b18b);
 for(const y of [667,707])line(g,[0,y],[1280,y],2,0xb79773);
 for(const x of [150,570,1020])line(g,[x,640],[x-30,720],1.5,0xbb9b77);
 // Calm, authored postal wall details, all code paths.
 g.roundRect(76,60,222,73,8).fill(0xe4d8bd);stroke(g,0xd3c3a3,1.5);
 g.roundRect(94,77,39,32,3).fill(0xf7eedc);stroke(g,0xad9675,1.5);
 line(g,[94,78],[113,94],1.5,0xad9675);line(g,[133,78],[113,94],1.5,0xad9675);
 line(g,[153,85],[271,85],5,0x71877e);line(g,[153,101],[248,101],4,0xb29d7e);
 // Counter is behind the courier; the floor lane in front remains clear.
 poly(g,counterTop,0xb75735);
 poly(g,[[707,443],[1242,441],[1242,628],[707,628]],0xa8462d);
 poly(g,[[676,420],[707,443],[707,628],[676,607]],0x8e3928);
 g.rect(707,445,535,20).fill(0xc2603d);g.rect(707,607,535,22).fill(0x8f3b28);
 for(const x of [730,900,1072,1216]){g.rect(x,465,12,142).fill(0x943b29);line(g,[x+15,469],[x+15,602],1,0xc56640);}
 for(const y of [427,435])line(g,[716,y],[1206,y-2],1,0x9d442d);
}
function tail(g:Graphics,x:number,y:number,pitch:number){
 const p0:Point2=[x-49,y-2],p1:Point2=[x-153,y+88],p2:Point2=[x-259,y-25+pitch*20],p3:Point2=[x-218,y-126+pitch*25];
 const path=()=>g.moveTo(...p0).bezierCurveTo(...p1,...p2,...p3);
 path().stroke({color:c.ink,width:86,cap:'round'});path().stroke({color:c.furLight,width:80,cap:'round'});
 for(const t of [.18,.43,.69,.94]){const u=1-t,px=u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],py=u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1],dx=3*u*u*(p1[0]-p0[0])+6*u*t*(p2[0]-p1[0])+3*t*t*(p3[0]-p2[0]),dy=3*u*u*(p1[1]-p0[1])+6*u*t*(p2[1]-p1[1])+3*t*t*(p3[1]-p2[1]),len=Math.hypot(dx,dy),nx=-dy/len*30,ny=dx/len*30;line(g,[px-nx,py-ny],[px+nx,py+ny],23,c.dark);}
}
/** The visible shin ends inside the boot shaft; the real ankle remains hidden inside it. */
function leg(g:Graphics,hip:Point2,knee:Point2,ankle:Point2,color:number){
 limb(g,hip,knee,[ankle[0],ankle[1]-19],color,38);
}
function boot(g:Graphics,sole:Point2){
 const[x,y]=sole;
 g.moveTo(x-21,y-35).quadraticCurveTo(x-28,y-5,x-24,y-2).quadraticCurveTo(x-4,y+3,x+38,y-1).quadraticCurveTo(x+44,y-17,x+22,y-22).lineTo(x+17,y-35).closePath().fill(c.boot);stroke(g);
 g.roundRect(x-22,y-43,42,16,6).fill(c.boot);stroke(g);
 line(g,[x-17,y-33],[x+15,y-33],2,0x302d29);line(g,[x-18,y-5],[x+35,y-5],1.5,0x24251f);
}
function jacket(g:Graphics,x:number,y:number,lean:number){
 g.moveTo(x-43+lean,y-154).bezierCurveTo(x-69+lean,y-126,x-67,y-68,x-59,y+14).quadraticCurveTo(x-25,y+24,x-3,y+11).lineTo(x+8,y-24).lineTo(x+17,y+15).quadraticCurveTo(x+45,y+19,x+66,y+7).bezierCurveTo(x+59,y-66,x+64+lean,y-121,x+35+lean,y-153).closePath().fill(c.jacket);stroke(g);
 poly(g,[[x-43+lean,y-151],[x-5+lean,y-128],[x-23+lean,y-103],[x-57+lean,y-138]],c.jacketLight);
 poly(g,[[x+35+lean,y-153],[x+4+lean,y-129],[x+27+lean,y-108],[x+48+lean,y-137]],c.jacketLight);
 line(g,[x+2+lean,y-121],[x+9,y+5],2,0x1c4c50);
 for(const by of [-76,-31]){g.ellipse(x+16,y+by,6,8).fill(0xdeb25b);stroke(g,0xa87932,1.5);}
 line(g,[x-53,y-9],[x-11,y-9],1,0x41858a);line(g,[x+23,y-7],[x+56,y-7],1,0x41858a);
}
function bagBack(g:Graphics,x:number,y:number){g.moveTo(x-54,y-4).quadraticCurveTo(x-66,y+46,x-51,y+96).quadraticCurveTo(x-9,y+129,x+51,y+96).lineTo(x+57,y-4).closePath().fill(c.bag);stroke(g,c.bagEdge,3);g.ellipse(x,y,55,20).fill(c.bagDark);stroke(g,c.bagEdge,5);g.ellipse(x,y+2,45,12).fill(0x35281b);}
function bagFront(g:Graphics,x:number,y:number){
 g.moveTo(x-55,y+2).quadraticCurveTo(x-22,y+30,x+56,y+2).lineTo(x+50,y+95).quadraticCurveTo(x+2,y+127,x-50,y+95).closePath().fill(c.bag);stroke(g,c.bagEdge,3);
 g.moveTo(x-55,y+2).quadraticCurveTo(x-22,y+30,x+56,y+2).stroke({color:0xe5b35f,width:5});
 g.moveTo(x+36,y+20).quadraticCurveTo(x+31,y+89,x+16,y+104).stroke({color:0xae732b,width:2});
 line(g,[x-41,y+35],[x-39,y+86],1,0xe1a84f);
}
function head(g:Graphics,x:number,y:number,nod:number,t:number){
 y+=nod;
 // Broad cheeks and rounded ears distinguish the raccoon from a cat.
 g.moveTo(x-78,y-41).bezierCurveTo(x-116,y-78,x-104,y-148,x-88,y-140).quadraticCurveTo(x-50,y-130,x-44,y-69).closePath().fill(c.fur);stroke(g, c.ink,3);
 g.moveTo(x-78,y-54).quadraticCurveTo(x-104,y-90,x-88,y-123).quadraticCurveTo(x-62,y-104,x-59,y-69).closePath().fill(0xb58d6b);
 g.moveTo(x+41,y-65).quadraticCurveTo(x+43,y-123,x+67,y-150).quadraticCurveTo(x+98,y-107,x+75,y-40).closePath().fill(c.fur);stroke(g,c.ink,3);
 g.moveTo(x+52,y-65).quadraticCurveTo(x+55,y-112,x+65,y-128).quadraticCurveTo(x+81,y-104,x+66,y-61).closePath().fill(0xb58d6b);
 g.moveTo(x-86,y-58).bezierCurveTo(x-49,y-101,x+36,y-94,x+74,y-42).lineTo(x+106,y-26).lineTo(x+91,y-11).lineTo(x+111,y-10).lineTo(x+93,y+5).lineTo(x+104,y+8).bezierCurveTo(x+70,y+61,x-34,y+75,x-103,y+30).lineTo(x-86,y+23).lineTo(x-116,y+14).lineTo(x-96,y+1).lineTo(x-113,y-3).closePath().fill(c.fur);stroke(g,c.ink,2.5);
 // Cream brow across the cheek, dark paired eye masks, and large cream muzzle.
 g.moveTo(x-103,y+1).quadraticCurveTo(x-62,y-41,x-19,y-50).quadraticCurveTo(x+1,y-39,x+11,y-20).quadraticCurveTo(x+34,y-64,x+64,y-49).lineTo(x+99,y-23).quadraticCurveTo(x+66,y-12,x+40,y-6).quadraticCurveTo(x+13,y+11,x-3,y-7).quadraticCurveTo(x-54,y-3,x-97,y+15).closePath().fill(c.cream);
 g.moveTo(x-103,y+13).quadraticCurveTo(x-79,y-4,x-44,y-21).quadraticCurveTo(x-8,y-38,x+1,y-5).quadraticCurveTo(x-1,y+28,x-33,y+41).quadraticCurveTo(x-69,y+41,x-103,y+13).fill(c.dark);
 g.moveTo(x+19,y-20).quadraticCurveTo(x+34,y-55,x+59,y-33).lineTo(x+99,y-19).quadraticCurveTo(x+80,y+11,x+44,y+19).quadraticCurveTo(x+17,y+16,x+19,y-20).fill(c.dark);
 g.moveTo(x-32,y+25).quadraticCurveTo(x+18,y-5,x+68,y+6).quadraticCurveTo(x+87,y+27,x+63,y+48).quadraticCurveTo(x+15,y+73,x-38,y+46).closePath().fill(c.cream);
 const blink=(tweenPulse(t,5.45,5.56,5.68)+tweenPulse(t,10.85,10.94,11.05));
 for(const [ex,ey,rx,ry] of [[-28,3,15,23],[48,-8,12,20]]){const h=Math.max(2,ry*(1-blink));g.ellipse(x+ex,y+ey,rx,h).fill(0xffedc9);stroke(g,c.ink,1.5);if(h>4){const look=5*(tweenPulse(t,4.9,6,8.1));g.ellipse(x+ex+5,y+ey+2+look,rx*.56,h*.65).fill(0x3c281e);g.ellipse(x+ex+8,y+ey-6+look,3,4).fill(0xfff7e2);}}
 g.moveTo(x+49,y+12).quadraticCurveTo(x+71,y+5,x+70,y+20).quadraticCurveTo(x+61,y+39,x+47,y+27).closePath().fill(0x2e2a26);g.ellipse(x+59,y+15,7,3).fill(0x716459);
 g.moveTo(x+51,y+31).quadraticCurveTo(x+45,y+52,x+18,y+47).quadraticCurveTo(x+4,y+44,x-3,y+36).stroke({color:c.ink,width:2.5,cap:'round'});
 for(const [ax,ay,bx,by] of [[-30,32,-73,28],[-26,38,-78,41],[70,29,109,21],[70,35,115,36]])line(g,[x+ax,y+ay],[x+bx,y+by],.9,0x82745e);
 // Soft crown, dark band, forward visor, brass post badge.
 g.moveTo(x-63,y-78).bezierCurveTo(x-50,y-119,x+18,y-133,x+57,y-109).quadraticCurveTo(x+72,y-96,x+52,y-76).closePath().fill(c.jacket);stroke(g,c.tealDark,2.5);
 g.moveTo(x-62,y-78).quadraticCurveTo(x-7,y-99,x+54,y-82).lineTo(x+50,y-69).quadraticCurveTo(x-5,y-82,x-57,y-65).closePath().fill(c.tealDark);stroke(g,c.tealDark,2);
 g.moveTo(x-20,y-70).quadraticCurveTo(x+48,y-95,x+84,y-71).quadraticCurveTo(x+54,y-50,x-20,y-61).closePath().fill(c.jacketLight);stroke(g,c.tealDark,2);
 g.ellipse(x-50,y-72,8,10).fill(0xdba84e);stroke(g,0x946629,2);
}
function tweenPulse(t:number,a:number,b:number,d:number){if(t<=a||t>=d)return 0;const u=t<b?(t-a)/(b-a):(d-t)/(d-b);return u*u*(3-2*u);}
function hand(g:Graphics,p:Point2,grip:boolean,angle:number){
 const pt=(x:number,y:number):Point2=>[p[0]+x*Math.cos(angle)-y*Math.sin(angle),p[1]+x*Math.sin(angle)+y*Math.cos(angle)];
 poly(g,Array.from({length:32},(_,i)=>pt((grip?15:20)*Math.cos(i*Math.PI/16),(grip?12:14)*Math.sin(i*Math.PI/16))),c.dark,false);stroke(g,c.ink,1.5);
 if(grip)g.moveTo(...pt(-7,3)).quadraticCurveTo(...pt(6,-4),...pt(13,3)).stroke({color:0x74604c,width:1.5,cap:'round'});
 else for(const dy of [-5,2])line(g,pt(9,dy),pt(15,dy),1,0x766350);
}
export function drawEnvelope(g:Graphics,e:Envelope){
 if(!e.visible)return;
 const points=[[-56,-34],[56,-34],[56,34],[-56,34]].map(p=>paperPoint(e,p[0],p[1]));poly(g,points,c.paper);const p=(x:number,y:number)=>paperPoint(e,x,y);
 if(Math.cos(e.turn)>=0){line(g,p(-55,-33),p(0,9),1.7,0xb9986c);line(g,p(55,-33),p(0,9),1.7,0xb9986c);line(g,p(-55,33),p(-13,0),1.3,0xb9986c);line(g,p(55,33),p(13,0),1.3,0xb9986c);
  poly(g,Array.from({length:32},(_,i)=>p(11*Math.cos(i*Math.PI/16),8+10*Math.sin(i*Math.PI/16))),c.red,false);stroke(g,0x8e3528,1.2);
 }else{ // Opaque opposite face: address is drawn only after the back ceases to face camera.
  for(const [y,len] of [[-12,50],[0,40],[12,46]])line(g,p(-19,y),p(-19+len,y),2,0x8d775e);
  poly(g,[p(-47,-25),p(-32,-25),p(-32,-8),p(-47,-8)],0x7e9b91,false);
 }
}
export function drawCourier(g:Graphics,q:RaccoonPose){
 g.clear();const x=q.bodyX,y=q.rootY;
 g.ellipse(x+1,floor+3,75,13).fill({color:0x4f4439,alpha:.12});tail(g,x,y,q.bodyLean);
 // Permanent far/near limb IDs, stable painter order in a single ¾ view.
 for(const i of [0,1]){const l=q.legs[i];leg(g,l.hip,l.knee,l.ankle,i?c.fur:c.furLight);boot(g,l.sole);}
 const far=q.arms[0];limb(g,far.shoulder,far.elbow,far.hand,c.fur,26);line(g,far.shoulder,[mixN(far.shoulder[0],far.elbow[0],.7),mixN(far.shoulder[1],far.elbow[1],.7)],34,c.ink);line(g,far.shoulder,[mixN(far.shoulder[0],far.elbow[0],.7),mixN(far.shoulder[1],far.elbow[1],.7)],30,c.jacket);
 g.ellipse(x+13+q.leanX,y-176,39,58).fill(c.cream);stroke(g,c.ink,2);
 jacket(g,x,y,q.leanX);
 // Strap runs from the shoulder to the real bag mouth.
 g.moveTo(x+34+q.leanX,y-155).quadraticCurveTo(x+14,y-75,x-94,y+15).stroke({color:c.bagEdge,width:22,cap:'round'});
 g.moveTo(x+34+q.leanX,y-155).quadraticCurveTo(x+14,y-75,x-94,y+15).stroke({color:c.bag,width:17,cap:'round'});
 line(g,[x-56,y-12],[x-43,y-27],5,0xe7ba69);
 bagBack(g,q.bag.x,q.bag.y);
 head(g,x+17+q.leanX,y-222,q.headNod,q.t);
 const near=q.arms[1];limb(g,near.shoulder,near.elbow,near.hand,c.fur,29);
 const sleeveEnd:Point2=[mixN(near.shoulder[0],near.elbow[0],.65),mixN(near.shoulder[1],near.elbow[1],.65)];
 line(g,near.shoulder,sleeveEnd,40,c.ink);line(g,near.shoulder,sleeveEnd,36,c.jacketLight);line(g,[sleeveEnd[0]-12,sleeveEnd[1]-1],[sleeveEnd[0]+12,sleeveEnd[1]+1],4,c.tealDark);
 drawEnvelope(g,q.envelope);
 hand(g,far.hand,q.supporting,far.handAngle);hand(g,near.hand,q.gripping,near.handAngle);
 // Open rear cavity first; front wall clips the descending paper and fingers physically.
 bagFront(g,q.bag.x,q.bag.y);
}
const mixN=(a:number,b:number,u:number)=>a+(b-a)*u;
