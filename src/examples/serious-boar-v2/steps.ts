import {sampleFootsteps,supportBalance} from '../../core/gait';
import type {Step2D} from '../../core/contacts';
import {localPoint,inverseTransformPoint,type Point2} from '../../core/spatial';
import {solvePlanarLimb,fitVerticalShift} from '../../core/kinematics';
import {sampleTravel} from '../../core/time';
import {limbShape} from '../../core/limb';
const floor=649;
const step=(start:number,end:number,from:number,to:number,lift=22):Step2D=>({start,end,from:[from,floor],to:[to,floor],lift,fromHeading:0,toHeading:0});
const farApproach=Array.from({length:4},(_,i)=>step(4.45+i*.9,4.7+i*.9,-224+i*132,-224+(i+1)*132));
const nearApproach=Array.from({length:4},(_,i)=>step(4.75+i*.9,5+i*.9,-137+i*132,-137+(i+1)*132));
function pushing(initial:number,phase:number){return Array.from({length:8},(_,i)=>step(9.75+phase+i*.735,9.98+phase+i*.735,initial+i*132,initial+(i+1)*132,21));}
export const farSteps:readonly Step2D[]=[...farApproach,...pushing(304,0)];
export const nearSteps:readonly Step2D[]=[...nearApproach,...pushing(391,.25)];
/** Ground contacts stay in shop/world coordinates, independently of the actor's weight shift. */
export function walkingPose(time:number){
 const samples=[sampleFootsteps(time,farSteps,.16),sampleFootsteps(time,nearSteps,.16)] as const;
 const support=supportBalance(samples);
 const approach=sampleTravel(time,{start:4.1,end:8.05,ramp:.3});
 const push=sampleTravel(time,{start:9.45,end:15.58,ramp:.25});
 const nominalX=-168+528*approach.progress+1056*push.progress;
 const nominalVelocity=528*approach.velocity+1056*push.velocity;
 const weightShift=5*Math.tanh((support.center[0]+12.5-nominalX)/45);
 const desiredY=650-Math.max(...samples.map(s=>s.height))/24+.8*samples.reduce((sum,s,i)=>sum+s.compression*support.weights[i],0);
 const roots:readonly Point2[]=[[-44,-132],[11,-132]];
 const actorX=nominalX+weightShift;
 const verticalFit=fitVerticalShift(roots.map((root,i)=>({root:[actorX+root[0],desiredY+root[1],0],target:[samples[i].position[0],samples[i].position[1]-18,0],reach:122.6})),0);
 const actor={origin:[actorX,desiredY+verticalFit] as Point2,angle:0,scale:1};
 const feet=samples.map(s=>inverseTransformPoint(s.position,actor)) as [Point2,Point2];
 const legs=feet.map((foot,i)=>{const ankle:Point2=[foot[0],foot[1]-18];const solved=solvePlanarLimb(roots[i],ankle,62,61,{bendSide:-1,endAngle:Math.PI/2,wristRange:[-1.65,1.65],minFlexion:.16});return limbShape(roots[i],solved.joint,ankle,i===0?[49,37,30]:[51,39,32]);}) as [ReturnType<typeof limbShape>,ReturnType<typeof limbShape>];
 return {actor,feet,legs,samples,support,nominalX,nominalVelocity,weightShift,verticalFit,worldSoles:feet.map(p=>localPoint(p,actor))};
}
