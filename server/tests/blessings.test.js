import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import supertest from 'supertest';
import {createApp} from '../src/app.js';
import {createStore,defaults,builtinMusic,builtinBlessings} from '../src/store.js';
import {hashToken} from '../src/services/passwords.js';
import {contentSchema} from '../src/validation.js';
test('migration preserves old data, backs up once and registers supplied media without duplicates',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'anu-migration-'));
 try {
  const old={version:2,revision:9,draft:{...defaults,name:'A private name'},published:{...defaults,name:'A public name'},admins:[{id:'old-admin',passwordHash:'unchanged-hash'}],sessions:[],media:[builtinMusic],mediaKey:'unchanged-key',publishedAt:'2026-01-01'};
  const original=JSON.stringify(old);await writeFile(path.join(directory,'birthday.json'),original);
  const first=createStore(directory);const state=await first.read();
  assert.equal(state.draft.name,old.draft.name);assert.equal(state.published.name,old.published.name);assert.deepEqual(state.admins,old.admins);assert.equal(state.mediaKey,old.mediaKey);assert.equal(state.revision,12);
  assert.equal(await readFile(path.join(directory,'birthday.before-blessings.json'),'utf8'),original);
  assert.equal(state.draft.blessings.photos.length,13);assert.equal(state.draft.photos.length,0);
  for(const m of builtinBlessings.media)assert.ok((await readFile(path.join(directory,'uploads',m.filename))).length>0);
  const second=await createStore(directory).read();assert.equal(second.revision,12);assert.equal(second.media.length,state.media.length);
  await first.update(s=>{s.draft.blessings.enabled=false;s.published.blessings.enabled=false;});assert.equal((await createStore(directory).read()).published.blessings.enabled,false);
 } finally {await rm(directory,{recursive:true,force:true});}
});
test('blessings save, preview, publication, privacy, deletion guards, and MP4 range delivery',async()=>{
 const directory=await mkdtemp(path.join(os.tmpdir(),'anu-blessings-api-'));
 try {
  const store=createStore(directory);await store.ready;
  const token='b'.repeat(64);await store.update(s=>s.sessions.push({tokenHash:hashToken(token),expiresAt:Date.now()+60000}));
  const api=supertest(createApp({store}));const auth={Authorization:`Bearer ${token}`};
  let state=await store.read();let b=state.draft.blessings;
  const pub=await api.get('/api/birthday').expect(200);assert.equal(pub.body.content.blessings.photos.length,13);
  await api.get(pub.body.content.blessings.video.src).set('Range','bytes=0-31').expect(206).expect('Content-Type',/video\/mp4/);
  await api.delete(`/api/admin/media/${b.videoId}`).set(auth).expect(409);
  await api.delete(`/api/admin/media/${b.photos[0].mediaId}`).set(auth).expect(409);
  const originalVideo=await readFile(new URL('../../shared/assets/blessings/'+builtinBlessings.media.find(m=>m.kind==='video').filename,import.meta.url));
  const uploaded=await api.post('/api/admin/media').set(auth).attach('file',originalVideo,'prayer.mp4').expect(201);
  assert.equal(uploaded.body.media.kind,'video');await api.get(`/api/media/${uploaded.body.media.mediaId}/full`).expect(403);
  await api.get(uploaded.body.media.src).set('Range','bytes=0-31').expect(206);
  const target=b.photos[0];b={...b,title:'A saved blessing',featuredId:null,photos:b.photos.map((p,i)=>({...p,visible:i!==0,title:i===1?'An edited title':p.title})),videoId:uploaded.body.media.mediaId};
  const saved=await api.put('/api/admin/draft').set(auth).send({revision:state.revision,content:{...state.draft,blessings:b}}).expect(200);
  const preview=await api.get('/api/admin/preview').set(auth).expect(200);assert.equal(preview.body.content.blessings.title,'A saved blessing');assert.equal(preview.body.content.blessings.photos.length,13);
  const before=await api.get('/api/birthday');assert.notEqual(before.body.content.blessings.title,'A saved blessing');
  await api.post('/api/admin/publish').set(auth).send({revision:saved.body.revision}).expect(200);
  const after=await api.get('/api/birthday').expect(200);assert.equal(after.body.content.blessings.photos.length,12);assert.equal(after.body.content.blessings.title,'A saved blessing');
  await api.get(`/api/media/${target.mediaId}/full`).expect(403);
  await api.delete(`/api/admin/media/${target.mediaId}`).set(auth).expect(409); // hidden references still protect originals
  state=await store.read();const clean={...state.draft,blessings:{...state.draft.blessings,photos:state.draft.blessings.photos.filter(p=>p.id!==target.id)}};
  const removed=await api.put('/api/admin/draft').set(auth).send({revision:state.revision,content:clean}).expect(200);
  await api.delete(`/api/admin/media/${target.mediaId}`).set(auth).expect(409);
  await api.post('/api/admin/publish').set(auth).send({revision:removed.body.revision}).expect(200);
  await api.delete(`/api/admin/media/${target.mediaId}`).set(auth).expect(200);
  const reopened=await createStore(directory).read();assert.equal(reopened.draft.blessings.title,'A saved blessing');assert.ok(!reopened.media.some(m=>m.id===target.mediaId));
  await api.get(`/api/media/${target.mediaId}/full`).expect(404);
  state=await store.read();await api.put('/api/admin/draft').set(auth).send({revision:state.revision,content:{...state.draft,blessings:{...state.draft.blessings,videoId:builtinMusic.id}}}).expect(422);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('strict schema accepts legacy content and rejects invalid featured images and extra fields',()=>{
 assert.equal(contentSchema.parse(defaults).blessings.enabled,false);
 const valid={...defaults,blessings:{...contentSchema.parse(defaults).blessings,photos:builtinBlessings.photos,featuredId:builtinBlessings.photos[0].id}};
 assert.ok(contentSchema.safeParse(valid).success);
 assert.equal(contentSchema.safeParse({...valid,blessings:{...valid.blessings,featuredId:randomUUID()}}).success,false);
 assert.equal(contentSchema.safeParse({...valid,blessings:{...valid.blessings,extra:'no'}}).success,false);
});
