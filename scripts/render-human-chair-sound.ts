import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {soundAssets,soundCues} from '../src/examples/human-chair-sound/cues';
import {digest,sourceSnapshot} from './lib/authoring.mjs';
const dir='qa/human-chair-sound-v1';await mkdir(dir,{recursive:true});
const range=process.env.RENDER_RANGE,tag=range?`draft-${range.replace(':','-')}`:'full';
const output=process.env.RENDER_OUTPUT??(range?`${dir}/human-chair-sound-${tag}.mp4`:'docs/assets/human-chair-sound-v1.mp4');
async function inputs(){const source=await sourceSnapshot();const assets=await Promise.all(Object.entries(soundAssets).map(async([id,a])=>({id,...a,path:`public/audio/human-chair/${a.file}`,sha256:digest(await readFile(`public/audio/human-chair/${a.file}`))})));const provenancePath='public/audio/human-chair/provenance.json';return{sourceSha256:source.sha256,assets,provenancePath,provenanceSha256:digest(await readFile(provenancePath)),cues:soundCues,acceptedSilentFilmSha256:digest(await readFile('docs/assets/human-chair-v3.mp4')),exportOptions:{composition:'HumanChairSound',audioCodec:'aac',videoCodec:'h264',crf:17,pixelFormat:'yuv420p',fps:24,frameRange:range??null}};}
const before=await inputs();await writeFile(`${dir}/${tag}-inputs-before.json`,JSON.stringify(before,null,2)+'\n');
const result=spawnSync(process.execPath,['scripts/render.mjs'],{stdio:'inherit',env:{...process.env,COMPOSITION_ID:'HumanChairSound',RENDER_AUDIO_CODEC:'aac',RENDER_OUTPUT:output}});
if(result.status!==0)throw Error(`Official sound render failed (${result.status})`);
const after=await inputs();if(digest(JSON.stringify(before))!==digest(JSON.stringify(after)))throw Error('Source/WAV/cues/provenance changed during sound export');
const receiptPath=range?`qa/HumanChairSound-excerpt-${range.replace(':','-')}.json`:'qa/HumanChairSound-render.json';
const bytes=await readFile(receiptPath),receipt=JSON.parse(bytes.toString());if(receipt.sourceSha256!==before.sourceSha256||receipt.outputSha256!==digest(await readFile(output)))throw Error('Render source/movie binding mismatch');
await writeFile(`${dir}/${tag}-render.json`,bytes);
await writeFile(`${dir}/${tag}-sound-binding.json`,JSON.stringify({schema:'human-chair-sound-binding-v1',...before,inputIdentitySha256:digest(JSON.stringify(before)),renderReceiptSha256:digest(bytes),renderReceipt:`${dir}/${tag}-render.json`,output,outputSha256:receipt.outputSha256,immutableDuringExport:true,listeningObserved:false,ownerAcceptance:false},null,2)+'\n');
console.log(`Sound assets/cues/export bound: ${dir}/${tag}-sound-binding.json`);
