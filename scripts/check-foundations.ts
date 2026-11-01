import assert from 'node:assert/strict';
import {createTrajectory, parameterizeByDistance} from '../src/core/trajectory';
import {sampleDampedSpring, sampleSpringImpulse} from '../src/core/spring';
import {attachContacts, solveLimbContact, type ContactLimbRequest} from '../src/core/constraints';
import {localPoint, type Point2} from '../src/core/spatial';
import {foundationsPose,shoulder,limbLimits,hook} from '../src/examples/motion-foundations/motion';
import {inspectFoundationsPose} from '../src/examples/motion-foundations/diagnostics';
import {contourAnchor} from '../src/core/contour';

const near = (a: number, b: number, tolerance = 1e-7) => assert(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
const pointNear = (a: Point2, b: Point2, tolerance = 1e-7) => {near(a[0], b[0], tolerance); near(a[1], b[1], tolerance);};
const trajectory = createTrajectory([
  {time: 1, position: [0, 0]},
  {time: 2.2, position: [80, -60], velocity: [100, 10], acceleration: [-20, 30]},
  {time: 4, position: [190, 20]},
]);
pointNear(trajectory.sample(-100).position, [0, 0]);
pointNear(trajectory.sample(100).position, [190, 20]);
pointNear(trajectory.sample(100).velocity, [0, 0]);
pointNear(trajectory.sample(2.2).velocity, [100, 10]);
pointNear(trajectory.sample(2.2).acceleration, [-20, 30]);
// Derivatives are checked independently by finite differences, including both sides of a key.
for (const t of [1.1, 1.6, 2.199, 2.201, 3.2, 3.9]) {
  const dt = 1e-5, a = trajectory.sample(t - dt), b = trajectory.sample(t + dt), at = trajectory.sample(t);
  for (const i of [0, 1]) {
    near((b.position[i] - a.position[i]) / (2 * dt), at.velocity[i], 1e-5);
    near((b.velocity[i] - a.velocity[i]) / (2 * dt), at.acceleration[i], 1e-4);
  }
}
for (const t of [1, 2.2, 4]) {
  const a = trajectory.sample(t - 1e-7), b = trajectory.sample(t + 1e-7);
  pointNear(a.position, b.position, 1e-3);
  pointNear(a.velocity, b.velocity, 1e-3);
  pointNear(a.acceleration, b.acceleration, 1e-3);
}
// Seconds matter: stretching duration scales velocity by 1/T and acceleration by 1/T².
const slow = createTrajectory([{time: 0, position: [0, 0]}, {time: 4, position: [100, -20]}]);
const fast = createTrajectory([{time: 0, position: [0, 0]}, {time: 2, position: [100, -20]}]);
pointNear(slow.sample(1).position, fast.sample(.5).position);
near(slow.sample(1).velocity[0] * 2, fast.sample(.5).velocity[0]);
near(slow.sample(1).acceleration[0] * 4, fast.sample(.5).acceleration[0]);
const mutable: Point2 = [0, 0];
const copied = createTrajectory([{time: 0, position: mutable}, {time: 1, position: [10, 10]}]);
mutable[0] = 999;copied.sample(0).position[0] = 888;pointNear(copied.sample(0).position, [0, 0]);
for (const keys of [[], [{time: 0, position: [0, 0] as Point2}],
  [{time: 1, position: [0, 0] as Point2}, {time: 1, position: [1, 1] as Point2}],
  [{time: 0, position: [0, 0] as Point2, velocity: [1, 0] as Point2}, {time: 1, position: [1, 1] as Point2}]])
  assert.throws(() => createTrajectory(keys), RangeError);
assert.throws(() => trajectory.sample(NaN), RangeError);

const straight = parameterizeByDistance(slow);
near(straight.length, Math.hypot(100, 20), 1e-8);
pointNear(straight.sample(straight.length / 2).position, [50, -10], .002);
pointNear(straight.sample(-1).position, [0, 0]);
const path = parameterizeByDistance(trajectory, 512);
const dense = parameterizeByDistance(trajectory, 4096);
near(path.length / dense.length, 1, .0001);
// Equal distance intervals produce equal small displacements even around changing curvature.
for (let i = 2; i < 98; i++) {
  const d = path.length * i / 100, step = .01;
  const a = path.sample(d - step), b = path.sample(d + step);
  near(Math.hypot(a.position[0] - b.position[0], a.position[1] - b.position[1]) / (2 * step), 1, .025);
  near(Math.hypot(...path.sample(d).tangent), 1);
}
assert.throws(() => parameterizeByDistance(createTrajectory([{time: 0, position: [1, 1]}, {time: 1, position: [1, 1]}])), RangeError);
assert.throws(() => parameterizeByDistance(trajectory, 1), RangeError);
assert.throws(() => path.sample(Infinity), RangeError);

for (const dampingRatio of [0, .15, .7, .9999999999, 1, 1.0000000001, 2, 15]) {
  const parameters = {frequencyHz: 1.7, dampingRatio}, initial = {offset: .7, velocity: -1.2};
  assert.deepEqual(sampleDampedSpring(0, initial, parameters), initial);
  // Semigroup property: direct evaluation agrees with subdividing time, across every regime.
  const direct = sampleDampedSpring(.83, initial, parameters);
  const split = sampleDampedSpring(.52, sampleDampedSpring(.31, initial, parameters), parameters);
  near(direct.offset, split.offset, 1e-7);near(direct.velocity, split.velocity, 1e-7);
  let energy = Infinity;
  for (let i = 0; i < 200; i++) {
    const state = sampleDampedSpring(i / 100, initial, parameters);
    const current = state.velocity ** 2 + (2 * Math.PI * parameters.frequencyHz * state.offset) ** 2;
    assert(current <= energy + 1e-8, `Unforced spring gained energy at damping ${dampingRatio}`);energy = current;
  }
}
const critical = sampleDampedSpring(.5, {offset: 1, velocity: 0}, {frequencyHz: 1 / (2 * Math.PI), dampingRatio: 1});
near(critical.offset, 1.5 * Math.exp(-.5));near(critical.velocity, -.5 * Math.exp(-.5));
const impulse = {start: 2, velocity: 5, duration: 2, fade: .4, frequencyHz: 2, dampingRatio: .4};
for (const t of [0, 1.9, 4, 100]) assert.deepEqual(sampleSpringImpulse(t, impulse), {offset: 0, velocity: 0});
near(sampleSpringImpulse(2, impulse).offset, 0);near(sampleSpringImpulse(2, impulse).velocity, 5);
near(sampleSpringImpulse(4 - 1e-6, impulse).offset, 0, 1e-10);
near(sampleSpringImpulse(4 - 1e-6, impulse).velocity, 0, 1e-7);
const dt = 1e-5;
near((sampleSpringImpulse(3.8 + dt, impulse).offset - sampleSpringImpulse(3.8 - dt, impulse).offset) / (2 * dt), sampleSpringImpulse(3.8, impulse).velocity, 1e-6);
assert.throws(() => sampleDampedSpring(-1, {offset: 0, velocity: 0}, impulse), RangeError);
assert.throws(() => sampleSpringImpulse(0, {...impulse, fade: 0}), RangeError);
assert.throws(() => sampleDampedSpring(0, {offset: 0, velocity: 0}, {...impulse, frequencyHz: 0}), RangeError);

const orientation = {angle: .6, scale: 1.4};
const original = {origin: [20, -30] as Point2, ...orientation};
const contacts = [[3, 4], [-4, 7]].map(local => ({local: local as Point2, target: localPoint(local as Point2, original)}));
const attached = attachContacts(orientation, contacts);
assert.equal(attached.status, 'solved');
if (attached.status === 'solved') pointNear(attached.frame.origin, original.origin);
const incompatible = attachContacts(orientation, [contacts[0], {...contacts[1], target: [100, 100]}]);
assert.equal(incompatible.status, 'blocked');assert(!('frame' in incompatible));
const request: ContactLimbRequest = {root: [0, 0], upper: 70, lower: 60,
  contact: {local: [12, 3], target: [100, -20]}, handAngle: .2, handScale: 1.2,
  bendSide: -1, shoulderRange: [-Math.PI, Math.PI], elbowRange: [0, Math.PI], wristRange: [-Math.PI, Math.PI]};
const solved = solveLimbContact(request);
assert.equal(solved.status, 'solved');
if (solved.status === 'solved') {
  const {pose} = solved;
  near(Math.hypot(pose.joint[0] - pose.root[0], pose.joint[1] - pose.root[1]), request.upper);
  near(Math.hypot(pose.end[0] - pose.joint[0], pose.end[1] - pose.joint[1]), request.lower);
  pointNear(localPoint(request.contact.local, pose.handFrame), request.contact.target);
  for (const [name, bounds] of [['shoulderRange', [2, 2.1]], ['elbowRange', [0, .1]], ['wristRange', [2, 2.1]]] as const) {
    const result = solveLimbContact({...request, [name]: bounds});
    assert.equal(result.status, 'blocked');assert(!('pose' in result));
    assert(result.violations.some(v => v.constraint === name.replace('Range', '')));
  }
}
for (const target of [[1000, 0], [12 * 1.2 * Math.cos(.2) - 3 * 1.2 * Math.sin(.2), 12 * 1.2 * Math.sin(.2) + 3 * 1.2 * Math.cos(.2)]] as Point2[]) {
  const result = solveLimbContact({...request, contact: {...request.contact, target}});
  assert.equal(result.status, 'blocked');assert(!('pose' in result));
}
assert.throws(() => solveLimbContact({...request, elbowRange: [2, 1]}), RangeError);
assert.throws(() => attachContacts({angle: 0, scale: 0}, contacts), RangeError);
console.log('PASS controlled trajectories/distance sampling, analytic springs, locked contacts and joint conflicts');

// Confirmed historical far-hold collision: capsule/contact checks alone passed it.
const farHold=foundationsPose(75/24);
const oldArm=solveLimbContact({root:shoulder,...limbLimits,upper:260,lower:240,
  contact:{local:contourAnchor(hook,'touch',1),target:farHold.target},handAngle:0});
assert.equal(oldArm.status,'solved');
if(oldArm.status==='solved')assert.equal(inspectFoundationsPose({...farHold,arm:oldArm.pose},75)
  .find(r=>r.relation==='arm-barrier-clearance')?.status,'fail');
assert(inspectFoundationsPose(farHold,75).every(r=>r.status==='pass'));
console.log('PASS confirmed whole forearm/dome counterexample rejected; repaired far-hold passes');
// Real demo end: subtraction rounded elapsed below1.4 at time7.2+1.4.
const exactEnding={start:7.2,duration:1.4,fade:.4,velocity:7,frequencyHz:1.8,dampingRatio:.36};
assert.deepEqual(sampleSpringImpulse(exactEnding.start+exactEnding.duration,exactEnding),{offset:0,velocity:0});
console.log('PASS exact finite spring hold at the real7.2+1.4 event');
