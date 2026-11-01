/** QA profile, one selected22.5degree default and the exact accepted arm/head consumer. */
import{Graphics,Text}from'pixi.js';
import type{SceneDefinition}from'../../core/stage';
import{createRunPlan}from'../../core/run';
import{drawSpatialCat}from'../cat-picture-story/spatial-controls';
import{runProbeCat}from'./scene';
export const recoveryPlan=createRunPlan({upper:30,lower:27,soleToAnkle:8,start:.5,duration:4,ramp:.5});
export function recoveryPose(time:number){const p=runProbeCat(recoveryPlan,time);return{...p,time,view:{yaw:0,elevation:0,scale:2.5,origin:[600-2.5*p.sample.station,625]as[number,number]}};}
export const recoveryScene:SceneDefinition<ReturnType<typeof recoveryPose>,{paper:Graphics;phase:Text}>={settings:{width:1280,height:720,fps:24,durationInFrames:120,background:0xe7eee7},pose:recoveryPose,
createDrawing(root){const paper=new Graphics();root.addChild(paper);const title=new Text({text:'Бег 22,5° · замах локтя до линии спины',style:{fontFamily:'Arial, sans-serif',fontSize:27,fill:0x253a38}});title.position.set(40,30);root.addChild(title);const phase=new Text({text:'',style:{fontFamily:'Arial, sans-serif',fontSize:19,fill:0x253a38}});phase.position.set(40,665);root.addChild(phase);return{paper,phase};},
draw({paper:g,phase},p){g.clear();g.moveTo(80,625).lineTo(1200,625).stroke({color:0x758f83,width:2});for(let x=Math.floor((p.sample.station-200)/25)*25;x<p.sample.station+240;x+=25){const at=600+2.5*(x-p.sample.station);if(at>80&&at<1200)g.moveTo(at,625).lineTo(at,632).stroke({color:0xa3b2a4,width:1});}drawSpatialCat(g,p.cat,p.view);phase.text=`${p.time.toFixed(2)}с · ${p.sample.phase==='flight'?'ПОЛЁТ':p.sample.phase==='hold'?'ПОКОЙ':'ОПОРА'} · плечо → локоть назад → смена рук → торможение`;}};
