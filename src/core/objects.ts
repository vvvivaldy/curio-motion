import {Container,Graphics,Text,type TextStyleOptions} from 'pixi.js';
import {localPoint,type LocalFrame2D,type Point2} from './spatial';
import {checkContainment,checkOwnership,rectCorners,type GeometryCheck,type ObjectGeometry,type Rect2} from './relations';

export interface ObjectLabel {
  readonly id:string;readonly text:string;readonly region:string;
  readonly fontSize:number;readonly minFontSize:number;readonly padding?:number;
  readonly style?:Partial<TextStyleOptions>;
}
/** Fit by a real measurer (Pixi Text in the browser); never silently shrink below the author's bound. */
export function fitLabelSize(area:Rect2,maximum:number,minimum:number,measure:(size:number)=>{width:number;height:number}):number{
  rectCorners(area);
  if(![maximum,minimum].every(Number.isFinite)||minimum<=0||maximum<minimum)throw new RangeError('Positive ordered font sizes required');
  const fits=(size:number)=>{const m=measure(size);if(![m.width,m.height].every(Number.isFinite)||m.width<0||m.height<0)throw new RangeError('Finite text measurement required');return m.width<=area.width&&m.height<=area.height;};
  if(!fits(minimum))throw new RangeError('Label cannot fit at its minimum font size; change the object layout');
  if(fits(maximum))return maximum;
  let low=minimum,high=maximum;
  for(let i=0;i<16;i++){const mid=(low+high)/2;if(fits(mid))low=mid;else high=mid;}
  return low;
}

/** Each parent is one depth unit: art, labels and masks are occluded together. */
export function createIllustratedObject(root:Container,initial:ObjectGeometry){
  if(!initial.id.trim())throw new RangeError('Object id required');
  const container=new Container(),art=new Graphics();container.label=initial.id;container.addChild(art);root.addChild(container);
  let geometry=initial;
  const labels=new Map<string,{spec:ObjectLabel;text:Text;mask:Graphics;area:Rect2}>();
  const setFrame=(frame:LocalFrame2D)=>{
    localPoint([0,0],frame);geometry={...geometry,frame};
    container.position.set(...frame.origin);container.rotation=frame.angle;container.scale.set(frame.scale);
  };
  setFrame(initial.frame);
  function addLabel(spec:ObjectLabel){
    if(!spec.id.trim()||labels.has(spec.id)||!spec.text.trim())throw new RangeError('Unique label id and nonempty text required');
    const region=geometry.regions?.[spec.region];if(!region)throw new RangeError(`Missing label region: ${spec.region}`);
    const pad=spec.padding??2;if(!Number.isFinite(pad)||pad<0)throw new RangeError('Nonnegative label padding required');
    const area={x:region.x+pad,y:region.y+pad,width:region.width-pad*2,height:region.height-pad*2};
    const text=new Text({text:spec.text,style:{fontFamily:'Arial, sans-serif',fontWeight:'bold',fill:0x272b28,...spec.style,fontSize:spec.fontSize}});
    const mask=new Graphics();
    try{
      const size=fitLabelSize(area,spec.fontSize,spec.minFontSize,size=>{text.style.fontSize=size;const b=text.bounds;return {width:b.width,height:b.height};});
      text.style.fontSize=size;const b=text.bounds;
      text.position.set(area.x+(area.width-b.width)/2-b.x,area.y+(area.height-b.height)/2-b.y);
      mask.rect(region.x,region.y,region.width,region.height).fill(0xffffff);
      container.addChild(text,mask);text.mask=mask;labels.set(spec.id,{spec,text,mask,area});
    }catch(error){text.destroy();mask.destroy();throw error;}
    return text;
  }
  function inspectLabels():GeometryCheck[]{
    return [...labels].flatMap(([id,{spec,text,area}])=>{
      const b=text.bounds;
      // Text.bounds is the intrinsic glyph rectangle. getLocalBounds includes mask
      // effects and cached parent-relative mask bounds, so it cannot measure overflow.
      // toGlobal includes the Text's rotation, scale, pivot, skew and actual ancestry.
      const vertices:Point2[]=rectCorners({x:b.x,y:b.y,width:b.width,height:b.height}).map(([x,y])=>{const p=text.toGlobal({x,y});return [p.x,p.y];});
      const region:Point2[]=rectCorners(area).map(([x,y])=>{const p=container.toGlobal({x,y});return [p.x,p.y];});
      const fit=checkContainment(`${geometry.id}/${id}/fit`,vertices,region);
      return [checkOwnership(`${geometry.id}/${id}/owner`,geometry.id,text.parent===container?container.label:null),
        {...fit,message:`${fit.message}; glyph local [${b.x},${b.y},${b.width},${b.height}]; world vertices ${JSON.stringify(vertices)}; owner ${JSON.stringify(region)}`},
        {relation:`${geometry.id}/${id}/size`,status:(Number(text.style.fontSize)>=spec.minFontSize?'pass':'fail') as 'pass'|'fail',message:`Measured font ${text.style.fontSize}px; minimum ${spec.minFontSize}px`}];
    });
  }
  return {container,art,addLabel,setFrame,inspectLabels,get geometry(){return geometry;}};
}
