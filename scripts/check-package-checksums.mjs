import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyChecksumTree, refreshChecksumTree, provenanceBindings, verifyProvenanceBindings, refreshProvenanceBindings} from './lib/package-checksums.mjs';

const bytes = text => Buffer.from(text);
const sha = data => createHash('sha256').update(data).digest('hex');
const mapBytes = map => [...map].map(([name, value]) => [name, value.toString('hex')]);
const rootOnly = input => {
  const result = new Map(input);
  result.set('MANIFEST.sha256', bytes([...result.keys()].filter(name => name !== 'MANIFEST.sha256').sort()
    .map(name => `${sha(result.get(name))}  ${name}\n`).join('')));
  return result;
};
function courierScope() {
  const files = new Map(Array.from({length: 73}, (_, i) => [`assets/sfx/courier/file-${String(i).padStart(2, '0')}.txt`, bytes(`unchanged ${i}`)]));
  files.set('assets/sfx/courier/SHA256SUMS.txt', bytes(''));
  return files;
}

test('closed root and all 73 inner entries verify; refresh is pure and deterministic', () => {
  const initial = courierScope(), before = mapBytes(initial), refreshed = refreshChecksumTree(initial);
  assert.deepEqual(mapBytes(initial), before);
  assert.notEqual(refreshed, initial);
  const result = verifyChecksumTree(refreshed);
  assert.equal(result.manifests, 2);
  assert.equal(result.rootEntries, 74);
  assert.equal(result.nestedEntries, 73);
  assert.equal(result.entries, 147);
  assert.deepEqual(mapBytes(refreshChecksumTree(refreshed)), mapBytes(refreshed));
});

test('a fresh outer root cannot hide a changed file behind stale inner checksums', () => {
  const valid = refreshChecksumTree(courierScope()), changed = new Map(valid);
  const target = 'assets/sfx/courier/file-42.txt';
  changed.set(target, bytes('new retained HTML or asset'));
  const freshOuter = rootOnly(changed);
  assert.match(freshOuter.get('MANIFEST.sha256').toString(), new RegExp(sha(changed.get(target))));
  assert.throws(() => verifyChecksumTree(freshOuter), /Checksum mismatch in assets\/sfx\/courier\/SHA256SUMS.txt/);
});

test('refresh deepest manifests before ancestors and the root', () => {
  const files = new Map([['assets/one.txt', bytes('a')], ['assets/sub/two.txt', bytes('b')],
    ['assets/SHA256SUMS.txt', bytes('')], ['assets/sub/MANIFEST.sha256', bytes('')]]);
  const refreshed = refreshChecksumTree(files);
  assert.equal(verifyChecksumTree(refreshed).manifests, 3);
  assert.match(refreshed.get('assets/SHA256SUMS.txt').toString(), new RegExp(sha(refreshed.get('assets/sub/MANIFEST.sha256'))));
});

test('unlisted extras, missing targets and missing required root are rejected', () => {
  const valid = refreshChecksumTree(new Map([['one.txt', bytes('one')]]));
  const extra = new Map(valid); extra.set('unlisted.txt', bytes('two'));
  assert.throws(() => verifyChecksumTree(extra), /coverage mismatch/);
  const missing = new Map(valid); missing.delete('one.txt');
  assert.throws(() => verifyChecksumTree(missing), /Missing checksum target/);
  assert.throws(() => verifyChecksumTree(courierScope()), /Missing root/);
  const nested = refreshChecksumTree(courierScope()); nested.delete('MANIFEST.sha256');
  assert.equal(verifyChecksumTree(nested, {requireRoot: false}).nestedEntries, 73);
});

test('unsafe paths are rejected on verify and refresh, rather than silently normalized', () => {
  for (const name of ['../escape', '/absolute', 'C:/escape', 'C:\\escape', 'nested/../../escape', './leaf', 'nested//leaf', 'x\u0000y']) {
    const files = new Map([['MANIFEST.sha256', bytes(`${'0'.repeat(64)}  ${name}\n`)]]);
    assert.throws(() => verifyChecksumTree(files), /Unsafe|Invalid checksum/);
    assert.throws(() => refreshChecksumTree(files), /Unsafe|Invalid checksum/);
  }
});

test('duplicate entries, self hashes, malformed lines and ambiguous peers are rejected', () => {
  const file = bytes('leaf'), line = `${sha(file)}  leaf\n`;
  assert.throws(() => verifyChecksumTree(new Map([['leaf', file], ['MANIFEST.sha256', bytes(line + line)]])), /Duplicate checksum/);
  assert.throws(() => refreshChecksumTree(new Map([['MANIFEST.sha256', bytes(`${'0'.repeat(64)}  MANIFEST.sha256\n`)]])), /hash itself/);
  assert.throws(() => refreshChecksumTree(new Map([['MANIFEST.sha256', bytes('not a digest\n')]])), /Invalid checksum/);
  assert.throws(() => refreshChecksumTree(new Map([['MANIFEST.sha256', bytes('')], ['SHA256SUMS.txt', bytes('')]])), /Ambiguous/);
});

