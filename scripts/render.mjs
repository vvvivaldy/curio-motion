import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { mkdir, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { findTool } from './tools.mjs';
const browserExecutable = findTool('chrome');
const compositionId = process.env.COMPOSITION_ID ?? 'PinkMonkey';
const fileStem = compositionId.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
const defaultOutput = compositionId === 'PinkMonkey' ? 'outputs/curio-motion-remotion.mp4' : `outputs/${fileStem}-remotion.mp4`;
const output = resolve(process.env.RENDER_OUTPUT ?? defaultOutput);
const temporary = await mkdtemp(join(tmpdir(), 'curio-remotion-'));
const events = { pageErrors: [] };
try {
  await mkdir(resolve('qa'), { recursive: true });
  await mkdir(dirname(output), { recursive: true });
  const started = performance.now();
  const serveUrl = await bundle({ entryPoint: resolve('src/remotion/Root.tsx'), outDir: join(temporary, 'bundle') });
  const bundleMs = performance.now() - started;
  const options = { serveUrl, browserExecutable, chromiumOptions: { gl: 'swangle' },
    onBrowserLog: log => { if (log.type === 'error') events.pageErrors.push(log.text); } };
  const composition = await selectComposition({ ...options, id: compositionId });
  const renderStart = performance.now();
  await renderMedia({ ...options, composition, codec: 'h264', crf: 17, pixelFormat: 'yuv420p',
    imageFormat: 'png', outputLocation: output, concurrency: 1,
    onBrowserDownload: () => { throw new Error('Automatic Chrome download disabled. Set CHROME_PATH.'); },
    onProgress: p => { if (p.renderedFrames % 48 === 0) console.log('Rendered', p.renderedFrames); },
  });
  await writeFile(compositionId === 'PinkMonkey' ? 'qa/remotion-render.json' : `qa/${compositionId}-render.json`, JSON.stringify({ method: 'official @remotion/renderer renderMedia',
    composition: composition.id, frames: composition.durationInFrames, fps: composition.fps,
    width: composition.width, height: composition.height, bundleMs, renderMediaMs: performance.now() - renderStart,
    concurrency: 1, platform: process.platform, ...events,
    note: 'Network image audit and seek are separately measured by scripts/check-port.mjs.' }, null, 2));
  console.log('Rendered', output);
} finally { await rm(temporary, { recursive: true, force: true }); }
