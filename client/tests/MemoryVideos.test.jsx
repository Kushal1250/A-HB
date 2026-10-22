import {it,expect,vi} from 'vitest';import {render,screen,fireEvent} from '@testing-library/react';import MemoryVideos from '../src/MemoryVideos';import MemoryVideosEditor from '../src/MemoryVideosEditor';
const clips=[{id:'a',mediaId:'one',title:'A little moment',caption:'A thought to keep.',visible:true,src:'/one.mp4',thumbnail:'/one.webp'},{id:'b',mediaId:'two',title:'Another moment',caption:'A little joy.',visible:true,src:'/two.mp4'},{id:'c',title:'Hidden clip',visible:false,src:'/hidden.mp4'}];
it('shows only visible clips with posters and captions, without autoplay or preloading',()=>{
 const {container}=render(<MemoryVideos videos={clips}/>);expect(container.querySelectorAll('video')).toHaveLength(2);expect(screen.queryByText('Hidden clip')).not.toBeInTheDocument();expect(screen.getByText('A thought to keep.')).toBeVisible();
 for(const video of container.querySelectorAll('video')){expect(video).toHaveAttribute('controls');expect(video).toHaveAttribute('playsinline');expect(video).toHaveAttribute('preload','none');expect(video).not.toHaveAttribute('autoplay');}
 expect(container.querySelector('video')).toHaveAttribute('poster','/one.webp');
});
it('pauses other clips, coordinates music, reports failures and pauses on unmount',()=>{
 const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{}),onVideoPlay=vi.fn();const {container,unmount}=render(<MemoryVideos videos={clips} onVideoPlay={onVideoPlay}/>);const [first,second]=container.querySelectorAll('video');fireEvent.play(first);expect(pause.mock.instances).toContain(second);expect(onVideoPlay).toHaveBeenCalledWith(first);
 fireEvent.error(first);expect(screen.getByRole('status')).toHaveTextContent('This clip could not be loaded');unmount();expect(pause.mock.instances).toContain(first);
});
it('allows captions, visibility and removal to be edited without changing other videos',()=>{
 const onChange=vi.fn();render(<MemoryVideosEditor videos={clips.slice(0,2)} onChange={onChange} onUpload={vi.fn()}/>);fireEvent.change(screen.getAllByLabelText('Video caption')[0],{target:{value:'A new caption'}});expect(onChange.mock.lastCall[0][0].caption).toBe('A new caption');expect(onChange.mock.lastCall[0][1]).toEqual(clips[1]);fireEvent.click(screen.getAllByLabelText('Show this video')[0]);expect(onChange.mock.lastCall[0][0].visible).toBe(false);fireEvent.click(screen.getByRole('button',{name:'Remove video 1 from draft'}));expect(onChange.mock.lastCall[0]).toEqual([clips[1]]);
});
it('shows the requested clips first by stable media ID while preserving captions, hidden clips and remaining order',async()=>{
 const {preferredVideoIds}=await import('../src/memoryVideoOrder');
 const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{});
 const input=[{id:'remaining-a',mediaId:'extra-a',title:'Remaining A',caption:'Keep A',visible:true},...preferredVideoIds.toReversed().map((id,i)=>({id,mediaId:id,title:`Edited title ${i}`,caption:`Caption ${id}`,visible:true})),{id:'remaining-b',mediaId:'extra-b',title:'Remaining B',caption:'Keep B',visible:true}];
 const before=JSON.stringify(input);const {container}=render(<MemoryVideos videos={input}/>);
 const titles=[...container.querySelectorAll('h4')].map(e=>e.textContent);
 expect(titles).toEqual([...preferredVideoIds.map(id=>input.find(v=>v.mediaId===id).title),'Remaining A','Remaining B']);
 expect(JSON.stringify(input)).toBe(before);expect(screen.getByText('Keep A')).toBeVisible();expect(container.querySelectorAll('video')).toHaveLength(input.length);
});
