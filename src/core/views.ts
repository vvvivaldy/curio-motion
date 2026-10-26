import { morphContour, validateContour, type CubicContour } from './contour';
import { smooth } from './time';

export interface ContourView { readonly at: number; readonly contour: CubicContour }

/** Authored whole views with semantic curve correspondence. Values outside the range hold. */
export function contourView(views: readonly ContourView[], value: number): CubicContour {
  if (!Number.isFinite(value) || !views.length) throw new RangeError('Finite value and authored views required');
  for (let i = 0; i < views.length; i++) {
    const view = views[i];
    validateContour(view.contour);
    if (!Number.isFinite(view.at) || (i > 0 && view.at <= views[i - 1].at)
      || view.contour.curves.length !== views[0].contour.curves.length
      || view.contour.curves.some((c, j) => c.key !== views[0].contour.curves[j].key))
      throw new RangeError('Ordered views with matching contour topology required');
  }
  if (value <= views[0].at) return morphContour(views[0].contour, views[0].contour, 0);
  const upper = views.findIndex(view => view.at >= value);
  if (upper === -1) return morphContour(views.at(-1)!.contour, views.at(-1)!.contour, 0);
  const a = views[upper - 1], b = views[upper];
  return morphContour(a.contour, b.contour, smooth((value - a.at) / (b.at - a.at)));
}
