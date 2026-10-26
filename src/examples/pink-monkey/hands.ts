import { contourAnchor, morphContour, type CubicContour } from '../../core/contour';
import type { Point2 } from '../../core/spatial';

const keys = ['palmEdge', 'foldedFingers', 'indexOuter', 'indexTip', 'indexInner', 'thumb', 'wristSide', 'wristBack'];
const form = (data: number[][]): CubicContour => ({ start: [-11, -7], curves: data.map((p, i) => ({
  key: keys[i], c1: [p[0], p[1]], c2: [p[2], p[3]], to: [p[4], p[5]],
})) });

const relaxed = form([
  [-21,4,-23,27,-13,32], [-7,38,1,37,3,29], [5,32,9,34,9,28], [9,37,19,37,19,28],
  [23,29,27,21,23,12], [31,16,31,3,20,1], [16,-3,15,-9,10,-9], [4,-13,-5,-12,-11,-7],
]);
const gathered = form([
  [-20,0,-23,22,-14,26], [-8,32,0,31,4,24], [7,26,9,26,9,21], [9,28,19,28,19,21],
  [21,23,24,18,21,12], [30,17,31,3,20,1], [16,-3,15,-9,10,-9], [4,-13,-5,-12,-11,-7],
]);
const pointing = form([
  [-20,0,-23,22,-14,26], [-8,32,0,31,4,24], [8,29,9,35,9,42], [9,51,19,51,19,42],
  [19,31,19,21,20,15], [29,18,31,3,20,1], [16,-3,15,-9,10,-9], [4,-13,-5,-12,-11,-7],
]);

/** Same wrist, palm and finger roles in every form; all inputs are pose parameters. */
export function handShape(gather: number, extension: number) {
  const contour = morphContour(morphContour(relaxed, gathered, gather), pointing, extension);
  const creases: [Point2, Point2, Point2][] = [[[-9,22],[-4,27],[2,24]], [[18,3],[12,7],[13,15]]];
  return { contour, creases, tip: contourAnchor(contour, 'indexTip'), wrist: [0, 0] as Point2 };
}
