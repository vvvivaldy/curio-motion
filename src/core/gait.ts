import { sampleStep, type Step2D } from './contacts';
import { mix, tween } from './time';
import type { Point2 } from './spatial';

/** One foot's authored contacts, in a single surface coordinate space. No playback state. */
export function sampleFootsteps(time: number, steps: readonly Step2D[], transfer = .12) {
  if (!steps.length || !Number.isFinite(transfer) || transfer <= 0)
    throw new RangeError('A foot track and positive transfer duration are required');
  let index = 0, load = 1, roll = 0, compression = 0;
  for (const [i, step] of steps.entries()) {
    const previous = steps[i - 1];
    if (previous && (step.start < previous.end + 2 * transfer
      || step.from.some((v, n) => v !== previous.to[n])
      || (step.fromHeading ?? 0) !== (previous.toHeading ?? previous.fromHeading ?? 0)))
      throw new RangeError('Footsteps must join exactly with room for load transfer');
    // Also validates every interval, including future contacts on a random seek.
    sampleStep(time, step);
    if (time >= step.start) index = i;
    const unload = tween(time, step.start - transfer, step.start);
    const accept = tween(time, step.end, step.end + transfer);
    load = Math.min(load, 1 - unload + accept);
    if (time >= step.start - transfer && time <= step.end + transfer) {
      roll = time < step.start ? unload : time > step.end ? accept - 1
        : mix(1, -1, sampleStep(time, step).progress);
    }
    const u = Math.max(0, Math.min(1, (time - step.end) / (2 * transfer)));
    compression = Math.max(compression, 16 * u * u * (1 - u) * (1 - u));
  }
  const step = steps[index], sample = sampleStep(time, step);
  const height = step.lift * 16 * sample.progress ** 2 * (1 - sample.progress) ** 2;
  const ground: Point2 = sample.progress === 0 ? [...step.from] : sample.progress === 1 ? [...step.to]
    : [mix(step.from[0], step.to[0], sample.progress), mix(step.from[1], step.to[1], sample.progress)];
  return { ...sample, ground, height, load, roll, compression, index };
}

/** An authored load distribution, not a mass/dynamics simulation. Airborne feet carry no load. */
export function supportBalance(contacts: readonly { ground: Point2; load: number }[]) {
  if (!contacts.length || contacts.some(c => ![...c.ground, c.load].every(Number.isFinite) || c.load < 0))
    throw new RangeError('Finite contacts and nonnegative loads are required');
  const total = contacts.reduce((sum, c) => sum + c.load, 0);
  if (total <= 0) throw new RangeError('No loaded support; a flight phase needs a separate body trajectory');
  const weights = contacts.map(c => c.load / total);
  const center: Point2 = [0, 0];
  contacts.forEach((c, i) => { center[0] += c.ground[0] * weights[i]; center[1] += c.ground[1] * weights[i]; });
  return { center, weights };
}
