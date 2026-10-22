import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import supertest from "supertest";
import sharp from "sharp";
import { createApp } from "../src/app.js";
import { createStore, defaults } from "../src/store.js";
import { hashPassword, hashToken } from "../src/services/passwords.js";
let directory, store, api, token, mediaId, photoId;
const auth = () => ({ Authorization: `Bearer ${token}` });
before(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "anu-local-test-"));
  store = createStore(directory);
  await store.ready;
  await store.update((s) =>
    s.admins.push({
      id: randomUUID(),
      email: "test@example.com",
      passwordHash: "",
    }),
  );
  const passwordHash = await hashPassword("a-long-local-password");
  await store.update((s) => {
    s.admins[0].passwordHash = passwordHash;
  });
  api = supertest(createApp({ store }));
});
after(async () => {
  await rm(directory, { recursive: true, force: true });
});
test("local server readiness and published defaults need no cloud services", async () => {
  await api
    .get("/api/health")
    .expect(200)
    .expect((r) => assert.equal(r.body.storage, "local"));
  const r = await api.get("/api/birthday").expect(200);
  assert.equal(r.body.content.name, "ANU PATEL");
  assert.equal(r.body.content.sender, "KUSHAL PATEL");
  assert.equal(r.body.content.birthday, "2026-10-24");
  assert.equal(r.body.content.music.kind, "audio");
  await api
    .get(r.body.content.music.src)
    .set("Range", "bytes=0-43")
    .expect(206)
    .expect("Content-Type", /audio\/wav/);
  assert.ok(!("admins" in r.body));
  assert.ok(!("draft" in r.body));
});
test("local-only Host and Origin guard rejects other websites", async () => {
  await api.get("/api/health").set("Host", "attacker.example:3000").expect(403);
  await api
    .post("/api/auth/login")
    .set("Origin", "https://attacker.example")
    .send({})
    .expect(403);
});
test("admin mutations and draft retrieval require authentication", async () => {
  await api.get("/api/admin/draft").expect(401);
  await api.put("/api/admin/draft").send({}).expect(401);
  await api
    .post("/api/admin/media")
    .attach("file", Buffer.from("no"), "a.png")
    .expect(401);
  await api.post("/api/admin/publish").send({ revision: 0 }).expect(401);
});
test("login rejects wrong password and creates a hashed session", async () => {
  await api
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "wrong" })
    .expect(401);
  const r = await api
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "a-long-local-password" })
    .expect(200);
  token = r.body.token;
  const s = await store.read();
  assert.ok(s.sessions.some((x) => x.tokenHash === hashToken(token)));
  assert.ok(!JSON.stringify(s).includes(token));
});
test("private draft saves persist, reject stale revisions and do not publish", async () => {
  const { body } = await api.get("/api/admin/draft").set(auth()).expect(200);
  const content = { ...body.content, name: "ANU PRIVATE DRAFT" };
  await api
    .put("/api/admin/draft")
    .set(auth())
    .send({ revision: body.revision, content })
    .expect(200);
  await api
    .put("/api/admin/draft")
    .set(auth())
    .send({ revision: body.revision, content })
    .expect(409);
  const pub = await api.get("/api/birthday").expect(200);
  assert.equal(pub.body.content.name, "ANU PATEL");
  const preview = await api.get("/api/admin/preview").set(auth()).expect(200);
  assert.equal(preview.body.content.name, "ANU PRIVATE DRAFT");
  const reopened = createStore(directory);
  assert.equal((await reopened.read()).draft.name, "ANU PRIVATE DRAFT");
});
test("publication uses the current saved revision only", async () => {
  const s = await store.read();
  await api
    .post("/api/admin/publish")
    .set(auth())
    .send({ revision: s.revision - 1 })
    .expect(409);
  await api
    .post("/api/admin/publish")
    .set(auth())
    .send({ revision: s.revision })
    .expect(200);
  await api
    .get("/api/birthday")
    .expect(200)
    .expect((r) => assert.equal(r.body.content.name, "ANU PRIVATE DRAFT"));
});
test("schema rejects invalid dates, missing media and unsafe fields", async () => {
  const { body } = await api.get("/api/admin/draft").set(auth());
  for (const patch of [
    { birthday: "2026-02-31" },
    { birthday: "2026-13-01" },
    { timezone: "Invalid/Timezone" },
    { extra: "unsafe" },
    { musicId: "012345678901234567890123" },
    { colors: { pink: "javascript:bad", lavender: "#ffffff" } },
  ])
    await api
      .put("/api/admin/draft")
      .set(auth())
      .send({ revision: body.revision, content: { ...body.content, ...patch } })
      .expect(422);
});
test("real image upload writes processed images and protects draft-only files", async () => {
  const image = await sharp({
    create: { width: 2200, height: 1600, channels: 3, background: "#dfb754" },
  })
    .jpeg()
    .toBuffer();
  const r = await api
    .post("/api/admin/media")
    .set(auth())
    .attach("file", image, "memory.jpg")
    .expect(201);
  mediaId = r.body.media.mediaId;
  await api.get(`/api/media/${mediaId}/full`).expect(403);
  const full = await api.get(r.body.media.src).expect(200);
  const metadata = await sharp(full.body).metadata();
  assert.equal(metadata.format, "webp");
  assert.ok(metadata.width <= 2000);
  const thumb = await api.get(r.body.media.thumbnail).expect(200);
  assert.ok((await sharp(thumb.body).metadata()).width <= 640);
  await api
    .get(`/api/media/${mediaId}/full?expires=1&signature=${"a".repeat(64)}`)
    .expect(403);
});
test("spoofed and oversized file uploads are rejected", async () => {
  await api
    .post("/api/admin/media")
    .set(auth())
    .attach("file", Buffer.from("not a picture"), "photo.jpg")
    .expect(415);
  await api
    .post("/api/admin/media")
    .set(auth())
    .attach("file", Buffer.alloc(15 * 1024 * 1024 + 1), "huge.wav")
    .expect(413);
  await api.post("/api/admin/media").set(auth()).expect(422);
});
test("adding/publishing/removing a real photo follows snapshot reference rules", async () => {
  let s = await store.read();
  photoId = randomUUID();
  const content = {
    ...s.draft,
    photos: [
      {
        id: photoId,
        mediaId,
        caption: "A real test photo",
        alt: "A generated yellow test image",
        date: "",
      },
    ],
  };
  await api
    .put("/api/admin/draft")
    .set(auth())
    .send({ revision: s.revision, content })
    .expect(200);
  await api.delete(`/api/admin/media/${mediaId}`).set(auth()).expect(409);
  s = await store.read();
  await api
    .post("/api/admin/publish")
    .set(auth())
    .send({ revision: s.revision })
    .expect(200);
  await api.get(`/api/media/${mediaId}/full`).expect(200);
  s = await store.read();
  await api
    .put("/api/admin/draft")
    .set(auth())
    .send({ revision: s.revision, content: { ...s.draft, photos: [] } })
    .expect(200);
  await api.delete(`/api/admin/media/${mediaId}`).set(auth()).expect(409);
  s = await store.read();
  await api
    .post("/api/admin/publish")
    .set(auth())
    .send({ revision: s.revision })
    .expect(200);
  await api.delete(`/api/admin/media/${mediaId}`).set(auth()).expect(200);
  await api.get(`/api/media/${mediaId}/full`).expect(404);
});
test("serialized local writes do not lose simultaneous updates", async () => {
  await Promise.all(
    Array.from({ length: 12 }, () =>
      store.update((s) => {
        s.testCounter = (s.testCounter || 0) + 1;
      }),
    ),
  );
  assert.equal((await store.read()).testCounter, 12);
  const text = await readFile(path.join(directory, "birthday.json"), "utf8");
  assert.doesNotThrow(() => JSON.parse(text));
});
test("SPA homepage and admin share the same local server", async () => {
  await api.get("/").expect(200).expect("Content-Type", /html/);
  await api.get("/admin").expect(200).expect("Content-Type", /html/);
  await api.get("/api/unknown").expect(404);
});

