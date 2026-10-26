import { Graphics } from 'pixi.js';
import { P, Pose, project, clamp } from './motion';
import { eyeShape } from '../../core/eye';
import { faceFeatures } from './face';
import { characterModel } from './model';
import { footShape } from './feet';
import { mapContour, contourAnchor, type CubicContour } from '../../core/contour';
const INK = 0x3d2930, SKIN = 0xe9959a, LIGHT = 0xf3b5a8, SHADE = 0xd57986, BAG = 0xcdb48e;
class Pen {
    constructor(public g: Graphics) {
    }
    path(s: (g: Graphics) => void, fill: number, width = 2.6) {
        s(this.g);
        this.g.fill(fill).stroke({ color: INK, width, join: 'round', cap: 'round' });
    }
    contour(shape: CubicContour, fill: number, width = 2.6) {
        this.path(g => { g.moveTo(...shape.start); for (const c of shape.curves) g.bezierCurveTo(...c.c1, ...c.c2, ...c.to); g.closePath(); }, fill, width);
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
    const [x, y] = ankle, shape = footShape(side, yaw);
    p.g.save().translateTransform(-x, -y).rotateTransform(roll).translateTransform(x, y);
    p.contour(mapContour(shape.contour, v => [v[0]+x,v[1]+y]), LIGHT);
    for(const c of shape.creases) p.line(g=>g.moveTo(c[0][0]+x,c[0][1]+y)
        .quadraticCurveTo(c[1][0]+x,c[1][1]+y,c[2][0]+x,c[2][1]+y), INK, 1.5);
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
function head(p: Pen, q: Pose, model: ReturnType<typeof characterModel>) {
    const s = Math.sin(q.yaw), c = Math.cos(q.yaw), face = faceFeatures(q.yaw), [cx, cy] = face.center;
    const ear = (center: P, radius: P) => {
        const [x,y] = [cx + center[0], cy + center[1]], [rx,ry] = radius;
        if (rx < .05) return;
        p.ellipse(x, y, rx, ry, SKIN);
        p.path(g => g.moveTo(x + rx*.72,y + ry*.28)
            .bezierCurveTo(x + rx*.85,y - ry*.78,x - rx*.86,y - ry*.96,x - rx*.76,y + ry*.05)
            .bezierCurveTo(x - rx*.68,y + ry*.72,x + rx*.3,y + ry*.91,x + rx*.72,y + ry*.28).closePath(), LIGHT, 0);
        p.line(g => g.moveTo(x + rx*.6,y + ry*.1)
            .bezierCurveTo(x + rx*.05,y - ry*.24,x - rx*.32,y + ry*.04,x - rx*.08,y + ry*.36)
            .quadraticCurveTo(x + rx*.1,y + ry*.57,x + rx*.4,y + ry*.48), 0xbb6f77, 1.8);
    };
    ear(model.farEar.center, model.farEar.radius);
    const headShape = mapContour(model.head, v => [v[0]+cx,v[1]+cy]);
    p.contour(headShape, SKIN);
    // A lower rim follows the same jaw curves, rather than an ellipse outside the head.
    const rim = headShape.curves.slice(2,6);
    p.g.moveTo(...headShape.curves[1].to);
    for (const curve of rim) p.g.bezierCurveTo(...curve.c1,...curve.c2,...curve.to);
    p.g.bezierCurveTo(cx-28,cy+70,cx+59,cy+74,...headShape.curves[1].to).closePath().fill({color:SHADE,alpha:.28});
    // The front ear root shares the rear-jaw curve; the profile exposes its complete cup.
    const nearEar=mapContour(model.nearEar.contour,v=>[v[0]+cx,v[1]+cy]);
    p.contour(nearEar,SKIN);
    const [ex,ey]=model.nearEar.center;
    p.contour(mapContour(model.nearEar.contour,v=>[cx+ex+(v[0]-ex)*.77,cy+ey+5+(v[1]-ey)*.74]),LIGHT,0);
    const foldX=cx+ex,foldY=cy+ey;
    p.line(g=>g.moveTo(foldX+12,foldY+8).bezierCurveTo(foldX-14,foldY-8,foldX-22,foldY+15,foldX-8,foldY+24)
        .quadraticCurveTo(foldX+1,foldY+31,foldX+12,foldY+26),0xbb6f77,1.8);
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
    const farEyeX = 34*c + 58*s, temple = contourAnchor(model.head,'temple',.5)[0]-3;
    drawEye(cx + farEyeX, Math.min(24*clamp((c-.25)/.5),Math.max(0,temple-farEyeX)));
    drawEye(cx - 34 * c + 47 * s, 24 - 3 * s);
    const mx = cx + 49 * s, my = cy + 49;
    p.contour(mapContour(model.muzzle, v => [v[0]+cx,v[1]+cy]), LIGHT, 1.5);
    const [nx, ny] = face.nose;
    p.path(g => g.moveTo(nx - 16, ny - 3).bezierCurveTo(nx - 18, ny - 17, nx + 15, ny - 17, ...face.noseFront[0]).quadraticCurveTo(...face.noseFront[1], ...face.noseFront[2]).quadraticCurveTo(nx - 2, ny + 13, nx - 7, ny + 5).quadraticCurveTo(nx - 16, ny + 4, nx - 16, ny - 3).closePath(), 0x9c5868, 2);
    p.g.ellipse(nx - 5, ny + 1, 3.5, 2).fill(INK);
    p.g.ellipse(nx + 8, ny, 3, 2).fill(INK);
    p.line(g => g.moveTo(mx - 25 + 15*s, my + 8).bezierCurveTo(mx - 5, my + 19, mx + 22, my + 20, mx + 36, my + 10), INK, 2);
    p.line(g => g.moveTo(mx + 35, my + 8).quadraticCurveTo(mx + 41, my + 10, mx + 40, my + 15), 0xb87979, 1.6);
    p.line(g => g.moveTo(cx - 42, cy - 62).quadraticCurveTo(cx - 28, cy - 75, cx - 10, cy - 68), 0xc67c80, 1.4);
    return [nx, ny] as P;
}
export function drawMonkey(g: Graphics, q: Pose) {
    const model = characterModel(q.yaw);
    const p = new Pen(g), proj = (v: [
        number,
        number,
        number
    ]) => project(v, q.yaw), s = Math.sin(q.yaw);
    g.clear();
    const bodyTransform = () => g.save().translateTransform(0, 220).rotateTransform(q.lean).translateTransform(q.sway, q.bob - 220);
    bodyTransform();
    // Tail: broad rounded ribbon, not a rigid rotated sprite.
    const [tx,ty] = model.tailRoot, sw = q.tailSwing;
    p.path(g => g.moveTo(tx, ty).bezierCurveTo(-98, ty+26,-132,-164,-127,-213+sw)
        .bezierCurveTo(-114,-267+sw,-172,-273+sw,-169,-232+sw)
        .bezierCurveTo(-169,-220+sw,-155,-220+sw,-155,-232+sw)
        .bezierCurveTo(-154,-254+sw,-133,-250+sw,-141,-215+sw)
        .bezierCurveTo(-158,-147,-88,-111,tx+6,ty+12).closePath(), SHADE);
    // Soft bag and knot, attached to the shoulder with an actual continuous strap.
    const bx = -57 - 28 * s, by = -245 + q.bagSwing * 90;
    const bag = model.bag;
    p.contour(mapContour(bag, v => [v[0]+bx,v[1]+by]), BAG);
    p.g.moveTo(bx-51,by+19).bezierCurveTo(bx-42,by+69,bx+8,by+74,bx+34,by+33)
        .bezierCurveTo(bx+35,by+77,bx-22,by+86,bx-44,by+48).closePath().fill({color:0xa88b66,alpha:.3});
    p.line(z => z.moveTo(bx - 10, by - 45).quadraticCurveTo(bx - 21, by - 12, bx - 25, by + 5), 0x8e7357, 2);
    p.line(z => z.moveTo(bx+4,by-44).quadraticCurveTo(bx+19,by-8,bx+18,by+12),0x8e7357,1.5);
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
    const bodyx = 8*s;
    p.contour(model.torso, SKIN);
    p.contour(model.belly, LIGHT, 0);
    p.line(z => z.moveTo(bodyx + 13, -159).quadraticCurveTo(bodyx + 6, -153, bodyx + 12, -150), 0xb87578, 1.6);
    p.path(z => z.moveTo(29, -291).bezierCurveTo(42, -288, 43, -277, 33, -263).bezierCurveTo(11, -222, -20, -188, -48, -174).lineTo(-55, -190).bezierCurveTo(-22, -215, 2, -246, 20, -282).closePath(), 0xdac5a5, 2.3);
    head(p, q, model);
    g.restore();
    const ar = q.arms[0];
    limb(p, proj(ar.sh), proj(ar.elbow), proj(ar.hand), 20, 14, 11, SKIN);
    hand(p, ar.drawing);
}
