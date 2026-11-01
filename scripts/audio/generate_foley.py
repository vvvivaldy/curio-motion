#!/usr/bin/env python3
"""Deterministic offline Foley candidates. Python standard library only.

No recordings, downloaded samples, network services, runtime state or core changes.
Intended for human audition; acoustic/visual fit is not inferred from signal metrics.
"""
from __future__ import annotations
import argparse
from array import array
import hashlib
import io
import json
import math
from pathlib import Path
import platform
import sys
import wave

RATE = 48_000
VERSION = 'original-procedural-foley-v1'

class Noise:
    """Specified uint32 xorshift sequence; independent of random module versions."""
    def __init__(self, seed: int):
        self.state = seed & 0xffffffff
        if not self.state:
            raise ValueError('Nonzero seed required')

    def next(self) -> float:
        x = self.state
        x ^= (x << 13) & 0xffffffff
        x ^= x >> 17
        x ^= (x << 5) & 0xffffffff
        self.state = x & 0xffffffff
        return (self.state / 4294967295.0) * 2 - 1

def white(length: int, seed: int) -> list[float]:
    rng = Noise(seed)
    return [rng.next() for _ in range(length)]

def lowpass(signal: list[float], hz: float) -> list[float]:
    a = 1 - math.exp(-2 * math.pi * hz / RATE)
    state = 0.0
    out = []
    for sample in signal:
        state += a * (sample - state)
        out.append(state)
    return out

def band(signal: list[float], lo: float, hi: float) -> list[float]:
    a, b = lowpass(signal, hi), lowpass(signal, lo)
    return [x-y for x, y in zip(a, b)]

def resonant_band(signal: list[float], center: float, q: float) -> list[float]:
    # Broad, constant-peak bandpass: filtered friction, not a sine oscillator.
    w = 2 * math.pi * center / RATE
    alpha = math.sin(w) / (2*q)
    a0 = 1 + alpha
    b0, b2 = alpha/a0, -alpha/a0
    a1, a2 = -2*math.cos(w)/a0, (1-alpha)/a0
    x1 = x2 = y1 = y2 = 0.0
    out = []
    for x in signal:
        y = b0*x + b2*x2 - a1*y1 - a2*y2
        x2, x1, y2, y1 = x1, x, y1, y
        out.append(y)
    return out

def env(t: float, attack: float, decay: float) -> float:
    if t <= 0:
        return 0.0
    # Smooth attack, then exponential release; no discontinuous waveform cut.
    return -math.expm1(-t/attack) * math.exp(-t/decay)

def grain(t: float, start: float, attack: float, decay: float) -> float:
    return env(t-start, attack, decay)

def finish(signal: list[float], onset: int, tail_seconds: float = .030) -> list[float]:
    # DC/high-pass removal starts with a zero state, preserving exact leading silence.
    low = lowpass(signal, 28)
    signal = [x-y for x, y in zip(signal, low)]
    fade = round(tail_seconds*RATE)
    for i in range(max(onset, len(signal)-fade), len(signal)):
        u = (len(signal)-1-i)/max(1, fade-1)
        signal[i] *= .5-.5*math.cos(math.pi*u)
    signal[:onset] = [0.0]*onset
    signal[-1] = 0.0
    return signal

def step(params: dict) -> list[float]:
    n = round(params['durationSeconds']*RATE)
    onset = params['scheduledOnsetSample']
    variation = params['timbreScale']
    a = white(n, params['seed'])
    b = white(n, params['seed'] ^ 0xa511e9b3)
    c = white(n, params['seed'] ^ 0x63d83595)
    body = band(a, 55, 620*variation)
    contact = band(b, 1250*variation, 5800*variation)
    sole = band(c, 420, 2600*variation)
    out = []
    for i in range(n):
        t = (i-onset)/RATE
        weight = env(t, .0028, .029*params['decayScale'])
        click = env(t, .0013, .0085)
        roll = grain(t, .018, .004, .026)
        x = .72*body[i]*weight + .15*contact[i]*click + .17*sole[i]*roll
        # Weak, short, inharmonic body resonances under the broadband shoe contact.
        for hz, amplitude, decay in [(124,.025,.027), (213,.018,.021), (367,.011,.013)]:
            if t > 0:
                x += amplitude*math.sin(2*math.pi*hz*variation*t)*env(t,.003,decay)
        out.append(params['gain']*x)
    return finish(out, onset)

