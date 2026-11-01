import {mix,tween} from '../../core/time';
import {excursion} from '../../core/gesture';
import {limbShape} from '../../core/limb';
import {localPoint,type LocalFrame2D,type Point2} from '../../core/spatial';
import {arm,packageGeometry,mouthAnchor,foodTipOffset} from './model';
import {walkingPose} from './steps';
import {quadraticPoint} from '../../core/contour';
export interface BoarPose {time:number;location:'shop'|'savanna';actor:LocalFrame2D;cart:LocalFrame2D;fill:number;warning:number;back:boolean;seated:boolean;satisfied:number;surprise:number;nearHand:Point2;farHand:Point2;nearArm:ReturnType<typeof arm>;farArm:ReturnType<typeof arm>;packet:ReturnType<typeof packageGeometry>;food:Point2;foodTip:Point2;foodVisible:boolean;foodLength:number;bite:number;chew:number;walking:ReturnType<typeof walkingPose>;feet:readonly [Point2,Point2];legs:readonly [ReturnType<typeof limbShape>,ReturnType<typeof limbShape>];}
const packetLocal:LocalFrame2D={origin:[111,-49],angle:.1,scale:.82};
const blend=(a:Point2,b:Point2,u:number):Point2=>[mix(a[0],b[0],u),mix(a[1],b[1],u)];
export function boarPose(time:number):BoarPose{
 const location:BoarPose['location']=time<16?'shop':'savanna';
 const seated=location==='savanna',back=false;
 const walking=walkingPose(time);
 const actor:LocalFrame2D=seated?{origin:[530,650],angle:0,scale:1.12}:walking.actor;
 const cart:LocalFrame2D=seated?{origin:[1090,642],angle:0,scale:1.1}:{origin:[time<9.45?625:walking.nominalX+265,615],angle:0,scale:1};
 const chew=excursion(time,21.3,21.55,21.85)+excursion(time,23.3,23.55,23.9);
 const mouth=mouthAnchor(chew),opening=localPoint([0,-105],packetLocal);
 const rest:Point2=[38,-48],pick:Point2=[opening[0]-foodTipOffset[0],opening[1]-foodTipOffset[1]],atMouth:Point2=[mouth[0]-foodTipOffset[0],mouth[1]-foodTipOffset[1]];
 const start=time<21.9?20:22,dt=time-start;
 let seatedHand=rest;
 if(dt>=0&&dt<.45)seatedHand=quadraticPoint(rest,[5,-165],pick,tween(dt,0,.45));
 else if(dt>=.45&&dt<.5)seatedHand=pick;
 else if(dt>=.5&&dt<1)seatedHand=blend(pick,atMouth,tween(dt,.5,1));
 else if(dt>=1&&dt<1.35)seatedHand=atMouth;
 else if(dt>=1.35&&dt<1.8)seatedHand=quadraticPoint(atMouth,[-20,-138],rest,tween(dt,1.35,1.8));
 const grip=tween(time,8.25,8.85);
 const shopNear:Point2=[cart.origin[0]-128-actor.origin[0],497-actor.origin[1]],shopFar:Point2=[cart.origin[0]-114-actor.origin[0],497-actor.origin[1]];
 const nearHand:Point2=seated?seatedHand:blend([24,-103],shopNear,grip);
 const farHand:Point2=seated?localPoint([-48,-56],packetLocal):blend([-31,-112],shopFar,grip);
 const packet=packageGeometry('snack',{origin:localPoint(packetLocal.origin,actor),angle:packetLocal.angle,scale:actor.scale*packetLocal.scale});
 const food:Point2=[nearHand[0],nearHand[1]];
 const foodTip:Point2=[food[0]+foodTipOffset[0],food[1]+foodTipOffset[1]];
 const bite=seated&&dt>=1&&dt<=1.35?1:0;
 const foodLength=1-tween(Math.max(1.08,dt),1.08,1.33);
 const feet:readonly [Point2,Point2]=seated?[[65,-1],[157,-1]]:walking.feet;
 const legs:BoarPose['legs']=seated?[limbShape([-36,-40],[68,-71],[65,-18],[54,42,29]),limbShape([-8,-39],[152,-66],[157,-18],[64,48,33])]:walking.legs;
 const nearRoot:Point2=seated?[12,-129]:[5,-197],farRoot:Point2=seated?[-12,-136]:[20,-204];
 return {time,location,actor,cart,fill:tween(time,2,4.62),warning:tween(time,8.9,9.35),back,seated,satisfied:seated?1:0,surprise:0,nearHand,farHand,nearArm:arm(nearRoot,nearHand,1,seated?-.5:0),farArm:arm(farRoot,farHand,1,seated?-.3:0),packet,food,foodTip,foodVisible:seated&&dt>=.45&&dt<1.33,foodLength,bite,chew,walking,feet,legs};
}
export const pile=Array.from({length:25},(_,i)=>({kind:i%4,x:-26+(i%3)*84+(Math.floor(i/3)%2)*9,y:-65-Math.floor(i/3)*51,angle:((i*7)%9-4)*.035}));
export const pileArrival=(i:number)=>2+i*.09;
export function pileGeometry(p:BoarPose,i:number){const a=pile[i],start=pileArrival(i),fall=1-tween(p.time,start,start+.28),settle=3*excursion(p.time,start+.28,start+.34,start+.42);return packageGeometry(`load-${i}`,{origin:localPoint([a.x,a.y-110*fall+settle],p.cart),angle:a.angle+.12*fall,scale:p.cart.scale*.85});}
