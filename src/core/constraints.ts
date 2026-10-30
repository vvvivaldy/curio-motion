import {attachAnchor, localPoint, type LocalFrame2D, type Point2} from './spatial';
import {relativeAngle, solvePlanarLimb} from './kinematics';

export interface LockedContact {readonly local: Point2; readonly target: Point2}
export interface ConstraintViolation {readonly constraint: 'contact' | 'reach' | 'shoulder' | 'elbow' | 'wrist'; readonly message: string}
const point = (value: Point2) => value.length === 2 && value.every(Number.isFinite);
const range = (value: readonly [number, number], low: number, high: number) =>
  value.length === 2 && value.every(Number.isFinite) && value[0] >= low && value[1] <= high && value[0] <= value[1];

/** Solve translation for a prescribed rotation/scale. The first contact is exact;
 * incompatible additional contacts block the request instead of being averaged away.
 */
export function attachContacts(orientation: {readonly angle: number; readonly scale: number},
  contacts: readonly LockedContact[], tolerance = 1e-6) {
  if (!contacts.length || !contacts.every(c => point(c.local) && point(c.target)) || !Number.isFinite(tolerance) || tolerance < 0)
    throw new RangeError('Finite locked contacts and nonnegative tolerance required');
  const frame = attachAnchor({origin: [0, 0], ...orientation}, contacts[0].local, contacts[0].target);
  const errors = contacts.map(contact => {
    const actual = localPoint(contact.local, frame);
    return Math.hypot(actual[0] - contact.target[0], actual[1] - contact.target[1]);
  });
  if (errors.some(error => error > tolerance)) return {status: 'blocked' as const, errors,
    violations: [{constraint: 'contact' as const, message: 'Locked anchors disagree with prescribed rotation/scale'}]};
  return {status: 'solved' as const, frame, errors};
}

export interface ContactLimbRequest {
  readonly root: Point2;
  readonly upper: number;
  readonly lower: number;
  readonly contact: LockedContact;
  readonly handAngle: number;
  readonly handScale?: number;
  readonly bendSide: -1 | 1;
  readonly shoulderReference?: number;
  readonly shoulderRange: readonly [number, number];
  /** Nonnegative flexion: zero means straight. */
  readonly elbowRange: readonly [number, number];
  readonly wristRange: readonly [number, number];
}

/** Fixed root + locked drawn hand anchor + explicit angular ranges.
 * Expected geometric conflicts return blocked with no drawable pose. Bad API data throws.
 * No joint clamping, previous-frame fallback, root translation or implicit anatomy.
 */
export function solveLimbContact(request: ContactLimbRequest) {
  const {root, upper, lower, contact, handAngle, bendSide, shoulderReference = 0} = request;
  if (!point(root) || ![upper, lower, shoulderReference].every(Number.isFinite) || upper <= 0 || lower <= 0
    || ![-1, 1].includes(bendSide) || !range(request.shoulderRange, -Math.PI, Math.PI)
    || !range(request.elbowRange, 0, Math.PI) || !range(request.wristRange, -Math.PI, Math.PI))
    throw new RangeError('Finite limb geometry and ordered joint ranges required');
  const attachment = attachContacts({angle: handAngle, scale: request.handScale ?? 1}, [contact]);
  if (attachment.status === 'blocked') return attachment;
  const handFrame: LocalFrame2D = attachment.frame, end = handFrame.origin;
  const distance = Math.hypot(end[0] - root[0], end[1] - root[1]);
  const maximum = upper + lower, minimum = Math.abs(upper - lower);
  if (!Number.isFinite(distance) || !Number.isFinite(maximum)) throw new RangeError('Unrepresentable limb reach');
  if (distance > maximum || distance < minimum || distance < 1e-8)
    return {status: 'blocked' as const, violations: [{constraint: 'reach' as const,
      message: `Wrist distance ${distance}; allowed ${minimum}..${maximum}, with nonzero direction`}]};
  const limb = solvePlanarLimb(root, end, upper, lower, {bendSide, endAngle: handAngle,
    minFlexion: 0, wristRange: [-Math.PI, Math.PI]});
  const shoulder = relativeAngle(limb.upperAngle, shoulderReference);
  const angles = {shoulder, elbow: limb.flexion, wrist: limb.wristBend};
  const violations: ConstraintViolation[] = [];
  for (const joint of ['shoulder', 'elbow', 'wrist'] as const) {
    const bounds = request[`${joint}Range`], value = angles[joint];
    if (value < bounds[0] - 1e-9 || value > bounds[1] + 1e-9)
      violations.push({constraint: joint, message: `${joint} angle ${value}; allowed ${bounds[0]}..${bounds[1]}`});
  }
  if (violations.length) return {status: 'blocked' as const, violations};
  return {status: 'solved' as const, pose: {root: [...root] as Point2, joint: limb.joint, end,
    handFrame, contact: localPoint(contact.local, handFrame), angles}, violations};
}
