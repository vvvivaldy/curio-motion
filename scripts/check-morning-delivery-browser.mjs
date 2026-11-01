import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import puppeteer from 'puppeteer-core';
import {findTool} from './tools.mjs';
import {sourceSnapshot} from './lib/authoring.mjs';

await mkdir('qa/stage2/native', {recursive:true});
const source=await sourceSnapshot();
const errors=[],consoleErrors=[],httpErrors=[],imageRequests=[];
const hash=png=>createHash('sha256').update(Buffer.from(png,'base64')).digest('hex');
let server,browser;
try{
  server=await createServer({server:{host:'127.0.0.1',port:0,open:false}});await server.listen();
  const base=`http://127.0.0.1:${server.httpServer.address().port}`;
  browser=await puppeteer.launch({executablePath:findTool('chrome'),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  async function open(key){
    const page=await browser.newPage();await page.setViewport({width:1280,height:720,deviceScaleFactor:1});
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text());});
    page.on('response',r=>{if(r.status()>=400)httpErrors.push({url:r.url(),status:r.status()});});
    page.on('request',r=>{if(r.resourceType()==='image')imageRequests.push(r.url());});
    await page.goto(`${base}/?example=${key}`);
    await page.waitForFunction(()=>document.documentElement.dataset.ready==='1',{polling:100,timeout:60000});
    return page;
  }
  const pilot=await open('morning-delivery'),courier=await open('raccoon-courier'),chart=await open('delivery-infographic');
  async function capture(page,frame){return page.evaluate(frame=>{
    const q=window.demo.render(frame);return{pose:q.pose,png:document.querySelector('canvas').toDataURL('image/png').split(',')[1]};
  },frame);}
  const comparisons=[];
  const courierFrames=[8,48,83,98,108,110,114,116,126,128,138,154,161,168,178,182,187,193,198,204,207,212,216,220,228,230,238,244,252,264,284,307,320,334,340,348,356,368,375];
  const chartFrames=[8,17,32,35,72,102,126,154,162,180,216,252,279,287];
  for(const [kind,page,offset,frames]of[['courier',courier,72,courierFrames],['infographic',chart,504,chartFrames]]){
    for(const frame of frames){
      const expected=await capture(page,frame),actual=await capture(pilot,offset+frame);
      assert.equal(actual.pose.opacity,1);
      assert.equal(hash(actual.png),hash(expected.png),`Altered native child pixels ${kind}#${frame}`);
      comparisons.push({kind,localFrame:frame,globalFrame:offset+frame,sha256:hash(actual.png)});
    }
  }
  // Inspect actual rendered actor pixels, not a root/foot station or image-edge flag.
  const empty=await capture(courier,383),emptyHash=hash(empty.png),visibility=[];
  let lastVisible=null,firstEmpty=null;
  for(let frame=320;frame<=383;frame++){
    const actual=await capture(courier,frame),visible=hash(actual.png)!==emptyHash;
    visibility.push({frame,visible});
    if(visible){lastVisible=frame;await writeFile('qa/stage2/native/last-visible.png',Buffer.from(actual.png,'base64'));}
    else if(lastVisible!==null&&firstEmpty===null){firstEmpty=frame;await writeFile('qa/stage2/native/first-empty.png',Buffer.from(actual.png,'base64'));}
  }
  assert(lastVisible!==null&&firstEmpty===lastVisible+1,'Whole-actor exit is not a single observed boundary');
  assert(visibility.filter(r=>r.frame>lastVisible).every(r=>!r.visible));
  const controls=[0,12,36,60,69,70,71,72,73,77,120,170,210,226,240,254,279,292,324,379,
    72+lastVisible,72+firstEmpty,453,454,455,456,457,480,501,502,503,504,505,576,606,630,684,720,768,789,790,791,792,793,828,852,863];
  for(const frame of [...new Set(controls)].sort((a,b)=>a-b)){
    const {png}=await capture(pilot,frame);
    await writeFile(`qa/stage2/native/f${String(frame).padStart(6,'0')}.png`,Buffer.from(png,'base64'));
  }
  const readingHold=[];
  for(const frame of [720,768,791])readingHold.push({frame,sha256:hash((await capture(pilot,frame)).png)});
  assert.equal(new Set(readingHold.map(r=>r.sha256)).size,1,'The three-second reading hold changes pixels');
  const repeatFrames=[863,72,0,504,292,791,324,0],repeat=[];
  for(const frame of repeatFrames){const p=await capture(pilot,frame);repeat.push({frame,sha256:hash(p.png)});}
  assert.equal(repeat.at(-1).sha256,repeat.find(r=>r.frame===0).sha256);
  assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);assert.deepEqual(httpErrors,[]);assert.deepEqual(imageRequests,[]);
  assert.equal((await sourceSnapshot()).sha256,source.sha256,'Source changed during native comparison');
  await writeFile('qa/stage2/native-result.json',JSON.stringify({status:'pass',sourceSha256:source.sha256,
    browser:await browser.version(),comparisons,controls:[...new Set(controls)].sort((a,b)=>a-b),repeat,readingHold,
    actorExit:{lastVisibleLocalFrame:lastVisible,firstEmptyLocalFrame:firstEmpty,lastVisibleGlobalFrame:72+lastVisible,
      firstEmptyGlobalFrame:72+firstEmpty,method:'Actual source PNG equality against empty last frame, all child frames320..383',visibility},
    pageErrors:errors,consoleErrors,httpErrors,imageRequests,limits:['Native frame comparison and visibility only; not an audio audition or continuous human playback review.']},null,2)+'\n');
  console.log(`PASS morning native: ${comparisons.length} exact child comparisons; ${controls.length} control requests; last actor pixel local f${lastVisible}, empty from f${firstEmpty}.`);
}finally{
  await writeFile('qa/stage2/native-errors.json',JSON.stringify({pageErrors:errors,consoleErrors,httpErrors,imageRequests},null,2)+'\n');
  await browser?.close();await server?.close();
}
