import {mix,tween,sampleTravel}from'../../core/time';
import {sampleFootsteps}from'../../core/gait';
import type{Step2D}from'../../core/contacts';
import {fitVerticalShift}from'../../core/kinematics';
import type{Vec3}from'../../core/spatial';
import {cameraAt,frameTimes,backrestPoint}from'./environment';
import {buildCat,catFrame,heldControls,type Held}from'./model';
import{storyChair,viewPoint,cameras}from'./world';
import{catPictureStorySettings as settings}from'./settings';
const v=(a:Vec3,b:Vec3,u:number):Vec3=>[mix(a[0],b[0],u),mix(a[1],b[1],u),mix(a[2],b[2],u)];
const move=(t:number,a:number,b:number,from:Vec3,to:Vec3)=>v(from,to,tween(t,a,b));
function path(t:number,keys:readonly(readonly[number,Vec3])[]):Vec3{for(let i=1;i<keys.length;i++)if(t<keys[i][0])return move(t,keys[i-1][0],keys[i][0],keys[i-1][1],keys[i][1]);return[...keys[keys.length-1][1]];}
const entrance={start:.4,end:5.15,ramp:.45};
const walkX=(t:number)=>mix(-580,95,sampleTravel(t,entrance).progress);
const tracks:Step2D[][]=[[],[]];
for(let side=0;side<2;side++){
 let from:[number,number]=[-580+(side?-10:10),0];const starts=Array.from({length:26},(_,i)=>.5+i*.18).filter((_,i)=>i%2===side);
 for(const[index,start]of starts.entries()){const end=start+.14,last=index===starts.length-1,to:[number,number]=[last?95+(side?-10:10):walkX(end+.15)+(side?-10:10),0];tracks[side].push({start,end,from,to,lift:12});from=to;}
}
/** Rest endpoints use actual segment lengths and a small authored elbow bend.
 * Contacts later replace these free targets; the same root geometry is shared. */
