import express from "express";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import multer from "multer";
import { rateLimit } from "express-rate-limit";
import { Admin, Birthday, Media, Session } from "../models.js";
import { requireAdmin } from "../middleware/auth.js";
import {
  hashToken,
  hashPassword,
  verifyPassword,
} from "../services/passwords.js";
import {
  seed,
  present,
  saveDraft,
  assertMedia,
  mediaReferences,
} from "../services/content.js";
import {
  cloudReady,
  uploadMedia,
  mediaView,
  destroyMedia,
} from "../services/media.js";
import { parse, loginSchema, draftSchema, photoSchema } from "../validation.js";
export const api = express.Router();
const error = (message, status = 400) =>
  Object.assign(new Error(message), { status });
api.get("/health", (_req, res) =>
  res
    .status(mongoose.connection.readyState === 1 ? 200 : 503)
    .json({
      status: mongoose.connection.readyState === 1 ? "ok" : "unavailable",
    }),
);
api.get("/birthday", async (_req, res) => {
  const doc = await Birthday.findById("birthday").lean();
  if (!doc)
    throw error(
      "Birthday content has not been initialised. Run npm run seed.",
      503,
    );
  res
    .set("Cache-Control", "no-store")
    .json({
      content: await present(doc.published),
      publishedAt: doc.publishedAt,
    });
});
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many login attempts. Please try again in 15 minutes.",
    },
  },
});
// A constant-time password derivation also runs when the email is not found.
const dummyHash = hashPassword(randomBytes(32).toString("hex"));
api.post("/auth/login", loginLimit, async (req, res) => {
  const { email, password } = parse(loginSchema, req.body);
  const admin = await Admin.findOne({ email }).lean();
  const valid = await verifyPassword(
    password,
    admin?.passwordHash || (await dummyHash),
  );
  if (!admin || !valid) throw error("Email or password is incorrect.", 401);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
  await Session.create({
    tokenHash: hashToken(token),
    adminId: admin._id,
    expiresAt,
  });
  res
    .set("Cache-Control", "no-store")
    .json({ token, expiresAt, email: admin.email });
});
api.post("/auth/logout", requireAdmin, async (req, res) => {
  await Session.deleteOne({ _id: req.session._id });
  res.json({ ok: true });
});
api.use("/admin", requireAdmin, (_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
api.get("/admin/draft", async (_req, res) => {
  const doc = await seed();
  res.json({
    content: doc.draft,
    revision: doc.revision,
    publishedAt: doc.publishedAt,
    mediaConfigured: cloudReady(),
  });
});
api.put("/admin/draft", async (req, res) => {
  const { content, revision } = parse(draftSchema, req.body);
  const doc = await saveDraft(content, revision);
  res.json({ content: doc.draft, revision: doc.revision });
});
api.get("/admin/preview", async (_req, res) => {
  const doc = await seed();
  res.json({ content: await present(doc.draft) });
});
api.post("/admin/publish", async (req, res) => {
  const { revision } = parse(
    z.object({ revision: z.number().int().nonnegative() }).strict(),
    req.body,
  );
  const draft = await Birthday.findOne({ _id: "birthday", revision }).lean();
  if (!draft) throw error("Draft changed. Reload before publishing.", 409);
  await assertMedia(draft.draft);
  const doc = await Birthday.findOneAndUpdate(
    { _id: "birthday", revision },
    {
      $set: { published: draft.draft, publishedAt: new Date() },
      $inc: { revision: 1 },
    },
    { new: true },
  );
  if (!doc) throw error("Draft changed while publishing. Please reload.", 409);
  res.json({ revision: doc.revision, publishedAt: doc.publishedAt });
});
api.post("/admin/memories", async (req, res) => {
  const { revision, photo } = parse(
    z
      .object({ revision: z.number().int().nonnegative(), photo: photoSchema })
      .strict(),
    req.body,
  );
  const doc = await seed();
  res.json(
    await saveDraft(
      { ...doc.draft, photos: [...doc.draft.photos, photo] },
      revision,
    ),
  );
});
api.patch("/admin/memories/:id", async (req, res) => {
  const { revision, photo } = parse(
    z
      .object({ revision: z.number().int().nonnegative(), photo: photoSchema })
      .strict(),
    req.body,
  );
  if (photo.id !== req.params.id) throw error("Memory ID does not match.", 422);
  const doc = await seed();
  if (!doc.draft.photos.some((p) => p.id === photo.id))
    throw error("Memory not found.", 404);
  res.json(
    await saveDraft(
      {
        ...doc.draft,
        photos: doc.draft.photos.map((p) => (p.id === photo.id ? photo : p)),
      },
      revision,
    ),
  );
});
api.delete("/admin/memories/:id", async (req, res) => {
  const { revision } = parse(
    z.object({ revision: z.number().int().nonnegative() }).strict(),
    req.body,
  );
  const doc = await seed();
  if (!doc.draft.photos.some((p) => p.id === req.params.id))
    throw error("Memory not found.", 404);
  res.json(
    await saveDraft(
      {
        ...doc.draft,
        photos: doc.draft.photos.filter((p) => p.id !== req.params.id),
      },
      revision,
    ),
  );
});
api.post("/admin/memories/reorder", async (req, res) => {
  const { revision, ids } = parse(
    z
      .object({
        revision: z.number().int().nonnegative(),
        ids: z.array(z.string().uuid()).max(30),
      })
      .strict(),
    req.body,
  );
  const doc = await seed();
  if (
    ids.length !== doc.draft.photos.length ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !doc.draft.photos.some((p) => p.id === id))
  )
    throw error("Provide every memory ID exactly once.", 422);
  res.json(
    await saveDraft(
      {
        ...doc.draft,
        photos: ids.map((id) => doc.draft.photos.find((p) => p.id === id)),
      },
      revision,
    ),
  );
});
api.get("/admin/media", async (_req, res) => {
  const [assets, doc] = await Promise.all([
    Media.find().sort({ createdAt: -1 }).lean(),
    Birthday.findById("birthday").lean(),
  ]);
  const used = mediaReferences(doc);
  res.json({
    media: assets.map((m) => ({
      ...mediaView(m),
      createdAt: m.createdAt,
      used: used.has(String(m._id)),
    })),
    configured: cloudReady(),
  });
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 0 },
}).single("file");
api.post(
  "/admin/media",
  rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      error: { message: "Upload limit reached. Try again in a minute." },
    },
  }),
  upload,
  async (req, res) => {
    if (!req.file) throw error("Select a file to upload.", 422);
    const media = await uploadMedia(req.file);
    res.status(201).json({ media: mediaView(media) });
  },
);
api.delete("/admin/media/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    throw error("Invalid media ID.", 422);
  const doc = await Birthday.findById("birthday").lean();
  if (mediaReferences(doc).has(req.params.id))
    throw error(
      "This file is still in a draft or published birthday. Remove it from the draft, save, and publish before deleting it.",
      409,
    );
  const media = await Media.findById(req.params.id);
  if (!media) throw error("Media not found.", 404);
  await destroyMedia(media);
  res.json({ ok: true });
});
