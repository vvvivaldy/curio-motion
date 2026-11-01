import {readFile} from 'node:fs/promises';
import {digest,inventory,inventoryHash,readPolicy,parseJson,localInputs,selectPayload,uniquePaths,sourceSnapshotForPackage,git,resolveCommit,readGitTree,assertPublicationTree} from './package-files.mjs';
import {assertNoCredentials} from './package-secrets.mjs';
import {verifyChecksumTree,verifyProvenanceBindings} from './package-checksums.mjs';
import {createZip,readZip} from './package-zip.mjs';

export function verifyPayload(files,{requireReceipt=false}={}){
  uniquePaths(files.keys());const policy=readPolicy(files),projection=selectPayload(files,policy);
  for(const omit of projection.omitted)if(omit.reason!=='generated')throw Error(`Forbidden archive member (${omit.reason}): ${omit.path}`);
  const secrets=assertNoCredentials(files),checksums=verifyChecksumTree(files),provenance=verifyProvenanceBindings(files);
  const pkg=parseJson(files.get('package.json'),'package.json'),lock=parseJson(files.get('package-lock.json'),'package-lock.json');
  if(pkg.name!=='curio-motion'||pkg.private!==true||pkg.version!==lock.version||pkg.version!==lock.packages?.['']?.version)throw Error('Package/lock name, version or private scope mismatch');
  const sourceBytes=files.get('PACKAGE_SOURCE.json');let receipt;
  if(requireReceipt&&!sourceBytes)throw Error('Missing PACKAGE_SOURCE.json');
  if(sourceBytes){receipt=parseJson(sourceBytes,'PACKAGE_SOURCE.json');if(receipt.schemaVersion!==1||receipt.package!=='curio-motion'||receipt.version!==pkg.version||receipt.sourceFiles!==projection.files.size||receipt.sourceInventorySha256!==inventoryHash(projection.files)||receipt.policySha256!==digest(files.get('release/payload-policy.json'))||JSON.stringify(receipt.generated)!==JSON.stringify(['MANIFEST.sha256','PACKAGE_SOURCE.json'])||typeof receipt.candidate!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(receipt.candidate)||receipt.candidate.length>64)throw Error('Source receipt/inventory mismatch');
    if(receipt.source?.kind==='git-commit'){if(!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(receipt.source.commit))throw Error('Invalid source commit');}
    else if(receipt.source?.kind==='working-tree'){if(receipt.source.commitIdentityClaim!==false||receipt.source.baseCommit!==null&&!/^[a-f0-9]{40}(?:[a-f0-9]{24})?$/.test(receipt.source.baseCommit))throw Error('Invalid working source receipt');}
    else throw Error('Unknown source identity kind');
  }
  return {version:pkg.version,files:files.size,checksums,provenance,secrets,receipt};
}
export function makePackage(snapshot,{candidate='local'}={}){
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(candidate)||candidate.length>64)throw Error('Candidate must be a short lowercase label');
  const version=parseJson(snapshot.files.get('package.json'),'package.json').version;
  if(!/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(version))throw Error('Unsupported package version');
  const secrets=assertNoCredentials(snapshot.files);
  // Never silently repair a stale nested manifest or rewrite provenance while packaging.
  verifyChecksumTree(snapshot.files,{requireRoot:false});verifyProvenanceBindings(snapshot.files);
  const receipt={schemaVersion:1,package:'curio-motion',version,candidate,source:snapshot.source,
    sourceInventorySha256:inventoryHash(snapshot.files),sourceFiles:snapshot.files.size,
    policySha256:digest(snapshot.files.get('release/payload-policy.json')),generated:['MANIFEST.sha256','PACKAGE_SOURCE.json'],
    archiveProfile:'classic ZIP STORE, UTF-8, 1980-01-01, regular0644, sorted names, max512MiB',
    publicationPerformed:false,credentialScan:{...secrets,note:'Known patterns only; no full security audit claim.'}};
  const files=new Map(snapshot.files);files.set('PACKAGE_SOURCE.json',Buffer.from(JSON.stringify(receipt,null,2)+'\n'));
  const withManifest=new Map(files);
  withManifest.set('MANIFEST.sha256',Buffer.from(inventory(files).map(f=>`${f.sha256}  ${f.path}\n`).join('')));
  const verification=verifyPayload(withManifest,{requireReceipt:true});
  const rootFolder=`curio-motion-${version}-${candidate}`,zip=createZip(withManifest,rootFolder);
  const roundTrip=readZip(zip);if(roundTrip.files.size!==withManifest.size)throw Error('Archive round-trip differs');
  for(const[path,bytes]of withManifest)if(!bytes.equals(roundTrip.files.get(path)))throw Error(`Archive bytes differ: ${path}`);
  return {files:withManifest,zip,rootFolder,filename:rootFolder+'.zip',sha256:digest(zip),receipt,verification};
}
export async function verifyArchive(path,{expectedSha256}={}){
  const {stat}=await import('node:fs/promises');if((await stat(path)).size>512*1024*1024)throw Error('Archive exceeds512MiB profile');
  const bytes=await readFile(path),sha256=digest(bytes);
  if(expectedSha256&&expectedSha256!==sha256)throw Error('Archive SHA differs from expected trusted digest');
  const decoded=readZip(bytes),verification=verifyPayload(decoded.files,{requireReceipt:true});
  if(decoded.rootFolder!==`curio-motion-${verification.version}-${verification.receipt.candidate}`)throw Error('Archive root/version/candidate mismatch');
  return {...decoded,sha256,verification};
}
export async function compareArchiveToSource(archive,root,options){
  const source=await sourceSnapshotForPackage(root,options),files=archive.files;
  const receipt=archive.verification.receipt;
  if(JSON.stringify(receipt.source)!==JSON.stringify(source.source))throw Error('Archive source mode/commit differs from requested source');
  const actual=selectPayload(files).files;
  for(const path of new Set([...source.files.keys(),...actual.keys()])){
    if(!source.files.has(path)||!actual.has(path)||!source.files.get(path).equals(actual.get(path)))throw Error(`Source/archive differs: ${path}`);
  }
  if(receipt.sourceInventorySha256!==inventoryHash(source.files))throw Error('Archive source fingerprint differs');
  return {status:'pass',source:source.source,comparedFiles:source.files.size,onlyGeneratedDifferences:receipt.generated};
}
export function scanGitPublication(root,{ref,base}={}){
  if(!ref)throw Error('Publication scan requires --ref');const commit=resolveCommit(root,ref);
  const commits=[];
  if(base){const from=resolveCommit(root,base);git(root,['merge-base','--is-ancestor',from,commit]);commits.push(...git(root,['rev-list','--reverse',`${from}..${commit}`],{encoding:'utf8'}).trim().split('\n').filter(Boolean));}
  if(!commits.includes(commit))commits.push(commit);
  const tip=readGitTree(root,commit),policy=readPolicy(tip.all),privateInputs=new Set(localInputs(tip.all));
  for(const current of commits)for(const path of localInputs(current===commit?tip.all:readGitTree(root,current,{metadataOnly:true}).all))privateInputs.add(path);
  const results=[];
  for(const current of commits){
    const tree=current===commit?tip:readGitTree(root,current);assertNoCredentials(tree.all);
    const projection=selectPayload(tree.all,policy,{requireRequired:current===commit,additionalPrivateInputs:privateInputs});
    for(const omit of projection.omitted)if(omit.reason!=='generated')throw Error(`Unpublishable Git path (${omit.reason}): ${omit.path}`);
    if(current===commit){verifyChecksumTree(tree.all);verifyProvenanceBindings(projection.files);}
    results.push({commit:current,files:tree.all.size,releaseIntegrityRequired:current===commit});
  }
  return {status:'pass',tip:commit,commits:results,note:base?'All new commit trees scanned for known credentials/private/forbidden paths; tip also has complete release integrity. Nothing pushed.':'Tip tree only; supply --base to audit outgoing history.'};
}
