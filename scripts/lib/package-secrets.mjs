import {digest} from './package-files.mjs';
const rules=[
  ['mapbox',/\b(?:pk|sk)\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{10,}\b/g],
  ['github-token',/\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}\b/g],
  ['openai-token',/\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}\b/g],
  ['aws-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['private-key',/-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/g],
];
/** Bounded pattern scan. Never return matched credential bytes or surrounding snippets. */
export function scanCredentials(files){
  const findings=[];
  for(const[path,bytes]of files){const text=bytes.toString('utf8');
    for(const[rule,pattern]of rules){pattern.lastIndex=0;for(const match of text.matchAll(pattern))findings.push({path,rule,line:text.slice(0,match.index).split('\n').length,fingerprint:digest(match[0])});}
  }
  return findings;
}
export function assertNoCredentials(files){const findings=scanCredentials(files);if(findings.length){const error=new Error(`Known credential pattern: ${findings.map(f=>`${f.path} (${f.rule}, line ${f.line})`).join('; ')}`);error.findings=findings;throw error;}return {rules:rules.map(r=>r[0]),files:files.size,findings:0};}
export function redactMapboxPage(bytes){
  const original=bytes.toString('utf8');if(!Buffer.from(original).equals(bytes))throw Error('Source page must be UTF-8 for byte-preserving redaction');
  let count=0;const text=original.replace(rules[0][1],()=>{count++;return '[REDACTED_THIRD_PARTY_MAP_SERVICE_TOKEN]';});
  return {bytes:Buffer.from(text),count,beforeSha256:digest(bytes),afterSha256:digest(Buffer.from(text))};
}
