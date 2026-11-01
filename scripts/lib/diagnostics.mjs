import {pathToFileURL,fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {projectPath,validateDiagnostics} from './authoring.mjs';

// Run the scene's pure geometry adapter locally; no browser/image or artistic inference.
export function captureDiagnostics(plan,stage,source,frames) {
  let results=[];
  if(plan.diagnosticModule) {
    const output=execFileSync(process.execPath,['--import','tsx',fileURLToPath(import.meta.url),'--module',plan.diagnosticModule,JSON.stringify(frames)],{encoding:'utf8'});
    results=JSON.parse(output);
  }
  const report={version:1,sourceSha256:source.sha256,frames,results,
    method:'Authored geometry relation diagnostics; not pixel, depth, clipping or artistic validation'};
  return validateDiagnostics(report,{source,frames,criteria:plan.stages[stage].criteria});
}
if(process.argv[2]==='--module') {
  const module=await import(pathToFileURL(projectPath(process.argv[3])).href);
  if(typeof module.diagnoseFrames!=='function')throw Error('Diagnostic module must export diagnoseFrames(frames)');
  const results=await module.diagnoseFrames(JSON.parse(process.argv[4]));
  process.stdout.write(JSON.stringify(results));
}
