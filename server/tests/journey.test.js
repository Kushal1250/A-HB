import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import supertest from 'supertest';
import {createStore,defaults,builtinMusic,journeyMusic} from '../src/store.js';
import {createApp} from '../src/app.js';
import {hashToken} from '../src/services/passwords.js';
import {contentSchema} from '../src/validation.js';
import {defaultJourney,newLetter} from '../../shared/journey.js';
test('nine distinct local tracks are served through the published chapter sequence',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-nine-tracks-'));
 try{
  const store=createStore(dir),api=supertest(createApp({store}));const r=await api.get('/api/birthday').expect(200);const chapters=r.body.content.journey.chapters;
  assert.equal(chapters.length,9);assert.equal(new Set(chapters.map(c=>c.trackId)).size,9);
  const hashes=[];for(const ch of chapters){assert.equal(ch.track.kind,'audio');await api.get(ch.track.src).set('Range','bytes=0-63').expect(206).expect('Content-Type',/audio\/mpeg/);const media=journeyMusic.find(m=>m.id===ch.trackId);hashes.push(createHash('sha256').update(await readFile(path.join(dir,'uploads',media.filename))).digest('hex'));}
  assert.equal(new Set(hashes).size,9);assert.equal(r.body.content.journey.autoplay,true);assert.equal(r.body.content.letter,newLetter);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('chapter order, music, unlock settings and per-image blessings survive draft, preview and publication',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-journey-save-'));
 try{
  const store=createStore(dir);await store.ready;const token='c'.repeat(64);await store.update(s=>s.sessions.push({tokenHash:hashToken(token),expiresAt:Date.now()+60000}));
  const api=supertest(createApp({store})),auth={Authorization:`Bearer ${token}`};let state=await store.read();
  const content=structuredClone(state.draft);content.journey.autoplay=false;content.journey.volume=.12;content.journey.intensity='none';
  [content.journey.chapters[3],content.journey.chapters[4]]=[content.journey.chapters[4],content.journey.chapters[3]];
  content.journey.chapters[0].instruction='An edited instruction';content.journey.chapters[0].unlock='envelope';content.journey.chapters[0].trackId=journeyMusic[8].id;content.journey.chapters[5].visible=false;
  content.blessings.photos[0].blessing='A birthday wish with room to breathe.';content.blessings.photos[0].reveal='doors';content.blessings.photos[0].theme='A calm beginning';
  const saved=await api.put('/api/admin/draft').set(auth).send({revision:state.revision,content}).expect(200);
  const before=await api.get('/api/birthday');assert.equal(before.body.content.journey.autoplay,true);
  const preview=await api.get('/api/admin/preview').set(auth).expect(200);assert.equal(preview.body.content.journey.volume,.12);assert.match(preview.body.content.journey.chapters[0].track.src,/signature=/);
  await api.post('/api/admin/publish').set(auth).send({revision:saved.body.revision}).expect(200);
  const after=await api.get('/api/birthday').expect(200);assert.equal(after.body.content.journey.autoplay,false);assert.equal(after.body.content.journey.chapters[3].id,'lantern');assert.equal(after.body.content.blessings.photos[0].reveal,'doors');
  const reopened=await createStore(dir).read();assert.deepEqual(reopened.published.journey,content.journey);assert.equal(reopened.published.blessings.photos[0].blessing,content.blessings.photos[0].blessing);
  await api.delete(`/api/admin/media/${journeyMusic[8].id}`).set(auth).expect(409);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('migration preserves custom text, disabled chapters, audio choices and administrator state',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-preserve-'));
 try{
  const initial=createStore(dir);await initial.ready;const state=await initial.read();delete state.journeyVersion;
  state.draft.letter='A private customised letter';state.published.letter='A different published letter';state.draft.journey={...structuredClone(defaultJourney),enabled:false,autoplay:false};state.draft.journey.chapters[0].visible=false;
  state.admins=[{id:'original-admin',passwordHash:'original-hash'}];state.sessions=[{tokenHash:'original-session',expiresAt:7}];
  const raw=JSON.stringify(state);await writeFile(path.join(dir,'birthday.json'),raw);await rm(path.join(dir,'birthday.before-keys.json'));
  const migrated=await createStore(dir).read();assert.equal(migrated.draft.letter,state.draft.letter);assert.equal(migrated.published.letter,state.published.letter);assert.equal(migrated.draft.journey.enabled,false);assert.equal(migrated.draft.journey.chapters[0].visible,false);assert.equal(migrated.draft.journey.autoplay,false);assert.deepEqual(migrated.admins,state.admins);assert.deepEqual(migrated.sessions,state.sessions);
  assert.equal(await readFile(path.join(dir,'birthday.before-keys.json'),'utf8'),raw);const again=await createStore(dir).read();assert.equal(again.revision,migrated.revision);assert.equal(again.media.length,migrated.media.length);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('new settings reject invalid track kinds, duplicate chapter IDs, unsupported effects and invalid volumes',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-invalid-settings-'));
 try{
  const store=createStore(dir);await store.ready;const state=await store.read();const base=state.draft;
  for(const volume of [-1,1.1,'loud'])assert.equal(contentSchema.safeParse({...base,journey:{...base.journey,volume}}).success,false);
  const dup=structuredClone(base);dup.journey.chapters[1].id=dup.journey.chapters[0].id;assert.equal(contentSchema.safeParse(dup).success,false);
  const bad=structuredClone(base);bad.blessings.photos[0].reveal='spin-the-deity';assert.equal(contentSchema.safeParse(bad).success,false);
  const token='d'.repeat(64);await store.update(s=>s.sessions.push({tokenHash:hashToken(token),expiresAt:Date.now()+60000}));const api=supertest(createApp({store}));
  const incorrect=structuredClone(base);incorrect.journey.chapters[0].trackId=base.blessings.photos[0].mediaId;
  await api.put('/api/admin/draft').set('Authorization',`Bearer ${token}`).send({revision:state.revision,content:incorrect}).expect(422);
 }finally{await rm(dir,{recursive:true,force:true});}
});
