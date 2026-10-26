import type { Point2 } from '../../core/spatial';

/** Shared by the actual nose path and the gesture's contact surface. */
export function faceFeatures(yaw: number) {
  const s = Math.sin(yaw), cx = s * 9, cy = -370, nx = cx + 78 * s, ny = cy + 23;
  return { center: [cx, cy] as Point2, nose: [nx, ny] as Point2,
    noseFront: [[nx + 17, ny - 5], [nx + 16, ny + 4], [nx + 4, ny + 6]] as [Point2, Point2, Point2] };
}
