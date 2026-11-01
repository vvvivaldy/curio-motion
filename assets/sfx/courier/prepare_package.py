"""Deterministic, non-synthetic excerpts. Run with the bundled Python + NumPy.
Source previews remain unmodified. This script writes only inside its own package.
"""
from pathlib import Path
import hashlib, html, json, re, subprocess, wave
import numpy as np
from analyze_sources import decode, RATE

ROOT=Path(__file__).resolve().parent
PLANS=[
 # id, source, [start,end] source decoded seconds, linear gain, [fade in,out], group, material, role, Russian label, recorded-subject/use caveat
 ('shoe-wood-sneaker-01','wood-sneakers',[1.55,1.87],.8,[.001,.012],'footsteps','wood / low sneakers','single-human-shoe-footstep','Кеды по дереву: более тихий удар','Записана человеческая обувь по деревянной поверхности; фоли для лап енота в обуви.'),
 ('shoe-wood-sneaker-02','wood-sneakers',[7.76,8.08],.8,[.001,.012],'footsteps','wood / low sneakers','single-human-shoe-footstep','Кеды по дереву: более громкий удар','Другой реальный контакт того же take; не отдельная исходная запись и не pitch/gain-копия первого.'),
 ('shoe-wood-leather-01','wood-leather-shoes',[.24,.64],3,[.002,.015],'footsteps','wood / leather shoes','single-human-shoe-footstep','Кожаная обувь по дереву: удар 1','Реальная кожаная обувь по деревянному полу; фрагмент до описанного автором финального скрипа.'),
 ('shoe-wood-leather-02','wood-leather-shoes',[1.08,1.48],3,[.002,.015],'footsteps','wood / leather shoes','single-human-shoe-footstep','Кожаная обувь по дереву: удар 2','Другой контакт той же короткой исходной записи; не новый исходный take.'),
 ('shoe-wood-vans-01','wood-vans',[4.12,4.44],.8,[.001,.014],'footsteps','hardwood / Vans sneakers','single-human-shoe-footstep','Vans по деревянному полу: удар 1','Реальные кроссовки Vans по деревянному полу; источник может содержать скрипы пола/подошвы.'),
 ('shoe-wood-vans-02','wood-vans',[8.84,9.18],.8,[.001,.014],'footsteps','hardwood / Vans sneakers','single-human-shoe-footstep','Vans по деревянному полу: удар 2','Другой контакт того же take; оставлена естественная разница удара.'),
 ('paper-pickup-note','paper-pickup',[0,.145],4,[.002,.008],'paper-handling','thin paper / banknote','paper-pickup-foley','Взятие тонкой бумаги','Исходник — поднятие долларовой банкноты, а не конверта; предложенное фоли короткого захвата конверта.'),
 ('paper-turn-book','page-turn',[0,.78],1.5,[.003,.025],'paper-handling','book paper','paper-turn-foley','Переворот бумажной страницы','Реальная книжная страница, а не запечатанный конверт; кандидат фоли поворота конверта в руках.'),
 ('paper-finger-pass','paper-handling',[27.4,28.25],8,[.012,.025],'paper-handling','paper sheet','paper-handling-foley','Пальцы по листу: мягкий шелест','Автор записал касания и проведение пальцем по бумажному листу; кандидат для поддержки/укладывания конверта.'),
 ('envelope-desk-slide','envelope-slide',[.31,.77],4,[.006,.020],'paper-slide','paper envelope / desk','envelope-sliding','Конверт скользит по столу','Записано скольжение настоящего конверта по письменному столу.'),
 ('paper-soft-brush','paper-brush',[0,.48],2,[.003,.020],'paper-slide','paper sheet','paper-sliding','Бумага: мягкое короткое скольжение','Записано движение листа бумаги; кандидат более мягкого движения конверта.'),
 ('wood-desk-touch','wood-desk-tap',[.81,.98],.18,[.001,.012],'wood-contact','wooden desk','single-wood-tap','Короткое касание деревянного стола','Записано касание деревянного стола; снижение уровня для мягкого контакта лапы со стойкой.'),
 ('wood-table-touch','wood-table-tap',[.145,.64],.15,[.002,.020],'wood-contact','wooden tabletop','single-wood-tap','Касание столешницы: отдельная запись 2','Другая реальная запись и автор; материал подтверждён описанием, характер и мягкость требуют слуховой оценки.'),
 ('bag-leather-flex','leather-rustle',[3.30,4.05],3,[.012,.025],'bag-material','leather jacket','leather-movement-foley','Кожа: короткое движение','Источник — движение кожаной куртки; фоли для сгиба кожаной сумки, не буквальная запись сумки.'),
 ('bag-cotton-rustle','cotton-rustle',[2.55,3.75],16,[.015,.030],'bag-material','cotton clothing','cotton-movement-foley','Хлопок: движение мягкой сумки','Источник — хлопковая одежда; фоли тканевой сумки, не запись именно почтовой сумки.'),
 ('bag-cloth-shift','cloth-movement',[3.0,3.5],16,[.012,.025],'bag-material','cloth','cloth-movement-foley','Ткань: небольшой сдвиг','Источник — отдельная запись движения ткани другим автором; для укладывания бумаги или успокоения сумки.'),
]
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def savewav(path,pcm):
 with wave.open(str(path),'wb') as f:
  f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.astype('<i2').tobytes())
