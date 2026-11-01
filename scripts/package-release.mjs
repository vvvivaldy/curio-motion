import {parseArgs} from 'node:util';
import {readFile,writeFile,mkdir,rm,open,realpath} from 'node:fs/promises';
import {resolve,relative,dirname,basename} from 'node:path';
import {digest,inventory,inventoryHash,readWorking,readPolicy,selectPayload,sourceSnapshotForPackage,safePath,allowedPath,assertNoSymlinkPath} from './lib/package-files.mjs';
import {assertNoCredentials,redactMapboxPage} from './lib/package-secrets.mjs';
import {verifyChecksumTree,refreshChecksumTree,refreshProvenanceBindings} from './lib/package-checksums.mjs';
import {makePackage,verifyArchive,compareArchiveToSource,scanGitPublication,verifyPayload} from './lib/package-release.mjs';

const [command,...args]=process.argv.slice(2);
const {values}=parseArgs({args,options:{root:{type:'string'},'working-tree':{type:'boolean'},ref:{type:'string'},base:{type:'string'},candidate:{type:'string'},out:{type:'string'},archive:{type:'string'},sha256:{type:'string'},path:{type:'string'},write:{type:'boolean'},strict:{type:'boolean'}}});
const root=resolve(values.root??'.'),sourceOptions={workingTree:values['working-tree']??false,ref:values.ref};
if(values.ref&&values['working-tree'])throw Error('Choose --ref or --working-tree, not both');
async function current(){const snapshot=await readWorking(root),selected=selectPayload(snapshot.all,snapshot.policy);return {...snapshot,...selected};}
function rootManifest(files){return Buffer.from(inventory(files).map(f=>`${f.sha256}  ${f.path}\n`).join(''));}
async function writeImmutable(path,bytes,created){const handle=await open(path,'wx');created.push(path);try{await handle.writeFile(bytes);}finally{await handle.close();}}
async function prospectiveRealpath(path){
  const suffix=[];let current=path;
  for(;;)try{return resolve(await realpath(current),...suffix);}catch(e){if(e.code!=='ENOENT'||dirname(current)===current)throw e;suffix.unshift(basename(current));current=dirname(current);}
}

