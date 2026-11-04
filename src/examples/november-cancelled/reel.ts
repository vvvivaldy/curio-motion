import {Container, Graphics, Text} from 'pixi.js';
import {cues} from './captions';
import {scene as pictures} from './scene';

export const scene={
 ...pictures,
 createDrawing(root:Container){
  const art=pictures.createDrawing(root);
  const captions=new Container(),panel=new Graphics();
  const words=new Text({text:'',style:{
   fontFamily:'Arial, sans-serif',fontWeight:'bold',fontSize:43,align:'center',
   fill:0xfff9ee,lineHeight:51,wordWrap:true,wordWrapWidth:574,
  }});
  words.anchor.set(.5);
  captions.position.set(350,1000);
  captions.addChild(panel,words);
  root.addChild(captions);
  return {art,captions,panel,words};
 },
 draw(state:{art:ReturnType<typeof pictures.createDrawing>;captions:Container;panel:Graphics;words:Text},time:number){
  pictures.draw(state.art,time);
  const cue=cues.find(item=>time>=item.start&&time<item.end);
  state.captions.visible=!!cue;
  if(!cue)return;
  if(state.words.text!==cue.text)state.words.text=cue.text;
  state.words.style.fill=cue.em?0xffd54f:0xfff9ee;
  const width=state.words.width+35,height=state.words.height+20;
  state.panel.clear().roundRect(-width/2+2,-height/2+5,width,height,14).fill({color:0x101425,alpha:.32})
   .roundRect(-width/2,-height/2,width,height,14).fill({color:0x181b30,alpha:.94});
  const reveal=Math.min(1,(time-cue.start)*14);
  state.captions.position.y=1004+Math.round(12*(1-reveal)**2);
 }
};
