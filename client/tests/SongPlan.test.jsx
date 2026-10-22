import {it,expect,vi} from 'vitest';
import {render,screen,fireEvent} from '@testing-library/react';
import JourneyEditor from '../src/JourneyEditor';
import {birthdaySongPlan,assignUploadedSong} from '../../shared/song-plan.js';
import {defaultJourney} from '../../shared/journey.js';
it('maps nine requested songs to distinct stable chapter IDs',()=>{
 expect(birthdaySongPlan.map(p=>p.song)).toEqual(['Iktara','Ilahi','Achyutam Keshavam','Aashayein','Kun Faya Kun','Yaaron','Baar Baar Din Ye Aaye','Tera Yaar Hoon Main','Love You Zindagi']);
 expect(new Set(birthdaySongPlan.map(p=>p.id)).size).toBe(9);
 expect(birthdaySongPlan.map(p=>p.id)).toEqual(defaultJourney.chapters.map(c=>c.id));
});
it('assigns each uploaded recording only to its target chapter and retains unrelated settings',()=>{
 for(const p of birthdaySongPlan){
  const before=structuredClone(defaultJourney);before.chapters[0].instruction='Keep my words';
  const after=assignUploadedSong(before,p.id,{mediaId:'uploaded-audio',kind:'audio',originalName:p.song+'.mp3'});
  for(const ch of after.chapters){if(ch.id===p.id){expect(ch.trackId).toBe('uploaded-audio');expect(ch.trackTitle).toBe(p.song+'.mp3');expect(ch.provenance).toBe('supplied');}else expect(ch).toEqual(before.chapters.find(c=>c.id===ch.id));}
  expect(before.chapters.every(c=>c.trackId!=='uploaded-audio')).toBe(true);expect(after.autoplay).toBe(before.autoplay);
 }
});
it('rejects invalid media and removed chapter assignments',()=>{
 expect(()=>assignUploadedSong(defaultJourney,'gate',{kind:'image',mediaId:'a'})).toThrow(/audio/);
 expect(()=>assignUploadedSong(defaultJourney,'removed',{kind:'audio',mediaId:'a'})).toThrow(/chapter/);
});
it('offers all nine song uploads and dispatches the correct chapter ID',()=>{
 const onUploadSong=vi.fn(),onChange=vi.fn();render(<JourneyEditor value={defaultJourney} media={[]} onChange={onChange} onLetter={vi.fn()} onUploadSong={onUploadSong}/>);
 for(const plan of birthdaySongPlan){const input=screen.getByLabelText(`Upload ${plan.song} for ${defaultJourney.chapters.find(c=>c.id===plan.id).title}`);const file=new File(['recording'],plan.song+'.mp3',{type:'audio/mpeg'});fireEvent.change(input,{target:{files:[file]}});expect(onUploadSong).toHaveBeenLastCalledWith(file,plan.id);}
 expect(onChange).not.toHaveBeenCalled();
});
