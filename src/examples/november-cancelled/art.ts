import {Container, Graphics, Text} from 'pixi.js';

export const C = {
 ink:0x231b2d, night:0x16172e, plum:0x352745, white:0xfff5dd, pink:0xff4c77, red:0xdd2d4f,
 orange:0xffa444, gold:0xffce4f, mint:0x90e1bc, ice:0xbceef5, blue:0x269ac0, paper:0xf9e7b1,
};
export const clip = (n:number,a=0,b=1) => Math.max(a,Math.min(b,n));
export const step = (t:number,hz=8) => Math.floor(t*hz)/hz;
export const ease = (n:number) => {const x=clip(n);return x*x*(3-2*x);};
export function r(g:Graphics,x:number,y:number,w:number,h:number,color:number,alpha=1){g.rect(x,y,w,h).fill({color,alpha});}
export function rr(g:Graphics,x:number,y:number,w:number,h:number,radius:number,color:number){g.roundRect(x,y,w,h,radius).fill(color);}
export function e(g:Graphics,x:number,y:number,rx:number,ry:number,color:number,alpha=1){g.ellipse(x,y,rx,ry).fill({color,alpha});}
export function p(g:Graphics,points:number[],color:number,alpha=1){g.poly(points).fill({color,alpha});}
export function l(g:Graphics,points:number[],color:number,width=4,alpha=1){
 g.moveTo(points[0],points[1]);for(let i=2;i<points.length;i+=2)g.lineTo(points[i],points[i+1]);
 g.stroke({color,width,alpha,cap:'round',join:'round'});
}
export function arc(g:Graphics,x:number,y:number,rx:number,ry:number,dir:number,color:number,width=4){
 const points=[];for(let i=0;i<=12;i++){const a=i*Math.PI/12;points.push(x+Math.cos(a)*rx,y+Math.sin(a)*ry*dir);}l(g,points,color,width);
}
export function star(g:Graphics,x:number,y:number,radius:number,color:number,spikes=8,angle=0){
 const points=[];for(let i=0;i<2*spikes;i++){const a=i*Math.PI/spikes+angle,rad=i%2?radius*.47:radius;points.push(x+Math.cos(a)*rad,y+Math.sin(a)*rad);}p(g,points,color);
}
export class Art {
 canvas=new Container();
 plate=new Graphics();
 set=new Graphics();
 action=new Graphics();
 type=new Container();
 front=new Graphics();
 hud=new Container();
 letters:Text[]=[];
 index=0;
 constructor(root:Container){
  root.addChild(this.canvas,this.hud);
  this.canvas.addChild(this.plate,this.set,this.action,this.front,this.type);
 }
 reset(){
  this.index=0;
  this.plate.clear();this.set.clear();this.action.clear();this.front.clear();
  for(const label of this.letters)label.visible=false;
  this.canvas.position.set(0,0);this.canvas.scale.set(1);
 }
 title(text:string,x:number,y:number,size:number,color=C.white,opt:{angle?:number;align?:'left'|'center'|'right';hud?:boolean;weight?:'600'|'700'|'800'|'900';spacing?:number}={}){
  let label=this.letters[this.index++];
  if(!label){
   label=new Text({text:'',style:{fontFamily:'Arial, sans-serif',fontWeight:'900',fontSize:size,fill:color}});
   this.letters.push(label);
  }
  const holder=opt.hud?this.hud:this.type;if(label.parent!==holder)holder.addChild(label);
  label.visible=true;label.text=text;label.style.fontSize=size;label.style.fill=color;label.style.fontWeight=opt.weight??'900';
  label.style.letterSpacing=opt.spacing??0;label.rotation=opt.angle??0;
  label.anchor.set(opt.align==='left'?0:opt.align==='right'?1:.5,.5);label.position.set(x,y);
 }
 camera(scale=1,focusX=360,focusY=600){this.canvas.scale.set(scale);this.canvas.position.set(focusX*(1-scale),focusY*(1-scale));}
}

