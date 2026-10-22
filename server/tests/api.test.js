import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import supertest from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
process.env.CLOUDINARY_CLOUD_NAME = "test-only";
process.env.CLOUDINARY_API_KEY = "test-only";
process.env.CLOUDINARY_API_SECRET = "not-a-real-secret";
const { createApp } = await import("../src/app.js");
const { Admin, Birthday, Session, Media, connectDatabase } =
  await import("../src/models.js");
const { seed, defaults } = await import("../src/services/content.js");
const { hashPassword, hashToken } =
  await import("../src/services/passwords.js");
const { contentSchema } = await import("../src/validation.js");
let mongo, api, token;
before(
  async () => {
    if (process.env.TEST_MONGODB_URI) {
      if (
        !/^\/birthday_test_[a-z0-9_-]+$/i.test(
          new URL(process.env.TEST_MONGODB_URI).pathname,
        )
      )
        throw new Error(
          "TEST_MONGODB_URI must use a disposable birthday_test_ database name.",
        );
      await connectDatabase(process.env.TEST_MONGODB_URI);
    } else {
      mongo = await MongoMemoryServer.create();
      await connectDatabase(mongo.getUri());
    }
    await mongoose.connection.dropDatabase();
    await seed();
    await Admin.create({
      email: "test@example.com",
      passwordHash: await hashPassword("a-long-test-password"),
    });
    api = supertest(createApp());
  },
  { timeout: 180000 },
);
after(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
});
const auth = () => ({ Authorization: `Bearer ${token}` });
test("health verifies a working MongoDB connection", async () => {
  await api
    .get("/api/health")
    .expect(200)
    .expect((r) => assert.equal(r.body.status, "ok"));
});
test("public content is published, never the admin document", async () => {
  const r = await api.get("/api/birthday").expect(200);
  assert.equal(r.body.content.name, "ANU PATEL");
  assert.equal(r.body.content.music, null);
  assert.ok(!("draft" in r.body));
  assert.ok(!("revision" in r.body));
});
test("protected endpoints reject unauthenticated users", async () => {
  await api.get("/api/admin/draft").expect(401);
  await api.put("/api/admin/draft").send({}).expect(401);
  await api.post("/api/admin/publish").send({ revision: 0 }).expect(401);
  await api
    .post("/api/admin/media")
    .attach("file", Buffer.from("fake"), "a.png")
    .expect(401);
  await api.delete("/api/admin/media/012345678901234567890123").expect(401);
});
test("incorrect password and unknown email return the same generic error", async () => {
  const a = await api
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "wrong" })
    .expect(401);
  const b = await api
    .post("/api/auth/login")
    .send({ email: "none@example.com", password: "wrong" })
    .expect(401);
  assert.equal(a.body.error.message, b.body.error.message);
});
test("login creates a hashed, expiring server-side session", async () => {
  const r = await api
    .post("/api/auth/login")
    .send({ email: "test@example.com", password: "a-long-test-password" })
    .expect(200);
  token = r.body.token;
  assert.match(token, /^[a-f\d]{64}$/);
  const session = await Session.findOne({ tokenHash: hashToken(token) });
  assert.ok(session);
  assert.notEqual(session.tokenHash, token);
  assert.ok(session.expiresAt > new Date());
});
test("saving a draft does not publish it; stale writes are rejected", async () => {
  const r = await api.get("/api/admin/draft").set(auth()).expect(200);
  const draft = { ...r.body.content, name: "PRIVATE DRAFT NAME" };
  const saved = await api
    .put("/api/admin/draft")
    .set(auth())
    .send({ revision: r.body.revision, content: draft })
    .expect(200);
  assert.equal(saved.body.revision, r.body.revision + 1);
  const pub = await api.get("/api/birthday").expect(200);
  assert.equal(pub.body.content.name, "ANU PATEL");
  const preview = await api.get("/api/admin/preview").set(auth()).expect(200);
  assert.equal(preview.body.content.name, "PRIVATE DRAFT NAME");
  await api
    .put("/api/admin/draft")
    .set(auth())
    .send({ revision: r.body.revision, content: draft })
    .expect(409);
});
test("publication only accepts the current saved revision", async () => {
  await api
    .post("/api/admin/publish")
    .set(auth())
    .send({ revision: 0 })
    .expect(409);
  const doc = await Birthday.findById("birthday");
  const p = await api
    .post("/api/admin/publish")
    .set(auth())
    .send({ revision: doc.revision })
    .expect(200);
  assert.ok(p.body.publishedAt);
  const pub = await api.get("/api/birthday").expect(200);
  assert.equal(pub.body.content.name, "PRIVATE DRAFT NAME");
});
test("validation rejects unknown fields, invalid timezone and missing media", async () => {
  const { body } = await api.get("/api/admin/draft").set(auth());
  for (const change of [
    { name: "" },
    { timezone: "Not/A/Timezone" },
    { unknown: "field" },
    { birthday: "2026-02-31" },
    { colors: { pink: "javascript:bad", lavender: "#eeeeee" } },
  ]) {
    await api
      .put("/api/admin/draft")
      .set(auth())
      .send({
        revision: body.revision,
        content: { ...body.content, ...change },
      })
      .expect(422);
  }
  await api
    .put("/api/admin/draft")
    .set(auth())
    .send({
      revision: body.revision,
      content: { ...body.content, musicId: "012345678901234567890123" },
    })
    .expect(422);
});
test("malformed dates do not throw from the schema", () => {
  for (const birthday of ["2026-13-12", "nonsense", "2026-00-01"])
    assert.equal(
      contentSchema.safeParse({ ...defaults, birthday }).success,
      false,
    );
});
test("file contents, not supplied extension, determine upload acceptance", async () => {
  await api
    .post("/api/admin/media")
    .set(auth())
    .attach("file", Buffer.from("this is not a photo"), "birthday.jpg")
    .expect(415);
  await api.post("/api/admin/media").set(auth()).expect(422);
  await api
    .post("/api/admin/media")
    .set(auth())
    .attach("file", Buffer.alloc(15 * 1024 * 1024 + 1), "large.wav")
    .expect(413);
});
test("memory creation, reordering and removal remain drafts", async () => {
  const media = await Media.create({
    kind: "image",
    publicId: "test-placeholder",
    format: "webp",
    resourceType: "image",
  });
  let doc = await Birthday.findById("birthday");
  const first = {
    id: "48cb484f-1b1d-48b4-a480-bf3675c17c2a",
    mediaId: String(media._id),
    caption: "Test memory",
    alt: "Test image",
    date: "",
  };
  await api
    .post("/api/admin/memories")
    .set(auth())
    .send({ revision: doc.revision, photo: first })
    .expect(200);
  doc = await Birthday.findById("birthday");
  assert.equal(doc.draft.photos.length, 1);
  assert.equal(doc.published.photos.length, 0);
  await api
    .post("/api/admin/memories/reorder")
    .set(auth())
    .send({ revision: doc.revision, ids: [first.id, first.id] })
    .expect(422);
  await api
    .post("/api/admin/memories/reorder")
    .set(auth())
    .send({ revision: doc.revision, ids: [first.id] })
    .expect(200);
  await api.delete(`/api/admin/media/${media._id}`).set(auth()).expect(409);
  doc = await Birthday.findById("birthday");
  await api
    .delete(`/api/admin/memories/${first.id}`)
    .set(auth())
    .send({ revision: doc.revision })
    .expect(200);
});
test("seed is idempotent and preserves edits", async () => {
  const before = await Birthday.findById("birthday");
  await seed();
  await seed();
  const after = await Birthday.findById("birthday");
  assert.equal(await Birthday.countDocuments(), 1);
  assert.deepEqual(after.draft, before.draft);
  assert.equal(after.revision, before.revision);
});
test("unlisted origins are rejected", async () => {
  await api
    .get("/api/birthday")
    .set("Origin", "https://untrusted.example")
    .expect(403);
  await api
    .get("/api/birthday")
    .set("Origin", "http://localhost:5173")
    .expect(200);
});
test("expired sessions and logout revoke access", async () => {
  const expired = "a".repeat(64);
  await Session.create({
    tokenHash: hashToken(expired),
    adminId: (await Admin.findOne())._id,
    expiresAt: new Date(Date.now() - 1000),
  });
  await api
    .get("/api/admin/draft")
    .set("Authorization", `Bearer ${expired}`)
    .expect(401);
  await api.post("/api/auth/logout").set(auth()).expect(200);
  await api.get("/api/admin/draft").set(auth()).expect(401);
});
