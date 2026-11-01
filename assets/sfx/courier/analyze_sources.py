from pathlib import Path
import json, subprocess, numpy as np
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parent
RATE=48000
def decode(source):
 path=ROOT/source['sourceFile']
 probe=json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe','-v','error','-show_streams','-show_format','-of','json',str(path)]))
 channels=int(probe['streams'][0]['channels'])
 raw=subprocess.check_output(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(path),'-ar',str(RATE),'-f','f32le','-acodec','pcm_f32le','-'])
 # Explicit arithmetic stereo mean after resampling, mono unchanged.
 x=np.frombuffer(raw,dtype='<f4').reshape(-1,channels).astype(np.float64).mean(axis=1)
 return x,probe
def analyze(x):
 n=480; rms=np.array([np.sqrt(np.mean(x[i:i+n]**2)) for i in range(0,len(x),n)])
 threshold=max(float(np.max(rms))*.065, 1e-5)
 active=np.where(rms>=threshold)[0]
 groups=[]
 for a in active:
  if groups and a-groups[-1][-1] <=8: groups[-1].append(a)
  else:groups.append([a])
 events=[]
 for g in groups:
  if len(g)<2:continue
  lo=max(0,g[0]*n-720);hi=min(len(x),(g[-1]+1)*n+1200)
  y=x[lo:hi]
  events.append({'start':round(lo/RATE,4),'end':round(hi/RATE,4),'peakTime':round((lo+int(np.argmax(np.abs(y))))/RATE,4),'peakDbFS':round(20*np.log10(max(float(np.max(np.abs(y))),1e-12)),2)})
 return {'durationSeconds':len(x)/RATE,'floatPeak':float(np.max(np.abs(x))),'rmsDbFS':float(20*np.log10(max(float(np.sqrt(np.mean(x*x))),1e-12))),'activityThreshold':threshold,'events':events}
if __name__=='__main__':
 sources=json.loads((ROOT/'sources.json').read_text()); summaries=[]
 im=Image.new('RGB',(1700,200*len(sources)),'white');d=ImageDraw.Draw(im)
 for i,s in enumerate(sources):
  x,p=decode(s);a=analyze(x);a['id']=s['id'];a['probe']=p;summaries.append(a)
  np.save(ROOT/'analysis'/f"{s['id']}.npy",x)
  print(s['id'],json.dumps({k:v for k,v in a.items() if k!='probe'}))
  top=i*200;d.text((15,top+5),s['id']+' — '+str(round(a['durationSeconds'],3))+'s',fill='black')
  # Absolute amplitude with per-recording view gain, labeled; only for identifying boundaries.
  peak=max(a['floatPeak'],1e-8);edges=np.linspace(0,len(x),1601,dtype=int)
  for z,(l,r) in enumerate(zip(edges,edges[1:])):
   if r>l:
    hi=float(x[l:r].max())/peak;lo=float(x[l:r].min())/peak
    d.line((70+z,top+105-hi*68,70+z,top+105-lo*68),fill=(23,79,140))
  for sec in np.arange(0,a['durationSeconds'],max(.1,round(a['durationSeconds']/12,1))):
   px=70+sec/a['durationSeconds']*1600;d.text((px,top+178),str(round(float(sec),1)),fill='black')
 im.save(ROOT/'analysis'/'source-waveforms.png')
 (ROOT/'analysis'/'source-analysis.json').write_text(json.dumps(summaries,indent=2)+'\n')
