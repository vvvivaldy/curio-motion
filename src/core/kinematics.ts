import type { Vec3 } from './spatial';

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