def stats(pcm):
 x=pcm.astype(np.float64)/32768
 rms=np.sqrt(np.mean(x*x));peak=float(np.max(np.abs(x)))
 # Technical 5 ms RMS timing; no claim of heard/perceived onset.
 bins=np.array([np.sqrt(np.mean(x[i:i+240]**2)) for i in range(0,len(x),240)])
 active=np.flatnonzero(bins>=max(float(bins.max())*.2,1e-6))
 quiet=bins<10**(-65/20)
 return {'samples':len(x),'durationSeconds':len(x)/RATE,'sampleRate':RATE,'channels':1,'codec':'pcm_s16le','format':'PCM16 WAV','samplePeakDbFS':float(20*np.log10(max(peak,1e-12))),'rmsDbFS':float(20*np.log10(max(float(rms),1e-12))),'fullScaleSamples':int(np.count_nonzero(np.abs(pcm.astype(np.int32))>=32767)),'peakSeconds':int(np.argmax(np.abs(x)))/RATE,'technicalActivityAnchorSeconds':int(active[0])*240/RATE if len(active) else None,'activityAnchorDefinition':'first 5ms RMS bin >=20% maximum; technical activity, not perceived onset','quietBinFractionBelowMinus65dBFS':float(quiet.mean()),'firstSample':int(pcm[0]),'lastSample':int(pcm[-1])}

