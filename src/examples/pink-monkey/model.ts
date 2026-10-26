import { contourAnchor, type CubicContour } from '../../core/contour';
import { contourView } from '../../core/views';
import type { Point2 } from '../../core/spatial';

// Whole authored views. Curve names retain the same anatomical meaning through the turn.
const outline = (start: Point2, keys: string[], rows: number[][]): CubicContour => ({ start,
  curves: rows.map((v, i) => ({ key: keys[i], c1: [v[0], v[1]], c2: [v[2], v[3]], to: [v[4], v[5]] })) });
const views = (front: CubicContour, quarter: CubicContour, profile: CubicContour) =>
  [front, quarter, profile].map((contour, i) => ({ at: i * Math.PI / 4, contour }));
const skullKeys = ['crownRight', 'temple', 'cheek', 'chin', 'jaw', 'earRoot', 'crownLeft', 'crown'];
export const headViews = views(
  outline([0,-100], skullKeys, [
    [40,-100,72,-78,82,-42], [91,-17,89,8,85,22], [83,43,74,58,56,67],
    [32,82,-7,85,-32,76], [-52,72,-67,65,-73,52], [-83,36,-88,18,-86,0],
    [-89,-31,-81,-61,-62,-78], [-46,-93,-22,-100,0,-100],
  ]),
  outline([0,-101], skullKeys, [
    [39,-102,74,-77,82,-39], [88,-15,86,8,81,26], [80,46,77,59,62,69],
    [43,83,12,84,-8,75], [-27,70,-43,59,-51,44], [-60,32,-65,12,-65,-3],
    [-77,-32,-77,-62,-57,-80], [-39,-96,-19,-101,0,-101],
  ]),
  outline([0,-103], skullKeys, [
    [43,-104,73,-76,76,-37], [81,-15,77,7,77,29], [80,47,83,57,72,68],
    [54,83,28,85,8,76], [-4,74,-18,70,-16,63], [-16,51,-15,37,-15,28],
    [-70,10,-91,-49,-61,-81], [-45,-98,-22,-103,0,-103],
  ]),
);
const muzzleKeys = ['upperLeft', 'upperRight', 'front', 'lower', 'lowerLeft', 'back'];
const muzzleViews = views(
  outline([-45,35], muzzleKeys, [[-41,22,-22,17,0,25],[20,17,42,23,46,36],[54,49,48,64,34,73],
    [17,84,-12,83,-29,75],[-43,70,-51,59,-49,49],[-49,43,-47,38,-45,35]]),
  outline([0,32], muzzleKeys, [[12,24,31,23,49,27],[70,23,88,31,92,41],[103,53,97,68,82,77],
    [64,86,39,85,23,77],[8,71,-1,63,-3,52],[-5,43,-3,37,0,32]]),
  outline([49,31], muzzleKeys, [[56,26,67,25,80,29],[92,26,104,34,107,45],[113,58,106,71,94,77],
    [81,84,61,84,49,77],[39,72,33,64,33,53],[33,43,40,35,49,31]]),
);
const torsoKeys = ['neckRight','chest','belly','seat','hip','back','shoulder','neckLeft'];
const torsoViews = views(
  outline([-18,-322],torsoKeys,[[3,-322,21,-318,26,-294],[43,-284,48,-262,52,-239],
    [63,-209,65,-181,53,-156],[44,-129,21,-123,0,-125],[-24,-123,-43,-132,-50,-155],
    [-62,-181,-63,-219,-56,-244],[-54,-273,-46,-289,-33,-297],[-20,-304,-18,-314,-18,-322]]),
  outline([-13,-322],torsoKeys,[[6,-322,23,-314,29,-294],[38,-280,42,-261,48,-239],
    [62,-211,69,-180,55,-155],[47,-130,27,-123,9,-126],[-12,-123,-31,-134,-37,-155],
    [-48,-182,-49,-218,-44,-244],[-42,-269,-35,-290,-27,-297],[-17,-307,-15,-315,-13,-322]]),
  outline([-7,-322],torsoKeys,[[10,-322,26,-313,30,-294],[35,-278,37,-257,43,-239],
    [61,-214,70,-181,59,-156],[53,-136,35,-126,20,-128],[1,-126,-17,-138,-25,-157],
    [-36,-182,-36,-220,-30,-246],[-28,-270,-26,-289,-21,-297],[-13,-307,-9,-315,-7,-322]]),
);
const bellyKeys = ['upperRight','right','bottom','left','upperLeft','top'];
const bellyViews = views(
  outline([2,-268],bellyKeys,[[20,-263,32,-252,38,-236],[49,-215,54,-184,43,-163],
    [35,-145,19,-137,4,-138],[-14,-137,-32,-148,-39,-166],[-49,-187,-43,-215,-31,-239],[-21,-258,-9,-265,2,-268]]),
  outline([15,-265],bellyKeys,[[30,-259,39,-247,45,-231],[56,-207,61,-184,51,-164],
    [43,-146,30,-138,17,-139],[2,-140,-10,-151,-13,-169],[-17,-191,-6,-217,0,-239],[5,-253,9,-261,15,-265]]),
  outline([29,-264],bellyKeys,[[35,-256,40,-243,46,-229],[58,-207,64,-183,55,-164],
    [48,-149,38,-141,29,-140],[18,-144,9,-155,8,-174],[6,-195,14,-220,19,-240],[22,-253,25,-261,29,-264]]),
);
const earKeys=['upper','outer','lobe','root'];
const earViews=views(
  outline([-86,0],earKeys,[[-106,-36,-139,-23,-149,11],[-163,42,-136,80,-108,83],
    [-91,84,-79,65,-73,52],[-83,36,-88,18,-86,0]]),
  outline([-65,-3],earKeys,[[-88,-42,-132,-24,-142,9],[-156,40,-130,78,-102,80],
    [-73,79,-53,60,-51,44],[-60,32,-65,12,-65,-3]]),
  outline([-15,-14],earKeys,[[-42,-45,-83,-24,-91,10],[-108,43,-85,79,-56,80],
    [-34,85,-13,65,-8,43],[-2,15,-1,-4,-15,-14]]),
);
const bagKeys = ['neck','right','base','left','fold','gather'];
const bagViews = views(
  outline([-8,-61],bagKeys,[[-1,-65,4,-64,8,-61],[26,-45,45,-1,39,33],
    [36,70,1,82,-30,63],[-64,47,-57,13,-43,-17],[-31,-43,-19,-56,-13,-59],[-11,-60,-9,-60,-8,-61]]),
  outline([-8,-61],bagKeys,[[-1,-65,4,-64,8,-61],[26,-44,43,-3,39,33],
    [36,74,1,87,-33,67],[-66,50,-62,13,-47,-19],[-35,-45,-20,-56,-13,-59],[-11,-60,-9,-60,-8,-61]]),
  outline([-8,-61],bagKeys,[[-1,-65,4,-64,8,-61],[24,-44,39,-3,35,34],
    [32,73,-4,87,-36,65],[-70,46,-64,10,-48,-20],[-36,-45,-20,-56,-13,-59],[-11,-60,-9,-60,-8,-61]]),
);
export function characterModel(yaw: number) {
  const head = contourView(headViews, yaw), root = contourAnchor(head, 'earRoot', 1), s = Math.sin(yaw);
  const torso = contourView(torsoViews,yaw), tail = contourAnchor(torso,'hip',.8);
  return { head, muzzle: contourView(muzzleViews, yaw), torso, tailRoot: [tail[0]+14,tail[1]-2] as Point2, belly: contourView(bellyViews, yaw), bag: contourView(bagViews,yaw),
    // The front root follows the rear jaw; the profile exposes the full cup.
    nearEar: { contour: contourView(earViews,yaw), center: [root[0] - 15 - 18*s, root[1] + 31 - 33*s] as Point2 },
    farEar: { center: [101 * Math.cos(yaw) + 47*s, 31] as Point2,
      radius: [49 * Math.cos(yaw) ** 2, 53 * Math.cos(yaw) ** 2] as Point2 } };
}
