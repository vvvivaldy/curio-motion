import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, isAbsolute } from 'node:path';
const root = resolve('.');
const lines = (await readFile('MANIFEST.sha256', 'utf8')).trim().split('\n');
for (const line of lines) {
  const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
  if (!match) throw Error('Invalid manifest line');
  const [, expected, name] = match;
  const file = resolve(root, name), local = relative(root, file);
  if (isAbsolute(name) || local.startsWith('..') || isAbsolute(local)) throw Error('Unsafe manifest path');
  const actual = createHash('sha256').update(await readFile(file)).digest('hex');
  if (actual !== expected) throw Error(`Checksum mismatch: ${name}`);
}
console.log(`Verified ${lines.length} payload files. MANIFEST.sha256 is deliberately not self-hashed.`);