function freeHands(c:Held,swing=0,bend=.5,upper=.02):[Vec3,Vec3]{const {armRoots}=catFrame(c),f=c.facing??1,forward:Vec3=[f,0,Math.sqrt(Math.max(0,1-f*f))];return([0,1]as const).map(i=>{const a=upper+(i?swing:-swing),b=a+bend,along=32*Math.sin(a)+29*Math.sin(b),down=32*Math.cos(a)+29*Math.cos(b),r=armRoots[i];return[r[0]+forward[0]*along,r[1]-down-7,r[2]+forward[2]*along+8*Math.abs(f)*(1-forward[2])]as Vec3;})as[Vec3,Vec3];}
const off=(p:Vec3,q:Vec3):Vec3=>[p[0]+q[0],p[1]+q[1],p[2]+q[2]];
function rawControlAt(t:number):Held{
 if(!Number.isFinite(t)||t<0||t>settings.durationInFrames/settings.fps)throw RangeError('Story time outside composition');
 if(t>=12)return remainingControlAt(t);
 const c:Held={...heldControls['room-a'],view:cameraAt(t),facing:1,feet:[[105,0,-11],[85,0,-39]],hands:[[0,0,0],[0,0,0]],armPoles:[[1,0,.15],[1,0,.15]],hindPoles:[[1,0,.12],[1,0,.12]],label:'Entrance: alternating floor supports'};
 if(t<5.15){const samples=tracks.map(track=>sampleFootsteps(t,track,.02)),speed=sampleTravel(t,entrance).velocity*(entrance.end-entrance.start-entrance.ramp),compression=Math.max(...samples.map(s=>s.compression));c.hips=[walkX(t),60-10*speed-1.5*compression*speed,-25];c.feet=samples.map((s,i)=>[s.position[0],-s.position[1],i?-39:-11]as Vec3)as[Vec3,Vec3];c.supports={feet:samples.map(s=>s.planted?'floor':null),hands:[null,null],pelvis:false};const roots=catFrame(c).legRoots;const shift=fitVerticalShift(roots.map((root,i)=>({root,target:off(c.feet[i],[0,8,0]),reach:56.8})),0);c.hips[1]+=shift;const stepLead=(c.feet[0][0]-c.feet[1][0]-(roots[0][0]-roots[1][0]))/55;c.hands=freeHands(c,Math.max(-.3,Math.min(.3,stepLead*.3))*speed);return c;}
 c.label='Crouch, push, airborne reach and real two-paw grip';c.lean=mix(4,18,tween(t,5.15,5.7));
 let y:number;if(t<5.7)y=mix(60,48,tween(t,5.15,5.7));else if(t<5.85)y=48+.5*(160/.15)*(t-5.7)**2;else if(t<6.15){const u=t-5.85;y=60+160*u-.5*780*u*u;}else if(t<6.25){const u=t-6.15;y=72.9-74*u+370*u*u;}else y=mix(69.2,128,tween(t,6.45,8.2));
 c.hips=[95,y,mix(-25,-45,tween(t,5.85,6.15))];if(t>=5.85)c.lean=mix(18,14,tween(t,5.85,6.15));if(t>=6.45)c.lean=mix(14,0,tween(t,6.45,8.2));
 if(t>=5.85){const u=tween(t,5.85,6.15);c.feet=[off(c.hips,v([10,-60,14],[8,-49,30],u)),off(c.hips,v([-10,-60,-14],[-31,-43,-5],u))];}
 c.supports={feet:t<5.85?['floor','floor']:[null,null],hands:t>=6.15?['chair','chair']:[null,null],pelvis:false};c.hindPoles=[v([1,0,.12],[.7,1,.12],tween(t,5.7,6.15)),v([1,0,.12],[-.7,1,.12],tween(t,5.7,6.15))];
 const relaxed=freeHands(c),reach=tween(t,5.8,6.15);c.hands=[v(relaxed[0],storyChair.grips[0],reach),v(relaxed[1],storyChair.grips[1],reach)];c.armPoles=[v([1,0,.15],[0,-1,0],reach),v([1,0,.15],[0,0,1],reach)];c.headOffset=mix(4,-9,reach);
 if(t<8.2)return c;
 c.label='Body pulled first; first hind support, then second; pelvis sits last';
 c.hindRootOffsets=[[10,0,10],[-10,3,mix(-10,6,tween(t,8.2,8.45))]];
 c.hips=move(t,9.3,10.15,[95,128,-45],[124,182,-72]);c.lean=0;c.headOffset=mix(-9,4,tween(t,9.08,9.5));
 c.feet=[path(t,[[8.2,[103,79,-15]],[8.35,[140,99,-15]],[8.55,[148,143,-15]],[8.85,[148,143,-62]],[9.05,[148,128,-62]]]),path(t,[[8.2,[64,85,-50]],[9.45,[64,85,-50]],[9.7,[64,152,-50]],[10.0,[111,152,-78]],[10.25,[111,128,-78]]])];
 const releasing=tween(t,9.08,9.3),free=freeHands(c);c.hands=[v(storyChair.grips[0],free[0],releasing),v(storyChair.grips[1],free[1],releasing)];c.supports={feet:[t>=9.05?'seat':null,t>=10.25?'seat':null],hands:t<=9.08?['chair','chair']:[null,null],pelvis:false};c.armPoles=[v([0,-1,0],[1,0,.15],releasing),v([0,0,1],[1,0,.15],releasing)];
 const throneHands=(hips:Vec3)=>heldControls.proud.hands.map(q=>off(hips,[q[0]-124,q[1]-144,q[2]+72]))as[Vec3,Vec3];const restHands=throneHands(c.hips);c.hands=[v(c.hands[0],restHands[0],tween(t,10.15,10.4)),v(c.hands[1],restHands[1],tween(t,10.15,10.4))];
 if(t<10.4)return c;
 c.hips=[124,mix(182,144,tween(t,10.4,11.4)),-72];c.feet=[path(t,[[10.6,[148,128,-62]],[10.75,[148,143,-62]],[10.95,[148,143,-35]],[11.35,[148,94,-35]]]),path(t,[[11.4,[111,128,-78]],[11.52,[90,128,-78]],[11.65,[90,142,-78]],[11.78,[90,142,-46]],[11.96,[111,97,-46]]])];c.hands=throneHands(c.hips);c.supports={feet:[t<=10.6?'seat':null,t<=11.4?'seat':null],hands:[null,null],pelvis:t>=11.4};c.hindPoles=[v([.7,1,.12],[1,0,.12],tween(t,11.15,11.5)),v([-.7,1,.12],[0,0,1],tween(t,11.93,12))];c.expression=t>=11.4?'proud':'cheeky';return c;
}
/** This authored bend plane follows the far hind target with a retained screen
 * winding in viewA. It uses the fixed staging camera, never the moving camera,
 * so the17..20 camera move cannot animate a stationary joint. */
