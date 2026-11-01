import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir, mkdtemp, writeFile, rm} from 'node:fs/promises';
import {relative, join} from 'node:path';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';
import {createServer} from 'vite';
import {findTool} from './tools.mjs';

// A real browser smoke of the blank starter, not an authored-model quality test.
// All temporary inputs/source live under qa; the project registry is untouched.
const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
await mkdir(join(root, 'qa'), {recursive: true});
const folder = await mkdtemp(join(root, 'qa/create-example-browser-'));
const workspace = join(folder, 'workspace');
let server, browser;
const errors = [], consoleErrors = [], dependencyWarnings = [], warnings = [], imageRequests = [], referenceRequests = [];
const httpErrors = [], consoleLocations = [];
try {
  await mkdir(join(workspace, 'src/examples'), {recursive: true});
  await mkdir(join(workspace, 'inputs'));
  await writeFile(join(workspace, 'src/examples/scenes.ts'), 'export const scenes = {};\n');
  await writeFile(join(workspace, 'inputs/whole.svg'), '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><path d="M0 0H40V40H0Z" fill="#777"/></svg>\n');
  await writeFile(join(workspace, 'inputs/ACTION.txt'), 'Keep this scaffold blank; this smoke checks execution and seek only.\r\n');
  // Exercise the actual CLI with an isolated repository-shaped cwd.
  await execute(process.execPath, [join(root, 'scripts/create-example.mjs'),
    '--id', 'browser-starter', '--composition', 'BrowserStarter', '--reference', 'inputs/whole.svg',
    '--action-file', 'inputs/ACTION.txt', '--title', 'Blank starter smoke', '--provenance', 'Local synthetic smoke input',
    '--width', '320', '--height', '180', '--fps', '12', '--frames', '24'], {cwd: workspace, timeout: 30000});
  await writeFile(join(folder, 'probe.html'), '<!doctype html><html><head><meta charset="UTF-8"><link rel="icon" href="data:,"><title>Curio blank starter smoke</title></head><body style="margin:24px;background:#fff;color:#222;font:16px system-ui"><h1>Blank starter execution smoke</h1><p>Unillustrated scaffold: frame/seek verification only.</p><h2>Direct Pixi</h2><div id="direct" style="width:320px;height:180px"></div><h2>Remotion Player</h2><div id="player" style="width:320px"></div><script type="module" src="./probe.tsx"></script></body></html>');
  await writeFile(join(folder, 'probe.tsx'), `import React, {useEffect, useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Player, type PlayerRef} from '@remotion/player';
import {createPixiStage} from '/src/core/stage';
import {createRemotionScene} from '/src/remotion/create-scene';
import {browserStarterScene} from './workspace/src/examples/browser-starter/scene';
const settings = browserStarterScene.settings;
const Scene = createRemotionScene(browserStarterScene);
const direct = await createPixiStage(document.querySelector('#direct')!, browserStarterScene);
direct.draw(0);
Object.assign(window, {starterSmoke: {direct, settings}});
function Preview() {
  const player = useRef<PlayerRef>(null);
  useEffect(() => {Object.assign(window, {starterPlayer: player.current});}, []);
  return <Player ref={player} component={Scene} durationInFrames={settings.durationInFrames} fps={settings.fps}
    compositionWidth={settings.width} compositionHeight={settings.height} controls
    style={{width:320,aspectRatio:'320 / 180'}} />;
}
createRoot(document.querySelector('#player')!).render(<Preview />);
`);
  server = await createServer({root, server: {host: '127.0.0.1', port: 0, open: false}});
  await server.listen();
  const port = server.httpServer.address().port;
  const path = relative(root, join(folder, 'probe.html')).split('\\').join('/');
  const url = `http://127.0.0.1:${port}/${path}`;
  browser = await puppeteer.launch({executablePath: findTool('chrome'), headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader']});
  const page = await browser.newPage();
  await page.setViewport({width: 760, height: 760, deviceScaleFactor: 1});
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error') consoleLocations.push({text, location: message.location()});
    // Pinned React 18 / Remotion dev warnings are recorded, never silently dropped.
    const knownRefWarning = text.startsWith('Warning:') && text.includes('AbsoluteFillWithTiming') &&
      (text.includes('`ref` is not a prop') || text.includes('Function components cannot be given refs.'));
    if (message.type() === 'error') (knownRefWarning ? dependencyWarnings : consoleErrors).push(text);
    if (message.type() === 'warn') warnings.push(message.text());
  });
  page.on('response', response => {
    if (response.status() >= 400) httpErrors.push({url: response.url(), status: response.status(), resourceType: response.request().resourceType()});
  });
  page.on('request', request => {
    if (request.resourceType() === 'image') imageRequests.push(request.url());
    if (request.url().includes('/whole.svg')) referenceRequests.push(request.url());
  });
  await page.goto(url, {waitUntil: 'networkidle0'});
  assert.equal(await page.title(), 'Curio blank starter smoke');
  await page.waitForFunction(() => window.starterPlayer && document.querySelector('#direct').dataset.frame === '0' &&
    document.querySelector('[data-testid="code-scene"]')?.dataset.frame === '0');
  assert.equal(await page.$('vite-error-overlay'), null);
  assert.equal(await page.$$eval('canvas', nodes => nodes.length), 2);
  const records = [], baselines = new Map();
  for (const frame of [0, 7, 23, 2, 0, 15, 0]) {
    const pose = await page.evaluate(frame => window.starterSmoke.direct.draw(frame), frame);
    assert.equal(pose.time, frame / 12);
    await page.evaluate(frame => window.starterPlayer.seekTo(frame), frame);
    await page.waitForFunction(frame => document.querySelector('[data-testid="code-scene"]').dataset.frame === String(frame), {}, frame);
    const pixels = await page.evaluate(() => ({
      direct: document.querySelector('#direct canvas').toDataURL('image/png').split(',')[1],
      player: document.querySelector('#player canvas').toDataURL('image/png').split(',')[1],
      frame: window.starterPlayer.getCurrentFrame(),
      directFrame: document.querySelector('#direct').dataset.frame,
    }));
    assert.equal(pixels.frame, frame);
    assert.equal(pixels.directFrame, String(frame));
    const directHash = hash(Buffer.from(pixels.direct, 'base64')), playerHash = hash(Buffer.from(pixels.player, 'base64'));
    assert.equal(directHash, playerHash, `Direct/Player native PNG mismatch at ${frame}`);
    if (baselines.has(frame)) assert.equal(playerHash, baselines.get(frame), `Backward seek differs at ${frame}`);
    baselines.set(frame, playerHash);
    records.push({frame, time: pose.time, sha256: playerHash, nativePngMatch: true});
  }
  await page.evaluate(() => window.starterPlayer.play());
  await page.waitForFunction(() => window.starterPlayer.getCurrentFrame() >= 3);
  await page.evaluate(() => window.starterPlayer.pause());
  await page.waitForFunction(() => !window.starterPlayer.isPlaying() &&
    document.querySelector('[data-testid="code-scene"]').dataset.frame === String(window.starterPlayer.getCurrentFrame()));
  const pausedAt = await page.evaluate(() => window.starterPlayer.getCurrentFrame());
  await page.evaluate(() => window.starterPlayer.seekTo(0));
  await page.waitForFunction(() => document.querySelector('[data-testid="code-scene"]').dataset.frame === '0');
  await page.screenshot({path: join(folder, 'blank-starter.png'), fullPage: true});
  // Preserve exact failing resources even when an assertion stops this smoke.
  await writeFile(join(folder, 'network-audit.json'), `${JSON.stringify({url, httpErrors, consoleLocations}, null, 2)}\n`);
  assert.deepEqual(errors, []);
  assert.deepEqual(consoleErrors, []);
  assert.deepEqual(httpErrors, []);
  assert.deepEqual(imageRequests, []);
  assert.deepEqual(referenceRequests, []);
  const result = {status: 'pass', note: 'Blank scaffold execution only: no character reconstruction, motion or visual quality approval.',
    browser: await browser.version(), url, viewport: {width: 760, height: 760}, records, playback: {played: true, pausedAt, returnedToFrame: 0},
    pageErrors: errors, consoleErrors, httpErrors, consoleLocations, dependencyWarnings, warnings, imageRequests, referenceRequests,
    limitations: ['Blank canvas validates execution and frame ownership only, not illustration quality or meaningful animated pixel changes.', 'Pinned React 18 / Remotion may emit the separately recorded AbsoluteFillWithTiming ref development warnings.', 'Single desktop viewport on existing Chrome; no MP4 export or cross-browser claim.'],
    screenshot: 'blank-starter.png', source: 'create-example CLI in isolated qa workspace; shared Pixi stage and Remotion Player'};
  await writeFile(join(folder, 'result.json'), `${JSON.stringify(result, null, 2)}\n`);
  console.log(`PASS blank starter: ${records.length} direct/Player seeks, play/pause, zero page/runtime console errors; ${dependencyWarnings.length} recorded dependency dev warnings.\nEvidence: ${join(folder, 'result.json')}`);
} finally {
  await browser?.close();
  await server?.close();
  // Retain only smoke evidence; remove our generated source/input and probe files.
  await rm(workspace, {recursive: true, force: true});
  await rm(join(folder, 'probe.html'), {force: true});
  await rm(join(folder, 'probe.tsx'), {force: true});
}
