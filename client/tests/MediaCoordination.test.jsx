import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Birthday from '../src/Birthday';
import defaults from '../../shared/defaults.json';
import {emptyBlessings} from '../../shared/blessings.js';
it('coordinates music and video without automatically resuming either',async()=>{
 const paused=[];
 vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(function(){paused.push(this.tagName);});
 const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined);
 const user=userEvent.setup();const {container}=render(<Birthday content={{...defaults,music:{src:'/music.wav'},blessings:{...emptyBlessings,enabled:true,video:{src:'/clip.mp4'}}}}/>);
 await user.click(screen.getByRole('button',{name:/Unlock the garden/}));
 await user.click(screen.getByRole('button',{name:/Open the Blessings Garden/}));
 const video=container.querySelector('video'),audio=container.querySelector('audio');
 fireEvent.play(video);expect(paused).toContain('AUDIO');
 fireEvent.pause(video);expect(play).not.toHaveBeenCalled();
 fireEvent.play(audio);expect(paused).toContain('VIDEO');
 await user.click(screen.getByRole('button',{name:/Continue to the birthday garden/}));expect(paused.filter(x=>x==='VIDEO').length).toBeGreaterThan(1);
});
