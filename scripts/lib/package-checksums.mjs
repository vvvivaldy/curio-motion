import {createHash} from 'node:crypto';
import {posix, win32} from 'node:path';

const ROOT_MANIFEST = 'MANIFEST.sha256';
const CHECKSUM_NAMES = new Set([ROOT_MANIFEST, 'SHA256SUMS.txt']);
const hex = /^[a-f0-9]{64}$/i;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const utf8 = bytes => {
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) throw Error('BOM is not supported in checksum metadata');
  return new TextDecoder('utf-8', {fatal: true}).decode(bytes);
};

function safePath(name) {
  if (typeof name !== 'string' || !name || name.trim() !== name || posix.isAbsolute(name) || win32.isAbsolute(name) ||
      /[\\:\x00-\x1f\x7f]/.test(name) || name.split('/').some(part => !part || part === '.' || part === '..'))
    throw Error('Unsafe checksum path');
  return name;
}
function fileMap(files) {
  if (!(files instanceof Map)) throw TypeError('Expected Map<string, Buffer>');
  for (const [name, bytes] of files) {
    safePath(name);
    if (!Buffer.isBuffer(bytes)) throw TypeError(`Expected Buffer for ${name}`);
  }
  return files;
}
function checksumNames(files) {
  const names = [...files.keys()].filter(name => CHECKSUM_NAMES.has(posix.basename(name))).sort();
  const directories = new Set();
  for (const name of names) {
    const directory = posix.dirname(name);
    if (directories.has(directory)) throw Error(`Ambiguous checksum manifests in ${directory}`);
    directories.add(directory);
  }
  return names;
}
function scopedNames(files, manifest) {
  const directory = posix.dirname(manifest), prefix = directory === '.' ? '' : `${directory}/`;
  return [...files.keys()].filter(name => name !== manifest && name.startsWith(prefix)).sort();
}
function readManifest(files, manifest) {
  const text = utf8(files.get(manifest)), lines = text ? text.split(/\r?\n/) : [];
  if (lines.at(-1) === '') lines.pop();
  const entries = [], seen = new Set(), directory = posix.dirname(manifest);
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  (.+)$/i.exec(line);
    if (!match) throw Error(`Invalid checksum line in ${manifest}`);
    const local = safePath(match[2]);
    const target = safePath(directory === '.' ? local : `${directory}/${local}`);
    if (target === manifest) throw Error(`Checksum manifest cannot hash itself: ${manifest}`);
    if (seen.has(target)) throw Error(`Duplicate checksum path in ${manifest}: ${target}`);
    seen.add(target);
    entries.push({target, sha256: match[1].toLowerCase()});
  }
  return entries;
}

/** Exact closed scopes, including inner manifests independently of the outer digest. */
export function verifyChecksumTree(files, {requireRoot = true} = {}) {
  fileMap(files);
  if (requireRoot && !files.has(ROOT_MANIFEST)) throw Error('Missing root MANIFEST.sha256');
  const names = checksumNames(files), byManifest = [];
  for (const manifest of names) {
    const entries = readManifest(files, manifest), expected = scopedNames(files, manifest);
    const listed = new Set(entries.map(entry => entry.target));
    for (const entry of entries) {
      if (!files.has(entry.target)) throw Error(`Missing checksum target in ${manifest}: ${entry.target}`);
      if (hash(files.get(entry.target)) !== entry.sha256) throw Error(`Checksum mismatch in ${manifest}: ${entry.target}`);
    }
    if (listed.size !== expected.length || expected.some(name => !listed.has(name)))
      throw Error(`Checksum coverage mismatch in ${manifest}`);
    byManifest.push({manifest, entries: entries.length});
  }
  const rootEntries = byManifest.find(item => item.manifest === ROOT_MANIFEST)?.entries ?? 0;
  const entries = byManifest.reduce((sum, item) => sum + item.entries, 0);
  return {files: files.size, manifests: names.length, entries, rootEntries, nestedEntries: entries - rootEntries, byManifest};
}

