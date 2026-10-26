import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { findTool } from './tools.mjs';
const frames = [0,8,17,48,67,96,124,136,147,168,188,189,190,191,192,193,202,203,204,205,206,207,247,248,249,250,251,252,287,210,0,96,210,48,0];
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
    if ([0,96,147,204].includes(frame)) await writeFile(`qa/port-key-${frame}.png`, second);
  }
  if (errors.length || imageRequests.length) throw Error(JSON.stringify({ errors, imageRequests }));
  await writeFile('qa/port-check.json', JSON.stringify({ records, imageRequests, pageErrors: errors,
    directPixiVsRemotionPlayer: 'exact native PNG match', backwardRandomSeek: 'PASS', platform: process.platform }, null, 2));
  console.log('PASS', records.length, 'direct vs Remotion Player native frames; random/reverse seek; zero images/errors');
} finally { await browser?.close(); await server.close(); }
