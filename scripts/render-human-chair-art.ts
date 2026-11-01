import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {sourceSnapshot,digest,snapshotFiles} from './lib/authoring.mjs';
import {soundAssets,soundCues} from '../src/examples/human-chair-sound-v2/cues';
import {humanPose} from '../src/examples/human-chair/motion';
import {humanChairInkScene} from '../src/examples/human-chair-art/ink';
import {humanChairPaperScene} from '../src/examples/human-chair-art/paper';
const style=process.env.ART_STYLE;if(style!=='ink'&&style!=='paper')throw Error('ART_STYLE must be ink or paper');
const composition=style==='ink'?'HumanChairInk':'HumanChairPaper',scene=style==='ink'?humanChairInkScene:humanChairPaperScene;
const dir='qa/human-chair-art-v1';await mkdir(dir,{recursive:true});
const range=process.env.RENDER_RANGE,tag=style+(range?`-excerpt-${range.replace(':','-')}`:'-full');
const output=process.env.RENDER_OUTPUT??(range?`${dir}/${tag}.mp4`:`docs/assets/human-chair-${style}-v1.mp4`);
const accepted=JSON.parse(await readFile('qa/human-chair-sound-v2/full-sound-binding.json','utf8'));
async function inputs(){
 if(scene.pose!==humanPose||scene.settings.durationInFrames!==348||scene.settings.fps!==24)throw Error('Accepted pose/time contract changed');
 if(digest(JSON.stringify(soundCues))!==digest(JSON.stringify(accepted.cues)))throw Error('Accepted cues changed');
 const assets=await Promise.all(Object.entries(soundAssets).map(async([id,a])=>{const path=`public/${a.file}`,sha256=digest(await readFile(path));if(accepted.assets.find((x:any)=>x.id===id)?.sha256!==sha256)throw Error('Accepted WAV changed');return{id,...a,path,sha256};}));
 const source=await sourceSnapshot();for(const f of accepted.catalogInventory.files)if(digest(await readFile(f.path))!==f.sha256)throw Error('Accepted catalog changed '+f.path);
 return{sourceSha256:source.sha256,style,assets,cues:soundCues,catalogInventory:accepted.catalogInventory,rendererScriptSha256:digest(await readFile('scripts/render-human-chair-art.ts')),acceptedSilentMovieSha256:digest(await readFile('docs/assets/human-chair-v3.mp4')),acceptedSoundV2MovieSha256:digest(await readFile('docs/assets/human-chair-sound-v2.mp4')),exportOptions:{composition,audioCodec:'aac',videoCodec:'h264',crf:17,pixelFormat:'yuv420p',fps:24,frameRange:range??null}};
}
const before=await inputs();await writeFile(`${dir}/${tag}-inputs-before.json`,JSON.stringify(before,null,2)+'\n');
const result=spawnSync(process.execPath,['scripts/render.mjs'],{stdio:'inherit',env:{...process.env,COMPOSITION_ID:composition,RENDER_AUDIO_CODEC:'aac',RENDER_OUTPUT:output}});if(result.status!==0)throw Error('Official art render failed');
const after=await inputs();if(digest(JSON.stringify(before))!==digest(JSON.stringify(after)))throw Error('Image/audio inputs changed during art export');
const receiptPath=range?`qa/${composition}-excerpt-${range.replace(':','-')}.json`:`qa/${composition}-render.json`,bytes=await readFile(receiptPath),receipt=JSON.parse(bytes.toString());if(receipt.sourceSha256!==before.sourceSha256||receipt.outputSha256!==digest(await readFile(output)))throw Error('Receipt/image output mismatch');
await writeFile(`${dir}/${tag}-render.json`,bytes);await writeFile(`${dir}/${tag}-art-binding.json`,JSON.stringify({schema:'human-chair-art-with-accepted-audio-v1',...before,inputIdentitySha256:digest(JSON.stringify(before)),renderReceiptSha256:digest(bytes),output,outputSha256:receipt.outputSha256,immutableDuringExport:true,ownerStyleAccepted:false,playbackObserved:false,listeningObserved:false},null,2)+'\n');console.log(`Bound${style}film and exact accepted audio: ${dir}/${tag}-art-binding.json`);