export type Expression = 'happy'|'scared'|'bored'|'angry'|'closed'|'stare';
type Person = 'anchor'|'student'|'teacher'|'shopper'|'cashier'|'reporter';
const cast = {
 anchor:{skin:0xdb996e,shade:0xb56d58,hair:0x462737,shirt:0x53357d,trim:0xe14e7b},
 student:{skin:0xb96f56,shade:0x934a43,hair:0x30212c,shirt:0xf6a227,trim:0x2d6467},
 teacher:{skin:0xf2ae8a,shade:0xc47c69,hair:0x502b3b,shirt:0x38635a,trim:0xeed8a5},
 shopper:{skin:0xedaa79,shade:0xbd7559,hair:0x432333,shirt:0xcf4671,trim:0x621b58},
 cashier:{skin:0xa7634b,shade:0x854538,hair:0x352434,shirt:0x327571,trim:0xf3cd65},
 reporter:{skin:0xe0a47e,shade:0xb87962,hair:0x3a2c48,shirt:0xd4445c,trim:0xe9b17a},
};
function ellipseAt(g:Graphics,x:number,y:number,scale:number,ax:number,ay:number,rx:number,ry:number,c:number){e(g,x+ax*scale,y+ay*scale,rx*scale,ry*scale,c);}
function lineAt(g:Graphics,x:number,y:number,scale:number,a:number[],c:number,width=4){
 l(g,a.map((v,i)=>v*scale+(i%2?y:x)),c,width*scale);
}
export function person(g:Graphics,who:Person,x:number,y:number,scale:number,opts:{expr?:Expression;mouth?:number;look?:number;arm?:number;leftHand?:[number,number];rightHand?:[number,number];blink?:boolean}={}){
 const {skin,shade,hair,shirt,trim}=cast[who],expr=opts.expr??'happy',mouth=opts.mouth??0,look=opts.look??0,arm=opts.arm??0;
 const P=(a:number[],c:number)=>p(g,a.map((v,i)=>v*scale+(i%2?y:x)),c);
 const E=(a:number,b:number,c:number,d:number,col:number)=>ellipseAt(g,x,y,scale,a,b,c,d,col);
 const L=(a:number[],c:number,w?:number)=>lineAt(g,x,y,scale,a,c,w);
 E(5,168,114,17,C.ink);P([-77,148,-18,148,-12,180,-80,180],hair);P([14,148,70,148,77,179,8,179],hair);
 P([-102,78,-54,47,55,45,105,82,83,160,-82,160],C.ink);
 P([-95,78,-52,52,52,51,97,84,78,151,-78,151],shirt);
 P([-61,48,-12,69,0,110,9,72,58,50,43,86,13,111,-7,126,-42,84],trim);
 if(who==='anchor'){P([-13,75,5,74,17,122,1,139,-12,117],C.white);}
 if(who==='reporter'){P([-61,48,62,45,71,74,-65,80],trim);L([-46,73,37,66],C.red,6);P([-24,77,-3,70,8,139,-17,142],trim);}
 if(who==='student'){L([-35,80,-19,126],C.white,3);L([30,81,14,128],C.white,3);P([-47,123,48,122,39,146,-37,146],0xc97b31);}
 if(who==='cashier'){P([23,89,63,88,62,108,21,108],C.white);L([28,97,55,97],trim,3);}
 const [lx,ly]=opts.leftHand??[-99,127-arm*.2], [rx,ry]=opts.rightHand??[109,119-arm];
 L([-67,81,-85+(lx+99)*.34,104+(ly-127)*.34,lx,ly],shirt,30);E(lx,ly,16,16,skin);
 L([68,82,98+(rx-109)*.36,100+(ry-119)*.45,rx,ry],shirt,30);E(rx,ry,16,16,skin);
 E(0,-16,107,91,C.ink);E(0,-13,101,87,skin);
 E(-99,6,15,21,skin);E(101,3,15,21,skin);
 P([-100,-43,-82,-83,-37,-107,25,-103,82,-85,102,-40,83,-36,70,-58,43,-43,-3,-64,-31,-53,-65,-63,-87,-25],hair);
 if(who==='anchor'){P([-91,-66,-45,-107,24,-112,75,-90,87,-56,29,-69,12,-52,-8,-72,-49,-56],hair);L([-69,-78,-28,-94,34,-95,61,-85],0x774257,5);}
 if(who==='student'){P([-101,-50,-86,-84,-43,-111,38,-111,83,-90,96,-50,54,-54,3,-51,-39,-49],trim);P([-36,-62,85,-66,119,-48,66,-33,-6,-43],C.ink);P([-41,-69,81,-70,119,-54,67,-43,-10,-50],C.orange);}
 if(who==='teacher'){E(66,-97,40,43,hair);E(72,-104,28,31,0x663947);L([35,-83,55,-92,85,-90],trim,6);}
 if(who==='shopper'){P([-113,-48,-105,-85,-60,-108,18,-111,78,-91,108,-51,77,-44,42,-51,-4,-43,-51,-47],0xaa2359);L([-83,-68,80,-67],trim,9);E(-13,-112,22,18,C.pink);}
 if(who==='cashier'){P([-105,-47,-91,-80,-53,-108,21,-112,85,-95,103,-52,73,-53,43,-60,-11,-49,-54,-55],trim);P([-10,-61,85,-66,116,-50,63,-39],0x4a6755);}
 if(who==='reporter'){P([-112,-45,-102,-80,-60,-115,26,-118,87,-92,106,-48,76,-42,37,-58,-10,-49,-70,-46],shirt);L([-85,-64,-38,-84,36,-83,82,-64],trim,9);E(-14,-119,22,16,C.white);P([-109,-49,-92,-46,-91,41,-112,28],trim);P([96,-51,113,-41,113,24,93,35],trim);}
 const wide=expr==='scared',low=expr==='bored'||opts.blink;
 for(const px of [-37,36]){
  if(low){L([px-23,-11,px+24,-10],C.ink,5);if(!opts.blink)E(px+look,-6,6,6,C.ink);}
  else{E(px,-6,wide?28:25,wide?30:23,C.white);E(px+look,-3,wide?7:9,wide?10:12,C.ink);E(px+look-2,-7,2.5,3,0xffffff);}
 }
 const upset=expr==='angry';
 L([-61,-38,-19,upset?-24:-42],hair,6);L([15,upset?-25:-42,57,-38],hair,6);
 if(who==='teacher'){L([-67,-19,-65,11,-8,11,-5,-18,-67,-19],hair,5);L([5,-18,9,11,65,11,68,-20,5,-18],hair,5);L([-4,-7,7,-7],hair,4);}
 P([-4,6,-13,22,8,21],shade);E(-65,26,11,5,shade);E(66,25,11,5,shade);
 if(mouth>0||wide){E(1,45,wide?23:20,wide?25:5+14*mouth,C.ink);if(mouth>.4)E(1,41,wide?13:15,4,C.white);}
 else if(expr==='happy'){L([-19,41,-9,50,10,52,25,42],C.ink,5);}
 else{L([-18,48,20,46],C.ink,5);}
}

