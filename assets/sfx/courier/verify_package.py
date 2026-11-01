"""Verify delivered bytes/provenance; no subjective hearing or final-film claims."""
from pathlib import Path
import hashlib, json, subprocess, wave
import numpy as np

ROOT=Path(__file__).resolve().parent
RATE=48000
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def wav_pcm(p):
 with wave.open(str(p),'rb') as f:
  assert (f.getnchannels(),f.getsampwidth(),f.getframerate())==(1,2,RATE)
  return np.frombuffer(f.readframes(f.getnframes()),'<i2')
def decode_original(p):
 probe=json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-show_streams','-of','json',str(p)]))
 channels=int(probe['streams'][0]['channels'])
 out=subprocess.check_output(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(p),'-ar','48000','-c:a','pcm_f32le','-f','f32le','-'])
 return np.frombuffer(out,'<f4').reshape(-1,channels).astype(np.float64).mean(axis=1)
def max_correlation(a,b):
 # Detect literal copies/delays/polarity copies despite varying file length.
 # Zero-mean cosine correlation at every lag, normalized by full clip energy.
 a=a.astype(float);b=b.astype(float);a-=a.mean();b-=b.mean()
 n=1<<(len(a)+len(b)-2).bit_length()
 c=np.fft.irfft(np.fft.rfft(a,n)*np.conj(np.fft.rfft(b,n)),n)
 return float(np.max(np.abs(c))/max(float(np.linalg.norm(a)*np.linalg.norm(b)),1e-20))

