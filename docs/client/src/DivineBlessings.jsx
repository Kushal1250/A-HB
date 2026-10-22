import {NameText} from './PersonName';
import { useEffect, useId, useRef, useState } from 'react';
import Modal from './Modal';
import { normaliseBlessings, blessingWishes } from '../../shared/blessings.js';
import './blessings.css';

export function SacredPhoto({ photo, thumbnail = false }) {
  const [status, setStatus] = useState('loading');
  const src = thumbnail ? photo.thumbnail || photo.src : photo.src;
  useEffect(() => setStatus('loading'), [src]);
  if (!src || status === 'error') return <div className="dev-photo-error" role="status">This photograph is temporarily unavailable. Please try another view.</div>;
  return <>
    {!thumbnail && status === 'loading' && <span className="dev-loading" role="status">Preparing this quiet moment…</span>}
    <img src={src} alt={thumbnail ? '' : photo.alt} width={photo.width || 900} height={photo.height || 1200}
      loading={thumbnail ? 'lazy' : 'eager'} decoding="async" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} />
  </>;
}

export function Lamp({ lit }) {
  return <svg className={`dev-lamp ${lit ? 'is-lit' : ''}`} viewBox="0 0 150 150" aria-hidden="true">
    <ellipse className="lamp-halo" cx="75" cy="60" rx="60" ry="60" />
    <path className="lamp-flame" d="M75 22C89 45 94 51 91 63C88 78 64 80 61 64C58 50 70 43 75 22Z" />
    <path d="M37 86Q75 104 113 86Q105 121 75 122Q45 121 37 86Z" fill="#927244" stroke="#C3A56A" strokeWidth="2" />
    <ellipse cx="75" cy="86" rx="39" ry="9" fill="#D5BD85" />
    <path d="M75 86V72" stroke="#563D2B" strokeWidth="3" /><path d="M63 123L57 132H93L87 123" fill="#927244" />
  </svg>;
}
export function Flower({ index }) {
  return <svg viewBox="0 0 60 60" className="dev-flower" style={{'--flower-turn': `${index * 29}deg`}} aria-hidden="true">
    {[0,60,120,180,240,300].map(a => <ellipse key={a} cx="30" cy="17" rx="8" ry="13" fill={index % 2 ? '#D9BB83' : '#D0C3A3'} transform={`rotate(${a} 30 30)`} />)}
    <circle cx="30" cy="30" r="8" fill="#8D6B3D" />
  </svg>;
}