/** Capture bytes before calling. This function never reads/writes a filesystem. */
export function refreshChecksumTree(files) {
  fileMap(files);
  // Reject malformed/unsafe old instructions even though entries are regenerated.
  for (const manifest of checksumNames(files)) readManifest(files, manifest);
  const result = new Map(files);
  if (!result.has(ROOT_MANIFEST)) result.set(ROOT_MANIFEST, Buffer.alloc(0));
  const manifests = checksumNames(result).sort((a, b) => b.split('/').length - a.split('/').length || (a < b ? -1 : a > b ? 1 : 0));
  for (const manifest of manifests) {
    const directory = posix.dirname(manifest);
    const text = scopedNames(result, manifest).map(name => `${hash(result.get(name))}  ${directory === '.' ? name : posix.relative(directory, name)}\n`).join('');
    result.set(manifest, Buffer.from(text));
  }
  return result;
}

// Current local SFX metadata only. Historical generator/script, baseline inventory,
// original archive, original download paths/bytes, old QA and redaction-log SHA
// identities are deliberately not rewritten. This is not a licensing/DSP audit.
const PROFILES = new Set([
  'assets/sfx/courier/manifest.json', 'assets/sfx/courier/sources.json', 'assets/sfx/courier/catalog-entries.json',
  'public/audio/sfx/courier/catalog.json', 'public/audio/sfx/catalog.json', 'public/audio/sfx/story/catalog.json',
  'assets/sfx/story/sources.json', 'assets/sfx/story/cuts-manifest.json',
  'assets/sfx/chair/sources-manifest.json', 'assets/sfx/chair/cuts-manifest.json',
  'assets/sfx/provenance/footsteps-source-handoff.json', 'public/audio/human-chair/provenance.json',
]);
const pointer = (parent, key) => `${parent}/${String(key).replaceAll('~', '~0').replaceAll('/', '~1')}`;
function resolveLocal(manifest, name, role = '') {
  safePath(name);
  if (name.startsWith('public/') || name.startsWith('assets/sfx/') || name.startsWith('scripts/')) return name;
  if (name.startsWith('audio/')) return `public/${name}`;
  if (manifest.startsWith('assets/sfx/chair/')) return `assets/sfx/chair/${role === 'source' ? 'originals' : 'sources'}/${name}`;
  return safePath(`${posix.dirname(manifest)}/${name}`);
}
function retainedChairEvidence(name) {
  if (typeof name !== 'string' || /[\x00-\x1f\x7f]/.test(name)) throw Error('Unsafe chair evidence path');
  // Old download-workspace addresses are provenance, never filesystem inputs.
  return safePath(`assets/sfx/chair/sources/${posix.basename(name.replaceAll('\\', '/'))}`);
}

function documents(files) {
  const result = new Map();
  for (const manifest of [...PROFILES].sort()) if (files.has(manifest)) {
    try {
      const text = utf8(files.get(manifest)), value = JSON.parse(text);
      stringSpans(text); // Also reject ambiguous duplicate keys, without echoing metadata.
      result.set(manifest, {text, value});
    } catch {
      throw Error(`Invalid provenance JSON: ${manifest}`);
    }
  }
  return result;
}
function sourceTargets(docs) {
  const targets = new Map();
  for (const [manifest, {value}] of docs) {
    const rows = Array.isArray(value) ? value : Array.isArray(value.sources) ? value.sources :
      value.sources && typeof value.sources === 'object' ? Object.entries(value.sources).map(([id, record]) => ({id, ...record})) : [];
    for (const row of rows) if (row?.id && (row.sourceFile || manifest.startsWith('assets/sfx/chair/') && row.file)) {
      const target = resolveLocal(manifest, row.sourceFile ?? row.file, 'source');
      const set = targets.get(row.id) ?? new Set(); set.add(target); targets.set(row.id, set);
    }
  }
  return targets;
}

