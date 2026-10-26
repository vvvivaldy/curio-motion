import { tween } from './time';

/** One authored out-and-back movement, with zero velocity/acceleration at the three landmarks. */
export function excursion(time: number, start: number, peak: number, end: number) {
  if (![time, start, peak, end].every(Number.isFinite) || !(start < peak && peak < end))
    throw new RangeError('Ordered excursion landmarks required');
  return tween(time, start, peak) * (1 - tween(time, peak, end));
}
