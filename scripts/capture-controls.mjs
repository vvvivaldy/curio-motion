import {parseArgs} from 'node:util';
import {mkdir,writeFile} from 'node:fs/promises';
import {createServer} from 'vite';
import puppeteer from 'puppeteer-core';
import {findTool} from './tools.mjs';
import {sourceSnapshot} from './lib/authoring.mjs';
const {values}=parseArgs({options:{example:{type:'string'},frames:{type:'string'},out:{type:'string'},'debug-module':{type:'string'}}});
if(!/^[a-z0-9-]+$/.test(values.example??''))throw Error('Use --example <registered-id>');
const frames=(values.frames??'').split(',').map(Number);
if(!frames.length||frames.some(f=>!Number.isSafeInteger(f)||f<0))throw Error('Use --frames 0,24,...');
const folder=values.out??`qa/controls/${values.example}`;
if(!/^qa\/[a-zA-Z0-9_/-]+$/.test(folder)||folder.split('/').includes('..'))throw Error('Output must be a named qa subfolder');
const debugModule=values['debug-module'];
if(debugModule&&!/^src\/[a-zA-Z0-9_/-]+\.ts$/.test(debugModule))throw Error('Debug module must be a source TypeScript file');
const before=await sourceSnapshot(),errors=[];let browser;
const server=await createServer({server:{host:'127.0.0.1',port:0,open:false}});
try{
 await mkdir(folder,{recursive:true});
 if(debugModule)await writeFile(`${folder}/probe.html`,`<!doctype html><meta charset="utf-8"><style>body{margin:0}</style><script type="module">
 import {Graphics} from 'pixi.js';import {createPixiStage} from '/src/core/stage.ts';import {drawGeometryOverlay} from '/src/core/debug.ts';
 import * as module from '/src/examples/${values.example}/scene.ts';import {geometryAt} from '/${debugModule}';
 const base=Object.values(module).find(v=>v?.settings&&v?.pose&&v?.draw&&v?.createDrawing);if(!base)throw Error('Scene definition missing');
 const wrapped={...base,createDrawing(root){const drawing=base.createDrawing(root),overlay=new Graphics();root.addChild(overlay);return {drawing,overlay};},
 draw(d,p,c){base.draw(d.drawing,p,c);const geometry=geometryAt(c.time);drawGeometryOverlay(d.overlay,geometry.objects,geometry.paths);}};
 const stage=await createPixiStage(document.body,wrapped);window.demo={settings:base.settings,render:f=>stage.draw(f)};stage.draw(0);document.documentElement.dataset.ready='1';
 </script>`);
 await server.listen();
 browser=await puppeteer.launch({executablePath:findTool('chrome'),headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const page=await browser.newPage();page.setDefaultTimeout(120000);page.setDefaultNavigationTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/${debugModule?`${folder}/probe.html`:`?example=${values.example}`}`);
 await page.waitForFunction(()=>document.documentElement.dataset.ready==='1');
 const settings=await page.evaluate(()=>window.demo.settings);await page.setViewport({width:settings.width,height:settings.height,deviceScaleFactor:1});
 for(const frame of frames){
  await page.evaluate(f=>window.demo.render(f),frame);
  const png=await page.evaluate(()=>document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
  await writeFile(`${folder}/f${String(frame).padStart(6,'0')}.png`,Buffer.from(png,'base64'));
 }
 if(errors.length)throw Error(errors.join('; '));
 if((await sourceSnapshot()).sha256!==before.sha256)throw Error('Source changed during control capture');
 await writeFile(`${folder}/capture.json`,JSON.stringify({method:'Direct Pixi control capture, not official final export',source:before.sha256,debugModule:debugModule??null,frames,settings,pageErrors:errors},null,2));
 console.log('Captured native control frames:',folder);
}finally{await browser?.close();await server.close();}