const MANIFEST = 'assets/sfx/courier/manifest.json';
const PAGE = 'assets/sfx/courier/sources/page.html';
const SOURCE = 'assets/sfx/courier/originals/source.mp3';
const LICENSE = 'assets/sfx/courier/sources/license.txt';
const WORKING = 'assets/sfx/courier/assets/clip.wav';
const PUBLIC = 'public/audio/sfx/courier/clip.wav';
function provenanceFixture() {
  const files = new Map([[PAGE, bytes('retained page')], [SOURCE, bytes('original audio')],
    [LICENSE, bytes('license text')], [WORKING, bytes('working PCM')], [PUBLIC, bytes('working PCM')]]);
  const doc = {sources: [{id: 'source', sourceFile: 'originals/source.mp3', sourceSha256: sha(files.get(SOURCE)),
    pageFile: 'sources/page.html', pageSha256: sha(files.get(PAGE)),
    licenseEvidenceFile: 'sources/license.txt', licenseEvidenceSha256: sha(files.get(LICENSE))}],
  entries: [{id: 'clip', sourceId: 'source', packageFile: 'assets/clip.wav', path: PUBLIC, sha256: sha(files.get(WORKING)),
    derivation: {sourceFile: 'originals/source.mp3', sourceSha256: sha(files.get(SOURCE)), preparationScriptSha256: '1'.repeat(64)}}],
  verificationBaseline: {inventoryFile: 'analysis/history.json', inventorySha256: '2'.repeat(64)},
  unrelatedOldPageHash: sha(files.get(PAGE))};
  files.set(MANIFEST, bytes(JSON.stringify(doc, null, 4) + '\n'));
  return files;
}

test('current local source/page/license and duplicated package/public assets are bound', () => {
  const files = provenanceFixture(), bindings = provenanceBindings(files);
  assert.deepEqual(verifyProvenanceBindings(files), {bindings: 6, targets: 5, manifests: 1});
  assert.equal(bindings.filter(b => b.path === '/entries/0' && b.field === 'sha256').length, 2);
  assert(!bindings.some(b => /generator|Script|Baseline|unrelated/.test(b.field)));
});

test('addressed HTML refresh preserves formatting, unrelated hashes and original input Map', () => {
  const original = provenanceFixture(), oldText = original.get(MANIFEST).toString(), oldSha = sha(original.get(PAGE));
  const changed = new Map(original); changed.set(PAGE, bytes('clean retained page'));
  assert.throws(() => verifyProvenanceBindings(changed), /Provenance checksum mismatch/);
  const refreshed = refreshProvenanceBindings(changed, new Set([PAGE])), newSha = sha(changed.get(PAGE));
  assert.deepEqual(verifyProvenanceBindings(refreshed), {bindings: 6, targets: 5, manifests: 1});
  assert.equal(refreshed.get(MANIFEST).toString().replace(newSha, oldSha), oldText);
  assert.equal(JSON.parse(refreshed.get(MANIFEST)).unrelatedOldPageHash, oldSha);
  assert.equal(original.get(MANIFEST).toString(), oldText);
  assert.equal(refreshed.get(SOURCE), original.get(SOURCE));
  assert.equal(refreshed.get(WORKING), original.get(WORKING));
});

test('all duplicate current JSON page references refresh, historical analysis stays unchanged', () => {
  const files = provenanceFixture(), doc = JSON.parse(files.get(MANIFEST));
  const duplicate = 'assets/sfx/courier/sources.json';
  files.set(duplicate, bytes(JSON.stringify(doc.sources)));
  const history = 'assets/sfx/courier/analysis/history.json';
  files.set(history, bytes(JSON.stringify({path: '/old/missing', sha256: '3'.repeat(64)})));
  files.set(PAGE, bytes('new page'));
  const refreshed = refreshProvenanceBindings(files, [PAGE]);
  assert.equal(JSON.parse(refreshed.get(duplicate))[0].pageSha256, sha(files.get(PAGE)));
  assert.equal(JSON.parse(refreshed.get(MANIFEST)).sources[0].pageSha256, sha(files.get(PAGE)));
  assert.equal(refreshed.get(history), files.get(history));
  assert.equal(verifyProvenanceBindings(refreshed).bindings, 9);
});

