import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,symlink,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {crc32,createZip,readZip} from './lib/package-zip.mjs';
import {digest,readWorking,selectPayload,sourceSnapshotForPackage} from './lib/package-files.mjs';
import {scanCredentials,redactMapboxPage} from './lib/package-secrets.mjs';
import {makePackage,verifyPayload,compareArchiveToSource,scanGitPublication} from './lib/package-release.mjs';
import {refreshChecksumTree} from './lib/package-checksums.mjs';

const json=v=>Buffer.from(JSON.stringify(v,null,2)+'\n');
const token=()=>['pk','eyJ'+ 'Q'.repeat(28),'Z'.repeat(24)].join('.');
function fixture(){
  const policy={schemaVersion:1,rootFiles:['package.json','package-lock.json','README.md'],directories:['src','release','assets','authoring','reference'],generated:['MANIFEST.sha256','PACKAGE_SOURCE.json'],required:['package.json','package-lock.json','release/payload-policy.json'],excludedSegments:['.git','node_modules','qa','dist','outputs','__pycache__'],excludedBasenames:['.DS_Store'],excludedSuffixes:['.log','.pyc']};
  return new Map([['release/payload-policy.json',json(policy)],['package.json',json({name:'curio-motion',version:'0.2.0-beta.1',private:true})],['package-lock.json',json({version:'0.2.0-beta.1',packages:{'':{version:'0.2.0-beta.1'}}})],['src/value.ts',Buffer.from('export const value=1;\n')],['README.md',Buffer.from('Fixture only\n')]]);
}
async function put(root,path,bytes){await mkdir(dirname(join(root,path)),{recursive:true});await writeFile(join(root,path),bytes);}
async function materialize(root,files){for(const[p,b]of files)await put(root,p,b);}
const snapshot=files=>({files,source:{kind:'working-tree',baseCommit:null,commitIdentityClaim:false}});
const changedName=(bytes,from,to)=>{assert.equal(Buffer.byteLength(from),Buffer.byteLength(to));const b=Buffer.from(bytes),a=Buffer.from(from),z=Buffer.from(to);for(let i=0;(i=b.indexOf(a,i))>=0;i+=a.length)z.copy(b,i);return b;};

