import {parseArgs} from 'node:util';
import {mkdir,writeFile,readFile,mkdtemp,rm,rename,copyFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {bundle} from '@remotion/bundler';
import {selectComposition,renderFrames,renderMedia} from '@remotion/renderer';
import {findTool,verifyFfmpeg} from './tools.mjs';
import {stages,digest,json,projectPath,loadPlan,sampleFrames,checkDelivery} from './lib/authoring.mjs';
const {values}=parseArgs({options:{plan:{type:'string'},stage:{type:'string'},film:{type:'string'},receipt:{type:'string'},check:{type:'boolean'}}});
if(!values.plan)throw Error('Use --plan authoring/<example>.json and --stage model|blocking|motion|final|drafts|all, or --check');
const loaded=await loadPlan(values.plan),{plan}=loaded;
const folder=`qa/authoring/${plan.id}`;
if(values.check) {
  const result=await checkDelivery(loaded,folder);
  await writeFile(`${folder}/delivery.json`,JSON.stringify(result,null,2));
  console.log('PASS',plan.id,'four current captures, artifact hashes and recorded visual reviews');
  process.exit(0);
}
const selected=values.stage==='all'?stages:values.stage==='drafts'?stages.slice(0,3):[values.stage];
if(selected.some(s=>!stages.includes(s)))throw Error('Unknown/missing stage');
let receipt;
if(selected.includes('final')) {
  if(!values.film||!values.receipt)throw Error('Final requires --film <official MP4> --receipt <render JSON>');
  receipt=await json(projectPath(values.receipt));
  if(receipt.method!=='official @remotion/renderer renderMedia'||receipt.composition!==plan.composition||
    receipt.sourceSha256!==loaded.source.sha256||receipt.outputSha256!==digest(await readFile(projectPath(values.film)))||receipt.pageErrors.length)
    throw Error('Film receipt is stale, mismatched or has browser errors; rerun npm run render');
  for(const [key,receiptKey] of Object.entries({width:'width',height:'height',fps:'fps',durationInFrames:'frames'}))
    if(plan.settings[key]!==receipt[receiptKey])throw Error('Film timebase does not match plan');
}
const browserExecutable=findTool('chrome'),temporary=await mkdtemp(join(tmpdir(),'curio-review-'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let serveUrl,composition;
try {
  await mkdir(folder,{recursive:true});
  if(selected.some(s=>s!=='final')) {
    serveUrl=await bundle({entryPoint:resolve('src/remotion/Root.tsx'),outDir:join(temporary,'bundle')});
    composition=await selectComposition({serveUrl,browserExecutable,id:plan.composition,chromiumOptions:{gl:'swangle'},
      onBrowserDownload:()=>{throw Error('Browser download disabled. Set CHROME_PATH.');}});
    for(const key of ['width','height','fps','durationInFrames'])if(composition[key]!==plan.settings[key])throw Error('Plan differs from real composition');
  }
  for(const stage of selected) {
    const frames=sampleFrames(plan,stage),run=`${stage}-${new Date().toISOString().replace(/[^0-9]/g,'')}-${loaded.identity.slice(0,8)}`;
    const dir=`${folder}/${run}`;await mkdir(`${dir}/frames`,{recursive:true});
    const errors=[];
    const options={serveUrl,browserExecutable,composition,chromiumOptions:{gl:'swangle'},concurrency:1,
      onBrowserDownload:()=>{throw Error('Browser download disabled. Set CHROME_PATH.');},
      onBrowserLog:log=>{if(log.type==='error')errors.push(log.text);}};
    if(stage==='final') {
      const ffmpeg=findTool('ffmpeg');verifyFfmpeg(ffmpeg);
      execFileSync(ffmpeg,['-v','error','-i',projectPath(values.film),'-vf',`select=${frames.map(f=>`eq(n\\,${f})`).join('+')}`,
        '-fps_mode','vfr','-start_number','0',`${dir}/frames/decoded-%06d.png`],{stdio:'inherit'});
      for(const [i,frame] of frames.entries())await rename(`${dir}/frames/decoded-${String(i).padStart(6,'0')}.png`,`${dir}/frames/f${String(frame).padStart(6,'0')}.png`);
      await copyFile(projectPath(values.film),`${dir}/preview.mp4`);
      await copyFile(projectPath(values.receipt),`${dir}/render-receipt.json`);
    } else {
      await renderFrames({...options,frames,inputProps:{},outputDir:null,imageFormat:'png',onStart:()=>{},onFrameUpdate:()=>{},
        onFrameBuffer:async(buffer,frame)=>{await writeFile(`${dir}/frames/f${String(frame).padStart(6,'0')}.png`,buffer);}});
      if(stage==='motion')await renderMedia({...options,codec:'h264',crf:20,pixelFormat:'yuv420p',imageFormat:'png',scale:.5,
        outputLocation:resolve(`${dir}/preview.mp4`)});
    }
    if(errors.length)throw Error(`Browser errors: ${errors.join('; ')}`);
    if((await loadPlan(values.plan)).identity!==loaded.identity)throw Error('Source/input/plan changed during capture; discard this incomplete run and recapture');
    const reference=`data:${loaded.input.reference.path.endsWith('.svg')?'image/svg+xml':'image/png'};base64,${loaded.referenceBytes.toString('base64')}`;
    const cards=frames.map(frame=>`<figure><img src="frames/f${String(frame).padStart(6,'0')}.png"><figcaption>f${frame} · ${(frame/plan.settings.fps).toFixed(3)}s — ${esc(plan.stages[stage].samples.filter(s=>Math.abs(s.frame-frame)<=(s.radius??0)).map(s=>s.label).join('; '))}</figcaption></figure>`).join('');
    await writeFile(`${dir}/report.html`,`<!doctype html><meta charset="utf-8"><title>${esc(plan.id)} / ${stage}</title><style>body{background:#f7f2e6;color:#263f46;font:16px system-ui;margin:24px}img,video{max-width:100%}.ref{max-height:440px}section{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}figure{margin:0}figcaption{padding:8px}li{margin:8px}code{overflow-wrap:anywhere}@media(max-width:800px){section{grid-template-columns:1fr}}</style><h1>${esc(plan.id)} / ${stage}</h1><p>Whole reference → authored source → actual ${stage==='final'?'decoded MP4':'Remotion'} frames. Visual review pending.</p><code>${loaded.identity}</code><p><img class="ref" src="${reference}"></p><h2>Review criteria</h2><ul>${plan.stages[stage].criteria.map(c=>`<li>${esc(c)}</li>`).join('')}</ul>${['motion','final'].includes(stage)?'<video controls loop src="preview.mp4"></video><p>Inspect at normal speed and 0.5× in your player.</p>':''}<section>${cards}</section>`);
    const names=[...frames.map(f=>`frames/f${String(f).padStart(6,'0')}.png`),'report.html',...(['motion','final'].includes(stage)?['preview.mp4']:[]),...(stage==='final'?['render-receipt.json']:[])];
    const artifacts=await Promise.all(names.map(async path=>({path,sha256:digest(await readFile(`${dir}/${path}`))})));
    const capture={version:1,stage,identity:loaded.identity,source:loaded.source,plan:values.plan,input:plan.input,
      createdAt:new Date().toISOString(),method:stage==='final'?'Decoded official renderMedia MP4':'Official @remotion/renderer renderFrames',
      settings:plan.settings,frames,criteria:plan.stages[stage].criteria,artifacts,pageErrors:errors,platform:process.platform};
    const captureBytes=JSON.stringify(capture,null,2);await writeFile(`${dir}/capture.json`,captureBytes);
    await writeFile(`${dir}/review.json`,JSON.stringify({captureSha256:digest(captureBytes),decision:'pending',reviewer:'',notes:'',
      checks:capture.criteria.map(criterion=>({criterion,verdict:'pending',notes:''})),playback:{normal:false,slow:false},issues:[]},null,2));
    let latest={};try{latest=await json(`${folder}/latest.json`);}catch(e){if(e.code!=='ENOENT')throw e;}
    latest[stage]=run;await writeFile(`${folder}/latest.json`,JSON.stringify(latest,null,2));
    console.log(stage,frames.length,'frames →',`${dir}/report.html`,'(visual review pending)');
  }
} finally {await rm(temporary,{recursive:true,force:true});}
