#!/usr/bin/env python3
"""Three recorded-chair candidate cuts, from preserved official HQ preview bytes.

No synthesis, AI, pitch/time manipulation, denoising or library/core edits.
Uses Python standard library and the existing local FFmpeg/ffprobe executables.
"""
from __future__ import annotations
import argparse
from array import array
import hashlib
import io
import json
import math
from pathlib import Path
import re
import subprocess
import sys
import wave

BASE=Path(__file__).resolve().parent
RATE=48000
FFMPEG='/opt/homebrew/bin/ffmpeg'
FFPROBE='/opt/homebrew/bin/ffprobe'
SOURCES={
 'unkleceeg-276473':{
  'file':'unkleceeg-276473-hq.mp3',
  'sha256':'e7652d394e6ef808f31590181a49ae3134bf170468ef3072cdcfc21ec295cb04',
  'title':'Chair creaking back and forth 01.wav',
  'author':'unkleceeg',
  'sourceUrl':'https://freesound.org/people/unkleceeg/sounds/276473/',
  'downloadUrl':'https://cdn.freesound.org/previews/276/276473_3327014-hq.mp3',
  'license':'CC0-1.0',
  'licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/',
  'authorRecordingDescription':'Author describes a chair creaking back and forth, recorded with a Zoom Q2HD; wood tag on the source page.',
  'attributionRequired':False,
  'credit':'Chair creaking back and forth 01.wav — unkleceeg — Freesound276473 — CC0 1.0.',
 },
 'trashcan-783598':{
  'file':'trashcan-783598-hq.mp3',
  'sha256':'b0e1323cf5c2a47d7bdd05928edb93e9e0e33e128229c65631e86b1b0bfbc3f9',
  'title':'011 - Pulling Out Chair, Sitting',
  'author':'Trashcan_Studios',
  'sourceUrl':'https://freesound.org/people/Trashcan_Studios/sounds/783598/',
  'downloadUrl':'https://cdn.freesound.org/previews/783/783598_12973965-hq.mp3',
  'license':'CC-BY-4.0',
  'licenseUrl':'https://creativecommons.org/licenses/by/4.0/',
  'authorRecordingDescription':'Author describes pulling a wooden chair out and sitting, recorded at a cabin in Jasper in December2024.',
  'attributionRequired':True,
  'credit':'011 - Pulling Out Chair, Sitting — Trashcan_Studios — https://freesound.org/people/Trashcan_Studios/sounds/783598/ — CC BY 4.0 https://creativecommons.org/licenses/by/4.0/. Modified: excerpt, stereo-to-mono downmix, gain, short edge fades, PCM16/48kHz conversion.',
 },
}
CUTS=[
 {'id':'chair-creak-cc0-01','source':'unkleceeg-276473','searchStartSample':223680,'endSampleExclusive':254400,'gainDb':0.0,'purpose':'Primary short creak candidate for seat-load; one isolated energy event around4.76..5.14s, not audition-verified.'},
 {'id':'chair-creak-cc0-02','source':'unkleceeg-276473','searchStartSample':352320,'endSampleExclusive':374880,'gainDb':-2.0,'purpose':'Alternative short creak candidate, isolated energy event around7.44..7.65s, not audition-verified.'},
 {'id':'chair-seat-ccby-01','source':'trashcan-783598','searchStartSample':393600,'endSampleExclusive':438720,'gainDb':4.0,'purpose':'Optional alternative from recorded wooden-chair pull/sit scene, late isolated event; exact event identity needs owner audition.'},
]

def digest(data:bytes)->str:return hashlib.sha256(data).hexdigest()
def db(x:float)->float|None:return 20*math.log10(x)if x>0 else None

def decode(source:dict)->list[float]:
 data=(BASE/'originals'/source['file']).read_bytes()
 if digest(data)!=source['sha256']:raise ValueError('Original byte identity changed: '+source['file'])
 raw=subprocess.check_output([FFMPEG,'-v','error','-i',str(BASE/'originals'/source['file']),'-ac','1','-ar',str(RATE),'-f','f32le','-c:a','pcm_f32le','pipe:1'])
 values=array('f');values.frombytes(raw)
 if sys.byteorder!='little':values.byteswap()
 return list(values)

