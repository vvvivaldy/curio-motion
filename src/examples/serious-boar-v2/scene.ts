import {Container,Graphics,Text} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {withGraphicsFrame} from '../../core/graphics-frame';
import {createIllustratedObject} from '../../core/objects';
import {contour,line,drawPackage,packageGeometry,packageNames,ink,fur,lightFur,coat,happyMouth,happyEye,drawCaterpillar,seatedUpperOffset,nearEarTip,warningLayout,handContour} from './model';
import {boarPose,pile,pileGeometry,pileArrival,type BoarPose} from './motion';
import {seriousBoarV2Settings} from './settings';
import type {Point2} from '../../core/spatial';
import {checkContainment,rectCorners} from '../../core/relations';
const text=(root:Container,value:string,x:number,y:number,size:number,color:number,weight:'normal'|'bold'='bold')=>{const t=new Text({text:value,style:{fontFamily:'Arial',fontSize:size,fontWeight:weight,fill:color}});t.position.set(x,y);root.addChild(t);return t;};
function environment(g:Graphics,savanna:boolean){g.clear();
 if(savanna){g.rect(0,0,1280,720).fill(0xf3dfae);g.rect(0,0,1280,290).fill(0xf5e9c9);g.circle(1060,108,55).fill(0xfff5cf);g.moveTo(0,400).bezierCurveTo(320,320,500,440,740,360).bezierCurveTo(920,310,1040,355,1280,322).lineTo(1280,720).lineTo(0,720).closePath().fill(0xc8bd7f);g.moveTo(0,520).bezierCurveTo(440,440,750,510,1280,450).lineTo(1280,720).lineTo(0,720).closePath().fill(0xe1c282);
  // Acacia has a broad canopy and a real supporting trunk behind the seated body.
  g.moveTo(391,654).bezierCurveTo(425,553,419,407,423,279).lineTo(388,216).lineTo(412,197).lineTo(449,266).lineTo(499,193).lineTo(520,205).lineTo(467,307).bezierCurveTo(458,450,451,558,477,654).closePath().fill(0x756344).stroke({color:ink,width:3});
  g.moveTo(421,289).lineTo(305,198).lineTo(319,180).lineTo(438,248).lineTo(616,160).lineTo(629,179).lineTo(459,295).closePath().fill(0x756344).stroke({color:ink,width:2});
  for(const [x,y,rx,ry] of [[250,172,145,47],[400,125,180,59],[560,139,160,56],[675,180,113,34],[352,181,170,40]])g.ellipse(x,y,rx,ry).fill(0x667b48).stroke({color:0x4e633d,width:2});
  for(const [x,y] of [[127,588],[850,562],[1018,670],[300,682],[798,643],[60,669],[1180,592]])line(g,[[x-10,y],[x-4,y-19],[x,y],[x+7,y-27],[x+10,y],[x+20,y-13]],0x8d8a4c,2);
  g.ellipse(587,658,209,25).fill({color:0x90764b,alpha:.19});return;
 }
 g.rect(0,0,1280,720).fill(0xc9ded7);g.rect(0,0,1280,612).fill(0xd4e8e0);
 // City is a muted drawn view through the whole shop windows.
 for(let i=0;i<15;i++){const x=i*93-30,y=265+(i%4)*22;g.rect(x,y,77,295-y+180).fill(i%2?0xc4d1bb:0xbacbb8);for(let row=0;row<4;row++)for(let col=0;col<4;col++)g.rect(x+8+col*16,y+12+row*23,7,12).fill(0xd7dfc5);}
 g.rect(0,475,1280,137).fill({color:0xe1e9d3,alpha:.63});
 for(const x of [24,427,847,1260]){g.rect(x,0,15,620).fill(0xa2b6ae).stroke({color:0x829c93,width:2});g.rect(x+3,0,4,612).fill(0xe3efe8);}
 g.moveTo(132,0).lineTo(212,0).lineTo(585,612).lineTo(520,612).closePath().fill({color:0xf8ffed,alpha:.2});
 g.rect(0,610,1280,17).fill(0x71867d);g.rect(0,627,1280,93).fill(0xc3b098);
 for(let row=0;row<3;row++)for(let col=0;col<16;col++){const x=col*95-row*20,y=638+row*29;g.moveTo(x,y).lineTo(x+67,y).lineTo(x+50,y+15).lineTo(x-13,y+15).closePath().fill((row+col)%3===0?0x795b48:0xe4d7be);}
 g.roundRect(1101,187,171,434,2).fill(0xa4946b).stroke({color:ink,width:3});for(const y of [308,444,577])g.rect(1092,y,180,10).fill(0x625845);g.rect(1100,619,173,9).fill(0x625845);
}
function hoof(g:Graphics,x:number,y:number,width=48){g.moveTo(x-width/2,y-18).quadraticCurveTo(x-14,y-30,x+8,y-24).lineTo(x+width/2,y-10).lineTo(x+width/2+3,y).lineTo(x-width/2,y).closePath().fill(0x3f3d32).stroke({color:ink,width:2.5});line(g,[[x+6,y-20],[x+7,y]],0x8b8570,1.5);}
function hand(g:Graphics,p:Point2,hold:boolean){const [x,y]=p;contour(g,handContour(p),lightFur,2.4);for(let i=0;i<3;i++)line(g,[[x-1+i*5,y-8],[x+1+i*5,y+3]],0x5b4437,1.4);if(hold)g.moveTo(x-10,y+1).quadraticCurveTo(x+1,y-8,x+6,y-1).stroke({color:ink,width:2,cap:'round'});}
function head(g:Graphics,p:BoarPose){
 // Hair, ears, heavy jaw and long muzzle form one whole boar silhouette.
 g.moveTo(-62,-273).lineTo(-71,-294).lineTo(-58,-291).lineTo(-68,-315).lineTo(-51,-307).lineTo(-52,-328).lineTo(-36,-315).lineTo(-23,-332).lineTo(-14,-315).bezierCurveTo(21,-334,62,-314,69,-285).bezierCurveTo(77,-276,98,-271,118,-273).bezierCurveTo(149,-269,151,-237,125,-227).lineTo(82,-223).bezierCurveTo(57,-194,12,-192,-11,-215).bezierCurveTo(-35,-221,-58,-244,-62,-273).closePath().fill(fur).stroke({color:ink,width:3});
 // Upper near ear: upright, pointed, with an inset cup.
 g.moveTo(-44,-281).bezierCurveTo(-62,-287,-81,-319,...nearEarTip).bezierCurveTo(-49,-344,-25,-326,-24,-304).closePath().fill(lightFur).stroke({color:ink,width:2.7});g.moveTo(-47,-300).quadraticCurveTo(-65,-311,-66,-332).quadraticCurveTo(-43,-325,-38,-307).closePath().fill(0x6e4942);
 g.moveTo(7,-308).quadraticCurveTo(11,-335,36,-339).quadraticCurveTo(44,-322,36,-306).closePath().fill(fur).stroke({color:ink,width:2});
 // Broad flat nose at the end of the snout; clearly paired nostrils.
 g.ellipse(129,-251,22,23).fill(0xb98c79).stroke({color:ink,width:2.5});g.ellipse(123,-252,4,7).fill(0x483a32);g.ellipse(137,-250,4,7).fill(0x483a32);g.moveTo(112,-267).quadraticCurveTo(125,-274,139,-267).stroke({color:0xd6aa8b,width:2});
 // Tusks emerge from the same lower jaw.
 g.moveTo(86,-229).quadraticCurveTo(95,-215,105,-237).quadraticCurveTo(105,-216,91,-214).quadraticCurveTo(81,-214,79,-226).closePath().fill(0xf1e4bd).stroke({color:ink,width:2});
 g.moveTo(57,-220).quadraticCurveTo(61,-202,76,-224).quadraticCurveTo(72,-202,60,-201).quadraticCurveTo(48,-204,49,-218).closePath().fill(0xf3e8c7).stroke({color:ink,width:2});
 const happy=p.satisfied>0;
 if(happy){g.moveTo(...happyEye.start).quadraticCurveTo(...happyEye.control,...happyEye.end).stroke({color:ink,width:3.8,cap:'round'});const mouth=happyMouth(p.chew);if(p.chew>0){g.moveTo(...mouth.start).quadraticCurveTo(...mouth.control,...mouth.end).quadraticCurveTo(mouth.control[0],mouth.control[1]+p.chew*12,...mouth.start).closePath().fill(0x4e372b);}g.moveTo(...mouth.start).quadraticCurveTo(...mouth.control,...mouth.end).stroke({color:ink,width:3.4,cap:'round'});g.ellipse(38,-249,13,6).fill({color:0xbe8a75,alpha:.45});}
 else{g.moveTo(20,-278).quadraticCurveTo(36,-284,54,-270).quadraticCurveTo(40,-258,23,-266).closePath().fill(0xf4e9ce).stroke({color:ink,width:1.6});g.ellipse(44,-272,4.5,7).fill(0x332b24);g.moveTo(17,-285).quadraticCurveTo(37,-288,58,-276).stroke({color:ink,width:6,cap:'round'});g.moveTo(61,-233).quadraticCurveTo(82,-238,107,-237).stroke({color:ink,width:3,cap:'round'});}
 for(const [x,y] of [[-20,-265],[-10,-252],[0,-240]])line(g,[[x,y],[x+12,y+6]],0x503f35,1.4);
}
function character(g:Graphics,p:BoarPose){g.clear();withGraphicsFrame(g,p.actor,()=>{
 // Tail stays behind the opaque coat.
 withGraphicsFrame(g,{origin:[0,p.seated?seatedUpperOffset:0],angle:0,scale:1},()=>{g.moveTo(-71,-105).bezierCurveTo(-113,-103,-125,-132,-108,-140).bezierCurveTo(-94,-145,-92,-127,-105,-125).stroke({color:fur,width:8,cap:'round'});});
 if(p.seated){contour(g,p.legs[0].contour,0x565945);hoof(g,...p.feet[0],44);contour(g,p.legs[1].contour,0x686951);hoof(g,...p.feet[1],53);line(g,[[29,-22],[122,-43],[145,-51]],0x424b3a,2);}
 else {contour(g,p.legs[0].contour,0x4f5140);hoof(g,...p.feet[0]);contour(g,p.legs[1].contour,0x5d604a);hoof(g,...p.feet[1]);}
 contour(g,p.farArm.contour,0xab9b72);hand(g,p.farHand,true);
 // The seated torso settles over a horizontal thigh; arms already use that lowered shoulder frame.
 withGraphicsFrame(g,{origin:[0,p.seated?seatedUpperOffset:0],angle:0,scale:1},()=>{
 g.moveTo(-23,-233).bezierCurveTo(-66,-237,-91,-202,-91,-147).lineTo(-86,-91).quadraticCurveTo(-23,-63,47,-95).bezierCurveTo(59,-126,51,-180,30,-212).closePath().fill(coat).stroke({color:ink,width:3});
 g.moveTo(-12,-222).lineTo(16,-219).lineTo(43,-105).lineTo(7,-98).closePath().fill(0x6b5a41).stroke({color:ink,width:2});g.moveTo(-16,-225).lineTo(-39,-199).lineTo(-13,-175).lineTo(-8,-207).lineTo(11,-182).lineTo(23,-208).closePath().fill(0xe0d3aa).stroke({color:ink,width:2});
 line(g,[[-75,-114],[-41,-101],[-27,-132]],0x8b7f5d,2);line(g,[[-82,-91],[-19,-77],[44,-94]],0x8d7f59,2);for(const y of [-163,-141,-119])g.circle(17,y,2.5).fill(ink);
 head(g,p);});contour(g,p.nearArm.contour,coat);line(g,[[p.nearHand[0]-21,p.nearHand[1]-12],[p.nearHand[0]-18,p.nearHand[1]+12]],0x8a7b55,3);hand(g,p.nearHand,true);

 });}
