import {tween,mix,clamp} from '../../core/time';
import {excursion} from '../../core/gesture';
import {sampleFootsteps,supportBalance} from '../../core/gait';
import {solvePlanarLimb} from '../../core/kinematics';
import {attachAnchor,localPoint,type Point2,type LocalFrame2D} from '../../core/spatial';
import {boarMouth} from './model';

export const savannaStarts=15;
export const biteWindows=[[16.1,16.75,17.3,17.9],[19.3,19.95,20.5,21.1],[22.2,22.85,23.3,23.8]] as const;
export const cartHandle:Point2=[-34,-119];
export const snackOpening:Point2=[0,-53];
export const foodGrip:Point2=[-14,4];
export const cartOriginAt=(t:number):Point2=>[510+57*Math.min(4.9,Math.max(0,t-10.1))**2,680];
const walkRootAt=(t:number)=>mix(-210,330,tween(t,7.9,10.1))+(cartOriginAt(t)[0]-510);
// Each planted hoof stays in world space. The second walking consumer uses the
// same contact/load functions as the monkey, with its own proportions and path.
function stepTrack(side:number) {
  const starts=Array.from({length:24},(_,i)=>8.05+i*.30+side*.15);
  let from:Point2=[-210+(side?33:-33),690];
  return starts.flatMap(start=>{
    const to:Point2=[walkRootAt(start+.14)+(side?33:-33),690];
    if(Math.abs(to[0]-from[0])<2)return [];
    const step={start,end:start+.14,from,to,lift:16,fromHeading:0,toHeading:0};
    from=to;return [step];
  });
}
export const boarTracks=[stepTrack(0),stepTrack(1)];
const lerpPoint=(a:Point2,b:Point2,p:number):Point2=>[mix(a[0],b[0],p),mix(a[1],b[1],p)];
export function boarPose(t:number) {
  const seated=t>=savannaStarts;
  const feet=boarTracks.map(track=>sampleFootsteps(t,track,.025));
  const support=supportBalance(feet);
  const x=seated?665:walkRootAt(t);
  const bob=seated?0:feet.reduce((s,f)=>s+f.compression*3,0);
  const root:Point2=[x,seated?596:690+bob];
  const bite=seated?Math.max(...biteWindows.map(([a,b,c,d])=>tween(t,a,b)*(1-tween(t,c,d)))):0;
  const holdingFood=seated&&biteWindows.some(([a,,c])=>t>=a+.06&&t<c+.12);
  const chew=seated?biteWindows.reduce((sum,[,b,c])=>sum+excursion(t,b+.12,b+.26,b+.42)+excursion(t,c,c+.15,c+.34),0):0;
  const blink=Math.max(...[9.65,12.1,15.6,18.7,21.8].map(at=>excursion(t,at-.075,at,at+.105)));
  const head:LocalFrame2D={origin:[root[0]+(seated?44:48),root[1]-(seated?221:285)],angle:seated?-.06: .035,scale:1};
  const happiness=seated?tween(t,15,15.65):0;
  const mouth=localPoint(boarMouth(happiness,chew).contact,head);
  const bag:LocalFrame2D={origin:[root[0]+12,root[1]-55],angle:-.12,scale:1.1};
  const bagTop=localPoint(snackOpening,bag);
  const hand=seated?lerpPoint([bagTop[0]+4,bagTop[1]+10],[mouth[0]-12,mouth[1]+1],bite):
    lerpPoint([root[0]+42,root[1]-97],localPoint(cartHandle,{origin:cartOriginAt(t),angle:0,scale:1}),tween(t,9.05,9.65));
  const shoulder:Point2=[root[0]+30,root[1]-(seated?147:184)];
  const limb=solvePlanarLimb(shoulder,hand,105,109,{bendSide:1,endAngle:0,wristRange:[-Math.PI,Math.PI],minFlexion:.04});
  const food=attachAnchor({origin:[0,0],angle:-.25-.35*bite,scale:1.25},foodGrip,hand);
  return {t,seated,root,feet,support,head,mouth,bag,bagTop,hand,shoulder,elbow:limb.joint,food,bite,holdingFood,chew,blink,happiness,
    cart:cartOriginAt(t),rule:tween(t,11,11.45),bigText:tween(t,11.85,12.7),
    underline:tween(t,12.8,13.25),sceneTime:seated?t-15:t,
    cargo:Array.from({length:32},(_,i)=>{
      const row=Math.floor(i/4),col=i%4,birth=4.3+i*.135;
      const fall=tween(t,birth,birth+.44);
      return {kind:i%4,x:55+col*83+(row%2?18:-8),y:-71-row*77-550*(1-fall),
        angle:(i%3-1)*.105,visible:t>=birth,landed:fall===1,index:i};
    }),progress:clamp((t-15)/9)};
}
export type BoarPose=ReturnType<typeof boarPose>;
