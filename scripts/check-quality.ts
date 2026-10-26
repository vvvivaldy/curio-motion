import assert from 'node:assert/strict';
import { eyeShape, clipConvex } from '../src/core/eye';
import { sampleStep, treadPoint } from '../src/core/contacts';
import { transformPoint, inverseTransformPoint, project, unproject, type Vec3, type Point2 } from '../src/core/spatial';
import { solveTwoBone } from '../src/core/kinematics';

const close = (a: number[], b: number[], epsilon = 1e-8) => assert(Math.hypot(...a.map((v, i) => v - b[i])) < epsilon);
for (const yaw of [0, Math.PI / 2, -.9, Math.PI, 1.3]) {
  const v: Vec3 = [13, -42, 7];
  close(unproject(project(v, yaw), yaw, -v[0] * Math.sin(yaw) + v[2] * Math.cos(yaw)), v);
}
for (const scale of [.25, 1, 2.3]) {
  const frame = { origin: [-300, 87] as Point2, scale };
  close(inverseTransformPoint(transformPoint([120, 50], frame), frame), [120, 50]);
}
assert.throws(() => transformPoint([0, 0], { origin: [0, 0], scale: 0 }));
assert.throws(() => inverseTransformPoint([0, 0], { origin: [NaN, 0], scale: 1 }));

const step = { start: 2, end: 3, from: [12, 50] as Point2, to: [92, 20] as Point2, lift: 25,
  fromHeading: -.3, toHeading: 1.1 };
assert.deepEqual(sampleStep(-10, step).position, step.from);
assert.deepEqual(sampleStep(10, step).position, step.to);
assert.equal(sampleStep(-10, step).heading, -.3);
assert.equal(sampleStep(10, step).heading, 1.1);
assert(sampleStep(2, step).planted && sampleStep(3, step).planted);
assert(!sampleStep(2.5, step).planted);
close(sampleStep(2.5, step).position, [52, 10]);
for (const t of [2, 3]) {
  const epsilon = 1e-6;
  const a = sampleStep(t - epsilon, step).position, b = sampleStep(t + epsilon, step).position;
  assert(Math.hypot(b[0] - a[0], b[1] - a[1]) / (2 * epsilon) < .001);
}
assert.throws(() => sampleStep(0, { ...step, end: 2 }));
assert.throws(() => sampleStep(0, { ...step, lift: -1 }));
close(treadPoint({ origin: [31, 80], run: 90, rise: 17 }, 2, .5), [256, 46]);
assert.throws(() => treadPoint({ origin: [0, 0], run: 0, rise: 17 }, 0));

const rectangle: Point2[] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
assert.deepEqual(clipConvex([[2, 2], [3, 2], [3, 3]], rectangle), []);
const area = (points: Point2[]) => Math.abs(points.reduce((sum, p, i) => {
  const next = points[(i + 1) % points.length];
  return sum + p[0] * next[1] - p[1] * next[0];
}, 0) / 2);
for (const boundary of [rectangle, [...rectangle].reverse()]) {
  const result = clipConvex([[-2, -.5], [2, -.5], [2, .5], [-2, .5]], boundary);
  assert(Math.abs(area(result) - 2) < 1e-8);
}
assert(area(eyeShape({ center: [0, 0], radius: [24, 32], openness: 1,
  pupil: { center: [3, 8], radius: [9.5, 13] } }).pupil) > 100);
const cross = (a: Point2, b: Point2, p: Point2) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
for (const x of [-120, 50]) for (const rx of [0, .001, .19, 3.6, 24, 45]) for (const openness of [0, .001, .5, 1]) {
  const shape = eyeShape({ center: [x, 30], radius: [rx, 32], openness,
    pupil: { center: [x + 3, 38], radius: [9.5, 13] } });
  if (rx === 0 || openness === 0) {
    assert.equal(shape.aperture.length, 0); assert.equal(shape.pupil.length, 0);
  }
  for (const p of shape.pupil) for (let i = 0; i < shape.aperture.length; i++)
    assert(cross(shape.aperture[i], shape.aperture[(i + 1) % shape.aperture.length], p) >= -1e-7);
  for (const winding of [shape.aperture, [...shape.aperture].reverse()]) {
    for (const p of clipConvex(shape.pupil, winding)) assert(p.every(Number.isFinite));
  }
}
assert.throws(() => eyeShape({ center: [0, 0], radius: [-1, 20], openness: 1, pupil: { center: [0, 0], radius: [5, 5] } }));

for (const [a, b, l1, l2, pole] of [
  [[0, 0, 0], [0, 0, 0], 2, 2, [0, 0, 0]],
  [[0, 0, 0], [0, 2, 0], 2, 2, [0, 1, 0]],
  [[3, 7, 11], [3, 10, 11], 2, 1, [1, 0, 0]],
] as [Vec3, Vec3, number, number, Vec3][]) {
  const joint = solveTwoBone(a, b, l1, l2, pole);
  assert(joint.every(Number.isFinite));
  assert(Math.abs(Math.hypot(...joint.map((v, i) => v - a[i])) - l1) < 1e-8);
  assert(Math.abs(Math.hypot(...joint.map((v, i) => v - b[i])) - l2) < 1e-8);
}
assert.throws(() => solveTwoBone([0, 0, 0], [0, 1, 0], 3, 1, [1, 0, 0]), /Unreachable/);
assert.throws(() => solveTwoBone([0, 0, 0], [0, 5, 0], 2, 2, [1, 0, 0]), /Unreachable/);
console.log('PASS shared eye apertures, arbitrary steps/surfaces, coordinate round trips and singular IK');
