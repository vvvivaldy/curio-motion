import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {evaluateFrame} from '../src/core/time';
import {morningDeliverySettings} from '../src/examples/morning-delivery/settings';
import {morningDeliveryPose, morningSegments, morningFadeFrames} from '../src/examples/morning-delivery/motion';
import {raccoonCourierScene} from '../src/examples/raccoon-courier/scene';
import {deliveryInfographicScene} from '../src/examples/delivery-infographic/scene';
import {deliveryData} from '../src/examples/delivery-infographic/data';
import {courierSoundCues} from '../src/examples/raccoon-courier/sound';
import {runPlans} from '../src/examples/raccoon-courier/motion';
import {morningSoundCues, distantExitCues} from '../src/examples/morning-delivery/sound';

const settings = morningDeliverySettings;
assert.deepEqual([settings.width,settings.height,settings.fps,settings.durationInFrames],[1280,720,24,864]);
const spans=Object.entries(morningSegments);
let end=0;
for(const [,span] of spans){assert.equal(span.from,end,'No hidden gaps/overlap between authored shots');end+=span.frames;}
assert.equal(end,settings.durationInFrames);
for(const [name, child] of [['courier',raccoonCourierScene],['infographic',deliveryInfographicScene]] as const){
  const span=morningSegments[name];
  assert.equal(span.frames,child.settings.durationInFrames);
  assert.equal(settings.fps,child.settings.fps);
  for(let f=0;f<span.frames;f++){
    const q=evaluateFrame(settings,morningDeliveryPose,span.from+f).pose;
    assert.equal(q.segment,name);
    assert.equal(q.localFrame,f);
    assert.equal(q[name]!.frame,f);
    assert.deepEqual(q[name]!.pose,child.pose(f/settings.fps),`Child pose/time drift ${name}#${f}`);
    assert.equal(q[name==='courier'?'infographic':'courier'],null);
    if(f>=morningFadeFrames&&f<span.frames-morningFadeFrames)assert.equal(q.opacity,1);
  }
}
for(const f of [863,72,0,504,455,791,324,292,71,456,503,792,0]){
  const q=evaluateFrame(settings,morningDeliveryPose,f).pose;
  assert.deepEqual(q,evaluateFrame(settings,morningDeliveryPose,f).pose);
  assert.equal(q.total,deliveryData.total);
}
assert.equal(morningDeliveryPose(863/24).opacity,1,'The final card must remain visible');
for(let f=720;f<=791;f++)assert.equal(morningDeliveryPose(f/24).opacity,1,'Keep the full three-second reading hold');
// Author-editable numbers are not frozen by the regression suite. The film's
// actual values are recorded in its acceptance receipt, independently of this test.

for(const original of courierSoundCues){
  const c=morningSoundCues.find(c=>c.sourceCueId===original.id);
  assert(c,`Dropped original contact ${original.id}`);
  assert.equal(c.from,morningSegments.courier.from+original.from);
  assert.equal(c.asset,original.asset);assert.equal(c.gain,original.gain);
  assert.equal(c.durationInFrames,original.durationInFrames);
  assert.equal(c.targetSeconds,3+original.targetSeconds);
}
const expectedDistant=runPlans.exit.contacts.filter(c=>c.time>runPlans.exit.start&&c.station>=1370);
assert(expectedDistant.length>1,'Exit must include a sequence after the former cutoff');
assert.equal(distantExitCues.length,expectedDistant.length);
for(let i=0;i<distantExitCues.length;i++){
  const c=distantExitCues[i];
  assert.equal(c.targetSeconds,3+expectedDistant[i].time);
  assert(c.gain>0&&c.gain<.5);
  if(i)assert(c.gain<distantExitCues[i-1].gain,'Distant steps must diminish');
}

// Decode the actual shipped PCM WAV clips, retain their tails and inspect the mix.
const sampleRate=48000;
const mix=new Float64Array(settings.durationInFrames/settings.fps*sampleRate);
const assets=new Map<string,{samples:Int16Array;duration:number;shaPath:string}>();
for(const cue of morningSoundCues){
  assert(Number.isSafeInteger(cue.from)&&cue.from>=0&&cue.gain>0&&cue.gain<=1);
  if(!assets.has(cue.asset)){
    const path=`public/${cue.asset}`, b=readFileSync(path);
    assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE');
    let samples:Int16Array|undefined;
    for(let offset=12;offset+8<=b.length;){
      const id=b.toString('ascii',offset,offset+4),size=b.readUInt32LE(offset+4),start=offset+8;
      assert(start+size<=b.length,'Truncated WAV chunk');
      if(id==='fmt '){assert.equal(b.readUInt16LE(start),1);assert.equal(b.readUInt16LE(start+2),1);assert.equal(b.readUInt32LE(start+4),sampleRate);assert.equal(b.readUInt16LE(start+14),16);}
      if(id==='data'){samples=new Int16Array(size/2);for(let i=0;i<samples.length;i++)samples[i]=b.readInt16LE(start+2*i);}
      offset=start+size+(size%2);
    }
    assert(samples?.length);assets.set(cue.asset,{samples,duration:samples.length/sampleRate,shaPath:path});
  }
  const wav=assets.get(cue.asset)!;
  assert(Math.abs(wav.duration-cue.sourceDurationSeconds)<1/sampleRate,'Sound metadata/file duration differs');
  assert(cue.durationInFrames/settings.fps>=wav.duration,'Cue truncates the recorded tail');
  const offset=Math.round(cue.from/settings.fps*sampleRate);
  assert(offset+wav.samples.length<=mix.length,'Sound tail exceeds the film');
  for(let i=0;i<wav.samples.length;i++)mix[offset+i]+=wav.samples[i]/32768*cue.gain;
}
let peak=0,squares=0;
for(const x of mix){peak=Math.max(peak,Math.abs(x));squares+=x*x;}
assert(peak>0&&peak<.98,'Expected mix is empty or clips');
const lastDistant=distantExitCues.at(-1)!;
const endTime=lastDistant.from/settings.fps+lastDistant.sourceDurationSeconds;
assert(endTime>3+14.75,'The final offscreen step retains its complete tail');
const result={status:'pass',sourceFrames:{courier:384,infographic:288},allChildPosesUnchanged:true,
  sound:{cues:morningSoundCues.length,distinctAssets:assets.size,addedDistantContacts:distantExitCues.length,
    decreasingGains:distantExitCues.map(c=>c.gain),lastRecordedTailSeconds:endTime,
    predictedPcmPeak:peak,predictedPcmRms:Math.sqrt(squares/mix.length),sampleRate,
    notes:'Ideal frame-aligned PCM reference; renderer millisecond quantization/AAC are checked separately. Not an audition.'},
  data:{values:deliveryData.categories.map(c=>c.value),total:deliveryData.total,shares:deliveryData.categories.map(c=>c.sharePercent)}};
mkdirSync('qa/stage2',{recursive:true});writeFileSync('qa/stage2/contracts-audio.json',JSON.stringify(result,null,2)+'\n');
console.log(`PASS morning delivery: 672 unchanged child poses, pure seek, authored spans, ${morningSoundCues.length} recorded cues including ${distantExitCues.length} diminishing distant steps, PCM peak ${peak.toFixed(4)}`);
