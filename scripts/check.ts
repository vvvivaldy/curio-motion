import assert from 'node:assert/strict';
import './check-time';
import './check-quality';
import './check-gait';
import { pose, project } from '../src/examples/pink-monkey/motion';
import { stairs, rideStarts } from '../src/examples/pink-monkey/layout';
import { treadPoint } from '../src/core/contacts';
import { footTracks } from '../src/examples/pink-monkey/steps';
import { transformPoint, rotatePoint, type Point2 } from '../src/core/spatial';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('qa', { recursive: true });
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
const windows = footTracks.flatMap((track, leg) => [
    ...track.map((step, i) => ({ leg, start: i === 0 ? 0 : track[i - 1].end, end: step.start,
        target: step.from, heading: step.fromHeading ?? 0, surface: 'floor' })),
    { leg, start: track.at(-1)!.end, end: 12, target: track.at(-1)!.to, heading: Math.PI / 2, surface: 'tread-0' },
]);
let maxJoint = 0, maxContact = 0, maxProjection = 0, maxStep = 0, maxNoseScratch = 0;
let previous: ReturnType<typeof pose> | null = null;
const samples = [];
for (let n = 0; n <= 574; n++) {
    const t = n / 48, q = pose(t);
    assert(q.root.every(Number.isFinite));
    assert(q.legs.some(l => l.planted), `both feet airborne at ${t}`);
    assert(Math.abs(q.legs.reduce((sum, l) => sum + l.load, 0) - 1) < 1e-9);
    for (const [i, leg] of q.legs.entries()) {
        maxJoint = Math.max(maxJoint, Math.abs(distance(leg.hip, leg.knee) - 70), Math.abs(distance(leg.knee, leg.ankle) - 72));
        const p = project(leg.ankle, q.yaw);
        const rotated = rotatePoint(leg.footPivot, leg.footRoll);
        const drawnPivot: Point2 = [q.root[0] + q.scale * (p[0] + rotated[0]), q.root[1] + q.scale * (p[1] + rotated[1])];
        maxProjection = Math.max(maxProjection, distance(drawnPivot, leg.contactPivot));
        const drawnSole: Point2 = [drawnPivot[0] - leg.footPivot[0] * q.scale,
            drawnPivot[1] - (leg.footPivot[1] - 13) * q.scale];
        maxProjection = Math.max(maxProjection, distance(drawnSole, leg.screenSole));
        if (!leg.planted) assert.equal(leg.load, 0, `load on airborne foot at ${t}`);
        if (t < 2.8 && leg.load === 1) assert(Math.abs(q.root[0] - leg.screenSole[0]) < 18, `weight not over stance foot at ${t}`);
        for (const window of windows) if (i === window.leg && t >= window.start && t <= window.end) {
            assert(Math.abs(leg.footYaw - window.heading) < 1e-8, `support heading changed at ${t}`);
            assert(leg.planted && leg.surface === window.surface, `missing support at ${t}, leg ${i}`);
            const world = window.surface === 'tread-0' ? transformPoint(window.target, q.platform) : window.target;
            maxContact = Math.max(maxContact, distance(drawnSole, transformPoint(world, q.camera)));
        }
        if (t >= rideStarts) {
            const tread = transformPoint(transformPoint(treadPoint(stairs, 0), q.platform), q.camera);
            assert(drawnSole[0] - 18 >= tread[0] && drawnSole[0] + 42 <= tread[0] + stairs.run);
            assert(Math.abs(drawnSole[1] - tread[1]) < 1e-8);
        }
        if (previous) {
            const old = previous.legs[i], a = project(old.knee, previous.yaw), b = project(leg.knee, q.yaw);
            maxStep = Math.max(maxStep, distance(
                [previous.root[0] + a[0] * previous.scale, previous.root[1] + a[1] * previous.scale],
                [q.root[0] + b[0] * q.scale, q.root[1] + b[1] * q.scale]));
        }
    }
    for (const arm of q.arms) maxJoint = Math.max(maxJoint,
        Math.abs(distance(arm.sh, arm.elbow) - 107), Math.abs(distance(arm.elbow, arm.hand) - 108));
    if (q.gesture > .999) maxNoseScratch = Math.max(maxNoseScratch, Math.hypot(q.scratch * .3, q.scratch * .55));
    previous = q;
    samples.push({ t, root: q.root, camera: q.camera, legs: q.legs.map(l => ({ position: l.screenSole, planted: l.planted, surface: l.surface })) });
}
// Boundaries include the formerly unchecked deceleration/turn/contact transitions.
const boundaries = [...new Set([2.35, 2.8, 2.88, rideStarts, ...footTracks.flatMap(track => track.flatMap(s =>
    [s.start - .12, s.start, s.end, s.end + .12, s.end + .24]))])];
for (const t of boundaries) {
    const a = pose(t - 1e-6), b = pose(t + 1e-6);
    assert(distance(a.root, b.root) < .001, `root discontinuity at ${t}`);
    for (let i = 0; i < 2; i++) assert(distance(a.legs[i].screenSole, b.legs[i].screenSole) < .001, `foot discontinuity at ${t}`);
}
for (const t of [3, 6.7, 7.1, 10.8, 11.9]) {
    const q = pose(t);
    assert(Math.abs(q.bob) < 1e-8 && Math.abs(q.weightShift) < 1e-8, `unmotivated body oscillation at ${t}`);
}
assert(maxJoint < 1e-7 && maxContact < 1e-7 && maxProjection < 1e-7 && maxStep < 12 && maxNoseScratch < 1.3,
    JSON.stringify({ maxJoint, maxContact, maxProjection, maxStep, maxNoseScratch }));
writeFileSync('qa/numeric-check.json', JSON.stringify({ samples: samples.length, maxJointError: maxJoint,
    maxHalfFrameKneeDisplacement: maxStep, poseSamples: samples }, null, 2));
writeFileSync('qa/contact-check.json', JSON.stringify({ maxPlantedFootError: maxContact, maxDrawnSoleProjectionError: maxProjection,
    contactWindows: windows, boundaryContinuity: 'PASS', noseContactMovementRadius: maxNoseScratch, pass: true }, null, 2));
console.log({ maxJoint, maxContact, maxProjection, maxStep, maxNoseScratch });
