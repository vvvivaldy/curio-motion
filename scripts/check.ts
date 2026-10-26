import assert from 'node:assert/strict';
import './check-time';
import './check-quality';
import { pose, project } from '../src/examples/pink-monkey/motion';
import { approachX, groundY, boardingFeet, stairs, rideStarts } from '../src/examples/pink-monkey/layout';
import { treadPoint } from '../src/core/contacts';
import { transformPoint, type Point2 } from '../src/core/spatial';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('qa', { recursive: true });
const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]));
const windows: { leg: number; start: number; end: number; target: Point2; surface: string }[] = [
    { leg: 0, start: 2.8, end: 3, target: [approachX - 30, groundY], surface: 'floor' },
    { leg: 0, start: 3.7, end: 5.1, target: [494, groundY], surface: 'floor' },
    { leg: 1, start: 2.8, end: 3.85, target: [approachX + 30, groundY], surface: 'floor' },
    { leg: 1, start: 4.55, end: 5.64, target: [526, groundY], surface: 'floor' },
    { leg: 0, start: 5.78, end: 12, target: boardingFeet[0], surface: 'tread-0' },
    { leg: 1, start: 6.35, end: 12, target: boardingFeet[1], surface: 'tread-0' },
];
let maxJoint = 0, maxContact = 0, maxProjection = 0, maxStep = 0, maxNoseScratch = 0;
let previous: ReturnType<typeof pose> | null = null;
const samples = [];
for (let n = 0; n <= 574; n++) {
    const t = n / 48, q = pose(t);
    assert(q.root.every(Number.isFinite));
    for (const [i, leg] of q.legs.entries()) {
        maxJoint = Math.max(maxJoint, Math.abs(distance(leg.hip, leg.knee) - 70), Math.abs(distance(leg.knee, leg.ankle) - 72));
        const p = project(leg.ankle, q.yaw);
        const drawnSole: Point2 = [q.root[0] + q.scale * p[0], q.root[1] + q.scale * (p[1] + 13)];
        maxProjection = Math.max(maxProjection, distance(drawnSole, leg.screenSole));
        if (t < 2.35 && leg.swing < 1e-8) {
            assert(leg.planted && leg.surface === 'floor');
            maxContact = Math.max(maxContact, distance(drawnSole, [approachX + leg.side * 30, groundY]));
        }
        for (const window of windows) if (i === window.leg && t >= window.start && t <= window.end) {
            assert(Math.abs(leg.footYaw - (t <= (i === 0 ? 3 : 3.85) ? 0 : Math.PI / 2)) < 1e-8, `support heading changed at ${t}`);
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
for (const t of [2.35, 2.8, 3, 3.7, 3.85, 4.55, 5.1, 5.64, 5.78, 6.35, 6.4]) {
    const a = pose(t - 1e-6), b = pose(t + 1e-6);
    assert(distance(a.root, b.root) < .001, `root discontinuity at ${t}`);
    for (let i = 0; i < 2; i++) assert(distance(a.legs[i].screenSole, b.legs[i].screenSole) < .001, `foot discontinuity at ${t}`);
}
assert(maxJoint < 1e-7 && maxContact < 1e-7 && maxProjection < 1e-7 && maxStep < 12 && maxNoseScratch < 1.3);
writeFileSync('qa/numeric-check.json', JSON.stringify({ samples: samples.length, maxJointError: maxJoint,
    maxHalfFrameKneeDisplacement: maxStep, poseSamples: samples }, null, 2));
writeFileSync('qa/contact-check.json', JSON.stringify({ maxPlantedFootError: maxContact, maxDrawnSoleProjectionError: maxProjection,
    contactWindows: windows, boundaryContinuity: 'PASS', noseContactMovementRadius: maxNoseScratch, pass: true }, null, 2));
console.log({ maxJoint, maxContact, maxProjection, maxStep, maxNoseScratch });
