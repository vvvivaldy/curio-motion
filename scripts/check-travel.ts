import assert from 'node:assert/strict';
import {sampleTravel,type TravelInterval} from '../src/core/time';
const near=(a:number,b:number,tolerance=1e-9)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
for(const spec of [
  {start:0,end:10,ramp:1},
  {start:-3,end:1,ramp:2}, // Two ramps meet, with no constant-speed interval.
  {start:100,end:100.75,ramp:.07},
  {start:-20,end:31,ramp:8.5},
] satisfies TravelInterval[]){
  const duration=spec.end-spec.start,vmax=1/(duration-spec.ramp),dt=duration*1e-6;
  assert.deepEqual(sampleTravel(spec.start-10,spec),{progress:0,velocity:0});
  assert.deepEqual(sampleTravel(spec.start,spec),{progress:0,velocity:0});
  assert.deepEqual(sampleTravel(spec.end,spec),{progress:1,velocity:0});
  assert.deepEqual(sampleTravel(spec.end+10,spec),{progress:1,velocity:0});
  near(sampleTravel(spec.start+spec.ramp,spec).progress,vmax*spec.ramp/2);
  near(sampleTravel(spec.end-spec.ramp,spec).progress,1-vmax*spec.ramp/2);
  for(const t of [spec.start,spec.start+spec.ramp,spec.end-spec.ramp,spec.end]){
    const left=sampleTravel(t-dt,spec),right=sampleTravel(t+dt,spec);
    assert(Math.abs(right.progress-left.progress)<=vmax*dt*2.01);
    assert(Math.abs(right.velocity-left.velocity)<=vmax*1e-6,'Velocity jumps at a travel boundary');
  }
  const snapshots=[];
  let previous=0,area=0;
  for(let i=0;i<=2000;i++){
    const t=spec.start+duration*i/2000,q=sampleTravel(t,spec);
    assert(Number.isFinite(q.progress)&&q.progress>=0&&q.progress<=1&&q.progress>=previous);
    assert(Number.isFinite(q.velocity)&&q.velocity>=0&&q.velocity<=vmax*(1+1e-12));
    previous=q.progress;snapshots.push(q);
    area+=q.velocity*duration/2000*(i===0||i===2000 ? .5 : 1);
    if(i>0&&i<2000){
      const derivative=(sampleTravel(t+dt,spec).progress-sampleTravel(t-dt,spec).progress)/(2*dt);
      near(derivative,q.velocity,Math.max(1,vmax)*1e-7);
    }
    if(t>=spec.start+spec.ramp&&t<=spec.end-spec.ramp)near(q.velocity,vmax);
  }
  near(area,1,1e-8);
  for(const i of [2000,1700,3,999,0,1900,3,2000])assert.deepEqual(sampleTravel(spec.start+duration*i/2000,spec),snapshots[i]);
}
for(const spec of [
  {start:0,end:1,ramp:0},{start:0,end:1,ramp:-1},{start:0,end:1,ramp:.50001},
  {start:2,end:2,ramp:.1},{start:2,end:1,ramp:.1},{start:NaN,end:1,ramp:.1},
  {start:0,end:Infinity,ramp:.1},{start:0,end:1,ramp:NaN},
  {start:-1e308,end:1e308,ramp:1},{start:0,end:1e-309,ramp:1e-310},
])assert.throws(()=>sampleTravel(0,spec),RangeError);
for(const time of [NaN,Infinity,-Infinity])assert.throws(()=>sampleTravel(time,{start:0,end:10,ramp:1}),RangeError);
console.log('PASS normalized travel: smooth speed ramps, constant cruise, endpoint holds, derivative/integral, independent seeks and invalid bounds');
