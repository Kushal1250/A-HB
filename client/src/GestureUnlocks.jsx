import {useEffect,useRef,useState} from 'react';
import {A} from './JourneyArt';
// A small occupancy grid estimates the erased area without reading canvas pixels.
export function markScratch(cells,from,to,width,height,radius=23) {
  const steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/8));
  for(let step=0;step<=steps;step++){
    const x=from.x+(to.x-from.x)*step/steps,y=from.y+(to.y-from.y)*step/steps;
    for(let row=0;row<10;row++)for(let col=0;col<24;col++)if(Math.hypot((col+.5)*width/24-x,(row+.5)*height/10-y)<=radius)cells.add(row*24+col);
  }
  return cells.size/240;
}
export function ScratchReveal({threshold=.4,onComplete,onGesture,motion=true,label='Scratch the invitation seal'}){
  const canvas=useRef(null),surface=useRef(null),cells=useRef(new Set()),last=useRef(null),done=useRef(false),raf=useRef(0),finish=useRef(onComplete);
  const [cleared,setCleared]=useState(0),[spark,setSpark]=useState(null);finish.current=onComplete;
  useEffect(()=>{
    const c=canvas.current;const ctx=c?.getContext('2d');if(!ctx)return;
    function paint(){const rect=surface.current.getBoundingClientRect();const w=rect.width||340,h=rect.height||160,dpr=Math.min(window.devicePixelRatio||1,3);c.width=w*dpr;c.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.globalCompositeOperation='source-over';ctx.fillStyle='#947158';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#dcc5a1';ctx.lineWidth=1;ctx.strokeRect(10,10,w-20,h-20);ctx.fillStyle='#f8edd8';ctx.textAlign='center';ctx.font='17px Georgia';ctx.fillText('A birthday invitation, sealed with care',w/2,h/2);cells.current.clear();last.current=null;setCleared(0);}
    paint();const ro=typeof ResizeObserver!=='undefined'?new ResizeObserver(paint):null;ro?.observe(surface.current);return()=>{ro?.disconnect();cancelAnimationFrame(raf.current);};
  },[]);
  useEffect(()=>{if(!motion&&!done.current){done.current=true;finish.current();}},[motion]);
  function point(e){const r=surface.current.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};}
  function scratch(e){if(!last.current||done.current)return;const p=point(e),r=surface.current.getBoundingClientRect(),w=r.width||340,h=r.height||160;const ctx=canvas.current?.getContext('2d');if(ctx){ctx.globalCompositeOperation='destination-out';ctx.lineWidth=46;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.stroke();}const fraction=markScratch(cells.current,last.current,p,w,h);last.current=p;cancelAnimationFrame(raf.current);raf.current=requestAnimationFrame(()=>{setCleared(Math.min(100,Math.round(fraction/threshold*100)));setSpark(p);});if(fraction>=threshold){done.current=true;finish.current();}}
  return <div className="g-scratch"><p>{label}. Rub the paper with a finger or pointer, or reveal it directly.</p><div ref={surface} className="g-scratch-surface"><div className="g-scratch-under">For you.<br/><span>A new year of possibility.</span></div><canvas ref={canvas} aria-hidden="true" onPointerDown={e=>{onGesture?.();last.current=point(e);e.currentTarget.setPointerCapture?.(e.pointerId);scratch(e);}} onPointerMove={scratch} onPointerUp={e=>{last.current=null;e.currentTarget.releasePointerCapture?.(e.pointerId);}} onPointerCancel={()=>last.current=null}/>{spark&&<A as="i" key={`${Math.round(spark.x/20)}-${Math.round(spark.y/20)}`} name="scratch-glint" className="g-scratch-spark" style={{left:spark.x,top:spark.y}} aria-hidden="true"/>}</div><progress aria-label="Invitation reveal progress" max="100" value={cleared}/><button onClick={()=>{onGesture?.();if(!done.current){done.current=true;finish.current();}}}>Reveal directly</button></div>;
}

