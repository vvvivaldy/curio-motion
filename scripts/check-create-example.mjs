import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm, symlink, readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const execute = promisify(execFile);
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
import {createHash} from 'node:crypto';
import {createExample} from './create-example.mjs';
import {validatePlan} from './lib/authoring.mjs';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const options = {id: 'test-owl', composition: 'TestOwl', title: 'Test owl', reference: 'reference/whole.svg', actionFile: 'reference/ACTION.txt', provenance: 'Owner-supplied whole study'};
async function fixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'curio-starter-'));
  try {
    await mkdir(join(root, 'src/examples'), {recursive: true});
    await mkdir(join(root, 'reference'));
    await writeFile(join(root, 'src/examples/scenes.ts'), "export const scenes = {'old-scene': entry('OldScene', scene)};");
    await writeFile(join(root, 'reference/whole.svg'), '<svg>whole input</svg>');
    await writeFile(join(root, 'reference/ACTION.txt'), Buffer.from('ACTION\r\nСядь и замри.\r\n'));
    await run(root);
  } finally { await rm(root, {recursive: true, force: true}); }
}
test('starter preserves ACTION bytes, pins input, and supplies a compatible typed scene and review plan', () => fixture(async root => {
  const result = await createExample({...options, width: 960, fps: 29.97, frames: 90}, root);
  const action = await readFile(join(root, options.actionFile));
  assert.deepEqual(await readFile(join(root, 'authoring/test-owl.action.txt')), action);
  const input = JSON.parse(await readFile(join(root, 'authoring/test-owl.inputs.json'), 'utf8'));
  assert.equal(input.reference.runtimeUsage, false);
  assert.equal(input.reference.distribution, 'local-only');
  assert.equal(input.reference.sha256, digest(await readFile(join(root, options.reference))));
  assert.equal(input.reference.provenance, options.provenance);
  assert.equal(input.action.sha256, digest(action));
  const plan = validatePlan(JSON.parse(await readFile(join(root, result.plan), 'utf8')));
  assert.equal(plan.settings.fps, 29.97);
  assert.equal(plan.stages.final.samples.at(-1).frame, 89);
  assert.match(await readFile(join(root, 'src/examples/test-owl/scene.ts'), 'utf8'), /SceneDefinition<Pose, Drawing>/);
  assert.match(await readFile(join(root, result.registration), 'utf8'), /entry\('TestOwl', testOwlScene\)/);
  await assert.rejects(createExample(options, root), /existing|overwrite/);
  assert.deepEqual(await readFile(join(root, 'authoring/test-owl.action.txt')), action);
}));
test('invalid settings, identity, duplicate registry and outside inputs fail before output creation', () => fixture(async root => {
  for (const extra of [{id: '../escape'}, {composition: 'bad-id'}, {width: 0}, {fps: Infinity}, {composition: 'OldScene'}, {provenance: ''}]) {
    await assert.rejects(createExample({...options, ...extra}, root));
    assert.deepEqual(await readdir(join(root, 'src/examples')), ['scenes.ts']);
  }
}));
test('existing authoring files survive conflicts and output symlinks cannot escape; external whole inputs are copied', () => fixture(async root => {
  const outside = await mkdtemp(join(tmpdir(), 'curio-outside-'));
  try {
    await symlink(outside, join(root, 'authoring'));
    await assert.rejects(createExample(options, root), /Symlink escapes/);
    assert.deepEqual(await readdir(outside), []);
    await rm(join(root, 'authoring'));
    await mkdir(join(root, 'authoring'));
    await writeFile(join(root, 'authoring/test-owl.json'), 'existing owner plan');
    await assert.rejects(createExample(options, root), /overwrite/);
    assert.equal(await readFile(join(root, 'authoring/test-owl.json'), 'utf8'), 'existing owner plan');
    assert.deepEqual(await readdir(join(root, 'src/examples')), ['scenes.ts']);
    await writeFile(join(outside, 'whole.svg'), '<svg/>');
    await symlink(join(outside, 'whole.svg'), join(root, 'reference/link.svg'));
    await rm(join(root, 'authoring/test-owl.json'));
    const result = await createExample({...options, reference: 'reference/link.svg'}, root);
    assert.equal(await readFile(join(root, 'reference/test-owl/whole.svg'), 'utf8'), '<svg/>');
    assert.equal(await readFile(join(root, 'reference/test-owl/.gitignore'), 'utf8'), '/whole.*\n');
    assert.equal(result.id, 'test-owl');
  } finally { await rm(outside, {recursive: true, force: true}); }
}));

test('generated scene typechecks against the real stage API and imports with Pixi objects', () => fixture(async root => {
  await createExample(options, root);
  await mkdir(join(root, 'src/core'));
  for (const name of ['stage.ts', 'time.ts']) await writeFile(join(root, 'src/core', name), await readFile(join(projectRoot, 'src/core', name)));
  await symlink(join(projectRoot, 'node_modules'), join(root, 'node_modules'));
  await writeFile(join(root, 'tsconfig.json'), JSON.stringify({compilerOptions: {target: 'ES2022', module: 'ESNext', moduleResolution: 'Bundler', strict: true, skipLibCheck: true, noEmit: true}, include: ['src/examples/test-owl', 'src/core']}));
  await execute(process.execPath, [join(projectRoot, 'node_modules/typescript/bin/tsc'), '--project', join(root, 'tsconfig.json')]);
  const probe = join(root, 'probe.ts');
  await writeFile(probe, `import assert from 'node:assert/strict';
import {Container, Graphics} from 'pixi.js';
import {testOwlScene} from './src/examples/test-owl/scene';
const root = new Container();
const drawing = testOwlScene.createDrawing(root);
assert.equal(root.children.length, 1);
assert(drawing.contours instanceof Graphics);
assert.deepEqual(testOwlScene.pose(2), {time:2});
testOwlScene.draw(drawing, testOwlScene.pose(0), {frame:0,time:0});
root.destroy({children:true});
`);
  await execute(process.execPath, ['--import', join(projectRoot, 'node_modules/tsx/dist/loader.mjs'), probe]);
}));
