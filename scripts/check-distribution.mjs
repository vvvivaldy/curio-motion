import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdir,mkdtemp,writeFile,readFile,access,cp,rm} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {localOnlyInputs,distributionFilter} from './lib/distribution.mjs';
async function put(root,path,content){
  const full=join(root,path);await mkdir(dirname(full),{recursive:true});await writeFile(full,content);
}
const manifest=(path,distribution)=>JSON.stringify({reference:{path,distribution}});
test('local inputs declared under reference and authoring are excluded by the actual cp filter',async()=>{
  const root=await mkdtemp(join(tmpdir(),'curio-distribution-'));
  try{
    await put(root,'reference/one/input.json',manifest('reference/one/private.mp4','local-only'));
    await put(root,'authoring/two.json',manifest('reference\\two\\private.png','local-only'));
    await put(root,'reference/public/input.json',manifest('reference/public/whole.png','public'));
    await put(root,'reference/one/private.mp4','private video');
    await put(root,'reference/two/private.png','private image');
    await put(root,'reference/public/whole.png','public whole image');
    await put(root,'reference/one/private.mp4.notes.txt','public companion notes');
    await put(root,'reference/one/ACTION.txt','public action');
    await put(root,'docs/assets/demo.mp4','public authored film');
    const local=await localOnlyInputs(root);
    assert.deepEqual([...local].sort(),['reference/one/private.mp4','reference/two/private.png']);
    const filter=distributionFilter(local,root);
    for(const folder of ['reference','docs/assets'])await cp(join(root,folder),join(root,'dist',folder),{recursive:true,filter});
    for(const path of local)await assert.rejects(()=>access(join(root,'dist',path)),{code:'ENOENT'});
    for(const [path,contents] of [['reference/public/whole.png','public whole image'],['reference/one/private.mp4.notes.txt','public companion notes'],['reference/one/ACTION.txt','public action'],['docs/assets/demo.mp4','public authored film']])
      assert.equal(await readFile(join(root,'dist',path),'utf8'),contents);
    assert.equal(filter(join(root,'reference/one')),true);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('local manifests reject absolute and traversal paths on either path syntax',async()=>{
  const root=await mkdtemp(join(tmpdir(),'curio-distribution-path-'));
  try{
    for(const path of ['/tmp/private.mp4','C:\\private.mp4','\\\\server\\share\\private.mp4','../private.mp4','reference/../private.mp4','reference\\..\\private.mp4','',null]){
      await put(root,'authoring/input.json',manifest(path,'local-only'));
      await assert.rejects(()=>localOnlyInputs(root),/Invalid local input|escapes project/);
    }
  }finally{await rm(root,{recursive:true,force:true});}
});
test('local privacy follows actual filesystem casing without conflating distinct files',async t=>{
  const root=await mkdtemp(join(tmpdir(),'curio-distribution-case-'));
  try{
    await put(root,'reference/one/private.png','lowercase bytes');
    let caseInsensitive=false;
    try{caseInsensitive=(await readFile(join(root,'reference/one/PRIVATE.PNG'),'utf8'))==='lowercase bytes';}
    catch(error){if(error.code!=='ENOENT')throw error;}
    if(!caseInsensitive)await put(root,'reference/one/PRIVATE.PNG','separate pinned bytes');
    await put(root,'reference/one/input.json',manifest('reference/one/PRIVATE.PNG','local-only'));
    const local=await localOnlyInputs(root);
    await cp(join(root,'reference'),join(root,'dist/reference'),{recursive:true,filter:distributionFilter(local,root)});
    await assert.rejects(()=>access(join(root,'dist/reference/one/PRIVATE.PNG')),{code:'ENOENT'});
    if(caseInsensitive){
      assert(local.has('reference/one/private.png'),'Resolved filename must be excluded');
      await assert.rejects(()=>access(join(root,'dist/reference/one/private.png')),{code:'ENOENT'});
      t.diagnostic('Exercised a real case-insensitive filesystem: differently cased input did not leak');
    }else{
      assert(!local.has('reference/one/private.png'),'Distinct unlisted file must stay public');
      assert.equal(await readFile(join(root,'dist/reference/one/private.png'),'utf8'),'lowercase bytes');
      t.diagnostic('Exercised a real case-sensitive filesystem: distinct unlisted file was preserved');
    }
  }finally{await rm(root,{recursive:true,force:true});}
});
test('missing Git-excluded local inputs do not prevent builds from a fresh clone',async()=>{
  const root=await mkdtemp(join(tmpdir(),'curio-distribution-missing-'));
  try{
    await put(root,'reference/one/input.json',manifest('reference/one/private.mp4','local-only'));
    assert((await localOnlyInputs(root)).has('reference/one/private.mp4'));
  }finally{await rm(root,{recursive:true,force:true});}
});
