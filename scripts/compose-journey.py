"""Nine original deterministic chapter instrumentals. No samples or fetched recordings.
Authoring utility only: Python + NumPy + ffmpeg. Normal startup does not need them.
"""
from pathlib import Path
import json, math, subprocess, wave
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'shared/assets/journey';out.mkdir(parents=True,exist_ok=True)
names=['The Sealed Invitation','Through the Garden Gate','Stillness in the Courtyard','Seeds of Courage','The Lantern Walk','Stories Yet to Happen','October Birthday Waltz','Words Worth Keeping','Something Still to Bloom']
sr=22050; media=[]
for ix,title in enumerate(names):
 bpm=[68,76,60,80,64,72,90,66,70][ix];beat=60/bpm;secs=16*beat+3
 song=np.zeros(int(secs*sr));rootnote=[60,62,57,65,55,64,67,59,60][ix]
 chords=[[0,4,7],[5,9,12],[2,5,9],[7,11,14]]
 def note(m,start,duration,gain,tone):
  t=np.arange(int(sr*duration))/sr;freq=440*2**((m-69)/12)
  env=(1-np.exp(-t*(30+ix*4)))*np.exp(-t*(1.1+tone*.5))
  signal=(np.sin(2*np.pi*freq*t)+(.12+ix*.018)*np.sin(2*np.pi*freq*2*t)+.08*np.sin(2*np.pi*freq*3.001*t))*env*gain
  for delay,level in [(0,1),(.19,.15),(.43,.07)]:
   a=int((start+delay)*sr);b=min(len(song),a+len(signal))
   if b>a:song[a:b]+=signal[:b-a]*level
 for bar in range(4):
  chord=chords[(bar+ix)%4];start=bar*4*beat
  for j in range(8): note(rootnote-12+chord[(j+ix)%3],start+j*beat/2,2.4,.055,0)
  melody=[0,4,7,12,9,7,4,2]
  for j in range(4): note(rootnote+12+melody[(j+bar+ix*2)%8],start+j*beat+(.15*beat if ix%2 else 0),2.1,.09,1)
  note(rootnote-24+chord[0],start,3,.06,0)
 fade=np.minimum(np.arange(len(song))/(sr*.8),1)*np.minimum(np.arange(len(song))[::-1]/(sr*1.2),1)
 song*=fade;song*=.65/max(abs(song).max(),.0001)
 ident='24102026'+str(ix+1).zfill(16);wav=out/f'{ident}.wav';mp3=out/f'{ident}.mp3'
 with wave.open(str(wav),'wb') as w:
  w.setnchannels(1);w.setsampwidth(2);w.setframerate(sr);w.writeframes((song*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','80k',str(mp3)],check=True)
 if mp3.stat().st_size<1000:raise RuntimeError('Incomplete encoded soundtrack: '+str(mp3))
 subprocess.run(['ffprobe','-v','error','-show_entries','format=duration',str(mp3)],check=True,stdout=subprocess.DEVNULL)
 wav.unlink()
 media.append(dict(id=ident,kind='audio',filename=mp3.name,thumbnailName=None,mime='audio/mpeg',originalName=title+' — original chapter instrumental',title=title,duration=round(secs,2),createdAt='2026-10-18T11:00:00.000Z'))
(out/'manifest.json').write_text(json.dumps(media,indent=2)+'\n')
print('Composed nine distinct original instrumentals:',sum((out/m['filename']).stat().st_size for m in media),'bytes')
