import type {Graphics} from 'pixi.js';
import type {Point2} from './spatial';

export interface PaperFillFragment {readonly color:number;readonly points:readonly Point2[]}
/** Opaque same-color fills, with optional subpixel raster coverage at shared cut edges.
 * Coverage is measured in output pixels, not world/anatomy units. It is not a geometry
 * repair or an occlusion override; original silhouette ink is drawn separately afterwards. */
export function fillPaperFragments(g:Graphics,fragments:readonly PaperFillFragment[],options:{seamCoveragePx?:number}={}){
 const coverage=options.seamCoveragePx??0;
 if(!Number.isFinite(coverage)||coverage<0||coverage>1)throw new RangeError('Subpixel coverage must be within0..1 output pixels');
 const groups=new Map<number,(readonly Point2[])[]>();
 for(const f of fragments){
  if(!Number.isInteger(f.color)||f.color<0||f.color>0xffffff||f.points.length<3||!f.points.flat().every(Number.isFinite))throw new RangeError('Finite opaque polygon and RGB color required');
  const group=groups.get(f.color)??[];group.push(f.points);groups.set(f.color,group);
 }
 for(const[color,polygons]of groups){
  for(const p of polygons)g.poly(p.flat());g.fill(color);
  // Same pigment restores antialias coverage; no dark lines on triangle/cut boundaries.
  if(coverage)for(const p of polygons)g.poly(p.flat()).stroke({color,width:coverage,alignment:.5,join:'round'});
 }
}
