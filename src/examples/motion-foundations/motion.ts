import {createTrajectory, parameterizeByDistance} from '../../core/trajectory';
import {sampleTravel} from '../../core/time';
import {sampleSpringImpulse} from '../../core/spring';
import {solveLimbContact, type ContactLimbRequest} from '../../core/constraints';
import {contourAnchor, mapContour, quadraticPoint, type CubicContour} from '../../core/contour';
import {localPoint, type Point2} from '../../core/spatial';
import type {ObjectGeometry} from '../../core/relations';

export const shoulder: Point2 = [340, 500];
export const dockY = 510;
// Drawing and diagnostics share this exact dome, dock and visible-stroke geometry.
export const barrier = {left: 620, right: 690, top: 402, control: [655, 372] as Point2, bottom: dockY, strokeWidth: 1.5};
export const barrierBoundary: Point2[] = [...Array.from({length: 65}, (_, i) =>
  quadraticPoint([barrier.left, barrier.top], barrier.control, [barrier.right, barrier.top], i / 64)),
  [barrier.right, barrier.bottom], [barrier.left, barrier.bottom]];
export const docks = [456, 786].map(x => ({x, y: dockY, width: 88, height: 50, strokeWidth: 1.5, topWidth: 3}));
export const armStrokeWidth = 44;
export const capsuleShape = {width: 76, height: 64, radius: 16, ringY: -85, ringRadius: 18, ringStroke: 8};
export const capsuleAnchors = {grip: [-14, -85] as Point2, base: [0, 0] as Point2, antenna: [30, -64] as Point2};
// A complete continuous hook, with the contact on the actual drawn curve endpoint.
export const hook: CubicContour = {start: [-8, -7], curves: [
  {key: 'palm', c1: [0, -7], c2: [9, -7], to: [13, -7]},
  {key: 'outerRoot', c1: [14, -27], c2: [35, -29], to: [46, -20]},
  {key: 'outerTip', c1: [55, -13], c2: [50, -5], to: [43, -8]},
  {key: 'innerTip', c1: [39, -12], c2: [30, -19], to: [26, -10]},
  {key: 'touch', c1: [22, -2], c2: [27, -1], to: [36, 0]},
  {key: 'thumb', c1: [39, 13], c2: [19, 17], to: [13, 7]},
  {key: 'wrist', c1: [5, 7], c2: [-3, 7], to: [-8, 7]},
  {key: 'close', c1: [-9, 3], c2: [-9, -3], to: [-8, -7]},
]};
const handAnchor = contourAnchor(hook, 'touch', 1);
const outwardShape = createTrajectory([
  {time: 0, position: [500, dockY]},
  {time: 1, position: [570, 330], velocity: [180, -40]},
  {time: 2, position: [740, 330], velocity: [180, 40]},
  {time: 3, position: [830, dockY]},
]);
export const distancePath = parameterizeByDistance(outwardShape, 512);
export const returnTrajectory = createTrajectory([
  {time: 5, position: [830, dockY]},
  {time: 5.75, position: [740, 330], velocity: [-180, -40]},
  {time: 6.5, position: [570, 330], velocity: [-180, 40]},
  {time: 7.2, position: [500, dockY]},
]);
export const route = Array.from({length: 181}, (_, i) => distancePath.sample(distancePath.length * i / 180).position);
export const limbLimits = {upper: 300, lower: 260, bendSide: -1 as const,
  shoulderRange: [-2.6, .4] as const, elbowRange: [Math.PI / 7.2, Math.PI * 160 / 180] as const,
  wristRange: [-1.5, 1.5] as const};
const impulses = [.8, 3, 5, 7.2].map((start, i) => ({start, velocity: [-7, 7, 7, -7][i],
  frequencyHz: 1.8, dampingRatio: .36, duration: 1.4, fade: .4}));

export function foundationsPose(time: number) {
  const travel = sampleTravel(time, {start: .8, end: 3, ramp: .35});
  const along = distancePath.sample(distancePath.length * travel.progress);
  const back = returnTrajectory.sample(time);
  const position = time < 5 ? along.position : back.position;
  const speed = time < 5 ? distancePath.length * travel.velocity : Math.hypot(...back.velocity);
  const capsule: ObjectGeometry = {id: 'capsule', frame: {origin: position, angle: 0, scale: 1}, anchors: capsuleAnchors};
  const target = localPoint(capsuleAnchors.grip, capsule.frame);
  const request: ContactLimbRequest = {root: shoulder, ...limbLimits, contact: {local: handAnchor, target}, handAngle: 0};
  const solution = solveLimbContact(request);
  if (solution.status !== 'solved') throw new Error(`Authored transfer violates constraints at ${time}: ${JSON.stringify(solution.violations)}`);
  // A new command can fail without retaining any previous frame: the supported authored
  // pose is independently evaluated at this time, while the rejected goal stays a marker.
  const rejecting = time >= 3.5 && time < 4.5;
  const rejectedTarget: Point2 = [1080, 350];
  const probe = solveLimbContact({...request, contact: {...request.contact, target: rejectedTarget}});
  if (probe.status !== 'blocked') throw new Error('The displayed unreachable request unexpectedly became reachable');
  const response = impulses.reduce((sum, impulse) => sum + sampleSpringImpulse(time, impulse).offset, 0);
  const antennaRoot = localPoint(capsuleAnchors.antenna, capsule.frame);
  const antennaTip: Point2 = [antennaRoot[0] + 54 * Math.sin(response), antennaRoot[1] - 54 * Math.cos(response)];
  return {time, capsule, arm: solution.pose, hand: mapContour(hook, p => localPoint(p, solution.pose.handFrame)),
    target, speed, response, antennaRoot, antennaTip, rejecting, rejectedTarget,
    rejection: probe.violations, phase: time < .8 ? 'Готов к переносу' : time < 3 ? 'Над препятствием'
      : time < 3.5 ? 'Торможение и затухание' : time < 4.5 ? 'Недостижимая цель отклонена'
        : time < 5 ? 'Контакт сохранён' : time < 7.2 ? 'Возвращение без остановок' : 'Возврат · спокойная пауза'};
}
export type FoundationsPose = ReturnType<typeof foundationsPose>;
