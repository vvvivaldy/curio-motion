import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdir, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import puppeteer from 'puppeteer-core';
import {createServer} from 'vite';
import {findTool} from './tools.mjs';
import {sourceSnapshot, snapshotFiles} from './lib/authoring.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const folder = join(root, 'qa/public-api');
await mkdir(folder, {recursive: true});
const source = await sourceSnapshot();
const snapshotProbe = () => snapshotFiles([...source.files.map(f => f.path), 'docs/API_STABILITY.json',
  'scripts/check-public-api-browser.mjs', 'scripts/fixtures/public-api-scene.ts',
  'scripts/fixtures/public-api-probe.tsx', 'scripts/fixtures/public-api.html']);
const probe = await snapshotProbe();
let browser, server;
const pageErrors = [], consoleErrors = [], dependencyWarnings = [], httpErrors = [], imageRequests = [];
const hash = encoded => createHash('sha256').update(Buffer.from(encoded, 'base64')).digest('hex');
try {
  server = await createServer({root, server: {host: '127.0.0.1', port: 0, open: false}});
  await server.listen();
  const port = server.httpServer.address().port;
  browser = await puppeteer.launch({executablePath: findTool('chrome'), headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader']});
  const page = await browser.newPage();
  await page.setViewport({width: 600, height: 520, deviceScaleFactor: 1});
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    const text = message.text();
    const knownRefWarning = text.startsWith('Warning:') && text.includes('AbsoluteFillWithTiming') &&
      (text.includes('`ref` is not a prop') || text.includes('Function components cannot be given refs.'));
    if (message.type() === 'error') (knownRefWarning ? dependencyWarnings : consoleErrors).push(text);
  });
  page.on('response', response => {if (response.status() >= 400) httpErrors.push({url: response.url(), status: response.status()});});
  page.on('request', request => {if (request.resourceType() === 'image') imageRequests.push(request.url());});
  await page.goto(`http://127.0.0.1:${port}/scripts/fixtures/public-api.html`, {waitUntil: 'networkidle0'});
  await page.waitForFunction(() => window.apiProbe?.player && document.querySelector('#direct').dataset.frame === '0' &&
    document.querySelector('#player [data-testid="code-scene"]')?.dataset.frame === '0');
  assert.equal(await page.$('vite-error-overlay'), null);
  const records = [], seen = new Map();
  for (const frame of [0, 12, 47, 3, 24, 0, 36, 0]) {
    const pose = await page.evaluate(frame => window.apiProbe.direct.draw(frame), frame);
    await page.evaluate(frame => window.apiProbe.player.seekTo(frame), frame);
    await page.waitForFunction(frame => document.querySelector('#player [data-testid="code-scene"]').dataset.frame === String(frame), {}, frame);
    const pixels = await page.evaluate(() => ({
      direct: document.querySelector('#direct canvas').toDataURL('image/png').split(',')[1],
      player: document.querySelector('#player canvas').toDataURL('image/png').split(',')[1],
    }));
    const directHash = hash(pixels.direct), playerHash = hash(pixels.player);
    assert.equal(directHash, playerHash, `Direct/Player pixels at ${frame}`);
    if (seen.has(frame)) assert.equal(playerHash, seen.get(frame), `Repeat/reverse seek pixels at ${frame}`);
    seen.set(frame, playerHash);
    records.push({frame, point: pose.point, sha256: playerHash});
    if ([12, 47].includes(frame)) await (await page.$('#direct canvas')).screenshot({path: join(folder, `frame-${frame}.png`)});
  }
  assert(new Set(records.map(r => r.sha256)).size >= 4, 'A blank/static fixture cannot pass the pixel test');
  const lifecycle = await page.evaluate(() => window.apiProbe.verifyLifecycle());
  await page.evaluate(() => window.apiProbe.player.play());
  await page.waitForFunction(() => window.apiProbe.player.getCurrentFrame() >= 4);
  await page.evaluate(() => window.apiProbe.player.pause());
  await page.waitForFunction(() => !window.apiProbe.player.isPlaying() &&
    document.querySelector('#player [data-testid="code-scene"]').dataset.frame === String(window.apiProbe.player.getCurrentFrame()));
  const pausedAt = await page.evaluate(() => window.apiProbe.player.getCurrentFrame());
  await page.evaluate(() => {window.apiProbe.direct.draw(0); window.apiProbe.player.seekTo(0);});
  await page.waitForFunction(() => document.querySelector('#player [data-testid="code-scene"]').dataset.frame === '0');
  await page.screenshot({path: join(folder, 'consumer.png'), fullPage: true});
  await page.evaluate(() => {window.apiProbe.direct.destroy(); window.apiProbe.unmount();});
  await page.waitForFunction(() => document.querySelectorAll('canvas').length === 0);
  assert.deepEqual(pageErrors, []); assert.deepEqual(consoleErrors, []); assert.deepEqual(httpErrors, []); assert.deepEqual(imageRequests, []);
  assert.equal((await sourceSnapshot()).sha256, source.sha256, 'Source changed during smoke');
  assert.equal((await snapshotProbe()).sha256, probe.sha256, 'Consumer/probe changed during smoke');
  await writeFile(join(folder, 'result.json'), JSON.stringify({status: 'pass', sourceSha256: source.sha256, probeSha256: probe.sha256,
    browser: await browser.version(), platform: process.platform, arch: process.arch, node: process.version,
    records, lifecycle, playback: {pausedAt, returnedToFrame: 0, unmountRemovedCanvas: true},
    pageErrors, consoleErrors, httpErrors, imageRequests, dependencyWarnings,
    limits: ['One existing Chrome/macOS runtime; no cross-browser claim.', 'Technical consumer probe, no character/anatomy/audio acceptance or MP4 export claim.']}, null, 2)+'\n');
  console.log(`PASS public API browser: ${records.length} seeks, ${seen.size} distinct requested frames, moving pixels, lifecycle, Player play/pause/unmount. Evidence: qa/public-api/result.json`);
} finally {
  await writeFile(join(folder, 'errors.json'), JSON.stringify({pageErrors, consoleErrors, httpErrors, imageRequests, dependencyWarnings}, null, 2)+'\n');
  await browser?.close(); await server?.close();
}
