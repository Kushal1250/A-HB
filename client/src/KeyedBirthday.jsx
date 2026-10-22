import PersonalApology from "./PersonalApology";
import BirthdayPavilion from './BirthdayPavilion';
import SpecialScreening from './SpecialScreening';
import MemoryVideos from './MemoryVideos';
import {useLayoutEffect,useEffect,useId,useRef,useState} from 'react';
import {normaliseJourney,visibleChapters,newLetter} from '../../shared/journey.js';
import {readProgress,writeProgress,cleanProgress,canUnlock} from './journeyState';
import {A,KeyArt,LockArt} from './JourneyArt';
import {ScratchReveal,ShakeUnlock,PathUnlock} from "./GestureUnlocks";
import JourneyMusic from './JourneyMusic';
import BlessingsSequence from './BlessingsSequence';
import {BotanicalSprig,GreenhouseGate,WishGarden,LeafLetters,FireflyJar,MemoryJar,WishBoat,BirthdayClock} from './GardenWidgets';
import Modal from './Modal';
import './journey.css';
import './journey-animations.css';
import './shirt.css';
const personalise=(text,c)=>(text||'').replaceAll('{name}',c.name).replaceAll('{shortName}',c.shortName).replaceAll('{sender}',c.sender);

function UnlockScene({chapter,index,onUnlock,available,onPrevious,motion,onGesture,settings}) {
  const [phase,setPhase]=useState('waiting'),[pieces,setPieces]=useState(0);const timer=useRef();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function turn(){onGesture();setPhase('turning');timer.current=setTimeout(onUnlock,motion?700:0);}
  if(available&&motion&&phase!=='waiting'&&['scratch','shake','slide','trace','water','ribbon','assemble'].includes(chapter.unlock)) return <div className={`j-lock-scene phase-${phase}`}>
    <p>{chapter.instruction}</p>
    {phase==='turning'?<A name="scratch-erase" className="g-scratch-finish"><p role="status">A little surprise is opening…</p></A>:chapter.unlock==='scratch'?<ScratchReveal threshold={settings.scratchThreshold} onComplete={turn} onGesture={onGesture} motion={motion}/>:chapter.unlock==='shake'?<ShakeUnlock sensitivity={settings.shakeSensitivity} onComplete={turn} onGesture={onGesture} motion={motion}/>:<PathUnlock kind={chapter.unlock} onComplete={turn} onGesture={onGesture} motion={motion}/>}
    <button className="text-button" disabled={phase==='turning'} onClick={()=>{onGesture();onUnlock();}}>Use this key to open</button>
  </div>;
  return <div className={`j-lock-scene kind-${chapter.unlock} phase-${phase}`}>
    <div className="j-lock-art" aria-hidden="true">
      <A name={phase==='selected'?'key-select':phase==='turning'?'key-travel':undefined} className="j-unlock-key"><KeyArt index={index} data-anim={phase==='turning'?'key-turn':undefined}/></A>
      <LockArt open={phase==='turning'}/>
      {chapter.unlock==='seal'&&<A name={phase==='turning'?'seal-break':undefined} className="j-wax">A</A>}
      {chapter.unlock==='ribbon'&&<span className="j-gift-ribbon"/>}
      {phase==='turning'&&chapter.unlock==='water'&&<A name="rain-fall" className="j-unlock-drops">·<br/>·<br/>·</A>}
      {phase==='turning'&&chapter.unlock==='lantern'&&<A name="lantern-light" className="j-unlock-lantern"/>}
      {phase==='turning'&&chapter.unlock==='envelope'&&<A name="prayer-flap" className="j-unlock-envelope"/>}
      {phase==='turning'&&chapter.unlock==='assemble'&&<A name="keys-place" className="j-unlock-placement"><KeyArt index={index}/></A>}
    </div>
    <p>{chapter.instruction}</p>
    {!available&&<p className="j-prerequisite">The previous chapter holds the next key. <button className="text-button" onClick={onPrevious}>Return to the previous chapter</button></p>}
    {available&&phase==='waiting'&&<button data-unlock-action className="primary" onClick={()=>{onGesture();setPhase('selected');}}>Choose the {chapter.key}</button>}
    {available&&phase==='selected'&&<>
      {chapter.unlock==='pattern'&&pieces<3?<div className="j-pattern" aria-label="Arrange three leaves">{[0,1,2].map(i=><button key={i} disabled={i!==pieces} aria-label={`Place leaf ${i+1}`} onClick={()=>setPieces(i+1)}>{i<pieces?'Placed':`Leaf ${i+1}`}</button>)}</div>:<button data-unlock-action className="primary" onClick={turn}>{chapter.label}</button>}
    </>}
    {phase==='turning'&&<p role="status">Your little door is opening…</p>}
    {available&&phase==='selected'&&<button className="text-button" onClick={turn}>Use this key to open</button>}
  </div>;
}