export function ShakeUnlock({sensitivity=14,onComplete,onGesture,motion=true}){
  const [x,setX]=useState(0),[turns,setTurns]=useState(0),[settled,setSettled]=useState(false);const last=useRef(null),direction=useRef(0),anchor=useRef(0),count=useRef(0),timer=useRef(),completed=useRef(false);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function complete(){if(completed.current)return;completed.current=true;setSettled(true);setX(0);timer.current=setTimeout(onComplete,motion?450:0);}
  function step(dx){if(completed.current)return;const sign=Math.sign(dx);if(Math.abs(dx)<sensitivity)return;if(direction.current&&sign!==direction.current){count.current++;setTurns(count.current);if(count.current>=3)complete();}direction.current=sign;}
  return <div className="g-shake"><p>Move the lantern gently left and right three times. Arrow keys or the button work too.</p><div className="g-lantern-handle" role="group" tabIndex="0" aria-label="Shake the illustrated lantern with left and right arrow keys" onKeyDown={e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();onGesture?.();const dx=e.key==='ArrowLeft'?-sensitivity:sensitivity;step(dx);setX(completed.current?0:dx);}}} onPointerDown={e=>{onGesture?.();last.current=e.clientX;anchor.current=e.clientX;e.currentTarget.setPointerCapture?.(e.pointerId);}} onPointerMove={e=>{if(last.current===null)return;const dx=e.clientX-anchor.current;if(Math.abs(dx)>=sensitivity){step(dx);anchor.current=e.clientX;}setX(completed.current?0:Math.max(-35,Math.min(35,(e.clientX-last.current)/3)));}} onPointerUp={()=>{last.current=null;setX(0);}} onPointerCancel={()=>{last.current=null;setX(0);}}>
      <A name={settled?'shake-settle':undefined} className="g-lantern" style={{translate:`${x}px 0`,rotate:`${x/4}deg`}}><A name={x?'lantern-sway':undefined} className="g-lantern-window"/><span/></A>
    </div><p role="status">{settled?'A little light, ready for the path.':`${Math.min(turns,3)} / 3 gentle changes of direction`}</p><button disabled={settled} onClick={()=>{onGesture?.();complete();}}>Gently shake the lantern</button></div>;
}

export function PathUnlock({kind,onComplete,onGesture,motion=true}) {
  const [value,setValue]=useState(0),[leaves,setLeaves]=useState(0),[done,setDone]=useState(false);const timer=useRef(),points=useRef(new Set()),drag=useRef(false);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function finish(){if(done)return;setDone(true);timer.current=setTimeout(onComplete,motion?450:0);}
  const title={slide:'Slide open the memory cabinet',trace:'Trace the envelope seam',ribbon:'Pull the birthday ribbon',water:'Move a drop of care to the seed',assemble:'Place your key in the frame'}[kind]||'Open this little surprise';
  return <div className={`g-path kind-${kind}`}><p>{title}</p>
    {kind==='trace'?<div className="g-trace" onPointerDown={e=>{onGesture?.();drag.current=true;e.currentTarget.setPointerCapture?.(e.pointerId);}} onPointerMove={e=>{if(!drag.current||done)return;const r=e.currentTarget.getBoundingClientRect();if(Math.abs(e.clientY-r.top-r.height/2)<35){points.current.add(Math.max(0,Math.min(19,Math.floor((e.clientX-r.left)/r.width*20))));setValue(points.current.size*5);if(points.current.size>=14)finish();}}} onPointerUp={()=>drag.current=false} onPointerCancel={()=>drag.current=false}><svg viewBox="0 0 300 80" aria-hidden="true"><path data-anim={done?'envelope-trace':undefined} d="M10 40H290" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5"/><path d="M10 10L150 60L290 10" fill="none" stroke="currentColor"/></svg><span>Trace along the dotted seam</span></div>:<>
      <A name={done?(kind==='ribbon'?'ribbon-untie':kind==='slide'?'cabinet-slide':kind==='assemble'?'keys-place':'rain-fall'):undefined} className="g-slider-art" aria-hidden="true">{kind==='slide'?<><i/><i/></>:kind==='ribbon'?<span className="g-ribbon-bow">∞</span>:kind==='water'?<span className="g-water-drop">●</span>:<span className="g-key-target">⌘</span>}</A>
      <label>{title}<input type="range" min="0" max="100" value={value} aria-label={title} onPointerDown={onGesture} onChange={e=>{onGesture?.();const n=Number(e.target.value);setValue(n);if(n>=90&&kind!=='slide')finish();}}/></label>
    </>}
    {kind==='slide'&&value>=90&&!done&&<div className="j-pattern">{[0,1,2].map(i=><button key={i} disabled={i!==leaves} onClick={()=>{setLeaves(i+1);if(i===2)finish();}}>Place leaf {i+1}</button>)}</div>}
    {done&&<A name={kind==='ribbon'?'gift-open':'envelope-trace'}><p role="status">A little surprise, ready to open.</p></A>}
    <button disabled={done} onClick={()=>{onGesture?.();finish();}}>{kind==='trace'?'Open the envelope directly':kind==='water'?'Water the seed':kind==='ribbon'?'Untie the ribbon':kind==='slide'?'Open the cabinet directly':'Place the key'}</button>
  </div>;
}
