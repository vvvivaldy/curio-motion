import assert from 'node:assert/strict';
import { type Vec3, type Point2, project } from '../src/core/spatial';
import { solveTwoBone } from '../src/core/kinematics';
import { yawFrame3, composeFrame3, pointInFrame3, vectorInFrame3, vectorFromFrame3, validateFrame3,
  affineProject, affineDepth, affineUnprojectAtDepth, affineViewRay, facingSide, add3, scale3, type AffineView } from '../src/core/frame3';
import { solveHingeLimb, type HingeRequest } from '../src/core/hinge';
import { visibleTriangleFragments, type PaperTriangle3 } from '../src/core/paper-visibility';
const near=(a:readonly number[],b:readonly number[],epsilon=1e-8)=>assert(Math.hypot(...a.map((v,i)=>v-b[i]))<epsilon,JSON.stringify({a,b}));
const body=yawFrame3([3,4,5],Math.PI/2),shoulders=[pointInFrame3(body,[-16,49,0]),pointInFrame3(body,[16,49,0])];
near(vectorInFrame3(body,[0,0,1]),[1,0,0]);near(vectorInFrame3(body,[1,0,0]),[0,0,-1]);
const head=composeFrame3(body,yawFrame3([0,70,0],Math.PI/2));
near(vectorInFrame3(head,[0,0,1]),[0,0,-1]);near(head.origin,pointInFrame3(body,[0,70,0]));
assert.deepEqual(shoulders,[pointInFrame3(body,[-16,49,0]),pointInFrame3(body,[16,49,0])]);
near(vectorFromFrame3(body,vectorInFrame3(body,[2,-7,1])),[2,-7,1]);
assert.equal(facingSide(vectorInFrame3(yawFrame3([0,0,0],Math.PI),[0,0,1]),[0,0,1]),'back');
assert.throws(()=>validateFrame3({...body,x:scale3(body.x,-1)}),RangeError);
assert.throws(()=>validateFrame3({...body,y:[0,2,0]}),RangeError);
for(const yaw of [-Math.PI,-2,-.1,0,1,Math.PI,2*Math.PI])near(vectorInFrame3(yawFrame3([0,0,0],yaw),[0,0,1]),[Math.sin(yaw),0,Math.cos(yaw)]);

const request:HingeRequest={frame:yawFrame3([0,0,0],0),rootLocal:[0,0,0],targetWorld:[2,0,0],upper:Math.SQRT2,lower:Math.SQRT2,
  normalLocal:[0,0,1],bendSign:1,signedFlexionRange:[.2,2.4],planeTolerance:1e-8};
const forward=solveHingeLimb(request);assert.equal(forward.status,'solved');
if(forward.status==='solved'){near(forward.joint,[1,-1,0]);near([forward.signedFlexion],[Math.PI/2]);near(forward.end,request.targetWorld);}
assert.deepEqual(solveHingeLimb({...request,bendSign:-1}),{status:'blocked',reason:'joint-limit'});
const backward=solveHingeLimb({...request,bendSign:-1,signedFlexionRange:[-2.4,-.2]});
assert.equal(backward.status,'solved');if(backward.status==='solved')near(backward.joint,[1,1,0]);
// Old unsigned check cannot distinguish the mirrored branches: both have the same lengths/acos.
near(solveTwoBone([0,0,0],[2,0,0],Math.SQRT2,Math.SQRT2,[0,1,0]),[1,1,0]);
near(solveTwoBone([0,0,0],[2,0,0],Math.SQRT2,Math.SQRT2,[0,-1,0]),[1,-1,0]);
const turned=solveHingeLimb({...request,frame:body,targetWorld:pointInFrame3(body,[2,0,0])});
assert.equal(turned.status,'solved');if(turned.status==='solved'){near(turned.joint,pointInFrame3(body,[1,-1,0]));near([turned.signedFlexion],[Math.PI/2]);}
assert.deepEqual(solveHingeLimb({...request,targetWorld:[2,0,.1]}),{status:'blocked',reason:'off-plane'});
assert.deepEqual(solveHingeLimb({...request,targetWorld:[4,0,0]}),{status:'blocked',reason:'reach'});
assert.deepEqual(solveHingeLimb({...request,targetWorld:[0,0,0]}),{status:'blocked',reason:'singular'});
assert.throws(()=>solveHingeLimb({...request,normalLocal:[0,0,2]}),RangeError);
const straight={...request,upper:1,lower:1,signedFlexionRange:[0,2.4] as const};
assert.equal(solveHingeLimb(straight).status,'solved');
assert.deepEqual(solveHingeLimb({...straight,signedFlexionRange:[.01,2.4]}),{status:'blocked',reason:'joint-limit'});