test('divergent copies sharing a hash field cannot be silently rebound', () => {
  const files = provenanceFixture(); files.set(WORKING, bytes('different working PCM'));
  assert.throws(() => verifyProvenanceBindings(files), /Provenance checksum mismatch/);
  assert.throws(() => refreshProvenanceBindings(files, [WORKING]), /Conflicting provenance copies/);
});

test('sourcePath OGG-to-WAV records resolve their current source, without a sourceId', () => {
  const ogg = 'public/audio/sfx/footsteps/tile/0.ogg', wav = 'public/audio/sfx/footsteps/tile/0.wav';
  const files = new Map([[ogg, bytes('OGG')], [wav, bytes('PCM')]]);
  files.set('public/audio/sfx/catalog.json', bytes(JSON.stringify({entries: [{path: ogg, sha256: sha(files.get(ogg)),
    wav: {path: wav, sha256: sha(files.get(wav)), derivation: {sourcePath: ogg, sourceSha256: sha(files.get(ogg)), scriptSha256: '4'.repeat(64)}}}]})));
  assert.deepEqual(verifyProvenanceBindings(files), {bindings: 3, targets: 2, manifests: 1});
});

test('chair legacy evidence addresses map only to retained local copies; old download identity stays history', () => {
  const source = 'assets/sfx/chair/originals/source.mp3', page = 'assets/sfx/chair/sources/chair.html', license = 'assets/sfx/chair/sources/cc0.html';
  const files = new Map([[source, bytes('MP3')], [page, bytes('HTML')], [license, bytes('deed')]]);
  const manifest = 'assets/sfx/chair/sources-manifest.json';
  files.set(manifest, bytes(JSON.stringify({sources: [{id: 'chair', file: 'source.mp3', sha256: sha(files.get(source)),
    unalteredDownloadedBytes: {path: '/old/download/source.mp3', sha256: '0'.repeat(64)},
    sourceEvidence: {path: '/old/workspace/sources/chair.html', sha256: sha(files.get(page))},
    licenseEvidence: [{path: '/old/workspace/sources/cc0.html', sha256: sha(files.get(license))}]}]})));
  assert.deepEqual(verifyProvenanceBindings(files), {bindings: 3, targets: 3, manifests: 1});
  files.set(page, bytes('redacted HTML'));
  const refreshed = refreshProvenanceBindings(files, [page]), record = JSON.parse(refreshed.get(manifest)).sources[0];
  assert.equal(record.sourceEvidence.path, '/old/workspace/sources/chair.html');
  assert.equal(record.sourceEvidence.sha256, sha(files.get(page)));
  assert.equal(record.unalteredDownloadedBytes.sha256, '0'.repeat(64));
});

test('missing targets, traversal and invalid SHA are rejected without reading external paths', () => {
  const missing = provenanceFixture(); missing.delete(PAGE);
  assert.throws(() => verifyProvenanceBindings(missing), /Missing provenance target/);
  const unsafe = provenanceFixture(), doc = JSON.parse(unsafe.get(MANIFEST));
  doc.sources[0].pageFile = '../outside.html'; unsafe.set(MANIFEST, bytes(JSON.stringify(doc)));
  assert.throws(() => provenanceBindings(unsafe), /Unsafe checksum path/);
  doc.sources[0].pageFile = 'sources/page.html'; doc.sources[0].pageSha256 = 'bad'; unsafe.set(MANIFEST, bytes(JSON.stringify(doc)));
  assert.throws(() => provenanceBindings(unsafe), /Invalid provenance SHA/);
});

test('malformed JSON and duplicate keys report only the metadata filename', () => {
  for (const text of ['{"sensitive":"example-do-not-echo",', '{"sources":[],"sources":[]}']) {
    assert.throws(() => provenanceBindings(new Map([[MANIFEST, bytes(text)]])), error =>
      error.message === `Invalid provenance JSON: ${MANIFEST}` && !error.message.includes('example-do-not-echo'));
  }
});

test('redact workflow updates only current bindings, then refreshes inner and root trees', () => {
  const initial = provenanceFixture(); initial.set('assets/sfx/courier/SHA256SUMS.txt', bytes(''));
  const clean = refreshChecksumTree(initial), changed = new Map(clean); changed.set(PAGE, bytes('redacted page'));
  const rebound = refreshProvenanceBindings(changed, [PAGE]);
  assert.throws(() => verifyChecksumTree(rootOnly(rebound)), /Checksum mismatch in assets\/sfx\/courier\/SHA256SUMS.txt/);
  const final = refreshChecksumTree(rebound);
  assert.equal(verifyChecksumTree(final).manifests, 2);
  assert.equal(verifyProvenanceBindings(final).bindings, 6);
});
