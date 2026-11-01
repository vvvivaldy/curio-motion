from pathlib import Path
import hashlib, json, subprocess, wave, os, shutil
import numpy as np

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
FFMPEG = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
if not FFMPEG:
    raise RuntimeError('Set FFMPEG or place existing ffmpeg on PATH')
OUT = ROOT / 'prepared-candidates'
OUT.mkdir(exist_ok=True)
sources = {row['id']: row for row in json.loads((ROOT / 'sources.json').read_text())['sources']}
cuts = [
    ('clock-tick', 'clock', .075, .260, .20, .002, .012),
    ('clock-tock', 'clock', .380, .610, .20, .002, .012),
    ('paw-tile-01', 'barefoot-tile', .990, 1.230, .70, .001, .008),
    ('paw-tile-02', 'barefoot-tile', 1.355, 1.590, .70, .001, .008),
    ('paw-tile-03', 'barefoot-tile', 2.140, 2.400, .70, .001, .008),
    ('frame-impact', 'wood-drop', .080, .365, .45, .001, .010),
    ('frame-bounce', 'wood-drop', .425, .930, .35, .001, .015),
    ('frame-slide', 'frame-scrape', 1.150, 1.650, .90, .010, .025),
    ('cat-hiss', 'cat-hiss', .000, .650, 2.50, .003, .020),
    ('groom-rustle', 'soft-rustle', 4.850, 5.450, 6.00, .015, .035),
]
decoded = {}
rows = []
for name, sid, start, end, gain, fadein, fadeout in cuts:
    source = sources[sid]
    path = REPO / source['sourceFile']
    assert hashlib.sha256(path.read_bytes()).hexdigest() == source['sourceSha256']
    if sid not in decoded:
        raw = subprocess.check_output([FFMPEG, '-v', 'error', '-i', str(path), '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'])
        decoded[sid] = np.frombuffer(raw, dtype='<f4').copy()
    first, last = round(start * 48000), round(end * 48000)
    samples = decoded[sid][first:last].astype(np.float64) * gain
    for duration, reverse in [(fadein, False), (fadeout, True)]:
        count = min(round(duration * 48000), len(samples))
        envelope = .5 - .5 * np.cos(np.linspace(0, np.pi, count))
        if reverse:
            samples[-count:] *= envelope[::-1]
        else:
            samples[:count] *= envelope
    assert np.max(np.abs(samples)) < 1, name
    pcm = np.rint(samples * 32767).astype('<i2')
    target = OUT / f'{name}.wav'
    with wave.open(str(target), 'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(48000)
        wav.writeframes(pcm.tobytes())
    actual = pcm.astype(np.float64) / 32768
    count = 240
    rms = np.sqrt(np.mean(actual[:len(actual)//count*count].reshape(-1, count)**2, axis=1))
    active = np.flatnonzero(rms >= max(float(max(rms)) * .20, .00002))
    anchor = int(active[0]) * .005 if len(active) else 0
    rows.append({
        'id': name, 'file': 'audio/sfx/story/' + target.name, 'sha256': hashlib.sha256(target.read_bytes()).hexdigest(),
        'sourceId': sid, 'sourceSha256': source['sourceSha256'], 'sourcePage': source['page'],
        'author': source['author'], 'license': source['license'], 'licenseUrl': source['licenseUrl'],
        'sourceKind': source['sourceKind'], 'sourceCutSeconds': [start, end], 'sourceCutSamples48k': [first, last],
        'gain': gain, 'cosineFadeSeconds': [fadein, fadeout], 'sampleRate': 48000, 'channels': 1,
        'format': 'PCM16', 'samples': len(pcm), 'durationSeconds': len(pcm)/48000,
        'samplePeakDbFS': float(20*np.log10(max(abs(actual)))),
        'technicalActivityAnchorSeconds': anchor, 'activityAnchorDefinition': 'first 5ms RMS bin >=20% maximum; not a claim of perceived onset',
        'peakSeconds': int(np.argmax(abs(actual)))/48000,
        'pitchOrPlaybackRateModified': False, 'auditioned': False,
    })
catalog = {
    'schema': 'curio-story-audio-candidates-v1', 'sources': list(sources.values()), 'assets': rows,
    'conversion': 'ffmpeg float32 mono 48k decode, slice exact samples, declared gain BEFORE PCM16, cosine edge fades, rint*32767',
    'review': 'Provisional semantic choices based on creator descriptions and technical transients. No listening has been claimed. Match final events and have the owner hear the film.',
    'usageHints': {
        'clock': 'Alternate tick/tock at one declared mechanical phase every half period. Animate same absolute time; do not loop resetting camera. Suitable starting period: 1 second, first crossing .25 sec. Keep ticks quiet.',
        'wallKnock': 'Frame-impact can also provide a much quieter wooden backrest tap, as declared foley reuse.',
        'frameBounce': 'Separate one-shot cut: schedule at actual secondary contact; do not use recorded double impact unless visual contacts match.',
        'paws': 'Recorded barefoot tile cuts are proposed soft-paw foley, not recordings of a real cat; lower level than human footsteps.',
        'groom': 'Fabric handling is proposed foley for grooming, not a literal fur recording.',
    },
}
(OUT / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'assets': len(rows), 'catalog': str((OUT / 'catalog.json').relative_to(REPO)), 'sourceCount': len(sources), 'heard': False}))
