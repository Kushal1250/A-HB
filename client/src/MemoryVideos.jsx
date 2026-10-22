import {orderMemoryVideos} from './memoryVideoOrder';
import {useEffect,useRef,useState} from 'react';
export default function MemoryVideos({videos=[],onVideoPlay}){
 const root=useRef(null),[failed,setFailed]=useState([]);
 useEffect(()=>{const node=root.current;const pause=()=>node?.querySelectorAll('video').forEach(v=>v.pause());const visibility=()=>{if(document.hidden)pause();};document.addEventListener('visibilitychange',visibility);return()=>{pause();document.removeEventListener('visibilitychange',visibility);};},[]);
 const visible=orderMemoryVideos(videos).filter(v=>v.visible!==false);
 if(!visible.length)return null;
 return <section ref={root} className="memory-videos" aria-label="Video memories"><h3>Little moments, ready to replay.</h3><p>Take your time. Choose a clip whenever you’re ready.</p><div className="memory-video-grid">{visible.map((v,i)=><figure key={v.id}><h4>{v.title}</h4><video controls playsInline preload="none" poster={v.thumbnail||undefined} src={v.src} aria-label={v.title} onPlay={e=>{const current=e.currentTarget;root.current?.querySelectorAll('video').forEach(other=>{if(other!==current)other.pause();});onVideoPlay?.(current);}} onError={()=>setFailed(old=>old.includes(v.id)?old:[...old,v.id])}/>{failed.includes(v.id)&&<p role="status">This clip could not be loaded. You can try another video.</p>}<figcaption>{v.caption||'A little moment worth keeping.'}</figcaption><span className="memory-video-number">VIDEO {String(i+1).padStart(2,'0')}</span></figure>)}</div></section>;
}
