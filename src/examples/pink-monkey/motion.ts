import { clamp, mix, tween } from '../../core/time';
import { supportBalance } from '../../core/gait';
import { solveTwoBone as joint, fitVerticalShift } from '../../core/kinematics';
import { project, unproject, transformPoint, inverseTransformPoint, placeOnPivot, type Point2 as P, type Vec3 as V, type Frame2D } from '../../core/spatial';
import { approachX, groundY, stairs, rideStarts } from './layout';
import { approachStartY, approachGroundAt, sampleFeet, boardingSteps } from './steps';
import { handShape } from './hands';
import { faceFeatures } from './face';
import { gestureAt } from './gesture';
import { mapContour, quadraticPoint } from '../../core/contour';
import { localPoint, attachAnchor, segmentFrame, type LocalFrame2D } from '../../core/spatial';
export { clamp, mix, smooth, tween } from '../../core/time';
export { project } from '../../core/spatial';
export { solveTwoBone as joint } from '../../core/kinematics';
export type { Point2 as P, Vec3 as V } from '../../core/spatial';

export const blinkAt = (t: number, at: number) => {
    const q = Math.abs(t - at);
    return q < .095 ? Math.pow(Math.cos(q / .095 * Math.PI / 2), 2) : 0;
};
export function pose(t: number) {
    const turn = tween(t, 3.1, 5.1), yaw = turn * Math.PI / 2, walk = 1 - tween(t, 2.35, 2.8);
    const feet = sampleFeet(t), balance = supportBalance(feet);
    const midpoint = (feet[0].ground[0] + feet[1].ground[0]) / 2;
    const weightShift = Math.max(-20, Math.min(20, (balance.center[0] - midpoint) * .72));
    const approachGroundY = approachGroundAt(t);
    // Body scale and ground travel describe the same approach; stance contacts do not grow with it.
    const scaleBody = mix(.82, 1, clamp((approachGroundY - approachStartY) / (groundY - approachStartY)));
    const passing = Math.max(...feet.map(f => f.height / 40));
    const sway = 0;
    let bob = Math.max(...feet.map(f => f.compression)) * 4 - passing * 2;
    const lean = -weightShift / scaleBody * .0006 * (1 - tween(t, 2.7, 2.8));
    const torso = (v: V): V => {
        const x = v[0], y = v[1] + 220;
        return [sway + x * Math.cos(lean) - y * Math.sin(lean), bob - 220 + x * Math.sin(lean) + y * Math.cos(lean), v[2]];
    };
    const ride = Math.max(0, t - rideStarts) * 76;
    const platform: Frame2D = { origin: [ride, -ride * stairs.rise / stairs.run], scale: 1 };
    // One view transform for the world. Character yaw never changes the station.
    const camera: Frame2D = { origin: [-platform.origin[0], -platform.origin[1]], scale: 1 };
    const boarding = boardingSteps.map(s => tween(t, s.start, s.end));
    const baseRoot: P = [approachX + weightShift + 65 * boarding[0] + 65 * boarding[1],
        approachGroundY + (stairs.origin[1] - groundY) * boarding[1]];
    const worldRoot = transformPoint(baseRoot, platform), root = transformPoint(worldRoot, camera);
    const actor: Frame2D = { origin: worldRoot, scale: scaleBody };
    const handGesture = gestureAt(t);
    const blink = Math.max(...[.78, 2.12, 4.67, 6.92, 9.84, 11.45].map(x => blinkAt(t, x)));
    const targets = [-1, 1].map((side, i) => {
        const state = feet[i], sole = state.position, planted = state.planted, footYaw = state.heading;
        const surface = planted ? state.index === 3 && state.progress === 1 ? 'tread-0' : 'floor' : null;
        const worldSole = transformPoint(sole, platform), screenSole = transformPoint(worldSole, camera);
        const localSole = inverseTransformPoint(worldSole, actor);
        const roll = state.roll * (1 - tween(t, 2.8, 2.88));
        const footRoll = side * roll * (roll > 0 ? .2 : .12);
        const footPivot: P = [footRoll === 0 ? 0 : roll > 0 ? side * 42 : -side * 18, 13];
        const placement = placeOnPivot(localSole, [0, 13], footPivot, footRoll);
        const depth = t < 2.8 ? (state.ground[1] - approachGroundY) / scaleBody * 1.1 : -side * 17 * turn;
        const ankle = unproject(placement.origin, yaw, depth);
        return { side, ankle, swing: state.height, footYaw, footRoll, footPivot,
            contactPivot: transformPoint(transformPoint(placement.contact, actor), camera),
            planted, surface, sole, worldSole, screenSole, soleY: screenSole[1], load: balance.weights[i] };
    });
    // Keep a little knee bend while shifting onto separated supports. No stretched bones.
    bob += fitVerticalShift(targets.map(leg => ({ root: torso([leg.side * 22, -145, 0]), target: leg.ankle, reach: 138 })));
    const legs = targets.map(leg => {
        const hip = torso([leg.side * 22, -145, 0]);
        return { ...leg, hip, knee: joint(hip, leg.ankle, 70, 72, [leg.side * .4, 0, 1]) };
    });
    const bodyFrame: LocalFrame2D = { origin: [sway - 220 * Math.sin(lean), bob - 220 + 220 * Math.cos(lean)], angle: lean, scale: 1 };
    const face = faceFeatures(yaw);
    const noseContact = localPoint(quadraticPoint(...face.noseFront, handGesture.surfaceParameter), bodyFrame);
    const neutralContact = localPoint(quadraticPoint(...face.noseFront, .3), bodyFrame);
    // Contralateral arms and soft attachments follow the actual footfalls, with a short authored lag.
    const strideAt = (time: number) => {
        const delayed = sampleFeet(time);
        return Math.max(-1, Math.min(1, (delayed[0].ground[1] - delayed[1].ground[1]) / 14));
    };
    const stride = strideAt(t - .08) * walk;
    const arms = [-1, 1].map(side => {
        const sh: V = torso([side * 45, -282, side < 0 ? 9 : -7]);
        const rest: V = torso([side * 65 + side * stride * 6, -88 - side * stride * 8, 18 + side * stride * 18]);
        const reach = side < 0 ? handGesture.reach : 0;
        const pole: V = [mix(side * .4, side * .15, reach), reach, -(1 - reach)];
        const shape = handShape(side < 0 ? handGesture.gather : 0, side < 0 ? handGesture.extension : 0);
        let frame: LocalFrame2D = { origin: project(rest, yaw), angle: 0, scale: 1 };
        let hand = rest, elbow = joint(sh, hand, 107, 108, pole);
        if (side < 0) {
            const goal = attachAnchor({ ...frame, angle: -2.6 }, shape.tip, neutralContact).origin;
            const free: P = frame.origin.map((v, i) => mix(v, goal[i], reach)) as P;
            const depth = mix(-rest[0] * Math.sin(yaw) + rest[2] * Math.cos(yaw), 12, reach);
            hand = unproject(free, yaw, depth);
            elbow = joint(sh, hand, 107, 108, pole);
            const forearm = segmentFrame(project(elbow, yaw), free, -2.6 * handGesture.orient);
            frame = { origin: free, angle: mix(0, mix(forearm.angle, -2.6, handGesture.extension * .7), handGesture.orient), scale: 1 };
            const attached = attachAnchor(frame, shape.tip, noseContact);
            frame = { ...frame, origin: frame.origin.map((v, i) => mix(v, attached.origin[i], handGesture.contact)) as P };
            hand = unproject(frame.origin, yaw, depth);
            elbow = joint(sh, hand, 107, 108, pole);
        }
        const forearm = segmentFrame(project(elbow, yaw), project(hand, yaw), frame.angle);
        const drawing = { contour: mapContour(shape.contour, p => localPoint(p, frame)),
            creases: shape.creases.map(c => c.map(p => localPoint(p, frame)) as [P, P, P]) };
        return { side, sh, elbow, hand, frame, drawing, tip: localPoint(shape.tip, frame), wristBend: frame.angle - forearm.angle };
    });
    return { t, turn, yaw, walk, scale: scaleBody, root, handGesture, noseContact, blink, legs, arms, sway, bob, lean,
        balance, weightShift, approachGroundY, tailSwing: strideAt(t - .14) * walk * 5,
        wallTravel: Math.max(0, t - 6.4) * 76, gazeUp: tween(t, 7.05, 7.5) * (1 - tween(t, 9.6, 10.2)), camera, platform, worldRoot,
        bagSwing: strideAt(t - .14) * walk * .025 + (t > 2.8 && t < 6.9 ? Math.sin((t - 2.8) * 5) * Math.exp(-(t - 2.8)) * .025 : 0) };
}
export type Pose = ReturnType<typeof pose>;