if __name__=='__main__':
 m=json.loads((ROOT/'manifest.json').read_text());checks=[];details=[]
 def require(condition,name):
  checks.append({'check':name,'pass':bool(condition)})
  if not condition:raise AssertionError(name)
 sources={s['id']:s for s in m['sources']};decoded={}
 require(len({s['sourceSha256'] for s in sources.values()})==13,'13 distinct source recording byte hashes')
 for sid,s in sources.items():
  for f,h in [('sourceFile','sourceSha256'),('pageFile','pageSha256'),('licenseEvidenceFile','licenseEvidenceSha256')]:
   require(sha(ROOT/s[f])==s[h],f'{sid}: {f} SHA256')
  page=(ROOT/s['pageFile']).read_text()
  require('Creative Commons 0</a>' in page and 'creativecommons.org/publicdomain/zero/1.0/' in page,f'{sid}: CC0 license on primary page')
  require(s['officialPreview'] in page,f'{sid}: exact HQ preview URL belongs to primary page')
  decoded[sid]=decode_original(ROOT/s['sourceFile'])
 all_pcm={}
 for e in m['entries']:
  p=ROOT/e['packageFile'];pcm=wav_pcm(p);x=pcm.astype(float)/32768
  require(sha(p)==e['sha256'],e['id']+': derivative SHA256')
  require(len(pcm)==e['samples'] and p.stat().st_size==e['bytes'],e['id']+': duration/size/format')
  require(np.count_nonzero(pcm)>0 and np.sqrt(np.mean(x*x))>10**(-55/20),e['id']+': non-silent usable numerical level')
  require(np.max(np.abs(pcm.astype(np.int32)))<32767,e['id']+': no full-scale/clipped PCM samples')
  require(pcm[0]==0 and pcm[-1]==0,e['id']+': zero endpoints after cosine fades')
  d=e['derivation'];l,r=d['sourceCutSamples48k'];y=decoded[e['sourceId']][l:r].copy()*d['gain']
  fi,fo=[round(v*RATE) for v in d['cosineFadeSeconds']]
  y[:fi]*=(1-np.cos(np.linspace(0,np.pi,fi)))/2;y[-fo:]*=(1+np.cos(np.linspace(0,np.pi,fo)))/2
  expected=np.rint(y*32767).astype('<i2')
  require(np.array_equal(pcm,expected),e['id']+': exact source-range/gain/fade reconstruction')
  # 4x oversampled sample peak: useful intersample-overshoot check, not a calibrated true-peak meter claim.
  over=subprocess.check_output(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(p),'-ar','192000','-c:a','pcm_f32le','-f','f32le','-'])
  peak4=float(np.max(np.abs(np.frombuffer(over,'<f4'))));require(peak4<.95,e['id']+': 4x oversampled peak has headroom')
  details.append({'id':e['id'],'samplePeakDbFS':e['samplePeakDbFS'],'oversampled4xPeakDbFS':float(20*np.log10(peak4)),'rmsDbFS':e['rmsDbFS'],'quietBinFractionBelowMinus65dBFS':e['quietBinFractionBelowMinus65dBFS'],'note':'Quiet head/tail bins are allowed for isolated natural transients; no all-silent candidate.'})
  all_pcm[e['id']]=pcm
 require(len({e['sha256'] for e in m['entries']})==16,'16 distinct derivative byte hashes')
 pairs=[];ids=list(all_pcm)
 for i,a in enumerate(ids):
  for b in ids[i+1:]:pairs.append({'a':a,'b':b,'absoluteLagCorrelation':max_correlation(all_pcm[a],all_pcm[b])})
 pairs.sort(key=lambda p:p['absoluteLagCorrelation'],reverse=True)
 require(pairs[0]['absoluteLagCorrelation']<.98,'no identical/delayed/scaled waveform clone among candidates')
 # Compare with an immutable snapshot taken BEFORE this package was added.
 # Installed copies of our own assets must not become members of this baseline.
 # The historical library-root string in the inventory is provenance, never opened.
 baseline_ref=m['verificationBaseline'];baseline_path=ROOT/baseline_ref['inventoryFile']
 require(sha(baseline_path)==baseline_ref['inventorySha256'],'saved original baseline inventory SHA256')
 inventory=json.loads(baseline_path.read_text());baseline=inventory['audioBaseline']
 require(len(baseline['files'])==baseline['fileCount'] and bool(baseline['files']),'saved original baseline has declared nonempty file list')
 old_hashes={f['sha256'] for f in baseline['files']}
 require(all(len(h)==64 and all(c in '0123456789abcdef' for c in h) for h in old_hashes) and len(old_hashes)==baseline['distinctAudioSha256Count'],'saved original baseline has valid distinct SHA256 count')
 require(not [s['id'] for s in sources.values() if s['sourceSha256'] in old_hashes],'source recordings are not byte copies of saved original baseline audio')
 require(not [e['id'] for e in m['entries'] if e['sha256'] in old_hashes],'working WAV are not byte duplicates of saved original baseline audio')
 audition=wav_pcm(ROOT/'audition.wav')
 for seg in m['audition']['segments']:
  a=round(seg['startSeconds']*RATE);b=round(seg['endSeconds']*RATE)
  require(np.array_equal(audition[a:b],all_pcm[seg['id']]),seg['id']+': audition contains exact PCM bytes at declared times')
 require(sha(ROOT/'audition.wav')==m['audition']['wavSha256'] and sha(ROOT/'audition.mp3')==m['audition']['mp3Sha256'],'audition hashes')
 mp3=decode_original(ROOT/'audition.mp3');require(np.max(np.abs(mp3))<.95,'MP3 audition decode headroom')
 comparison={'mode':'saved-original-library-baseline','baselineName':baseline['name'],'baselineInventoryFile':baseline_ref['inventoryFile'],'baselineInventorySha256':sha(baseline_path),'baselineAudioFileCount':baseline['fileCount'],'baselineDistinctAudioHashesCompared':len(old_hashes),'liveInstalledCatalogScanned':False,'originalLibraryRootRequired':False,'scope':'Compares new source/working hashes to the frozen pre-addition baseline only. It does not scan or assess the current installed catalog.'}
 report={'status':'PASS','checks':checks,'checkCount':len(checks),'assets':details,'largestWaveformCorrelations':pairs[:8],'duplicateComparison':comparison,'independentByteReconstruction':'reads local manifest and untouched local source MP3 anew; exact declared sample ranges and transforms compared to each local output PCM; independent of baseline duplicate comparison and no import of preparation plans','limitations':['No auditory perception, no subjective sound/noise/material approval.','No final-scene cue, playback, encoded-film mix or sync verification: separate integration work.','Duplicate comparison is against the saved original baseline; the live installed catalog is not inspected.','4x resampled sample peaks are not claimed as a certified BS.1770 true-peak measurement.'],'verificationScriptSha256':sha(Path(__file__))}
 (ROOT/'analysis').mkdir(exist_ok=True)
 (ROOT/'analysis'/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
 print(json.dumps({'status':'PASS','checks':len(checks),'assetCount':len(all_pcm),'sourceCount':len(sources),'maxCandidateLagCorrelation':pairs[0],'duplicateComparison':comparison},ensure_ascii=False))
