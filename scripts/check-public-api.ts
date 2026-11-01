import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';
import './check-time';
import { sampleMarkerFrame } from './fixtures/public-api-scene';
import { transformPoint, inverseTransformPoint } from '../src/core/spatial';
import { sampleStep, treadPoint } from '../src/core/contacts';
import { evaluateFrame } from '../src/core/time';
import type { PublicApiProbe } from './fixtures/public-api-probe';

const registry = JSON.parse(readFileSync('docs/API_STABILITY.json', 'utf8')) as {
  schemaVersion: number;
  modules: Record<string, {default: string; stable: string[]}>;
  commands: {stable: string[]; experimental: string[]};
};
assert.equal(registry.schemaVersion, 1);
const expectedModules = [...readdirSync('src/core').filter(f => f.endsWith('.ts')).map(f => `src/core/${f}`),
  'src/remotion/create-scene.tsx'].sort();
assert.deepEqual(Object.keys(registry.modules).sort(), expectedModules, 'Every core/bridge module needs an explicit default status');
const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
assert.equal(config.error, undefined);
const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve('.'));
const program = ts.createProgram(parsed.fileNames, parsed.options), checker = program.getTypeChecker();
const imports = new Set<string>();
for (const file of ['scripts/fixtures/public-api-scene.ts', 'scripts/fixtures/public-api-probe.tsx']) {
  const source = program.getSourceFile(resolve(file));
  assert(source, `Missing typed consumer ${file}`);
  for (const node of source.statements) {
    if (!ts.isImportDeclaration(node) || !node.importClause?.namedBindings || !ts.isNamedImports(node.importClause.namedBindings)) continue;
    const module = checker.getSymbolAtLocation(node.moduleSpecifier);
    for (const binding of node.importClause.namedBindings.elements) {
      const name = (binding.propertyName ?? binding.name).text;
      const target = module?.declarations?.[0]?.getSourceFile().fileName;
      if (target) imports.add(`${resolve(target)}#${name}`);
    }
  }
}
let stableValues = 0, stableTypes = 0, totalExports = 0;
for (const [path, rule] of Object.entries(registry.modules)) {
  assert(['experimental', 'internal'].includes(rule.default), `Invalid default at ${path}`);
  assert.equal(new Set(rule.stable).size, rule.stable.length, `Duplicate stable name at ${path}`);
  const source = program.getSourceFile(resolve(path));
  assert(source, `Missing module ${path}`);
  const symbol = checker.getSymbolAtLocation(source);
  assert(symbol, `Not a module: ${path}`);
  const exports = checker.getExportsOfModule(symbol);
  totalExports += exports.length;
  for (const name of rule.stable) {
    const exported = exports.find(e => e.name === name);
    assert(exported, `Stale stable export: ${path}#${name}`);
    const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
    if (target.flags & ts.SymbolFlags.Value) stableValues++;
    if (target.flags & ts.SymbolFlags.Type) stableTypes++;
    assert(imports.has(`${resolve(path)}#${name}`), `Stable API lacks an explicit consumer import: ${path}#${name}`);
  }
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const commands = [...registry.commands.stable, ...registry.commands.experimental];
assert.equal(new Set(commands).size, commands.length, 'Command classifications must not overlap');
for (const command of commands) assert.equal(typeof pkg.scripts[command], 'string', `Missing classified command ${command}`);

// A caller observes units, end holds, step support and arbitrary seek order.
const first = sampleMarkerFrame(0), last = sampleMarkerFrame(47);
assert.deepEqual(first.pose.point, [20, 88]);
assert.deepEqual(last.pose.point, [140, 76]);
assert(first.pose.planted && last.pose.planted);
assert.equal(sampleMarkerFrame(21).time, .875);
assert.deepEqual(sampleMarkerFrame(21).pose.point, [80, 58]);
assert.equal(sampleMarkerFrame(21).pose.planted, false);
for (const f of [47, 21, 0, 36, 5, 0]) {
  const snapshot = sampleMarkerFrame(f);
  assert.deepEqual(snapshot, sampleMarkerFrame(f));
  assert.deepEqual(sampleMarkerFrame(0), first);
}
const failure = new Error('caller pose failure');
assert.throws(() => evaluateFrame({fps: 24, durationInFrames: 48}, () => { throw failure; }, 4), error => error === failure);
for (const scale of [.125, 1, 4]) {
  const frame = {origin: [-10, 30] as [number, number], scale};
  const point: [number, number] = [24, -16], before = structuredClone({frame, point});
  assert.deepEqual(inverseTransformPoint(transformPoint(point, frame), frame), point);
  assert.deepEqual({frame, point}, before, 'Coordinate helpers must not mutate caller inputs');
}
for (const scale of [0, -1, NaN, Infinity]) {
  assert.throws(() => transformPoint([1, 2], {origin: [0, 0], scale}), RangeError);
  assert.throws(() => inverseTransformPoint([1, 2], {origin: [0, 0], scale}), RangeError);
}
const step = {start: 2, end: 4, from: [0, 30] as [number, number], to: [40, 10] as [number, number], lift: 5,
  fromHeading: Math.PI * 3, toHeading: Math.PI * 5};
assert.equal(sampleStep(3, step).heading, Math.PI * 4, 'Headings retain the authored winding');
assert.deepEqual(sampleStep(3, step).position, [20, 15]);
assert.deepEqual(sampleStep(1, step).position, step.from);
assert.deepEqual(sampleStep(5, step).position, step.to);
for (const invalid of [{...step, end: 2}, {...step, lift: -1}, {...step, toHeading: NaN}])
  assert.throws(() => sampleStep(3, invalid), RangeError);
assert.deepEqual(treadPoint({origin: [10, 20], run: 8, rise: 2}, -2, .5), [-2, 24]);
assert.throws(() => treadPoint({origin: [0, 0], run: 8, rise: 2}, 0, 1.1), RangeError);
console.log(`PASS public API: ${expectedModules.length} classified modules, ${totalExports} resolved exports, ${stableValues} stable values / ${stableTypes} stable types; typed consumer, units/errors/reverse seek`);
