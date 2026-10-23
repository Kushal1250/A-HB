import {useId,useRef,useState} from 'react';
import './birthday-pavilion.css';
const wishes=[
 {id:'peace',label:'Peace',symbol:'◌',line:'Room to breathe. Time to be yourself.'},
 {id:'courage',label:'Courage',symbol:'✧',line:'Small beginnings. Beautiful possibilities.'},
 {id:'joy',label:'Joy',symbol:'❋',line:'Ordinary days with something to smile about.'}
];
const fortunes=[
 'May you find little reasons to be happy, even on the days that ask a lot of you.',
 'May the things you begin this year bring you closer to a life that feels like your own.',
 'May you always have good company, honest laughter, and somewhere you feel at home.'
];
function PavilionCake({initials,name}){
 const uid=useId().replaceAll(':','');
 return <svg className="bp-cake-art" viewBox="0 0 600 430" role="img" aria-label={`A botanical birthday cake for ${name}`}>
  <defs><linearGradient id={`${uid}-icing`} x2="0" y2="1"><stop stopColor="#f4e8cf"/><stop offset="1" stopColor="#d8c5a2"/></linearGradient><linearGradient id={`${uid}-cake`} x2="1" y2="0"><stop stopColor="#80624b"/><stop offset=".5" stopColor="#ad8b68"/><stop offset="1" stopColor="#71523d"/></linearGradient></defs>
  <ellipse cx="300" cy="377" rx="235" ry="26" fill="#000" opacity=".2"/>
  <path d="M77 352h446l-32 20H109z" fill="#9d895c"/><ellipse cx="300" cy="350" rx="223" ry="21" fill="#d9c79c"/>
  <path d="M118 227h364v101c0 35-364 35-364 0z" fill={`url(#${uid}-cake)`}/><ellipse cx="300" cy="226" rx="182" ry="32" fill={`url(#${uid}-icing)`}/>
  <path d="M118 228c0 11 25 13 35 16s7 35 23 35 13-31 29-29 7 42 24 42 10-40 28-38 11 25 26 25 18-23 35-23 13 27 28 27 11-30 29-33 16 22 29 20 7-24 26-27 32-2 32-15" fill={`url(#${uid}-icing)`}/>
  <path d="M183 155h234v64c0 30-234 30-234 0z" fill="#52684a"/><ellipse cx="300" cy="155" rx="117" ry="26" fill={`url(#${uid}-icing)`}/>
  <path d="M183 159c0 12 28 12 34 15s2 23 13 23 8-21 19-21 4 29 19 29 10-27 23-27 12 20 23 20 11-20 23-22 10 20 22 17 4-21 17-22 41-1 41-12" fill={`url(#${uid}-icing)`}/>
  <g stroke="#b5c59a" strokeWidth="3" fill="none"><path d="M150 313q28-42 58-49M450 313q-28-42-58-49"/><path d="M165 294q-30-24-14-32 24 8 14 32m12-15q-5-31 12-27 13 17-12 27m-1 17q27 8 27-9-16-12-27 9M435 294q30-24 14-32-24 8-14 32m-12-15q5-31-12-27-13 17 12 27m1 17q-27 8-27-9 16-12 27 9"/></g>
  <circle cx="300" cy="299" r="35" fill="#e4d4ae" stroke="#c0a46b" strokeWidth="3"/><text x="300" y="310" textAnchor="middle" fill="#3a5036" fontFamily="Georgia,serif" fontSize="28">{initials}</text>
  <g fill="#d4b97a">{[132,166,202,240,280,320,360,398,434,468].map((x,i)=><circle key={x} cx={x} cy={337+(i%2)*3} r="3"/>)}</g>
 </svg>;
}
export default function BirthdayPavilion({name='Anu',fullName='Anu Patel',sender='Kushal',birthday}){
 const [opened,setOpened]=useState(false),[selected,setSelected]=useState([]),[blown,setBlown]=useState([]),[wish,setWish]=useState(''),[fortune,setFortune]=useState(-1);
 const heading=useRef(null),wishId=useId(),ready=selected.length===3,done=blown.length===3;
 const initials=fullName.trim().split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase();
 const date=birthday&&/^\d{4}-\d{2}-\d{2}$/.test(birthday)?new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',timeZone:'UTC'}).format(new Date(birthday+'T12:00:00Z')):'YOUR BIRTHDAY';
 const light=id=>{if(done||blown.length)return;setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);};
 function blow(index){if(!ready||done)return;setBlown(v=>index===undefined?[0,1,2]:v.includes(index)?v:[...v,index]);}
 const relight=()=>{setBlown([]);setFortune(-1);};
 return <section className={`birthday-pavilion ${opened?'bp-open':'bp-sealed'} ${done?'bp-celebrated':''}`} aria-label="Your birthday pavilion">
  <div className="bp-arch" aria-hidden="true"/><p className="bp-eyebrow">{date} · A LITTLE CEREMONY FOR YOU</p>
  <h2 ref={heading}>A table for one wish.<br/><em>A whole year of possibilities.</em></h2>
  <p className="bp-intro">For you, {name}. A little peace, a little courage, and plenty of reasons to smile.</p>
  {!opened?<div className="bp-sealed-gift"><div className="bp-gift-art" aria-hidden="true"><span className="bp-gift-star">✧</span><span className="bp-gift-dome"/><span className="bp-ribbon">{initials}</span><span className="bp-gift-base"/></div><p>Something lovely is waiting beneath the ribbon.</p><button type="button" className="primary bp-open-button" onClick={()=>setOpened(true)}>Untie the ribbon, {name}</button><small>Your birthday pavilion is ready.</small></div>:<>
   <figure className="bp-portrait"><img src="/pavilion-portrait.jpeg" alt={`${fullName} celebrating in a blue and cream traditional outfit`} width="716" height="1282"/><figcaption>A little spotlight for <strong>{fullName}</strong><span>Today, the celebration is yours.</span></figcaption></figure>
   <figure className="bp-portrait bp-bouquet"><img src="/birthday-bouquet.jpeg" alt="A bouquet of pink, red and white roses with baby's breath, wrapped in blue and blush paper, with the words Happy Birthday Anu" width="720" height="1280" loading="lazy"/><figcaption>Fresh flowers for <strong>{name}</strong><span>Picked out with love, just for today.</span></figcaption></figure>
   <ol className="bp-steps" aria-label="Birthday ritual progress">{['Light three little wishes','Make a wish','Let the celebration bloom'].map((s,i)=><li key={s} aria-current={(!ready?0:!done?1:2)===i?'step':undefined}><span>0{i+1}</span>{s}</li>)}</ol>
   <div className="bp-cake-stage"><div className="bp-halo" aria-hidden="true"/><PavilionCake initials={initials} name={name}/><div className="bp-candles">{wishes.map((w,i)=><button type="button" className="bp-candle" key={w.id} disabled={!ready||blown.includes(i)} aria-label={`Blow out candle ${i+1}`} onClick={()=>blow(i)}><span className={`bp-flame ${selected.includes(w.id)&&!blown.includes(i)?'is-lit':''}`} aria-hidden="true"/><span className="bp-wick"/><span className="bp-candle-body"/>{blown.includes(i)&&<span className="bp-smoke" aria-hidden="true"/>}</button>)}</div><p className="bp-cake-name">HAPPY BIRTHDAY, {name.toUpperCase()}</p>
    {done&&<div className="bp-petals" aria-hidden="true">{Array.from({length:22},(_,i)=><i key={i} style={{'--i':i,left:`${(i*43)%100}%`}}/>)}</div>}
   </div>
   {!done&&<div className="bp-wish-station"><h3>{ready?'A quiet moment, just for you.':'Give each candle a little meaning.'}</h3><p>{ready?'Hold a wish in your heart, or write it below. Then let the candles carry it.':'Choose all three wishes to light your candles.'}</p><div className="bp-wish-tokens">{wishes.map(w=><button type="button" key={w.id} aria-pressed={selected.includes(w.id)} disabled={blown.length>0} onClick={()=>light(w.id)}><span className="bp-token-symbol" aria-hidden="true">{w.symbol}</span><strong>{w.label}</strong><small>{w.line}</small><span className="bp-token-state">{selected.includes(w.id)?'Candle lit ✓':'Light this candle'}</span></button>)}</div><p className="bp-light-count" role="status">{selected.length} of 3 candles lit{ready?' · Your moment is ready.':''}</p>
    <label htmlFor={wishId}>A wish only you need to know <span>(optional)</span></label><textarea id={wishId} maxLength="300" rows="2" value={wish} onChange={e=>setWish(e.target.value)} placeholder="This year, I hope…"/><small className="bp-private-note">Your words stay in this page and clear when it closes. Nothing is submitted.</small>
    <button type="button" className="primary bp-blow-button" disabled={!ready} onClick={()=>blow()}>Make a wish & blow out the candles</button>
   </div>}
   {done&&<div className="bp-finale"><p className="bp-eyebrow">THE CANDLES REST. YOUR YEAR BEGINS.</p><h3 role="status">Happy Birthday, <em>{name}.</em></h3><p className="bp-wish-true">May your wish come true.</p><p>May this year bring you days you enjoy living, people who make you feel welcome, and the freedom to grow at your own pace.</p>{wish&&<blockquote><small>YOUR QUIET WISH</small><p>{wish}</p></blockquote>}<p className="bp-signature">With heartfelt wishes,<br/><span>{sender}</span></p>
    <div className="bp-fortune"><button type="button" onClick={()=>setFortune(v=>(v+1)%fortunes.length)}>{fortune<0?'Open a little wish for your year':'Another little wish'} <span aria-hidden="true">↗</span></button>{fortune>=0&&<p key={fortune} className="bp-fortune-note" role="status">{fortunes[fortune]}</p>}</div>
    <button type="button" className="text-button" onClick={relight}>Relight the candles</button>
   </div>}
  </>}
 </section>;
}
