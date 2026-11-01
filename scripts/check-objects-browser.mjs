import puppeteer from 'puppeteer-core';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
import {findTool} from './tools.mjs';
const folder='qa/objects-browser';await mkdir(folder,{recursive:true});
await writeFile(`${folder}/probe.html`,`<!doctype html><meta charset="utf-8"><style>body{margin:0;background:white}</style><script type="module">
import {Application} from 'pixi.js';
import {createIllustratedObject} from '/src/core/objects.ts';
const app=new Application();await app.init({width:500,height:350,background:0xffffff,autoStart:false,antialias:true,preserveDrawingBuffer:true,preference:'webgl'});app.stop();document.body.append(app.canvas);
const geometry={id:'carton',frame:{origin:[40,40],angle:0,scale:1},anchors:{handle:[0,30]},regions:{label:{x:10,y:10,width:160,height:40}}};
const back=createIllustratedObject(app.stage,geometry);back.art.rect(0,0,180,90).fill(0xd5b381);
const text=back.addLabel({id:'name',text:'MMMMMMMM',region:'label',fontSize:26,minFontSize:18,padding:2});
const front=createIllustratedObject(app.stage,{id:'front',frame:{origin:[110,30],angle:0,scale:1},anchors:{}});front.art.rect(0,0,140,120).fill(0xffffff);
const assert=(value,message)=>{if(!value)throw Error(message);};
function white(x,y,w,h){const c=document.createElement('canvas');c.width=500;c.height=350;const ctx=c.getContext('2d');ctx.drawImage(app.canvas,0,0);return ctx.getImageData(x,y,w,h).data.every((v,i)=>i%4===3||v===255);}
app.render();assert(back.inspectLabels().every(r=>r.status==='pass'),'Initial measured label audit');assert(white(120,52,80,22),'Rear label leaked over opaque foreground object');
let overflowRejected=false;try{back.addLabel({id:'too-large',text:'A long required name',region:'label',fontSize:30,minFontSize:30});}catch(e){overflowRejected=/minimum/.test(e.message);}assert(overflowRejected,'Unreadable shrinking must be rejected');
window.probe={back,front,text,app,white,assert,results:{occlusion:true,measuredFit:true,minSizeRejection:true}};
document.documentElement.dataset.ready='1';
</script>`);
const server=await createServer({server:{host:'127.0.0.1',port:0,open:false}});let browser;
try{
  await server.listen();const port=server.httpServer.address().port;
  browser=await puppeteer.launch({executablePath:findTool('chrome'),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();await page.setViewport({width:500,height:350,deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/${folder}/probe.html`);
  try {await page.waitForFunction(()=>document.documentElement.dataset.ready==='1');}
  catch(error){throw new Error(`Browser probe did not start: ${errors.join('; ') || error.message}`);}
  await page.screenshot({path:`${folder}/occlusion.png`});
  await page.evaluate(()=>{
    const p=window.probe;p.front.container.visible=false;p.text.text='MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM';p.app.render();
    p.assert(p.back.inspectLabels().some(r=>r.relation.endsWith('/fit')&&r.status==='fail'),'Overflow was not diagnosed');
    p.assert(p.white(224,55,100,20),'Mask failed to contain edited label pixels');p.results.maskedOverflow=true;
    p.text.text='MMMMMMMM';p.app.render();p.app.stage.addChild(p.text);p.assert(p.back.inspectLabels().some(r=>r.relation.endsWith('/owner')&&r.status==='fail'),'Orphan not diagnosed');
    p.back.container.addChild(p.text);p.assert(p.back.inspectLabels().every(r=>r.status==='pass'),'Repaired owner still fails: '+JSON.stringify({checks:p.back.inspectLabels(),local:p.text.getLocalBounds(),intrinsic:p.text.bounds,position:{x:p.text.x,y:p.text.y},transform:p.text.localTransform}));p.results.orphanDetection=true;
    const bounds=p.text.bounds,original={x:p.text.x,y:p.text.y};
    p.results.repairedBounds={glyph:{x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height},checks:p.back.inspectLabels()};
    // Audit the actual Text transform, independently of rendering/mask bounds caches.
    const fit=()=>p.back.inspectLabels().find(r=>r.relation.endsWith('/fit'));
    p.text.rotation=.3;p.assert(fit().status==='fail','Text rotation overflow was not diagnosed');
    p.text.rotation=0;p.text.pivot.set(80,0);p.assert(fit().status==='fail','Text pivot overflow was not diagnosed');
    p.text.pivot.set(0,0);p.text.skew.set(0,.4);p.assert(fit().status==='fail','Text skew overflow was not diagnosed');
    p.text.pivot.set(bounds.x+bounds.width/2,bounds.y+bounds.height/2);p.text.position.set(90,30);p.text.scale.set(.5);p.text.rotation=.15;p.text.skew.set(.08,-.04);
    p.assert(fit().status==='pass','Centered transformed Text should fit');
    p.text.scale.set(2);p.assert(fit().status==='fail','Text scale overflow was not diagnosed');
    p.text.pivot.set(0,0);p.text.position.set(original.x,original.y);p.text.scale.set(1);p.text.rotation=0;p.text.skew.set(0,0);
    p.assert(fit().status==='pass','Restored intrinsic Text did not fit');p.results.ownTextTransforms=true;
    p.back.setFrame({origin:[240,120],angle:.55,scale:1.25});p.app.render();
    p.assert(p.back.inspectLabels().every(r=>r.status==='pass'),'Rotated/scaled measured label fails');p.results.rotatedScale=true;
  });
  await page.screenshot({path:`${folder}/rotated.png`});
  const results=await page.evaluate(()=>window.probe.results);
  if(errors.length)throw Error(errors.join('; '));
  await writeFile(`${folder}/results.json`,JSON.stringify({results,pageErrors:errors,method:'Actual Pixi/WebGL pixels and Text bounds; clipping, ownership and depth. No artistic score.'},null,2));
  console.log('PASS actual label fit, unreadable-size rejection, parent ownership, opaque occlusion, clipped overflow, own Text transforms and rotated scaling');
}finally{await browser?.close();await server.close();}
