import assert from 'node:assert/strict';
import {Graphics} from 'pixi.js';
import {withGraphicsFrame} from '../src/core/graphics-frame';
import {localPoint,type LocalFrame2D,type Point2} from '../src/core/spatial';
const g=new Graphics(),a:LocalFrame2D={origin:[137,281],angle:.3,scale:1.7},b:LocalFrame2D={origin:[29,-41],angle:-.6,scale:.4};
const p:Point2=[12,19],expected=localPoint(localPoint(p,b),a);
withGraphicsFrame(g,a,()=>{
 const parent=g.getTransform().clone();
 withGraphicsFrame(g,b,()=>{
  const actual=g.getTransform().apply({x:p[0],y:p[1]});
  assert(Math.hypot(actual.x-expected[0],actual.y-expected[1])<1e-9);
 });
 assert.deepEqual(g.getTransform(),parent);
 assert.throws(()=>withGraphicsFrame(g,b,()=>{throw Error('draw failure');}),/draw failure/);
 assert.deepEqual(g.getTransform(),parent);
});
assert.equal(g.getTransform().tx,0);assert.equal(g.getTransform().a,1);
assert.throws(()=>withGraphicsFrame(g,{...a,scale:0},()=>{}),RangeError);
g.destroy();console.log('PASS nested graphics frames, parent restoration and error cleanup');
