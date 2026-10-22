import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
const preferenceKey='october-garden-sound-v1';
function preferences(volume) {try{const v=JSON.parse(localStorage.getItem(preferenceKey));const hasVolume=typeof v?.volume==='number'&&Number.isFinite(v.volume);return {silent:false,muted:false,hasVolume,volume:hasVolume?Math.max(0,Math.min(1,v.volume)):volume};}catch{return {silent:false,muted:false,volume,hasVolume:false};}}

export default forwardRef(function JourneyMusic({chapters,active,autoplay,defaultVolume,onMusicPlay},ref){
  const initial=useRef(preferences(defaultVolume));
  const [volume,setVolume]=useState(initial.current.volume),[muted,setMuted]=useState(initial.current.muted);
  const [playing,setPlaying]=useState(false),[error,setError]=useState(''),[expanded,setExpanded]=useState(false);
  const audio=useRef(null),silent=useRef(initial.current.silent),wantPlay=useRef(autoplay&&!initial.current.silent&&!initial.current.muted);
  const generation=useRef(0),pending=useRef(null),isPlaying=useRef(false),blocked=useRef(false),explicitChoice=useRef(false),volumeChosen=useRef(initial.current.hasVolume);
  const latest=useRef({});
  const track=chapters.find(c=>c.id===active)?.track;
  const save=()=>{try{localStorage.setItem(preferenceKey,JSON.stringify({volume:audio.current?.volume??volume}));}catch{}};
  const start=async(explicit=false)=>{
    const a=audio.current;if(!a?.getAttribute('src'))return;
    if(explicit){explicitChoice.current=true;silent.current=false;wantPlay.current=true;a.muted=false;setMuted(false);save();}
    if(!wantPlay.current||silent.current||pending.current!==null||isPlaying.current)return;
    const token=++generation.current;pending.current=token;
    try{await a.play();if(token!==generation.current)return;if(!wantPlay.current){a.pause();return;}blocked.current=false;setError('');}
    catch(e){if(token!==generation.current)return;setPlaying(false);if(e?.name==='NotAllowedError'||e?.name==='AbortError')blocked.current=true;else setError('This music file could not play. You can choose another track in the studio.');}
    finally{if(pending.current===token)pending.current=null;}
  };
  const pause=(explicit=false)=>{generation.current++;pending.current=null;wantPlay.current=false;blocked.current=false;isPlaying.current=false;audio.current?.pause();setPlaying(false);if(explicit){explicitChoice.current=true;silent.current=true;save();}};
  const gesture=()=>{if(blocked.current&&wantPlay.current&&!silent.current)start(false);};
  latest.current={gesture};
  useImperativeHandle(ref,()=>({enter:()=>{if(!silent.current&&!audio.current?.muted){wantPlay.current=true;start(false);}},gesture,pauseForVideo:()=>pause(false)}));
  // Retry inside the actual trusted event, without another prompt or play button.
  useEffect(()=>{const retry=()=>latest.current.gesture();const events=['pointerdown','pointerup','click','touchend','keydown'];events.forEach(name=>document.addEventListener(name,retry,true));return()=>events.forEach(name=>document.removeEventListener(name,retry,true));},[]);
  useEffect(()=>{if(!volumeChosen.current){setVolume(defaultVolume);if(audio.current)audio.current.volume=defaultVolume;}},[defaultVolume]);
  useEffect(()=>{if(!explicitChoice.current&&!silent.current&&!initial.current.muted){wantPlay.current=autoplay;if(!autoplay)pause(false);}},[autoplay]);
  useEffect(()=>{
    const a=audio.current;generation.current++;pending.current=null;blocked.current=false;isPlaying.current=false;setPlaying(false);setError('');
    if(!a)return;
    a.volume=volumeChosen.current?volume:defaultVolume;a.muted=muted;
    if(track?.src&&wantPlay.current)start(false);
    return()=>{generation.current++;pending.current=null;a.pause();};
  },[track?.src]);
  useEffect(()=>()=>{generation.current++;audio.current?.pause();},[]);
  return <div className="j-sound j-sound-compact" aria-label="Garden soundtrack">
    <audio ref={audio} src={track?.src||undefined} loop preload="auto" onPlay={()=>{isPlaying.current=true;setPlaying(true);onMusicPlay?.();}} onPause={()=>{isPlaying.current=false;setPlaying(false);}} onError={()=>{setPlaying(false);blocked.current=false;setError('This music file is unavailable. The garden remains open.');}} />
    <button className="j-sound-toggle" aria-label="Sound settings" aria-expanded={expanded} onClick={()=>setExpanded(v=>!v)}>♫</button>
    {expanded&&<div className="j-sound-panel"><div className="j-sound-buttons">
      <button aria-pressed={muted} onClick={()=>{const next=!muted;explicitChoice.current=true;setMuted(next);if(audio.current)audio.current.muted=next;silent.current=next;wantPlay.current=!next;blocked.current=false;save();if(!next)start(false);}}>{muted?'Unmute':'Mute'}</button>
      <label>Volume<input aria-label="Music volume" type="range" min="0" max="1" step="0.01" value={volume} onChange={e=>{volumeChosen.current=true;const v=Number(e.target.value);setVolume(v);if(audio.current)audio.current.volume=v;save();}}/></label>
    </div>{error&&<p role="status">{error}</p>}</div>}
  </div>;
});
