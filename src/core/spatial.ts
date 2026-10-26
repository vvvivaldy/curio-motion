export type Point2 = [number, number];
export type Vec3 = [number, number, number];

export function rotatePoint(point: Point2, angle: number): Point2 {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [point[0] * c - point[1] * s, point[0] * s + point[1] * c];
}

/** Place a rotated contour so its chosen heel/toe/other pivot remains on the surface. */
export function placeOnPivot(anchor: Point2, localAnchor: Point2, pivot: Point2, angle: number) {
  if (![...anchor, ...localAnchor, ...pivot, angle].every(Number.isFinite))
    throw new RangeError('Finite pivot geometry required');
  const contact: Point2 = [anchor[0] + pivot[0] - localAnchor[0], anchor[1] + pivot[1] - localAnchor[1]];
  const rotated = rotatePoint(pivot, angle);
  const origin: Point2 = [contact[0] - rotated[0], contact[1] - rotated[1]];
  return { origin, contact };
}

/** A translation/uniform scale between two explicitly chosen coordinate spaces. */
export interface Frame2D {
  readonly origin: Point2;
  readonly scale: number;
}

export function transformPoint(point: Point2, frame: Frame2D): Point2 {
  if (![...point, ...frame.origin, frame.scale].every(Number.isFinite) || frame.scale <= 0)
    throw new RangeError('Finite coordinates and positive frame scale required');
  return [frame.origin[0] + point[0] * frame.scale, frame.origin[1] + point[1] * frame.scale];
}

export function inverseTransformPoint(point: Point2, frame: Frame2D): Point2 {
  if (![...point, ...frame.origin, frame.scale].every(Number.isFinite) || frame.scale <= 0)
    throw new RangeError('Finite coordinates and positive frame scale required');
  return [(point[0] - frame.origin[0]) / frame.scale, (point[1] - frame.origin[1]) / frame.scale];
}

/** Orthographic yaw with an optional depth contribution to screen height. */
export function project(v: Vec3, yaw: number, depthLift = .08): Point2 {
  return [v[0] * Math.cos(yaw) + v[2] * Math.sin(yaw), v[1] + v[2] * Math.cos(yaw) * depthLift];
}

/** Inverse projection given the remaining view-depth coordinate. Safe at yaw=0 and PI/2. */
export function unproject(point: Point2, yaw: number, depth = 0, depthLift = .08): Vec3 {
  const c = Math.cos(yaw), s = Math.sin(yaw), z = point[0] * s + depth * c;
  return [point[0] * c - depth * s, point[1] - z * c * depthLift, z];
}
