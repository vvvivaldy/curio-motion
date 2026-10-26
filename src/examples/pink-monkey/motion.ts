import { mix, tween } from '../../core/time';
import { sampleStep } from '../../core/contacts';
import { solveTwoBone as joint } from '../../core/kinematics';
import { project, unproject, transformPoint, inverseTransformPoint, type Point2 as P, type Vec3 as V, type Frame2D } from '../../core/spatial';
import { approachX, groundY, boardingFeet, stairs, rideStarts } from './layout';
export { clamp, mix, smooth, tween } from '../../core/time';
export { project } from '../../core/spatial';
export { solveTwoBone as joint } from '../../core/kinematics';
export type { Point2 as P, Vec3 as V } from '../../core/spatial';

export const blinkAt = (t: number, at: number) => {
    const q = Math.abs(t - at);
    return q < .095 ? Math.pow(Math.cos(q / .095 * Math.PI / 2), 2) : 0;
};
export function pose(t: number) {
    const turn = tween(t, 2.8, 5.1), yaw = turn * Math.PI / 2, walk = 1 - tween(t, 2.35, 2.8), phase = t / .72 * Math.PI * 2;
    const sway = Math.sin(phase) * 6 * walk, bob = (1 - Math.cos(phase * 2)) * 1.7 * walk, lean = Math.sin(phase) * .014 * walk;
    const torso = (v: V): V => {
        const x = v[0], y = v[1] + 220;
        return [sway + x * Math.cos(lean) - y * Math.sin(lean), bob - 220 + x * Math.sin(lean) + y * Math.cos(lean), v[2]];
    };
    const scaleBody = mix(.82, 1, tween(t, 0, 2.8));
    const ride = Math.max(0, t - rideStarts) * 76;
    const platform: Frame2D = { origin: [ride, -ride * stairs.rise / stairs.run], scale: 1 };
    // One view transform for the world. Character yaw never changes the station.
    const camera: Frame2D = { origin: [-platform.origin[0], -platform.origin[1]], scale: 1 };
    const baseRoot: P = [approachX + 65 * tween(t, 5.1, 5.78) + 65 * tween(t, 5.64, 6.35),
        groundY + (stairs.origin[1] - groundY) * tween(t, 5.64, 6.35)];
    const worldRoot = transformPoint(baseRoot, platform), root = transformPoint(worldRoot, camera);
    const actor: Frame2D = { origin: worldRoot, scale: scaleBody };
    const gesture = tween(t, 7.75, 8.5) * (1 - tween(t, 9.65, 10.55));
    const scratch = (t >= 8.52 && t <= 9.5) ? 2 * Math.sin((t - 8.52) * Math.PI * 6) * Math.sin((t - 8.52) / .98 * Math.PI) : 0;
    const blink = Math.max(...[.78, 2.12, 4.67, 6.92, 9.84, 11.45].map(x => blinkAt(t, x)));
    const legs = [-1, 1].map((side, i) => {
        const p = phase + i * Math.PI, swing = Math.max(0, Math.sin(p)) * walk;
        let sole: P, planted: boolean, surface: string | null, footYaw = 0;
        if (t < 2.8) {
            sole = [approachX + side * 30, groundY - scaleBody * swing * 19];
            planted = swing < 1e-8; surface = planted ? 'floor' : null;
        } else if (t < 5.1) {
            const step = sampleStep(t, { start: i === 0 ? 3 : 3.85, end: i === 0 ? 3.7 : 4.55,
                from: [approachX + side * 30, groundY], to: [i === 0 ? 494 : 526, groundY], lift: 22,
                fromHeading: 0, toHeading: Math.PI / 2 });
            sole = step.position; footYaw = step.heading; planted = step.planted; surface = planted ? 'floor' : null;
        } else {
            const step = sampleStep(t, { start: i === 0 ? 5.1 : 5.64, end: i === 0 ? 5.78 : 6.35,
                from: [i === 0 ? 494 : 526, groundY], to: boardingFeet[i], lift: 40 });
            sole = step.position; footYaw = Math.PI / 2; planted = step.planted;
            surface = planted ? step.progress === 1 ? 'tread-0' : 'floor' : null;
        }
        const worldSole = transformPoint(sole, platform), screenSole = transformPoint(worldSole, camera);
        const localSole = inverseTransformPoint(worldSole, actor);
        localSole[1] -= 13;
        const depth = t < 2.8 ? Math.cos(p) * 18 * walk : -side * 17 * turn;
        const ankle = unproject(localSole, yaw, depth);
        const hip: V = torso([side * 22, -145, 0]);
        const knee = joint(hip, ankle, 70, 72, [side * .4, 0, 1]);
        return { side, hip, knee, ankle, swing, footYaw, planted, surface, sole, worldSole, screenSole, soleY: screenSole[1] };
    });
    const arms = [-1, 1].map((side, i) => {
        const sh: V = torso([side * 45, -282, side < 0 ? 9 : -7]);
        const swing = Math.cos(phase + i * Math.PI) * 18 * walk;
        const rest: V = torso([side * 65 + Math.cos(phase + i * Math.PI) * 10 * walk, -88 + Math.cos(phase + i * Math.PI) * 10 * walk, 18 - swing]);
        let hand: V = rest;
        if (side < 0)
            hand = [mix(rest[0], -12, gesture), mix(rest[1], -319 + scratch, gesture), mix(rest[2], 70, gesture)];
        const elbow = joint(sh, hand, 107, 108, [mix(side * .4, side * .15, side < 0 ? gesture : 0), side < 0 ? gesture : 0, -(1 - (side < 0 ? gesture : 0))]);
        return { side, sh, elbow, hand };
    });
    return { t, turn, yaw, walk, phase, scale: scaleBody, root, gesture, scratch, blink, legs, arms, sway, bob, lean, wallTravel: Math.max(0, t - 6.4) * 76, gazeUp: tween(t, 7.05, 7.5) * (1 - tween(t, 9.6, 10.2)), camera, platform, worldRoot, bagSwing: walk * Math.sin(phase - .5) * .035 + (t > 2.8 && t < 6.9 ? Math.sin((t - 2.8) * 5) * Math.exp(-(t - 2.8)) * .025 : 0) };
}
export type Pose = ReturnType<typeof pose>;
