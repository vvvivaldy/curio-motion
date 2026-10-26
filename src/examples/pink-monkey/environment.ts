import { Graphics } from 'pixi.js';
import { Pose, mix } from './motion';
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
    g.clear();
    front.clear();
    g.rect(0, 0, 1280, 720).fill(0xe7e1d2);
    const orbit = q.turn, travel = q.wallTravel;
    // Stationary wall panels translate opposite the tracking camera (down-left).
    for (let i = -3; i < 13; i++) {
        const x = i * 160 - (travel * .75) % 160, y = 0;
        g.rect(x, y, 158, 720).fill((i + Math.floor(travel * .75 / 160)) % 2 ? 0xd9d9c9 : 0xdedecd);
        g.moveTo(x, 0).lineTo(x, 720).stroke({ color: 0xc6cbbc, width: 2 });
    }
    for (let j = -2; j < 8; j++) {
        const y = j * 112 + (travel * .43 * .75) % 112;
        g.moveTo(0, y).lineTo(1280, y - orbit * 110).stroke({ color: 0xc8cbbb, width: 2 });
    }
    g.rect(0, 0, 1280, 55).fill(0x4d6868);
    g.rect(0, 55, 1280, 12).fill(0x9aa99a);
    for (let i = -2; i < 6; i++) {
        let x = i * 390 - travel * .65, y = 95 + i * (-35 * orbit) + travel * .43 * .65;
        g.roundRect(x, y, 180, 14, 7).fill(0xfff5cb);
        g.roundRect(x - 4, y - 5, 188, 24, 8).stroke({ color: 0x6f8580, width: 3 });
    }
    for (let i = -1; i < 5; i++) {
        const x = 120 + i * 480 - travel, y = 145 - i * 130 * orbit + travel * .43;
        poster(g, x, y, (i + 6) % 3);
    }
    // The entry floor and stair stringer are stationary; camera movement along the incline preserves its line.
    g.rect(0, 650 + travel * .43, 1280, 1000).fill(0xb6b9aa);
    g.moveTo(0, 650 + travel * .43).lineTo(1280, 650 + travel * .43).stroke({ color: 0x6c7e78, width: 3 });
    if (orbit < .95) {
        const van = mix(640, 1700, orbit);
        for (let x = -200; x < 1600; x += 150)
            g.moveTo(x, 720).lineTo(van, 450).stroke({ color: 0x969e93, width: 1 });
    }
    const enter = mix(950, 580, orbit), rise = 60 * orbit, w = 140;
    const top = 620 + 200 * (1 - orbit);
    // Co-moving horizontal treads: the camera follows the occupied tread, not a sloped ramp.
    g.moveTo(enter - 560, top + rise * 4).lineTo(enter + 1120, top - rise * 8).lineTo(enter + 1120, 900).lineTo(enter - 560, 900).closePath().fill(0x707f7c);
    for (let i = -4; i < 9; i++) {
        const x = enter + i * w, y = top - i * rise;
        g.moveTo(x, y).lineTo(x + w, y).lineTo(x + w, y - rise).lineTo(x + w + 6, y - rise).lineTo(x + w + 6, y + 8).lineTo(x, y + 8).closePath().fill(0xadb4a8).stroke({ color: 0x485d5c, width: 2 });
        for (let k = 1; k < 14; k++)
            g.moveTo(x + k * 10, y + 1).lineTo(x + k * 10, y + 6).stroke({ color: 0x6c7b75, width: 1 });
        g.moveTo(x + 1, y).lineTo(x + w - 1, y).stroke({ color: 0xe8c861, width: 3 });
    }
    // Far handrail remains behind the character. Repeating mounting posts move with the station.
    const railY = top - 210;
    g.moveTo(enter - 480, railY + rise * 3.43).lineTo(enter + 1120, railY - rise * 8).stroke({ color: 0x3e5556, width: 16, cap: 'round' });
    g.moveTo(enter - 480, railY + rise * 3.43 - 5).lineTo(enter + 1120, railY - rise * 8 - 5).stroke({ color: 0x78918a, width: 3 });
    for (let i = -2; i < 9; i++) {
        const x = enter + i * 200 - travel * .7, y = railY - (x - enter) * rise / w;
        g.moveTo(x, y + 8).lineTo(x, y + 145).stroke({ color: 0x81928c, width: 5 });
    }
    // A narrow near-side trim stays below the feet and does not hide knees or contact.
    front.moveTo(enter - 560, top + rise * 4 + 45).lineTo(enter + 1120, top - rise * 8 + 45).stroke({ color: 0x394e52, width: 12 });
    front.moveTo(enter - 560, top + rise * 4 + 39).lineTo(enter + 1120, top - rise * 8 + 39).stroke({ color: 0xc3ccbc, width: 3 });
}
