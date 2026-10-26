import assert from 'node:assert/strict';
import { clamp, mix, smooth, tween, evaluateFrame } from '../src/core/time';

assert.equal(clamp(-1), 0);
assert.equal(clamp(2), 1);
assert.equal(mix(10, 30, .25), 15);
assert.deepEqual([-1, 0, .5, 1, 2].map(smooth), [0, 0, .5, 1, 1]);
assert.deepEqual([1, 2, 3, 4, 5].map(t => tween(t, 2, 4)), [0, 0, .5, 1, 1]);

// The caller's fps/duration control time; invalid input must not evaluate a pose.
const timeline = { fps: 30, durationInFrames: 60 };
const times: number[] = [];
const sample = (time: number) => { times.push(time); return { x: time * 10 }; };
for (const frame of [0, 59, 30, 1, 0]) {
  const result = evaluateFrame(timeline, sample, frame);
  assert.deepEqual(result, { frame, time: frame / 30, pose: { x: frame / 30 * 10 } });
}
assert.deepEqual(times, [0, 59 / 30, 1, 1 / 30, 0]);
for (const frame of [-1, .5, 60, NaN, Infinity])
  assert.throws(() => evaluateFrame(timeline, sample, frame), /Frame must be an integer in 0..59/);
for (const fps of [0, -1, NaN, Infinity])
  assert.throws(() => evaluateFrame({ ...timeline, fps }, sample, 0), /fps/);
for (const durationInFrames of [0, -1, .5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
  assert.throws(() => evaluateFrame({ ...timeline, durationInFrames }, sample, 0), /durationInFrames/);
assert.equal(times.length, 5);
assert.equal(evaluateFrame({ fps: 23.976, durationInFrames: 1 }, sample, 0).time, 0);
console.log('PASS time helpers, configurable frame bounds and deterministic reverse seek');
