import assert from 'node:assert/strict';
import {rigidLimbShape} from '../src/core/limb';
import {fitPlanarPostureHeight,planarEndpoint,relativeAngle,solvePlanarLimb} from '../src/core/kinematics';
import {cubicPoint,validateContour,type CubicContour} from '../src/core/contour';
import type {Point2} from '../src/core/spatial';

const near=(a:number,b:number,tolerance=1e-7)=>assert(Math.abs(a-b)<tolerance,`${a} differs from ${b}`);
const distance=(a:Point2,b:Point2)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const cross=(a:Point2,b:Point2)=>a[0]*b[1]-a[1]*b[0];
const difference=(a:Point2,b:Point2):Point2=>[a[0]-b[0],a[1]-b[1]];
const sample=(contour:CubicContour)=>contour.curves.flatMap((curve,i)=>Array.from({length:16},(_,j)=>
  cubicPoint(i?contour.curves[i-1].to:contour.start,curve,j/16)));
const signedArea=(points:Point2[])=>points.reduce((sum,p,i)=>sum+cross(p,points[(i+1)%points.length]),0)/2;

// The public shape must describe the solved bones, with straight cubic shafts,
// circular outer joins/caps, finite closure and a reflected silhouette for either turn.
for(const joint of [[40,0],[40,15],[40,-15],[15,40],[15,-40]] as Point2[]) {
  const root:Point2=[0,0],end:Point2=[80,5],width=8,r=width/2;
  const before=structuredClone({root,joint,end}),shape=rigidLimbShape(root,joint,end,width);
  validateContour(shape.contour);
  assert.deepEqual({root,joint,end},before,'drawing mutates its solved inputs');
  assert.deepEqual(shape.upper,[root,joint]);assert.deepEqual(shape.lower,[joint,end]);
  const points=sample(shape.contour);assert(signedArea(points)<0,'contour winding changed');
  for(const [i,curve] of shape.contour.curves.entries()) {
    const from=i?shape.contour.curves[i-1].to:shape.contour.start;
    const shaft=curve.key.startsWith('upper')?[root,joint]:curve.key.startsWith('lower')?[joint,end]:null;
    if(shaft) {
      const axis=difference(shaft[1],shaft[0]),length=distance(shaft[0],shaft[1]);
      for(const p of [from,curve.c1,curve.c2,curve.to])near(Math.abs(cross(axis,difference(p,shaft[0])))/length,r);
      const line=difference(curve.to,from);
      near(cross(line,difference(curve.c1,from)),0);near(cross(line,difference(curve.c2,from)),0);
      near(distance(from,curve.c1),distance(from,curve.to)/3);
      near(distance(from,curve.c2),distance(from,curve.to)*2/3);
    } else {
      const centre=curve.key.startsWith('root')?root:curve.key.startsWith('end')?end:joint;
      const radius=difference(from,centre),tangent=difference(curve.c1,from);
      near(radius[0]*tangent[0]+radius[1]*tangent[1],0);
      for(let t=0;t<=1;t+=1/32)near(distance(cubicPoint(from,curve,t),centre),r,r*.0003);
    }
  }
  // Sampled proper intersections catch a closed but folded/self-crossing outline.
  for(let i=0;i<points.length;i++)for(let j=i+2;j<points.length;j++) {
    if(i===0&&j===points.length-1)continue;
    const a=points[i],b=points[(i+1)%points.length],c=points[j],d=points[(j+1)%points.length];
    assert(!(cross(difference(b,a),difference(c,a))*cross(difference(b,a),difference(d,a))<-1e-9&&
      cross(difference(d,c),difference(a,c))*cross(difference(d,c),difference(b,c))<-1e-9),'rigid contour intersects itself');
  }
  const mirror=(p:Point2):Point2=>[p[0],-p[1]];
  const mirrored=sample(rigidLimbShape(mirror(root),mirror(joint),mirror(end),width).contour);
  near(signedArea(points),signedArea(mirrored));
  for(const p of points)assert(Math.min(...mirrored.map(q=>distance(mirror(p),q)))<1e-7,'mirror silhouette differs');
}
const straight=sample(rigidLimbShape([0,0],[40,0],[100,0],10).contour);
near(Math.min(...straight.map(p=>p[0])),-5);near(Math.max(...straight.map(p=>p[0])),105);
near(Math.min(...straight.map(p=>p[1])),-5);near(Math.max(...straight.map(p=>p[1])),5);
for(const invalid of [0,-1,NaN,Infinity])assert.throws(()=>rigidLimbShape([0,0],[20,0],[20,20],invalid),RangeError);
for(const [root,joint,end,width] of [
  [[0,0],[0,0],[10,0],2],[[0,0],[10,0],[10,0],2],[[0,0],[10,0],[0,0],2],
  [[0,0],[10,0],[10,10],20],[[0,0],[10,0],[NaN,10],2]
] as [Point2,Point2,Point2,number][])assert.throws(()=>rigidLimbShape(root,joint,end,width),RangeError);

