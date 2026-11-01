import {Container,Graphics,Text} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {infographicPose,chart,type InfographicPose} from './motion';
import {deliveryData,formatDeliveryShare,findUniqueDeliveryMaximum} from './data';
import {deliveryInfographicSettings} from './settings';
export {deliveryInfographicSettings} from './settings';
interface Drawing {g:Graphics;title:Container;axes:Container;labels:Text[];values:Text[];shares:Text[];total:Container;max:Container}
const ink=0x18383e,muted=0x5b7478;
const maximumIndex=findUniqueDeliveryMaximum(deliveryData.categories);
function text(parent:Container,words:string,x:number,y:number,size:number,color:number=ink,bold=false,center=false){const t=new Text({text:words,style:{fontFamily:'Arial, sans-serif',fontSize:size,fontWeight:bold?'700':'400',fill:color}});t.position.set(x,y);if(center)t.anchor.set(.5,0);parent.addChild(t);return t;}
export const deliveryInfographicScene:SceneDefinition<InfographicPose,Drawing>={settings:deliveryInfographicSettings,pose:infographicPose,
 createDrawing(root){
  const g=new Graphics(),title=new Container(),axes=new Container(),total=new Container(),max=new Container();root.addChild(g,title,axes,total,max);
  text(title,deliveryData.title,72,47,49,ink,true);text(title,'Учебные данные · три пункта',74,113,23,muted);text(title,'Учебные данные; не реальная статистика',72,682,18,muted);
  text(axes,'доставки',125,197,18,muted);for(const value of [0,10,20,30]){const t=text(axes,String(value),98,chart.zero-10*value-10,18,muted);t.anchor.set(1,0);}
  const labels=deliveryData.categories.map((c,i)=>text(axes,c.label,chart.centers[i],573,25,ink,true,true));
  const values=deliveryData.categories.map((c,i)=>text(root,String(c.value),chart.centers[i],0,32,ink,true,true));
  const shares=deliveryData.categories.map((c,i)=>text(root,formatDeliveryShare(c.sharePercent),chart.centers[i],615,23,c.color,false,true));
  text(total,'Всего',1068,232,27,muted,false,true);text(total,String(deliveryData.total),1068,290,110,ink,true,true);text(total,'доставок',1068,439,26,muted,false,true);
  text(max,'Больше всего',maximumIndex===null?0:chart.centers[maximumIndex],181,18,0xb44f36,true,true);
  return {g,title,axes,labels,values,shares,total,max};
 },
 draw(d,q){const{g}=d;g.clear();g.rect(0,0,1280,720).fill(0xf6f3e9);d.title.alpha=q.title;d.axes.alpha=q.axis;
  for(const v of [0,10,20,30])g.moveTo(chart.left,chart.zero-10*v).lineTo(chart.right,chart.zero-10*v).stroke({color:0xcdd7d3,width:v?1.5:2,alpha:q.axis});
  g.roundRect(930,210,276,300,24).fill({color:0xe5e9de,alpha:q.totals});d.total.alpha=q.totals;
  for(const[b,i]of q.bars.map((b,i)=>[b,i]as const)){
   if(i===maximumIndex&&q.accent>0){g.roundRect(b.x-chart.width/2-9,chart.zero-b.height-9,chart.width+18,b.height+18,7).fill({color:b.color,alpha:.13*q.accent});g.rect(b.x-chart.width/2-6,chart.zero-b.height-6,chart.width+12,b.height+6).stroke({color:b.color,width:2.5,alpha:q.accent});}
   g.rect(b.x-chart.width/2,chart.zero-b.height,chart.width,b.height).fill(b.color);d.values[i].text=String(b.valueShown);d.values[i].y=chart.zero-b.height-43;d.values[i].alpha=q.growth>0?q.axis:0;d.shares[i].alpha=q.totals;
  }
  d.max.alpha=maximumIndex===null?0:q.accent;
 },
};
