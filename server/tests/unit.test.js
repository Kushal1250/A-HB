import { test } from "node:test";
import assert from "node:assert/strict";
import supertest from "supertest";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import { Writable } from "node:stream";
process.env.CLOUDINARY_CLOUD_NAME = "test-only";
process.env.CLOUDINARY_API_KEY = "test-only";
process.env.CLOUDINARY_API_SECRET = "not-a-real-secret";
const { hashPassword, verifyPassword, hashToken } =
  await import("../src/services/passwords.js");
const { contentSchema } = await import("../src/validation.js");
const { defaults, saveDraft, present } =
  await import("../src/services/content.js");
const { uploadMedia } = await import("../src/services/media.js");
const { Media, Birthday, Session } = await import("../src/models.js");
const { createApp } = await import("../src/app.js");
test("scrypt passwords are salted and reject incorrect passwords", async () => {
  const a = await hashPassword("a long password"),
    b = await hashPassword("a long password");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("a long password", a), true);
  assert.equal(await verifyPassword("wrong", a), false);
  assert.equal(hashToken("abc").length, 64);
});
test("content schema accepts defaults and safely rejects malformed dates and unsafe fields", () => {
  assert.equal(contentSchema.safeParse(defaults).success, true);
  for (const birthday of ["2026-02-31", "2026-13-12", "nonsense", "2026-00-01"])
    assert.equal(
      contentSchema.safeParse({ ...defaults, birthday }).success,
      false,
    );
  assert.equal(
    contentSchema.safeParse({ ...defaults, timezone: "Invalid/Zone" }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({ ...defaults, extra: "unexpected" }).success,
    false,
  );
  assert.equal(
    contentSchema.safeParse({
      ...defaults,
      colors: { pink: "red", lavender: "#ffffff" },
    }).success,
    false,
  );
});
test("draft writes use compare-and-swap revisions and do not mutate publication", async (t) => {
  let update;
  t.mock.method(Media, "find", () => ({ lean: async () => [] }));
  t.mock.method(Birthday, "findOneAndUpdate", async (filter, changes) => {
    assert.equal(filter.revision, 7);
    update = changes;
    return { draft: changes.$set.draft, revision: 8 };
  });
  const result = await saveDraft(defaults, 7);
  assert.equal(result.revision, 8);
  assert.ok(!("published" in update.$set));
  assert.equal(update.$inc.revision, 1);
});
test("stale drafts fail with conflict instead of overwriting", async (t) => {
  t.mock.method(Media, "find", () => ({ lean: async () => [] }));
  t.mock.method(Birthday, "findOneAndUpdate", async () => null);
  await assert.rejects(saveDraft(defaults, 4), (e) => e.status === 409);
});
test("content cannot reference missing media", async (t) => {
  t.mock.method(Media, "find", () => ({ lean: async () => [] }));
  await assert.rejects(
    saveDraft({ ...defaults, musicId: "012345678901234567890123" }, 0),
    (e) => e.status === 422,
  );
});
test("public serializer adds media URLs only for selected content", async (t) => {
  t.mock.method(Media, "find", () => ({ lean: async () => [] }));
  const result = await present(defaults);
  assert.deepEqual(result.photos, []);
  assert.equal(result.music, null);
  assert.ok(!("draft" in result));
  assert.ok(!("passwordHash" in result));
});
test("spoofed upload extensions are rejected by file signatures", async () => {
  await assert.rejects(
    uploadMedia({
      buffer: Buffer.from("not a JPEG"),
      size: 10,
      originalname: "birthday.jpg",
    }),
    (e) => e.status === 415,
  );
});
test("photo uploads create resized WebP originals and thumbnails in authenticated storage", async (t) => {
  const sent = [];
  t.mock.method(cloudinary.uploader, "upload_stream", (options, callback) => {
    const buffers = [];
    return new Writable({
      write(chunk, _enc, done) {
        buffers.push(chunk);
        done();
      },
      final(done) {
        sent.push({ options, buffer: Buffer.concat(buffers) });
        callback(null, { public_id: options.public_id, format: "webp" });
        done();
      },
    });
  });
  t.mock.method(Media, "create", async (doc) => doc);
  const input = await sharp({
    create: { width: 2200, height: 1600, channels: 3, background: "#abc" },
  })
    .jpeg()
    .toBuffer();
  const result = await uploadMedia({
    buffer: input,
    size: input.length,
    originalname: "photo.jpg",
  });
  assert.equal(sent.length, 2);
  assert.equal(sent[0].options.type, "authenticated");
  const full = await sharp(sent[0].buffer).metadata(),
    thumb = await sharp(sent[1].buffer).metadata();
  assert.equal(full.format, "webp");
  assert.ok(full.width <= 2000);
  assert.ok(thumb.width <= 640);
  assert.equal(result.kind, "image");
  assert.ok(result.thumbnailId);
});
test("failed media persistence cleans uploaded objects", async (t) => {
  let destroyed = 0;
  t.mock.method(
    cloudinary.uploader,
    "upload_stream",
    (options, callback) =>
      new Writable({
        write(_c, _e, done) {
          done();
        },
        final(done) {
          callback(null, { public_id: options.public_id, format: "webp" });
          done();
        },
      }),
  );
  t.mock.method(cloudinary.uploader, "destroy", async () => {
    destroyed++;
    return { result: "ok" };
  });
  t.mock.method(Media, "create", async () => {
    throw new Error("Database failed");
  });
  const image = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "#abc" },
  })
    .png()
    .toBuffer();
  await assert.rejects(
    uploadMedia({ buffer: image, size: image.length, originalname: "a.png" }),
  );
  assert.equal(destroyed, 2);
});
test("protected endpoints reject missing or expired sessions before mutations", async (t) => {
  const api = supertest(createApp());
  await api.put("/api/admin/draft").send({}).expect(401);
  await api
    .post("/api/admin/media")
    .attach("file", Buffer.from("fake"), "a.png")
    .expect(401);
  t.mock.method(Session, "findOne", () => ({ lean: async () => null }));
  await api
    .post("/api/admin/publish")
    .set("Authorization", `Bearer ${"a".repeat(64)}`)
    .send({ revision: 0 })
    .expect(401);
});
test("API rejects unlisted CORS origins and oversized JSON", async () => {
  const api = supertest(createApp());
  await api
    .get("/api/health")
    .set("Origin", "https://untrusted.example")
    .expect(403);
  await api
    .post("/api/auth/login")
    .send({ email: "a@example.com", password: "x".repeat(110000) })
    .expect(413);
});
