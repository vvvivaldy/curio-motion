import {Container, Graphics} from 'pixi.js';
import {Art,C,r,rr,e,p,l,star,person,bear,talk,blink,clip,ease,step} from './art';

const settings={width:720,height:1280,fps:24,durationInFrames:1200,background:C.night};
const white=0xfff6e2;
function label(a:Art,text:string,x:number,y:number,fill:number=C.ink,color:number=C.white,width=210){
 rr(a.front,x-width/2+4,y-16+5,width,33,4,0x231b2d);
 rr(a.front,x-width/2,y-16,width,33,4,fill);
 a.title(text,x,y,15,color,{spacing:1.8});
}
function footer(a:Art,dark:number){
 p(a.plate,[-250,1080,970,1080,970,1530,-250,1530],dark);
}
function shadow(a:Art,x:number,y:number,rx:number,ry:number,col:number){e(a.set,x,y,rx,ry,col,.34);}
function impact(g:Graphics,x:number,y:number,radius:number,t:number,color:number){
 for(let i=0;i<12;i++){
  const angle=(i+.25)*Math.PI/6; const start=radius+(i%3)*15, end=start+14+((i*31)%50)*(1-t);
  l(g,[x+Math.cos(angle)*start,y+Math.sin(angle)*start,x+Math.cos(angle)*end,y+Math.sin(angle)*end],color,3+i%3,.86*(1-t));
 }
}
function filmGrain(g:Graphics,opacity=.09){
 for(let i=0;i<110;i++){
  const x=(i*149+21)%723,y=(i*433+39)%1280;
  r(g,x,y,2+i%5,1+i%2,i%3===0?0xffffff:0x1a1337,opacity);
 }
}
function newsBackground(a:Art){
 r(a.plate,-240,-220,1200,1640,0x352246);r(a.plate,-240,739,1200,900,0x241633);
 for(let x=-150;x<950;x+=108){p(a.plate,[x-42,-100,x+11,-100,x+211,1280,x+136,1280],0x744581,.15);}
 rr(a.set,40,142,640,458,21,0x20162f);rr(a.set,49,151,622,440,17,0x5f367e);
 rr(a.set,63,163,594,413,12,0x423059);
 for(let y=190;y<560;y+=29)r(a.set,66,y,587,1,0x937aa3,.22);
 for(let x=84;x<640;x+=36)r(a.set,x,173,1,397,0x937aa3,.13);
 l(a.set,[67,568,651,568],0x9a74b7,2);
 for(let i=0;i<9;i++)e(a.set,87+i*15,583,3,3,i<3?C.pink:0x85748d);
 e(a.set,634,583,4,4,C.mint);
 footer(a,0x241633);
}
function desk(g:Graphics,x:number,y:number,w:number){
 p(g,[x-w*.43,y-36,x+w*.43,y-36,x+w*.52,y,x-w*.51,y],0x8860aa);
 p(g,[x-w*.51,y,x+w*.52,y,x+w*.45,y+148,x-w*.43,y+148],0x392447);
 p(g,[x-w*.48,y+13,x+w*.49,y+13,x+w*.42,y+131,x-w*.40,y+131],0x553369);
 l(g,[x-w*.45,y+23,x+w*.45,y+23],C.pink,5);
 l(g,[x-w*.32,y+113,x+w*.31,y+113],0x8353a2,4);
}
function news(a:Art,t:number){
 newsBackground(a);
 const bang=clip(1-t*2),change=t>=2.58, shock=step(t,12);
 const roll=bang?Math.sin(shock*65)*bang*11:0;
 const border=t<.5&&Math.floor(t*8)%2===0?0xffad73:C.pink;
 p(a.set,[83,215,618,182,638,446,106,477],0x23172e);
 p(a.set,[76,200,610,167,626,424,92,454],border);
 p(a.set,[89,212,597,180,609,412,105,441],0xcd244a);
 a.title('NOVEMBER',352,277,76,white,{angle:-.06,spacing:1});
 a.title('CANCELLED',353,366,73,white,{angle:-.06,spacing:1});
 label(a,'CHANNEL 32 / LIVE',159,100,C.gold,C.ink,210);
 label(a,'BREAKING',578,100,C.red,white,142);
 const headY=change?647:664;
 person(a.action,'anchor',351+roll,headY-bang*54,1.34,{expr:t<.32?'scared':'stare',mouth:talk(t,.28,.83)||talk(t,1.06,2.63),arm:Math.max(0,45-ease(t*.75)*55),look:change?2:9,blink:blink(t,.5)});
 desk(a.front,360,825,604);
 p(a.front,[270,808,342,798,388,819,309,829],C.paper);
 l(a.front,[322,813,345,811,361,816],0x917c8b,3);
 impact(a.front,360,281,259,1-bang,C.gold);
 if(change){
  a.camera(1.09,358,584);
  a.title('CONFIRMED',360,925,22,0xe8bcff,{spacing:4});
 }else{
  a.title('BREAKING NEWS',360,925,20,0xe8bcff,{spacing:4});
 }
 if(t<.12)r(a.front,-100,-100,920,1480,0xffffff,.08);
}
function school(a:Art,t:number){
 r(a.plate,-240,-200,1200,1700,0xf0bf83);
 r(a.plate,-240,-150,1200,277,0xf9d699);
 r(a.plate,-240,859,1200,700,0x86555b);
 for(let i=-4;i<12;i++)l(a.plate,[i*120,861,360+(i*120-360)*2,1360],0x694552,3,.4);
 l(a.plate,[-190,860,940,860],0xa26b59,13);
 for(let i=0;i<12;i++)r(a.plate,i*65,122,3,736,0xac725b,.14);
 rr(a.set,32,163,638,342,12,0x6d4552);rr(a.set,45,176,612,317,5,0x2b6a66);
 rr(a.set,54,185,592,295,4,0x356f62);
 a.title('LESSON #32',353,251,52,0xece9c2,{spacing:1});
 l(a.set,[139,291,579,287],0x96b5a0,4,.57);
 l(a.set,[95,384,175,381,196,397,258,359,303,361],0xece9c2,5,.8);
 l(a.set,[497,387,580,366,589,403,505,421,497,387],0xece9c2,4,.7);
 l(a.set,[503,387,546,400,579,365],0xece9c2,4,.7);
 r(a.set,85,498,538,14,0x895f60);r(a.set,211,490,75,9,0xddc69c);r(a.set,546,491,43,8,white);
 label(a,'1 / SCHOOL',145,103,0x32645d,C.white,168);
 const local=t-5,push=ease((local-2.55)*1.5),push2=ease((local-4.25)*3);
 const look=local<2?10:-10;
 const shoving=local>4.23?push2:push;
 const contact=ease(shoving*3.5)*(1-ease((shoving-.36)*2.9));
 if(local<2.17)a.camera(1.23,203,673);
 else if(local>=4.32)a.camera(1.28,467,711);
 else a.camera(1.04,358,628);
 person(a.action,'teacher',489,642,1.27,{expr:'bored',look:-10,mouth:talk(t,7.67,9.80),leftHand:[-99+contact*73,127-contact*7],blink:blink(t,.4)});
 person(a.action,'student',215,721+(local<2?Math.floor(Math.sin(step(local)*7)*3):0),1.08,{expr:local<2.18?'happy':'scared',look,mouth:talk(t,5.35,6.22),arm:local<1.9?20:0,blink:blink(t,.3)});
 p(a.front,[119,829,602,806,647,899,95,922],0x9b5c56);
 p(a.front,[116,815,601,795,645,879,93,905],0xf0ad76);
 l(a.front,[114,837,621,810],0xffcd8b,4);
 for(const offset of [0,1]){
  const go=offset?push2:push;
  if(go===0)continue;
  const px=437-go*(170-offset*44),py=819+go*(33+offset*19);
  p(a.front,[px-39,py-25,px+43,py-24,px+63,py+19,px-52,py+23],0xbf8a74);
  p(a.front,[px-40,py-31,px+41,py-30,px+63,py+13,px-52,py+18],white);
  l(a.front,[px-23,py-11,px+35,py-13],C.red,5);
  l(a.front,[px-27,py+2,px+43,py-2],0x8b7687,3);
  if(go>.9)a.title(offset?'2':'1',px+39,py-17,18,C.red);
 }
}
function shopBackground(a:Art){
 r(a.plate,-240,-210,1200,1650,0x90d6c0);r(a.plate,-240,773,1200,750,0x326c72);
 for(let x=-160;x<970;x+=123)l(a.plate,[x,778,360+(x-360)*2.1,1490],0x234c5d,3,.44);
 for(let row=0;row<2;row++){
  const y=373+row*128;
  r(a.set,-165,y,1050,13,0x3e7b77);
  for(let i=0;i<18;i++){
   const x=-148+59*i,h=55+(i*18+row*21)%57,c=[0x4f9790,0xc99068,0xddb06d,0x579a85,0xa57d90][(i+row*2)%5];
   rr(a.set,x,y-h,45,h,6,c);
   r(a.set,x+6,y-h+14,33,18,0xf4d5ae,.68);
   r(a.set,x+9,y-h+21,27,3,c);
  }
 }
 rr(a.set,195,149,335,98,10,0x3d776f);rr(a.set,195,140,335,98,10,0x367466);
 a.title('CHECKOUT',362,189,44,0xe8f1ce,{spacing:5});
 label(a,'2 / STORE',155,103,0x2d6058,white,188);
}
function register(g:Graphics,x:number,y:number){
 p(g,[x-66,y-11,x+61,y-11,x+100,y+52,x-100,y+52],0x264557);
 p(g,[x-87,y+52,x+97,y+52,x+99,y+73,x-88,y+73],0x233345);
 rr(g,x-70,y-74,137,91,12,0x23414c);rr(g,x-56,y-61,109,54,7,0x698e7b);
 l(g,[x-27,y-24,x+23,y-38,x+36,y-20],C.gold,4);
 l(g,[x-52,y+39,x+52,y+40],0x76929a,4);
}
function receipt(a:Art,x:number,y:number,w:number,h:number,color=C.paper){
 const end=[];for(let i=7;i>=0;i--)end.push(x-w/2+w*i/7,y+h+(i%2?7:0));
 p(a.front,[x-w/2+6,y-3,x+w/2+6,y-3,x+w/2+13,y+h+8,...end.map((v,i)=>v+(i%2?8:8))],0x49384d,.4);
 p(a.front,[x-w/2,y,x+w/2,y,x+w/2,y+h,...end],color);
 for(let py=y+18;py<y+h-9;py+=13){
  l(a.front,[x-w*.38,py,x+w*(.15+((py|0)%4)*.053),py],0x8b7773,2,.68);
 }
}
function shop(a:Art,t:number){
 shopBackground(a);
 const later=t>=37,local=t-(later?37:11),amount=ease(local*2.2);
 shadow(a,495,854,156,26,0x2b343d);
 person(a.action,'shopper',492,680,1.24,{expr:later?'angry':local<2.35?'happy':'scared',look:-10,mouth:later?(talk(t,37.45,38.52)||talk(t,39.78,40.73)):talk(t,11.30,11.87),arm:Math.max(0,10+Math.sin(step(local)*7)*9),rightHand:later?[76,123-amount*57]:undefined,blink:blink(t,.6)});
 person(a.action,'cashier',211,647,1.13,{expr:'bored',look:10,mouth:later?0:(talk(t,13.1,14.51)||talk(t,14.92,16.1)),arm:0,blink:blink(t,.2)});
 p(a.front,[-46,801,466,796,444,936,-55,963],0x354d62);
 p(a.front,[-46,790,411,765,474,813,-55,855],0x62a4a1);
 l(a.front,[-26,814,444,782],0xc9e2c8,4);
 register(a.front,215,760);
 if(later){
  receipt(a,488,785-110*amount,182,168+9*amount,white);
  r(a.front,402,725-12*amount,175,147,white);
  a.title('DECEMBER',488,748-15*amount,27,C.ink,{spacing:1});
  a.title('999 ₽',488,785-15*amount,46,C.red);
  a.title('/ MONTH',487,823-15*amount,19,C.ink,{spacing:1});
  if(local>=2.72){
   const sx=232,sy=390;
   rr(a.front,sx-125,sy-51,250,100,12,0x236777);rr(a.front,sx-130,sy-57,250,100,12,0xeee6af);
   a.title('+ SNOW',sx-5,sy-20,31,C.ink);
   a.title('sold separately',sx-5,sy+13,19,0x596858);
   impact(a.front,sx,sy,131,clip((local-2.72)*2),white);
  }
  a.camera(local>=4.8?1.16:1.02,local>=4.8?470:357,689);
 }else{
  const length=12+ease((local-2.2)*.9)*197;
  if(local>1.92)receipt(a,217,809,79,length);
  if(local>=2.44)a.camera(1.15,274,765);
  else a.camera(1.12,480,699);
  if(local>=3.45)label(a,'DEALS: 0%',509,538,0xbc315d,white,164);
 }
}
function infographic(a:Art,t:number){
 const local=t-17,second=local>=2.76;
 r(a.plate,-230,-230,1250,1710,second?0x29366a:0xe79b62);
 for(let i=-8;i<18;i++)p(a.plate,[i*96,-100,i*96+35,-100,i*96+472,1290,i*96+440,1290],second?0xa693cc:0xf5d29a,.23);
 label(a,'DATA / CHANNEL 32',177,100,C.ink,C.white,232);
 if(!second){
  const snap=ease(local*3),stamp=ease((local-.25)*4);
  rr(a.set,91,242+25*(1-snap),550,650,18,0xa45f6a);rr(a.set,78,227+25*(1-snap),550,650,18,0xffedba);
  rr(a.set,78,227+25*(1-snap),550,116,18,0x50306c);
  for(const x of [163,529]){
   rr(a.action,x-12,196,x>300?27:25,75,9,0x352743);
   r(a.action,x-6,200,7,42,0xa285a4);
  }
  a.title('OCTOBER',354,287+25*(1-snap),49,white,{spacing:2});
  a.title('32',351,581,Math.max(1,250*stamp),0xb73953,{spacing:-6});
  l(a.front,[144,740,551,740],0xce9d8b,4);
  a.title('CALENDAR JAMMED',352,805,26,0x684257,{spacing:2});
  impact(a.front,353,565,233,clip((local-.37)*1.5),0x9f3853);
 }else{
  const h=ease((local-2.76)*1.5);
  rr(a.set,49,187,621,701,20,0x20244f);rr(a.set,41,177,621,701,20,0x425381);
  a.title('ABSURDITY LEVEL',350,242,38,white);
  for(let i=0;i<8;i++)l(a.set,[108,302+i*62,605,302+i*62],0x738bb8,1,.6);
  for(let i=0;i<8;i++)l(a.set,[108+i*69,301,108+i*69,737],0x738bb8,1,.6);
  l(a.action,[108,307,108,738,604,738],0x9eacc4,4);
  const point=[127,694,213,655,305,673,375,600,437,611,575,605-280*h];
  l(a.action,point,0x1a244a,22);l(a.action,point,C.mint,13);
  e(a.action,575,605-280*h,14,14,C.gold);
  if(h>.86){star(a.front,559,379,71,C.gold,12);a.title('?!',556,380,48,0x352743);}
  a.title('→  TO THE POLAR BEAR',354,808,24,C.ice,{spacing:.6});
 }
}
function arcticBackground(a:Art,t:number){
 r(a.plate,-340,-450,1390,2050,0x385981);
 p(a.plate,[-280,0,470,-100,850,242,864,345,422,149,-286,237],0x7499a2,.45);
 p(a.plate,[-245,211,448,135,1000,368,960,408,420,246,-245,327],0x81c7af,.39);
 e(a.plate,547,280,86,86,0x9cc3cf);
 e(a.plate,538,272,76,76,0xc5e2dd);
 for(let i=0;i<34;i++){
  const x=(i*231+83)%785-27,y=118+(i*143+19)%433;
  e(a.plate,x,y,1+i%3,1+i%3,white,.52);
 }
 p(a.set,[-280,667,-19,617,137,468,223,556,319,422,475,576,571,460,783,680,960,699,960,850,-280,830],0x708ab3);
 p(a.set,[53,560,137,468,210,543,147,532,123,567,105,529],0xb6d7e7);
 p(a.set,[251,524,319,422,404,507,348,494,326,524,294,492,288,527],0xc5e2ef);
 p(a.set,[520,520,571,460,646,543,592,512,574,549,550,512],0xa4cde2);
 p(a.set,[-280,696,-60,658,109,687,317,638,500,680,714,646,960,683,960,1580,-280,1580],0xb5d9e2);
 p(a.set,[-280,807,-59,759,182,791,386,745,573,764,960,731,960,1510,-280,1510],0xdcecee);
 p(a.set,[-285,1047,-26,975,290,1003,473,963,960,998,960,1540,-285,1540],0xb8d4e6);
 e(a.set,129,958,104,32,0x769eb6);
 e(a.set,129,951,97,25,0x3a627d);
 e(a.set,129,947,89,20,0x37546e);
 l(a.set,[89,951,117,957,151,952,173,954],0x7fb9ca,3,.7);
 l(a.set,[141,988,144,999,173,1011,169,1021],0x93b2c8,4,.75);
 l(a.set,[299,911,267,930,222,930,212,952],0x9abacc,3,.74);
 for(let i=0;i<44;i++){
  const raw=(i*157+step(t,12)*(36+i%7*7))%900-90;
  const y=131+(i*107+step(t,12)*12)%834;
  l(a.front,[raw,y,raw+3+i%11,y+1+i%4],white,1+i%4,i%3===0?.7:.31);
 }
 label(a,'3 / ARCTIC',153,103,0x264a66,white,183);
}
function microphone(g:Graphics,x:number,y:number,angle:number){
 const dx=Math.cos(angle),dy=Math.sin(angle),px=-dy,py=dx;
 l(g,[x,y,x+dx*66,y+dy*66],0x273044,14);
 p(g,[x+dx*32+px*11,y+dy*32+py*11,x+dx*50+px*11,y+dy*50+py*11,x+dx*50-px*11,y+dy*50-py*11,x+dx*32-px*11,y+dy*32-py*11],C.pink);
 e(g,x+dx*67,y+dy*67,19,16,0x283044);
 e(g,x+dx*68,y+dy*63,13,8,0x64768a);
}
function arctic(a:Art,t:number){
 const final=t>=43,local=t-(final?43:23);
 arcticBackground(a,t);
 if(final){
  const inhale=ease((local-4.92)*2.3),punch=t>=48.1;
  const eye=local<4.1?'bored':local<5.35?'closed':'scared';
  const s=1.68+inhale*.07, y=568-inhale*.07*218;
  e(a.set,383,919,283,32,0x819fb3,.37);
  bear(a.action,383,y,s,{expr:eye,mouth:inhale*.88||talk(t,43.6,45.7),reach:local<3.78?56:0,blink:blink(t,1.7)});
  if(local<3.78){
   const py=y+(134-56)*s-21,px=383+136*s;
   receipt(a,px-18,py,81,108,0xffedcc);
   l(a.front,[px-20,py+22,px+13,py+22],C.red,4);
  }
  if(local>=3.78&&local<4.7){
   const q=ease((local-3.78)*1.4);
   const py=715+222*q,px=585-80*q;
   receipt(a,px,py,80-q*15,101-q*36);
  }
  if(local>=3.45&&local<4.47)for(let i=0;i<3;i++){
   const f=(local+i*.19)%1;
   a.title('Z',533+34*i,464-37*f-25*i,24+i*10,0x385981,{angle:.1+i*.12});
  }
  a.camera(punch?1.53:local>2.46?1.16:1.04,383,592);
  if(local>=5.33)impact(a.front,385,552,215,clip((local-5.35)*.88),white);
  if(t>=49.62){
   r(a.front,-350,-400,1400,2000,C.night);
   if(t>=49.79)star(a.front,383,552,31+clip((t-49.79)*5)*92,C.pink,8);
  }
  return;
 }
 const sneeze=clip(1-Math.abs(local-5.10)*2.0),wind=ease(sneeze);
 const stillBearScale=1.39+sneeze*.07, bearY=588-sneeze*.07*218;
 const reaction=ease((local-4.72)*3), reporterX=184-reaction*30, reporterY=673+reaction*4;
 person(a.action,'reporter',reporterX,reporterY,1.1,{expr:local>=4.55?'scared':'stare',mouth:talk(t,23.4,24.95),look:12,arm:30,blink:blink(t,.8)});
 bear(a.action,494,bearY,stillBearScale,{expr:local>4.56&&local<5.28?'closed':'bored',mouth:sneeze*.92||talk(t,25.34,26.75),blink:blink(t,1.1)});
 microphone(a.front,reporterX+109*1.1,reporterY+89*1.1,-.79-reaction*.62);
 if(local>=4.6&&local<5.9){
  for(let i=0;i<15;i++){
   const age=clip((local-4.59)*1.3+(i%5)*.072);
   const x=455-age*(180+(i*41)%220),y=653+(i-7)*age*11;
   l(a.front,[x,y,x+19+(i*3)%37,y-5],white,3+i%5,(1-age)*.86);
  }
 }
 if(local>=4.73&&local<5.34)impact(a.front,445,656,99,clip((local-4.73)*1.6),C.gold);
 if(local>=2.34&&local<4.52)a.camera(1.22,480,605);
 else if(local>=5.36)a.camera(1.16,183,645);
 else a.camera(1.05+wind*.07,360,659);
}
function paywall(a:Art,t:number){
 const local=t-30,modal=local>=.67,press=ease((local-4.27)*3.2);
 newsBackground(a);
 label(a,'CHANNEL 32 / LIVE',159,100,C.gold,C.ink,210);
 label(a,'EXTRA FEE',565,100,C.pink,C.ink,153);
 person(a.action,'anchor',198,732,1.21,{expr:local>3.7?'scared':'stare',mouth:talk(t,30.44,32.55)||talk(t,33.9,34.74),look:12,arm:23*press,blink:blink(t,.4)});
 desk(a.front,273,864,487);
 if(!modal){
  a.title('BRING BACK',360,313,55,white,{spacing:1});
  a.title('NOVEMBER?',360,396,80,C.gold);
  a.camera(1.12,261,650);
  return;
 }
 const y=293+27*(1-ease((local-.67)*5));
 rr(a.front,82,y+13,573,410,24,0x291a38);
 rr(a.front,72,y,573,410,24,0xf5d6c9);
 rr(a.front,72,y,573,77,22,0xc3476d);
 r(a.front,72,y+51,573,25,0xc3476d);
 a.title('NOVEMBER UNAVAILABLE',356,y+38,34,white,{spacing:1});
 a.title('To restore the month, click',360,y+129,23,0x57384a,{weight:'700'});
 rr(a.front,122,y+191,480,105,13,0xe4aa9e);
 rr(a.front,119+press*4,y+182+press*9,480,100,13,press>.5?0xe95474:0xffbd58);
 a.title('BUY DECEMBER',360+4*press,y+231+9*press,40,0x4c2649,{spacing:.4});
 a.title('Stay in October',357,y+350,17,0x856472,{weight:'700'});
 if(local>=2.7){
  const aim=ease((local-2.7)*.61);
  const cx=560-57*aim,cy=y+369-112*aim;
  p(a.front,[cx,cy,cx-8,cy-68,cx+56,cy-30,cx+29,cy-24,cx+39,cy+3,cx+23,cy+10,cx+11,cy-18],0x372944);
  p(a.front,[cx+3,cy-8,cx-4,cy-59,cx+45,cy-32,cx+23,cy-27,cx+32,cy,cx+24,cy+4,cx+11,cy-25],white);
 }
 if(local>=4.08)a.camera(1.13,356,523);
 if(local>=4.3&&local<=4.75)impact(a.front,521,y+247,78,clip((local-4.3)*2.2),white);
}
export const scene={
 settings,
 pose:(time:number)=>Math.round(time*24)/24,
 createDrawing:(root:Container)=>new Art(root),
 draw(a:Art,t:number){
  a.reset();
  if(t<5)news(a,t);
  else if(t<11)school(a,t);
  else if(t<17)shop(a,t);
  else if(t<23)infographic(a,t);
  else if(t<30)arctic(a,t);
  else if(t<37)paywall(a,t);
  else if(t<43)shop(a,t);
  else arctic(a,t);
  filmGrain(a.front);
 }
};
