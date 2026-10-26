import { spawnSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { findTool, verifyFfmpeg } from './tools.mjs';

// Documentation derivative only: never imported by the Pixi/Remotion scene.
const input = resolve(process.env.GIF_INPUT ?? 'docs/assets/demo-v2.mp4');
const output = resolve(process.env.GIF_OUTPUT ?? 'docs/assets/demo.gif');
if (input === output) throw new Error('GIF input and output must differ');
const ffmpeg = findTool('ffmpeg');
verifyFfmpeg(ffmpeg);
await mkdir(dirname(output), { recursive: true });
const filter = '[0:v]fps=12,scale=720:-1:flags=lanczos,split[a][b];'
  + '[a]palettegen=max_colors=128:stats_mode=diff[p];'
  + '[b][p]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle';
const result = spawnSync(ffmpeg, ['-v', 'error', '-y', '-i', input, '-filter_complex', filter,
  '-loop', '0', output], { encoding: 'utf8', windowsHide: true });
if (result.status !== 0) throw new Error(result.stderr || 'GIF export failed');
console.log('Created 720px / 12 fps README preview:', output);
