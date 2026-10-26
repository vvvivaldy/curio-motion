import puppeteer from 'puppeteer-core';
import { createServer } from 'vite';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { findTool, verifyFfmpeg } from './tools.mjs';

const chrome = findTool('chrome');
const ffmpeg = findTool('ffmpeg');
verifyFfmpeg(ffmpeg);
const output = resolve(process.env.RENDER_OUTPUT ?? 'outputs/rendered.mp4');
const frames = await mkdtemp(join(tmpdir(), 'curio-motion-'));
let server, browser;
try {
  await mkdir(resolve('qa'), { recursive: true });
  await mkdir(resolve(output, '..'), { recursive: true });
  server = await createServer({ server: { host: '127.0.0.1', port: 0, open: false } });
  await server.listen();
  const address = server.httpServer.address();
  if (!address || typeof address === 'string') throw new Error('Could not start local preview server.');
  browser = await puppeteer.launch({ executablePath: chrome, headless: true,
    args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  const images = [], errors = [], hashes = [], seek = [];
  page.on('request', request => { if (request.resourceType() === 'image') images.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1', { timeout: 30000 });
  const started = performance.now();
  for (let frame = 0; frame < 288; frame++) {
    await page.evaluate(n => window.demo.render(n), frame);
    const bytes = await page.screenshot({ path: join(frames, `f${String(frame).padStart(4, '0')}.png`) });
    hashes.push(createHash('sha256').update(bytes).digest('hex'));
    if (frame % 48 === 0) console.log(`Frame ${frame}/288`);
  }
  const captureMs = performance.now() - started;
  for (const frame of [287, 210, 0, 96, 150, 48, 210, 0]) {
    await page.evaluate(n => window.demo.render(n), frame);
    const hash = createHash('sha256').update(await page.screenshot()).digest('hex');
    if (hash !== hashes[frame]) throw new Error(`Non-deterministic seek at frame ${frame}`);
    seek.push({ frame, sha256: hash });
  }
  if (images.length || errors.length) throw new Error(JSON.stringify({ images, errors }));
  const encodeStart = performance.now();
  execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-framerate', '24',
    '-i', join(frames, 'f%04d.png'), '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart', output], { stdio: 'inherit', windowsHide: true });
  await writeFile('qa/render.json', JSON.stringify({ frames: 288, fps: 24, size: [1280, 720],
    captureMs, encodeMs: performance.now() - encodeStart, seek, imageRequests: images,
    pageErrors: errors, frameHashes: hashes, platform: process.platform,
    method: 'Native Pixi Graphics; reference is viewer-only; no raster runtime assets' }, null, 2));
  console.log('Rendered', output);
} finally {
  await browser?.close();
  await server?.close();
  await rm(frames, { recursive: true, force: true });
}
