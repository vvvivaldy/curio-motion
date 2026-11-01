import {Container,Graphics,Text} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {raccoonCourierScene} from '../raccoon-courier/scene';
import {deliveryInfographicScene} from '../delivery-infographic/scene';
import {morningDeliveryPose,type MorningDeliveryPose} from './motion';
import {morningDeliverySettings} from './settings';

const palette = {cream:0xf5edda, chartCream:0xf6f3e9, paper:0xffecca, ink:0x403932, teal:0x28666b, ochre:0xc78d38, coral:0xb84630, muted:0x71877e};
interface Drawing {
  readonly background: Graphics;
  readonly courierLayer: Container;
  readonly courier: ReturnType<typeof raccoonCourierScene.createDrawing>;
  readonly infographicLayer: Container;
  readonly infographic: ReturnType<typeof deliveryInfographicScene.createDrawing>;
  readonly intro: Container;
  readonly introEnvelope: Container;
  readonly bridge: Container;
  readonly outro: Container;
  readonly total: Text;
}

function text(parent: Container, content: string, x: number, y: number, size: number, color: number, center = false, bold = false) {
  const label = new Text({text: content, style: {fontFamily: 'Arial, sans-serif', fontSize: size,
    fontWeight: bold ? '700' : '400', lineHeight: size * 1.16, fill: color}});
  label.position.set(x, y);
  if (center) label.anchor.set(.5, 0);
  parent.addChild(label);
  return label;
}

/** Whole vector stationery; no reference textures or media layers. */
function envelope(parent: Container, x: number, y: number) {
  const layer = new Container(), art = new Graphics();
  layer.position.set(x, y); layer.addChild(art); parent.addChild(layer);
  art.ellipse(0, 125, 164, 15).fill({color: palette.ink, alpha: .08});
  art.roundRect(-160, -100, 320, 200, 8).fill(palette.paper).stroke({color: palette.ink, width: 3});
  art.moveTo(-158, -98).lineTo(0, 25).lineTo(158, -98).stroke({color: palette.ochre, width: 3, join: 'round'});
  art.moveTo(-158, 98).lineTo(-42, 0).moveTo(158, 98).lineTo(42, 0).stroke({color: palette.ochre, width: 2});
  art.circle(0, 28, 25).fill(palette.coral).stroke({color: 0x8e3528, width: 2});
  art.moveTo(-8, 28).lineTo(-1, 35).lineTo(12, 20).stroke({color: palette.paper, width: 3, cap: 'round', join: 'round'});
  return layer;
}

function show(layer: Container, visible: boolean, opacity: number) {
  layer.visible = visible;
  layer.alpha = visible ? opacity : 0;
}

export const morningDeliveryScene: SceneDefinition<MorningDeliveryPose, Drawing> = {
  settings: morningDeliverySettings,
  pose: morningDeliveryPose,
  createDrawing(root) {
    const background = new Graphics(), courierLayer = new Container(), infographicLayer = new Container();
    const intro = new Container(), bridge = new Container(), outro = new Container();
    root.addChild(background, courierLayer, infographicLayer, intro, bridge, outro);
    const courier = raccoonCourierScene.createDrawing(courierLayer);
    const infographic = deliveryInfographicScene.createDrawing(infographicLayer);

    const introMarks = new Graphics(); intro.addChild(introMarks);
    introMarks.roundRect(88, 111, 106, 7, 3).fill(palette.ochre);
    text(intro, 'CURIO MOTION', 88, 65, 20, palette.muted, false, true);
    text(intro, 'Утренний\nмаршрут', 88, 225, 78, palette.ink, false, true);
    text(intro, 'Учебная история', 93, 474, 28, palette.teal);
    const introEnvelope = envelope(intro, 990, 350);

    const bridgeMarks = new Graphics(); bridge.addChild(bridgeMarks);
    bridgeMarks.roundRect(571, 183, 138, 7, 3).fill(palette.ochre);
    text(bridge, 'Письмо в пути', 640, 263, 68, palette.ink, true, true);
    text(bridge, 'Посмотрим на утреннюю сводку', 640, 375, 30, palette.teal, true);

    text(outro, 'Маршрут начат.\nСводка готова.', 640, 204, 68, palette.ink, true, true);
    text(outro, 'Учебная история', 640, 411, 26, palette.muted, true);
    const finishMarks = new Graphics(); outro.addChild(finishMarks);
    finishMarks.roundRect(398, 490, 484, 78, 16).fill(palette.teal);
    const total = text(outro, '', 640, 513, 27, palette.cream, true, true);
    return {background, courierLayer, courier, infographicLayer, infographic, intro, introEnvelope, bridge, outro, total};
  },
  draw(drawing, pose) {
    const {segment, opacity} = pose;
    drawing.background.clear().rect(0, 0, 1280, 720).fill(segment === 'infographic' || segment === 'outro' ? palette.chartCream : palette.cream);
    show(drawing.courierLayer, segment === 'courier', opacity);
    show(drawing.infographicLayer, segment === 'infographic', opacity);
    show(drawing.intro, segment === 'intro', opacity);
    show(drawing.bridge, segment === 'bridge', opacity);
    show(drawing.outro, segment === 'outro', opacity);
    drawing.introEnvelope.y = 350 + 18 * (1 - pose.envelopeProgress);
    drawing.introEnvelope.rotation = -.06 * (1 - pose.envelopeProgress);
    drawing.total.text = `Итог учебной сводки: ${pose.total}`;
    // Child drawing objects retain identity, scale and coordinates. Only the local clock changes.
    if (pose.courier) raccoonCourierScene.draw(drawing.courier, pose.courier.pose, pose.courier);
    if (pose.infographic) deliveryInfographicScene.draw(drawing.infographic, pose.infographic.pose, pose.infographic);
  },
};
