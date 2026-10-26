import { clamp, mix } from './time';
import type { Point2 } from './spatial';

export interface CubicCurve {
  readonly key: string;
  readonly c1: Point2;
  readonly c2: Point2;
  readonly to: Point2;
}
export interface CubicContour { readonly start: Point2; readonly curves: readonly CubicCurve[] }
const pointMix = (a: Point2, b: Point2, u: number): Point2 => u === 0 ? [...a] : u === 1 ? [...b]
  : [mix(a[0], b[0], u), mix(a[1], b[1], u)];

export function validateContour(contour: CubicContour) {
  const points = [contour.start, ...contour.curves.flatMap(c => [c.c1, c.c2, c.to])];
  if (!contour.curves.length || !points.flat().every(Number.isFinite)
    || new Set(contour.curves.map(c => c.key)).size !== contour.curves.length
    || contour.curves.some(c => !c.key)
    || contour.curves.at(-1)!.to.some((v, i) => v !== contour.start[i]))
    throw new RangeError('Finite closed contour with unique curve keys required');
}

/** Keys encode the author's anatomical correspondence, not an arbitrary point index. */
export function morphContour(a: CubicContour, b: CubicContour, amount: number): CubicContour {
  validateContour(a); validateContour(b);
  if (!Number.isFinite(amount) || a.curves.length !== b.curves.length
    || a.curves.some((c, i) => c.key !== b.curves[i].key)) throw new RangeError('Matching contour topology required');
  const u = clamp(amount);
  return { start: pointMix(a.start, b.start, u), curves: a.curves.map((c, i) => ({ key: c.key,
    c1: pointMix(c.c1, b.curves[i].c1, u), c2: pointMix(c.c2, b.curves[i].c2, u), to: pointMix(c.to, b.curves[i].to, u) })) };
}

export function mapContour(contour: CubicContour, map: (p: Point2) => Point2): CubicContour {
  return { start: map(contour.start), curves: contour.curves.map(c => ({ key: c.key, c1: map(c.c1), c2: map(c.c2), to: map(c.to) })) };
}

export function cubicPoint(from: Point2, curve: CubicCurve, amount: number): Point2 {
  if (![...from, ...curve.c1, ...curve.c2, ...curve.to, amount].every(Number.isFinite)) throw new RangeError('Finite cubic required');
  const u = clamp(amount), v = 1 - u;
  return [0, 1].map(i => v ** 3 * from[i] + 3 * v * v * u * curve.c1[i]
    + 3 * v * u * u * curve.c2[i] + u ** 3 * curve.to[i]) as Point2;
}

export function contourAnchor(contour: CubicContour, key: string, amount = .5): Point2 {
  const i = contour.curves.findIndex(c => c.key === key);
  if (i < 0) throw new RangeError('Missing contour anchor');
  return cubicPoint(i === 0 ? contour.start : contour.curves[i - 1].to, contour.curves[i], amount);
}

export function quadraticPoint(a: Point2, control: Point2, b: Point2, amount: number): Point2 {
  if (![...a, ...control, ...b, amount].every(Number.isFinite)) throw new RangeError('Finite quadratic required');
  const u = clamp(amount), v = 1 - u;
  return [v * v * a[0] + 2 * v * u * control[0] + u * u * b[0], v * v * a[1] + 2 * v * u * control[1] + u * u * b[1]];
}
