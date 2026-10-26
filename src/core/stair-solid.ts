import { treadPoint, type Staircase2D } from './contacts';
import type { Point2 } from './spatial';

const add = (a: Point2, b: Point2): Point2 => [a[0] + b[0], a[1] + b[1]];
function validateDepth(depth: Point2) {
  if (!depth.every(Number.isFinite) || Math.hypot(...depth) === 0) throw new RangeError('Finite nonzero stair depth required');
}

/** The front edge is exactly the horizontal contact tread. Depth adds an opaque projected solid. */
export function stairSolid(stairs: Staircase2D, index: number, depth: Point2) {
  validateDepth(depth);
  const left = treadPoint(stairs, index), right = treadPoint(stairs, index, 1);
  const upper = treadPoint(stairs, index + 1);
  return { tread: [left, right, add(right, depth), add(left, depth)] as Point2[],
    riser: [right, upper, add(upper, depth), add(right, depth)] as Point2[] };
}

/** An opaque side panel follows the same incline, in any caller-owned coordinate frame. */
export function stairPanel(stairs: Staircase2D, first: number, last: number, offset: Point2, height: number) {
  if (!offset.every(Number.isFinite) || !Number.isFinite(height) || height <= 0 || first >= last)
    throw new RangeError('Finite offset, positive panel height and ordered steps required');
  const a = add(treadPoint(stairs, first), offset), b = add(treadPoint(stairs, last), offset);
  return [a, b, [b[0], b[1] - height], [a[0], a[1] - height]] as Point2[];
}