export default function DivineBlessings({ value, name, fullName = name, sender, motion, onContinue, onVideoPlay }) {
  const b = normaliseBlessings(value);
  const photos = b.photos.filter(p => p.visible);
  const [selected, setSelected] = useState(() => b.featuredId || photos[0]?.id);
  const [opened, setOpened] = useState(!motion);
  const [lit, setLit] = useState(false), [flowers, setFlowers] = useState(0);
  const [wish, setWish] = useState(0), [grateful, setGrateful] = useState(false);
  const [lightbox, setLightbox] = useState(false), [videoError, setVideoError] = useState(false);
  const touch = useRef(null), revealRef = useRef(null), videoRef = useRef(null);
  const uid = useId();
  const actualIndex = Math.max(0, photos.findIndex(p => p.id === selected));
  const photo = photos[actualIndex];
  const personalise = text => (text || '').replaceAll('{shortName}', name).replaceAll('{name}', fullName).replaceAll('{sender}', sender);
  const navigate = delta => { if (photos.length) setSelected(photos[(actualIndex + delta + photos.length) % photos.length].id); };
  useEffect(() => { if (!motion) setOpened(true); }, [motion]);
  useEffect(() => () => videoRef.current?.pause(), []);
  function keys(event) {
    if (event.target.closest?.('input,textarea,select,video')) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); navigate(event.key === 'ArrowRight' ? 1 : -1);
    }
  }
  if (!b.enabled) return null;
  return <section className={`devotional garden-section ${lit ? 'prayer-lit' : ''}`} data-scene="blessings" aria-labelledby={`${uid}-heading`}>
    <div className="chapter-marker"><span>A QUIET BEGINNING / FOR {name.toUpperCase()}</span><i /></div>
    <div className="dev-heading">
      <div><p className="eyebrow">THE BLESSINGS COURTYARD</p><h2 id={`${uid}-heading`}>{b.title}</h2></div>
      <p><NameText names={[name,fullName,sender]}>{personalise(b.intro)}</NameText></p>
    </div>
    {!opened && <div className="dev-invitation">
      <span className="dev-invitation-line" aria-hidden="true" />
      <p>A little stillness before the celebration.</p>
      <button className="primary" onClick={() => { setOpened(true); requestAnimationFrame(() => revealRef.current?.focus()); }}>Open the Blessings Garden <span aria-hidden="true">↗</span></button>
      <button className="text-button" onClick={onContinue}>Continue to the birthday garden</button>
    </div>}
    <div className={`dev-courtyard ${opened ? 'is-open' : 'is-closed'}`} hidden={!opened}>
      <div className="dev-gallery" onKeyDown={keys}>
        <div className="dev-arch" ref={revealRef} tabIndex="-1" aria-label="Devotional gallery">
          <div className="dev-arch-rule" aria-hidden="true" />
          <div className="dev-main-photo" onTouchStart={e => {touch.current = e.touches[0]?.clientX;}} onTouchEnd={e => {const x=e.changedTouches[0]?.clientX; if(touch.current !== null && Math.abs(x-touch.current)>60) navigate(x < touch.current ? 1 : -1); touch.current=null;}}>
            {photo ? <SacredPhoto key={photo.id} photo={photo} /> : <div className="dev-photo-error">A quiet space for your devotional photographs. Add them in the studio.</div>}
          </div>
          {photo && <button className="dev-expand" onClick={() => setLightbox(true)} aria-label="Open photograph in full view">Full view <span aria-hidden="true">⤢</span></button>}
          <div className="dev-offerings" aria-hidden="true">{Array.from({length: flowers}, (_,i)=><Flower key={i} index={i} />)}</div>
        </div>
        {photo && <>
          <div className="dev-gallery-caption" aria-live="polite"><div><h3>{photo.title}</h3><p>{photo.caption}</p></div><span>{actualIndex + 1} / {photos.length}</span></div>
          <div className="dev-gallery-controls"><button onClick={() => navigate(-1)} disabled={photos.length<2} aria-label="Previous devotional photograph">← Previous</button><span>Take your time with each view.</span><button onClick={() => navigate(1)} disabled={photos.length<2} aria-label="Next devotional photograph">Next →</button></div>
          <div className="dev-thumbnails" aria-label="Choose a devotional photograph">{photos.map((p,i) => <button key={p.id} aria-label={`View ${i+1}: ${p.title}`} aria-pressed={p.id===photo.id} onClick={() => setSelected(p.id)}><SacredPhoto photo={p} thumbnail /></button>)}</div>
        </>}
      </div>
      <aside className="dev-prayer">
        <p className="eyebrow">A PRAYER FOR YOUR NEW YEAR</p>
        <h3>May good things<br /><em>find their way to you.</em></h3>
        <p className="dev-prayer-text"><NameText names={[name,fullName,sender]}>{personalise(b.prayer)}</NameText></p>
        <div className="dev-signature">with warm wishes,<strong>{sender}</strong></div>
        {(b.interactions.lamp || b.interactions.flowers) && <div className="dev-ritual">
          {b.interactions.lamp && <><Lamp lit={lit} /><button className="dev-lamp-button" aria-pressed={lit} onClick={() => setLit(v=>!v)}>{lit ? 'Extinguish the symbolic lamp' : 'Light a Birthday Prayer'}</button></>}
          {b.interactions.flowers && <button onClick={()=>setFlowers(v=>Math.min(v+1,8))} disabled={flowers>=8}>{flowers>=8 ? 'Flowers placed with care' : 'Offer a Flower'}</button>}
          <p className="dev-ritual-message" role="status">{lit ? 'May your days be guided by clarity, your heart strengthened by kindness, and your year brightened by moments of peace.' : flowers ? 'A small flower, placed with a kind thought for you.' : 'Small, symbolic gestures of care.'}</p>
        </div>}
        {b.interactions.wishes && <div className="dev-wishes"><h4>A wish to carry with you</h4><div className="dev-wish-buttons" aria-label="Birthday blessings">{blessingWishes.map(([label],i)=><button key={label} aria-pressed={wish===i} onClick={()=>setWish(i)}>{label}</button>)}</div><p className="dev-selected-wish" aria-live="polite">{blessingWishes[wish][1]}</p></div>}
        {b.interactions.gratitude && <div className="dev-gratitude"><button className="text-button" aria-expanded={grateful} aria-controls={`${uid}-gratitude`} onClick={()=>setGrateful(v=>!v)}>A Moment of Gratitude {grateful?'−':'+'}</button><p id={`${uid}-gratitude`} hidden={!grateful}>Think of one person, one small kindness, or one ordinary moment that made life feel a little brighter. Let that be enough for now.</p></div>}
      </aside>
    </div>
    {opened && b.video?.src && <div className="dev-video-section">
      <div><p className="eyebrow">PAUSE HERE, IF YOU LIKE</p><h3>{b.videoTitle}</h3><p>{b.videoDescription}</p><p className="dev-video-note">Press play when you are ready. Music pauses while the video plays.</p></div>
      <div>{videoError ? <p role="status">This video is temporarily unavailable. You can still enjoy the photographs above.</p> : <video ref={videoRef} controls playsInline preload="none" poster={b.video.thumbnail || photo?.src || undefined} aria-label={b.videoTitle} onPlay={onVideoPlay} onError={()=>setVideoError(true)}><source src={b.video.src} type="video/mp4" /></video>}</div>
    </div>}
    <div className="dev-closing"><p><NameText names={[name,fullName,sender]}>{personalise(b.closing)}</NameText></p><button className="primary" onClick={()=>{videoRef.current?.pause();onContinue();}}>Continue to the birthday garden <span aria-hidden="true">↗</span></button></div>
    {lightbox && photo && <Modal title="Devotional photograph" wide onKeyDown={keys} onClose={()=>setLightbox(false)}>
      <div className="dev-lightbox"><div className="dev-lightbox-photo"><SacredPhoto key={photo.id} photo={photo} /></div><h3>{photo.title}</h3><p>{photo.caption}</p><div className="dev-lightbox-controls"><button onClick={()=>navigate(-1)} disabled={photos.length<2} aria-label="Previous full-view photograph">← Previous</button><span aria-live="polite">{actualIndex+1} / {photos.length}</span><button onClick={()=>navigate(1)} disabled={photos.length<2} aria-label="Next full-view photograph">Next →</button></div></div>
    </Modal>}
  </section>;
}
