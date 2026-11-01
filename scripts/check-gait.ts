import assert from 'node:assert/strict';
import { sampleFootsteps, supportBalance, inspectFootPasses } from '../src/core/gait';
import { placeOnPivot, rotatePoint, type Point2 } from '../src/core/spatial';
import { fitVerticalShift } from '../src/core/kinematics';
import type { Step2D } from '../src/core/contacts';

for (const size of [.4, 1, 3]) for (const offset of [-200, 50]) {
  const a: Point2 = [offset, 31], b: Point2 = [offset + 60 * size, 20];
  const c: Point2 = [offset + 100 * size, 10];
  const steps: Step2D[] = [
    { start: 1, end: 1.5, from: a, to: b, lift: 18 * size, fromHeading: .2, toHeading: .9 },
    { start: 2.5, end: 3.2, from: b, to: c, lift: 23 * size, fromHeading: .9, toHeading: 1.2 },
  ];
  const at = (t: number) => sampleFootsteps(t, steps, .18);
  assert.deepEqual(at(-2).position, a); assert.deepEqual(at(5).position, c);
  assert.deepEqual(at(2).position, b); assert.deepEqual(at(2).ground, b);
  assert.equal(at(2).heading, .9);
  for (const t of [1, 1.1, 1.4, 1.5, 2.5, 2.9, 3.2]) assert.equal(at(t).load, 0);
  assert(at(.9).load > 0 && at(.9).load < 1, 'unload before lifting');
  assert(at(1.6).load > 0 && at(1.6).load < 1, 'accept weight after contact');
  assert.equal(at(.5).compression, 0); assert.equal(at(2).compression, 0);
  assert(at(1.68).compression > .99);
  assert.equal(at(.5).roll, 0); assert.equal(at(1).roll, 1); assert.equal(at(1.5).roll, -1);
  assert.equal(at(2).roll, 0);
  const other = { ground: [10, 40] as Point2, load: 1 };
  assert.deepEqual(supportBalance([at(1.2), other]).weights, [0, 1]);
  assert.deepEqual(supportBalance([at(1.2), other]).center, other.ground);
  // Random/reverse sampling has no accumulated cycle or contact state.
  const expected = new Map([.9, 1.2, 1.6, 2, 2.9, 4].map(t => [t, at(t)]));
  for (const t of [4, 2, .9, 2.9, 1.2, 1.6, .9]) assert.deepEqual(at(t), expected.get(t));
  assert.throws(() => sampleFootsteps(0, [steps[0], { ...steps[1], from: [0, 0] }]));
  assert.throws(() => sampleFootsteps(0, [steps[0], { ...steps[1], start: 1.6 }], .18));
}
assert.throws(() => sampleFootsteps(0, []));
assert.throws(() => sampleFootsteps(0, [{ start: 0, end: 1, from: [0, 0], to: [1, 0], lift: 2 }], 0));
assert.throws(() => supportBalance([{ ground: [0, 0], load: 0 }]));
assert.throws(() => supportBalance([{ ground: [0, 0], load: -1 }]));

for (const pivot of [[-25, 15], [47, 15]] as Point2[]) for (const angle of [-.3, 0, .2]) {
  const placed = placeOnPivot([80, 300], [0, 15], pivot, angle);
  const p = rotatePoint(pivot, angle);
  assert(Math.hypot(placed.origin[0] + p[0] - placed.contact[0], placed.origin[1] + p[1] - placed.contact[1]) < 1e-9);
  assert.deepEqual(placed.contact, [80 + pivot[0], 300]);
}
assert.throws(() => placeOnPivot([0, 0], [0, 13], [NaN, 0], 0));
const supports = [{ root: [0, -10, 0] as [number, number, number], target: [6, 0, 0] as [number, number, number], reach: 10 }];
assert.equal(fitVerticalShift(supports), 2);
assert.equal(fitVerticalShift(supports, 5), 5);
assert.equal(fitVerticalShift(supports, 30), 18);
assert.throws(() => fitVerticalShift([{ ...supports[0], reach: 5 }]));
assert.throws(() => fitVerticalShift([supports[0], { root: [0, 30, 0], target: [0, 0, 0], reach: 1 }]));
console.log('PASS shared foot tracks, support transfer, fixed rocker pivots, height constraints and reverse seeks');


// Catches the actual step-together defect: copying the front landing to the rear foot.
for(const direction of [1,-1])for(const size of [.5,1,2]){
 const point=(x:number):Point2=>[direction*x*size,0];
 const from=[point(10),point(0)] as const;
 const tracks:Step2D[][]=[
  [{start:2,end:2.4,from:from[0],to:point(30),lift:4*size}],
  [{start:1,end:1.4,from:from[1],to:point(20),lift:4*size}],
 ];
 const passes=inspectFootPasses(tracks as [Step2D[],Step2D[]],[direction,0],.1);
 assert.deepEqual(passes.map(p=>p.foot),[1,0]);assert(passes.every(p=>p.passed));
 const bad=[tracks[0],[{...tracks[1][0],start:3,end:3.4,to:point(20)}]] as [Step2D[],Step2D[]];
 assert(inspectFootPasses(bad,[direction,0],.1).some(p=>!p.passed),'repeated rear catch-up must be detected');
}
assert.throws(()=>inspectFootPasses([[],[]],[0,0]));
const roundoffSteps:Step2D[]=[{start:7.52,end:7.88,from:[0,0],to:[10,0],lift:1}];
for(let i=-100;i<=100;i++){const sample=sampleFootsteps(7.52+i*1e-10,roundoffSteps,.04);assert(sample.load>=0&&sample.load<=1);}
console.log('PASS passing-foot evidence catches step-together tracks, both directions/scales; fractional load bounds');
