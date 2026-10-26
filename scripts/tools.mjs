import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';
import { spawnSync } from 'node:child_process';

function onPath(name) {
  const suffixes = process.platform === 'win32' ? ['', '.exe', '.cmd'] : [''];
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    for (const suffix of suffixes) {
      const candidate = join(dir, name + suffix);
      if (existsSync(candidate)) return candidate;
    }
  }
}
export function findTool(kind) {
  const key = kind === 'chrome' ? 'CHROME_PATH' : 'FFMPEG_PATH';
  const explicit = process.env[key];
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`${key} does not exist. Set it to an installed executable.`);
    return explicit;
  }
  const names = kind === 'chrome'
    ? ['google-chrome', 'chromium', 'chromium-browser', 'chrome', 'chrome-headless-shell']
    : ['ffmpeg'];
  for (const name of names) { const found = onPath(name); if (found) return found; }
  const common = kind === 'chrome' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    ...['PROGRAMFILES', 'PROGRAMFILES(X86)', 'LOCALAPPDATA'].map(key =>
      process.env[key] ? join(process.env[key], 'Google', 'Chrome', 'Application', 'chrome.exe') : ''),
  ] : ['/opt/homebrew/bin/ffmpeg', '/usr/local/bin/ffmpeg', '/usr/bin/ffmpeg'];
  const found = common.find(path => path && existsSync(path));
  if (!found) throw new Error(`Missing ${kind}. Install it separately, then set ${key} or add it to PATH. This project never downloads tools.`);
  return found;
}
export function verifyFfmpeg(path) {
  const result = spawnSync(path, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) throw new Error('FFmpeg could not run. Check FFMPEG_PATH and OS permissions.');
}
