import {BlurFilter,Container,Graphics} from 'pixi.js';
import type {SceneDefinition} from '../../core/stage';
import {mapContour,type CubicContour} from '../../core/contour';
import {localPoint,type Point2} from '../../core/spatial';
import {humanPose} from '../human-chair/motion';
import {chair,type HumanPose} from '../human-chair/design';
import {humanChairPaperSettings} from './settings';
import {path,polygon,line,seed,shade,boneMarks,chairBackPanels} from './marks';
interface Piece{group:Container;shadow:Graphics;art:Graphics}
type Name='leg0'|'leg1'|'arm0'|'arm1'|'pelvis'|'body'|'head';
function piece(parent:Container,softness=1.8):Piece{const group=new Container(),shadow=new Graphics(),art=new Graphics();shadow.filters=[new BlurFilter({strength:softness,quality:3})];shadow.alpha=.18;shadow.position.set(2.4,2.1);group.addChild(shadow,art);parent.addChild(group);return{group,shadow,art};}
function cut(p:Piece,c:CubicContour,color:number){path(p.shadow,c).fill(0x4b4136);path(p.art,c).fill(color).stroke({color:0xf0e7d8,width:1.1,alignment:1,alpha:.48,join:'round'});}
function poly(p:Piece,points:readonly Point2[],color:number){cut(p,polygon(points),color);}
function clear(p:Piece){p.shadow.clear();p.art.clear();}
function drawChair(p:Piece){
 for(const [i,c] of chair.legs.entries())poly(p,c,i<2?0xb67d53:0x966544);
 // Thin connecting strip is its own paper face, at the original rail position.
 line(p.shadow,[[775,552],[871,552]],0x4b4136,5);line(p.art,[[775,552],[871,552]],0xbb875d,5);
 for(const [i,c] of chairBackPanels.entries())poly(p,c,[0x936047,0xb07b52,0xc69265][i]);
 poly(p,chair.side,0x9c684a);poly(p,chair.apron,0xbc865b);poly(p,chair.seat,0xd5a875);
 for(let i=0;i<16;i++){const x=762+i*6;line(p.art,[[x,505],[x+2.1,505.5]],0xf6d7a9,.55,.22);}
 for(let i=0;i<14;i++){const y=416+i*5.1;line(p.art,[[871,y],[871.4,y+2.0]],0xe4bd8c,.45,.26);}
 for(let i=0;i<10;i++)line(p.art,[[784+i*6,494],[786+i*6,493.7]],0xffe8be,.55,.24);
}
function drawHead(p:Piece,pose:HumanPose){const g=p.art,at=(q:Point2)=>localPoint(q,pose.headFrame),f=pose.face;
 for(const e of f.ears)if(e.alpha>0)g.ellipse(...at(e.center),4,6).fill({color:0xc49a73,alpha:e.alpha});
 cut(p,pose.head,0xdfb88e);
 const hair=mapContour(f.hair,at);path(g,hair).fill(0x3e4648).stroke({color:0x818780,width:.85,alignment:1,alpha:.6});
 for(const e of f.eyes)if(e.alpha>0){g.ellipse(...at(e.center),3.1,1.7).fill({color:0xf9f2de,alpha:e.alpha});g.circle(...at([e.center[0]+.5*pose.facing,e.center[1]]),1.1).fill({color:0x3b4140,alpha:e.alpha});line(g,e.brow.map(at),0x5a5044,1.55,e.alpha);}
 line(g,f.nose.map(at),0xb08360,1.1);g.moveTo(...at(f.mouth[0])).quadraticCurveTo(...at(f.mouth[1]),...at(f.mouth[2])).stroke({color:0x946c50,width:1.25,cap:'round'});
 // Quiet short fibers remain in head-local coordinates, away from eyes/mouth.
 for(let i=0;i<8;i++){const x=-8+seed('cheek',i)*10,y=10+seed('cheekY',i)*3;line(g,[at([x,y]),at([x+1.1,y+.15])],0xf7dbc0,.4,.3);}
}
interface Drawing{ground:Graphics;human:Container;parts:Record<Name,Piece>}
export const humanChairPaperScene:SceneDefinition<HumanPose,Drawing>={settings:humanChairPaperSettings,pose:humanPose,
 createDrawing(root){const page=new Graphics(),ground=new Graphics();root.addChild(page,ground);
  // Fixed fibers on the backing sheet; character pieces have their OWN fibers below.
  for(let i=0;i<480;i++){const x=seed('pageX',i)*1280,y=seed('pageY',i)*720;line(page,[[x,y],[x+1.8+seed('pageL',i)*2.5,y+.15]],0xc5baa5,.45,.10);}
  const seat=piece(root,2.2);drawChair(seat);const human=new Container();root.addChild(human);
  const names:Name[]=['leg0','leg1','arm0','arm1','pelvis','body','head'];const parts=Object.fromEntries(names.map(n=>[n,piece(human)])) as Record<Name,Piece>;return{ground,human,parts};
 },
 draw({ground,human,parts},p){ground.clear();line(ground,[[96,600],[1184,600]],0xb9ad99,1.2);
  for(const l of p.legs)if(l.planted)ground.ellipse(l.sole[0],l.sole[1]+1.3,24,2.0).fill({color:0x5c5344,alpha:.10});
  for(const part of Object.values(parts))clear(part);
  const {near,far}=p.depthOrder;
  const order:Name[]=[`leg${far}`,`arm${far}`,'pelvis',`leg${near}`,'body','head',`arm${near}`];for(const [i,n] of order.entries())human.setChildIndex(parts[n].group,i);
  for(const i of [0,1] as const){
   const l=p.legs[i],q=parts[`leg${i}`];q.shadow.alpha=.16+.025*l.cameraDepth;cut(q,l.shape.contour,shade(0x364a5b,0x4b6476,l.cameraDepth));boneMarks(q.art,l.shape,`leg${i}`,0xc7d2d0,'fiber');cut(q,l.foot,shade(0x414c4e,0x4b5554,l.cameraDepth));
   const d=p.headings?Math.cos(p.headings[i]):p.facing;line(q.art,[[l.sole[0]-8-24*Math.max(0,-d),l.sole[1]-1],[l.sole[0]+8+24*Math.max(0,d),l.sole[1]-1]],0xd2ccb8,1.7);
   const a=p.arms[i],r=parts[`arm${i}`];r.shadow.alpha=.16+.025*a.cameraDepth;cut(r,a.shape.contour,shade(0x537a73,0x78a095,a.cameraDepth));boneMarks(r.art,a.shape,`arm${i}`,0xd5e0cd,'fiber');cut(r,a.hand,shade(0xc69f78,0xdfb88e,a.cameraDepth));const at=(x:number,y:number)=>localPoint([x,y],a.handFrame);line(r.art,[at(-5,0),at(5,0)],0xb5c4ac,2.6);for(const [x,y,z] of [[0,14,21],[4,13,20]])line(r.art,[at(x,y),at(x===4?3:0,z)],0xa7815e,.7,(a.cameraDepth+1)/2);
  }
  const pelvis=parts.pelvis;pelvis.shadow.ellipse(p.hips[0],p.hips[1],24*(1+.12*p.frontView),12).fill(0x4b4136);pelvis.art.ellipse(p.hips[0],p.hips[1],24*(1+.12*p.frontView),12).fill(0x4b6476);
  const body=parts.body;cut(body,p.body,0x71968b);
  for(let i=0;i<120;i++){const x=-18+seed('shirtX',i)*36,y=8+seed('shirtY',i)*80;line(body.art,[p.bodyPoint(x,y),p.bodyPoint(x+1.2+seed('shirtL',i)*1.3,y+.25)],0xd9e0cd,.42,.20);}
  poly(body,[[-7,100],[-7,121],[7,121],[7,100]].map(([x,y])=>p.bodyPoint(x,y)),0xd5ab80);
  poly(body,[[-18,100],[-8,105],[0,94],[-7,87]].map(([x,y])=>p.bodyPoint(x,y)),0x9fb39e);poly(body,[[8,105],[18,100],[7,87],[0,94]].map(([x,y])=>p.bodyPoint(x,y)),0x9fb39e);
  line(body.art,[p.bodyPoint(p.facing*6,93),p.bodyPoint(p.facing*6+1,7)],0x4e776d,1.8,.7);for(const y of [68,43,18])body.art.circle(...p.bodyPoint(p.facing*6+1,y),1.4).fill(0xc8d1bc);
  drawHead(parts.head,p);
 }};
