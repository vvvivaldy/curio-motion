import { tween } from '../../core/time';
import { excursion } from '../../core/gesture';

export const scratchStrokes = [[8.62, 8.81, 9], [9.24, 9.43, 9.62]] as const;
export function gestureAt(t: number) {
  const stroke = scratchStrokes.reduce((sum, [start, peak, end]) => sum + excursion(t, start, peak, end), 0);
  return {
    reach: tween(t, 7.75, 8.5) * (1 - tween(t, 9.82, 10.64)),
    gather: tween(t, 7.75, 8.02) * (1 - tween(t, 10.2, 10.64)),
    extension: tween(t, 8.08, 8.46) * (1 - tween(t, 10, 10.22)),
    contact: tween(t, 8.34, 8.5) * (1 - tween(t, 9.82, 10)),
    orient: tween(t, 7.75, 8.35) * (1 - tween(t, 10.1, 10.64)),
    surfaceParameter: .3 + .4 * stroke, stroke,
  };
}