function cartFrame(g:Graphics,p:BoarPose,front:boolean){g.clear();withGraphicsFrame(g,p.cart,()=>{
 if(!front){g.ellipse(82,48,161,13).fill({color:0x3a4936,alpha:.15});for(const x of [-9,189]){g.circle(x,30,19).fill(0x4d5750).stroke({color:ink,width:2});g.circle(x,30,8).fill(0xc2c8b6);}line(g,[[-63,-8],[-31,19],[193,19],[220,-101]],0x5c726a,7);line(g,[[-128,-118],[-94,-105],[-59,-15]],0x607a73,8);line(g,[[-139,-118],[-116,-118]],0x6aa7ab,10);line(g,[[-93,-106],[225,-106],[199,-5],[-56,-5],[-93,-106]],0x657b72,6);}
 else{for(let i=0;i<14;i++){const a=i/13;line(g,[[-87+310*a,-104],[-55+254*a,-6]],0x66867c,2.2);}for(const y of [-81,-57,-32])line(g,[[-83+(y+104)*.32,y],[225-(y+104)*.26,y]],0x68867b,2.2);line(g,[[-93,-106],[225,-106]],0x3f6159,6);}
 });}
export function createDrawing(root:Container){
 const bg=new Graphics();root.addChild(bg);const shelf=new Container();root.addChild(shelf);
 const shelfObjects=Array.from({length:6},(_,i)=>{const obj=createIllustratedObject(shelf,packageGeometry(`shelf-${i}`,{origin:[1132+(i%2)*78,302+Math.floor(i/2)*135],angle:0,scale:.65}));drawPackage(obj.art,i%4);obj.addLabel({id:'name',text:packageNames[i%4],region:'label',fontSize:13,minFontSize:10,padding:3});return obj;});
 const warning=new Container();root.addChild(warning);const rule=text(warning,'правило: не купишь сейчас —',warningLayout.rule.x,warningLayout.rule.y,warningLayout.rule.size,ink,'normal');rule.style.fontStyle='italic';text(warning,'заплатишь',warningLayout.first.x,warningLayout.first.y,warningLayout.first.size,0xb62d25);text(warning,'больше !!!',warningLayout.second.x,warningLayout.second.y,warningLayout.second.size,0xb62d25);const underline=new Graphics().moveTo(65,warningLayout.underlineY).lineTo(477,warningLayout.underlineY).stroke({color:0xb62d25,width:5,cap:'round'});warning.addChild(underline);
 const rear=new Graphics();root.addChild(rear);const load=new Container();root.addChild(load);
 const packages=pile.map((a,i)=>{const obj=createIllustratedObject(load,packageGeometry(`load-${i}`,{origin:[0,0],angle:0,scale:1}));drawPackage(obj.art,a.kind);obj.addLabel({id:'name',text:packageNames[a.kind],region:'label',fontSize:13,minFontSize:10,padding:3});return obj;});
 const front=new Graphics(),body=new Graphics();root.addChild(front,body);
 const snack=createIllustratedObject(root,packageGeometry('snack',{origin:[0,0],angle:0,scale:1}));drawPackage(snack.art,4);snack.addLabel({id:'name',text:'ГУСЕНИЦЫ',region:'label',fontSize:13,minFontSize:10,padding:3});
 // Foreground hand is repainted over the pack only where the authored grip closes.
 const grip=new Graphics();root.addChild(grip);
 const inspectWarning=()=>warning.children.filter(c=>c instanceof Text).map((t,i)=>{const b=t.getLocalBounds();return checkContainment(`warning/text-${i}-fit`,rectCorners({x:t.x+b.x,y:t.y+b.y,width:b.width,height:b.height}),rectCorners(warningLayout.area));});
 return {bg,shelf,shelfObjects,warning,inspectWarning,rear,packages,front,body,snack,grip,lastEnvironment:''};
}
type Drawing=ReturnType<typeof createDrawing>;
export const seriousBoarV2Scene:SceneDefinition<BoarPose,Drawing>={settings:seriousBoarV2Settings,pose:boarPose,createDrawing,draw(d,p){
 const outdoor=p.location==='savanna';if(d.lastEnvironment!==p.location){environment(d.bg,outdoor);d.lastEnvironment=p.location;}d.shelf.visible=!outdoor;d.warning.visible=!outdoor&&p.warning>0;d.warning.alpha=p.warning;
 cartFrame(d.rear,p,false);cartFrame(d.front,p,true);for(let i=0;i<d.packages.length;i++){const obj=d.packages[i];obj.setFrame(pileGeometry(p,i).frame);obj.container.visible=outdoor||p.time>=pileArrival(i);}
 character(d.body,p);d.body.visible=outdoor||p.time>=4.1;
 d.snack.container.visible=outdoor;d.snack.setFrame(p.packet.frame);d.grip.clear();if(outdoor)withGraphicsFrame(d.grip,p.actor,()=>{hand(d.grip,p.farHand,true);hand(d.grip,p.nearHand,true);if(p.foodVisible)drawCaterpillar(d.grip,p.food,p.foodLength);});
}};