const view:AffineView={yaw:0,elevation:.3,scale:1,origin:[0,0]};
near(affineProject([0,0,0],view),affineProject([0,.3,1],view));
assert(affineDepth([0,.3,1],view)>affineDepth([0,0,0],view));
assert.equal(facingSide([0,-1,0],affineViewRay(view)),'back');
assert.equal(facingSide([0,-1,0],[0,0,1]),'edge'); // Former horizontal-ray counterexample.
assert.equal(facingSide([0,0,1],affineViewRay(view)),'front');
for(const yaw of [-2,0,.38,Math.PI/2]){
  const v={...view,yaw,scale:2.3,origin:[619,512] as const},p:Vec3=[37,82,-91];
  near(affineUnprojectAtDepth(affineProject(p,v),affineDepth(p,v),v),p);
  near(affineProject(add3(p,scale3(affineViewRay(v),7)),v),affineProject(p,v));
}
assert.throws(()=>facingSide([0,0,0],[0,0,1]),RangeError);
// Older API remains its original world-Y convention, explicitly separate.
near(project([2,3,4],0),[2,3.32]);

const triangle=(id:string,vertices:[Vec3,Vec3,Vec3],coplanarRank=0):PaperTriangle3=>({id,owner:id,vertices,coplanarRank});
const flat:AffineView={yaw:0,elevation:0,scale:1,origin:[0,0]};
const a=[triangle('a0',[[-1,-1,0],[1,-1,0],[1,1,0]]),triangle('a1',[[-1,-1,0],[1,1,0],[-1,1,0]])];
const b=[triangle('b0',[[-1,-1,-1],[1,-1,1],[1,1,1]]),triangle('b1',[[-1,-1,-1],[1,1,1],[-1,1,-1]])];
const polygonArea=(p:Point2[])=>Math.abs(p.reduce((s,v,i)=>{const n=p[(i+1)%p.length];return s+v[0]*n[1]-n[0]*v[1];},0)/2);
const inside=(p:Point2,poly:Point2[])=>{
  const c=poly.map((v,i)=>{const n=poly[(i+1)%poly.length];return (n[0]-v[0])*(p[1]-v[1])-(n[1]-v[1])*(p[0]-v[0]);});
  return c.every(v=>v>=-1e-7)||c.every(v=>v<=1e-7);
};
const fragments=a.flatMap(t=>visibleTriangleFragments(t,b,flat,0));
assert(fragments.some(p=>inside([-.5,0],p)),'Left part must remain visible');
assert(!fragments.some(p=>inside([.5,0],p)),'Right part must be clipped inside the same detail');
near([fragments.reduce((s,p)=>s+polygonArea(p),0)],[2]);
const move:Vec3=[15,12,-31];
const shifted=(t:PaperTriangle3):PaperTriangle3=>({...t,vertices:t.vertices.map(p=>add3(p,move)) as [Vec3,Vec3,Vec3]});
near([a.flatMap(t=>visibleTriangleFragments(shifted(t),b.map(shifted),flat,0)).reduce((s,p)=>s+polygonArea(p),0)],[2]);
const reversed=b.map(t=>({...t,vertices:[t.vertices[2],t.vertices[1],t.vertices[0]] as [Vec3,Vec3,Vec3]}));
near([a.flatMap(t=>visibleTriangleFragments(t,reversed,flat,0)).reduce((s,p)=>s+polygonArea(p),0)],[2]);
const cover=triangle('cover',[[-5,-5,1],[5,-5,1],[0,5,1]]);
assert.equal(visibleTriangleFragments(a[0],[cover],flat).length,0);
const behind={...cover,vertices:cover.vertices.map(([x,y])=>[x,y,-1] as Vec3) as [Vec3,Vec3,Vec3]};
near([visibleTriangleFragments(a[0],[behind],flat).reduce((s,p)=>s+polygonArea(p),0)],[2]);
const coplanar={...a[0],id:'ink',coplanarRank:1};
assert.equal(visibleTriangleFragments(a[0],[coplanar],flat).length,0);
assert(visibleTriangleFragments(coplanar,[a[0]],flat).length>0);
assert.equal(visibleTriangleFragments(triangle('edge',[[0,-1,0],[0,1,0],[0,0,1]]),[],flat).length,0);
assert.throws(()=>visibleTriangleFragments(a[0],[],flat,-1),RangeError);
console.log('Spatial controls: rigid hierarchy, directed branch, true view ray and crossing-surface clipping PASS (geometry only)');
