import {resolve} from 'node:path';
import {parseArgs} from 'node:util';
import {readWorking,selectPayload} from './lib/package-files.mjs';
import {verifyPayload} from './lib/package-release.mjs';
const {values}=parseArgs({options:{root:{type:'string'}}});
const data=await readWorking(resolve(values.root??'.')),projection=selectPayload(data.all,data.policy),files=new Map(projection.files);
for(const path of data.policy.generated)if(data.all.has(path))files.set(path,data.all.get(path));
const result=verifyPayload(files);
console.log(JSON.stringify({status:'pass',scope:'public source projection; operational/local-only files excluded',files:result.files,checksums:result.checksums,provenance:result.provenance,credentials:result.secrets}));