test('canonical ZIP is deterministic, CRC compatible, UTF-8 and exact; rejects tampering/trailing bytes',()=>{
  const files=new Map([['тест.txt',Buffer.from('Привет')],['a.bin',Buffer.from([0,1,255])]]);
  assert.equal(crc32(Buffer.from('123456789')),0xcbf43926);
  const a=createZip(files,'fixture'),b=createZip(new Map([...files].reverse()),'fixture');assert(a.equals(b));
  const decoded=readZip(a);for(const[p,bytes]of files)assert(decoded.files.get(p).equals(bytes));
  const corrupt=Buffer.from(a);corrupt[30+Buffer.byteLength('fixture/a.bin')]^=1;assert.throws(()=>readZip(corrupt),/CRC/);
  assert.throws(()=>readZip(Buffer.concat([a,Buffer.from('extra')])),/ZIP/);
});
test('ZIP reader rejects normalized traversal, duplicate entries, symlink attributes and local/central disagreement',()=>{
  const zip=createZip(new Map([['aa',Buffer.from('A')],['bb',Buffer.from('B')]]),'root');
  assert.throws(()=>readZip(changedName(zip,'root/aa','root/..')),/Unsafe/);
  assert.throws(()=>readZip(changedName(zip,'root/bb','root/aa')),/Duplicate|extra/);
  const linked=Buffer.from(zip),central=linked.indexOf(Buffer.from([0x50,0x4b,0x01,0x02]));linked.writeUInt32LE((0o120777*65536)>>>0,central+38);assert.throws(()=>readZip(linked),/profile/);
  const executable=Buffer.from(zip);executable.writeUInt32LE((0o100777*65536)>>>0,central+38);assert.throws(()=>readZip(executable),/profile/);
  const mismatch=Buffer.from(zip);mismatch[30]=0x78;assert.throws(()=>readZip(mismatch),/mismatch/);
});
test('deep policy roots cannot read through a symlink ancestor; distinct public case is not silently omitted',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-ancestors-'));
  try{
    const root=join(temp,'source'),outside=join(temp,'outside'),files=fixture();
    const p=JSON.parse(files.get('release/payload-policy.json'));p.directories.push('.agents/skills/curio-authoring');files.set('release/payload-policy.json',json(p));
    await materialize(root,files);await put(outside,'skills/curio-authoring/canary.txt','outside source');await symlink(outside,join(root,'.agents'));
    await assert.rejects(()=>readWorking(root),/Symlink.*\.agents/);
    const mixed=fixture();mixed.set('authoring/input.json',json({reference:{path:'reference/PRIVATE.PNG',distribution:'local-only'}}));mixed.set('reference/PRIVATE.PNG',Buffer.from('private'));mixed.set('reference/private.png',Buffer.from('distinct public'));
    const selected=selectPayload(mixed);assert(!selected.files.has('reference/PRIVATE.PNG'));assert.equal(selected.files.get('reference/private.png').toString(),'distinct public');
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('output alias into source is rejected before creating directories or archive files',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-output-alias-')),cli=fileURLToPath(new URL('./package-release.mjs',import.meta.url));
  try{
    const root=join(temp,'source');await materialize(root,fixture());await mkdir(join(root,'outputs'));await symlink(join(root,'src'),join(root,'outputs/link'));
    assert.throws(()=>execFileSync(process.execPath,[cli,'pack','--root',root,'--working-tree','--out',join(root,'outputs/link/new')],{stdio:['ignore','pipe','pipe']}),/Symlink|Output/);
    await assert.rejects(()=>readFile(join(root,'src/new/archive.zip')),{code:'ENOENT'});
    const {access}=await import('node:fs/promises');await assert.rejects(()=>access(join(root,'src/new')),{code:'ENOENT'});
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('working policy excludes env/whole input without copying bytes and rejects selected filesystem symlinks',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-policy-'));
  try{
    const files=fixture();files.set('authoring/input.json',json({reference:{path:'reference/whole.png',distribution:'local-only'}}));await materialize(temp,files);
    await put(temp,'reference/whole.png','private');await put(temp,'src/.env','private');await put(temp,'.env','private');
    const working=await readWorking(temp),selected=selectPayload(working.all);assert(!selected.files.has('reference/whole.png'));assert(!selected.files.has('src/.env'));
    await put(temp,'outside.txt','do not follow');await symlink(join(temp,'outside.txt'),join(temp,'src/link.txt'));
    await assert.rejects(()=>readWorking(temp),/Symlink/);
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('known cached token scan has no plaintext findings; redaction preserves credit and licence bytes',()=>{
  const secret=token(),credit='Artist name · CC BY4.0 · https://creativecommons.org/licenses/by/4.0/';
  const page=Buffer.from(`<p>${credit}</p><script>map=${JSON.stringify(secret)}</script>`);
  const result=scanCredentials(new Map([['assets/sfx/story/sources/test.html',page]]));assert.equal(result.length,1);assert.equal(result[0].rule,'mapbox');assert(!JSON.stringify(result).includes(secret));
  const redacted=redactMapboxPage(page);assert.equal(redacted.count,1);assert(redacted.bytes.toString().includes(credit));assert(!redacted.bytes.toString().includes(secret));assert.equal(scanCredentials(new Map([['page.html',redacted.bytes]])).length,0);
});
test('valid root checksum cannot conceal stale nested checksum, extra member, private input or known token',()=>{
  const good=fixture();good.set('assets/courier/source.txt',Buffer.from('old'));
  let withSums=refreshChecksumTree(new Map([...good,['assets/courier/SHA256SUMS.txt',Buffer.from('')]]));
  const stale=new Map(withSums);stale.set('assets/courier/source.txt',Buffer.from('changed'));
  const rootOnly=map=>{const m=new Map(map);m.delete('MANIFEST.sha256');m.set('MANIFEST.sha256',Buffer.from([...m].sort(([a],[b])=>a<b?-1:1).map(([p,b])=>`${digest(b)}  ${p}\n`).join('')));return m;};
  assert.throws(()=>verifyPayload(rootOnly(stale)),/checksum|Checksum|SHA|digest|hash/i);
  const clean=makePackage(snapshot(fixture()));const extra=new Map(clean.files);extra.set('src/unlisted.ts',Buffer.from('extra'));assert.throws(()=>verifyPayload(extra),/manifest|Manifest|coverage|listed|scope|set/i);
  const privateMap=fixture();privateMap.set('authoring/input.json',json({reference:{path:'reference/whole.png',distribution:'local-only'}}));privateMap.set('reference/whole.png',Buffer.from('private'));
  assert.throws(()=>verifyPayload(rootOnly(privateMap)),/local-only/);
  const leaked=fixture();leaked.set('assets/page.html',Buffer.from(token()));assert.throws(()=>makePackage(snapshot(leaked)),/credential/);
});
test('source comparison rejects an independently valid archive with different bytes',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-identity-'));
  try{
    await materialize(temp,fixture());const expected=await sourceSnapshotForPackage(temp,{workingTree:true});
    const good=makePackage(expected);await compareArchiveToSource({files:good.files,verification:good.verification},temp,{workingTree:true});
    const changed=new Map(expected.files);changed.set('src/value.ts',Buffer.from('export const value=2;\n'));
    const other=makePackage({...expected,files:changed});await assert.rejects(()=>compareArchiveToSource({files:other.files,verification:other.verification},temp,{workingTree:true}),/differs/);
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('CLI makes immutable repeatable packages without installed dependencies and refuses overwrite',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-pack-cli-')),cli=fileURLToPath(new URL('./package-release.mjs',import.meta.url));
  try{
    const root=join(temp,'source');await materialize(root,fixture());
    const run=out=>execFileSync(process.execPath,[cli,'pack','--root',root,'--working-tree','--candidate','test','--out',out],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
    const a=JSON.parse(run(join(temp,'a'))),b=JSON.parse(run(join(temp,'b')));assert.equal(a.sha256,b.sha256);
    assert.throws(()=>run(join(temp,'a')),/EEXIST/);assert.equal(digest(await readFile(a.archive)),a.sha256);
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('explicit cached-page cleanup backs up originals, retains licensing and refreshes page/root/nested hashes',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-redact-cli-')),cli=fileURLToPath(new URL('./package-release.mjs',import.meta.url));
  try{
    const files=fixture(),page='assets/sfx/story/sources/test.html',recording='assets/sfx/story/originals/test.mp3',secret=token();
    const credit='Creator · CC BY4.0 · https://creativecommons.org/licenses/by/4.0/';
    const original=Buffer.from(`<p>${credit}</p><script>map=${JSON.stringify(secret)}</script>`);
    files.set(page,original);files.set(recording,Buffer.from('fixture recorded bytes'));
    files.set('assets/sfx/story/sources.json',json({sources:[{id:'fixture',sourceFile:recording,sourceSha256:digest(files.get(recording)),pageFile:page,pageSha256:digest(original)}]}));
    files.set('assets/sfx/provenance/REDACTIONS.md',Buffer.from('Source cleanup record; keep licensing text.\n'));
    files.set('assets/sfx/story/SHA256SUMS.txt',Buffer.from(''));await materialize(temp,refreshChecksumTree(files));
    const output=execFileSync(process.execPath,[cli,'redact','--root',temp,'--path',page,'--write'],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
    assert(!output.includes(secret));assert.equal(JSON.parse(output).status,'redacted');
    const changed=await readFile(join(temp,page));assert(changed.toString().includes(credit));assert(!changed.toString().includes(secret));
    assert((await readFile(join(temp,'qa/provenance-backups',digest(original),page))).equals(original));
    const working=await readWorking(temp),selected=selectPayload(working.all);selected.files.set('MANIFEST.sha256',working.all.get('MANIFEST.sha256'));verifyPayload(selected.files);
    assert.equal(scanCredentials(selected.files).length,0);assert((await readFile(join(temp,recording))).equals(files.get(recording)));
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('Git tip and outgoing-history gates differ: deleted synthetic credential remains blocked in new commit history',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-git-gate-'));
  const run=args=>execFileSync('git',['-C',temp,'-c','user.name=Package Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','-c','core.hooksPath=/dev/null',...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});
  try{
    run(['init','-q']);let files=refreshChecksumTree(fixture());await materialize(temp,files);
    const commit=message=>{run(['add','.']);run(['commit','-qm',message]);return run(['rev-parse','HEAD']).trim();};
    const base=commit('clean baseline');
    files=fixture();files.set('assets/page.html',Buffer.from(token()));await materialize(temp,refreshChecksumTree(files));commit('synthetic unsafe cache');
    await rm(join(temp,'assets/page.html'));await materialize(temp,refreshChecksumTree(fixture()));commit('remove synthetic cache');
    assert.equal(scanGitPublication(temp,{ref:'HEAD'}).status,'pass');
    assert.throws(()=>scanGitPublication(temp,{ref:'HEAD',base}),/credential/);
    const source=await sourceSnapshotForPackage(temp,{ref:'HEAD'}),packed=makePackage(source);
    await compareArchiveToSource({files:packed.files,verification:packed.verification},temp,{ref:'HEAD'});
    const cleanBase=run(['rev-parse','HEAD']).trim();
    await rm(join(temp,'release/payload-policy.json'));await rm(join(temp,'MANIFEST.sha256'));commit('ordinary intermediate implementation');
    await materialize(temp,refreshChecksumTree(fixture()));commit('restore final policy and integrity');
    assert.equal(scanGitPublication(temp,{ref:'HEAD',base:cleanBase}).status,'pass','Intermediate commits need security checks, not a final release manifest');
  }finally{await rm(temp,{recursive:true,force:true});}
});
test('cached-page cleanup refuses a symlinked private backup root before writing source or outside bytes',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'curio-backup-alias-')),cli=fileURLToPath(new URL('./package-release.mjs',import.meta.url));
  try{
    const root=join(temp,'source'),outside=join(temp,'outside'),files=fixture(),page='assets/sfx/story/sources/test.html';
    files.set(page,Buffer.from(token()));files.set('assets/sfx/provenance/REDACTIONS.md',Buffer.from('Notice\n'));
    await materialize(root,refreshChecksumTree(files));await mkdir(outside);await symlink(outside,join(root,'qa'));
    assert.throws(()=>execFileSync(process.execPath,[cli,'redact','--root',root,'--path',page,'--write'],{stdio:['ignore','pipe','pipe']}),/Symlink/);
    const{readdir}=await import('node:fs/promises');assert.deepEqual(await readdir(outside),[]);assert((await readFile(join(root,page))).equals(files.get(page)));
  }finally{await rm(temp,{recursive:true,force:true});}
});
