import type { Vec3, Point2 } from './spatial';

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (v: Vec3) => Math.sqrt(dot(v, v));

/** Closest shared vertical translation that keeps every target within its reach sphere. */
export function fitVerticalShift(constraints: readonly { root: Vec3; target: Vec3; reach: number }[], desired = 0) {
  if (!constraints.length || !Number.isFinite(desired)) throw new RangeError('Support constraints required');
  let low = -Infinity, high = Infinity;
  for (const { root, target, reach } of constraints) {
    if (![...root, ...target, reach].every(Number.isFinite) || reach <= 0)
      throw new RangeError('Finite supports and positive reach required');
    const lateral = (target[0] - root[0]) ** 2 + (target[2] - root[2]) ** 2;
    if (lateral > reach * reach) throw new RangeError('Support exceeds lateral reach');
    const vertical = Math.sqrt(reach * reach - lateral), y = target[1] - root[1];
    low = Math.max(low, y - vertical); high = Math.min(high, y + vertical);
  }
  if (low > high) throw new RangeError('No common support height');
  return Math.max(low, Math.min(high, desired));
}

/** A deterministic two-bone joint. The pole is a bend direction, not a world point. */
export function solveTwoBone(a: Vec3, b: Vec3, l1: number, l2: number, pole: Vec3): Vec3 {
  if (![...a, ...b, ...pole, l1, l2].every(Number.isFinite) || l1 <= 0 || l2 <= 0)
    throw new RangeError('Finite points and positive bone lengths required');
  const d = sub(b, a), dist = length(d), epsilon = 1e-9 * Math.max(l1, l2, 1);
  if (dist > l1 + l2 + epsilon || dist < Math.abs(l1 - l2) - epsilon)
    throw new RangeError('Unreachable two-bone target');
  if (dist <= epsilon) {
    const direction: Vec3 = length(pole) > epsilon ? pole : [1, 0, 0];
    return add(a, scale(direction, l1 / length(direction)));
  }
  const u = scale(d, 1 / dist);
  let p = sub(pole, scale(u, dot(pole, u)));
  if (length(p) <= epsilon) {
    const axis: Vec3 = Math.abs(u[0]) <= Math.abs(u[1]) && Math.abs(u[0]) <= Math.abs(u[2])
      ? [1, 0, 0] : Math.abs(u[1]) <= Math.abs(u[2]) ? [0, 1, 0] : [0, 0, 1];
    p = sub(axis, scale(u, dot(axis, u)));
  }
  const along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist);
  const height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  return add(a, add(scale(u, along), scale(p, height / length(p))));
}

/** Signed shortest angle. Useful for joint limits, independent of authored angle winding. */
export function relativeAngle(angle: number, reference: number): number {
  if (![angle, reference].every(Number.isFinite)) throw new RangeError('Finite angles required');
  return Math.atan2(Math.sin(angle-reference), Math.cos(angle-reference));
}

/** Planar branch is explicit: +1 bends toward (-dy, dx). It never flips at shoulder height.
 * Limits reject a bad target; clamping a joint would silently break the held contact.
 */
export function solvePlanarLimb(root: Point2, target: Point2, upper: number, lower: number,
  options: { bendSide: -1 | 1; endAngle: number; wristRange: readonly [number, number]; minFlexion: number; maxFlexion?: number }) {
  const {bendSide,endAngle,wristRange,minFlexion}=options;
  const maxFlexion=options.maxFlexion??Math.PI;
  if (![...root,...target,endAngle,...wristRange,minFlexion,maxFlexion].every(Number.isFinite) ||
      ![-1,1].includes(bendSide) || wristRange[0]>wristRange[1] ||
      wristRange[0]<-Math.PI || wristRange[1]>Math.PI || minFlexion<0 || minFlexion>Math.PI || maxFlexion<minFlexion || maxFlexion>Math.PI)
    throw new RangeError('Invalid planar limb limits');
  const dx=target[0]-root[0],dy=target[1]-root[1];
  if (Math.hypot(dx,dy)<1e-8) throw new RangeError('Planar limb needs a nonzero target direction');
  const k=solveTwoBone([...root,0],[...target,0],upper,lower,[-dy*bendSide,dx*bendSide,0]);
  const joint:Point2=[k[0],k[1]];
  const upperAngle=Math.atan2(joint[1]-root[1],joint[0]-root[0]);
  const lowerAngle=Math.atan2(target[1]-joint[1],target[0]-joint[0]);
  const flexion=Math.abs(relativeAngle(lowerAngle,upperAngle));
  const wristBend=relativeAngle(endAngle,lowerAngle);
  if (flexion<minFlexion-1e-7 || flexion>maxFlexion+1e-7 || wristBend<wristRange[0]-1e-9 || wristBend>wristRange[1]+1e-9)
    throw new RangeError('Planar limb target exceeds joint limits');
  return {joint,upperAngle,lowerAngle,flexion,wristBend};
}

/** Forward rest pose: author a small actual bend rather than an arbitrary shorter reach. */
export function planarEndpoint(root:Point2,upper:number,lower:number,upperAngle:number,flexion:number,bendSide:-1|1):Point2{
  if(![...root,upper,lower,upperAngle,flexion].every(Number.isFinite)||upper<=0||lower<=0||flexion<0||flexion>Math.PI||![-1,1].includes(bendSide))throw new RangeError('Invalid planar rest pose');
  const lowerAngle=upperAngle-bendSide*flexion;
  return [root[0]+upper*Math.cos(upperAngle)+lower*Math.cos(lowerAngle),root[1]+upper*Math.sin(upperAngle)+lower*Math.sin(lowerAngle)];
}
