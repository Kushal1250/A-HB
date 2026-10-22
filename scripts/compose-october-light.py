"""Reproducible original instrumental for this birthday gift; no sampled recordings."""
from pathlib import Path
import math, wave
import numpy as np
sr=22050; beat=60/72; bars=28; seconds=bars*4*beat+5
song=np.zeros(int(seconds*sr),dtype=np.float64)
def hz(m):return 440*2**((m-69)/12)
def note(m,start,length=2.8,gain=.15,bell=False):
 n=int(length*sr);t=np.arange(n)/sr;f=hz(m)
 env=(1-np.exp(-t*45))*np.exp(-t*(2.5 if bell else 1.6))
 sound=(np.sin(2*np.pi*f*t)+.30*np.sin(2*np.pi*f*2.002*t)*np.exp(-t*2)+.10*np.sin(2*np.pi*f*3*t)*np.exp(-t*3))
 if bell:sound+=.12*np.sin(2*np.pi*f*4.01*t)*np.exp(-t*5)
 signal=sound*env*gain
 for delay,level in [(0,1),(.23,.18),(.47,.10),(.71,.055)]:
  a=int((start+delay)*sr);b=min(len(song),a+n)
  if a<len(song):song[a:b]+=signal[:b-a]*level
chords=[(52,59,64),(48,55,60),(55,59,62),(50,57,62)]
melodies=[[76,71,74,79,76,67],[74,72,71,67,72,76],[79,74,71,74,76,79],[78,74,69,71,74,71], [76,79,83,81,79,76],[72,76,79,76,74,72],[71,74,79,83,79,74],[69,74,78,76,74,71]]
for bar in range(bars):
 base=bar*4*beat; chord=chords[bar%4]
 for i in range(8):note(chord[i%3],base+i*.5*beat,length=3.2,gain=.045)
 if bar>1:
  pattern=melodies[(bar-2)%len(melodies)]
  for j,(offset,m) in enumerate(zip([0,.75,1.5,2,2.75,3.5],pattern)):
   note(m,base+offset*beat,length=3.1,gain=.09 if j%3==0 else .065,bell=True)
 if bar%4==0:note(chord[0]-12,base,length=4.2,gain=.055)
# Very quiet original wind-like texture, synthesized from deterministic filtered noise.
rng=np.random.default_rng(24102026);noise=rng.normal(0,1,len(song));smooth=np.convolve(noise,np.ones(450)/450,mode='same');song+=smooth*.022
song*=np.minimum(np.arange(len(song))/(sr*3),1)*np.minimum(np.arange(len(song))[::-1]/(sr*4),1)
peak=float(np.max(np.abs(song)));song*=.72/max(peak,1e-8)
out=Path(__file__).resolve().parents[1]/'shared/assets/october-light.wav'
with wave.open(str(out),'wb') as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((song*32767).astype('<i2').tobytes())
print(f'October Light: {len(song)/sr:.1f}s, mono PCM, peak {np.max(np.abs(song)):.2f}, {out.stat().st_size} bytes')
