import { clamp, mix, tween } from '../../core/time';
// Preserve the example's existing numeric exports for readers and callers.
export { clamp, mix, smooth, tween } from '../../core/time';

export type P = [
    number,
    number
];
export type V = [
    number,
    number,
    number
];
const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], scale = (a: V, s: number): V => a.map(v => v * s) as V, dot = (a: V, b: V) => a.reduce((s, v, i) => s + v * b[i], 0), norm = (v: V) => Math.sqrt(dot(v, v));
export function joint(a: V, b: V, l1: number, l2: number, pole: V): V {
    const d = sub(b, a), dist = norm(d);
    if (dist > l1 + l2 + .001)
        throw Error('unreachable ' + dist);
    const u = scale(d, 1 / dist), p = sub(pole, scale(u, dot(pole, u))), v = scale(p, 1 / norm(p)), along = (l1 * l1 - l2 * l2 + dist * dist) / (2 * dist), height = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    return add(a, add(scale(u, along), scale(v, height)));
}
export function project(v: V, yaw: number): P {
    return [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1] + v[2] * Math.cos(yaw) * .08];
}
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
    const boarding = tween(t, 5.1, 6.4);
    const root: P = [t < 5.1 ? 640 - 130 * turn : 510 + 65 * tween(t, 5.1, 5.78) + 65 * tween(t, 5.64, 6.35), 650 - 30 * tween(t, 5.64, 6.35)];
    const gesture = tween(t, 7.75, 8.5) * (1 - tween(t, 9.65, 10.55));
    const scratch = (t >= 8.52 && t <= 9.5) ? 2 * Math.sin((t - 8.52) * Math.PI * 6) * Math.sin((t - 8.52) / .98 * Math.PI) : 0;
    const blink = Math.max(...[.78, 2.12, 4.67, 6.92, 9.84, 11.45].map(x => blinkAt(t, x)));
    const legs = [-1, 1].map((side, i) => {
        const p = phase + i * Math.PI, swing = Math.max(0, Math.sin(p)) * walk;
        let ankle: V = [side * 30 / scaleBody, -13, Math.cos(p) * 18 * walk + side * 16 * turn];
        // Boarding feet follow two explicit lift/plant arcs, then remain fixed on one horizontal tread.
        const a = i === 0 ? 5.1 : 5.64, b = i === 0 ? 5.78 : 6.35, u = tween(t, a, b);
        const lift = t >= a && t <= b ? Math.sin(clamp((t - a) / (b - a)) * Math.PI) * 40 : 0;
        if (t >= 5.1) {
            const footWorldY = mix(650, 620, u) - lift;
            ankle = [side * 17, footWorldY - root[1] - 13, (i === 0 ? 494 : 526) + 130 * u - root[0]];
        }
        else
            ankle[1] -= swing * 19 + ankle[2] * Math.cos(yaw) * .08;
        const hip: V = torso([side * 22, -145, 0]);
        const knee = joint(hip, ankle, 70, 72, [side * .4, 0, 1]);
        return { side, hip, knee, ankle, swing, planted: t >= 6.4, soleY: root[1] + ankle[1] + 13 };
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
    return { t, turn, yaw, walk, phase, scale: scaleBody, root, gesture, scratch, blink, legs, arms, sway, bob, lean, wallTravel: Math.max(0, t - 6.4) * 76, gazeUp: tween(t, 7.05, 7.5) * (1 - tween(t, 9.6, 10.2)), bagSwing: walk * Math.sin(phase - .5) * .035 + (t > 2.8 && t < 6.9 ? Math.sin((t - 2.8) * 5) * Math.exp(-(t - 2.8)) * .025 : 0) };
}
export type Pose = ReturnType<typeof pose>;