/** JSON path is an object pointer; field names only the SHA string to replace. */
export function provenanceBindings(files) {
  fileMap(files);
  const docs = documents(files), sources = sourceTargets(docs), bindings = [], seen = new Set();
  function add(manifest, path, field, target, sha256) {
    safePath(target);
    if (typeof sha256 !== 'string' || !hex.test(sha256)) throw Error(`Invalid provenance SHA: ${manifest}#${pointer(path, field)}`);
    const identity = JSON.stringify([manifest, path, field, target]);
    if (!seen.has(identity)) { seen.add(identity); bindings.push({manifest, path, field, target, sha256: sha256.toLowerCase()}); }
  }
  for (const [manifest, {value}] of docs) {
    function walk(node, path = '') {
      if (Array.isArray(node)) { node.forEach((item, index) => walk(item, pointer(path, index))); return; }
      if (!node || typeof node !== 'object') return;
      const historical = path.includes('/unalteredDownloadedBytes') || manifest.endsWith('footsteps-source-handoff.json') && path.startsWith('/files');
      if (historical) return;
      for (const [fileField, shaField] of [['sourceFile', 'sourceSha256'], ['pageFile', 'pageSha256'], ['licenseEvidenceFile', 'licenseEvidenceSha256'], ['sourcePageEvidence', 'sourcePageEvidenceSha256'], ['materialLicenseNotice', 'materialLicenseNoticeSha256'], ['wav', 'wavSha256'], ['mp3', 'mp3Sha256']]) {
        if (!Object.hasOwn(node, shaField)) continue;
        if (shaField === 'sourceSha256' && !node.sourceFile) {
          if (node.sourcePath) add(manifest, path, shaField, resolveLocal(manifest, node.sourcePath, 'source'), node[shaField]);
          else {
            const candidates = sources.get(node.sourceId);
            if (!candidates || candidates.size !== 1) throw Error(`Unresolved provenance source: ${manifest}#${path}`);
            add(manifest, path, shaField, [...candidates][0], node[shaField]);
          }
        } else {
          let target;
          if (fileField === 'sourcePageEvidence' && manifest.endsWith('footsteps-source-handoff.json') && typeof node[fileField] === 'string' && (posix.isAbsolute(node[fileField]) || win32.isAbsolute(node[fileField])))
            target = safePath(`assets/sfx/provenance/${posix.basename(node[fileField].replaceAll('\\', '/'))}`);
          else target = resolveLocal(manifest, node[fileField], fileField === 'sourceFile' ? 'source' : '');
          add(manifest, path, shaField, target, node[shaField]);
        }
      }
      if (Object.hasOwn(node, 'sha256')) {
        if (manifest === 'assets/sfx/chair/sources-manifest.json' && (path.includes('/sourceEvidence') || path.includes('/licenseEvidence/')))
          add(manifest, path, 'sha256', retainedChairEvidence(node.path), node.sha256);
        else if (manifest.startsWith('assets/sfx/chair/') && node.file)
          add(manifest, path, 'sha256', node.file.endsWith('.mp3') ? resolveLocal(manifest, node.file, 'source') : safePath(`public/audio/sfx/chair/${node.file}`), node.sha256);
        else {
          if (node.packageFile) add(manifest, path, 'sha256', resolveLocal(manifest, node.packageFile), node.sha256);
          if (node.path) add(manifest, path, 'sha256', resolveLocal(manifest, node.path), node.sha256);
          if (!node.path && !node.packageFile && node.file) add(manifest, path, 'sha256', resolveLocal(manifest, node.file), node.sha256);
        }
      }
      for (const [key, child] of Object.entries(node)) if (child && typeof child === 'object') walk(child, pointer(path, key));
    }
    walk(value);
  }
  return bindings.sort((a, b) => { const x = JSON.stringify([a.manifest, a.path, a.field, a.target]), y = JSON.stringify([b.manifest, b.path, b.field, b.target]); return x < y ? -1 : x > y ? 1 : 0; });
}

