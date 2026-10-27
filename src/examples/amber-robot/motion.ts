import { tween, mix, clamp } from '../../core/time';
import { excursion } from '../../core/gesture';
import { localPoint, attachAnchor, type Point2, type LocalFrame2D, type Vec3 } from '../../core/spatial';
import { solveTwoBone, solvePlanarLimb } from '../../core/kinematics';
import { supportBalance } from '../../core/gait';
import { canAnchors, gripperContact } from './model';

export const benchY=490, soil:Point2=[785,435];
export const feet:Point2[]=[[350,565],[450,565]];
const hold=(t:number,a:number,b:number,c:number,d:number)=>tween(t,a,b)*(1-tween(t,c,d));
export const pourWindows=[[3.45,3.95,4.25,4.7],[4.85,5.35,5.65,6.1]] as const;
export const homeCan=attachAnchor({origin:[0,0],angle:0,scale:1},canAnchors.base,[624.25,benchY]);
export const armLimits={bendSide:1,endAngle:0,wristRange:[-Math.PI*75/180,Math.PI*75/180],minFlexion:Math.PI/9} as const;
export function canAt(t:number):LocalFrame2D {
  const carry=tween(t,2.1,3.15)*(1-tween(t,6.25,7.1));
  const angle=.68*Math.max(...pourWindows.map(([a,b,c,d])=>hold(t,a,b,c,d)));
  const homeGrip=localPoint(canAnchors.grip,homeCan);
  // Lift toward a reachable pouring position, then rotate about the held handle.
  // A body-origin rotation previously dragged the hand above the face.
  return attachAnchor({origin:[0,0],angle,scale:1},canAnchors.grip,
    [homeGrip[0]+50*carry,homeGrip[1]-78*carry]);
}
const births=pourWindows.flatMap(([start,,end])=>Array.from({length:10},(_,i)=>start+.34+i*(end-start-.32)/9));
function waterAt(t:number) {
  return births.flatMap((birth,index)=>{
    const from=localPoint(canAnchors.spout,canAt(birth)),target:Point2=[soil[0]+(index%3-1)*5,soil[1]];
    const g=420,flight=Math.sqrt(2*(target[1]-from[1])/g),age=t-birth;
    if(!Number.isFinite(flight)||flight<=0)throw new RangeError('Spout must be above the soil');
    if(age<0||age>flight+.14)return [];
    if(age>flight)return [{point:target,impact:true,alpha:1-(age-flight)/.14,age:age-flight}];
    const vx=(target[0]-from[0])/flight;
    return [{point:[from[0]+vx*age,from[1]+g*age*age/2] as Point2,impact:false,alpha:clamp(age/.025),age}];
  });
}
const vec=(p:Point2):Vec3=>[p[0],p[1],0];
const solve=(a:Point2,b:Point2,l1:number,l2:number,pole:number):Point2=>{
  const p=solveTwoBone(vec(a),vec(b),l1,l2,[pole,0,0]);return [p[0],p[1]];
};
export function robotPose(t:number) {
  const reach=tween(t,.65,1.45)*(1-tween(t,7.5,8.25));
  const close=tween(t,1.5,1.85)*(1-tween(t,7.2,7.5));
  const can=canAt(t),support=supportBalance(feet.map((ground,i)=>({ground,load:i===0?1-.3*reach:1+.3*reach})));
  const body:LocalFrame2D={origin:[400+(support.center[0]-400)*.9,450+8*reach],angle:.08*reach,scale:1};
  const nod=excursion(t,8.45,8.7,9.05);
  const head:LocalFrame2D={origin:localPoint([0,-174],body),angle:body.angle+.1*nod,scale:1};
  const view=.2+.7*tween(t,.3,1)*(1-tween(t,8.1,8.6));
  const legs=feet.map((sole,i)=>{
    const hip=localPoint([i===0?-31:31,2],body),ankle:Point2=[sole[0],sole[1]-12];
    return {hip,knee:solve(hip,ankle,61,62,i===0?-1:1),ankle,sole};
  });
  const grip=localPoint(canAnchors.grip,can);
  const rest=localPoint([70,0],body);
  const attached=attachAnchor({origin:[0,0],angle:can.angle,scale:1},gripperContact,grip);
  const hand:LocalFrame2D={...attached,origin:[mix(rest[0],attached.origin[0],reach),mix(rest[1],attached.origin[1],reach)],
    angle:mix(1.4,attached.angle,reach)};
  const nearShoulder=localPoint([50,-105],body),farShoulder=localPoint([-50,-105],body);
  const nearLimb=solvePlanarLimb(nearShoulder,hand.origin,64,66,{...armLimits,endAngle:hand.angle});
  const farWrist=localPoint([-76,-12-12*reach],body);
  const arms=[{shoulder:farShoulder,wrist:farWrist,elbow:solve(farShoulder,farWrist,62,65,-1),
      frame:{origin:farWrist,angle:1.4,scale:1} as LocalFrame2D,close:0},
    {shoulder:nearShoulder,wrist:hand.origin,elbow:nearLimb.joint,frame:hand,close}];
  const blink=Math.max(...[.42,2.6,6.45,8.73].map(at=>excursion(t,at-.08,at,at+.1)));
  return {t,body,head,view,legs,arms,can,grip,reach,close,blink,nod,support,nearLimb,water:waterAt(t)};
}
export type RobotPose=ReturnType<typeof robotPose>;
