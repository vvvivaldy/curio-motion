import type { Vec3 } from './spatial';
import { solveTwoBone } from './kinematics';
import { type Frame3, cross3, dot3, sub3, scale3, unit3, pointInFrame3, vectorInFrame3, validateFrame3 } from './frame3';

export interface HingeRequest {
  readonly frame: Frame3; readonly rootLocal: Vec3; readonly targetWorld: Vec3;
  readonly upper: number; readonly lower: number; readonly normalLocal: Vec3; readonly bendSign: -1|1;
  readonly signedFlexionRange: readonly [number,number]; readonly planeTolerance: number;
}
export type HingeResult = {status:'solved';root:Vec3;joint:Vec3;end:Vec3;signedFlexion:number}
  | {status:'blocked';reason:'reach'|'off-plane'|'singular'|'joint-limit'};
/** Explicit directed hinge in an authored shoulder/hip frame. Never projects a held target,
 * flips its branch or moves the endpoint to make a joint limit pass. */
export function solveHingeLimb(r: HingeRequest): HingeResult {
  validateFrame3(r.frame);
  const [low,high]=r.signedFlexionRange;
  if(![...r.rootLocal,...r.targetWorld,...r.normalLocal,r.upper,r.lower,low,high,r.planeTolerance].every(Number.isFinite)
    || r.upper<=0||r.lower<=0||r.planeTolerance<0||![-1,1].includes(r.bendSign)||low>high||low < -Math.PI||high>Math.PI
    || Math.abs(dot3(r.normalLocal,r.normalLocal)-1)>1e-8) throw new RangeError('Invalid directed hinge');
  const root=pointInFrame3(r.frame,r.rootLocal),d=sub3(r.targetWorld,root),distance=Math.hypot(...d),eps=1e-9*Math.max(r.upper,r.lower,1);
  if(distance<eps) return {status:'blocked',reason:'singular'};
  if(distance>r.upper+r.lower+eps||distance<Math.abs(r.upper-r.lower)-eps) return {status:'blocked',reason:'reach'};
  const n=vectorInFrame3(r.frame,r.normalLocal);
  if(Math.abs(dot3(n,d))>r.planeTolerance) return {status:'blocked',reason:'off-plane'};
  const p=cross3(unit3(d),n);
  if(Math.hypot(...p)<1e-10) return {status:'blocked',reason:'singular'};
  const joint=solveTwoBone(root,r.targetWorld,r.upper,r.lower,scale3(unit3(p),r.bendSign));
  const a=unit3(sub3(joint,root)),b=unit3(sub3(r.targetWorld,joint));
  const signedFlexion=Math.atan2(dot3(n,cross3(a,b)),dot3(a,b));
  if(signedFlexion<low-1e-9||signedFlexion>high+1e-9) return {status:'blocked',reason:'joint-limit'};
  return {status:'solved',root,joint,end:[...r.targetWorld],signedFlexion};
}
