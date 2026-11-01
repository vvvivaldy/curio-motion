import type {Point2} from '../../core/spatial';
import type {CubicContour} from '../../core/contour';
import {contourView} from '../../core/views';
import {smooth} from '../../core/time';
/** These are three whole authored views of this adult, not an anatomy/style API.
 * Every feature uses the same view correspondence as the skull/jaw/hair volume.
 */
function outline(points:readonly Point2[]):CubicContour{
 return {start:points[0],curves:points.map((p,i)=>{const next=points[(i+1)%points.length],before=points[(i+points.length-1)%points.length],after=points[(i+2)%points.length];return{key:`view-edge-${i}`,c1:[p[0]+(next[0]-before[0])*.15,p[1]+(next[1]-before[1])*.15],c2:[next[0]-(after[0]-p[0])*.15,next[1]-(after[1]-p[1])*.15],to:next};})};
}
const mirroredOutline=(points:readonly Point2[]):Point2[]=>[points[0],...points.slice(1).reverse()].map(([x,y])=>[-x,y]);
const frontHead:Point2[]=[[0,-25],[14,-21],[20,-5],[20,4],[18,10],[12,20],[0,24],[-12,20],[-18,10],[-20,4],[-20,-5],[-14,-21]];
const rightHead:Point2[]=[[-2,-25],[14,-21],[18,-7],[25,3],[21,7],[18,18],[9,24],[-7,20],[-15,11],[-18,4],[-19,-9],[-14,-22]];
const frontHair:Point2[]=[[0,-26],[14,-23],[21,-13],[20,2],[16,0],[16,-11],[0,-10],[-16,-11],[-16,0],[-20,2],[-21,-13],[-14,-23]];
const rightHair:Point2[]=[[-2,-26],[13,-23],[20,-13],[19,-7],[15,-10],[7,-12],[-3,-9],[-14,-11],[-14,4],[-19,5],[-22,-12],[-14,-23]];
const headViews=[{at:-1,contour:outline(mirroredOutline(rightHead))},{at:0,contour:outline(frontHead)},{at:1,contour:outline(rightHead)}];
const hairViews=[{at:-1,contour:outline(mirroredOutline(rightHair))},{at:0,contour:outline(frontHair)},{at:1,contour:outline(rightHair)}];
interface View {eyes:readonly {center:Point2;alpha:number;brow:readonly [Point2,Point2]}[];ears:readonly {center:Point2;alpha:number}[];nose:readonly Point2[];mouth:readonly Point2[]}
const front:View={eyes:[{center:[-8,1],alpha:1,brow:[[-12,-5],[-5,-5.5]]},{center:[8,1],alpha:1,brow:[[5,-5.5],[12,-5]]}],ears:[{center:[-19,5],alpha:1},{center:[19,5],alpha:1}],nose:[[0,-1],[-1,7],[3,8]],mouth:[[-4,15.5],[0,16.3],[4,15.5]]};
const right:View={eyes:[{center:[9,0],alpha:1,brow:[[5,-5],[12,-4.5]]},{center:[17,-1],alpha:0,brow:[[14,-6],[19,-5]]}],ears:[{center:[-18,5],alpha:1},{center:[19,5],alpha:0}],nose:[[16,-1],[17,6],[20,7]],mouth:[[11,15],[15,15.5],[18,14.8]]};
const mirror=(p:Point2):Point2=>[-p[0],p[1]];
const left:View={eyes:[...right.eyes].reverse().map(e=>({...e,center:mirror(e.center),brow:[mirror(e.brow[1]),mirror(e.brow[0])]})),ears:[...right.ears].reverse().map(e=>({...e,center:mirror(e.center)})),nose:right.nose.map(mirror),mouth:[...right.mouth].reverse().map(mirror)};
export function humanFace(yaw:number){
 const view=yaw<0?left:right,u=smooth(Math.abs(yaw)),point=(a:Point2,b:Point2):Point2=>[a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u],value=(a:number,b:number)=>a+(b-a)*u;
 return{head:contourView(headViews,yaw),hair:contourView(hairViews,yaw),eyes:front.eyes.map((e,i)=>({center:point(e.center,view.eyes[i].center),alpha:value(e.alpha,view.eyes[i].alpha),brow:[point(e.brow[0],view.eyes[i].brow[0]),point(e.brow[1],view.eyes[i].brow[1])] as [Point2,Point2]})),ears:front.ears.map((e,i)=>({center:point(e.center,view.ears[i].center),alpha:value(e.alpha,view.ears[i].alpha)})),nose:front.nose.map((p,i)=>point(p,view.nose[i])),mouth:front.mouth.map((p,i)=>point(p,view.mouth[i]))};
}
