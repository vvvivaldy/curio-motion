import type {Point2} from './spatial';

export interface TrajectoryKey {
  readonly time: number;
  readonly position: Point2;
  /** Units per second. Omit for a deliberate stop, supply for a through-point. */
  readonly velocity?: Point2;
  /** Units per second squared; defaults to zero. */
  readonly acceleration?: Point2;
}
export interface TrajectorySample {position: Point2; velocity: Point2; acceleration: Point2}
const finite = (point: Point2) => point.length === 2 && point.every(Number.isFinite);
const copy = (point: Point2): Point2 => [...point];

/** Piecewise quintic Hermite interpolation in seconds. C2 at keys, exact finite holds.
 * Positions, velocities and accelerations share the caller's coordinate space.
 * No automatic tangent guessing, collision avoidance or playback state.
 */
export function createTrajectory(input: readonly TrajectoryKey[]) {
  if (input.length < 2) throw new RangeError('At least two trajectory keys required');
  const keys = input.map(key => ({time: key.time, position: copy(key.position),
    velocity: copy(key.velocity ?? [0, 0]), acceleration: copy(key.acceleration ?? [0, 0])}));
  keys.forEach((key, i) => {
    if (!Number.isFinite(key.time) || ![key.position, key.velocity, key.acceleration].every(finite)
      || (i > 0 && (!(key.time > keys[i - 1].time) || !Number.isFinite(key.time - keys[i - 1].time))))
      throw new RangeError('Finite trajectory data and strictly increasing representable times required');
  });
  for (const key of [keys[0], keys.at(-1)!])
    if ([...key.velocity, ...key.acceleration].some(value => value !== 0))
      throw new RangeError('Finite held trajectory must begin and end with zero velocity and acceleration');
  const segments = keys.slice(0, -1).map((a, i) => {
    const b = keys[i + 1], duration = b.time - a.time;
    const coefficients = [0, 1].map(axis => {
      const p = a.position[axis], v = a.velocity[axis] * duration;
      const acc = a.acceleration[axis] * duration * duration;
      const d = b.position[axis] - p - v - acc / 2;
      const dv = b.velocity[axis] * duration - v - acc;
      const da = b.acceleration[axis] * duration * duration - acc;
      const c = [p, v, acc / 2, 10 * d - 4 * dv + da / 2, -15 * d + 7 * dv - da, 6 * d - 3 * dv + da / 2];
      if (!c.every(Number.isFinite)) throw new RangeError('Unrepresentable trajectory coefficients');
      return c;
    });
    return {start: a.time, end: b.time, duration, coefficients};
  });
  const atKey = (key: typeof keys[number]): TrajectorySample => ({position: copy(key.position),
    velocity: copy(key.velocity), acceleration: copy(key.acceleration)});
  const sample = (time: number): TrajectorySample => {
    if (!Number.isFinite(time)) throw new RangeError('Finite trajectory time required');
    if (time <= keys[0].time) return atKey(keys[0]);
    if (time >= keys.at(-1)!.time) return atKey(keys.at(-1)!);
    const key = keys.find(key => key.time === time);
    if (key) return atKey(key);
    const segment = segments.find(segment => time < segment.end)!;
    const u = (time - segment.start) / segment.duration;
    const values = segment.coefficients.map(([c0, c1, c2, c3, c4, c5]) => [
      c0 + u * (c1 + u * (c2 + u * (c3 + u * (c4 + u * c5)))),
      (c1 + u * (2 * c2 + u * (3 * c3 + u * (4 * c4 + u * 5 * c5)))) / segment.duration,
      (2 * c2 + u * (6 * c3 + u * (12 * c4 + u * 20 * c5))) / segment.duration / segment.duration,
    ]);
    if (!values.flat().every(Number.isFinite)) throw new RangeError('Unrepresentable trajectory sample');
    return {position: [values[0][0], values[1][0]], velocity: [values[0][1], values[1][1]],
      acceleration: [values[0][2], values[1][2]]};
  };
  return {sample, start: keys[0].time, end: keys.at(-1)!.time, knots: Object.freeze(keys.map(key => key.time))};
}

/** Chord-table arc-length approximation; sampling density is explicit, not an error bound.
 * Remap any finite trajectory by distance, then apply sampleTravel or another speed profile.
 * The original key times become shape parameters; authored pauses are intentionally removed.
 */
export function parameterizeByDistance(trajectory: ReturnType<typeof createTrajectory>, samplesPerSegment = 256) {
  if (!Number.isSafeInteger(samplesPerSegment) || samplesPerSegment < 8 || samplesPerSegment > 4096)
    throw new RangeError('Distance table requires 8..4096 samples per segment');
  const table = [{time: trajectory.start, distance: 0, point: trajectory.sample(trajectory.start).position}];
  for (let i = 1; i < trajectory.knots.length; i++) {
    const a = trajectory.knots[i - 1], b = trajectory.knots[i];
    for (let j = 1; j <= samplesPerSegment; j++) {
      const time = j === samplesPerSegment ? b : a + (b - a) * j / samplesPerSegment;
      const point = trajectory.sample(time).position, previous = table.at(-1)!;
      const distance = previous.distance + Math.hypot(point[0] - previous.point[0], point[1] - previous.point[1]);
      if (!Number.isFinite(distance)) throw new RangeError('Unrepresentable path length');
      table.push({time, distance, point});
    }
  }
  const length = table.at(-1)!.distance;
  if (!(length > 0)) throw new RangeError('A distance path must have positive length');
  return {length, sample(distance: number) {
    if (!Number.isFinite(distance)) throw new RangeError('Finite path distance required');
    const d = Math.max(0, Math.min(length, distance));
    let low = 0, high = table.length - 1;
    while (low + 1 < high) {
      const mid = (low + high) >>> 1;
      if (table[mid].distance <= d) low = mid; else high = mid;
    }
    // Select a nonzero chord even at stationary ends / repeated positions.
    while (low > 0 && table[high].distance === table[low].distance) low--;
    while (high < table.length - 1 && table[high].distance === table[low].distance) high++;
    const a = table[low], b = table[high], fraction = (d - a.distance) / (b.distance - a.distance);
    const time = d === 0 ? trajectory.start : d === length ? trajectory.end : a.time + (b.time - a.time) * fraction;
    const value = trajectory.sample(time);
    const speed = Math.hypot(...value.velocity);
    const direction: Point2 = speed > 1e-10 ? value.velocity : [b.point[0] - a.point[0], b.point[1] - a.point[1]];
    const magnitude = Math.hypot(...direction);
    return {position: value.position, tangent: [direction[0] / magnitude, direction[1] / magnitude] as Point2, parameterTime: time};
  }};
}