export function verifyProvenanceBindings(files) {
  const bindings = provenanceBindings(files);
  for (const b of bindings) {
    if (!files.has(b.target)) throw Error(`Missing provenance target: ${b.manifest}#${pointer(b.path, b.field)}`);
    if (hash(files.get(b.target)) !== b.sha256) throw Error(`Provenance checksum mismatch: ${b.manifest}#${pointer(b.path, b.field)}`);
  }
  return {bindings: bindings.length, targets: new Set(bindings.map(b => b.target)).size, manifests: new Set(bindings.map(b => b.manifest)).size};
}

/** Locate JSON string tokens so unrelated formatting/history is byte-preserved. */
function stringSpans(text) {
  JSON.parse(text);
  let offset = 0;
  const spans = new Map(), whitespace = () => { while (/\s/.test(text[offset] ?? '') && offset < text.length) offset++; };
  function string() {
    const start = offset++;
    while (text[offset] !== '"') { if (text[offset] === '\\') offset++; offset++; }
    offset++; return {start, end: offset, value: JSON.parse(text.slice(start, offset))};
  }
  function value(path) {
    whitespace();
    if (text[offset] === '"') { spans.set(path, string()); return; }
    if (text[offset] === '{') {
      offset++; whitespace(); const keys = new Set();
      if (text[offset] === '}') { offset++; return; }
      for (;;) {
        whitespace(); const key = string().value;
        if (keys.has(key)) throw Error(`Duplicate JSON key at ${pointer(path, key)}`);
        keys.add(key); whitespace(); offset++; value(pointer(path, key)); whitespace();
        if (text[offset++] === '}') return;
      }
    }
    if (text[offset] === '[') {
      offset++; whitespace(); if (text[offset] === ']') { offset++; return; }
      for (let index = 0;; index++) { value(pointer(path, index)); whitespace(); if (text[offset++] === ']') return; }
    }
    while (offset < text.length && !/[\s,\]}]/.test(text[offset])) offset++;
  }
  value(''); return spans;
}

export function refreshProvenanceBindings(files, changedTargetPaths = []) {
  fileMap(files);
  const changed = new Set([...changedTargetPaths].map(safePath)), result = new Map(files), bindings = provenanceBindings(files), byField = new Map();
  for (const name of changed) if (!files.has(name)) throw Error('Missing changed provenance target');
  for (const b of bindings) {
    const id = JSON.stringify([b.manifest, b.path, b.field]), records = byField.get(id) ?? [];
    records.push(b); byField.set(id, records);
  }
  const edits = new Map();
  for (const records of byField.values()) {
    if (!records.some(b => changed.has(b.target))) continue;
    const digests = new Set(records.map(b => {
      if (!files.has(b.target)) throw Error(`Missing provenance target: ${b.manifest}#${pointer(b.path, b.field)}`);
      return hash(files.get(b.target));
    }));
    if (digests.size !== 1) throw Error(`Conflicting provenance copies: ${records[0].manifest}#${records[0].path}`);
    const b = records[0], list = edits.get(b.manifest) ?? [];
    list.push({pointer: pointer(b.path, b.field), digest: [...digests][0]}); edits.set(b.manifest, list);
  }
  for (const [manifest, changes] of edits) {
    let text = utf8(files.get(manifest)); const spans = stringSpans(text);
    const replacements = changes.map(change => {
      const span = spans.get(change.pointer);
      if (!span || !hex.test(span.value)) throw Error(`Missing provenance hash token: ${manifest}#${change.pointer}`);
      return {...span, digest: change.digest};
    }).sort((a, b) => b.start - a.start);
    for (const change of replacements) text = text.slice(0, change.start) + JSON.stringify(change.digest) + text.slice(change.end);
    result.set(manifest, Buffer.from(text));
  }
  return result;
}
