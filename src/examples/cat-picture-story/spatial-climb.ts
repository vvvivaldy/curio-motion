/** Authored climb request, transferred from independently checked math candidate.
 * Shares actual contact/hinge geometry with probe and story; visual acceptance pending. */
import type { Vec3 } from '../../core/spatial';
import type { Frame3 } from '../../core/frame3';
import { pitchedFrame, type SpatialCatRequest } from './spatial-model';
import { composeFrame3, pointInFrame3, unit3, sub3, add3, scale3, dot3, cross3 } from '../../core/frame3';
import { clamp, smooth, mix } from '../../core/time';
const E = (t: number, a: number, b: number) => smooth(clamp((t - a) / (b - a))), lerp = (a: Vec3, b: Vec3, u: number): Vec3 => a.map((v, i) => mix(v, b[i], u)) as Vec3;
function path(t: number, knots: readonly (readonly [number, Vec3])[]): Vec3 {
    if (!knots.length) throw new RangeError('Authored route required');
    if (t <= knots[0][0]) return [...knots[0][1]];
    for (let i = 1; i < knots.length; i++) {
        if (t <= knots[i][0]) {
            return lerp(knots[i - 1][1], knots[i][1], E(t, knots[i - 1][0], knots[i][0]));
        }
    }
    return [...knots.at(-1)![1]];
}
const rollFrame = (a: number): Frame3 => ({ origin: [0, 0, 0], x: [Math.cos(a), Math.sin(a), 0], y: [-Math.sin(a), Math.cos(a), 0], z: [0, 0, 1] });
// Closest directed normal plus an explicit bounded author swivel about the target axis.
// No sign choice from atan2 or previous frame, and no endpoint adjustment.
function plane(body: Frame3, root: Vec3, end: Vec3, reference: Vec3, swivel: number): Frame3 {
    const u = unit3(sub3(end, root)), base = unit3(sub3(reference, scale3(u, dot3(reference, u))));
    const x = add3(scale3(base, Math.cos(swivel)), scale3(cross3(u, base), Math.sin(swivel)));
    const y = unit3(sub3(body.y, scale3(x, dot3(body.y, x)))), z = cross3(x, y);
    if (dot3(x, reference) < .30)
        throw Error('Directed author normal exceeds its declared cone');
    return { origin: root, x, y, z };
}
export function spatialClimbState(t: number, parameters = { hipSwivel: .8, heldArmSwivel: .85, freeRoll: .4 }) {
    const lean = E(t, 2.12, 2.42), swap = E(t, 3.55, 3.80), settle = E(t, 4.50, 4.82);
    const pitch = .06 + .08 * lean * (1 - settle), roll = (-.4 * lean + .8 * swap) * (1 - settle), neckPitch = .75 * lean * (1 - settle);
    const seatY = 128 + 16 * Math.cos(.06) + 12 * Math.sin(.06);
    const hips: Vec3 = [95, mix(73, 130, E(t, .4, 1.3)) + 25 * lean + 13 * E(t, 2.57, 3.02) - (168 - seatY) * E(t, 4.60, 4.98), mix(-15, -31, E(t, .85, 1.3)) - 4 * lean - 25 * E(t, 2.57, 3.02) - 20 * E(t, 3.02, 3.30)];
    const body = composeFrame3(pitchedFrame(hips, Math.PI, pitch), rollFrame(roll));
    const left: Vec3 = t < 1.3 ? [62, hips[1] - 49, -10] : path(t, [[1.3, [62, 81, -10]], [1.55, [52, 142, -10]], [1.8, [52, 142, -70]], [2, [62, 128, -70]], [3.85, [62, 128, -70]], [4.05, [62, 145, -70]], [4.30, [62, 145, -115]], [4.50, [62, 128, -115]]]);
    let right: Vec3;
    if (t < 2.12)
        right = [128, hips[1] - 43, -10];
    else if (t < 2.42)
        right = [128, mix(hips[1] - 43, 145, E(t, 2.12, 2.42)), hips[2] + 21];
    else if (t < 3.30)
        right = [128, 145, hips[2] + 21];
    else
        right = path(t, [[3.30, [128, 145, -59]], [3.55, [128, 145, -115]], [3.80, [128, 128, -115]]]);
    const release = [E(t, 2.42, 2.57), E(t, 2, 2.12)];
    const rootArms = [0, 1].map(i => pointInFrame3(body, [i ? -27 : 27, 46, 0]));
    const rootLegs = [0, 1].map(i => pointInFrame3(body, [i ? -12 : 12, 0, 0]));
    const freeNormals: Vec3[] = [], hands: Vec3[] = [];
    for (const i of [0, 1]) {
        const freeFrame = composeFrame3({ ...body, origin: rootArms[i] }, rollFrame(i ? -parameters.freeRoll : parameters.freeRoll));
        const upper = -1, flex = .8, wrist = pointInFrame3(freeFrame, [0, -32 * Math.cos(upper) - 29 * Math.cos(upper + flex), 32 * Math.sin(upper) + 29 * Math.sin(upper + flex)]);
        const free: Vec3 = [wrist[0], wrist[1] - 7.5, wrist[2] - 9];
        hands.push(lerp([i ? 150 : 40, 128, -55], free, release[i]));
        freeNormals.push(freeFrame.x);
    }
    const arms = hands.map((contact, i) => {
        const reference = unit3(lerp(body.x, freeNormals[i], release[i]));
        return plane(body, rootArms[i], add3(contact, [0, 7.5, 9]), reference, (i ? -1 : 1) * parameters.heldArmSwivel * (1 - release[i]));
    }) as [
        Frame3,
        Frame3
    ];
    const feet: [
        Vec3,
        Vec3
    ] = [left, right], legs = feet.map((contact, i) => plane(body, rootLegs[i], add3(contact, [0, 8, 0]), body.x, (i ? 1 : -1) * parameters.hipSwivel)) as [
        Frame3,
        Frame3
    ];
    const request: SpatialCatRequest = { body, headYaw: 0, neckPitch, headPitch: -.45 * lean * (1 - settle), feet, hands: hands as [
            Vec3,
            Vec3
        ], shoulderYaw: [0, 0], hipYaw: [0, 0], shoulderRoll: [0, 0], footYaw: [Math.PI, Math.PI], handWristLocal: [[0, 7.5, -9], [0, 7.5, -9]], jointFrames: { arms, legs } };
    return { request, controls: { pitch, roll, neckPitch, release, parameters } };
}
