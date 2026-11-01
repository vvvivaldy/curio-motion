import type {CubicContour} from './contour';
import type {Point2} from './spatial';

export interface LimbShape {readonly contour:CubicContour;readonly root:Point2;readonly joint:Point2;readonly end:Point2;readonly upper:readonly [Point2,Point2];readonly lower:readonly [Point2,Point2]}
const add=(a:Point2,b:Point2,s:number):Point2=>[a[0]+b[0]*s,a[1]+b[1]*s];
/** One closed tapered silhouette around the same three points used by contact/IK checks.
 * Widths and anatomical styling are authored by the example; this is not an anatomy solver.
 */
export function limbShape(root:Point2,joint:Point2,end:Point2,widths:readonly [number,number,number],options:{readonly jointSmoothing?:number}={}):LimbShape{
  const smoothing=options.jointSmoothing??0;
  if(!Number.isFinite(smoothing)||smoothing<0||smoothing>1)throw new RangeError('Joint smoothing must be in 0..1');
  if(![...root,...joint,...end,...widths].every(Number.isFinite)||widths.some(w=>w<=0))throw new RangeError('Finite joints and positive limb widths required');
  const l1=Math.hypot(joint[0]-root[0],joint[1]-root[1]),l2=Math.hypot(end[0]-joint[0],end[1]-joint[1]);
  if(Math.min(l1,l2)<1e-6)throw new RangeError('Nonzero limb segments required');
  const u:Point2=[(joint[0]-root[0])/l1,(joint[1]-root[1])/l1],v:Point2=[(end[0]-joint[0])/l2,(end[1]-joint[1])/l2];
  const a:Point2=[-u[1],u[0]],b:Point2=[-v[1],v[0]],sum:Point2=[a[0]+b[0],a[1]+b[1]],n=Math.hypot(...sum);
  if(n<.05)throw new RangeError('Near-folded limb needs an authored overlap view');
  const m:Point2=[sum[0]/n,sum[1]/n];
  // Opt-in shared tangent at both sides of the joint. At 1 the adjoining cubic
  // derivatives are collinear; 0 preserves every existing example byte-for-byte.
  const tangent:Point2=[(u[0]+v[0])/n,(u[1]+v[1])/n];
  const incoming:Point2=[u[0]*(1-smoothing)+tangent[0]*smoothing,u[1]*(1-smoothing)+tangent[1]*smoothing];
  const outgoing:Point2=[v[0]*(1-smoothing)+tangent[0]*smoothing,v[1]*(1-smoothing)+tangent[1]*smoothing];
  const left=[add(root,a,widths[0]/2),add(joint,m,widths[1]/2),add(end,b,widths[2]/2)];
  const right=[add(root,a,-widths[0]/2),add(joint,m,-widths[1]/2),add(end,b,-widths[2]/2)];
  const contour:CubicContour={start:left[0],curves:[
    {key:'upperOuter',c1:add(left[0],u,l1*.4),c2:add(left[1],incoming,-l1*.22),to:left[1]},
    {key:'lowerOuter',c1:add(left[1],outgoing,l2*.22),c2:add(left[2],v,-l2*.35),to:left[2]},
    {key:'end',c1:add(left[2],v,widths[2]*.45),c2:add(right[2],v,widths[2]*.45),to:right[2]},
    {key:'lowerInner',c1:add(right[2],v,-l2*.35),c2:add(right[1],outgoing,l2*.22),to:right[1]},
    {key:'upperInner',c1:add(right[1],incoming,-l1*.22),c2:add(right[0],u,l1*.4),to:right[0]},
    {key:'root',c1:add(right[0],u,-widths[0]*.45),c2:add(left[0],u,-widths[0]*.45),to:left[0]},
  ]};
  return {contour,root:[...root],joint:[...joint],end:[...end],upper:[[...root],[...joint]],lower:[[...joint],[...end]]};
}

/** Constant-width straight bones with round caps and an outer round joint.
 * Unlike jointSmoothing this never bows a shaft to hide a bad pose.
 */
export function rigidLimbShape(root:Point2,joint:Point2,end:Point2,width:number):LimbShape{
  if(![...root,...joint,...end,width].every(Number.isFinite)||width<=0)throw new RangeError('Finite joints and positive limb width required');
  const lengths=[Math.hypot(joint[0]-root[0],joint[1]-root[1]),Math.hypot(end[0]-joint[0],end[1]-joint[1])];
  if(Math.min(...lengths)<1e-6)throw new RangeError('Nonzero limb segments required');
  const u:Point2=[(joint[0]-root[0])/lengths[0],(joint[1]-root[1])/lengths[0]],v:Point2=[(end[0]-joint[0])/lengths[1],(end[1]-joint[1])/lengths[1]];
  const a:Point2=[-u[1],u[0]],b:Point2=[-v[1],v[0]],dot=u[0]*v[0]+u[1]*v[1],turn=Math.atan2(u[0]*v[1]-u[1]*v[0],dot),r=width/2;
  if(1+dot<.01||r*Math.abs(Math.tan(turn/2))>=Math.min(...lengths)-1e-9*Math.max(...lengths))throw new RangeError('Folded limb requires a different view or pose');
  const m:Point2=[(a[0]+b[0])*r/(1+dot),(a[1]+b[1])*r/(1+dot)];
  const start=add(root,a,r),curves:CubicContour['curves'][number][]=[];
  let from=start;
  const line=(key:string,to:Point2)=>{curves.push({key,c1:add(from,[to[0]-from[0],to[1]-from[1]],1/3),c2:add(from,[to[0]-from[0],to[1]-from[1]],2/3),to});from=to;};
  const arc=(key:string,centre:Point2,normal:Point2,delta:number,final?:Point2)=>{
    const count=Math.max(1,Math.ceil(Math.abs(delta)/(Math.PI/2))),angle=Math.atan2(normal[1],normal[0]);
    for(let i=0;i<count;i++){
      const t0=angle+delta*i/count,t1=angle+delta*(i+1)/count,k=4/3*Math.tan((t1-t0)/4);
      const to:Point2=i===count-1&&final?final:[centre[0]+r*Math.cos(t1),centre[1]+r*Math.sin(t1)];
      curves.push({key:`${key}${i}`,c1:[from[0]-k*r*Math.sin(t0),from[1]+k*r*Math.cos(t0)],c2:[to[0]+k*r*Math.sin(t1),to[1]-k*r*Math.cos(t1)],to});from=to;
    }
  };
  if(turn<0){line('upperOuter',add(joint,a,r));arc('jointOuter',joint,a,turn,add(joint,b,r));}
  else line('upperOuter',add(joint,m,1));
  line('lowerOuter',add(end,b,r));arc('end',end,b,-Math.PI,add(end,b,-r));
  if(turn>0){line('lowerInner',add(joint,b,-r));arc('jointInner',joint,[-b[0],-b[1]],-turn,add(joint,a,-r));}
  else line('lowerInner',add(joint,m,-1));
  line('upperInner',add(root,a,-r));arc('root',root,[-a[0],-a[1]],-Math.PI,start);
  return {contour:{start,curves},root:[...root],joint:[...joint],end:[...end],upper:[[...root],[...joint]],lower:[[...joint],[...end]]};
}