export default function KeyedBirthday({content:c,preview=false,status='',createKeepsake}) {
  const settings=normaliseJourney(c.journey),chapters=visibleChapters(c);
  const photoIds=(c.blessings?.photos||[]).filter(p=>p.visible).map(p=>p.id);
  const signature=chapters.map(ch=>ch.id).join('|')+'|'+photoIds.join('|');
  const savedProgress=useRef(preview?cleanProgress(null,chapters,photoIds):readProgress(chapters,photoIds));
  const resumeTarget=useRef(savedProgress.current.active),scrollCandidate=useRef(''),scrollTimer=useRef(),navigationPinned=useRef(false);
  const [progress,setProgress]=useState(()=>({...savedProgress.current,active:chapters[0]?.id||''}));
  const [openId,setOpenId]=useState('');
  const [navigation,setNavigation]=useState(null);
  const [replays,setReplays]=useState({}),[ring,setRing]=useState(false),[quiet,setQuiet]=useState(false),[theme,setTheme]=useState('brown');
  const [motion,setMotion]=useState(()=>settings.intensity!=='none'&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const [storageOk,setStorageOk]=useState(true),[resetAsk,setResetAsk]=useState(false),[download,setDownload]=useState(''),[imageModal,setImageModal]=useState(null),[resetPulse,setResetPulse]=useState(0);
  const root=useRef(null),music=useRef(null),uid=useId().replaceAll(':','');
  useEffect(()=>{const previous=history.scrollRestoration;history.scrollRestoration='manual';window.scrollTo?.({top:0,left:0,behavior:'instant'});return()=>{history.scrollRestoration=previous;};},[]);
  useEffect(()=>{setProgress(p=>cleanProgress(p,chapters,photoIds));if(!chapters.some(ch=>ch.id===resumeTarget.current))resumeTarget.current=chapters[0]?.id||'';},[signature]);
  useEffect(()=>{if(settings.intensity==='none')setMotion(false);},[settings.intensity]);
  useEffect(()=>{if(!preview)setStorageOk(writeProgress({...progress,active:resumeTarget.current}));},[progress,preview]);
  useEffect(()=>{const query=window.matchMedia?.('(prefers-reduced-motion: reduce)');const fn=e=>{if(e.matches)setMotion(false);};query?.addEventListener?.('change',fn);return()=>query?.removeEventListener?.('change',fn);},[]);
  useEffect(()=>{const fn=()=>{if(root.current)root.current.dataset.documentHidden=String(document.hidden);};document.addEventListener('visibilitychange',fn);fn();return()=>document.removeEventListener('visibilitychange',fn);},[]);
  // Collapse the old chapter first, then resolve the target in the committed layout.
  // Instant navigation avoids travelling through unrelated chapters during a smooth scroll.
  useLayoutEffect(()=>{
    if(!navigation)return;
    const target=root.current?.querySelector(`[data-chapter="${navigation.id}"]`);
    target?.scrollIntoView({behavior:'instant',block:'start'});
  },[navigation]);
  // Dialog cleanup restores its trigger first; navigation then owns the final focus.
  useEffect(()=>{
    if(navigation)root.current?.querySelector(`[data-chapter="${navigation.id}"] .j-chapter-heading h2`)?.focus({preventScroll:true});
  },[navigation]);
  useEffect(()=>{
    const sections=root.current?.querySelectorAll('[data-chapter]');if(!sections)return;
    const release=()=>{navigationPinned.current=false;};
    const releaseKey=e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key)&&!e.target.closest?.('input,textarea,select,button,[contenteditable="true"]'))release();};
    window.addEventListener('wheel',release,{passive:true});window.addEventListener('touchmove',release,{passive:true});window.addEventListener('keydown',releaseKey);
    const cleanupInput=()=>{window.removeEventListener('wheel',release);window.removeEventListener('touchmove',release);window.removeEventListener('keydown',releaseKey);};
    if(!('IntersectionObserver'in window)){sections.forEach(s=>s.dataset.onscreen='true');return cleanupInput;}
    const io=new IntersectionObserver(entries=>{
      entries.forEach(e=>{e.target.dataset.onscreen=String(e.isIntersecting);if(!e.isIntersecting)e.target.querySelectorAll('video').forEach(v=>v.pause());});
      if(navigationPinned.current)return;
      // Observer entries contain only changed intersections, not every visible chapter.
      const top=window.innerHeight*.08,bottom=window.innerHeight*.75;
      const visible=[...sections].map(target=>({target,rect:target.getBoundingClientRect()})).filter(({rect})=>rect.bottom>top&&rect.top<bottom).sort((a,b)=>Math.abs(a.rect.top-top)-Math.abs(b.rect.top-top));
      const candidate=visible[0]?.target.dataset.chapter;
      if(candidate&&candidate!==scrollCandidate.current){scrollCandidate.current=candidate;clearTimeout(scrollTimer.current);scrollTimer.current=setTimeout(()=>{
        if(navigationPinned.current)return;
        resumeTarget.current=candidate;
        // Scrolling changes the soundtrack/marker, never the height of an open chapter.
        setProgress(p=>p.active===candidate?p:{...p,active:candidate});
      },180);}
    },{rootMargin:'-8% 0px -25% 0px',threshold:[0,.15,.5]});sections.forEach(s=>io.observe(s));return()=>{io.disconnect();clearTimeout(scrollTimer.current);cleanupInput();};
  },[signature]);
  const update=patch=>setProgress(p=>({...p,...patch}));
  function go(id){
    if(!chapters.some(ch=>ch.id===id))return;
    navigationPinned.current=true;clearTimeout(scrollTimer.current);scrollCandidate.current=id;resumeTarget.current=id;
    setOpenId('');setImageModal(null);
    if(id!=='blessings')root.current?.querySelectorAll('video').forEach(v=>v.pause());
    update({active:id});setNavigation({id});
  }
  function unlock(id){if(!canUnlock(id,chapters,progress.unlocked))return;setOpenId(id);setProgress(p=>({...p,unlocked:[...new Set([...p.unlocked,id])],active:id}));requestAnimationFrame(()=>root.current?.querySelector(`[data-chapter="${id}"] .j-chapter-heading h2`)?.focus({preventScroll:true}));}
  function replay(id){setReplays(v=>({...v,[id]:(v[id]||0)+1,...(id==='lantern'?{'lantern-done':0}:{})}));update({unlocked:progress.unlocked.filter(x=>x!==id),seen:id==='blessings'?[]:progress.seen});go(id);}
  function reset(){setOpenId('');setResetPulse(v=>v+1);setProgress(cleanProgress(null,chapters,photoIds));setReplays(v=>Object.fromEntries(chapters.map(ch=>[ch.id,(v[ch.id]||0)+1])));setResetAsk(false);go(chapters[0]?.id);}
  const next=id=>{const i=chapters.findIndex(ch=>ch.id===id);if(chapters[i+1])go(chapters[i+1].id);};
  async function save(){setDownload('working');try{const enriched={...c,keepsakePalette:theme,finalMessage:c.finalMessage+(progress.wish?'\n\nA wish to carry: '+progress.wish:'')};const blob=await createKeepsake(enriched);const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`birthday-keys-${c.shortName.replace(/[^a-z0-9]/gi,'-')}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setDownload('done');}catch{setDownload('error');}}
  function body(ch,index){switch(ch.id){
    case 'invitation':return <A name="invite-fold" className="j-invitation-paper"><svg viewBox="0 0 600 200" className="j-invitation-border" aria-hidden="true"><rect data-anim="border-draw" x="5" y="5" width="590" height="190" rx="14" fill="none" stroke="currentColor" strokeDasharray="1200"/></svg><A as="p" name="date-stamp" className="eyebrow">A LETTER TO THE YEAR AHEAD</A><A as="h2" name="name-wipe">For {c.shortName}.<br/><em>For everything still to bloom.</em></A><p>Some gifts are little places to return to. This one holds nine keys, a handful of prayers, and a year of good wishes from {c.sender}.</p><p className="j-handwritten">Take your time. Every door can wait for you.</p><div className="j-central-wish">{personalise(settings.centralWish,c)}</div></A>;
    case 'gate':return <div className="j-gate-layout"><A name="gate-panels" className="j-gate-stage"><svg className="j-branch-trace" viewBox="0 0 400 50" aria-hidden="true"><path data-anim="branch-draw" d="M0 45Q100 0 200 30T400 10" fill="none" stroke="currentColor" strokeDasharray="500"/></svg><GreenhouseGate opened onOpen={()=>{}} name={c.name} portraitSrc="/api/garden-entrance/photo"/></A><div><A name="gate-key" className="j-feature-key"><KeyArt index={1}/></A><h2 data-anim="garden-title">Your own little<br/><em>corner of October.</em></h2><p>{c.intro}</p><BirthdayClock birthday={c.birthday} timeZone={c.timezone}/><A name="path-glow" className="j-path-glow" aria-hidden="true"/></div></div>;
    case 'blessings':return <BlessingsSequence value={c.blessings} content={c} quiet={quiet} motion={motion&&!quiet} seen={progress.seen} onSeen={id=>setProgress(p=>({...p,seen:[...new Set([...p.seen,id])]}))} onWish={wish=>update({wish})} chosenWish={progress.wish} onVideoPlay={()=>music.current?.pauseForVideo()}/>;
    case 'wishes':return <><h2>A little care.<br/><em>A whole garden of possibility.</em></h2><WishGarden onBloom={()=>{}}/><p className="j-body-wish">{c.shortName}, may you trust the small beginnings. A first step can still be a brave one.</p>{c.sections.constellation&&<LeafLetters/>}<WishBoat/></>;
    case 'lantern':return <><A name="lantern-light" className="j-lantern-art" aria-hidden="true"><span/><i/></A><h2>Keep a little light<br/><em>for the uncertain evenings.</em></h2><p>You do not have to shine loudly to make someone’s world feel warmer.</p><A name="firefly-arrive"><FireflyJar onComplete={()=>setReplays(p=>({...p,'lantern-done':(p['lantern-done']||0)+1}))}/></A>{replays['lantern-done']>0&&<A name="path-light" className="j-path-complete">A little path of courage, ready for later.</A>}</>;
    case 'memories':return <A name="cabinet-open" className="j-memory-cabinet"><h2>Some stories are kept.<br/><em>Some are still waiting.</em></h2><p>No invented memories here. These pages are for real moments, and the possibilities you would like to make.</p><div className="j-memory-photos">{c.photos.length?c.photos.map(p=><figure key={p.id}><A name="photo-sleeve"><button aria-label={`Open photo: ${p.alt}`} onClick={()=>setImageModal(p)}><img src={p.thumbnail||p.src} alt={p.alt} loading="lazy" onError={e=>{e.currentTarget.hidden=true;}}/></button></A><A as="figcaption" name="caption-unfold">{p.caption}</A></figure>):<A name="photo-sleeve" className="j-memory-empty"><BotanicalSprig/><A name="caption-unfold">A real photograph will belong here.<br/>Add one through your local studio.</A></A>}</div><MemoryVideos videos={c.memoryVideos||[]} onVideoPlay={current=>{music.current?.pauseForVideo();root.current?.querySelectorAll('video').forEach(v=>{if(v!==current)v.pause();});}}/><MemoryJar/></A>;
    case 'celebration':return <BirthdayPavilion name={c.shortName||c.name} fullName={c.name} sender={c.sender} birthday={c.birthday}/>;
    case 'letter':return <A name="letter-unfold" className="j-letter-paper"><A as="span" name="page-corner" className="j-page-corner" aria-hidden="true"/><p className="eyebrow">FROM {c.sender}, WITH WARM WISHES</p><h2>A little letter<br/><em>worth keeping.</em></h2><div className="j-letter-text">{personalise(c.letter||newLetter,c).split('\n\n').map((p,i)=><p key={i}>{p}</p>)}</div><A name="signature-write" className="j-handwritten">With heartfelt wishes, {c.sender}</A></A>;
    case 'keepsake':return <A name="final-assemble" className="j-keepsake"><A name="keys-place" className="j-keepsake-keys">{progress.unlocked.map(id=><KeyArt key={id} index={chapters.findIndex(ch=>ch.id===id)}/>)}</A><h2>May your next chapter<br/><em>feel beautifully yours.</em></h2><A name="final-wish"><p className="j-final-wish">{personalise(c.finalMessage,c)}</p></A>{progress.wish&&<A name="wish-keep" className="j-carried-wish"><span>A WISH TO CARRY</span><p>{progress.wish}</p></A>}<button className="primary" onClick={save} disabled={download==='working'}>{download==='working'?'Creating your keepsake…':'Save your birthday keepsake'}</button>{download==='done'&&<p role="status"><svg width="30" height="25" viewBox="0 0 30 25" aria-hidden="true"><path data-anim="download-check" d="M3 12l8 8L27 3" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="60"/></svg> Your keepsake is ready.</p>}{download==='error'&&<p role="alert">The keepsake could not be created. Please try again.</p>}<SpecialScreening name={c.shortName||c.name} sender={c.sender} onVideoPlay={current=>{music.current?.pauseForVideo();root.current?.querySelectorAll('video').forEach(v=>{if(v!==current)v.pause();});}}/><p className="j-handwritten">For {c.name}, from {c.sender}.</p></A>;
    default:return null;
  }}
  return <div ref={root} className="birthday j-root" data-palette={theme} data-motion={motion&&!quiet?'on':'off'} data-intensity={settings.intensity} data-quiet={quiet} style={{'--j-duration':settings.intensity==='full'?'.85s':'.55s'}}>
    <a className="skip-link" href={`#${uid}-main`}>Skip to birthday chapters</a>
    {preview&&<p className="preview-ribbon">SAVED DRAFT · Sound starts only when you choose it in preview.</p>}
    <PersonalApology position="top" />
    <header className="j-header"><a href={`#${uid}-main`} className="j-brand">The Garden of October<small>THE KEYS TO YOUR NEW YEAR</small></a><div className="j-settings"><button onClick={()=>setTheme(v=>v==='brown'?'green':'brown')}>Switch to {theme==='brown'?'green':'brown'}</button><button aria-pressed={quiet} onClick={()=>setQuiet(v=>!v)}>Quiet reading mode</button><button aria-pressed={!motion} onClick={()=>setMotion(v=>!v)}>{motion?'Pause animations':'Resume animations'}</button></div></header>
    <JourneyMusic ref={music} chapters={chapters} active={progress.active} autoplay={settings.autoplay&&!preview} defaultVolume={settings.volume} onMusicPlay={()=>root.current?.querySelectorAll('video').forEach(v=>v.pause())}/>
    {status&&<p className="connection-note" role="status">{status}</p>}
    <div className="j-intro"><p className="eyebrow">{c.birthday?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(c.birthday+'T12:00:00Z')).toUpperCase():'A BIRTHDAY GIFT'} · A GIFT FROM {c.sender}</p><h1>Nine keys.<br/>One <em>beautiful year.</em></h1><p>For {c.shortName}, with a prayer for peace, a little courage, and something beautiful still to come.</p><div className="j-toolbar"><button className="primary" onClick={()=>{music.current?.enter();go(chapters[0]?.id);}}>Open {c.shortName}’s Garden</button><button onClick={()=>{music.current?.enter();go(resumeTarget.current);}}>Continue where I left off</button><button onClick={()=>setResetAsk(true)}>Start the journey again</button></div><p className="j-local-note">Collected keys are remembered. Every chapter stays locked until you choose and use its key, including on return visits. Private wish text stays only in the page.{!storageOk&&' Progress cannot be saved in this browser right now.'}</p></div>
    <nav className="j-map" aria-label="Garden chapter map"><div className="j-map-progress"><A name="map-progress" key={progress.unlocked.length} style={{width:`${progress.unlocked.length/Math.max(chapters.length,1)*100}%`}}/></div>{chapters.map((ch,i)=><button key={ch.id} data-anim={progress.active===ch.id?"active-marker":undefined} aria-current={progress.active===ch.id?'step':undefined} onClick={()=>go(ch.id)}><span>{String(i+1).padStart(2,'0')}</span>{ch.title}<small data-anim={progress.unlocked.includes(ch.id)?"key-check":undefined}>{openId===ch.id?'Open':progress.unlocked.includes(ch.id)?'Use key again':'A key awaits'}</small></button>)}</nav>
    <div className="j-keyring" key={resetPulse} data-anim={resetPulse?"ring-reset":undefined}><button aria-expanded={ring} onClick={()=>setRing(v=>!v)}>Garden Keyring · {progress.unlocked.length}/{chapters.length} keys {ring?'−':'+'}</button>{ring&&<A name="ring-open" className="j-keyring-tray">{chapters.map((ch,i)=><div className={progress.unlocked.includes(ch.id)?'collected':'waiting'} key={ch.id}>{progress.unlocked.includes(ch.id)?<A name={i===0?'key-arrive':'key-settle'}><KeyArt index={i}/></A>:<KeyArt index={i}/>}<span>{ch.key}</span></div>)}</A>}</div>
    <main id={`${uid}-main`}>{chapters.map((ch,i)=>{
      const unlocked=openId===ch.id;return <section className={`j-chapter chapter-${ch.id}`} data-chapter={ch.id} data-onscreen="true" key={ch.id} aria-labelledby={`${uid}-${ch.id}`}>
        <div className="j-chapter-heading"><p className="eyebrow">{String(i+1).padStart(2,'0')} / {ch.key}</p><h2 tabIndex="-1" id={`${uid}-${ch.id}`}>{ch.title}</h2>{unlocked&&<button className="text-button" onClick={()=>replay(ch.id)}>Replay this chapter</button>}</div>
        <div key={`${ch.id}-${replays[ch.id]||0}`} data-anim={replays[ch.id]?"replay-return":undefined}>{unlocked?<A name="chapter-path" className="j-chapter-body">{body(ch,i)}{i<chapters.length-1&&<button className="j-next" onClick={()=>next(ch.id)}>Continue to {chapters[i+1].title} →</button>}</A>:<UnlockScene chapter={{...ch,instruction:personalise(ch.instruction,c)}} index={i} available={canUnlock(ch.id,chapters,progress.unlocked)} onPrevious={()=>go(chapters[Math.max(i-1,0)].id)} onUnlock={()=>unlock(ch.id)} motion={motion&&!quiet} settings={settings} onGesture={()=>music.current?.gesture()}/>}</div>
      </section>;
    })}</main>
    <footer className="j-footer">Made for {c.name}. With warm wishes, {c.sender}.<button className="text-button" onClick={()=>setResetAsk(true)}>Reset saved progress</button></footer>
    <PersonalApology position="bottom" />
    {resetAsk&&<Modal title="Start the journey again?" onClose={()=>setResetAsk(false)}><p>This resets your keys, chapter progress and selected blessing in this browser. Your birthday content and uploaded files stay safe.</p><button className="primary" onClick={reset}>Reset my garden progress</button><button onClick={()=>setResetAsk(false)}>Keep my progress</button></Modal>}
    {imageModal&&<Modal title="A real memory" wide onClose={()=>setImageModal(null)}><img className="j-memory-full" src={imageModal.src} alt={imageModal.alt}/><p>{imageModal.caption}</p></Modal>}
  </div>;
}
