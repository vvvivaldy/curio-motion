import {tween} from './time';

export interface HandlingSchedule {
  readonly grip: readonly [number, number];
  readonly load: readonly [number, number];
  readonly lift: readonly [number, number];
  readonly place: readonly [number, number];
  readonly unload: readonly [number, number];
  readonly release: readonly [number, number];
}

/** Explicit load handoff for an authored pickup/place. No clock, grasp planner or dynamics.
 * Complete grip precedes loading; landing completes before unloading/release.
 * The caller must still check actual hands, object and supporting surface geometry.
 */
export function sampleHandling(time:number,schedule:HandlingSchedule){
  const spans=[schedule.grip,schedule.load,schedule.lift,schedule.place,schedule.unload,schedule.release];
  if(!Number.isFinite(time)||spans.some(s=>s.length!==2||!s.every(Number.isFinite)||s[1]<=s[0])||
    spans.some((s,i)=>i>0&&s[0]<spans[i-1][1]))throw new RangeError('Ordered finite grip/load/lift/place/unload/release intervals required');
  const grip=tween(time,...schedule.grip)*(1-tween(time,...schedule.release));
  const handLoad=tween(time,...schedule.load)*(1-tween(time,...schedule.unload));
  const lifted=tween(time,...schedule.lift),placed=tween(time,...schedule.place);
  return {grip,handLoad,lifted,placed,surfaceLoad:1-handLoad,
    phase:time<schedule.grip[0]?'approach':time<schedule.load[0]?'grip':time<schedule.lift[0]?'load':
      time<schedule.lift[1]?'lift':time<schedule.place[0]?'carry':time<schedule.place[1]?'place':
        time<schedule.release[0]?'unload':time<schedule.release[1]?'release':'free'};
}

/** Horizontal projected balance of an authored body centre and payload.
 * ratio = payload/body mass. This is a staging aid, not a force or stability simulation.
 * Does not clamp to anatomy: the author must arrange reachable contacts and inspect the pose.
 */
export function balancePayload(supportX:number,payloadX:number,ratio:number):number{
  if(![supportX,payloadX,ratio].every(Number.isFinite)||ratio<0)throw new RangeError('Finite centres and nonnegative payload/body mass ratio required');
  const bodyX=supportX-ratio*(payloadX-supportX);
  if(!Number.isFinite(bodyX))throw new RangeError('Unrepresentable body centre');
  return bodyX;
}
