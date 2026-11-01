import {readdir,readFile,lstat,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute,posix,win32} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
export function parseJson(bytes,path){try{return JSON.parse(bytes);}catch{throw Error(`Invalid JSON document: ${path}`);}}
export function safePath(path){
  if(typeof path!=='string'||!path||path!==path.normalize('NFC')||/[\\\x00-\x1f\x7f:]/.test(path)||isAbsolute(path)||win32.isAbsolute(path)||
    path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Unsafe package path');
  return path;
}
export async function assertNoSymlinkPath(root,path,{allowMissing=false}={}){
  safePath(path);let prefix='';
  for(const part of path.split('/')){
    prefix=prefix?`${prefix}/${part}`:part;
    let entry;try{entry=await lstat(resolve(root,prefix));}catch(e){if(allowMissing&&e.code==='ENOENT')return;throw e;}
    if(entry.isSymbolicLink())throw Error(`Symlink ancestor/payload rejected: ${prefix}`);
  }
}
export function uniquePaths(paths){
  const keys=new Set();
  for(const path of paths){safePath(path);const key=path.toLowerCase();if(keys.has(key))throw Error(`Duplicate/colliding package path: ${path}`);keys.add(key);}
}
export const inventory=files=>[...files].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([path,bytes])=>({path,sha256:digest(bytes)}));
export const inventoryHash=files=>digest(JSON.stringify(inventory(files)));
export function readPolicy(files){
  const bytes=files.get('release/payload-policy.json');if(!bytes)throw Error('Missing release/payload-policy.json');
  const p=parseJson(bytes,'release/payload-policy.json');if(!p||p.schemaVersion!==1||!['rootFiles','directories','generated','required','excludedSegments','excludedBasenames','excludedSuffixes'].every(k=>Array.isArray(p[k])&&p[k].every(v=>typeof v==='string')))throw Error('Invalid payload policy');
  for(const name of [...p.rootFiles,...p.directories,...p.generated,...p.required])safePath(name);
  return p;
}
function operational(path,p){return path.split('/').some(s=>p.excludedSegments.includes(s))||p.excludedBasenames.includes(posix.basename(path))||p.excludedSuffixes.some(s=>path.endsWith(s));}
function environment(path){return path.split('/').some(s=>s==='.env'||s.startsWith('.env.'));}
export function allowedPath(path,p){return p.rootFiles.includes(path)||p.directories.some(d=>path.startsWith(d+'/'));}
export function localInputs(files){
  const local=new Set();
  for(const [path,bytes]of files){if(!/^(reference|authoring)\/.+\.json$/.test(path))continue;
    const data=parseJson(bytes,path);if(data?.reference?.distribution!=='local-only')continue;
    const name=data.reference.path;if(typeof name!=='string')throw Error(`Invalid local input in ${path}`);
    local.add(safePath(name.replaceAll('\\','/')));
  }
  return local;
}
export function selectPayload(all,p=readPolicy(all),{requireRequired=true,additionalPrivateInputs=[]}={}){
  const local=new Set([...localInputs(all),...additionalPrivateInputs]),files=new Map(),omitted=[];
  for(const[path,bytes]of all){safePath(path);
    let reason=p.generated.includes(path)?'generated':operational(path,p)?'operational':environment(path)?'environment':local.has(path)?'local-only':!allowedPath(path,p)?'outside-policy':null;
    if(reason)omitted.push({path,reason});else files.set(path,bytes);
  }
  uniquePaths(files.keys());if(requireRequired)for(const path of p.required)if(!files.has(path))throw Error(`Missing required payload: ${path}`);
  return {files,omitted:omitted.sort((a,b)=>a.path<b.path?-1:1),localInputs:local,policy:p};
}
export async function readWorking(root=process.cwd()){
  root=await realpath(root);
  await assertNoSymlinkPath(root,'release/payload-policy.json');
  const seed=new Map([['release/payload-policy.json',await readFile(resolve(root,'release/payload-policy.json'))]]),p=readPolicy(seed);
  const entries=[];
  async function walk(path){
    safePath(path);if(operational(path,p)||environment(path))return;
    await assertNoSymlinkPath(root,path);
    const s=await lstat(resolve(root,path));
    if(s.isSymbolicLink()){entries.push({path,symlink:true});return;}
    if(s.isDirectory()){for(const name of(await readdir(resolve(root,path))).sort())await walk(`${path}/${name}`);}
    else if(s.isFile())entries.push({path,symlink:false});else throw Error(`Unsupported filesystem entry: ${path}`);
  }
  for(const path of [...p.rootFiles,...p.directories,...p.generated]){
    try{await walk(path);}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  const unique=new Map(entries.map(e=>[e.path,e]));
  const files=new Map();
  // Read only regular manifest JSON first, to exclude whole private inputs before copying bytes.
  for(const e of unique.values())if(/^(reference|authoring)\/.+\.json$/.test(e.path)){
    if(e.symlink)throw Error(`Symlink manifest rejected: ${e.path}`);files.set(e.path,await readFile(resolve(root,e.path)));
  }
  const local=localInputs(files);
  // Match the real spelling on a case-insensitive filesystem without conflating distinct files.
  for(const name of [...local])try{
    const actual=relative(root,await realpath(resolve(root,name))).split('\\').join('/');
    if(actual&&!actual.startsWith('../')&&!isAbsolute(actual))local.add(actual);
  }catch(e){if(e.code!=='ENOENT')throw e;}
  for(const e of unique.values()){
    if(local.has(e.path)){files.delete(e.path);continue;}
    if(e.symlink)throw Error(`Symlink payload rejected: ${e.path}`);
    if(!files.has(e.path))files.set(e.path,await readFile(resolve(root,e.path)));
  }
  return {all:files,root,policy:p,privateInputs:[...local].sort()};
}
export function git(root,args,options={}){return execFileSync('git',['-C',root,...args],{maxBuffer:512*1024*1024,stdio:['ignore','pipe','pipe'],...options});}
export function resolveCommit(root,ref){return git(root,['rev-parse','--verify','--end-of-options',`${ref}^{commit}`],{encoding:'utf8'}).trim();}
export function readGitTree(root,ref,{metadataOnly=false}={}){
  const commit=resolveCommit(root,ref),all=new Map();
  for(const line of git(root,['ls-tree','-r','-z',commit],{encoding:'utf8'}).split('\0').filter(Boolean)){
    const m=/^(\d+) (\w+) ([0-9a-f]+)\t([\s\S]+)$/.exec(line);if(!m)throw Error('Invalid Git tree record');
    const[,mode,type,oid,path]=m;safePath(path);
    if(type!=='blob'||!['100644','100755'].includes(mode))throw Error(`Unsupported Git entry: ${path}`);
    if(metadataOnly&&!/^(reference|authoring)\/.+\.json$/.test(path))continue;
    all.set(path,git(root,['cat-file','blob',oid]));
  }
  return {commit,all};
}
export function assertPublicationTree(all){
  const p=readPolicy(all),projection=selectPayload(all,p);
  for(const omit of projection.omitted)if(omit.reason!=='generated')throw Error(`Unpublishable Git path (${omit.reason}): ${omit.path}`);
  return projection;
}
export async function sourceSnapshotForPackage(root,{ref,workingTree=false}={}){
  if(Boolean(ref)===Boolean(workingTree))throw Error('Choose exactly one source mode: --ref or --working-tree');
  if(ref){const tree=readGitTree(root,ref),projection=assertPublicationTree(tree.all);return {...projection,source:{kind:'git-commit',commit:tree.commit}};}
  const data=await readWorking(root),projection=selectPayload(data.all,data.policy);
  let head=null;try{head=resolveCommit(root,'HEAD');}catch{}
  return {...projection,source:{kind:'working-tree',baseCommit:head,commitIdentityClaim:false},privateInputs:data.privateInputs};
}
