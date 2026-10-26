import { clamp, mix } from './time';
import type { Point2 } from './spatial';

const cross = (a: Point2, b: Point2, p: Point2) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);

/** Clip a polygon to a convex aperture; winding may be clockwise or counter-clockwise. */
export function clipConvex(subject: Point2[], boundary: Point2[]): Point2[] {
  const area = boundary.reduce((sum, p, i) => {
    const next = boundary[(i + 1) % boundary.length];
    return sum + p[0] * next[1] - p[1] * next[0];
  }, 0);
  if (boundary.length < 3 || Math.abs(area) < 1e-10) return [];
  const sign = Math.sign(area);
  let output = subject;
  for (let i = 0; i < boundary.length && output.length; i++) {
    const a = boundary[i], b = boundary[(i + 1) % boundary.length], input = output;
    output = [];
    let previous = input[input.length - 1], previousDistance = sign * cross(a, b, previous);
    for (const current of input) {
      const distance = sign * cross(a, b, current);
      if ((distance >= 0) !== (previousDistance >= 0)) {
        const u = previousDistance / (previousDistance - distance);
        output.push([mix(previous[0], current[0], u), mix(previous[1], current[1], u)]);
      }
      if (distance >= 0) output.push(current);
      previous = current; previousDistance = distance;
    }
  }
  return output;
}

export interface EyeShapeOptions {
  readonly center: Point2;
  readonly radius: Point2;
  readonly openness: number;
  readonly pupil: { readonly center: Point2; readonly radius: Point2 };
}

/** Visible white and pupil only. No skin-colored cover and no scene/character constants. */
export function eyeShape(options: EyeShapeOptions) {
  const { center: [x, y], radius: [rx, ry], pupil } = options;
  if (![x, y, rx, ry, options.openness, ...pupil.center, ...pupil.radius].every(Number.isFinite)
    || rx < 0 || ry <= 0 || pupil.radius.some(r => r < 0)) throw new RangeError('Invalid eye geometry');
  const open = clamp(options.openness), lid: Point2[] = [], lower: Point2[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = -1 + 2 * i / 24;
    const closed = y + ry * .35;
    lid.push([x + rx * u, mix(closed, y - ry * (.16 + .12 * (1 - u * u)), open)]);
    lower.push([x + rx * u, mix(closed, y + ry * Math.sqrt(Math.max(0, 1 - u * u)), open)]);
  }
  const aperture = rx > 0 && open > 0 ? [...lid, ...lower.reverse()] : [];
  const pupilOutline: Point2[] = Array.from({ length: 48 }, (_, i) => {
    const angle = i / 48 * Math.PI * 2;
    return [pupil.center[0] + Math.cos(angle) * pupil.radius[0], pupil.center[1] + Math.sin(angle) * pupil.radius[1]];
  });
  return { aperture, pupil: clipConvex(pupilOutline, aperture), lid };
}
