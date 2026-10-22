import PersonName, {NameText} from './PersonName';
import {useEffect,useRef,useState} from 'react';
import {normaliseBlessings,blessingWishes} from '../../shared/blessings.js';
import {withStepDefaults} from '../../shared/journey.js';
import {SacredPhoto,Flower} from './DivineBlessings';
import {A,KeyArt} from './JourneyArt';
import Modal from './Modal';

export default function BlessingsSequence({value,content:c,quiet,motion,seen,onSeen,onWish,chosenWish,onVideoPlay}) {
  const b=normaliseBlessings(value);
  const ordered=b.photos.map(withStepDefaults).filter(p=>p.visible);
  const featured=ordered.find(p=>p.id===b.featuredId);
  const photos=featured?[featured,...ordered.filter(p=>p.id!==featured.id)]:ordered;
  const [selected,setSelected]=useState(()=>photos.find(p=>!seen.includes(p.id))?.id||photos[0]?.id);
  const [lit,setLit]=useState(false),[flowers,setFlowers]=useState(0),[prayer,setPrayer]=useState(false),[gratitude,setGratitude]=useState(false);
  const [videoOpen,setVideoOpen]=useState(false),[videoError,setVideoError]=useState(false),[full,setFull]=useState(false),[final,setFinal]=useState(false);
  const video=useRef(null);const index=Math.max(0,photos.findIndex(p=>p.id===selected));const photo=photos[index];
  const revealed=quiet||!motion||photo&&seen.includes(photo.id);
  const personal=text=>(text||'').replaceAll('{shortName}',c.shortName).replaceAll('{name}',c.name).replaceAll('{sender}',c.sender);
  useEffect(()=>{const el=video.current;return()=>el?.pause();},[videoOpen]);
  useEffect(()=>{if(photo&&(quiet||!motion)&&!seen.includes(photo.id))onSeen(photo.id);},[photo?.id,quiet,motion]);
  function select(id){setSelected(id);setFull(false);setFinal(false);}
  function reveal(){if(photo)onSeen(photo.id);}
  function navigate(delta){const target=photos[index+delta];if(target)select(target.id);}
  return <div className="j-blessings" data-revealed={!!revealed}>
    <div className="j-blessing-intro"><p className="eyebrow">THE COURTYARD OF QUIET BLESSINGS</p><h2>{b.title}</h2><p><NameText names={[c.name,c.shortName,c.sender]}>{personal(b.intro)}</NameText></p></div>
    {photo?<>
      <div className="j-blessing-step" key={photo.id}>
        <div className={`j-sacred-frame ${lit?'is-warm':''}`}>
          <svg viewBox="0 0 500 650" preserveAspectRatio="none" className="j-arch-line" aria-hidden="true"><path data-anim="arch-draw" d="M12 638V240Q12 12 250 12Q488 12 488 240V638" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="900"/></svg>
              {revealed&&motion&&!quiet&&photo.reveal==='garland'&&<svg viewBox="0 0 500 85" className="j-garland"><path data-anim="garland-set" d="M0 5Q120 120 250 35Q380 120 500 5"/></svg>}
          <div className="j-sacred-photo">
            {revealed?<SacredPhoto photo={photo}/>:<div className="j-closed-door"><LockIllustration/><p>One quiet wish.<br/>One photograph, waiting for you.</p><button className="primary" onClick={reveal}>Reveal this blessing</button></div>}
            {revealed&&motion&&!quiet&&<div className={`j-reveal-layer reveal-${photo.reveal}`} aria-hidden="true">
              {photo.reveal==='curtains'&&<><A as="i" name="curtain-part" className="j-curtain left"/><A as="i" name="curtain-part" className="j-curtain right"/></>}
              {photo.reveal==='trace'&&<svg viewBox="0 0 500 650" preserveAspectRatio="none"><rect data-anim="frame-trace" x="8" y="8" width="484" height="634" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="1400"/></svg>}
              {photo.reveal==='doors'&&<><A as="i" name="door-swing" className="j-door left"/><A as="i" name="door-swing" className="j-door right"/></>}
              {photo.reveal==='page'&&<A as="i" name="page-turn" className="j-reveal-page"/>}
              {photo.reveal==='flower'&&<A name="petals-settle" className="j-frame-flower"><Flower index={0}/></A>}
              {photo.reveal==='lamp'&&<A name="lamp-halo" className="j-frame-halo"/>}
              {photo.reveal==='ribbon'&&<A as="i" name="ribbon-untie" className="j-dev-ribbon"/>}
              {photo.reveal==='hanging'&&<A as="i" name="hanging-frame" className="j-hanging-ornament"/>}
              {photo.reveal==='window'&&<A as="i" name="window-fold" className="j-window-cover"/>}
              {photo.reveal==='envelope'&&<A as="i" name="prayer-flap" className="j-dev-envelope"/>}
              {photo.reveal==='finalcard'&&<A name="card-part" className="j-dev-final-card">A final birthday prayer</A>}
              {photo.reveal==='arch'&&<svg viewBox="0 0 500 650"><path data-anim="arch-draw" d="M5 640V250Q5 5 250 5T495 250V640" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="900"/></svg>}
            </div>}
          </div>
          {revealed&&<button className="j-photo-full" onClick={()=>setFull(true)}>View the full photograph</button>}
          {flowers>0&&<div className="j-flower-ledge" aria-hidden="true">{Array.from({length:flowers},(_,i)=><A name="flower-place" key={i}><Flower index={i}/></A>)}<A as="span" name="petals-settle" key={`petals-${flowers}`} className="j-settled-petals">· · · · ·</A></div>}
        </div>
        <div className="j-blessing-copy"><p className="eyebrow">BLESSING {index+1} / {photos.length} · {photo.theme}</p><h3>{photo.title}</h3><p>{photo.caption}</p>
          {revealed?<A name="blessing-unfold" className="j-image-blessing"><p><NameText names={[c.name,c.shortName,c.sender]}>{personal(photo.blessing)}</NameText></p><KeyArt index={2} data-anim="blessing-key" strokeDasharray="300"/></A>:<p className="j-soft-note">Open this door when you are ready. You can also read without the reveal animation.</p>}
          {!revealed&&<button className="text-button" onClick={reveal}>Open directly — no ritual required</button>}
          <div className="j-step-navigation"><button disabled={index===0} onClick={()=>navigate(-1)}>Previous blessing</button>{index<photos.length-1?<A name={revealed?'next-door':undefined}><button onClick={()=>navigate(1)}>Continue to the next blessing →</button></A>:<button onClick={()=>setFinal(true)}>Read the final prayer</button>}</div>
          {revealed&&!quiet&&<div className="j-devotional-actions">
            {b.interactions.lamp&&<><div className="j-symbolic-lamp" aria-hidden="true">{lit&&<><A as="span" name="lamp-halo" className="j-lamp-glow"/><A name="lamp-ignite"><A as="i" name="lamp-flicker" className="j-lamp-flame"/></A></>}<span className="j-lamp-bowl"/></div><button aria-pressed={lit} onClick={()=>setLit(v=>!v)}>{lit?'Extinguish the symbolic lamp':'Light a Birthday Prayer'}</button></>}
            {b.interactions.flowers&&<button onClick={()=>setFlowers(v=>Math.min(v+1,8))} disabled={flowers>=8}>{flowers>=8?'Flowers placed with care':'Offer a Flower'}</button>}
            <p role="status">{lit?'A small, symbolic light for clarity, kindness, and peace.':flowers?'A flower, placed with a kind thought for you.':''}</p>
          </div>}
        </div>
      </div>
      {seen.length>0&&<details className="j-return-blessings"><summary>Return to a revealed blessing</summary><div>{photos.filter(p=>seen.includes(p.id)).map(p=><button key={p.id} onClick={()=>select(p.id)}>{p.theme}: {p.title}</button>)}</div></details>}
    </>:<p>Add devotional photographs in the studio to begin this quiet journey.</p>}
    {!quiet&&<div className="j-blessing-extras">
      <div><button aria-expanded={prayer} onClick={()=>setPrayer(v=>!v)}>Open a birthday prayer from <PersonName>{c.sender}</PersonName></button>{prayer&&<A name="prayer-flap" className="j-prayer-envelope"><p><NameText names={[c.name,c.shortName,c.sender]}>{personal(b.prayer)}</NameText></p><p className="j-handwritten"><PersonName>{c.sender}</PersonName></p></A>}</div>
      {b.interactions.wishes&&<div><h3>A wish to carry with you</h3><div className="j-choice-wishes">{blessingWishes.map(([title,text])=><button key={title} aria-pressed={chosenWish===text} onClick={()=>onWish(text)}>{title}</button>)}</div>{chosenWish&&<A name="wish-keep" key={chosenWish}><p>{chosenWish}</p></A>}</div>}
      {b.interactions.gratitude&&<div><button aria-expanded={gratitude} onClick={()=>setGratitude(v=>!v)}>A Moment of Gratitude</button>{gratitude&&<p>Think of one ordinary moment that made life feel a little brighter. Let that be enough for now.</p>}</div>}
    </div>}
    {b.video?.src&&<div className="j-video-alcove"><h3>{b.videoTitle}</h3><p>{b.videoDescription}</p><button aria-expanded={videoOpen} onClick={()=>{video.current?.pause();setVideoOpen(v=>!v);}}>{videoOpen?'Close this quiet moment':'Open this quiet moment'}</button>{videoOpen&&<A name="video-open">{videoError?<p role="status">This video could not play. You can continue with the photographs.</p>:<video ref={video} controls playsInline preload="none" poster={b.video.thumbnail||undefined} onPlay={onVideoPlay} onError={()=>setVideoError(true)} aria-label={b.videoTitle}><source src={b.video.src} type="video/mp4"/></video>}<p className="j-soft-note">Play when you are ready. Background music pauses for the video.</p></A>}</div>}
    {(final||quiet||photo&&index===photos.length-1&&revealed)&&<A name="prayer-card" className="j-closing-prayer"><p><NameText names={[c.name,c.shortName,c.sender]}>{personal(b.closing)}</NameText></p></A>}
    <button className="text-button" onClick={()=>setFinal(true)}>Skip to the final prayer</button>
    {full&&photo&&<Modal title="A quiet devotional view" wide onClose={()=>setFull(false)}><div className="dev-lightbox-photo"><SacredPhoto photo={photo}/></div><h3>{photo.title}</h3><p><NameText names={[c.name,c.shortName,c.sender]}>{personal(photo.blessing)}</NameText></p></Modal>}
  </div>;
}
function LockIllustration(){return <svg width="100" height="135" viewBox="0 0 100 135" aria-hidden="true"><path d="M10 130V55Q10 5 50 5T90 55V130" fill="none" stroke="currentColor"/><circle cx="50" cy="75" r="7" fill="none" stroke="currentColor"/><path d="M50 82v17" stroke="currentColor"/></svg>;}
