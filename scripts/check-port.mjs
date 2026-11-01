import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import { mkdir, writeFile,readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { findTool } from './tools.mjs';
import {validatePlan,sampleFrames}from'./lib/authoring.mjs';
const gaitFrames = [3,4,6,7,12,15,16,22,23,26,28,31,32,33,37,38,39,42,44,47,49,54,55,60,62,64,65,66,68,71,75,76,77,91,93,97,100,101,113,119,120,138,139,140,143,144,145,146,148,150,152];
const gestureFrames = [184,185,186,187,194,195,196,197,198,199,200,201,208,209,211,212,213,214,215,216,220,221,222,225,226,227,228,229,230,231,232,233,234,235,237,238,239,240,241,242,243,244,245,246,253,254,255,256,257,258];
const modelFrames = Array.from({length:51},(_,i)=>74+i);
const monkeyFrames = [...modelFrames,...gestureFrames,...gaitFrames,0,8,17,18,19,20,21,48,50,51,52,67,72,84,96,104,106,108,109,110,111,112,114,122,123,124,136,147,168,188,189,190,191,192,193,202,203,204,205,206,207,236,247,248,249,250,251,252,287,210,0,96,210,48,0];
const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
let browser;
try {
  await mkdir('qa', { recursive: true });
  await server.listen();
  const port = server.httpServer.address().port;
  browser = await puppeteer.launch({ executablePath: findTool('chrome'), headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const imageRequests = [], errors = [], results = [];
  const robotFrames = [...new Set([...Array.from({length:76},(_,i)=>Math.min(299,i*4)),43,44,45,54,55,56,62,63,64,65,103,104,105,110,115,118,120,124,128,130,136,140,141,142,145,146,150,155,160,164,169,170,175,183,184,185,187,188,190,194,195,198,205,209,212,213,214,215,216,220,221,224,225,226,230,253,261,263,299]),0,214,44,299,120,0];
  const specs=[{key:'human-chair',frames:[0, 18, 28, 42, 82, 90, 92, 97, 102, 103, 108, 114, 120, 135, 152, 153, 156, 168, 187, 188, 196, 209, 218, 224, 238, 247, 266, 270, 271, 280, 316, 317, 335, 343, 347, 17, 19, 27, 29, 96, 98, 101, 104, 107, 109, 113, 115, 151, 154, 186, 189, 195, 197, 208, 210, 216, 219, 227, 229, 237, 239, 246, 248, 267, 268, 272, 279, 281, 315, 318, 334, 336, 342, 344, 0, 347, 103, 270, 18, 0],keys:[0, 18, 28, 42, 82, 90, 92, 97, 102, 103, 108, 114, 120, 135, 152, 153, 156, 168, 187, 188, 196, 209, 218, 224, 238, 247, 266, 270, 271, 280, 316, 317, 335, 343, 347]},{key:'black-cat-chair',frames:[0,8,14,24,38,60,79,81,85,110,121,125,126,127,130,134,136,137,140,144,148,153,155,158,160,161,162,163,164,168,170,172,173,174,178,180,184,187,192,200,205,216,234,238,240,245,249,252,260,276,282,284,288,291,308,309,315,320,324,325,326,327,328,329,338,339,345,351,352,355,361,362,363,364,365,366,367,370,373,374,375,376,377,378,379,380,383,388,431,0,431,326,144,378,0,160,161,178,179,192,269,281,292,298,306,312,313,322,323,328,334,338,343,347,350,351,355,359,363,364,372,379,380,381,383,389,396,406,417,418,422,430,434,438,441,443,479,0,479,396,281,179,334,0],keys:[0,24,60,79,121,126,130,136,144,162,174,184,192,216,240,252,284,291,308,315,324,325,326,327,328,329,338,362,363,366,374,375,376,377,378,379,380,388,431,0,160,161,178,179,192,269,281,292,298,306,312,313,322,323,328,334,338,343,347,350,351,355,359,363,364,372,379,380,381,383,389,396,406,417,418,422,430,434,438,441,443,479]},{"key":"motion-foundations","frames":[0,18,19,20,24,30,36,42,48,52,53,54,60,66,71,72,73,74,75,83,84,85,91,92,96,105,106,107,108,109,119,120,121,137,138,139,155,156,157,172,173,174,192,205,206,207,208,214,215,0,92,215,20,0],"keys":[0,20,36,54,72,75,84,91,107,120,138,156,173,207,215]},{key:'ivory-carrier',frames:[...new Set([...Array.from({length:61},(_,i)=>Math.min(239,i*4)),...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]]),0,72,239,107,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-short",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-tall",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-small-box",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-large-box",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-low-table",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-high-table",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-short-large-high",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:"carrier-tall-small-low",frames:[...[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239],0,203,72,239,0],keys:[0,52,64,69,70,71,72,73,74,84,96,107,116,117,118,128,160,196,200,202,203,204,205,214,220,223,224,228,232,235,239]},{key:'pink-monkey',frames:monkeyFrames,keys:[0,19,51,96,108,110,112,136,147,168,204,236]},
    {key:'amber-robot',frames:robotFrames,keys:[0,44,55,64,104,120,140,160,188,213,225,263,299]},
    {key:'serious-boar',frames:[...Array.from({length:49},(_,i)=>Math.min(575,i*12)),201,202,203,227,228,229,233,234,235,287,288,289,358,359,360,361,377,385,386,387,401,402,403,410,411,412,428,429,430,478,479,480,492,493,494,549,550,551,575,0,411,234,575,0],keys:[0,180,234,300,348,359,360,377,411,444,550,575]},
    {key:'serious-boar-v2',frames:[...new Set([...Array.from({length:49},(_,i)=>Math.min(575,i*12)),182,183,203,204,205,216,292,321,322,323,382,383,384,385,408,481,482,483,497,498,499,512,513,514,527,528,529,543,544,545,557,558,559,575]),0,498,216,575,0],keys:[0,182,204,216,292,322,383,384,408,482,498,528,544,558,575]}];
  // The opt-in sound wrapper must preserve the direct Pixi picture exactly.
  specs.push({...specs[0],key:'human-chair-sound'});
  specs.push({...specs[0],key:'human-chair-sound-v2'});
  for(const key of ['human-chair-ink','human-chair-paper'])specs.push({...specs[0],key});
  // Actual new frame ranges and risky neighbors; never reuse old348-frame keys.
  for(const [key,last,events]of [
    ['human-chair-neon-confident',191,[73,79,85,91,103,113,114,116,118,119,120,126,132,140,145,146,147,148,157,163]],
    ['human-chair-neon-cautious',227,[83,85,90,95,103,104,105,113,123,126,127,128,131,134,137,139,140,141,145,146,147,152,160,170,176,178,179,180,183,184,185,186,187,195,196,200,201,202,207]]
  ]){
    const keys=[...new Set([0,...events,last])];
    specs.push({key,frames:[...new Set([...Array.from({length:Math.ceil(last/12)+1},(_,i)=>Math.min(last,i*12)),...keys]),last,0,...events.slice().reverse(),last,0],keys});
  }
  // Existing published V3 regression frames; independent of private authoring plans.
  specs.push({"key":"cat-picture-story-v3","frames":[0,12,24,44,45,46,50,51,52,53,55,58,108,123,124,127,130,148,196,268,320,456,524,552,581,582,612,657,720,746,751,752,753,754,755,756,760,780,816,832,839,0,754,52,839,0],"keys":[52,53,108,124,127,754,756,839]});
  // Published controls for the same accepted black-cat source (HEAD 5df5b011).
  const blackCat=specs.find(spec=>spec.key==='black-cat-chair');
  blackCat.frames.push(382,412,416,419,420,421,426);
  blackCat.keys.push(382,412,416,419,420,421,426);
  // Preserve the accepted courier and infographic's risky-neighbor tracks.
  // Their scene settings come from the current plans, never the old bridge.
  const stage6=JSON.parse(await readFile('scripts/fixtures/stage6-port.json','utf8'));
  for(const spec of stage6){
    const plan=validatePlan(JSON.parse(await readFile(`authoring/${spec.key}.json`,'utf8')));
    if(plan.id!==spec.key)throw Error('Stage 6 plan identity differs');
    specs.push({...spec,expectedSettings:plan.settings});
  }
  // New examples can use their explicit authoring evidence instead of adding
  // another private frame list here. Existing regression tracks stay intact.
  if(process.env.EXAMPLE&&!specs.some(s=>s.key===process.env.EXAMPLE)){
    const key=process.env.EXAMPLE;
    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key))throw Error('Unknown EXAMPLE');
    const plan=validatePlan(JSON.parse(await readFile(`authoring/${key}.json`,'utf8')));
    if(plan.id!==key)throw Error('EXAMPLE and authoring plan identity differ');
    const last=plan.settings.durationInFrames-1,keys=[...new Set([0,last,...['model','blocking','final'].flatMap(stage=>sampleFrames(plan,stage))])].sort((a,b)=>a-b);
    const frames=[...new Set([...keys,...sampleFrames(plan,'motion')])].sort((a,b)=>a-b);
    specs.push({key,keys,frames:[...frames,...keys.slice().reverse(),last,0],expectedSettings:plan.settings});
  }
  for (const spec of specs) {
    if(process.env.EXAMPLE && process.env.EXAMPLE!==spec.key)continue;
    const direct=await browser.newPage(),player=await browser.newPage();
    for(const page of [direct,player]) {
      page.on('request',request=>{if(request.resourceType()==='image')imageRequests.push(request.url());});
      page.on('pageerror',error=>errors.push(error.message));
    }
    await direct.goto(`http://127.0.0.1:${port}/?example=${spec.key}`);
    // Polling must also advance when this is the inactive of two headless tabs.
    await direct.waitForFunction(()=>document.documentElement.dataset.ready==='1',{polling:100,timeout:120000});
    const settings=await direct.evaluate(()=>window.demo.settings);
    if(spec.expectedSettings&&Object.entries(spec.expectedSettings).some(([key,value])=>settings[key]!==value))throw Error(`${spec.key} authoring settings differ from the actual scene`);
    await direct.setViewport({width:settings.width,height:settings.height,deviceScaleFactor:1});
    await player.setViewport({width:settings.width+40,height:settings.height+280,deviceScaleFactor:1});
    await player.goto(`http://127.0.0.1:${port}/player.html?example=${spec.key}`);
    await player.waitForFunction(()=>window.curioPlayer&&document.querySelector('[data-testid="code-scene"]').dataset.frame==='0',{polling:100,timeout:120000});
    const baseline={},records=[];
    for(const frame of spec.frames) {
      await direct.evaluate(n=>window.demo.render(n),frame);
      await player.evaluate(n=>window.curioPlayer.seekTo(n),frame);
      await player.waitForFunction(n=>document.querySelector('[data-testid="code-scene"]').dataset.frame===String(n),{polling:100,timeout:120000},frame);
      const extract=page=>page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
      const [a,b]=await Promise.all([extract(direct),extract(player)]);
      const first=Buffer.from(a,'base64'),second=Buffer.from(b,'base64');
      const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
      if(hash(first)!==hash(second))throw Error(`${spec.key} Pixi/Player mismatch at ${frame}`);
      if(baseline[frame]&&baseline[frame]!==hash(second))throw Error(`${spec.key} reverse seek mismatch at ${frame}`);
      baseline[frame]=hash(second);records.push({frame,sha256:hash(second),match:true});
      if(spec.keys.includes(frame))await writeFile(`qa/${spec.key}-key-${frame}.png`,second);
    }
    results.push({example:spec.key,settings,records});
    await direct.close();await player.close();
  }
  if(!results.length)throw Error('Unknown EXAMPLE');
  if (errors.length || imageRequests.length) throw Error(JSON.stringify({ errors, imageRequests }));
  await writeFile('qa/port-check.json',JSON.stringify({examples:results,imageRequests,pageErrors:errors,
    directPixiVsRemotionPlayer:'exact native PNG match',backwardRandomSeek:'PASS',platform:process.platform},null,2));
  console.log('PASS',results.map(r=>`${r.example}: ${r.records.length}`).join('; '),'native Pixi/Player comparisons; random/reverse seek; zero images/errors');

} finally { await browser?.close(); await server.close(); }
