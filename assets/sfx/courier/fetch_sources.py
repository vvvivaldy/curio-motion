"""Fetch declared primary Freesound pages and their own official public HQ previews.
No credentials, API, or certificate-verification bypass. Does not fetch native masters.
"""
from pathlib import Path
import concurrent.futures, hashlib, html, json, re, subprocess

ROOT = Path(__file__).resolve().parent
PLANS = [
 ('wood-sneakers','sturmankin',273374,'wood_10a_startassneakers_walk.wav'),
 ('wood-leather-shoes','Al3x-K',848694,'SFX_Footsteps_Shoes_Normal_01'),
 ('wood-vans','sillygrizzlies',635058,'Walking Footsteps on Wood'),
 ('envelope-slide','MTJohnson',444431,'Sliding Envelope.wav'),
 ('paper-pickup','MTJohnson',444434,'Picking up Dollar.wav'),
 ('page-turn','kevinpro',382230,'Page Flip'),
 ('paper-handling','IENBA',834340,'Tapping and handling paper'),
 ('paper-brush','brokenmachinery',730078,'paper-slide'),
 ('wood-desk-tap','AidanSounds',704935,'Wooden Tap'),
 ('wood-table-tap','zembacraftworks',427393,'Tap on Wooden Table'),
 ('leather-rustle','jfreem3',108533,'LeatherRustle.L.wav'),
 ('cotton-rustle','khenshom',481075,'Foley - Cotton clothes rustling - Fabric movement sound.wav'),
 ('cloth-movement','pushkin',100413,'cloth 01.wav'),
]
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def fetch(url,path):
 r=subprocess.run(['curl','--silent','--show-error','--fail','--location','--max-time','40','--retry','1',url,'--output',str(path)],capture_output=True,text=True)
 if r.returncode:raise RuntimeError(f'{url}: {r.stderr}')
def run(plan):
 sid,author,n,title=plan
 url=f'https://freesound.org/people/{author}/sounds/{n}/'
 page=ROOT/'sources'/f'{sid}.html'
 if not page.exists(): fetch(url,page)
 body=page.read_text()
 assert 'creativecommons.org/publicdomain/zero/1.0/' in body, f'{sid}: CC0 not confirmed'
 previews=re.findall(r'https://cdn\.freesound\.org/previews/[^\s"<>]+-hq\.mp3',body)
 assert previews, f'{sid}: own official HQ preview not found'
 preview=html.unescape(previews[0]); audio=ROOT/'originals'/f'{sid}-official-hq-preview.mp3'
 if not audio.exists(): fetch(preview,audio)
 # Keep a brief exact license observation plus entire page bytes for provenance.
 lines=[l.strip() for l in body.splitlines() if 'creativecommons.org/publicdomain/zero/1.0/' in l]
 note=ROOT/'sources'/f'{sid}-license.txt'
 note.write_text(f'Primary sound page: {url}\nCreator account: {author}\nTitle: {title}\nLicense observed on saved primary page: Creative Commons 0 / CC0-1.0\nCanonical license: https://creativecommons.org/publicdomain/zero/1.0/\nExact primary-page license markup:\n'+ '\n'.join(lines)+'\nNo statement that Curio code MIT relicenses this media.\n')
 return {'id':sid,'author':author,'title':title,'page':url,'officialPreview':preview,'license':'CC0-1.0','licenseUrl':'https://creativecommons.org/publicdomain/zero/1.0/','sourceFile':str(audio.relative_to(ROOT)),'sourceSha256':sha(audio),'sourceBytes':audio.stat().st_size,'pageFile':str(page.relative_to(ROOT)),'pageSha256':sha(page),'licenseEvidenceFile':str(note.relative_to(ROOT)),'licenseEvidenceSha256':sha(note),'sourceKind':'official public HQ MP3 preview, not the original/native lossless master','auditioned':False}

if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex: results=list(ex.map(run,PLANS))
 (ROOT/'sources.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
 # Preserve canonical CC0 legal code as a separate local reference.
 fetch('https://creativecommons.org/publicdomain/zero/1.0/legalcode.en',ROOT/'sources'/'CC0-1.0-legalcode.html')
 print(json.dumps({'sourceRecordings':len(results),'downloadedAudioBytes':sum(x['sourceBytes'] for x in results),'allSourcePagesConfirmCC0':True},ensure_ascii=False))
