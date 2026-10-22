import {test} from 'node:test';import assert from 'node:assert/strict';import {mkdtemp,rm} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {randomUUID} from 'node:crypto';import supertest from 'supertest';import {createStore} from '../src/store.js';import {createApp} from '../src/app.js';import {hashToken} from '../src/services/passwords.js';import {contentSchema} from '../src/validation.js';
test('memory videos remain private until published, support ranges/posters and cannot be deleted while referenced',async()=>{
 const dir=await mkdtemp(path.join(os.tmpdir(),'anu-memory-videos-'));
 try{
 const store=createStore(dir);await store.ready;const state=await store.read();const video=state.media.find(m=>m.kind==='video');assert(video);const token='e'.repeat(64);const item={id:randomUUID(),mediaId:video.id,title:'A local clip',caption:'A thought to keep.',visible:true};
 await store.update(s=>{for(const side of ['draft','published'])s[side].blessings.videoId=null;s.draft.memoryVideos=[item];s.sessions.push({tokenHash:hashToken(token),expiresAt:Date.now()+60000});});
 const api=supertest(createApp({store})),auth={Authorization:`Bearer ${token}`};
 await api.get(`/api/media/${video.id}/full`).expect(403);const initial=await api.get('/api/birthday').expect(200);assert.deepEqual(initial.body.content.memoryVideos,[]);
 const preview=await api.get('/api/admin/preview').set(auth).expect(200);assert.match(preview.body.content.memoryVideos[0].src,/signature=/);await api.get(preview.body.content.memoryVideos[0].src).set('Range','bytes=0-31').expect(206);
 await api.post('/api/admin/publish').set(auth).send({revision:(await store.read()).revision}).expect(200);
 const published=await api.get('/api/birthday').expect(200);assert.equal(published.body.content.memoryVideos[0].caption,item.caption);await api.get(published.body.content.memoryVideos[0].src).set('Range','bytes=0-31').expect(206).expect('Content-Type',/video\/mp4/);
 await api.delete(`/api/admin/media/${video.id}`).set(auth).expect(409);
 const latest=await store.read();const bad=structuredClone(latest.draft);bad.memoryVideos[0].mediaId=latest.media.find(m=>m.kind==='image').id;await api.put('/api/admin/draft').set(auth).send({revision:latest.revision,content:bad}).expect(422);
 const hidden=structuredClone(latest.draft);hidden.memoryVideos[0].visible=false;const saved=await api.put('/api/admin/draft').set(auth).send({revision:latest.revision,content:hidden}).expect(200);await api.post('/api/admin/publish').set(auth).send({revision:saved.body.revision}).expect(200);
 assert.deepEqual((await api.get('/api/birthday')).body.content.memoryVideos,[]);await api.get(`/api/media/${video.id}/full`).expect(403);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('memory-video schema accepts old content and rejects duplicate IDs and oversized captions',()=>{
 const base={id:randomUUID(),mediaId:'a'.repeat(24),title:'Clip',caption:'A caption',visible:true};
 assert.equal(contentSchema.shape.memoryVideos.safeParse([base]).success,true);assert.equal(contentSchema.shape.memoryVideos.safeParse([base,base]).success,false);assert.equal(contentSchema.shape.memoryVideos.safeParse([{...base,caption:'x'.repeat(181)}]).success,false);assert.deepEqual(contentSchema.shape.memoryVideos.parse(undefined),[]);
});
test('memory-video collection supports the larger gallery and enforces its upper bound',()=>{
 const clips=Array.from({length:100},()=>({id:randomUUID(),mediaId:'a'.repeat(24),title:'Clip',caption:'A moment to replay.',visible:true}));
 assert.equal(contentSchema.shape.memoryVideos.safeParse(clips.slice(0,52)).success,true);
 assert.equal(contentSchema.shape.memoryVideos.safeParse(clips).success,true);
 assert.equal(contentSchema.shape.memoryVideos.safeParse([...clips,{...clips[0],id:randomUUID()}]).success,false);
});