// Forward geometry and inverse solving agree for both branches, unequal lengths,
// rotated roots and deliberate rest bends; lengths and the actual contact stay fixed.
for(const [upper,lower] of [[30,70],[70,30],[50,50]])for(const bendSide of [-1,1] as const)
for(const angle of [-2.1,0,.7,Math.PI/2])for(const flexion of [0,.1,.8,2.2,Math.PI-.1]) {
  const root:Point2=[13,-7],target=planarEndpoint(root,upper,lower,angle,flexion,bendSide);
  const endAngle=angle-bendSide*flexion,original=structuredClone({root,target});
  const solved=solvePlanarLimb(root,target,upper,lower,{bendSide,endAngle,wristRange:[-.2,.2],minFlexion:0,maxFlexion:Math.PI});
  near(distance(root,solved.joint),upper);near(distance(solved.joint,target),lower);
  near(relativeAngle(solved.upperAngle,angle),0);near(solved.flexion,flexion);
  near(solved.wristBend,0);assert.deepEqual({root,target},original,'solver moves the held contact');
}
const root:Point2=[0,0],options={bendSide:1 as const,endAngle:-.8,wristRange:[-.2,.2] as const,minFlexion:.5,maxFlexion:1.1};
for(const flexion of [.5,1.1]) {
  const target=planarEndpoint(root,40,60,0,flexion,1);
  const solved=solvePlanarLimb(root,target,40,60,{...options,endAngle:-flexion});near(solved.flexion,flexion);
}
// A permitted zero-flexion boundary must also accept an exactly authored straight
// endpoint when decimal lengths/rotation expose roundoff in the inverse triangle.
const straightRest=planarEndpoint([13,-7],17.013,73.019,.071,0,1);
near(solvePlanarLimb([13,-7],straightRest,17.013,73.019,{...options,endAngle:.071,minFlexion:0,maxFlexion:0}).flexion,0);
for(const flexion of [.49,1.11]) {
  const target=planarEndpoint(root,40,60,0,flexion,1),copy=[...target];
  assert.throws(()=>solvePlanarLimb(root,target,40,60,{...options,endAngle:-flexion}),/joint limits/);
  assert.deepEqual(target,copy,'rejected contact was clamped');
}
const contact=planarEndpoint(root,40,60,0,.8,1);
assert.throws(()=>solvePlanarLimb(root,contact,40,60,{...options,endAngle:0}),/joint limits/);
for(const target of [[101,0],[19,0],[0,0]] as Point2[])assert.throws(()=>solvePlanarLimb(root,target,40,60,options),RangeError);
for(const patch of [{maxFlexion:.4},{maxFlexion:Math.PI+.1},{maxFlexion:NaN},{minFlexion:-1}])
  assert.throws(()=>solvePlanarLimb(root,contact,40,60,{...options,...patch}),RangeError);
for(const [upper,lower,angle,flexion,side] of [[0,1,0,.1,1],[1,-1,0,.1,1],[1,1,Infinity,.1,1],[1,1,0,-.1,1],[1,1,0,Math.PI+.1,1],[1,1,0,.1,0]])
  assert.throws(()=>planarEndpoint(root,upper,lower,angle,flexion,side as -1|1),RangeError);

const constraints=[
  {root:[0,0] as Point2,target:[0,10] as Point2,upper:5,lower:5,minFlexion:0,maxFlexion:Math.PI/2},
  {root:[0,0] as Point2,target:[0,8] as Point2,upper:3,lower:4,minFlexion:0,maxFlexion:Math.PI/2}
];
const before=structuredClone(constraints),upperShift=10-Math.sqrt(50);
near(fitPlanarPostureHeight(constraints,-100),1);near(fitPlanarPostureHeight(constraints,100),upperShift);
near(fitPlanarPostureHeight(constraints,2),2);
for(const desired of [-100,0,1,2,upperShift,100]) {
  const shift=fitPlanarPostureHeight(constraints,desired);
  for(const c of constraints) {
    const shifted:Point2=[c.root[0],c.root[1]+shift];assert(shifted[1]<=c.target[1]);
    const solution=solvePlanarLimb(shifted,c.target,c.upper,c.lower,{bendSide:1,endAngle:0,wristRange:[-Math.PI,Math.PI],minFlexion:c.minFlexion,maxFlexion:c.maxFlexion});
    assert(solution.flexion>=c.minFlexion-1e-7&&solution.flexion<=c.maxFlexion+1e-7);
    near(distance(shifted,solution.joint),c.upper);near(distance(solution.joint,c.target),c.lower);
  }
}
assert.deepEqual(constraints,before,'height fit mutates roots or supports');
const lateral={root:[0,2] as Point2,target:[3,10] as Point2,upper:3,lower:4,minFlexion:0,maxFlexion:Math.PI/2};
near(fitPlanarPostureHeight([lateral],-100),8-Math.sqrt(40));near(fitPlanarPostureHeight([lateral],100),4);
assert.throws(()=>fitPlanarPostureHeight([{...lateral,target:[8,10]}]),/lateral reach/);
assert.throws(()=>fitPlanarPostureHeight([constraints[0],{...constraints[0],target:[0,30]}]),/No common posture/);
const fixedHeight={root:[0,0] as Point2,target:[0,2] as Point2,upper:1,lower:1,minFlexion:0,maxFlexion:0};
assert.throws(()=>fitPlanarPostureHeight([fixedHeight,{...fixedHeight,target:[0,2.000000002]}]),/No common posture/,
  'a tiny gap between exact-height intervals is still no intersection');
assert.throws(()=>fitPlanarPostureHeight([{...fixedHeight,target:[0,0],maxFlexion:Math.PI}]),/nonzero target direction/,
  'a fully folded chosen height must remain usable by the planar solver');
assert.throws(()=>fitPlanarPostureHeight([]),RangeError);assert.throws(()=>fitPlanarPostureHeight(constraints,Infinity),RangeError);
for(const patch of [{upper:0},{lower:-1},{root:[NaN,0] as Point2},{minFlexion:-.1},{maxFlexion:-1},{minFlexion:1,maxFlexion:.5},{maxFlexion:Infinity}])
  assert.throws(()=>fitPlanarPostureHeight([{...lateral,...patch}]),RangeError);
console.log('PASS rigid straight shafts/round closed mirrored contours, planar forward/inverse branches and limits, unequal-length common posture heights');
