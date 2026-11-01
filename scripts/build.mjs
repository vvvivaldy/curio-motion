import { build } from 'vite';
import { cp } from 'node:fs/promises';
import {localOnlyInputs,distributionFilter} from './lib/distribution.mjs';
const localInputs=await localOnlyInputs();
await build();
// Public references and authored films belong in the viewer. The user's local
// recording is an authoring input, excluded from distribution as well as Git.
for (const folder of ['docs/assets', 'reference']) await cp(folder, `dist/${folder}`, {
  recursive: true,
  filter: distributionFilter(localInputs),
});
