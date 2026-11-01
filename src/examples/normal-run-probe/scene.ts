/** QA motion control: accepted cat drawing plus a neutral different-proportion rig.
 * Both consume exactly the same opt-in normal-run plan. No story edits or new anatomy. */
import{Graphics,Text,Container}from'pixi.js';
import type{SceneDefinition}from'../../core/stage';
import{createRunPlan}from'../../core/run';
import{runningUpperArm}from'../../core/arm-motion';
import{mix,smooth}from'../../core/time';
import{affineProject,pointInFrame3,type AffineView}from'../../core/frame3';
import{solveHingeLimb}from'../../core/hinge';
import type{Vec3}from'../../core/spatial';
import{buildSpatialCat,pitchedFrame,relaxedHand,spatialCatRunArm}from'../cat-picture-story/spatial-model';
import{drawSpatialCat}from'../cat-picture-story/spatial-controls';
export const probePlans={cat:createRunPlan({upper:30,lower:27,soleToAnkle:8,start:.5,duration:4,ramp:.5}),proportion:createRunPlan({upper:40,lower:24,soleToAnkle:10,start:.5,duration:4,ramp:.5})};
const camera=(station:number,cx:number):AffineView=>({yaw:.38,elevation:.16,scale:1.8,origin:[cx-Math.cos(.38)*station*1.8,610+Math.sin(.38)*station*.16*1.8]});
export function runProbeCat(plan:ReturnType<typeof createRunPlan>,time:number){const q=plan.sample(time),upper=mix(-.3,q.pitch,q.envelope),roll=mix(.18,.32,smooth(q.envelope/.3)),body=pitchedFrame([q.station,q.height,0],Math.PI/2,q.pitch),feet=q.feet.map((f,i)=>[f.station,f.height,i?12:-12]as Vec3)as[Vec3,Vec3];
 return{sample:q,cat:buildSpatialCat({body,headYaw:0,headPitch:-.5*q.pitch,feet,hands:[relaxedHand(body,0,runningUpperArm(upper,-q.armSwing,spatialCatRunArm.upper,spatialCatRunArm.backDepth,spatialCatRunArm.referenceSwing),q.elbowFlexion,0,roll),relaxedHand(body,1,runningUpperArm(upper,q.armSwing,spatialCatRunArm.upper,spatialCatRunArm.backDepth,spatialCatRunArm.referenceSwing),q.elbowFlexion,0,-roll)],shoulderYaw:[0,0],shoulderRoll:[roll,-roll],hipYaw:[0,0],footYaw:[Math.PI/2,Math.PI/2]}),view:camera(q.station,320)};}
function controlPose(time:number){const q=probePlans.proportion.sample(time),body=pitchedFrame([q.station,q.height,0],Math.PI/2,q.pitch),feet=q.feet.map((f,i)=>[f.station,f.height,i?12:-12]as Vec3)as[Vec3,Vec3];
 const legs=feet.map((foot,i)=>{const frame={...body,origin:pointInFrame3(body,[i?-12:12,0,0])};const solved=solveHingeLimb({frame,rootLocal:[0,0,0],targetWorld:[foot[0],foot[1]+10,foot[2]],upper:40,lower:24,normalLocal:[1,0,0],bendSign:1,signedFlexionRange:[.07,2.65],planeTolerance:1e-7});if(solved.status!=='solved')throw Error(`Control leg${i}: ${solved.reason}`);return solved;});
 const arms=([0,1]as const).map(i=>{const angle=mix(-.3,q.pitch,q.envelope)+(i?q.armSwing:-q.armSwing),root=pointInFrame3(body,[i?-27:27,46,0]),joint=pointInFrame3(body,[i?-27:27,46-32*Math.cos(angle),32*Math.sin(angle)]),end=pointInFrame3(body,[i?-27:27,46-32*Math.cos(angle)-29*Math.cos(angle+q.elbowFlexion),32*Math.sin(angle)+29*Math.sin(angle+q.elbowFlexion)]);return{root,joint,end};});
 return{sample:q,body,feet,legs,arms,view:camera(q.station,960)};}
export const normalRunProbePose=(time:number)=>({time,cat:runProbeCat(probePlans.cat,time),control:controlPose(time)});
function label(root:Container,text:string,x:number,y:number,size=18){const t=new Text({text,style:{fontFamily:'Arial, sans-serif',fontSize:size,fill:0x253a38}});t.position.set(x,y);root.addChild(t);return t;}
function line(g:Graphics,points:Vec3[],view:AffineView,color:number,width:number){const p=points.map(v=>affineProject(v,view));g.moveTo(...p[0]);for(const q of p.slice(1))g.lineTo(...q);g.stroke({color,width,cap:'round',join:'round'});}
function ground(g:Graphics,view:AffineView,station:number){for(let x=Math.floor((station-160)/40)*40;x<station+160;x+=40)line(g,[[x,0,-80],[x,0,80]],view,0x9eaea0,1);line(g,[[station-170,0,0],[station+170,0,0]],view,0x758f83,2);}
export const normalRunProbeScene:SceneDefinition<ReturnType<typeof normalRunProbePose>,{paper:Graphics;phase:Text}>={settings:{width:1280,height:720,fps:24,durationInFrames:120,background:0xe7eee7},pose:normalRunProbePose,
 createDrawing(root){const paper=new Graphics();root.addChild(paper);label(root,'Обычный бег · проверочная проба',40,30,26);label(root,'Принятый персонаж',190,88,21);label(root,'Контроль: другие пропорции ног',780,88,21);label(root,'30 + 27',270,123,15);label(root,'40 + 24 · тот же план',850,123,15);const phase=label(root,'',45,660,18);return{paper,phase};},
 draw({paper:g,phase},p){g.clear();ground(g,p.cat.view,p.cat.sample.station);drawSpatialCat(g,p.cat.cat,p.cat.view);ground(g,p.control.view,p.control.sample.station);const c=p.control,v=c.view;for(const i of[1,0]){const color=i?0x8a9c9b:0x354d4e;line(g,[c.legs[i].root,c.legs[i].joint,c.legs[i].end],v,color,11);const foot=c.feet[i],profile=[[-9,0],[-10,4],[-5,10],[3,11],[8,6],[18,3],[19,0]].map(([x,y])=>affineProject([foot[0]+x*1.25,foot[1]+y*1.25,foot[2]],v));g.poly(profile.flat()).fill(color);line(g,[c.arms[i].root,c.arms[i].joint,c.arms[i].end],v,color,9);}line(g,[c.body.origin,pointInFrame3(c.body,[0,46,0])],v,0x354d4e,17);const head=affineProject(pointInFrame3(c.body,[0,72,0]),v);g.circle(...head,26).fill(0x354d4e);phase.text=`${p.time.toFixed(2)}с · ${p.cat.sample.phase==='flight'?'ПОЛЁТ':p.cat.sample.phase==='hold'?'ПАУЗА':'ОПОРА'} · разгон → бег → торможение`;}
};
