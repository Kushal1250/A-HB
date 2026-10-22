import {it,expect,vi,beforeEach,afterEach} from 'vitest';
import {render,screen,within,fireEvent,act,waitFor} from '@testing-library/react';
import KeyedBirthday from '../src/KeyedBirthday';
import defaults from '../../shared/defaults.json';
import {defaultJourney} from '../../shared/journey.js';
import {progressKey} from '../src/journeyState';
const chapters=defaultJourney.chapters.map((ch,i)=>({...ch,track:{src:`/chapter-${i}.mp3`}}));
const section=(container,id)=>container.querySelector(`[data-chapter="${id}"]`);
let observer;
beforeEach(()=>{
 Element.prototype.scrollIntoView=vi.fn();
 localStorage.clear();localStorage.setItem(progressKey,JSON.stringify({v:2,unlocked:chapters.map(c=>c.id),active:'letter'}));
 vi.spyOn(HTMLMediaElement.prototype,'play').mockImplementation(function(){fireEvent.play(this);return Promise.resolve();});
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){fireEvent.pause(this);});
 vi.stubGlobal('IntersectionObserver',class{constructor(fn){observer=fn;}observe(){}disconnect(){}});
});
afterEach(()=>vi.unstubAllGlobals());
function setup(order=chapters){return render(<KeyedBirthday content={{...defaults,blessings:{...defaults.blessings,enabled:true},journey:{...defaultJourney,intensity:'none',chapters:order}}} createKeepsake={vi.fn()}/>);}
async function open(container,id){
 const s=section(container,id);await act(async()=>{fireEvent.click(within(s).getByRole('button',{name:/Choose the/}));});await act(async()=>{fireEvent.click(within(s).getByRole('button',{name:'Use this key to open'}));await new Promise(r=>setTimeout(r,20));});
 await waitFor(()=>expect(s.querySelector('.j-chapter-body')).not.toBeNull());await act(async()=>{await new Promise(r=>requestAnimationFrame(r));});
}
function expectDestination(container,id){
 expect(Element.prototype.scrollIntoView.mock.instances.at(-1)).toBe(section(container,id));
 expect(Element.prototype.scrollIntoView.mock.lastCall[0]).toEqual({behavior:'instant',block:'start'});
 expect(within(screen.getByRole('navigation',{name:'Garden chapter map'})).getAllByRole('button').find(b=>b.getAttribute('aria-current')==='step')).toHaveTextContent(chapters.find(c=>c.id===id).title);
 expect(document.activeElement).toBe(section(container,id).querySelector('.j-chapter-heading h2'));
}
it('every Continue button lands on exactly the next chapter after the open body collapses',async()=>{
 const {container}=setup();
 const scroll=Element.prototype.scrollIntoView;scroll.mockClear();
 scroll.mockImplementation(function(){expect(container.querySelectorAll('.j-chapter-body')).toHaveLength(0);});
 for(let i=0;i<chapters.length-1;i++){
  await open(container,chapters[i].id);
  fireEvent.click(within(section(container,chapters[i].id)).getByRole('button',{name:`Continue to ${chapters[i+1].title} →`}));
  expectDestination(container,chapters[i+1].id);
 }
 await open(container,'keepsake');expect(within(section(container,'keepsake')).queryByRole('button',{name:/^Continue to/})).not.toBeInTheDocument();
});
it('all nine map buttons ignore stale observer callbacks and close the previous body',async()=>{
 const {container}=setup();
 for(const ch of chapters){
  await open(container,'invitation');
  fireEvent.click(within(screen.getByRole('navigation',{name:'Garden chapter map'})).getAllByRole('button')[chapters.indexOf(ch)]);
  expectDestination(container,ch.id);expect(container.querySelectorAll('.j-chapter-body')).toHaveLength(0);
  chapters.forEach(c=>vi.spyOn(section(container,c.id),'getBoundingClientRect').mockReturnValue({top:c.id==='wishes'?70:2000,bottom:c.id==='wishes'?500:2500}));
  await act(async()=>{observer([{target:section(container,'wishes'),isIntersecting:true}]);await new Promise(r=>setTimeout(r,200));});
  expectDestination(container,ch.id);expect(container.querySelector('audio')).toHaveAttribute('src',ch.track.src);
 }
});
it('manual scrolling tracks the actual visible section without collapsing the current chapter',async()=>{
 const {container}=setup();await open(container,'invitation');
 chapters.forEach(c=>vi.spyOn(section(container,c.id),'getBoundingClientRect').mockReturnValue({top:c.id==='gate'?70:2000,bottom:c.id==='gate'?500:2500}));
 fireEvent.wheel(window,{deltaY:200});
 // Only a later chapter changed intersection; choose from all section positions.
 await act(async()=>{observer([{target:section(container,'wishes'),isIntersecting:true}]);await new Promise(r=>setTimeout(r,200));});
 expect(section(container,'invitation').querySelector('.j-chapter-body')).not.toBeNull();expect(container.querySelector('audio')).toHaveAttribute('src','/chapter-1.mp3');
});
it('entry, saved resume, replay, reset and prerequisite links choose their explicit destinations',async()=>{
 const {container}=setup();
 fireEvent.click(screen.getByRole('button',{name:'Continue where I left off'}));expectDestination(container,'letter');
 fireEvent.click(screen.getByRole('button',{name:'Open Anu’s Garden'}));expectDestination(container,'invitation');
 await open(container,'gate');fireEvent.click(within(section(container,'gate')).getByRole('button',{name:'Replay this chapter'}));expectDestination(container,'gate');
 fireEvent.click(screen.getByRole('button',{name:'Reset saved progress'}));fireEvent.click(screen.getByRole('button',{name:'Reset my garden progress'}));expectDestination(container,'invitation');
 for(let i=1;i<chapters.length;i++){
  if(['wishes','memories'].includes(chapters[i].id))continue;
  fireEvent.click(within(section(container,chapters[i].id)).getByRole('button',{name:'Return to the previous chapter'}));expectDestination(container,chapters[i-1].id);
 }
});
it('Continue follows the configured visible order when a chapter is hidden or reordered',async()=>{
 const order=[chapters[0],chapters[4],chapters[1],...chapters.slice(5)];const {container}=setup(order);
 await open(container,'invitation');fireEvent.click(screen.getByRole('button',{name:'Continue to The lantern walk →'}));expectDestination(container,'lantern');
});
