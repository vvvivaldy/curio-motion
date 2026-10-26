import assert from 'node:assert/strict';
import { pose, project } from '../src/examples/pink-monkey/motion';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('qa', { recursive: true });
let maxFoot = 0, maxJoint = 0, maxStep = 0, previous: ReturnType<typeof pose> | null = null;
const samples = [];
for (let n = 0; n <= 574; n++) {
    const t = n / 48, q = pose(t);
    for (const l of q.legs) {
        const len = (a: number[], b: number[]) => Math.hypot(...a.map((x, i) => x - b[i]));
        maxJoint = Math.max(maxJoint, Math.abs(len(l.hip, l.knee) - 70), Math.abs(len(l.knee, l.ankle) - 72));
        if (t >= 6.4) {
            maxFoot = Math.max(maxFoot, Math.abs(l.soleY - 620));
            const p = project(l.ankle, q.yaw);
            assert(p[0] + 640 - 18 >= 580 && p[0] + 640 + 42 <= 720);
        }
    }
    if (previous) {
        for (let i = 0; i < 2; i++)
            maxStep = Math.max(maxStep, Math.hypot(...project(q.legs[i].knee, q.yaw).map((v, j) => v - project(previous!.legs[i].knee, previous!.yaw)[j])));
    }
    previous = q;
    samples.push({ t, root: q.root, legs: q.legs.map(l => ({ ankle: project(l.ankle, q.yaw), knee: project(l.knee, q.yaw), soleY: l.soleY })), gesture: q.gesture, wallTravel: q.wallTravel });
}
assert(maxJoint < 1e-8);
assert(maxFoot < 1e-8);
assert(maxStep < 12);
writeFileSync('qa/numeric-check.json', JSON.stringify({ samples: samples.length, maxLegLengthError: maxJoint, maxStandingFootError: maxFoot, maxHalfFrameKneeDisplacement: maxStep, flightNotRequired: true, poseSamples: samples }, null, 2));
console.log({ maxJoint, maxFoot, maxStep });
let plantedMax = 0, approachMax = 0, maxArmLength = 0, maxNoseScratch = 0;
for (let n = 0; n <= 574; n++) {
    const t = n / 48, q = pose(t);
    for (const [i, l] of q.legs.entries()) {
        const p = project(l.ankle, q.yaw), x = q.root[0] + q.scale * p[0], y = q.root[1] + q.scale * (p[1] + 13);
        if (t < 2.35 && l.swing < 1e-8) {
            approachMax = Math.max(approachMax, Math.abs(y - 650), Math.abs(x - (640 + l.side * 30)));
        }
        if (t >= 5.1) {
            if (i === 1 && t <= 5.64)
                plantedMax = Math.max(plantedMax, Math.abs(x - 526), Math.abs(y - 650));
            if (i === 0 && t >= 5.78)
                plantedMax = Math.max(plantedMax, Math.abs(x - 624), Math.abs(y - 620));
            if (i === 1 && t >= 6.35)
                plantedMax = Math.max(plantedMax, Math.abs(x - 656), Math.abs(y - 620));
        }
    }
    for (const a of q.arms) {
        const d = (u: number[], v: number[]) => Math.hypot(...u.map((x, i) => x - v[i]));
        maxArmLength = Math.max(maxArmLength, Math.abs(d(a.sh, a.elbow) - 107), Math.abs(d(a.elbow, a.hand) - 108));
    }
    if (q.gesture > .999)
        maxNoseScratch = Math.max(maxNoseScratch, Math.hypot(q.scratch * .3, q.scratch * .55));
}
assert(approachMax < 1e-7 && plantedMax < 1e-7 && maxArmLength < 1e-7 && maxNoseScratch < 1.3);
writeFileSync('qa/contact-check.json', JSON.stringify({ approachStanceScreenError: approachMax, boardingPlantedScreenError: plantedMax, armLengthError: maxArmLength, noseContactMovementRadius: maxNoseScratch, standingStepBounds: [580, 720, 620], standingFeet: [624, 656], bodyFixedAfter: 6.4, graphicsContactRule: 'head() returns drawn nose anchor; hand outline endpoint follows that anchor plus scratch displacement', pass: true }, null, 2));
console.log({ approachMax, plantedMax, maxArmLength, maxNoseScratch });
