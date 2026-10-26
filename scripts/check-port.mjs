import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { findTool } from './tools.mjs';
const gaitFrames = [3,4,6,7,12,15,16,22,23,26,28,31,32,33,37,38,39,42,44,47,49,54,55,60,62,64,65,66,68,71,75,76,77,91,93,97,100,101,113,119,120,138,139,140,143,144,145,146,148,150,152];
const gestureFrames = [184,185,186,187,194,195,196,197,198,199,200,201,208,209,211,212,213,214,215,216,220,221,222,225,226,227,228,229,230,231,232,233,234,235,237,238,239,240,241,242,243,244,245,246,253,254,255,256,257,258];
const modelFrames = Array.from({length:51},(_,i)=>74+i);
const frames = [...modelFrames,...gestureFrames,...gaitFrames,0,8,17,18,19,20,21,48,50,51,52,67,72,84,96,104,106,108,109,110,111,112,114,122,123,124,136,147,168,188,189,190,191,192,193,202,203,204,205,206,207,236,247,248,249,250,251,252,287,210,0,96,210,48,0];
const server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
let browser;
try {
  await mkdir('qa', { recursive: true });
  await server.listen();
  const port = server.httpServer.address().port;
  browser = await puppeteer.launch({ executablePath: findTool('chrome'), headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const direct = await browser.newPage(), player = await browser.newPage();
  await direct.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await player.setViewport({ width: 1320, height: 1000, deviceScaleFactor: 1 });
  const imageRequests = [], errors = [];
  for (const page of [direct, player]) {
    page.on('request', request => { if (request.resourceType() === 'image') imageRequests.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
  }
  await direct.goto(`http://127.0.0.1:${port}/`);
  await player.goto(`http://127.0.0.1:${port}/player.html`);
  await direct.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await player.waitForFunction(() => window.curioPlayer && document.querySelector('[data-testid="code-scene"]').dataset.frame === '0');
  const baseline = {}, records = [];
  for (const frame of frames) {
    await direct.evaluate(n => window.demo.render(n), frame);
    await player.evaluate(n => window.curioPlayer.seekTo(n), frame);
    await player.waitForFunction(n => document.querySelector('[data-testid="code-scene"]').dataset.frame === String(n), {}, frame);
    const extract = page => page.evaluate(() => document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
    const [a, b] = await Promise.all([extract(direct), extract(player)]);
    const first = Buffer.from(a, 'base64'), second = Buffer.from(b, 'base64');
    const hash = bytes => createHash('sha256').update(bytes).digest('hex');
    if (hash(first) !== hash(second)) throw Error(`Pixi/Remotion canvas mismatch at ${frame}`);
    if (baseline[frame] && baseline[frame] !== hash(second)) throw Error(`Reverse seek mismatch at ${frame}`);
    baseline[frame] = hash(second);
    records.push({ frame, sha256: hash(second), match: true });
    if ([0,19,51,96,108,110,112,136,147,168,204,236].includes(frame)) await writeFile(`qa/port-key-${frame}.png`, second);
  }
  if (errors.length || imageRequests.length) throw Error(JSON.stringify({ errors, imageRequests }));
  await writeFile('qa/port-check.json', JSON.stringify({ records, imageRequests, pageErrors: errors,
    directPixiVsRemotionPlayer: 'exact native PNG match', backwardRandomSeek: 'PASS', platform: process.platform }, null, 2));
  console.log('PASS', records.length, 'direct vs Remotion Player native frames; random/reverse seek; zero images/errors');
} finally { await browser?.close(); await server.close(); }
