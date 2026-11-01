import { bundle } from '@remotion/bundler';
import { selectComposition, renderMedia } from '@remotion/renderer';
import { mkdir, writeFile, mkdtemp, rm, readFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { findTool } from './tools.mjs';
import { sourceSnapshot, digest } from './lib/authoring.mjs';
const browserExecutable = findTool('chrome');
const compositionId = process.env.COMPOSITION_ID ?? 'PinkMonkey';
const audioCodec=process.env.RENDER_AUDIO_CODEC;
if(audioCodec!==undefined&&audioCodec!=='aac')throw Error('RENDER_AUDIO_CODEC supports aac for the current MP4 sound trial');
const fileStem = compositionId.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
const defaultOutput = compositionId === 'PinkMonkey' ? 'outputs/curio-motion-remotion.mp4' : `outputs/${fileStem}-remotion.mp4`;
const requestedRange=process.env.RENDER_RANGE;
const frameRange=requestedRange===undefined?undefined:(/^\d+:\d+$/.test(requestedRange)?requestedRange.split(':').map(Number):null);
if(frameRange===null||frameRange?.some(n=>!Number.isSafeInteger(n))||frameRange&&frameRange[0]>frameRange[1])throw Error('RENDER_RANGE must be inclusive first:last integer frames');
const output = resolve(process.env.RENDER_OUTPUT ?? (frameRange?`qa/excerpts/${fileStem}-${frameRange[0]}-${frameRange[1]}.mp4`:defaultOutput));
const temporary = await mkdtemp(join(tmpdir(), 'curio-remotion-'));
const events = { pageErrors: [] };
const source = await sourceSnapshot();
try {
  await mkdir(resolve('qa'), { recursive: true });
  await mkdir(dirname(output), { recursive: true });
  const started = performance.now();
  const serveUrl = await bundle({ entryPoint: resolve('src/remotion/Root.tsx'), outDir: join(temporary, 'bundle') });
  const bundleMs = performance.now() - started;
  const options = { serveUrl, browserExecutable, chromiumOptions: { gl: 'swangle' },
    onBrowserLog: log => { if (log.type === 'error') events.pageErrors.push(log.text); } };
  const composition = await selectComposition({ ...options, id: compositionId });
  if(frameRange&&frameRange[1]>=composition.durationInFrames)throw Error('Excerpt exceeds composition frame bounds');
  const renderStart = performance.now();
  await renderMedia({ ...options, composition, codec: 'h264', crf: 17, pixelFormat: 'yuv420p',
    imageFormat: 'png', outputLocation: output, concurrency: 1, frameRange, audioCodec,
    onBrowserDownload: () => { throw new Error('Automatic Chrome download disabled. Set CHROME_PATH.'); },
    onProgress: p => { if (p.renderedFrames % 48 === 0) console.log('Rendered', p.renderedFrames); },
  });
  if ((await sourceSnapshot()).sha256 !== source.sha256) throw new Error('Source changed during export; rerender before review');
  if (events.pageErrors.length) throw new Error(`Browser errors: ${events.pageErrors.join('; ')}`);
  await writeFile(frameRange?`qa/${compositionId}-excerpt-${frameRange[0]}-${frameRange[1]}.json`:(compositionId === 'PinkMonkey' ? 'qa/remotion-render.json' : `qa/${compositionId}-render.json`), JSON.stringify({ version:2, sourceSchema:'image-export-v2', method: frameRange?'official @remotion/renderer renderMedia excerpt (QA only)':'official @remotion/renderer renderMedia',
    sourceSha256: source.sha256, outputSha256: digest(await readFile(output)), output,
    composition: composition.id, frames: frameRange?frameRange[1]-frameRange[0]+1:composition.durationInFrames, ...(frameRange?{frameRange,compositionFrames:composition.durationInFrames}:{}), fps: composition.fps,
    width: composition.width, height: composition.height, bundleMs, renderMediaMs: performance.now() - renderStart,
    concurrency: 1, ...(audioCodec?{audioCodec}:{}), platform: process.platform, ...events,
    note: 'Network image audit and seek are separately measured by scripts/check-port.mjs.' }, null, 2));
  console.log('Rendered', output);
} finally { await rm(temporary, { recursive: true, force: true }); }
