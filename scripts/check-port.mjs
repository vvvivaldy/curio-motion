import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { findTool } from './tools.mjs';
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
  const specs=[{key:'pink-monkey',frames:monkeyFrames,keys:[0,19,51,96,108,110,112,136,147,168,204,236]},
    {key:'amber-robot',frames:robotFrames,keys:[0,44,55,64,104,120,140,160,188,213,225,263,299]}];
  for (const spec of specs) {
    if(process.env.EXAMPLE && process.env.EXAMPLE!==spec.key)continue;
    const direct=await browser.newPage(),player=await browser.newPage();
    for(const page of [direct,player]) {
      page.on('request',request=>{if(request.resourceType()==='image')imageRequests.push(request.url());});
      page.on('pageerror',error=>errors.push(error.message));
    }
    await direct.goto(`http://127.0.0.1:${port}/?example=${spec.key}`);
    await direct.waitForFunction(()=>document.documentElement.dataset.ready==='1');
    const settings=await direct.evaluate(()=>window.demo.settings);
    await direct.setViewport({width:settings.width,height:settings.height,deviceScaleFactor:1});
    await player.setViewport({width:settings.width+40,height:settings.height+280,deviceScaleFactor:1});
    await player.goto(`http://127.0.0.1:${port}/player.html?example=${spec.key}`);
    await player.waitForFunction(()=>window.curioPlayer&&document.querySelector('[data-testid="code-scene"]').dataset.frame==='0');
    const baseline={},records=[];
    for(const frame of spec.frames) {
      await direct.evaluate(n=>window.demo.render(n),frame);
      await player.evaluate(n=>window.curioPlayer.seekTo(n),frame);
      await player.waitForFunction(n=>document.querySelector('[data-testid="code-scene"]').dataset.frame===String(n),{},frame);
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
