import { Graphics } from 'pixi.js';
import type { Pose } from './motion';
import { inverseTransformPoint, transformPoint } from '../../core/spatial';
import { treadPoint } from '../../core/contacts';
import { stairSolid, stairPanel } from '../../core/stair-solid';
import { stairs, floorHorizon } from './layout';
const alphabet: Record<string, string> = { A: '01110/10001/10001/11111/10001/10001/10001', B: '11110/10001/10001/11110/10001/10001/11110', C: '01111/10000/10000/10000/10000/10000/01111', D: '11110/10001/10001/10001/10001/10001/11110', E: '11111/10000/10000/11110/10000/10000/11111', F: '11111/10000/10000/11110/10000/10000/10000', G: '01111/10000/10000/10111/10001/10001/01111', H: '10001/10001/10001/11111/10001/10001/10001', I: '111/010/010/010/010/010/111', K: '10001/10010/10100/11000/10100/10010/10001', L: '10000/10000/10000/10000/10000/10000/11111', M: '10001/11011/10101/10101/10001/10001/10001', N: '10001/11001/10101/10011/10001/10001/10001', O: '01110/10001/10001/10001/10001/10001/10001/01110', P: '11110/10001/10001/11110/10000/10000/10000', R: '11110/10001/10001/11110/10100/10010/10001', S: '01111/10000/10000/01110/00001/00001/11110', T: '11111/00100/00100/00100/00100/00100/00100', U: '10001/10001/10001/10001/10001/10001/01110', V: '10001/10001/10001/10001/10001/01010/00100', X: '10001/10001/01010/00100/01010/10001/10001', Y: '10001/10001/01010/00100/00100/00100/00100' };
function letters(g: Graphics, text: string, x: number, y: number, size: number, color: number) {
    let dx = x;
    for (const c of text) {
        const rows = (alphabet[c] ?? '000/000/000/000/000/000/000').split('/');
        rows.forEach((r, j) => [...r].forEach((v, i) => {
            if (v === '1')
                g.roundRect(dx + i * size, y + j * size, size * .94, size * .94, size * .13).fill(color);
        }));
        dx += (Math.max(...rows.map(r => r.length)) + 1) * size;
    }
}
function poster(g: Graphics, x: number, y: number, kind: number) {
    const c = [0xf2ce65, 0x9fc9ba, 0xd1b3d4][kind % 3];
    g.roundRect(x, y, 300, 180, 12).fill(0x384c53);
    g.roundRect(x + 6, y + 6, 288, 168, 9).fill(c);
    letters(g, ['TAKE IT EASY', 'BANANAS', 'NAP EXPRESS'][kind % 3], x + 22, y + 22, 3, 0x34434a);
    if (kind % 3 === 1) {
        g.moveTo(x + 70, y + 70).bezierCurveTo(x + 90, y + 160, x + 220, y + 160, x + 244, y + 61).bezierCurveTo(x + 180, y + 124, x + 100, y + 119, x + 70, y + 70).closePath().fill(0xffe59a).stroke({ color: 0x78603b, width: 3 });
        letters(g, 'NEXT LEVEL', x + 38, y + 141, 2, 0x34434a);
    }
    else if (kind % 3 === 0) {
        g.ellipse(x + 150, y + 110, 66, 37).fill(0xfff0b9).stroke({ color: 0x9a7c45, width: 2 });
        g.moveTo(x + 112, y + 102).quadraticCurveTo(x + 124, y + 111, x + 136, y + 102).moveTo(x + 163, y + 102).quadraticCurveTo(x + 175, y + 111, x + 187, y + 102).stroke({ color: 0x665340, width: 3 });
        g.moveTo(x + 137, y + 123).quadraticCurveTo(x + 151, y + 133, x + 166, y + 123).stroke({ color: 0x665340, width: 3 });
    }
    else {
        g.roundRect(x + 86, y + 77, 130, 65, 20).fill(0xf4e3e4).stroke({ color: 0x826986, width: 2 });
        g.moveTo(x + 101, y + 91).quadraticCurveTo(x + 148, y + 116, x + 199, y + 89).stroke({ color: 0xd4b3c5, width: 3 });
        letters(g, 'ZZZ', x + 215, y + 65, 2, 0x806884);
    }
}
export function drawEnvironment(g: Graphics, front: Graphics, q: Pose) {
    g.clear(); front.clear();
    for (const layer of [g, front]) {
        layer.position.set(...q.camera.origin);
        layer.scale.set(q.camera.scale);
    }
    const [left, topEdge] = inverseTransformPoint([0, 0], q.camera);
    const [right, bottom] = inverseTransformPoint([1280, 720], q.camera);
    const width = right - left;
    g.rect(left, topEdge, width, bottom - topEdge).fill(0xe7e1d2);
    // Wall panels and their attached signs share one world/view transform.
    for (let i = Math.floor(left / 160) - 1; i <= Math.ceil(right / 160); i++) {
        const x = i * 160;
        g.rect(x, topEdge, 158, bottom - topEdge).fill(i % 2 ? 0xd9d9c9 : 0xdedecd);
        g.moveTo(x, topEdge).lineTo(x, bottom).stroke({ color: 0xc6cbbc, width: 2 });
    }
    for (let j = Math.floor(topEdge / 112); j <= Math.ceil(bottom / 112); j++)
        g.moveTo(left, j * 112).lineTo(right, j * 112).stroke({ color: 0xc8cbbb, width: 2 });
    // A fixed station frieze, not screen-locked chrome.
    g.rect(left, 0, width, 55).fill(0x4d6868);
    g.rect(left, 55, width, 12).fill(0x9aa99a);
    for (let i = -2; i < 8; i++) {
        const x = i * 390, y = 95;
        g.roundRect(x, y, 180, 14, 7).fill(0xfff5cb);
        g.roundRect(x - 4, y - 5, 188, 24, 8).stroke({ color: 0x6f8580, width: 3 });
    }
    for (let i = -1; i < 6; i++) poster(g, 120 + i * 480, 145, (i + 6) % 3);
    g.rect(left, floorHorizon, width, Math.max(1, bottom - floorHorizon + 1000)).fill(0xb6b9aa);
    g.moveTo(left, floorHorizon).lineTo(right, floorHorizon).stroke({ color: 0x6c7e78, width: 3 });
    for (let x = -1800; x < 3200; x += 150)
        g.moveTo(x, 1000).lineTo(640, floorHorizon).stroke({ color: 0x969e93, width: 1 });
    const [enter, top] = stairs.origin, { run: w, rise } = stairs;
    const depth: [number, number] = [-48, -28];
    const poly = (layer: Graphics, points: [number,number][], fill: number, stroke = 0x485d5c) =>
        layer.poly(points.flat()).fill(fill).stroke({color:stroke,width:2,join:'round'});
    // A closed rear balustrade: posts stop at the panel, and wall/signs cannot show through it.
    const rear = stairPanel(stairs, 0, 9, depth, 182);
    poly(g, rear, 0x8fa79c);
    const railA = rear[3], railB = rear[2];
    g.moveTo(...railA).lineTo(...railB).stroke({color:0x354e50,width:14,cap:'round'});
    g.moveTo(railA[0],railA[1]-4).lineTo(railB[0],railB[1]-4).stroke({color:0xb9c7b5,width:3});
    for (let i=1;i<9;i++) {
        const [x,y] = treadPoint(stairs,i);
        g.moveTo(x+depth[0],y+depth[1]-172).lineTo(x+depth[0],y+depth[1]-8)
            .stroke({color:0x6f8c83,width:3});
    }
    // Filled undercarriage and opaque risers, with the same rise/run as the contact solver.
    g.moveTo(enter+depth[0],top+depth[1]).lineTo(enter+1260+depth[0],top-rise*9+depth[1])
        .lineTo(enter+1260,1400).lineTo(enter+depth[0],1400).closePath().fill(0x566e6a);
    for (let i=10;i>=-5;i--) {
        const solid = stairSolid(stairs,i,depth);
        const tread = solid.tread.map(p => transformPoint(p,q.platform));
        const riser = solid.riser.map(p => transformPoint(p,q.platform));
        const [x,y] = tread[0];
        if (x < enter) continue;
        poly(g,riser,0x768b82);
        poly(g,tread,0xb9bfae);
        // Grooves lie on the tread plane, not on a paper-thin vertical strip.
        for (let k=1;k<14;k++) {
            const fx=x+k*w/14;
            g.moveTo(fx,y-2).lineTo(fx+depth[0]+3,y+depth[1]+2)
                .stroke({color:0x7b8e82,width:1});
        }
        g.moveTo(x+1,y).lineTo(x+w-1,y).stroke({color:0xe8c861,width:3});
    }
    // Low near apron stays below the soles, so boarding contacts remain visible.
    const apronA: [number,number] = [enter,top+43], apronB: [number,number] = [enter+1260,top-rise*9+43];
    poly(front,[apronA,apronB,[apronB[0],1400],[apronA[0],1400]],0x405c59);
    front.moveTo(...apronA).lineTo(...apronB).stroke({color:0x304a4b,width:10});
    front.moveTo(apronA[0],apronA[1]-4).lineTo(apronB[0],apronB[1]-4).stroke({color:0xc3ccbc,width:3});
}