if(command==='pack'){
  const snapshot=await sourceSnapshotForPackage(root,sourceOptions),out=resolve(root,values.out??'outputs/packages');
  const local=relative(root,out).split('\\').join('/');
  if(!local||!local.startsWith('../')&&!local.startsWith('/')&&allowedPath(local+'/archive.zip',snapshot.policy)&&!local.split('/').some(p=>snapshot.policy.excludedSegments.includes(p)))throw Error('Output must be outside publishable source roots; use outputs/packages or an external directory');
  if(local&&!local.startsWith('../')&&!local.startsWith('/'))await assertNoSymlinkPath(root,local,{allowMissing:true});
  const intendedLocal=relative(await realpath(root),await prospectiveRealpath(out)).split('\\').join('/');
  if(!intendedLocal||!intendedLocal.startsWith('../')&&allowedPath(intendedLocal+'/archive.zip',snapshot.policy)&&!intendedLocal.split('/').some(p=>snapshot.policy.excludedSegments.includes(p)))throw Error('Output resolves inside publishable source roots');
  const candidate=makePackage(snapshot,{candidate:values.candidate??'local'});
  const after=await sourceSnapshotForPackage(root,sourceOptions);if(inventoryHash(after.files)!==inventoryHash(snapshot.files))throw Error('Source changed during package preparation');
  await mkdir(out,{recursive:true});
  const canonicalLocal=relative(await realpath(root),await realpath(out)).split('\\').join('/');
  if(!canonicalLocal||!canonicalLocal.startsWith('../')&&allowedPath(canonicalLocal+'/archive.zip',snapshot.policy)&&!canonicalLocal.split('/').some(p=>snapshot.policy.excludedSegments.includes(p)))throw Error('Output symlink resolves inside publishable source roots');
  const archive=resolve(out,candidate.filename),created=[];
  try{
    await writeImmutable(archive,candidate.zip,created);
    await writeImmutable(archive+'.sha256',`${candidate.sha256}  ${candidate.filename}\n`,created);
    await writeImmutable(archive+'.receipt.json',JSON.stringify({status:'LOCAL_CANDIDATE_NOT_PUBLISHED',archive:candidate.filename,sha256:candidate.sha256,bytes:candidate.zip.length,rootFolder:candidate.rootFolder,files:candidate.files.size,source:candidate.receipt.source,sourceInventorySha256:candidate.receipt.sourceInventorySha256,policySha256:candidate.receipt.policySha256,rootManifestSha256:digest(candidate.files.get('MANIFEST.sha256')),verification:candidate.verification,sourceOmissions:snapshot.omitted,publicationPerformed:false},null,2)+'\n',created);
    console.log(JSON.stringify({status:'pass',archive,sha256:candidate.sha256,files:candidate.files.size,source:candidate.receipt.source}));
  }catch(error){for(const path of created)await rm(path,{force:true});throw error;}
}else if(command==='verify'){
  if(!values.archive)throw Error('verify requires --archive');
  const archive=await verifyArchive(resolve(values.archive),{expectedSha256:values.sha256});
  const comparison=values.ref||values['working-tree']?await compareArchiveToSource(archive,root,sourceOptions):null;
  console.log(JSON.stringify({status:'pass',sha256:archive.sha256,files:archive.files.size,checksums:archive.verification.checksums,provenance:archive.verification.provenance,comparison,
    identity:values.sha256?'matches supplied expected SHA':comparison?'matches requested source':'self-integrity only; supply --sha256 or a source mode for identity'}));
}else if(command==='manifest'){
  const snapshot=await current();assertNoCredentials(snapshot.files);verifyChecksumTree(snapshot.files,{requireRoot:false});
  const files=new Map(snapshot.files);if(snapshot.all.has('PACKAGE_SOURCE.json'))files.set('PACKAGE_SOURCE.json',snapshot.all.get('PACKAGE_SOURCE.json'));
  const bytes=rootManifest(files);
  if(!values.write)throw Error('Use manifest --write to refresh the working root manifest explicitly');
  await writeFile(resolve(root,'MANIFEST.sha256'),bytes);console.log(`Updated root manifest: ${files.size} files; nested sums were verified, not silently repaired.`);
}else if(command==='scan'){
  if(values.ref)console.log(JSON.stringify(scanGitPublication(root,{ref:values.ref,base:values.base})));
  else if(values['working-tree']){if(values.base)throw Error('--base requires --ref');const snapshot=await current();console.log(JSON.stringify({status:'pass',scope:'public working projection; not outgoing Git history',...assertNoCredentials(snapshot.files)}));}
  else throw Error('scan requires --working-tree or --ref (and --base for outgoing commit history)');
}else if(command==='redact'){
  if(!values.path||!/^assets\/sfx\/(chair|story|courier)\/sources\/[^/]+\.html$/.test(safePath(values.path)))throw Error('redact accepts one cached assets/sfx/.../sources/*.html page');
  const snapshot=await current(),before=snapshot.files.get(values.path);if(!before)throw Error('Source page is not in payload');
  if(snapshot.all.has('PACKAGE_SOURCE.json'))throw Error('Refusing to rewrite a frozen package; import into the maintained source checkout');
  const redaction=redactMapboxPage(before);
  if(!redaction.count){console.log(JSON.stringify({status:'unchanged',path:values.path}));process.exit(0);}
  if(!values.write)throw Error(`Found ${redaction.count} Mapbox pattern(s); use --write for backed-up redaction`);
  const changed=new Map(snapshot.files);changed.set(values.path,redaction.bytes);
  let refreshed=refreshProvenanceBindings(changed,new Set([values.path]));
  const notice='assets/sfx/provenance/REDACTIONS.md';
  if(!refreshed.has(notice))throw Error('Missing redaction notice');
  refreshed.set(notice,Buffer.from(refreshed.get(notice).toString()+`\nReproducible import cleanup: \`${values.path}\`; ${redaction.count} Mapbox pattern(s), original SHA256 \`${redaction.beforeSha256}\`, redacted SHA256 \`${redaction.afterSha256}\`. Licensing text and media bytes retained.\n`));
  refreshed=refreshChecksumTree(refreshed);verifyPayload(refreshed);
  const changedPaths=[...refreshed].filter(([path,bytes])=>!snapshot.all.get(path)?.equals(bytes)).map(([path])=>path);
  const backupPath=`qa/provenance-backups/${redaction.beforeSha256}`;
  await assertNoSymlinkPath(root,backupPath,{allowMissing:true});
  const backup=resolve(root,backupPath);await mkdir(backup,{recursive:true});
  // Preserve every replaced original before writing any source; raw backup is operational/private.
  for(const path of changedPaths){if(!snapshot.all.has(path))continue;await assertNoSymlinkPath(root,`${backupPath}/${path}`,{allowMissing:true});const dest=resolve(backup,path);await mkdir(dirname(dest),{recursive:true});try{await writeFile(dest,snapshot.all.get(path),{flag:'wx'});}catch(e){if(e.code!=='EEXIST')throw e;}}
  try{for(const path of changedPaths){await assertNoSymlinkPath(root,path,{allowMissing:true});await writeFile(resolve(root,path),refreshed.get(path));}}
  catch(error){for(const path of changedPaths)if(snapshot.all.has(path))await writeFile(resolve(root,path),snapshot.all.get(path));throw error;}
  console.log(JSON.stringify({status:'redacted',path:values.path,count:redaction.count,beforeSha256:redaction.beforeSha256,afterSha256:redaction.afterSha256,updatedFiles:changedPaths,note:'No matched credential bytes printed; raw backups remain under excluded qa.'}));
}else throw Error('Use pack, verify, manifest, scan or redact; see docs/PACKAGING_RU.md');
