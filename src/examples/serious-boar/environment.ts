import {Graphics} from 'pixi.js';
import {packet} from './illustration';
const INK=0x59635a;
function line(g:Graphics,x:number,y:number,a:number,b:number,color:number,width:number){g.moveTo(x,y).lineTo(a,b).stroke({color,width,cap:'round'});}
function distantAcacia(g:Graphics,x:number,y:number,s:number,color:number){
 g.moveTo(x,y).lineTo(x+3*s,y-66*s).lineTo(x-24*s,y-95*s).moveTo(x+3*s,y-66*s).lineTo(x+33*s,y-107*s).stroke({color,width:6*s});
 g.ellipse(x-34*s,y-101*s,58*s,12*s).ellipse(x+29*s,y-112*s,70*s,12*s).ellipse(x,y-114*s,60*s,14*s).fill(color);
}
export function drawStore(g:Graphics){g.clear().rect(0,0,1280,720).fill(0xd5e7df);
 g.rect(0,0,1280,597).fill(0xd6eae4);g.rect(0,396,1280,201).fill(0xc8d9ca);
 // A quieter city and river remain behind the continuous storefront glass.
 for(let i=0;i<21;i++){
  const x=i*65-15,h=43+(i*37%89);g.rect(x,309-h,53,h).fill(i%2?0xb8c9bb:0xc3d1c0);
  for(let row=0;row<5;row++)for(let col=0;col<4;col++)g.rect(x+6+col*11,309-h+9+row*16,5,8).fill(0xd6e0cd);
 }
 g.rect(0,335,1280,29).fill(0xbbd7d0);g.rect(0,365,1280,8).fill(0xe4dfc5);
 for(let i=0;i<23;i++){const x=i*59;g.moveTo(x,329).lineTo(x+5,299).lineTo(x+14,291).lineTo(x+24,313).lineTo(x+21,335).closePath().fill(0xb4c5a8);}
 for(const x of [33,410,790,1112]){
  g.rect(x,0,18,600).fill(0x98ada5);g.rect(x+3,0,4,594).fill(0xe9eee1);g.rect(x+18,0,3,599).fill(0x647b74);
 }
 g.moveTo(68,0).lineTo(175,0).lineTo(644,575).lineTo(523,575).closePath().fill({color:0xf5f7e8,alpha:.13});
 g.moveTo(564,0).lineTo(609,0).lineTo(1033,575).lineTo(979,575).closePath().fill({color:0xf5f7e8,alpha:.17});
 g.rect(0,588,1280,21).fill(0x8d9c90);g.rect(0,595,1280,5).fill(0xe9e9d7);line(g,0,608,1280,608,0x53625a,3);
 g.rect(0,610,1280,110).fill(0xb18c72);
 // Floor perspective is one fixed construction, independent of character pose.
 for(let r=0;r<4;r++){
  const y=612+r*27;
  for(let c=-2;c<17;c++){
   const x=c*98+r*13;g.poly([x,y,x+79,y,x+65,y+20,x-7,y+20]).fill(0xd9cbb0);
   g.poly([x+10,y+5,x+58,y+5,x+51,y+13,x+5,y+13]).fill(0x8d715e);
  }
 }
 // Opaque side shelving and the same four insect product families.
 g.rect(1135,209,145,425).fill(0xa89c78).stroke({color:INK,width:4});
 for(let row=0;row<4;row++){
  g.rect(1138,224+row*89,142,75).fill(0xc5b994);
  for(let c=0;c<3;c++)packet(g,row,1162+c*42,263+row*89,0,.41);
  g.rect(1132,298+row*89,148,9).fill(0x7e795e).stroke({color:INK,width:1.5});
 }
}
export function drawSavanna(g:Graphics){g.clear().rect(0,0,1280,720).fill(0xeee0b9);
 g.rect(0,0,1280,315).fill(0xcbd8c7);g.ellipse(1102,125,58,58).fill(0xf6e5ae);
 g.moveTo(0,347).quadraticCurveTo(206,299,422,332).quadraticCurveTo(615,271,838,330).quadraticCurveTo(1097,290,1280,326)
  .lineTo(1280,720).lineTo(0,720).closePath().fill(0xc6bc85);
 distantAcacia(g,1055,371,.66,0x999f71);distantAcacia(g,207,359,.43,0xa8ae7d);distantAcacia(g,908,344,.31,0xa0a979);
 g.moveTo(0,446).bezierCurveTo(385,352,782,401,1280,470).lineTo(1280,720).lineTo(0,720).closePath().fill(0xd4bd83);
 g.moveTo(0,610).bezierCurveTo(366,500,915,546,1280,594).lineTo(1280,720).lineTo(0,720).closePath().fill(0xdcc68e);
 // Large acacia: roots support the seated pose; branches carry a broad canopy.
 g.moveTo(437,596).bezierCurveTo(489,538,480,406,463,323).lineTo(387,250).lineTo(402,237)
  .lineTo(488,296).lineTo(517,188).lineTo(541,188).lineTo(532,318).lineTo(613,256).lineTo(627,270)
  .lineTo(540,362).bezierCurveTo(551,438,524,548,568,597).lineTo(526,580).lineTo(492,616).lineTo(489,585).closePath()
  .fill(0x8d7755).stroke({color:0x645a3e,width:4,join:'round'});
 g.moveTo(494,552).bezierCurveTo(511,448,500,382,506,314).moveTo(514,355).lineTo(594,277).stroke({color:0xb09865,width:8,cap:'round'});
 for(const [x,y,rx,ry] of [[157,181,143,44],[343,146,174,55],[543,134,191,62],[738,167,158,46],[435,186,245,45]]){
  g.ellipse(x,y,rx,ry).fill(0x7e8b58).stroke({color:0x606e48,width:2});
 }
 for(const [x,y,rx,ry] of [[192,164,117,25],[381,124,157,34],[580,113,147,38],[747,154,116,28]])g.ellipse(x,y,rx,ry).fill(0x95a067);
 g.ellipse(641,602,284,40).fill({color:0x7a7950,alpha:.18});
 for(let i=0;i<65;i++){
  const x=(i*173)%1280,y=451+(i*71)%266;
  if(x>420&&x<947&&y<649)continue;
  g.moveTo(x-6,y).lineTo(x-10,y-12).moveTo(x,y).lineTo(x+1,y-17).moveTo(x+6,y).lineTo(x+12,y-8).stroke({color:i%2?0xa6a267:0xb2a56e,width:1.5,cap:'round'});
 }
}
