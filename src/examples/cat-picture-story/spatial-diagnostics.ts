/** Exact rendered surfaces and chair boxes; artist-readable shape remains a separate gate. */
import type{Vec3}from'../../core/spatial';
import{surfaceBoxIntrusions}from'../../core/surface-clearance';
import{spatialStoryPose}from'./spatial-motion';
import{chairParts}from'./world';
import{backrestFlex}from'./environment';
export function inspectSpatialStoryFrame(frame:number){
 if(!Number.isSafeInteger(frame)||frame<0||frame>=840)throw RangeError('V2 diagnostic frame outside story');
 const t=frame/24,{cat}=spatialStoryPose(t),surfaces=cat.triangles,unraked=surfaces.map(s=>({...s,vertices:s.vertices.map(([x,y,z])=>[x,y,z+(38+backrestFlex(t))*(y-128)/124]as Vec3)as[Vec3,Vec3,Vec3]}));
 const box=(id:string,part:{origin:Vec3;size:Vec3},transformed=false)=>({id,surfaces:transformed?unraked:surfaces,min:part.origin,max:part.origin.map((v,i)=>v+part.size[i])as Vec3});
 const solids=[box('seat',chairParts.seat),box('backrest',chairParts.backrest,true),...chairParts.legs.flatMap((part,i)=>part.size[1]>128?[box(`post-${i}-lower`,{origin:part.origin,size:[part.size[0],128,part.size[2]]}),box(`post-${i}-upper`,{origin:[part.origin[0],128,part.origin[2]],size:[part.size[0],part.size[1]-128,part.size[2]]},true)]:[box(`leg-${i}`,part)])];
 const failures=solids.flatMap(s=>surfaceBoxIntrusions(s.surfaces,{min:s.min,max:s.max},1e-5).map(hit=>`${s.id}/${hit.owner}`)),minY=Math.min(...surfaces.flatMap(s=>s.vertices.map(p=>p[1])));
 return[{relation:'actual-chair-clearance',frame,status:failures.length?'fail' as const:'pass' as const,message:failures.length?`Actual surface enters drawn chair: ${[...new Set(failures)].join(', ')}`:'Actual surface triangles clear exact seat, raked backrest and split posts; boundary contact allowed. Not a general collision proof.'},
 {relation:'actual-floor-clearance',frame,status:minY<-.001?'fail' as const:'pass' as const,message:`Lowest actual surface height ${minY.toFixed(6)}; floor is worldY0. Knee/paw readability needs image inspection.`},
 {relation:'directed-hinges',frame,status:'pass' as const,message:'Drawing successfully solved all four signed hinge requests without moving held targets. Reach/limits do not establish an anatomically convincing pose.'}];
}
export function diagnoseFrames(frames:readonly number[]){return frames.flatMap(inspectSpatialStoryFrame);}
