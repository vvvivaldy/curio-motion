/** One shared plan/consumer; only the permitted body-lean option differs. */
import{Graphics,Text,Container}from'pixi.js';
import type{SceneDefinition}from'../../core/stage';
import{createRunPlan}from'../../core/run';
import{affineProject,type AffineView}from'../../core/frame3';
import{drawSpatialCat}from'../cat-picture-story/spatial-controls';
import{runProbeCat}from'./scene';
export const runAngleCases=[20,22.5,25].map(degrees=>({degrees,plan:createRunPlan({upper:30,lower:27,soleToAnkle:8,start:.5,duration:4,ramp:.5,forwardLean:degrees*Math.PI/180})}));
export function runAnglePose(time:number){return{time,actors:runAngleCases.map(({degrees,plan},i)=>{const p=runProbeCat(plan,time),scale=1.65,yaw=-.38,cx=210+i*430;return{...p,degrees,view:{yaw,elevation:0,scale,origin:[cx-Math.cos(yaw)*p.sample.station*scale,610]}as AffineView};})};}
function text(root:Container,copy:string,x:number,y:number,size=20){const t=new Text({text:copy,style:{fontFamily:'Arial, sans-serif',fontSize:size,fill:0x253a38}});t.position.set(x,y);root.addChild(t);return t;}
export const runAngleScene:SceneDefinition<ReturnType<typeof runAnglePose>,{paper:Graphics;phase:Text}>={settings:{width:1280,height:720,fps:24,durationInFrames:120,background:0xe7eee7},pose:runAnglePose,
 createDrawing(root){const paper=new Graphics();root.addChild(paper);text(root,'Наклон в беге · одинаковые шаги и торможение',40,30,27);for(let i=0;i<3;i++)text(root,`${runAngleCases[i].degrees.toString().replace('.',',')}°`,180+i*430,106,27);const phase=text(root,'',40,662,18);return{paper,phase};},
 draw({paper:g,phase},p){g.clear();p.actors.forEach((actor,i)=>{const cx=210+i*430,left=cx-185,right=cx+185;g.moveTo(left,610).lineTo(right,610).stroke({color:0x758f83,width:2});for(let s=Math.floor((actor.sample.station-130)/25)*25;s<=actor.sample.station+130;s+=25){const pt=affineProject([s,0,0],actor.view);if(pt[0]>left&&pt[0]<right)g.moveTo(pt[0],610).lineTo(pt[0],616).stroke({color:0xa3b2a4,width:1});}drawSpatialCat(g,actor.cat,actor.view);});const q=p.actors[0].sample;phase.text=`${p.time.toFixed(2)}с · ${q.phase==='flight'?'ПОЛЁТ':q.phase==='hold'?'ПОКОЙ':'ОПОРА'} · разгон → бег → два тормозных шага`;}
};
