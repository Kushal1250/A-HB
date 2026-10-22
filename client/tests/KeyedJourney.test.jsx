import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,within,fireEvent,act,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import KeyedBirthday from '../src/KeyedBirthday';
import JourneyMusic from '../src/JourneyMusic';
import BlessingsSequence from '../src/BlessingsSequence';
import JourneyEditor from '../src/JourneyEditor';
import {defaultJourney,chapterDefs,newLetter} from '../../shared/journey.js';
import {emptyBlessings} from '../../shared/blessings.js';
import {cleanProgress,readProgress,progressKey,canUnlock} from '../src/journeyState';
import defaults from '../../shared/defaults.json';
const chapters=defaultJourney.chapters.map((ch,i)=>({...ch,track:{src:`/track-${i}.mp3`,originalName:`Original track ${i+1}`}}));
const photos=[0,1,2].map(i=>({id:`p-${i}`,mediaId:`m-${i}`,visible:i!==2,title:`Quiet view ${i+1}`,alt:`A devotional photograph ${i+1}`,caption:'A shrine decorated with flowers.',src:`/god-${i}.webp`,reveal:'curtains',blessing:`A wish for Anu ${i+1}`,theme:'Peace'}));
const content={...defaults,letter:newLetter,journey:{...defaultJourney,chapters},blessings:{...emptyBlessings,enabled:true,photos,video:{src:'/video.mp4'}}};
beforeEach(()=>{localStorage.clear();vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(){fireEvent.play(this);return Promise.resolve();});vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){fireEvent.pause(this);});});
afterEach(()=>{vi.unstubAllGlobals();});
const renderJourney=(props={})=>render(<KeyedBirthday content={content} createKeepsake={vi.fn().mockResolvedValue(new Blob(['png']))} {...props}/>);
const section=(container,id)=>container.querySelector(`[data-chapter="${id}"]`);
async function useKey(user,container,id){
 const area=section(container,id);
 await act(async()=>{fireEvent.click(within(area).getByRole('button',{name:/Choose the/}));});
 await act(async()=>{fireEvent.click(within(area).getByRole('button',{name:'Use this key to open'}));await new Promise(resolve=>setTimeout(resolve,750));});
 expect(area.querySelector('.j-chapter-body')).toBeInTheDocument();
}
it('defaults to brown and toggles to green and back',async()=>{
 const user=userEvent.setup();const {container}=renderJourney();expect(container.querySelector('.j-root')).toHaveAttribute('data-palette','brown');
 await user.click(screen.getByRole('button',{name:'Switch to green'}));expect(container.querySelector('.j-root')).toHaveAttribute('data-palette','green');
 await user.click(screen.getByRole('button',{name:'Switch to brown'}));expect(container.querySelector('.j-root')).toHaveAttribute('data-palette','brown');
});
it('collects chapter keys, supports prerequisites, and saves progress',async()=>{
 const user=userEvent.setup();const {container}=renderJourney();
 expect(within(section(container,'gate')).queryByRole('button',{name:'Choose the Garden Gate Key'})).not.toBeInTheDocument();
 await useKey(user,container,'invitation');
 expect(within(section(container,'invitation')).getByText(/Take your time/)).toBeVisible();
 expect(within(section(container,'gate')).getByRole('button',{name:'Choose the Garden Gate Key'})).toBeEnabled();
 expect(JSON.parse(localStorage.getItem(progressKey)).unlocked).toContain('invitation');
 await user.click(screen.getByRole('button',{name:/Garden Keyring/}));expect(screen.getByText('Invitation Key',{selector:'.j-keyring-tray span'})).toBeVisible();
});
it('requires keys, hides saved content on reload, and relocks on navigation',async()=>{
 const user=userEvent.setup();localStorage.setItem(progressKey,JSON.stringify({v:2,unlocked:chapters.map(c=>c.id)}));
 const {container}=renderJourney();
 expect(container.querySelectorAll('.j-chapter-body')).toHaveLength(0);
 expect(screen.queryByRole('button',{name:'Open all chapters'})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/Open directly/})).not.toBeInTheDocument();
 await useKey(user,container,'invitation');
 await user.click(within(screen.getByRole('navigation',{name:'Garden chapter map'})).getAllByRole('button')[1]);
 expect(container.querySelectorAll('.j-chapter-body')).toHaveLength(0);
 await useKey(user,container,'gate');expect(container.querySelectorAll('.j-chapter-body')).toHaveLength(1);
 await user.click(screen.getByRole('button',{name:'Reset saved progress'}));
 await user.click(screen.getByRole('button',{name:'Reset my garden progress'}));
 expect(JSON.parse(localStorage.getItem(progressKey)).unlocked).toEqual([]);
});
it('quiet mode keeps every chapter locked and later chapters cannot skip prerequisites',async()=>{
 const user=userEvent.setup();const {container}=renderJourney();
 await user.click(screen.getByRole('button',{name:'Quiet reading mode'}));
 expect(container.querySelector('.j-root')).toHaveAttribute('data-motion','off');
 expect(container.querySelectorAll('.j-chapter-body')).toHaveLength(0);
 expect(within(section(container,'keepsake')).queryByRole('button',{name:/Choose the|Use this key/})).not.toBeInTheDocument();
 expect(container.querySelectorAll('.j-sacred-photo img')).toHaveLength(0);
 await useKey(user,container,'invitation');
 expect(within(section(container,'gate')).getByRole('button',{name:/Choose the/})).toBeEnabled();
});
it('sanitises obsolete and corrupt progress and tolerates unavailable storage',()=>{
 const raw={v:2,unlocked:['removed','gate','gate'],active:'removed',seen:['deleted','p-0'],wish:'x'.repeat(500)};
 const p=cleanProgress(raw,chapters,['p-0']);expect(p.unlocked).toEqual(['gate']);expect(p.active).toBe('invitation');expect(p.seen).toEqual(['p-0']);expect(p.wish).toHaveLength(300);
 localStorage.setItem(progressKey,'not-json');expect(readProgress(chapters,[]).unlocked).toEqual([]);
 vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('Unavailable');});renderJourney();expect(screen.getByText(/Progress cannot be saved/)).toBeVisible();
 expect(canUnlock('gate',chapters,[])).toBe(false);expect(canUnlock('gate',chapters,['invitation'])).toBe(true);
});
it('follows the chapter entering view and switches its audio source',async()=>{
 let callback;vi.stubGlobal('IntersectionObserver',class {constructor(fn){callback=fn;}observe(){}disconnect(){}});
 const {container}=renderJourney();const a=container.querySelector('audio');expect(a).toHaveAttribute('src','/track-0.mp3');
 chapters.forEach(ch=>vi.spyOn(section(container,ch.id),'getBoundingClientRect').mockReturnValue({top:ch.id==='lantern'?70:2000,bottom:ch.id==='lantern'?500:2500}));
 await act(async()=>{callback([{target:section(container,'lantern'),isIntersecting:true,boundingClientRect:{top:70}}]);await new Promise(resolve=>setTimeout(resolve,220));});expect(a).toHaveAttribute('src','/track-4.mp3');
 expect(screen.queryByText('Original track 5')).not.toBeInTheDocument();
});
it('retries blocked autoplay on the first interaction without showing a resume prompt',async()=>{
 const play=HTMLMediaElement.prototype.play;play.mockRejectedValueOnce(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
 const {container}=render(<JourneyMusic chapters={chapters} active="invitation" autoplay defaultVolume={.28}/>);
 await act(async()=>{});expect(play).toHaveBeenCalledOnce();expect(screen.queryByText(/Resume soundtrack|Enter the garden with sound/)).not.toBeInTheDocument();
 fireEvent.pointerDown(document.body);await waitFor(()=>expect(play).toHaveBeenCalledTimes(2));expect(container.querySelector('audio')).toHaveAttribute('preload','auto');
});
it('attempts automatic playback on a fresh visit despite an old pause or mute preference',async()=>{
 localStorage.setItem('october-garden-sound-v1',JSON.stringify({silent:true,muted:true,volume:.28}));
 const {container}=render(<JourneyMusic chapters={chapters} active="invitation" autoplay defaultVolume={.28}/>);
 await act(async()=>{});expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();expect(container.querySelector('audio').muted).toBe(false);
});
it('keeps mute across chapter changes and unmutes without a separate play prompt',async()=>{
 const user=userEvent.setup();const {container,rerender}=render(<JourneyMusic chapters={chapters} active="invitation" autoplay defaultVolume={.28}/>);
 await user.click(screen.getByRole('button',{name:'Sound settings'}));expect(screen.queryByRole('button',{name:/Turn music on|Resume soundtrack|Pause background music/})).not.toBeInTheDocument();
 await user.click(screen.getByRole('button',{name:'Mute'}));expect(container.querySelector('audio').muted).toBe(true);const calls=HTMLMediaElement.prototype.play.mock.calls.length;
 rerender(<JourneyMusic chapters={chapters} active="gate" autoplay defaultVolume={.28}/>);expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(calls);
 await user.click(screen.getByRole('button',{name:'Unmute'}));expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(calls+1);expect(container.querySelector('audio').muted).toBe(false);
});
it('honours autoplay and volume settings arriving with fetched content',()=>{
 const pending=chapters.map(ch=>({...ch,track:null}));
 const {container,rerender}=render(<JourneyMusic chapters={pending} active="invitation" autoplay defaultVolume={.28}/>);
 rerender(<JourneyMusic chapters={chapters} active="invitation" autoplay={false} defaultVolume={.12}/>);
 expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();expect(container.querySelector('audio').volume).toBe(.12);
});
it('retains volume while resetting old mute state and handles media failures',async()=>{
 localStorage.setItem('october-garden-sound-v1',JSON.stringify({silent:true,muted:true,volume:.14}));const {container}=render(<JourneyMusic chapters={chapters} active="invitation" autoplay defaultVolume={.28}/>);
 fireEvent.click(screen.getByRole('button',{name:'Sound settings'}));expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce();expect(container.querySelector('audio').muted).toBe(false);expect(screen.getByRole('slider',{name:'Music volume'})).toHaveValue('0.14');
 fireEvent.change(screen.getByRole('slider'),{target:{value:'.4'}});expect(JSON.parse(localStorage.getItem('october-garden-sound-v1')).volume).toBe(.4);
 fireEvent.error(container.querySelector('audio'));expect(screen.getByText(/This music file is unavailable/)).toBeVisible();
});
it('reveals only one God photo, moves to another closed door, and excludes hidden images',async()=>{
 const user=userEvent.setup();let seen=[];const onSeen=vi.fn(id=>seen.push(id));
 const {container,rerender}=render(<BlessingsSequence value={content.blessings} content={content} motion seen={seen} onSeen={onSeen} onWish={vi.fn()}/>);
 expect(container.querySelectorAll('.j-sacred-photo img')).toHaveLength(0);
 await user.click(screen.getByRole('button',{name:'Reveal this blessing'}));rerender(<BlessingsSequence value={content.blessings} content={content} motion seen={seen} onSeen={onSeen} onWish={vi.fn()}/>);
 expect(container.querySelectorAll('.j-sacred-photo img')).toHaveLength(1);expect(screen.getByRole('img',{name:'A devotional photograph 1'})).toBeVisible();
 await user.click(screen.getByRole('button',{name:/Continue to the next blessing/}));expect(container.querySelectorAll('.j-sacred-photo img')).toHaveLength(0);expect(screen.getByText('BLESSING 2 / 2 · Peace')).toBeVisible();
 expect(container.querySelectorAll('.dev-thumbnails')).toHaveLength(0);
});
it('passes the selected blessing into the generated keepsake',async()=>{
 const user=userEvent.setup();const create=vi.fn().mockResolvedValue(new Blob(['png']));vi.stubGlobal('URL',Object.assign(URL,{createObjectURL:vi.fn(()=> 'blob:test'),revokeObjectURL:vi.fn()}));
 vi.spyOn(HTMLAnchorElement.prototype,'click').mockImplementation(()=>{});
 const {container}=renderJourney({createKeepsake:create});
 await user.click(screen.getByRole('button',{name:'Pause animations'}));
 for(const id of ['invitation','gate','blessings'])await useKey(user,container,id);
 await user.click(within(section(container,'blessings')).getByRole('button',{name:'Courage'}));
 for(const id of ['wishes','lantern','memories','celebration','letter','keepsake'])await useKey(user,container,id);
 await user.click(screen.getByRole('button',{name:'Save your birthday keepsake'}));expect(create.mock.calls[0][0].finalMessage).toMatch(/May you trust your abilities/);
 expect(await screen.findByText(/Your keepsake is ready/)).toBeVisible();
},15000);
it('edits bounded chapter settings and ordering through the studio component',async()=>{
 const onChange=vi.fn();const user=userEvent.setup();render(<JourneyEditor value={defaultJourney} media={[]} onChange={onChange} onLetter={vi.fn()}/>);
 await user.click(screen.getByRole('checkbox',{name:/Attempt music playback/}));expect(onChange.mock.lastCall[0].autoplay).toBe(false);
 await user.click(screen.getByRole('button',{name:'Move gate chapter up'}));expect(onChange.mock.lastCall[0].chapters[0].id).toBe('gate');
 fireEvent.change(screen.getByLabelText('Motion intensity'),{target:{value:'none'}});expect(onChange.mock.lastCall[0].intensity).toBe('none');
});

it('switches through all nine sequence tracks using one looping audio element',async()=>{
 const {container,rerender}=render(<JourneyMusic chapters={chapters} active={chapters[0].id} autoplay defaultVolume={.28}/>);
 const audio=container.querySelector('audio');await act(async()=>{});
 for(const chapter of chapters.slice(1)){
  rerender(<JourneyMusic chapters={chapters} active={chapter.id} autoplay defaultVolume={.28}/>);
  await act(async()=>{});expect(container.querySelectorAll('audio')).toHaveLength(1);expect(container.querySelector('audio')).toBe(audio);expect(audio).toHaveAttribute('src',chapter.track.src);
 }
 expect(new Set(chapters.map(c=>c.track.src)).size).toBe(9);expect(audio.loop).toBe(true);expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(9);
});
it('retries autoplay from keyboard navigation and removes listeners after unmount',async()=>{
 const play=HTMLMediaElement.prototype.play;play.mockRejectedValueOnce(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
 const {unmount}=render(<JourneyMusic chapters={chapters} active="invitation" autoplay defaultVolume={.28}/>);await act(async()=>{});
 fireEvent.keyDown(document.body,{key:'Tab'});await waitFor(()=>expect(play).toHaveBeenCalledTimes(2));unmount();fireEvent.pointerDown(document.body);expect(play).toHaveBeenCalledTimes(2);
});

it('retries a blocked arrival from a touch completion without displaying any play prompt',async()=>{
 HTMLMediaElement.prototype.play.mockRejectedValueOnce(Object.assign(new Error('blocked'),{name:'NotAllowedError'}));
 render(<JourneyMusic chapters={chapters} active="invitation" autoplay defaultVolume={.28}/>);await act(async()=>{});
 fireEvent.touchEnd(document.body);await waitFor(()=>expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2));
 fireEvent.click(screen.getByRole('button',{name:'Sound settings'}));expect(screen.queryByText(/Turn music on|Resume soundtrack/)).not.toBeInTheDocument();
});

it('offers Growing Key on a fresh visit and opens wishes without a previous chapter',async()=>{
 const user=userEvent.setup();const {container}=renderJourney();const wishes=section(container,'wishes');
 expect(within(wishes).getByRole('button',{name:'Choose the Growing Key'})).toBeVisible();
 expect(within(wishes).queryByRole('button',{name:'Return to the previous chapter'})).not.toBeInTheDocument();
 expect(wishes.querySelector('.j-chapter-body')).toBeNull();expect(canUnlock('wishes',chapters,[])).toBe(true);
 expect(canUnlock('missing',chapters,[])).toBe(false);expect(canUnlock('wishes',chapters.filter(c=>c.id!=='wishes'),[])).toBe(false);
 await useKey(user,container,'wishes');expect(wishes.querySelector('.j-chapter-body')).not.toBeNull();
 expect(JSON.parse(localStorage.getItem(progressKey)).unlocked).toContain('wishes');
 expect(section(container,'blessings').querySelector('.j-chapter-body')).toBeNull();
});

it('shows the Memory Key without previous progress and reveals its photo gallery only after using the key',async()=>{
 const user=userEvent.setup();const {container}=renderJourney();const cabinet=section(container,'memories');
 expect(within(cabinet).getByRole('button',{name:'Choose the Memory Key'})).toBeVisible();
 expect(within(cabinet).queryByRole('button',{name:'Return to the previous chapter'})).not.toBeInTheDocument();
 expect(cabinet.querySelector('.j-chapter-body')).toBeNull();expect(canUnlock('memories',chapters,[])).toBe(true);
 expect(canUnlock('memories',chapters.filter(c=>c.id!=='memories'),[])).toBe(false);
 await useKey(user,container,'memories');expect(cabinet.querySelector('.j-memory-cabinet')).not.toBeNull();
 expect(JSON.parse(localStorage.getItem(progressKey)).unlocked).toContain('memories');
 expect(section(container,'lantern').querySelector('.j-chapter-body')).toBeNull();
});
it('keeps the redesigned Birthday Pavilion behind the Celebration Key',async()=>{localStorage.setItem(progressKey,JSON.stringify({v:2,unlocked:chapters.map(c=>c.id),active:'celebration',wish:'',seen:[]}));const user=userEvent.setup();const {container}=renderJourney();expect(screen.queryByRole('region',{name:'Your birthday pavilion'})).not.toBeInTheDocument();await useKey(user,container,'celebration');expect(screen.getByRole('region',{name:'Your birthday pavilion'})).toBeInTheDocument();expect(screen.getByRole('button',{name:'Untie the ribbon, Anu'})).toBeVisible();});
