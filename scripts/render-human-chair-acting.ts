import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {sourceSnapshot,digest} from './lib/authoring.mjs';
import {soundAssets,actingCues} from '../src/examples/human-chair-neon/cues';
import {actingPose,actingTracks} from '../src/examples/human-chair-neon/acting';
import {actingSettings,actingTimeline} from '../src/examples/human-chair-neon/settings';
const mood=process.env.PERFORMANCE;
if(mood!=='confident'&&mood!=='cautious')throw Error('PERFORMANCE must be confident or cautious');
const composition=mood==='confident'?'HumanChairNeonConfident':'HumanChairNeonCautious';
const dir='qa/human-chair-neon-acting-v1',range=process.env.RENDER_RANGE;
const tag=mood+(range?`-excerpt-${range.replace(':','-')}`:'-full');
const output=process.env.RENDER_OUTPUT??(range?`${dir}/${tag}.mp4`:`docs/assets/human-chair-neon-${mood}-v1.mp4`);
try{await access(output);throw Error('Preserve existing film; choose a new RENDER_OUTPUT for an intentional revision');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
await mkdir(dir,{recursive:true});
const capturePath=`${dir}/light-capture.json`,controls=JSON.parse(await readFile(capturePath,'utf8'));
const accepted=JSON.parse(await readFile('qa/human-chair-sound-v2/full-sound-binding.json','utf8'));
const gate=JSON.parse(await readFile(`${dir}/approved-scoped-gate.json`,'utf8'));
const gateBytes=await readFile(gate.gatePath),gateVerdict=JSON.parse(gateBytes.toString());
if(digest(gateBytes)!==gate.gateSha256||!gateVerdict.fullDraftsAllowedByCurrentScopedVisualGate||gateVerdict.requiredRepairs.length)throw Error('Current scoped visual gate missing or rejected');
async function inputs(){
 const protectedModules=['settings.ts','acting.ts','scene.ts'].map(n=>`src/examples/human-chair-neon/${n}`);
 const controlBridge=await Promise.all(protectedModules.map(async path=>{
  const frozen=controls.source.files.find((f:any)=>f.path===path),sha256=digest(await readFile(path));
  if(!frozen||frozen.sha256!==sha256)throw Error('Control drawing source changed; new scoped review required: '+path);
  return{path,sha256,identicalToReviewedControl:true};
 }));
 const assets=await Promise.all(Object.entries(soundAssets).map(async([id,a])=>{
  const path=`public/${a.file}`,sha256=digest(await readFile(path));
  if(accepted.assets.find((f:any)=>f.id===id)?.sha256!==sha256)throw Error('Accepted recorded WAV changed '+path);
  return{id,...a,path,sha256};
 }));
 for(const f of accepted.catalogInventory.files)if(digest(await readFile(f.path))!==f.sha256)throw Error('Protected SFX catalog changed '+f.path);
 const source=await sourceSnapshot(),settings=actingSettings(mood),cues=actingCues[mood];
 const contacts=[...actingTracks[mood].flatMap((track,foot)=>track.map((s,index)=>({event:'foot-contact',foot,index,time:s.end,sole:actingPose(s.end,mood).legs[foot].sole}))),{event:'seat-contact',time:actingTimeline[mood].seatContact,hips:actingPose(actingTimeline[mood].seatContact,mood).hips}];
 if(cues.length!==contacts.length||cues.some(c=>c.from<0||(c.from+c.durationInFrames)>settings.durationInFrames))throw Error('New cue count or tail exceeds actual composition');
 return{sourceSha256:source.sha256,performance:mood,settings,assets,cues,contacts,controlGate:{path:gate.gatePath,sha256:gate.gateSha256,reviewedSourceSha256:gateVerdict.currentSourceSha256,ownerAccepted:false},catalogInventory:accepted.catalogInventory,controls:{capturePath,captureSha256:digest(await readFile(capturePath)),sourceSha256:controls.source.sha256,controlBridge},rendererScriptSha256:digest(await readFile('scripts/render-human-chair-acting.ts')),exportOptions:{composition,audioCodec:'aac',videoCodec:'h264',crf:17,pixelFormat:'yuv420p',fps:24,frameRange:range??null}};
}
const before=await inputs();await writeFile(`${dir}/${tag}-inputs-before.json`,JSON.stringify(before,null,2)+'\n');
const rendered=spawnSync(process.execPath,['scripts/render.mjs'],{stdio:'inherit',env:{...process.env,COMPOSITION_ID:composition,RENDER_AUDIO_CODEC:'aac',RENDER_OUTPUT:output}});
if(rendered.status!==0)throw Error('Official acting render failed');
const after=await inputs();if(digest(JSON.stringify(before))!==digest(JSON.stringify(after)))throw Error('Image/audio inputs changed during export');
const receiptPath=range?`qa/${composition}-excerpt-${range.replace(':','-')}.json`:`qa/${composition}-render.json`,bytes=await readFile(receiptPath),receipt=JSON.parse(bytes.toString());
if(receipt.sourceSha256!==before.sourceSha256||receipt.outputSha256!==digest(await readFile(output)))throw Error('Render receipt or output mismatch');
await writeFile(`${dir}/${tag}-render.json`,bytes);
await writeFile(`${dir}/${tag}-sound-binding.json`,JSON.stringify({schema:'human-chair-neon-acting-recorded-sound-v1',...before,inputIdentitySha256:digest(JSON.stringify(before)),renderReceiptSha256:digest(bytes),output,outputSha256:receipt.outputSha256,immutableDuringExport:true,ownerAccepted:false,fullPlaybackObserved:false,audioHeard:false},null,2)+'\n');
console.log(`Bound ${mood} film, actual contacts and recorded assets: ${dir}/${tag}-sound-binding.json`);
