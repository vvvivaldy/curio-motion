import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {soundAssets,soundCues} from '../src/examples/human-chair-sound-v2/cues';
import {digest,sourceSnapshot,snapshotFiles} from './lib/authoring.mjs';
const dir='qa/human-chair-sound-v2';await mkdir(dir,{recursive:true});
const range=process.env.RENDER_RANGE,tag=range?`draft-${range.replace(':','-')}`:'full';
const output=process.env.RENDER_OUTPUT??(range?`${dir}/human-chair-sound-${tag}.mp4`:'docs/assets/human-chair-sound-v2.mp4');
async function inputs(){
 const source=await sourceSnapshot();const provenancePath='public/audio/sfx/catalog.json';const data=await readFile(provenancePath);const catalog=JSON.parse(data.toString());
 const assets=await Promise.all(Object.entries(soundAssets).map(async([id,a])=>{const entry=catalog.entries.find((e:any)=>e.id===a.catalogId);if(!entry)throw Error('Missing catalog selection '+a.catalogId);const record=entry.wav??entry;if(record.staticFilePath!==a.file||record.durationSeconds!==a.duration||record.attackSeconds!==a.attack)throw Error('Catalog/scene mismatch '+id);const path=`public/${a.file}`,sha256=digest(await readFile(path));if(sha256!==record.sha256)throw Error('Selected asset changed '+path);return{id,...a,path,sha256};}));
 const files:string[]=[];async function walk(dir:string){for(const e of await readdir(dir,{withFileTypes:true})){const path=`${dir}/${e.name}`;if(e.isDirectory())await walk(path);else files.push(path);}}await walk('public/audio/sfx');await walk('assets/sfx');files.push('scripts/audio/prepare_recorded_tiles.py','scripts/render-human-chair-recorded.ts');const catalogInventory=await snapshotFiles(files);
 return{sourceSha256:source.sha256,assets,provenancePath,provenanceSha256:digest(data),catalogInventory,cues:soundCues,acceptedSilentFilmSha256:digest(await readFile('docs/assets/human-chair-v3.mp4')),exportOptions:{composition:'HumanChairSoundV2',audioCodec:'aac',videoCodec:'h264',crf:17,pixelFormat:'yuv420p',fps:24,frameRange:range??null}};
}
const before=await inputs();await writeFile(`${dir}/${tag}-inputs-before.json`,JSON.stringify(before,null,2)+'\n');
const result=spawnSync(process.execPath,['scripts/render.mjs'],{stdio:'inherit',env:{...process.env,COMPOSITION_ID:'HumanChairSoundV2',RENDER_AUDIO_CODEC:'aac',RENDER_OUTPUT:output}});
if(result.status!==0)throw Error(`Official sound render failed (${result.status})`);
const after=await inputs();if(digest(JSON.stringify(before))!==digest(JSON.stringify(after)))throw Error('Source/WAV/cues/provenance changed during sound export');
const receiptPath=range?`qa/HumanChairSoundV2-excerpt-${range.replace(':','-')}.json`:'qa/HumanChairSoundV2-render.json';
const bytes=await readFile(receiptPath),receipt=JSON.parse(bytes.toString());if(receipt.sourceSha256!==before.sourceSha256||receipt.outputSha256!==digest(await readFile(output)))throw Error('Render source/movie binding mismatch');
await writeFile(`${dir}/${tag}-render.json`,bytes);
await writeFile(`${dir}/${tag}-sound-binding.json`,JSON.stringify({schema:'human-chair-recorded-sound-binding-v2',...before,inputIdentitySha256:digest(JSON.stringify(before)),renderReceiptSha256:digest(bytes),renderReceipt:`${dir}/${tag}-render.json`,output,outputSha256:receipt.outputSha256,immutableDuringExport:true,listeningObserved:false,ownerAcceptance:false},null,2)+'\n');
console.log(`Sound assets/cues/export bound: ${dir}/${tag}-sound-binding.json`);