def seat(params: dict) -> list[float]:
    n = round(params['durationSeconds']*RATE)
    onset = params['scheduledOnsetSample']
    noise = white(n, params['seed'])
    low = band(noise, 45, 540)
    cloth = band(white(n, params['seed'] ^ 0x70c9edbd), 240, 2550)
    out = []
    for i in range(n):
        t = (i-onset)/RATE
        impact = env(t, .009, .061)
        fabric = grain(t,.005,.014,.070) + .28*grain(t,.069,.011,.047)
        x = .66*low[i]*impact + .19*cloth[i]*fabric
        for hz, amp, decay in [(83,.019,.057),(147,.012,.044),(251,.006,.028)]:
            if t > 0:
                x += amp*math.sin(2*math.pi*hz*t)*env(t,.009,decay)
        out.append(params['gain']*x)
    return finish(out, onset, .045)

def chair(params: dict) -> list[float]:
    n = round(params['durationSeconds']*RATE)
    onset = params['scheduledOnsetSample']
    raw = white(n, params['seed'])
    friction = band(raw, 200, 2300)
    bands = [(resonant_band(raw,hz,q),gain) for hz,q,gain in [(385,2.0,.28),(820,1.6,.15),(1370,1.5,.08)]]
    wood = band(white(n,params['seed'] ^ 0x9e3779b9),65,620)
    out = []
    for i in range(n):
        t = (i-onset)/RATE
        # Nonperiodic stick/slip pressure grains. Broad noise is deliberately
        # dominant; no narrow sustained squeaking oscillator is introduced.
        pressure = grain(t,.0,.006,.033) + .62*grain(t,.048,.010,.045) + .40*grain(t,.121,.015,.057) + .16*grain(t,.218,.010,.036)
        x = (.19*friction[i] + sum(signal[i]*gain for signal,gain in bands))*pressure
        x += .28*wood[i]*grain(t,0,.0025,.022)
        x += .13*wood[i]*grain(t,.107,.004,.020)
        out.append(params['gain']*x)
    return finish(out,onset,.060)

SPECS = [
    {'id':'step-hard-01','kind':'step','seed':0x471fa91d,'durationSeconds':.220,'scheduledOnsetSample':288,'timbreScale':1.00,'decayScale':1.00,'gain':1.65},
    {'id':'step-hard-02','kind':'step','seed':0x7195c32b,'durationSeconds':.224,'scheduledOnsetSample':288,'timbreScale':.96,'decayScale':1.04,'gain':1.58},
    {'id':'step-hard-03','kind':'step','seed':0x1bc4e785,'durationSeconds':.216,'scheduledOnsetSample':288,'timbreScale':1.045,'decayScale':.97,'gain':1.61},
    {'id':'seat-soft-01','kind':'seat','seed':0x653ca7d1,'durationSeconds':.400,'scheduledOnsetSample':480,'gain':1.20},
    {'id':'chair-load-01','kind':'chair','seed':0x4d28ea71,'durationSeconds':.460,'scheduledOnsetSample':576,'gain':1.14},
]

def db(value: float) -> float | None:
    return round(20*math.log10(value),6) if value > 0 else None

