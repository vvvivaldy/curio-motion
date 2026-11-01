import {readdir,readFile,realpath} from 'node:fs/promises';
import {resolve,relative,isAbsolute,sep,win32} from 'node:path';
/** Local input policy is explicit in manifests, independent of Git availability. */
export async function localOnlyInputs(root=process.cwd()){
  const paths=new Set(),canonicalRoot=await realpath(root);
  async function walk(folder){
    let entries;try{entries=await readdir(resolve(root,folder),{withFileTypes:true});}catch(e){if(e.code==='ENOENT')return;throw e;}
    for(const entry of entries){
      const file=`${folder}/${entry.name}`;
      if(entry.isDirectory())await walk(file);
      else if(entry.name.endsWith('.json')){
        const value=JSON.parse(await readFile(resolve(root,file),'utf8'));
        if(value.reference?.distribution!=='local-only')continue;
        const name=value.reference.path;
        if(typeof name!=='string'||!name.trim()||isAbsolute(name)||win32.isAbsolute(name)||name.split(/[\\/]/).includes('..'))throw Error(`Invalid local input path in ${file}`);
        const local=relative(resolve(root),resolve(root,name.replaceAll('\\','/')));
        if(local.split(sep)[0]==='..'||!local)throw Error(`Local input escapes project: ${file}`);
        paths.add(local.split(sep).join('/'));
        // A case-insensitive filesystem can resolve PRIVATE.PNG to private.png.
        // cp visits the actual directory spelling, so exclude that resolved path
        // as well. Do not case-fold: case-sensitive files may be distinct.
        try{
          const canonical=relative(canonicalRoot,await realpath(resolve(root,local)));
          if(canonical&&!isAbsolute(canonical)&&canonical.split(sep)[0]!=='..')paths.add(canonical.split(sep).join('/'));
        }catch(error){if(error.code!=='ENOENT')throw error;}
      }
    }
  }
  await walk('reference');await walk('authoring');return paths;
}
/** The same filter is shared by the static build and its file-copy test. */
export function distributionFilter(localInputs,root=process.cwd()){
  return source=>!localInputs.has(relative(root,source).split(sep).join('/'));
}
