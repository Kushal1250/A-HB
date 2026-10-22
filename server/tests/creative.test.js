import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import supertest from 'supertest';
import {createStore} from '../src/store.js';
import {createApp} from '../src/app.js';
import {hashToken} from '../src/services/passwords.js';
import {contentSchema} from '../src/validation.js';
import {revealKinds} from '../../shared/journey.js';
test('creative migration backs up once, upgrades stock effects and preserves custom choices',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-creative-preserve-'));
 try{const store=createStore(dir);let state=await store.read();delete state.creativeVersion;
  for(const key of ['draft','published']){state[key].letter='A personally written letter';state[key].journey.enabled=false;state[key].journey.scratchThreshold=.6;state[key].journey.centralWish='My personal central wish';state[key].journey.chapters[0].unlock='seal';state[key].journey.chapters[1].unlock='pattern';state[key].blessings.photos[0].reveal='page';state[key].blessings.photos[7].reveal='curtains';}
  state.admins=[{id:'keep-admin',passwordHash:'keep-hash'}];const raw=JSON.stringify(state);await writeFile(path.join(dir,'birthday.json'),raw);await rm(path.join(dir,'birthday.before-creative.json'));
  const next=await createStore(dir).read();assert.equal(await readFile(path.join(dir,'birthday.before-creative.json'),'utf8'),raw);assert.deepEqual(next.admins,state.admins);assert.equal(next.draft.letter,state.draft.letter);assert.equal(next.draft.journey.enabled,false);assert.equal(next.draft.journey.centralWish,'My personal central wish');assert.equal(next.draft.journey.scratchThreshold,.6);assert.equal(next.draft.journey.chapters[0].unlock,'scratch');assert.equal(next.draft.journey.chapters[1].unlock,'pattern');assert.equal(next.draft.blessings.photos[0].reveal,'page');assert.equal(next.draft.blessings.photos[7].reveal,'ribbon');
  const again=await createStore(dir).read();assert.equal(again.revision,next.revision);assert.equal(again.media.length,next.media.length);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('gesture settings, central wish, credits and all reveal styles survive save/preview/publish',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-creative-publish-'));
 try{const store=createStore(dir);let s=await store.read();const token='e'.repeat(64);await store.update(state=>state.sessions.push({tokenHash:hashToken(token),expiresAt:Date.now()+60000}));const api=supertest(createApp({store})),auth={Authorization:`Bearer ${token}`};
  const c=structuredClone(s.draft);c.journey.scratchThreshold=.6;c.journey.shakeSensitivity=20;c.journey.centralWish='A thoughtful birthday wish, edited in the studio.';c.journey.chapters[0].trackTitle='My invitation recording';c.journey.chapters[0].artist='Supplied artist';c.journey.chapters[0].source='Local approved file';c.journey.chapters[0].license='User confirmed recording permission';c.journey.chapters[0].provenance='supplied';c.journey.chapters[0].duration=120;c.blessings.photos=c.blessings.photos.map((p,i)=>({...p,reveal:revealKinds[i%13]}));
  const saved=await api.put('/api/admin/draft').set(auth).send({revision:s.revision,content:c}).expect(200);const before=await api.get('/api/birthday');assert.notEqual(before.body.content.journey.centralWish,c.journey.centralWish);
  const preview=await api.get('/api/admin/preview').set(auth).expect(200);assert.equal(preview.body.content.journey.scratchThreshold,.6);assert.equal(preview.body.content.journey.chapters[0].trackTitle,'My invitation recording');assert.equal(new Set(preview.body.content.blessings.photos.map(p=>p.reveal)).size,13);
  await api.post('/api/admin/publish').set(auth).send({revision:saved.body.revision}).expect(200);const published=await api.get('/api/birthday').expect(200);assert.equal(published.body.content.journey.shakeSensitivity,20);assert.equal(published.body.content.journey.centralWish,c.journey.centralWish);assert.deepEqual((await createStore(dir).read()).published.journey,c.journey);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('unsafe thresholds and unsupported metadata are rejected',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-creative-validation-'));
 try{const s=await createStore(dir).read(),c=s.draft;
  for(const patch of [{scratchThreshold:.01},{scratchThreshold:.9},{shakeSensitivity:1},{shakeSensitivity:100},{centralWish:'x'.repeat(3001)}])assert.equal(contentSchema.safeParse({...c,journey:{...c.journey,...patch}}).success,false);
  const bad=structuredClone(c);bad.journey.chapters[0].provenance='unknown';assert.equal(contentSchema.safeParse(bad).success,false);
 }finally{await rm(dir,{recursive:true,force:true});}
});
