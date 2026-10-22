import PersonName, {NameText} from './PersonName';
import {useEffect,useRef,useState} from 'react';
import './special-screening.css';
// Edit the titles and captions here. Original video bytes stay in public/special-videos.
export const specialFilms=[
 {id:'film-1',title:'A little spark',caption:'Some moments deserve a place of their own.'},
 {id:'film-2',title:'A moment to hold',caption:'Take your time. This little pause is just for you.'},
 {id:'film-3',title:'One last glow',caption:'May the happiness in your next chapter stay with you, Anu.'}
];
export default function SpecialScreening({name='Anu',sender='Kushal',onVideoPlay}){
 const [entered,setEntered]=useState(false),[active,setActive]=useState(null),[seen,setSeen]=useState([]),[failed,setFailed]=useState(false);
 const video=useRef(null),heading=useRef(null);
 useEffect(()=>{const node=video.current;const pause=()=>node?.pause();const hidden=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',hidden);return()=>{pause();document.removeEventListener('visibilitychange',hidden);};},[active,entered]);
 useEffect(()=>{if(active!==null)heading.current?.focus({preventScroll:true});},[active]);
 const choose=i=>{video.current?.pause();setFailed(false);setActive(i);};
 const film=active===null?null:specialFilms[active];
 return <section className="special-screening" aria-label="Three special films">
  <div className="screening-stars" aria-hidden="true">✧ · ✦ · ✧</div>
  <p className="eyebrow">A HIDDEN CORNER OF YOUR GARDEN</p>
  <h3>A few moments.<br/><em>Saved especially for you.</em></h3>
  {!entered?<div className="screening-seal"><span aria-hidden="true" className="screening-seal-mark">✦</span><p>The garden has one more little secret, <PersonName>{name}</PersonName>.</p><button type="button" className="primary" onClick={()=>setEntered(true)}>Open your secret screening room</button><small>Three sealed films. One quiet place to enjoy them.</small></div>:<>
   <nav className="screening-tickets" aria-label="Special film selection">{specialFilms.map((f,i)=><button type="button" key={f.id} aria-pressed={active===i} onClick={()=>choose(i)}><span className="ticket-number">0{i+1}</span><span>{f.title}<small>{seen.includes(i)?'A moment kept · watch again':'Unseal this film'}</small></span><span aria-hidden="true">{active===i?'◉':'✦'}</span></button>)}</nav>
   {film?<div className="screening-reveal" key={film.id}><div className="screening-marquee"><span>PRIVATE SCREENING</span><span>0{active+1} / 03</span></div><h4 ref={heading} tabIndex="-1">{film.title}</h4><div className="screening-stage"><video ref={video} controls playsInline preload="none" poster={`${import.meta.env.BASE_URL}special-videos/${film.id}.webp`} src={`${import.meta.env.BASE_URL}special-videos/${film.id}.mp4`} aria-label={`Special film ${active+1}: ${film.title}`} onPlay={e=>onVideoPlay?.(e.currentTarget)} onError={()=>setFailed(true)} onEnded={()=>setSeen(v=>v.includes(active)?v:[...v,active])}/></div>
    {failed&&<p role="status">This film could not load. Please try another ticket, or check that the special video files were copied.</p>}
    <p className="screening-caption">{film.caption}</p><div className="screening-actions"><button type="button" onClick={()=>choose((active+1)%specialFilms.length)}>{active===2?'Return to the first film':'Unseal the next film'} →</button><button type="button" onClick={()=>{video.current?.pause();setActive(null);}}>Back to the sealed tickets</button></div>
   </div>:<p className="screening-invitation">Choose a sealed ticket above. Your film will wait until you press play.</p>}
   {seen.length===3&&<p className="screening-complete" role="status">Three little moments, kept in your birthday garden. Happy Birthday, <PersonName>{name}</PersonName>. — <PersonName>{sender}</PersonName></p>}
   <p className="screening-dedication">For <PersonName>{name}</PersonName>, with a little extra care. <span>— <PersonName>{sender}</PersonName></span></p>
  </>}
 </section>;
}