export function storyControlAt(t:number):Held{const c=rawControlAt(t);const lookback=tween(t,32.3,32.65)*(1-tween(t,33,33.35)),headLeft=t<30.7?tween(t,23,23.7)*(1-tween(t,27,28.35)):tween(t,30.7,31.3)*(1-.8*lookback);c.headTurn=-headLeft;if(t<27&&headLeft>0)c.gaze=[mix(2,-4,headLeft),2];if(t>=12&&t<23){const root=catFrame(c).legRoots[1],end=off(c.feet[1],[0,8,0]),a=viewPoint(root,'A'),b=viewPoint(end,'A'),nx=-(b[1]-a[1]),ny=b[0]-a[0],x=nx/Math.cos(cameras.A.yaw),y=-ny-Math.sin(cameras.A.yaw)*cameras.A.elevation*x;const u=tween(t,22.65,23),forward:Vec3=[c.facing??1,0,Math.sqrt(Math.max(0,1-(c.facing??1)**2))];c.hindPoles=[v(t<22.65?c.hindPoles![0]:[1,1,.12],forward,u),v(v([0,0,1],[x,y,0],tween(t,12.17,12.25)),forward,u)];}return c;}
export function storyPose(t:number){try{return buildCat(storyControlAt(t));}catch(error){throw Error(`Cat blocking at${t.toFixed(6)}s: ${error instanceof Error?error.message:error}`);}}
export const entranceFootsteps=tracks;