test("local WAV uploads are durable and support audio range delivery", async () => {
  const wav = Buffer.alloc(844);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(wav.length - 8, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(8000, 24);
  wav.writeUInt32LE(16000, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(800, 40);
  const result = await api
    .post("/api/admin/media")
    .set(auth())
    .attach("file", wav, "birthday.wav")
    .expect(201);
  assert.equal(result.body.media.kind, "audio");
  await api
    .get(result.body.media.src)
    .set("Range", "bytes=0-43")
    .expect(206)
    .expect("Content-Type", /audio\/wav/);
  const state = await store.read();
  assert.ok(state.media.some((m) => m.id === result.body.media.mediaId));
});
test("invalid existing local JSON is never overwritten", async () => {
  const broken = await mkdtemp(path.join(os.tmpdir(), "anu-broken-test-"));
  const { writeFile } = await import("node:fs/promises");
  try {
    await writeFile(path.join(broken, "birthday.json"), "not valid json");
    const invalid = createStore(broken);
    await assert.rejects(invalid.ready, /not overwritten/);
    assert.equal(
      await readFile(path.join(broken, "birthday.json"), "utf8"),
      "not valid json",
    );
  } finally {
    await rm(broken, { recursive: true, force: true });
  }
});
test("expired sessions and logout revoke access", async () => {
  const expired = "a".repeat(64);
  await store.update((s) =>
    s.sessions.push({
      tokenHash: hashToken(expired),
      adminId: s.admins[0].id,
      expiresAt: Date.now() - 1000,
    }),
  );
  await api
    .get("/api/admin/draft")
    .set("Authorization", `Bearer ${expired}`)
    .expect(401);
  await api.post("/api/auth/logout").set(auth()).expect(200);
  await api.get("/api/admin/draft").set(auth()).expect(401);
});
