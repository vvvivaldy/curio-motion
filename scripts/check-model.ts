import assert from 'node:assert/strict';
import { contourView } from '../src/core/views';
import { mapContour, cubicPoint, type CubicContour } from '../src/core/contour';
import { stairSolid, stairPanel } from '../src/core/stair-solid';
import { treadPoint } from '../src/core/contacts';
import { characterModel } from '../src/examples/pink-monkey/model';
import { footShape } from '../src/examples/pink-monkey/feet';
import type { Point2 } from '../src/core/spatial';
const a: CubicContour = { start: [0,0], curves: [
  {key:'out',c1:[10,-20],c2:[30,-20],to:[40,0]},
  {key:'back',c1:[30,20],c2:[10,20],to:[0,0]},
] };
const b = mapContour(a,p => [p[0]*2+90,p[1]*.5-17]);
const c = mapContour(a,p => [p[0]*.5-83,p[1]*3+23]);
const views = [{at:-2,contour:a},{at:.7,contour:b},{at:5,contour:c}];
assert.deepEqual(contourView(views,-20),a);
assert.deepEqual(contourView(views,.7),b);
assert.deepEqual(contourView(views,50),c);
assert.deepEqual(contourView([{at:3,contour:a}],-100),a);
assert.notEqual(contourView(views,-20),a);
for (const at of [-2,.7,5]) {
  const l=contourView(views,at-1e-5),r=contourView(views,at+1e-5);
  assert(Math.hypot(l.start[0]-r.start[0],l.start[1]-r.start[1])<1e-7,'view boundary must ease without a pop');
}
assert.throws(()=>contourView([],0));
assert.throws(()=>contourView(views,NaN));
assert.throws(()=>contourView([...views].reverse(),1));
assert.throws(()=>contourView([{at:0,contour:a},{at:1,contour:{...b,curves:[...b.curves].reverse()}}],.5));
for (const run of [35,147,280]) for (const rise of [0,19,85]) for (const depth of [[-71,-22],[13,-40]] as Point2[]) {
  const stairs={origin:[73,-20] as Point2,run,rise};
  for (const index of [-3,0,8]) {
    const s=stairSolid(stairs,index,depth);
    assert.deepEqual(s.tread[0],treadPoint(stairs,index));
    assert.deepEqual(s.tread[1],treadPoint(stairs,index,1));
    assert.equal(s.tread[0][1],s.tread[1][1]);
    assert.deepEqual(s.riser[0],s.tread[1]);
    assert.deepEqual(s.riser[1],stairSolid(stairs,index+1,depth).tread[0]);
  }
  const panel=stairPanel(stairs,-2,7,depth,125);
  assert.equal(panel[0][1]-panel[3][1],125);
  assert.equal(panel[1][1]-panel[2][1],125);
}
assert.throws(()=>stairSolid({origin:[0,0],run:10,rise:2},0,[0,0]));
assert.deepEqual(stairPanel({origin:[0,0],run:10,rise:2},0,1,[0,0],3),[[0,0],[10,-2],[10,-5],[0,-3]]);
assert.throws(()=>stairPanel({origin:[0,0],run:10,rise:2},2,1,[1,1],3));
const cross=(a:Point2,b:Point2,c:Point2)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const winding:number[]=[];
for (let n=0;n<=192;n++) {
  const model=characterModel(n/192*Math.PI/2);
  for(const side of [-1,1]) {
    const foot=footShape(side,n/192*Math.PI/2).contour, index=foot.curves.findIndex(c=>c.key==='sole');
    const a=foot.curves[index-1].to,b=foot.curves[index].to;
    assert(a[0]>0&&b[0]<0&&a[1]===13&&b[1]===13,'drawn sole must include the unchanged contact anchor');
  }
  for (const [shapeIndex,contour] of [model.head,model.muzzle,model.torso,model.belly,model.bag,model.nearEar.contour,...[-1,1].map(side=>footShape(side,n/192*Math.PI/2).contour)].entries()) {
    const points=contour.curves.flatMap((curve,i,curves)=>Array.from({length:12},(_,j)=>
      cubicPoint(i===0?contour.start:curves[i-1].to,curve,j/12)));
    const area=points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
    if(shapeIndex===2) {
      const inside=(p:Point2)=>points.reduce((hit,a,i)=>{const b=points[(i+1)%points.length];return hit!==((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]);},false);
      assert(inside(model.tailRoot)&&inside([model.tailRoot[0]+6,model.tailRoot[1]+12]),'tail base must overlap the actual torso contour');
    }
    if(n===0)winding[shapeIndex]=Math.sign(area);
    assert(Math.abs(area)>300&&Math.sign(area)===winding[shapeIndex],'whole view must retain its winding and area');
    for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++) {
      if(i===0&&j===points.length-1)continue;
      const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];
      assert(!(cross(a,b,c)*cross(a,b,d)<-1e-8&&cross(c,d,a)*cross(c,d,b)<-1e-8),'intersecting whole view');
    }
  }
}
console.log('PASS authored whole-view interpolation, contour continuity and shared opaque stair geometry');