// Preserve the checked cruise speed/cadence; extend travel, then hold the room.
const departureSpeed=(590-117.5)/(34-31.3-.25),exitTravel={start:31.3,end:34.7,ramp:.25},exitEndX=-117.5-departureSpeed*(exitTravel.end-exitTravel.start-exitTravel.ramp);
const exitX=(t:number)=>mix(-117.5,exitEndX,sampleTravel(t,exitTravel).progress),exitTracks:Step2D[][]=[[],[]];
for(let side=0;side<2;side++){let from:[number,number]=[side?-99:-136,0];const starts=Array.from({length:19},(_,i)=>31.4+i*.17).filter((_,i)=>(i%2?0:1)===side);for(const[index,start]of starts.entries()){const end=start+.13,last=index===starts.length-1,to:[number,number]=[last?exitEndX+(side?10:-10):exitX(end+.14)+(side?10:-10),0];exitTracks[side].push({start,end,from,to,lift:12,fromHeading:Math.PI,toHeading:Math.PI});from=to;}}
export const storyTimes=Object.freeze({fearOnset:frameTimes.firstImpact+.09,firstGather:21.7,stand:22.65,turn:23,takeoff:24.25,hindLanding:25.35,foreLanding:25.46,landingSettled:25.47,recover:27,groom:29.45,exit:31.3,exitSettled:34.7});
const jumpDuration=1.1,jumpVX=(-130-124)/jumpDuration,jumpVZ=(-20+148)/jumpDuration,jumpVY=160,jumpGravity=2*(jumpVY*jumpDuration+126)/jumpDuration**2;
const incomingVY=jumpVY-jumpGravity*jumpDuration,absorbDuration=.12,landX=-130+jumpVX*absorbDuration/2,landY=54+incomingVY*absorbDuration/2,landZ=-20+jumpVZ*absorbDuration/2;
function backLean(t:number){let low=-40,high=0;for(let i=0;i<42;i++){const z=(low+high)/2,up=Math.sqrt(49**2-z*z),height=128+69.5*up/49,bodyZ=-148+53.5*z/49,woodZ=backrestPoint([124,height,-157.6],t)[2];if(bodyZ>woodZ)high=z;else low=z;}return(low+high)/2;}
function throneHands(c:Held):[Vec3,Vec3]{return heldControls.proud.hands.map(q=>off(c.hips,[q[0]-124,q[1]-144,q[2]+72]))as[Vec3,Vec3];}
function footArc(t:number,start:number,end:number,from:Vec3,to:Vec3,lift=10):Vec3{const u=Math.max(0,Math.min(1,(t-start)/(end-start))),p=v(from,to,tween(t,start,end));return[p[0],p[1]+lift*16*u*u*(1-u)*(1-u),p[2]];}
function remainingControlAt(t:number):Held{
 const fear=tween(t,storyTimes.fearOnset,storyTimes.fearOnset+.2)*(1-tween(t,27.35,28.8)),bristle=tween(t,storyTimes.fearOnset,storyTimes.fearOnset+.2)*(1-tween(t,29.45,30.15));
 const c:Held={...heldControls.proud,view:cameraAt(t),facing:1,headOffset:4,fear,bristle,gaze:[t>27?mix(6,0,tween(t,28.35,29.05)):2,2],expression:t>=storyTimes.fearOnset?'panic':'proud',feet:[[148,94,-35],[111,97,-46]],hands:[[146,151,-42],[107,154,-62]],label:'Settle, gather feet and lean back to the actual chair panel',hindPoles:[v([1,0,.12],[1,1,.12],tween(t,12.25,12.55)),[-1,mix(.3,1,tween(t,12.45,12.5)),.12]],armPoles:[[1,0,.15],[1,0,.15]]};
 c.feet=[path(t,[[12.55,[148,94,-35]],[12.7,[170,145,-35]],[12.85,[170,145,-100]],[12.95,[170,128,-100]]]),path(t,[[12.05,[111,97,-46]],[12.25,[90,145,-46]],[12.4,[90,145,-110]],[12.55,[90,128,-110]]])];
 const settle=tween(t,12.95,13.35);c.leanZ=backLean(t)*settle;c.hips=[124,128+16*Math.sqrt(49**2-c.leanZ**2)/49,mix(-72,-148,settle)];c.armRootOffsets=[[16,-2,10],[-16,4,mix(-10,6,settle)]];c.hands=throneHands(c);c.supports={feet:[t>=12.95?'seat':null,t>=12.55?'seat':null],hands:[null,null],pelvis:true};
 if(t<21.65)return c;
 c.armRootOffsets=[[16,-2,10],[-16,4,mix(6,-10,tween(t,22,22.65))]];c.label='Fear follows the frame impact; gather both feet before standing';c.leanZ=backLean(t)*(1-tween(t,21.65,22));c.hips=[124,128+16*Math.sqrt(49**2-c.leanZ**2)/49,-148];
 c.feet=[path(t,[[21.7,[170,128,-100]],[21.85,[170,146,-100]],[22.0,[148,146,-126]],[22.15,[148,128,-126]]]),path(t,[[22.05,[90,128,-110]],[22.2,[90,146,-110]],[22.4,[90,146,-158]],[22.55,[111,128,-158]]])];c.supports={feet:[t<21.7||t>=22.15?'seat':null,t<22.05||t>=22.55?'seat':null],hands:[null,null],pelvis:true};c.hands=throneHands(c);
 if(t<22.65)return c;
 c.label='Stand from actual feet, turn the whole body, crouch and push';c.leanZ=0;c.hips=[124,mix(144,172,tween(t,22.65,23)),-148];c.facing=mix(1,-1,tween(t,23,23.7));c.headOffset=4*c.facing;c.armRootOffsets=undefined;c.supports={feet:['seat','seat'],hands:[null,null],pelvis:t===22.65};
 c.feet=[footArc(t,23,23.3,[148,128,-126],[103,128,-166],9),footArc(t,23.35,23.65,[111,128,-158],[144,128,-142],9)];c.footHeadings=[Math.PI*tween(t,23,23.3),Math.PI*tween(t,23.35,23.65)];if(t>23&&t<23.3)c.supports.feet=[null,'seat'];if(t>23.35&&t<23.65)c.supports.feet=['seat',null];
 const freeStanding=freeHands(c),restStanding=throneHands(c);c.hands=[v(restStanding[0],freeStanding[0],tween(t,22.65,23)),v(restStanding[1],freeStanding[1],tween(t,22.65,23))];const forward:Vec3=[c.facing,0,Math.sqrt(Math.max(0,1-c.facing*c.facing))];const armForward:Vec3=[forward[0],0,forward[2]+.15*(1-tween(t,22.65,23))];c.armPoles=[armForward,armForward];c.hindPoles=[forward,forward];
 if(t>=23.7){c.hindRootOffsets=[[10,0,10],[-10,3,mix(6,-10,tween(t,23.7,24.25))]];c.hindPoles=[[-1,0,.12*tween(t,23.9,24.25)],[-1,0,.12*tween(t,23.9,24.25)]];c.armPoles=[[-1,0,.15*tween(t,23.9,24.25)],[-1,0,.15*tween(t,23.9,24.25)]];c.lean=mix(0,-18,tween(t,23.7,24.25));c.hips[1]=t<23.9?mix(172,152,tween(t,23.7,23.9)):152+.5*(160/.35)*(t-23.9)**2;c.hands=freeHands(c,0,mix(.5,1.15,tween(t,23.9,24.25)),mix(.02,.35,tween(t,23.9,24.25)));}
 if(t<storyTimes.takeoff)return c;
 c.label='Leftward ballistic escape; hind pads land before forepads';c.facing=-1;c.headOffset=-4;c.hindRootOffsets=undefined;c.hindPoles=[[-1,0,.12],[-1,0,.12]];c.armPoles=[[-1,0,.15],[-1,0,.15]];c.footHeadings=[Math.PI,Math.PI];
 const flight=Math.min(jumpDuration,t-storyTimes.takeoff);c.hips=[124+jumpVX*flight,180+jumpVY*flight-.5*jumpGravity*flight*flight,-148+jumpVZ*flight];c.lean=mix(-18,-34,tween(t,24.6,25.35));
 const tuck=tween(t,24.25,24.55),extend=tween(t,24.95,25.35),relative:[Vec3,Vec3]=[v(v([-21,-52,-18],[-12,-36,-18],tuck),[-6,-54,-18],extend),v(v([20,-52,6],[15,-36,9],tuck),[31,-54,9],extend)];c.feet=[off(c.hips,relative[0]),off(c.hips,relative[1])];c.supports={feet:[null,null],hands:[null,null],pelvis:false};c.hands=freeHands(c,.0,1.15,.35);
 const landingHands:[Vec3,Vec3]=[off(c.hips,[-65,-22,-17]),off(c.hips,[-40,-22,10])];c.hands=[v(c.hands[0],landingHands[0],tween(t,25.0,25.35)),v(c.hands[1],landingHands[1],tween(t,25.0,25.35))];
 if(t<storyTimes.hindLanding)return c;
 const s=Math.max(0,Math.min(absorbDuration,t-storyTimes.hindLanding));c.hips=[-130+jumpVX*s-.5*(jumpVX/absorbDuration)*s*s,54+incomingVY*s-.5*(incomingVY/absorbDuration)*s*s,-20+jumpVZ*s-.5*(jumpVZ/absorbDuration)*s*s];c.lean=mix(-34,-40,tween(t,25.35,25.47));c.feet=[[-136,0,-38],[-99,0,-11]];c.hands=[[-195,mix(32,0,tween(t,25.35,25.46)),-37],[-170,mix(32,0,tween(t,25.35,25.46)),-10]];c.supports={feet:['floor','floor'],hands:t>=25.46?['floor','floor']:[null,null],pelvis:false};
 if(t<27)return c;
 c.label='Check picture and camera; lift forepaws before rising';c.hips=[mix(landX,-125,tween(t,27,27.35)),landY,landZ];
 if(t<27.35)return c;
 const floorHands:[Vec3,Vec3]=[[-195,0,-37],[-170,0,-10]],folded=freeHands(c,0,1.6,.25);c.hands=[v(floorHands[0],folded[0],tween(t,27.35,27.65)),v(floorHands[1],folded[1],tween(t,27.35,27.65))];c.supports.hands=[null,null];
 if(t<27.65)return c;
 c.hips=[mix(-125,-117.5,tween(t,27.65,28.35)),mix(landY,60,tween(t,27.65,28.35)),landZ];c.lean=mix(-40,-4,tween(t,27.65,28.35));c.hands=freeHands(c,0,mix(1.6,.5,tween(t,28,28.35)),mix(.25,.02,tween(t,28,28.35)));
 if(t<28.35)return c;
 c.facing=mix(-1,0,tween(t,28.35,29.05));c.headOffset=4*c.facing;c.hips=[-117.5,mix(60,50,tween(t,28.35,28.5))+5*tween(t,29.05,29.2),landZ];c.lean=mix(-4,0,tween(t,28.35,29.05));c.feet=[footArc(t,28.45,28.7,[-136,0,-38],[-136,0,-9]),footArc(t,28.75,29,[-99,0,-11],[-99,0,-31])];c.footHeadings=[mix(Math.PI,Math.PI/2,tween(t,28.45,28.7)),mix(Math.PI,Math.PI/2,tween(t,28.75,29))];c.supports.feet=[t>28.45&&t<28.7?null:'floor',t>28.75&&t<29?null:'floor'];const fwd:Vec3=[c.facing,0,Math.sqrt(Math.max(0,1-c.facing*c.facing))];const armTurn:Vec3=[fwd[0],0,fwd[2]+.15*(1-tween(t,28.35,29.05))],legTurn:Vec3=[fwd[0],0,fwd[2]+.12*(1-tween(t,28.35,29.05))];c.armPoles=[armTurn,armTurn];c.hindPoles=[legTurn,legTurn];c.hands=freeHands(c);
 if(t<29.2)return c;
 c.label='Actual paw strokes the current cheek boundary, then the chest edge';c.expression='cheeky';const base=buildCat(c),at=(index:number)=>base.headAt(base.headLocal[index]);let cheek=move(t,29.45,29.9,at(2),at(1));if(t>=29.9)cheek=move(t,29.9,30.15,at(1),at(0));const free=c.hands[0];c.hands[0]=v(free,cheek,tween(t,29.2,29.45));
 if(t>=30.15){const curve=base.bodyWorld.curves.find(q=>q.key==='back')!,index=base.bodyWorld.curves.indexOf(curve),from=base.bodyWorld.curves[index-1].to,u=.6;const chest=from.map((q,i)=>q*(1-u)**3+3*curve.c1[i]*(1-u)**2*u+3*curve.c2[i]*(1-u)*u*u+curve.to[i]*u**3)as Vec3;c.hands[0]=v(cheek,chest,tween(t,30.15,30.35));if(t>=30.35)c.hands[0]=v(chest,free,tween(t,30.35,30.65));}
 if(t<30.7)return c;
 c.label='Turn back toward departure and leave with a deliberate lookback';c.facing=mix(0,-1,tween(t,30.7,31.3));c.headOffset=4*c.facing;c.hips[1]=mix(55,50,tween(t,30.7,30.85))+5*tween(t,31.1,31.3);c.feet=[footArc(t,30.7,30.95,[-136,0,-9],[-136,0,-38]),footArc(t,31,31.25,[-99,0,-31],[-99,0,-11])];c.footHeadings=[mix(Math.PI/2,Math.PI,tween(t,30.7,30.95)),mix(Math.PI/2,Math.PI,tween(t,31,31.25))];c.supports.feet=[t>30.7&&t<30.95?null:'floor',t>31&&t<31.25?null:'floor'];c.hands=freeHands(c);const facing:Vec3=[c.facing,0,Math.sqrt(Math.max(0,1-c.facing*c.facing))];c.hindPoles=[facing,facing];c.armPoles=[facing,facing];
 if(t<31.3)return c;
 const samples=exitTracks.map(track=>sampleFootsteps(t,track,.02)),speed=sampleTravel(t,exitTravel).velocity*(exitTravel.end-exitTravel.start-exitTravel.ramp),lookback=tween(t,32.3,32.65)*(1-tween(t,33,33.35));c.facing=-1+.2*lookback;c.headOffset=4*c.facing;c.gaze=[6*lookback,2];c.hips=[exitX(t),55-5*speed,landZ];c.feet=samples.map((s,i)=>[s.position[0],-s.position[1],i?-11:-38]as Vec3)as[Vec3,Vec3];c.supports={feet:samples.map(s=>s.planted?'floor':null),hands:[null,null],pelvis:false};const roots=catFrame(c).legRoots,shift=fitVerticalShift(roots.map((root,i)=>({root,target:off(c.feet[i],[0,8,0]),reach:56.8})),0);c.hips[1]+=shift;const forwardExit:Vec3=[c.facing,0,Math.sqrt(Math.max(0,1-c.facing*c.facing))];c.hindPoles=[forwardExit,forwardExit];c.armPoles=[forwardExit,forwardExit];c.hands=freeHands(c,Math.max(-.3,Math.min(.3,-(c.feet[0][0]-c.feet[1][0]-(roots[0][0]-roots[1][0]))/55*.3))*speed);return c;
}
export const departureFootsteps=exitTracks;