if __name__=='__main__':
 sources=json.loads((ROOT/'sources.json').read_text());source_by_id={s['id']:s for s in sources}
 ffmpeg_version=subprocess.check_output(['/opt/homebrew/bin/ffmpeg','-version'],text=True).splitlines()[0]
 decoded={s['id']:decode(s)[0] for s in sources}
 entries=[];audition_parts=[np.zeros(int(.75*RATE),dtype=np.int16)];cursor=.75;audition=[]
 previous_group=None
 for aid,sid,bounds,gain,fades,group,material,role,label,caveat in PLANS:
  s=source_by_id[sid];l,r=[round(v*RATE) for v in bounds];x=decoded[sid][l:r].copy()
  assert len(x)==r-l
  x*=gain
  n_in,n_out=[round(v*RATE) for v in fades]
  if n_in:x[:n_in]*=(1-np.cos(np.linspace(0,np.pi,n_in)))/2
  if n_out:x[-n_out:]*=(1+np.cos(np.linspace(0,np.pi,n_out)))/2
  assert np.max(np.abs(x))<.9, (aid,'unsafe gain')
  pcm=np.rint(x*32767).astype('<i2');out=ROOT/'assets'/f'{aid}.wav';savewav(out,pcm)
  measured=stats(pcm);assert measured['rmsDbFS']>-55 and measured['fullScaleSamples']==0
  entry={'id':aid,'labelRu':label,'group':group,'variant':sum(e['group']==group for e in entries)+1,'sourceId':sid,'sameTakeVariant':sum(p[1]==sid for p in PLANS)>1,'material':material,'role':role,'authors':[s['author']],'sourcePage':s['page'],'sourceURLs':[s['page'],s['licenseUrl']],'license':'CC0-1.0','licenseAsDistributed':'CC0-1.0; separate media license, not relicensed by Curio MIT code','licenseUrl':s['licenseUrl'],'licenseEvidenceFile':s['licenseEvidenceFile'],'packageFile':str(out.relative_to(ROOT)),'path':f'public/audio/sfx/courier/{aid}.wav','staticFilePath':f'audio/sfx/courier/{aid}.wav','file':f'audio/sfx/courier/{aid}.wav','sha256':sha(out),'bytes':out.stat().st_size,**measured,'derivation':{'sourceFile':s['sourceFile'],'sourceSha256':s['sourceSha256'],'sourceKind':s['sourceKind'],'sourceCutSeconds':bounds,'sourceCutSamples48k':[l,r],'gain':gain,'cosineFadeSeconds':fades,'operation':'ffmpeg decode and resample to 48k float32 preserving channels; arithmetic channel mean (stereo L+R / 2, mono unchanged); exact sample slice; declared gain; cosine edge fades; round(x*32767) to PCM16; no pitch, time stretch, synthesis, denoise, or layered composite','ffmpegVersion':ffmpeg_version,'preparationScript':'prepare_package.py','preparationScriptSha256':sha(Path(__file__)),'decodeScript':'analyze_sources.py','decodeScriptSha256':sha(ROOT/'analyze_sources.py')},'foley':{'recordedSubjectAndUseRu':caveat,'contextListeningPending':True},'auditioned':False,'auditionApproved':False,'pitchOrPlaybackRateModified':False}
  entries.append(entry)
  if previous_group is not None:
   gap=1.25 if group!=previous_group else .65
   audition_parts.append(np.zeros(round(gap*RATE),dtype=np.int16));cursor+=gap
  audition.append({'index':len(audition)+1,'id':aid,'labelRu':label,'sourceId':sid,'group':group,'startSeconds':round(cursor,6),'endSeconds':round(cursor+len(pcm)/RATE,6),'additionalGain':1.0})
  audition_parts.append(pcm);cursor+=len(pcm)/RATE;previous_group=group
 audition_parts.append(np.zeros(round(.75*RATE),dtype=np.int16));cursor+=.75
 savewav(ROOT/'audition.wav',np.concatenate(audition_parts))
 subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-y','-i',str(ROOT/'audition.wav'),'-c:a','libmp3lame','-b:a','160k',str(ROOT/'audition.mp3')],check=True)
 for s in sources:
  page=(ROOT/s['pageFile']).read_text();m=re.search(r'<meta name="twitter:description" content="([^"]*)"',page)
  s['creatorDescriptionFromSavedPage']=html.unescape(m.group(1)) if m else None
  s['decodedMono48kDurationSeconds']=len(decoded[s['id']])/RATE
 manifest={'schema':'curio-courier-recorded-sfx-package-v1','scope':'Additive portable candidate package; no original library files changed','createdDate':'2026-11-01','sourceRecordingCount':len(sources),'assetCount':len(entries),'groups':sorted(set(e['group'] for e in entries)),'sourceKindImportant':'All original downloads are official public HQ MP3 previews, not native WAV masters. PCM conversion does not restore lost information.','sources':sources,'entries':entries,'pathPolicy':{'packageFile':'relative to this package','path':'proposed repository path after explicit integration','staticFilePath':'relative to public root for Remotion staticFile','integration':'Copy only assets/*.wav to public/audio/sfx/courier; preserve SOURCES_RU.md, sources/, originals/, scripts, and manifest under assets/sfx/courier; entries shape is additive to main catalog entries. Do not blindly overwrite catalog.json.'},'audition':{'wav':'audition.wav','wavSha256':sha(ROOT/'audition.wav'),'mp3':'audition.mp3','mp3Sha256':sha(ROOT/'audition.mp3'),'durationSeconds':cursor,'index':'AUDITION_RU.md','segments':audition,'additionalGain':1.0,'note':'PCM cuts joined without overlap or pitch change; 0.65s gaps / 1.25s between groups, 0.75s head/tail. No voice/music. MP3 is listening derivative.'},'review':{'listeningObserved':False,'ownerSoundAcceptance':'pending','technicalVerification':'analysis/verification.json after verify_package.py','semanticFit':'Based on primary creator descriptions and waveform boundaries; owner listening and final-film sync/mix pending.','sourceDiversity':'13 distinct source downloads by 12 author accounts; only the 3 footwear source recordings provide 2 cuts each. Same-take cuts explicitly linked; never counted as separate source recordings.'}}
 (ROOT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 lines=['# Подборка для прослушивания','',f'Длительность {cursor:.3f} с. В WAV и MP3 одинаковый порядок; у MP3 возможна задержка кодека. Никаких речи, музыки или дополнительного усиления. Цифры ниже — начало/конец в WAV.','', '| № | Время, с | Файл / действие | Исходная запись |','| --- | --- | --- | --- |']
 for a in audition: lines.append(f"| {a['index']} | {a['startSeconds']:.3f}–{a['endSeconds']:.3f} | {a['id']} — {a['labelRu']} | {a['sourceId']} |")
 lines+=['','Модель не прослушивала эту подборку: в текущем режиме слуховой вход недоступен. Проверены байты, границы, уровень и происхождение; натуральность, шумы и пригодность фоли оценивает владелец.']
 (ROOT/'AUDITION_RU.md').write_text('\n'.join(lines)+'\n')
 print(json.dumps({'assets':len(entries),'sources':len(sources),'wavAssetBytes':sum(e['bytes'] for e in entries),'auditionSeconds':cursor,'peakRangeDbFS':[min(e['samplePeakDbFS'] for e in entries),max(e['samplePeakDbFS'] for e in entries)]},ensure_ascii=False))
