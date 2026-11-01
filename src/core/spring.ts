export interface SpringParameters {readonly frequencyHz: number; readonly dampingRatio: number}
export interface SpringState {readonly offset: number; readonly velocity: number}
function validate(parameters: SpringParameters) {
  const {frequencyHz, dampingRatio} = parameters, omega = 2 * Math.PI * frequencyHz;
  if (![frequencyHz, dampingRatio, omega, omega * omega, omega * Math.max(1, dampingRatio) * 2].every(Number.isFinite)
    || frequencyHz <= 0 || dampingRatio < 0) throw new RangeError('Positive representable spring frequency and nonnegative damping required');
  return omega;
}

/** Exact homogeneous spring response about a fixed equilibrium. Seconds, units, units/s.
 * Re-evaluate from the same initial state on every seek; never feed the last frame back in.
 */
export function sampleDampedSpring(elapsed: number, initial: SpringState, parameters: SpringParameters): SpringState {
  const omega = validate(parameters), {dampingRatio: zeta} = parameters;
  if (![elapsed, initial.offset, initial.velocity].every(Number.isFinite) || elapsed < 0)
    throw new RangeError('Nonnegative finite elapsed time and finite spring state required');
  if (elapsed === 0) return {...initial};
  const x = initial.offset, v = initial.velocity, decay = zeta * omega;
  let offset: number, velocity: number;
  if (zeta <= 1) {
    const frequency = omega * Math.sqrt((1 - zeta) * (1 + zeta));
    const phase = frequency * elapsed, exponential = Math.exp(-decay * elapsed);
    // sinc form remains well conditioned as the two roots meet at critical damping.
    const sine = frequency === 0 ? elapsed : Math.abs(phase) < 1e-4
      ? elapsed * (1 - phase * phase / 6 + phase ** 4 / 120) : Math.sin(phase) / frequency;
    const cosine = Math.cos(phase);
    offset = exponential * (x * cosine + (v + decay * x) * sine);
    velocity = exponential * (v * cosine - (decay * v + omega * omega * x) * sine);
  } else {
    const root = Math.sqrt(zeta - 1) * Math.sqrt(zeta + 1);
    const slow = -omega / (zeta + root), fast = -omega * (zeta + root);
    const exponential = Math.exp(slow * elapsed), fastExponential = Math.exp(fast * elapsed);
    const sine = exponential * -Math.expm1((fast - slow) * elapsed) / (slow - fast);
    offset = x * exponential + (v - slow * x) * sine;
    velocity = slow * x * exponential + (v - slow * x) * (fastExponential + slow * sine);
  }
  if (![offset, velocity].every(Number.isFinite)) throw new RangeError('Unrepresentable spring response');
  return {offset, velocity};
}

export interface SpringImpulse extends SpringParameters {
  readonly start: number;
  readonly velocity: number;
  readonly duration: number;
  /** Final smooth taper to an exact still hold; an authored gate, not free dynamics. */
  readonly fade: number;
}
export function sampleSpringImpulse(time: number, impulse: SpringImpulse): SpringState {
  validate(impulse);
  const {start, duration, fade} = impulse;
  if (![time, start, duration, fade, impulse.velocity, start + duration].every(Number.isFinite)
    || duration <= 0 || fade <= 0 || fade > duration) throw new RangeError('Finite impulse with 0 < fade <= duration required');
  if (time < start || time >= start + duration) return {offset: 0, velocity: 0};
  const elapsed = time - start;
  const response = sampleDampedSpring(elapsed, {offset: 0, velocity: impulse.velocity}, impulse);
  const u = Math.max(0, (elapsed - duration + fade) / fade);
  const weight = 1 - u ** 3 * (10 - 15 * u + 6 * u * u);
  const derivative = -30 * u * u * (1 - u) ** 2 / fade;
  return {offset: response.offset * weight, velocity: response.velocity * weight + response.offset * derivative};
}
