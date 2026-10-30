import { build } from 'vite';
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';
const privateCatReference=resolve('reference/black-cat-chair');
await build();
// Keep the bundled film and reference available in the static viewer as well.
for (const folder of ['docs/assets', 'reference']) await cp(folder, `dist/${folder}`, { recursive: true, filter: source => resolve(source)!==privateCatReference });
