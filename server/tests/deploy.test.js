import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, readFile, access } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import supertest from "supertest";
import { createApp } from "../src/app.js";
import { createStore } from "../src/store.js";
import { ensureAdmin, seedDataDirectory } from "../src/deploy.js";
import { verifyPassword } from "../src/services/passwords.js";

let work;
before(async () => {
  work = await mkdtemp(path.join(os.tmpdir(), "anu-deploy-test-"));
});
after(async () => {
  await rm(work, { recursive: true, force: true });
});
const exists = (p) => access(p).then(() => true, () => false);

test("production origin guard lets listed origins through and never hangs", async () => {
  const dir = path.join(work, "guard");
  const store = createStore(dir);
  await store.ready;
  const previous = { ...process.env };
  process.env.NODE_ENV = "production";
  process.env.FRONTEND_ORIGINS = "https://site-one.vercel.app/, https://site-two.vercel.app";
  try {
    const api = supertest(createApp({ store }));
    // Direct request (health check, no Origin header) must complete.
    await api.get("/api/health").set("Host", "anu-birthday-api.onrender.com").expect(200);
    // Same-origin GET proxied by Vercel: no Origin header.
    await api.get("/api/birthday").set("Host", "anu-birthday-api.onrender.com").expect(200);
    // State-changing request proxied by Vercel carries the Vercel origin.
    await api.post("/api/auth/login").set("Origin", "https://site-one.vercel.app").send({}).expect(422);
    await api.post("/api/auth/login").set("Origin", "https://site-two.vercel.app").send({}).expect(422);
    // Anything else is refused.
    await api.post("/api/auth/login").set("Origin", "https://evil.example").send({}).expect(403);
    // Production root explains itself instead of serving a page.
    await api.get("/").expect(200).expect((r) => assert.equal(r.body.status, "ok"));
  } finally {
    for (const k of ["NODE_ENV", "FRONTEND_ORIGINS"])
      previous[k] === undefined ? delete process.env[k] : (process.env[k] = previous[k]);
  }
});

test("seedDataDirectory copies seed once and never overwrites existing data", async () => {
  const seed = path.join(work, "seed");
  const live = path.join(work, "live");
  await mkdir(path.join(seed, "uploads"), { recursive: true });
  await writeFile(path.join(seed, "birthday.json"), '{"seed":true}');
  await writeFile(path.join(seed, "uploads", "a.mp4"), "video");
  assert.equal(await seedDataDirectory(live, seed), true);
  assert.equal(await readFile(path.join(live, "uploads", "a.mp4"), "utf8"), "video");
  await writeFile(path.join(live, "birthday.json"), '{"edited":true}');
  assert.equal(await seedDataDirectory(live, seed), false);
  assert.equal(await readFile(path.join(live, "birthday.json"), "utf8"), '{"edited":true}');
  assert.equal(await seedDataDirectory(path.join(work, "other"), path.join(work, "no-such-seed")), false);
  assert.equal(await exists(path.join(work, "other")), false);
  assert.equal(await seedDataDirectory(seed, seed), false);
});

test("ensureAdmin creates, keeps and updates the administrator from the environment", async () => {
  const store = createStore(path.join(work, "admin"));
  await store.ready;
  assert.equal(await ensureAdmin(store, "", ""), "skipped");
  await assert.rejects(ensureAdmin(store, "not-an-email", "a-long-password-1"), /ADMIN_EMAIL/);
  await assert.rejects(ensureAdmin(store, "me@example.com", "short"), /ADMIN_PASSWORD/);
  assert.equal(await ensureAdmin(store, " Me@Example.com ", "first-long-password"), "created");
  assert.equal(await ensureAdmin(store, "me@example.com", "first-long-password"), "unchanged");
  assert.equal(await ensureAdmin(store, "me@example.com", "second-long-password"), "updated");
  const state = await store.read();
  assert.equal(state.admins.length, 1);
  assert.equal(await verifyPassword("second-long-password", state.admins[0].passwordHash), true);
  assert.equal(await verifyPassword("first-long-password", state.admins[0].passwordHash), false);
});
