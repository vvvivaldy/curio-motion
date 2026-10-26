import { Graphics } from 'pixi.js';
import { P, Pose, project, clamp } from './motion';
import { eyeShape } from '../../core/eye';
import { faceFeatures } from './face';
const INK = 0x3d2930, SKIN = 0xe9959a, LIGHT = 0xf3b5a8, SHADE = 0xd57986, BAG = 0xcdb48e;
class Pen {
    constructor(public g: Graphics) {
    }
    path(s: (g: Graphics) => void, fill: number, width = 2.6) {
        s(this.g);
        this.g.fill(fill).stroke({ color: INK, width, join: 'round', cap: 'round' });
    }
    line(s: (g: Graphics) => void, color = INK, width = 2) {
        s(this.g);
        this.g.stroke({ color, width, cap: 'round', join: 'round' });
    }
    ellipse(x: number, y: number, rx: number, ry: number, c: number, w = 2.6) {
        this.g.ellipse(x, y, rx, ry).fill(c);
        if (w)
            this.g.stroke({ color: INK, width: w });
    }
}
// One continuous soft silhouette is rebuilt around shoulder/elbow/wrist or hip/knee/ankle.
function limb(p: Pen, a: P, k: P, b: P, r1: number, r2: number, r3: number, c: number) {
    const n = (u: P, v: P, r: number): P => {
        let dx = v[0] - u[0], dy = v[1] - u[1], l = Math.hypot(dx, dy);
        return [-dy / l * r, dx / l * r];
    };
    const na = n(a, k, r1), nb = n(a, b, r2), nc = n(k, b, r3);
    const L: P = [a[0] + na[0], a[1] + na[1]], K: P = [k[0] + nb[0], k[1] + nb[1]], B: P = [b[0] + nc[0], b[1] + nc[1]], BR: P = [b[0] - nc[0], b[1] - nc[1]], KR: P = [k[0] - nb[0], k[1] - nb[1]], AR: P = [a[0] - na[0], a[1] - na[1]];
    const tang: P = [(B[0] - L[0]) / 6, (B[1] - L[1]) / 6], tr: P = [(AR[0] - BR[0]) / 6, (AR[1] - BR[1]) / 6];
    let dx = k[0] - a[0], dy = k[1] - a[1], len = Math.hypot(dx, dy);
    p.path(g => g.moveTo(...L).bezierCurveTo(L[0] + (K[0] - L[0]) * .5, L[1] + (K[1] - L[1]) * .5, K[0] - tang[0], K[1] - tang[1], ...K).bezierCurveTo(K[0] + tang[0], K[1] + tang[1], B[0], B[1] - 7, ...B).quadraticCurveTo(b[0] + dy / len * r3, b[1] + r3, ...BR).bezierCurveTo(BR[0], BR[1] - 7, KR[0] - tr[0], KR[1] - tr[1], ...KR).bezierCurveTo(KR[0] + tr[0], KR[1] + tr[1], AR[0], AR[1], ...AR).quadraticCurveTo(a[0] - dx / len * r1, a[1] - dy / len * r1, ...L).closePath(), c);
}
function foot(p: Pen, ankle: P, side: number, yaw: number, roll: number) {
    const [x, y] = ankle, s = Math.sin(yaw), dir = side * (1 - s) + s;
    p.g.save().translateTransform(-x, -y).rotateTransform(roll).translateTransform(x, y);
    const tip = dir * 42, back = -dir * 18;
    p.path(g => g.moveTo(x - 11, y - 7).bezierCurveTo(x - 10, y + 1, x + back, y + 2, x + back, y + 9).bezierCurveTo(x + back, y + 13, x + tip * .7, y + 13, x + tip, y + 11).bezierCurveTo(x + tip + 5, y + 1, x + tip - 9, y - 1, x + 9, y - 5).lineTo(x + 9, y - 8).closePath(), LIGHT);
    p.line(g => g.moveTo(x + tip * .64, y + 4).quadraticCurveTo(x + tip * .88, y + 8, x + tip * .8, y + 15), INK, 1.6);
    p.line(g => g.moveTo(x + tip * .38, y + 6).quadraticCurveTo(x + tip * .61, y + 11, x + tip * .5, y + 17), INK, 1.5);
    p.g.restore();
}
// The pose supplies a local wrist frame, compatible contour and contact anchor.
function hand(p: Pen, drawing: Pose['arms'][number]['drawing']) {
    p.path(g => {
        g.moveTo(...drawing.contour.start);
        for (const c of drawing.contour.curves) g.bezierCurveTo(...c.c1, ...c.c2, ...c.to);
        g.closePath();
    }, SKIN);
    for (const c of drawing.creases) p.line(g => g.moveTo(...c[0]).quadraticCurveTo(...c[1], ...c[2]), INK, 1.5);
}
function head(p: Pen, q: Pose) {
    const s = Math.sin(q.yaw), c = Math.cos(q.yaw), face = faceFeatures(q.yaw), [cx, cy] = face.center;
    const ear = (x: number, y: number, rx: number, ry: number) => {
        p.ellipse(x, y, rx, ry, SKIN);
        p.ellipse(x, y + 5, rx * .75, ry * .74, 0xf1ae9d, 0);
        p.line(g => g.moveTo(x + rx * .45, y + 12).bezierCurveTo(x - rx * .4, y - rx * .35, x - rx * .55, y + ry * .65, x + rx * .25, y + ry * .55), 0xbb6f77, 2);
    };
    if (c > .1) {
        const k = Math.min(1, (c - .1) / .5);
        ear(cx + 94 * c + 45 * s, cy + 14, 37 * k, 51 * k);
    }
    p.path(g => g.moveTo(cx - 68, cy + 58).bezierCurveTo(cx - 106, cy + 35, cx - 103, cy - 43, cx - 65, cy - 75).bezierCurveTo(cx - 28, cy - 113, cx + 52, cy - 96, cx + 77, cy - 52).bezierCurveTo(cx + 99, cy - 13, cx + 90, cy + 41, cx + 57, cy + 67).bezierCurveTo(cx + 25, cy + 88, cx - 43, cy + 81, cx - 68, cy + 58).closePath(), SKIN);
    p.g.ellipse(cx - 8, cy + 47, 66, 31).fill({ color: SHADE, alpha: .35 });
    ear(cx - 94 * c - 48 * s, cy + 18, 37 + 7 * s, 52);
    const drawEye = (x: number, rx: number) => {
        const y = cy - 2, open = 1 - q.blink;
        if (rx <= 0) return;
        const eye = eyeShape({ center: [x, y], radius: [rx, 32], openness: open,
            pupil: { center: [x + 3 * s, y + 8 - q.gazeUp * 8], radius: [9.5, 13] } });
        const weight = Math.min(1, rx / 12);
        if (eye.aperture.length) p.g.poly(eye.aperture.flat()).fill(0xfff6d9).stroke({ color: INK, width: 2 * weight });
        if (eye.pupil.length) p.g.poly(eye.pupil.flat()).fill(0x251b1e);
        p.line(g => {
            g.moveTo(...eye.lid[0]);
            for (const point of eye.lid.slice(1)) g.lineTo(...point);
        }, INK, 2.4 * weight);
        p.line(g => g.moveTo(x - rx * .85, y - 43).quadraticCurveTo(x, y - 55 - q.gazeUp * 4, x + rx * .75, y - 46), INK, 3 * weight);
    };
    drawEye(cx + 34 * c + 73 * s, 24 * clamp((c - .12) / .4));
    drawEye(cx - 34 * c + 47 * s, 24 - 3 * s);
    const mx = cx + 48 * s, my = cy + 49;
    p.path(g => g.moveTo(mx - 49, my - 6).bezierCurveTo(mx - 48, my - 38, mx - 12, my - 38, mx + 11, my - 28).bezierCurveTo(mx + 42, my - 33, mx + 59, my - 14, mx + 49, my + 12).bezierCurveTo(mx + 28, my + 46, mx - 32, my + 40, mx - 48, my + 11).closePath(), LIGHT, 0);
    const [nx, ny] = face.nose;
    p.path(g => g.moveTo(nx - 16, ny - 3).bezierCurveTo(nx - 18, ny - 17, nx + 15, ny - 17, ...face.noseFront[0]).quadraticCurveTo(...face.noseFront[1], ...face.noseFront[2]).quadraticCurveTo(nx - 2, ny + 13, nx - 7, ny + 5).quadraticCurveTo(nx - 16, ny + 4, nx - 16, ny - 3).closePath(), 0x9c5868, 2);
    p.g.ellipse(nx - 5, ny + 1, 3.5, 2).fill(INK);
    p.g.ellipse(nx + 8, ny, 3, 2).fill(INK);
    p.line(g => g.moveTo(mx - 25, my + 8).bezierCurveTo(mx - 5, my + 25, mx + 24, my + 26, mx + 39, my + 12), INK, 2);
    p.line(g => g.moveTo(mx + 37, my + 9).quadraticCurveTo(mx + 43, my + 11, mx + 42, my + 17), 0xb87979, 1.6);
    p.line(g => g.moveTo(cx - 42, cy - 62).quadraticCurveTo(cx - 28, cy - 75, cx - 10, cy - 68), 0xc67c80, 1.4);
    return [nx, ny] as P;
}
export function drawMonkey(g: Graphics, q: Pose) {
    const p = new Pen(g), proj = (v: [
        number,
        number,
        number
    ]) => project(v, q.yaw), s = Math.sin(q.yaw);
    g.clear();
    const bodyTransform = () => g.save().translateTransform(0, 220).rotateTransform(q.lean).translateTransform(q.sway, q.bob - 220);
    bodyTransform();
    // Tail: broad rounded ribbon, not a rigid rotated sprite.
    const tx = -27 - 15 * s, ty = -147, sw = q.tailSwing;
    p.path(g => g.moveTo(tx, ty).bezierCurveTo(-100, ty + 35, -135, -160, -130, -218 + sw).bezierCurveTo(-121, -269 + sw, -175, -275 + sw, -171, -231 + sw).quadraticCurveTo(-169, -214 + sw, -158, -218 + sw).bezierCurveTo(-143, -233 + sw, -156, -242 + sw, -151, -246 + sw).bezierCurveTo(-139, -254 + sw, -136, -234 + sw, -143, -211 + sw).bezierCurveTo(-164, -127, -79, -93, tx + 10, ty + 17).closePath(), SHADE);
    // Soft bag and knot, attached to the shoulder with an actual continuous strap.
    const bx = -57 - 28 * s, by = -245 + q.bagSwing * 90;
    p.path(z => z.moveTo(bx - 8, by - 60).bezierCurveTo(bx - 30, by - 45, bx - 65, by + 32, bx - 37, by + 65).bezierCurveTo(bx + 6, by + 100, bx + 57, by + 59, bx + 38, by + 9).quadraticCurveTo(bx + 28, by - 41, bx + 8, by - 61).closePath(), BAG);
    g.ellipse(bx - 1, by + 43, 37, 25).fill({ color: 0xa88b66, alpha: .25 });
    p.line(z => z.moveTo(bx - 10, by - 45).quadraticCurveTo(bx - 21, by - 12, bx - 25, by + 5), 0x8e7357, 2);
    p.path(z => z.moveTo(bx - 8, by - 61).quadraticCurveTo(bx - 63, by - 91, bx - 58, by - 62).quadraticCurveTo(bx - 38, by - 43, bx - 8, by - 53).quadraticCurveTo(bx + 7, by - 91, bx + 19, by - 79).quadraticCurveTo(bx + 27, by - 63, bx + 8, by - 48).closePath(), 0xd9c5a7);
    p.ellipse(bx, by - 53, 16, 13, 0xb99e77);
    g.restore();
    const far = q.legs[1];
    limb(p, proj(far.hip), proj(far.knee), proj(far.ankle), 18, 15, 10, 0xd17e8b);
    foot(p, proj(far.ankle), 1, far.footYaw, far.footRoll);
    const fa = q.arms[1];
    limb(p, proj(fa.sh), proj(fa.elbow), proj(fa.hand), 19, 14, 11, SHADE);
    hand(p, fa.drawing);
    const near = q.legs[0];
    limb(p, proj(near.hip), proj(near.knee), proj(near.ankle), 18, 15, 10, SKIN);
    foot(p, proj(near.ankle), -1, near.footYaw, near.footRoll);
    p.line(z => {
        let k = proj(near.knee);
        return z.moveTo(k[0] - 5, k[1] - 2).quadraticCurveTo(k[0] + 3, k[1] + 3, k[0] + 7, k[1] - 1);
    }, 0xc5757e, 1.8);
    bodyTransform();
    const bodyx = 8 * s;
    p.path(z => z.moveTo(bodyx - 33, -297).bezierCurveTo(bodyx - 68, -284, bodyx - 67, -194, bodyx - 48, -154).bezierCurveTo(bodyx - 33, -116, bodyx + 42, -119, bodyx + 54, -155).bezierCurveTo(bodyx + 74, -210, bodyx + 48, -271, bodyx + 25, -292).lineTo(bodyx + 19, -322).lineTo(bodyx - 19, -323).closePath(), SKIN);
    g.ellipse(bodyx + 11 + 17 * s, -203, 48 - 9 * s, 68).fill(LIGHT);
    p.line(z => z.moveTo(bodyx + 13, -159).quadraticCurveTo(bodyx + 6, -153, bodyx + 12, -150), 0xb87578, 1.6);
    p.path(z => z.moveTo(29, -291).bezierCurveTo(42, -288, 43, -277, 33, -263).bezierCurveTo(11, -222, -20, -188, -48, -174).lineTo(-55, -190).bezierCurveTo(-22, -215, 2, -246, 20, -282).closePath(), 0xdac5a5, 2.3);
    head(p, q);
    g.restore();
    const ar = q.arms[0];
    limb(p, proj(ar.sh), proj(ar.elbow), proj(ar.hand), 20, 14, 11, SKIN);
    hand(p, ar.drawing);
}
