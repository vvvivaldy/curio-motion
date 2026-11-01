"""Prepare the actual catalogued tile one-shots; no network, loop or synthesis."""
from pathlib import Path
import argparse,array,hashlib,json,subprocess,sys,wave

def main():
 p=argparse.ArgumentParser();p.add_argument('--catalog',type=Path,default=Path('public/audio/sfx/catalog.json'));p.add_argument('--ffmpeg',default='ffmpeg');a=p.parse_args();catalog=json.loads(a.catalog.read_text());version=subprocess.check_output([a.ffmpeg,'-version'],text=True).splitlines()[0];generator=Path(__file__);rows=[]
 for entry in catalog['entries']:
  if entry['material']!='tile':continue
  source=Path(entry['path']);assert hashlib.sha256(source.read_bytes()).hexdigest()==entry['sha256'];cmd=[a.ffmpeg,'-v','error','-i',str(source),'-ac','1','-ar','48000','-f','f32le','pipe:1'];raw=subprocess.check_output(cmd);floats=array.array('f');floats.frombytes(raw)
  if sys.byteorder!='little':floats.byteswap()
  source_peak=max(map(abs,floats));samples=array.array('h',[0]*len(floats));n=len(samples);fade_in,fade_out=48,144
  for i in range(n):samples[i]=round(floats[i]*.5*32767*max(0,min(1,i/(fade_in-1),(n-1-i)/(fade_out-1))))
  assert max(map(abs,samples))<32767, 'Decode needs additional explicit fixed headroom'
  peak=max(range(n),key=lambda i:abs(samples[i]));first=next(i for i,x in enumerate(samples) if x);out=source.with_suffix('.wav');pcm=array.array('h',samples)
  if sys.byteorder!='little':pcm.byteswap()
  with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(48000);w.writeframes(pcm.tobytes())
  info={'path':str(out),'staticFilePath':str(out.relative_to('public')),'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'sampleRate':48000,'channels':1,'samples':n,'durationSeconds':n/48000,'attackSample':peak,'attackSeconds':peak/48000,'attackDefinition':'Maximum absolute PCM sample of the existing recorded one-shot, used as numeric impact anchor; not a claim of perceived onset or material quality.','firstNonzeroSample':first,'samplePeakDbFS':None,'derivation':{'sourcePath':str(source),'sourceSha256':entry['sha256'],'decoderCommand':cmd,'decoderVersion':version,'script':str(generator),'scriptSha256':hashlib.sha256(generator.read_bytes()).hexdigest(),'operation':'Decode full existing single-hit OGG to mono48kHzFLOAT32; identical0.5bank gain BEFORE PCM16 quantization prevents Vorbis overshoot clipping; linear1msin/3msout boundary fade. No trim, individual normalization, pitch change or time stretch.','linearFadeSamples':{'in':fade_in,'out':fade_out},'fixedBankGain':.5,'decodedSourceFloatPeak':source_peak},'auditionApproved':False}
  import math
  info['samplePeakDbFS']=20*math.log10(abs(samples[peak])/32768);entry['wav']=info;rows.append({'id':entry['id'],**{k:info[k] for k in ['path','durationSeconds','attackSeconds','samplePeakDbFS','sha256']}})
 a.catalog.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+'\n');print(json.dumps(rows,indent=2))
if __name__=='__main__':main()
