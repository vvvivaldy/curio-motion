import assert from 'node:assert/strict';
import {fitLabelSize} from '../src/core/objects';
import {checkContact,checkContainment,checkOwnership,checkClearance,objectAnchor,objectRegion,segmentDistance,type ObjectGeometry} from '../src/core/relations';
import {limbShape} from '../src/core/limb';
import {validateContour,cubicPoint} from '../src/core/contour';
const box:ObjectGeometry={id:'box',frame:{origin:[170,90],angle:.7,scale:1.4},anchors:{handle:[2,9]},regions:{label:{x:-40,y:-20,width:80,height:40}}};
const hand:ObjectGeometry={id:'hand',frame:{origin:objectAnchor({object:box,anchor:'handle'}),angle:0,scale:1},anchors:{grip:[0,0]}};
assert.equal(checkContact('grip',{object:hand,anchor:'grip'},{object:box,anchor:'handle'},1e-7).status,'pass');
assert.equal(checkContact('miss',{object:{...hand,frame:{...hand.frame,origin:[0,0]}},anchor:'grip'},{object:box,anchor:'handle'},1).status,'fail');
assert.throws(()=>objectAnchor({object:box,anchor:'missing'}),/Missing/);
const region=objectRegion(box,'label');
assert.equal(checkContainment('inside',[objectAnchor({object:box,anchor:'handle'})],region).status,'pass');
assert.equal(checkContainment('outside',[[900,900]],region).status,'fail');
assert.equal(checkOwnership('attached','box','box').status,'pass');
assert.equal(checkOwnership('orphan','box',null).status,'fail');
assert.equal(segmentDistance([[0,0],[10,10]],[[0,10],[10,0]]),0);
assert.equal(segmentDistance([[0,0],[10,0]],[[4,0],[15,0]]),0);
assert.equal(segmentDistance([[0,0],[0,0]],[[3,4],[3,4]]),5);
assert.equal(checkClearance('gap',[[0,0],[10,0]],[[0,3],[10,3]],4).status,'fail');
assert.equal(checkClearance('gap',[[0,0],[10,0]],[[0,3],[10,3]],3).status,'pass');
for(const width of [45,100,200]){
  const size=fitLabelSize({x:0,y:0,width,height:25},24,8,s=>({width:s*5,height:s}));
  assert(size>=8&&size<=24&&size*5<=width+1e-6&&size<=25);
}
assert.throws(()=>fitLabelSize({x:0,y:0,width:30,height:15},24,8,s=>({width:s*5,height:s})),/minimum/);
for(let i=0;i<80;i++){
  const angle=-1.4+i*.035,a:[number,number]=[0,0],b:[number,number]=[70,0],c:[number,number]=[70+80*Math.cos(angle),80*Math.sin(angle)];
  const shape=limbShape(a,b,c,[20,16,10]);validateContour(shape.contour);
  assert.deepEqual(shape.upper,[a,b]);assert.deepEqual(shape.lower,[b,c]);
  const points=shape.contour.curves.flatMap((curve,j,curves)=>Array.from({length:12},(_,k)=>cubicPoint(j===0?shape.contour.start:curves[j-1].to,curve,k/12)));
  const area=Math.abs(points.reduce((s,p,j)=>{const q=points[(j+1)%points.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
  assert(area>1200&&area<4000,'Limb silhouette collapsed');
}
assert.throws(()=>limbShape([0,0],[0,0],[1,1],[10,8,6]),/Nonzero/);
assert.throws(()=>limbShape([0,0],[70,0],[0,0],[10,8,6]),/overlap/);
console.log('PASS object ownership, rotated regions, contact/clearance, bounded text fit and shared limb silhouettes');