def encode(spec: dict) -> tuple[bytes, dict, list[int]]:
    signal = {'step':step,'seat':seat,'chair':chair}[spec['kind']](spec)
    if not all(math.isfinite(x) for x in signal):
        raise ValueError('Nonfinite sample')
    if max(abs(x) for x in signal) >= .90:
        raise ValueError('Unexpected headroom loss; refusing to hard clip')
    samples = [round(x*32767) for x in signal]
    pcm = array('h',samples)
    if sys.byteorder != 'little':
        pcm.byteswap()
    stream = io.BytesIO()
    with wave.open(stream,'wb') as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(RATE)
        wav.writeframes(pcm.tobytes())
    data = stream.getvalue()
    nonzero = [i for i,x in enumerate(samples) if x != 0]
    peak_index = max(range(len(samples)), key=lambda i: abs(samples[i]))
    first = nonzero[0]
    rms = math.sqrt(sum((x/32768)**2 for x in samples)/len(samples))
    active_rms = math.sqrt(sum((x/32768)**2 for x in samples[first:])/(len(samples)-first))
    entry = {'id':spec['id'],'file':spec['id']+'.wav','sha256':hashlib.sha256(data).hexdigest(),
             'format':{'container':'WAV','encoding':'PCM signed16 little-endian','sampleRate':RATE,'channels':1,'samples':len(samples)},
             'durationSeconds':len(samples)/RATE,
             'attack':{'definition':'Index0 is the first PCM sample. Scheduled contact onset is exact; firstNonzero is measured AFTER PCM16 quantization. Transient peak is the actual maximum absolute sample, not a claim of perceptual onset.',
                       'scheduledOnsetSample':spec['scheduledOnsetSample'],'scheduledOnsetSeconds':spec['scheduledOnsetSample']/RATE,
                       'firstNonzeroSample':first,'firstNonzeroSeconds':first/RATE,
                       'transientPeakSample':peak_index,'transientPeakSeconds':peak_index/RATE,
                       'suggestedContactAnchorSample':first,'suggestedContactAnchorSeconds':first/RATE,
                       'integrationNote':'Align known onset/attack to visual contact; do not blindly align the beginning of a file. All cues use the SAME48kHz sample grid.'},
             'metrics':{'samplePeakDbFS':db(max(abs(x) for x in samples)/32768),'rmsDbFS':db(rms),'activeRmsDbFS':db(active_rms),
                        'clippedSamples':sum(abs(x)>=32767 for x in samples),'dcMean':sum(samples)/len(samples)/32768,
                        'lastNonzeroSample':nonzero[-1],'trailingExactZeroSamples':len(samples)-1-nonzero[-1]},
             'parameters':spec,'provenance':'originalprocedural: generated from specified seeded noise, analytic envelopes and weak/broad resonances; no imported recordings or samples',
             'audition':{'listened':False,'status':'technical candidate; sound identity/naturalness/style and final gain require actual audition'},
             'optional':spec['kind']=='chair'}
    if spec['kind']=='chair':
        entry['integrationCaution']='Optional pressure/friction candidate. NOT audition-approved as a wooden-chair creak. Omit if it reads as a squeak/electronic rasp or distracts.'
    return data,entry,samples

def main() -> None:
    parser=argparse.ArgumentParser()
    parser.add_argument('--out',type=Path,default=Path(__file__).resolve().parent/'assets')
    parser.add_argument('--verify',action='store_true',help='Regenerate in memory and compare all WAV byte hashes without modifying assets')
    args=parser.parse_args()
    entries=[]
    for spec in SPECS:
        data,entry,_=encode(spec)
        target=args.out/entry['file']
        if args.verify:
            if target.read_bytes()!=data:
                raise SystemExit('Reproduction mismatch: '+str(target))
        else:
            args.out.mkdir(parents=True,exist_ok=True)
            target.write_bytes(data)
        entries.append(entry)
    manifest={'version':VERSION,'generator':'generate_foley.py','generatorSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'dependencies':'Python3 standard library only','python':platform.python_version(),'platform':platform.platform(),
              'reproducibility':'Explicit xorshift32 seeds; no runtime randomness, clocks or network. Byte reproduction verified separately in this environment. Cross-platform libm bit identity is not promised without comparing SHA.',
              'levelPolicy':'Fixed authored gains. No individual normalization, limiter or hard clipping. RMS is unweighted waveform RMS, NOT LUFS. True peak and perceptual loudness are separate checks.',
              'publication':'Local unpublished trial. No external recordings used. No third-party asset license inferred from project code license.',
              'assets':entries}
    if not args.verify:
        (args.out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'mode':'verified-byte-identical' if args.verify else 'generated','directory':str(args.out.resolve()),'assets':[{'id':x['id'],'peakDbFS':x['metrics']['samplePeakDbFS'],'firstNonzeroSample':x['attack']['firstNonzeroSample'],'sha256':x['sha256']}for x in entries]},indent=2))

if __name__=='__main__':
    main()