def encode(source_samples:list[float],spec:dict)->tuple[bytes,dict]:
 # Select a 5ms RMS threshold crossing, keep8ms of original pre-roll.
 # This is an explicit technical anchor, NOT a claim about perceived onset.
 begin,end=spec['searchStartSample'],spec['endSampleExclusive']
 size=240
 blocks=[(i,math.sqrt(sum(x*x for x in source_samples[i:min(i+size,end)])/min(size,end-i)))for i in range(begin,end,size)]
 peak=max(x[1]for x in blocks)
 threshold_db=max(-45.0,db(peak)-18.0)
 active=next(i for i,value in blocks if value>=10**(threshold_db/20))
 start=max(begin,active-384)
 samples=source_samples[start:end]
 fade_in,fade_out=96,1440
 gain=10**(spec['gainDb']/20)
 pcm=[]
 for i,x in enumerate(samples):
  a=min(1.0,i/(fade_in-1))
  b=min(1.0,(len(samples)-1-i)/(fade_out-1))
  weight=(.5-.5*math.cos(math.pi*a))*(.5-.5*math.cos(math.pi*b))
  value=x*gain*weight
  if not math.isfinite(value)or abs(value)>=.99:raise ValueError('Unexpected peak; refusing clipping')
  pcm.append(round(value*32767))
 array16=array('h',pcm)
 if sys.byteorder!='little':array16.byteswap()
 stream=io.BytesIO()
 with wave.open(stream,'wb')as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(array16.tobytes())
 data=stream.getvalue();nz=[i for i,x in enumerate(pcm)if x];peak_index=max(range(len(pcm)),key=lambda i:abs(pcm[i]));rms=math.sqrt(sum((x/32768)**2 for x in pcm)/len(pcm))
 record={
  'id':spec['id'],'file':spec['id']+'.wav','sha256':digest(data),'sourceId':spec['source'],'sourceSha256':SOURCES[spec['source']]['sha256'],
  'license':SOURCES[spec['source']]['license'],'licenseUrl':SOURCES[spec['source']]['licenseUrl'],'credit':SOURCES[spec['source']]['credit'],
  'sourceCut':{'coordinateSystem':'Decoded officialMP3 timeline from first output sample, mono48kHz. FFmpeg handles MP3 priming before cuts. NOT original native-WAV sample offsets.','startSampleInclusive':start,'endSampleExclusive':end,'startSeconds':start/RATE,'endSeconds':end/RATE},
  'format':{'codec':'pcm_s16le','container':'wav','sampleRate':RATE,'channels':1,'samples':len(pcm),'durationSeconds':len(pcm)/RATE},
  'processing':{'downmix':'Existing FFmpeg default stereo-to-mono, before cut','gainDb':spec['gainDb'],'fadeInSamples':fade_in,'fadeOutSamples':fade_out,'fadeShape':'raised cosine','timeStretch':False,'pitchShift':False,'denoise':False,'synthesis':False},
  'attack':{'activityAnchorSample':active-start,'activityAnchorSeconds':(active-start)/RATE,'activityDefinition':f'First non-overlapping5ms original-PCM RMS block >={threshold_db:.6f}dBFS within fixed search range; technical alignment anchor only.','activityResolutionSamples':size,'firstNonzeroSample':nz[0],'firstNonzeroSeconds':nz[0]/RATE,'peakSample':peak_index,'peakSeconds':peak_index/RATE,'leadingExactSilenceSamples':nz[0],'note':'Pre-roll retains quiet recorded ambience; firstNonzero is not the audible attack. Use activityAnchor, inspect/listen for final placement at seatContact6.35s.'},
  'metrics':{'samplePeakDbFS':db(max(abs(x)for x in pcm)/32768),'rmsDbFS':db(rms),'clippedSamples':sum(abs(x)>=32767 for x in pcm),'firstSample':pcm[0],'lastSample':pcm[-1],'dcMean':sum(pcm)/len(pcm)/32768},
  'purpose':spec['purpose'],'audition':{'listened':False,'ownerAuditionPending':True,'naturalnessApproved':False},
 }
 return data,record

def main()->None:
 parser=argparse.ArgumentParser();parser.add_argument('--verify',action='store_true');args=parser.parse_args()
 decoded={key:decode(source)for key,source in SOURCES.items()};records=[]
 for spec in CUTS:
  data,record=encode(decoded[spec['source']],spec);out=BASE/'cuts'/record['file']
  if args.verify:
   if out.read_bytes()!=data:raise ValueError('Cut reproduction mismatch: '+str(out))
  else:
   out.parent.mkdir(exist_ok=True);out.write_bytes(data)
  records.append(record)
 if not args.verify:
  manifest={'version':'recorded-chair-v2-candidates-01','generatorSha256':digest(Path(__file__).read_bytes()),'ffmpegVersion':subprocess.check_output([FFMPEG,'-version'],text=True).splitlines()[0],'sources':SOURCES,'cuts':records,'important':'Preserved originals are the official public HQMP3 preview bytes, NOT nativeWAV masters. No login/download restriction was bypassed. Lossless native masters were not obtained. PCM output does not restore information lost in MP3.','listened':False}
  (BASE/'cuts-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'byte-identical-verified'if args.verify else'prepared','cuts':[{'id':r['id'],'sha256':r['sha256'],'sourceCut':r['sourceCut'],'seconds':r['format']['durationSeconds'],'activityAnchor':r['attack']['activityAnchorSeconds'],'peakDbFS':r['metrics']['samplePeakDbFS']}for r in records]},ensure_ascii=False,indent=2))

if __name__=='__main__':main()
