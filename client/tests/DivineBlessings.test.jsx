import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DivineBlessings from '../src/DivineBlessings';
import BlessingsEditor from '../src/BlessingsEditor';
import {emptyBlessings} from '../../shared/blessings.js';
const photos=[0,1,2].map(i=>({id:`photo-${i}`,mediaId:`media-${i}`,title:`Shrine ${i+1}`,caption:`Caption ${i+1}`,alt:`Devotional view ${i+1}`,visible:i!==2,src:`/photo-${i}.webp`,thumbnail:`/thumb-${i}.webp`}));
const value={...emptyBlessings,enabled:true,photos,featuredId:photos[1].id,video:{src:'/clip.mp4'}};
const props={value,name:'Anu',sender:'KUSHAL PATEL',motion:false,onContinue:vi.fn(),onVideoPlay:vi.fn()};
it('opens immediately without motion and starts at the visible featured image',()=>{
 render(<DivineBlessings {...props}/>);
 expect(screen.getByRole('heading',{name:'Shrine 2'})).toBeVisible();
 expect(screen.getByRole('img',{name:'Devotional view 2'})).toHaveAttribute('src','/photo-1.webp');
 expect(screen.queryByRole('button',{name:/Shrine 3/})).not.toBeInTheDocument();
 expect(screen.queryByRole('button',{name:/Open the Blessings Garden/})).not.toBeInTheDocument();
});
it('reveals the courtyard with a short optional entrance and offers a direct skip',async()=>{
 const user=userEvent.setup();const skip=vi.fn();render(<DivineBlessings {...props} motion onContinue={skip}/>);
 await user.click(screen.getAllByRole('button',{name:/Continue to the birthday garden/})[0]);expect(skip).toHaveBeenCalledOnce();
 await user.click(screen.getByRole('button',{name:/Open the Blessings Garden/}));expect(screen.getByRole('heading',{name:'Shrine 2'})).toBeVisible();
});
it('navigates by thumbnail, buttons and arrows inside the modal, then restores focus',async()=>{
 const user=userEvent.setup();render(<DivineBlessings {...props}/>);
 await user.click(screen.getByRole('button',{name:'Next devotional photograph'}));expect(screen.getByRole('heading',{name:'Shrine 1'})).toBeVisible();
 await user.click(screen.getByRole('button',{name:'View 2: Shrine 2'}));
 const open=screen.getByRole('button',{name:'Open photograph in full view'});await user.click(open);
 const dialog=screen.getByRole('dialog',{name:'Devotional photograph'});
 fireEvent.keyDown(within(dialog).getByRole('button',{name:/Close Devotional/}),{key:'ArrowLeft'});
 expect(within(dialog).getByRole('heading',{name:'Shrine 1'})).toBeVisible();
 fireEvent(dialog,new Event('cancel',{bubbles:true,cancelable:true}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(open).toHaveFocus();
});
it('keeps symbolic flowers bounded and changes the chosen blessing',async()=>{
 const user=userEvent.setup();const {container}=render(<DivineBlessings {...props}/>);
 await user.click(screen.getByRole('button',{name:'Light a Birthday Prayer'}));expect(screen.getByRole('button',{name:'Extinguish the symbolic lamp'})).toHaveAttribute('aria-pressed','true');
 for(let i=0;i<8;i++)await user.click(screen.getByRole('button',{name:'Offer a Flower'}));
 expect(container.querySelectorAll('.dev-flower')).toHaveLength(8);expect(screen.getByRole('button',{name:'Flowers placed with care'})).toBeDisabled();
 await user.click(screen.getByRole('button',{name:'Courage'}));expect(screen.getByText(/May you trust your abilities/)).toBeVisible();
 await user.click(screen.getByRole('button',{name:/A Moment of Gratitude/}));expect(screen.getByText(/Think of one person/)).toBeVisible();
});
it('reports media failures and invokes music coordination on video play',()=>{
 const play=vi.fn();const {container}=render(<DivineBlessings {...props} onVideoPlay={play}/>);
 fireEvent.error(screen.getByRole('img',{name:'Devotional view 2'}));expect(screen.getByText(/This photograph is temporarily unavailable/)).toBeVisible();
 const video=container.querySelector('video');expect(video).not.toHaveAttribute('autoplay');expect(video).toHaveAttribute('preload','none');fireEvent.play(video);expect(play).toHaveBeenCalledOnce();
 fireEvent.error(video);expect(screen.getByText(/This video is temporarily unavailable/)).toBeVisible();
});
it('handles empty and disabled legacy chapters',()=>{
 const {rerender}=render(<DivineBlessings {...props} value={undefined}/>);expect(screen.queryByRole('heading')).not.toBeInTheDocument();
 rerender(<DivineBlessings {...props} value={{...value,photos:[]}}/>);expect(screen.getByText(/Add them in the studio/)).toBeVisible();
});
it('admin hiding the featured image clears its featured selection and supports ordering',async()=>{
 const change=vi.fn();const user=userEvent.setup();render(<BlessingsEditor value={value} media={[]} onChange={change} progress={null}/>);
 await user.click(screen.getAllByRole('checkbox',{name:'Visible in the gallery'})[1]);expect(change.mock.lastCall[0].featuredId).toBeNull();expect(change.mock.lastCall[0].photos[1].visible).toBe(false);
 await user.click(screen.getByRole('button',{name:'Move devotional image 2 up'}));expect(change.mock.lastCall[0].photos[0].id).toBe('photo-1');
 await user.click(screen.getByRole('button',{name:'Remove devotional image 2 from draft'}));expect(change.mock.lastCall[0].photos).toHaveLength(2);expect(change.mock.lastCall[0].featuredId).toBeNull();
});