export interface StoryEvent{readonly id:string;readonly time:number;readonly kind:string;readonly point:Vec3;readonly actor?:string;readonly surface?:string}
/** Contact events read the same paw/sole/pelvis geometry consumed by the drawing.
 * An event time is a boundary, not an extra animation clock or a sound onset. */
export function storyEvents():StoryEvent[]{
 const events:StoryEvent[]=[],add=(id:string,time:number,kind:string,point:Vec3,actor?:string,surface?:string)=>events.push({id,time,kind,point,actor,surface});
 const paw=(time:number,i:number)=>storyPose(time).arms[i].paw[7],sole=(time:number,i:number)=>storyPose(time).legs[i].contact;
 for(const[pass,tracks,zs]of[['entrance',entranceFootsteps,[-11,-39]],['exit',departureFootsteps,[-38,-11]]]as const)tracks.forEach((steps,foot)=>steps.forEach((s,index)=>{add(`${pass}-${foot}-${index}-release`,s.start,'hind-release',[s.from[0],0,zs[foot]],`hind-${foot}`,'floor');add(`${pass}-${foot}-${index}-land`,s.end,'hind-land',[s.to[0],0,zs[foot]],`hind-${foot}`,'floor');}));
 const contacts:readonly[time:number,kind:string,feature:'hind'|'fore',indices:readonly number[],surface:string][]=[
 [5.85,'release','hind',[0,1],'floor'],[6.15,'grip','fore',[0,1],'chair-front-corners'],[9.05,'land','hind',[0],'seat'],[9.08,'release','fore',[0,1],'chair-front-corners'],[10.25,'land','hind',[1],'seat'],[10.6,'release','hind',[0],'seat'],[11.4,'release','hind',[1],'seat'],[12.55,'land','hind',[1],'seat'],[12.95,'land','hind',[0],'seat'],[21.7,'release','hind',[0],'seat'],[22.05,'release','hind',[1],'seat'],[22.15,'land','hind',[0],'seat'],[22.55,'land','hind',[1],'seat'],[23,'release','hind',[0],'seat'],[23.3,'land','hind',[0],'seat'],[23.35,'release','hind',[1],'seat'],[23.65,'land','hind',[1],'seat'],[storyTimes.takeoff,'release','hind',[0,1],'seat'],[storyTimes.hindLanding,'land','hind',[0,1],'floor'],[storyTimes.foreLanding,'land','fore',[0,1],'floor'],[27.35,'release','fore',[0,1],'floor'],[28.45,'release','hind',[0],'floor'],[28.7,'land','hind',[0],'floor'],[28.75,'release','hind',[1],'floor'],[29,'land','hind',[1],'floor'],[30.7,'release','hind',[0],'floor'],[30.95,'land','hind',[0],'floor'],[31,'release','hind',[1],'floor'],[31.25,'land','hind',[1],'floor']];
 for(const[t,kind,feature,indices,surface]of contacts)for(const i of indices)add(`${feature}-${i}-${kind}-${t}`,t,`${feature}-${kind}`,feature==='hind'?sole(t,i):paw(t,i),`${feature}-${i}`,surface);
 for(const[t,kind]of[[11.4,'pelvis-seat'],[22.65,'pelvis-release']]as const)add(kind,t,kind,storyPose(t).pelvisContact,'pelvis','seat');
 const p=storyPose(13.35),curve=p.bodyWorld.curves[0],from=p.bodyWorld.start,u=.5,back=from.map((q,i)=>q*(1-u)**3+3*curve.c1[i]*(1-u)**2*u+3*curve.c2[i]*(1-u)*u*u+curve.to[i]*u**3)as Vec3;add('body-backrest',13.35,'body-backrest',back,'torso-top-curve-midpoint','backrest-inset');
 for(const x of[43,195])add(`backrest-wall-${x}`,13.55,'backrest-wall',[...backrestPoint([x,252,-170],13.55)],'rear-post-outer-top','back-wall');
 add('fear-onset',storyTimes.fearOnset,'fear-onset',storyPose(storyTimes.fearOnset).headCentre,'cat');
 for(const[t,id]of[[29.45,'groom-cheek-start'],[30.15,'groom-cheek-end'],[30.35,'groom-chest-end']]as const)add(id,t,id,paw(t,0),'fore-0','actual-cat-contour');
 return events.sort((a,b)=>a.time-b.time||a.id.localeCompare(b.id));
}
