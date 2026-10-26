import assert from 'node:assert/strict';
import { morphContour, mapContour, contourAnchor, quadraticPoint, validateContour, type CubicContour } from '../src/core/contour';
import { localPoint, attachAnchor, segmentFrame } from '../src/core/spatial';
import { excursion } from '../src/core/gesture';

const a: CubicContour = { start: [0, 0], curves: [
  { key: 'out', c1: [0, 10], c2: [20, 10], to: [20, 0] },
  { key: 'back', c1: [20, -10], c2: [0, -10], to: [0, 0] },
] };
for (const scale of [.3, 2, 5]) {
  const b = mapContour(a, p => [p[0] * scale - 113, p[1] * scale + 51]);
  assert.deepEqual(morphContour(a, b, -1), a);
  assert.deepEqual(morphContour(a, b, 2), b);
  for (const amount of [0, .2, .7, 1]) {
    const shape = morphContour(a, b, amount); validateContour(shape);
    const anchor = contourAnchor(shape, 'out');
    for (const angle of [-5, -.4, 0, 2.7]) {
      const placed = attachAnchor({ origin: [3, 7], angle, scale }, anchor, [200, -37]);
      const point = localPoint(anchor, placed);
      assert(Math.hypot(point[0] - 200, point[1] + 37) < 1e-9);
      const transformedAnchor = contourAnchor(mapContour(shape, p => localPoint(p, placed)), 'out');
      assert(Math.hypot(transformedAnchor[0] - point[0], transformedAnchor[1] - point[1]) < 1e-9);
    }
  }
}
assert.deepEqual(quadraticPoint([0, 0], [10, 20], [20, 0], .5), [10, 10]);
assert.throws(() => contourAnchor(a, 'missing'));
assert.throws(() => morphContour(a, { ...a, curves: [...a.curves].reverse() }, .5));
assert.throws(() => validateContour({ ...a, curves: [a.curves[0], { ...a.curves[1], key: 'out' }] }));
assert.throws(() => morphContour(a, a, NaN));
for (const reference of [-7, 0, 5]) {
  const f = segmentFrame([20, 30], [50, -10], reference);
  const p = localPoint([0, 50], { ...f, origin: [20, 30] });
  assert(Math.hypot(p[0] - 50, p[1] + 10) < 1e-9);
  assert(Math.abs(f.angle - reference) <= Math.PI);
}
assert.throws(() => segmentFrame([1, 2], [1, 2]));
for (const [start, peak, end] of [[1, 2, 4], [-5, -4.5, -4]]) {
  assert.equal(excursion(start - 2, start, peak, end), 0);
  assert.equal(excursion(peak, start, peak, end), 1);
  assert.equal(excursion(end + 2, start, peak, end), 0);
  for (const t of [start, peak, end]) {
    const e = 1e-5;
    assert(Math.abs(excursion(t + e, start, peak, end) - excursion(t - e, start, peak, end)) / (2 * e) < .001);
  }
}
assert.throws(() => excursion(1, 2, 2, 3));
console.log('PASS shared contour topology, local frames, surface anchors and deliberate excursion holds');