export function bear(g:Graphics,x:number,y:number,s:number,options:{mouth?:number;expr?:Expression;reach?:number;blink?:boolean}={}){
 const {mouth=0,expr='bored',reach=0,blink=false}=options;
 const E=(a:number,b:number,c:number,d:number,col:number)=>ellipseAt(g,x,y,s,a,b,c,d,col);
 const P=(a:number[],c:number)=>p(g,a.map((v,i)=>v*s+(i%2?y:x)),c);
 const L=(a:number[],c:number,w?:number)=>lineAt(g,x,y,s,a,c,w);
 E(0,218,168,17,0x5b879b);
 E(-112,168,59,56,0x7b9caf);E(110,168,59,56,0x7b9caf);
 E(2,113,135,117,0x42627c);E(2,110,130,111,0xe3eff0);
 P([-119,91,-89,141,-52,171,13,188,85,168,118,133,100,183,49,213,-58,208,-114,180],0xb8dce5);
 E(-114,199,47,31,0x42627c);E(-114,196,43,27,0xf6f5e5);
 E(113,199,47,31,0x42627c);E(113,196,43,27,0xf6f5e5);
 E(-80,-70,34,35,0x42627c);E(82,-70,35,35,0x42627c);
 E(-80,-70,30,30,0xe9efeb);E(82,-70,30,30,0xe9efeb);
 E(-80,-70,15,16,0x8ca9b9);E(82,-70,15,16,0x8ca9b9);
 E(0,-3,121,93,0x42627c);E(0,-5,117,90,0xfaf7e9);
 P([-113,-15,-101,27,-77,60,-40,78,28,82,76,59,104,30,93,65,56,84,0,88,-63,79,-101,50],0xc5e0e4);
 E(0,37,55,34,0xe1ebec);
 const sneeze=expr==='closed';
 for(const px of [-42,41]){
  if(blink||sneeze){L([px-14,-8,px,-1,px+13,-8],C.ink,5);}
  else if(expr==='bored'){L([px-17,-9,px+14,-9],0x395369,4);E(px-3,-6,5,6,C.ink);}
  else{E(px,-11,12,13,C.white);E(px-1,-8,7,9,C.ink);}
 }
 E(0,17,25,13,0x263246);E(-7,13,9,3,0x718594);
 if(mouth>0){E(1,53,20+mouth*7,6+mouth*18,C.ink);if(mouth>.6)E(2,62,13,6,C.pink);}
 else L([-18,53,0,55,19,51],C.ink,4);
 L([-74,-33,-49,-39,-31,-34],0x567388,5);L([24,-35,45,-42,67,-34],0x567388,5);
 if(reach>0){
  L([82,96,120,115-reach*.35,135,139-reach],0x42627c,46);
  L([82,95,121,113-reach*.35,135,136-reach],0xe2f0ed,39);E(136,134-reach,24,22,0xf9f6e8);
 }
}
export function talk(t:number,start:number,end:number){
 if(t<start||t>=end)return 0;
 return [.3,.7,.1,.53,.9,.33,.0,.65,.24][Math.floor(t*10)%9];
}
export const blink = (t:number,offset=0) => Math.floor((t+offset)*24)%83<3;
