import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,fireEvent,waitFor,act} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {ScratchReveal,ShakeUnlock,PathUnlock,markScratch} from '../src/GestureUnlocks';
import KeyedBirthday from '../src/KeyedBirthday';
import BlessingsSequence from '../src/BlessingsSequence';
import {defaultJourney,revealKinds} from '../../shared/journey.js';
import {emptyBlessings} from '../../shared/blessings.js';
import {progressKey} from '../src/journeyState';
import defaults from '../../shared/defaults.json';
import palette from '../../shared/shirt-palette.json';
const ctx={setTransform:vi.fn(),fillRect:vi.fn(),strokeRect:vi.fn(),fillText:vi.fn(),beginPath:vi.fn(),moveTo:vi.fn(),lineTo:vi.fn(),stroke:vi.fn()};
beforeEach(()=>{localStorage.clear();vi.stubGlobal('PointerEvent',MouseEvent);vi.spyOn(HTMLCanvasElement.prototype,'getContext').mockReturnValue(ctx);vi.spyOn(HTMLElement.prototype,'getBoundingClientRect').mockReturnValue({left:0,top:0,width:340,height:160,right:340,bottom:160});vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(){fireEvent.play(this);return Promise.resolve();});vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){fireEvent.pause(this);});});
afterEach(()=>{vi.unstubAllGlobals();vi.useRealTimers();});
it('estimates scratch coverage with a bounded grid and never needs pixel reads',()=>{
 const cells=new Set();let fraction=0;for(let y=10;y<160;y+=20)fraction=markScratch(cells,{x:0,y},{x:340,y},340,160);
 expect(fraction).toBeGreaterThan(.7);expect(cells.size).toBeLessThanOrEqual(240);const before=cells.size;markScratch(cells,{x:0,y:10},{x:340,y:10},340,160);expect(cells.size).toBe(before);
});
it('keeps both dark typography colours above WCAG AA contrast on their reading surfaces',()=>{
 const luminance=hex=>{const v=hex.slice(1).match(/../g).map(h=>parseInt(h,16)/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4);return .2126*v[0]+.7152*v[1]+.0722*v[2];};
 const contrast=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 expect(contrast(palette.defaultText,palette.readingSurface)).toBeGreaterThan(4.5);expect(contrast(palette.reversedText,'#F0E9D6')).toBeGreaterThan(4.5);
});
it('scratches with pointer input and completes exactly once at its threshold',()=>{
 const complete=vi.fn(),gesture=vi.fn();const {container}=render(<ScratchReveal threshold={.2} onComplete={complete} onGesture={gesture}/>);const canvas=container.querySelector('canvas');
 fireEvent.pointerDown(canvas,{clientX:0,clientY:30,pointerId:1});fireEvent.pointerMove(canvas,{clientX:340,clientY:30,pointerId:1});fireEvent.pointerMove(canvas,{clientX:0,clientY:75,pointerId:1});fireEvent.pointerUp(canvas,{pointerId:1});
 expect(complete).toHaveBeenCalledOnce();expect(gesture).toHaveBeenCalledOnce();expect(ctx.stroke).toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Reveal directly'}));expect(complete).toHaveBeenCalledOnce();
});
it('offers a scratch button and immediately opens its final state without motion',()=>{
 const complete=vi.fn();const {rerender}=render(<ScratchReveal onComplete={complete}/>);fireEvent.click(screen.getByRole('button',{name:'Reveal directly'}));expect(complete).toHaveBeenCalledOnce();
 rerender(<ScratchReveal onComplete={complete} motion={false}/>);expect(complete).toHaveBeenCalledOnce();
});
it('recognises deliberate lantern direction changes by keyboard and stays bounded',async()=>{
 const complete=vi.fn();const {container}=render(<ShakeUnlock sensitivity={14} motion={false} onComplete={complete}/>);const group=screen.getByRole('group');
 for(const key of ['ArrowLeft','ArrowRight','ArrowLeft','ArrowRight'])fireEvent.keyDown(group,{key});
 expect(await screen.findByText('A little light, ready for the path.')).toBeVisible();await waitFor(()=>expect(complete).toHaveBeenCalledOnce());expect(container.querySelector('.g-lantern').style.translate).toBe('0px 0');
});
it('supports the lantern button and cancels pending completion on unmount',()=>{
 vi.useFakeTimers();const complete=vi.fn();const {unmount}=render(<ShakeUnlock onComplete={complete}/>);fireEvent.click(screen.getByRole('button',{name:'Gently shake the lantern'}));unmount();vi.runAllTimers();expect(complete).not.toHaveBeenCalled();
});
it('opens a memory cabinet with range input and three ordered leaves',async()=>{
 const complete=vi.fn();render(<PathUnlock kind="slide" motion={false} onComplete={complete}/>);fireEvent.change(screen.getByRole('slider'),{target:{value:'95'}});
 expect(screen.getByRole('button',{name:'Place leaf 2'})).toBeDisabled();for(let i=1;i<=3;i++)fireEvent.click(screen.getByRole('button',{name:`Place leaf ${i}`}));await waitFor(()=>expect(complete).toHaveBeenCalledOnce());
});
it('traces an envelope seam with a pointer and provides direct access',async()=>{
 const complete=vi.fn();const {container}=render(<PathUnlock kind="trace" motion={false} onComplete={complete}/>);const seam=container.querySelector('.g-trace');fireEvent.pointerDown(seam,{clientX:0,clientY:80,pointerId:1});for(let x=0;x<340;x+=16)fireEvent.pointerMove(seam,{clientX:x,clientY:80,pointerId:1});fireEvent.pointerUp(seam);await waitFor(()=>expect(complete).toHaveBeenCalledOnce());
});
it('starts sequence one even when progress exists and resumes the saved chapter only on request',async()=>{
 const chapters=defaultJourney.chapters.map((ch,i)=>({...ch,track:{src:`/chapter-${i}.mp3`,originalName:`Chapter ${i+1}`}}));localStorage.setItem(progressKey,JSON.stringify({v:2,unlocked:['invitation'],active:'letter',seen:[],wish:''}));
 const {container}=render(<KeyedBirthday content={{...defaults,journey:{...defaultJourney,chapters}}} createKeepsake={vi.fn()}/>);expect(container.querySelector('audio')).toHaveAttribute('src','/chapter-0.mp3');
 expect(screen.queryByRole('button',{name:/Play music/i})).not.toBeInTheDocument();expect(screen.queryByRole('button',{name:'Resume soundtrack'})).not.toBeInTheDocument();
 await userEvent.setup().click(screen.getByRole('button',{name:'Continue where I left off'}));expect(container.querySelector('audio')).toHaveAttribute('src','/chapter-7.mp3');
});
it('uses the entrance click for blocked audio without a prominent play button',async()=>{
 const play=HTMLMediaElement.prototype.play;play.mockRejectedValueOnce(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));const chapters=defaultJourney.chapters.map((ch,i)=>({...ch,track:{src:`/chapter-${i}.mp3`,originalName:`Chapter ${i+1}`}}));render(<KeyedBirthday content={{...defaults,journey:{...defaultJourney,chapters}}} createKeepsake={vi.fn()}/>);
 await act(async()=>{});await userEvent.setup().click(screen.getByRole('button',{name:'Open Anu’s Garden'}));expect(play).toHaveBeenCalledTimes(2);
 fireEvent.click(screen.getByRole('button',{name:'Sound settings'}));expect(screen.getByRole('button',{name:'Mute'})).toBeVisible();expect(screen.queryByText('Turn music on')).not.toBeInTheDocument();
});
it('connects all thirteen image-specific reveal styles without multiple photographs',()=>{
 const p={id:'one',visible:true,title:'A shrine',alt:'A decorated devotional shrine',caption:'',src:'/one.webp',blessing:'Peace for the year ahead.',theme:'Peace'};
 const props={content:defaults,motion:true,seen:['one'],onSeen:vi.fn(),onWish:vi.fn()};const {container,rerender}=render(<BlessingsSequence {...props} value={{...emptyBlessings,enabled:true,photos:[{...p,reveal:'curtains'}]}}/>);
 for(const reveal of revealKinds){rerender(<BlessingsSequence {...props} value={{...emptyBlessings,enabled:true,photos:[{...p,reveal}]}}/>);expect(container.querySelectorAll('.j-sacred-photo img')).toHaveLength(1);if(reveal==='garland')expect(container.querySelector('.j-sacred-frame>.j-garland')).not.toBeNull();else expect(container.querySelector('.j-reveal-layer').children.length).toBeGreaterThan(0);}
});
