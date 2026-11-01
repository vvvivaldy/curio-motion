import {Container, Graphics, Text} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import type {CubicContour} from '../../core/contour';
import {localPoint, type Point2} from '../../core/spatial';
import {motionFoundationsSettings} from './settings';
import {foundationsPose, route, shoulder, barrier, docks, armStrokeWidth, capsuleShape, type FoundationsPose} from './motion';

const colors = {background: 0x111c29, card: 0x1b2d3b, ink: 0xeef2e8, muted: 0x91a8b5,
  mint: 0x85c2b7, gold: 0xe9b477, coral: 0xf48776};
function label(parent: Container, text: string, x: number, y: number, size: number, fill = colors.ink, bold = false) {
  const node = new Text({text, style: {fontFamily: 'Arial, sans-serif', fontSize: size, fill, fontWeight: bold ? 'bold' : 'normal'}});
  node.position.set(x, y);parent.addChild(node);return node;
}
function line(g: Graphics, points: readonly Point2[], color: number, width: number, alpha = 1) {
  g.moveTo(...points[0]);for (const point of points.slice(1)) g.lineTo(...point);
  g.stroke({color, width, alpha, cap: 'round', join: 'round'});
}
function contour(g: Graphics, shape: CubicContour, color: number) {
  g.moveTo(...shape.start);for (const curve of shape.curves) g.bezierCurveTo(...curve.c1, ...curve.c2, ...curve.to);
  g.closePath().fill(color);
}
function environment(g: Graphics) {
  g.rect(0, 0, 1280, 720).fill(colors.background);
  for (let i = 0; i < route.length - 1; i += 3) line(g, route.slice(i, i + 2), 0x42606f, 2, .7);
  for (const point of [route[0], route[60], route[120], route[180]])
    g.circle(...point, 4).fill(0x587583);
  g.roundRect(72, 560, 1136, 20, 6).fill(0x182b3a);
  line(g, [[72, 560], [1208, 560]], 0x456072, 1);
  for (const {x, y, width, height, strokeWidth, topWidth} of docks) {
    g.roundRect(x, y, width, height, 6).fill(0x213c4c).stroke({color: 0x587484, width: strokeWidth});
    line(g, [[x + 5, y], [x + width - 5, y]], colors.mint, topWidth);
    g.roundRect(x + 24, y + 18, 40, 5, 2).fill(0x365564);
  }
  g.moveTo(barrier.left, barrier.bottom).lineTo(barrier.left, barrier.top).quadraticCurveTo(...barrier.control, barrier.right, barrier.top).lineTo(barrier.right, barrier.bottom)
    .closePath().fill(0x273b49).stroke({color: 0x55707c, width: barrier.strokeWidth});
  for (let i = 0; i < 4; i++) line(g, [[637 + i * 12, 430], [637 + i * 12, 478]], 0x3f5662, 2);
  for (const [x, width] of [[72, 354], [440, 354], [808, 400]]) g.roundRect(x, 615, width, 73, 12).fill(colors.card);
}
interface Drawing {back: Graphics; shadow: Graphics; ink: Graphics; phase: Text; trajectory: Text; spring: Text; contact: Text; rejection: Container}
export const motionFoundationsScene: SceneDefinition<FoundationsPose, Drawing> = {
  settings: motionFoundationsSettings, pose: foundationsPose,
  createDrawing(root) {
    const back = new Graphics(), shadow = new Graphics(), ink = new Graphics();root.addChild(back, shadow, ink);environment(back);
    label(root, 'CURIO / MOTION STUDY 01', 72, 43, 16, colors.muted);
    label(root, 'Движение под контролем', 72, 78, 38, colors.ink, true);
    label(root, 'Траектория · инерция · устойчивый захват', 72, 128, 18, colors.muted);
    label(root, 'СТАРТ / ФИНИШ', 454, 584, 11, colors.muted);
    label(root, 'ОПОРА', 810, 584, 11, colors.muted);
    label(root, '01 / Траектория', 92, 631, 19);
    label(root, '02 / Инерция', 460, 631, 19);
    label(root, '03 / Контакт и суставы', 828, 631, 19);
    const phase = label(root, '', 920, 492, 17, colors.mint);
    const trajectory = label(root, '', 92, 660, 15, colors.muted);
    const spring = label(root, '', 460, 660, 15, colors.muted);
    const contact = label(root, '', 828, 660, 15, colors.muted);
    const rejection = new Container();root.addChild(rejection);
    const panel = new Graphics().roundRect(922, 218, 286, 94, 12).fill(0x352b34);rejection.addChild(panel);
    label(rejection, 'Цель недостижима', 940, 234, 20, colors.coral, true);
    label(rejection, 'Захват и допустимая поза', 940, 265, 16, colors.ink);
    label(rejection, 'сохраняются', 940, 285, 16, colors.ink);
    return {back, shadow, ink, phase, trajectory, spring, contact, rejection};
  },
  draw(d, p) {
    const g = d.ink;g.clear();d.shadow.clear();
    const [x, y] = p.capsule.frame.origin;
    d.shadow.ellipse(x, 559, 58, 6).fill({color: 0x000000, alpha: .25});
    // Rigid, whole vector links; the same joints and end frame feed all diagnostics.
    line(g, [p.arm.root, p.arm.joint, p.arm.end], 0x2d4a54, armStrokeWidth);
    line(g, [p.arm.root, p.arm.joint, p.arm.end], colors.mint, 32);
    line(g, [p.arm.root, p.arm.joint], 0xb5d9c9, 4, .65);
    g.moveTo(300, 560).lineTo(312, 498).quadraticCurveTo(340, 472, 368, 498).lineTo(380, 560).closePath().fill(0x3f6870);
    line(g, [[300, 560], [380, 560]], colors.mint, 3);
    for (const [point, radius] of [[shoulder, 22], [p.arm.joint, 18], [p.arm.end, 12]] as const)
      g.circle(...point, radius).fill(0x172a38).stroke({color: 0xb6dbcb, width: 4});
    g.circle(...p.arm.joint, 6).fill(colors.gold);
    // Actual ring: outer radius 22, hole radius 14. The hook enters the hole at its left edge.
    g.circle(x, y + capsuleShape.ringY, capsuleShape.ringRadius).stroke({color: colors.gold, width: capsuleShape.ringStroke});
    g.roundRect(x - capsuleShape.width / 2, y - capsuleShape.height, capsuleShape.width, capsuleShape.height, capsuleShape.radius).fill(colors.gold);
    g.roundRect(x - 28, y - 54, 56, 44, 10).fill(0xc58f58);
    g.roundRect(x - 18, y - 44, 36, 25, 6).fill(0x2d444e);
    line(g, [[x - 10, y - 31], [x - 3, y - 25], [x + 11, y - 38]], 0xc8dfc8, 3);
    line(g, [p.antennaRoot, p.antennaTip], 0x9dbdbf, 3);
    g.circle(...p.antennaTip, 8).fill(colors.coral);
    contour(g, p.hand, colors.ink);
    const touch = localPoint([36, 0], p.arm.handFrame);
    g.circle(...touch, 2.5).fill(0x3b7167);
    if (p.rejecting) {
      line(g, [p.target, p.rejectedTarget], colors.coral, 1, .35);
      const [gx, gy] = p.rejectedTarget;
      g.circle(gx, gy, 18).stroke({color: colors.coral, width: 2});
      line(g, [[gx - 7, gy - 7], [gx + 7, gy + 7]], colors.coral, 2);
      line(g, [[gx + 7, gy - 7], [gx - 7, gy + 7]], colors.coral, 2);
    }
    d.phase.text = p.phase;
    d.phase.style.fill = p.rejecting ? colors.coral : colors.mint;
    // Keep changing copy away from artwork; these labels explain the technical study.
    d.trajectory.text = p.speed > .05 ? `Дуга без промежуточных остановок` : 'Точная остановка на опоре';
    d.spring.text = p.time >= 8.6 ? 'Затухание завершено · полный покой' : Math.abs(p.response) > .005 ? 'Указатель догоняет и успокаивается' : 'Реакция на старт и торможение';
    d.contact.text = p.rejecting ? 'Запрос отклонён · контакт сохранён' : 'Длины звеньев и захват неизменны';
    d.rejection.visible = p.rejecting;
  },
};
