import express from "express";
import { localErrorHandler } from "./middleware/errors.js";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import multer from "multer";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { createStore } from "./store.js";
import { contentReferences, resolveBlessings } from "./blessings.js";
import { normaliseJourney } from "../../shared/journey.js";
import { emptyBlessings } from "../../shared/blessings.js";
import {
  hashPassword,
  hashToken,
  verifyPassword,
} from "./services/passwords.js";
import { parse, draftSchema, loginSchema } from "./validation.js";
const fail = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const referenceIds = (state) => new Set([...contentReferences(state.draft), ...contentReferences(state.published)]);
function validateReferences(content, state) {
  validateVideo(content, state);
  for(const v of content.memoryVideos||[])if(!state.media.some(m=>m.id===v.mediaId&&m.kind==='video'))throw fail('A memory video is missing. Choose another MP4 in the studio.',422);
  for(const ch of normaliseJourney(content.journey).chapters)if(ch.trackId && !state.media.some(m=>m.id===ch.trackId&&m.kind==='audio'))throw fail('A chapter music track is missing. Choose another track in the studio.',422);
  for (const p of [...content.photos, ...(content.blessings?.photos || [])])
    if (!state.media.some((m) => m.id === p.mediaId && m.kind === "image"))
      throw fail(
        "A selected photo is missing. Refresh your files and try again.",
        422,
      );
  if (
    content.musicId &&
    !state.media.some((m) => m.id === content.musicId && m.kind === "audio")
  )
    throw fail("The selected audio is missing.", 422);
}
function validateVideo(content, state) {
  if (content.blessings?.videoId && !state.media.some(m => m.id === content.blessings.videoId && m.kind === 'video'))
    throw fail('The selected devotional video is missing.', 422);
}
function sign(state, id, expires) {
  return createHmac("sha256", state.mediaKey)
    .update(`${id}:${expires}`)
    .digest("hex");
}
function mediaView(media, state, privateLink = false) {
  if (!media) return { src: "", thumbnail: "" };
  const expires = Math.floor(Date.now() / 1000) + 7200;
  const suffix = privateLink
    ? `?expires=${expires}&signature=${sign(state, media.id, expires)}`
    : "";
  return {
    mediaId: media.id,
    kind: media.kind,
    originalName: media.originalName,
    width: media.width, height: media.height,
    src: `/api/media/${media.id}/full${suffix}`,
    thumbnail:
      media.thumbnailName ? `/api/media/${media.id}/thumbnail${suffix}` : "",
  };
}
function present(content, state, privateLinks = false) {
  return {
    ...content,
    blessings: resolveBlessings(content, state, mediaView, privateLinks),
    journey:{...normaliseJourney(content.journey),chapters:normaliseJourney(content.journey).chapters.map(ch=>({...ch,track:ch.trackId?mediaView(state.media.find(m=>m.id===ch.trackId),state,privateLinks):null}))},
    memoryVideos: (content.memoryVideos||[]).filter(v=>privateLinks||(v.visible&&content.sections.memories&&normaliseJourney(content.journey).chapters.some(c=>c.id==='memories'&&c.visible))).map(v=>({...v,...mediaView(state.media.find(m=>m.id===v.mediaId),state,privateLinks)})),
    photos: content.photos.map((p) => ({
      ...p,
      ...mediaView(
        state.media.find((m) => m.id === p.mediaId),
        state,
        privateLinks,
      ),
    })),
    music: content.musicId
      ? mediaView(
          state.media.find((m) => m.id === content.musicId),
          state,
          privateLinks,
        )
      : null,
  };
}
export function createApp({
  store = createStore(),
  clientDirectory = fileURLToPath(
    new URL("../../client/dist/", import.meta.url),
  ),
} = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "blob:"],
          mediaSrc: ["'self'", "blob:"],
          connectSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: null,
        },
      },
    }),
  );
  app.use((req, res, next) => {
    if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(req.hostname))
      return next(fail("This app accepts localhost requests only.", 403));
    const origin = req.get("origin");
    if (origin && origin !== `http://${req.get("host")}`)
      return next(fail("Requests from another website are not allowed.", 403));
    next();
  });
  app.use(express.json({ limit: "100kb" }));
  app.use(
    "/api",
    rateLimit({
      windowMs: 60000,
      limit: 240,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: { message: "Too many requests. Try again shortly." } },
    }),
    (_req, res, next) => {
      res.set("Cache-Control", "no-store");
      next();
    },
  );
  const api = express.Router();
  api.get("/health", async (_req, res) => {
    await store.read();
    res.json({ status: "ok", storage: "local", port: 3000 });
  });
  api.get("/garden-entrance/photo", (_req, res, next) => {
    res.type("png");
    res.sendFile(path.resolve(store.directory,"garden-entrance.png"),error=>{
      if(error)next(error.code === "ENOENT" ? fail("Garden portrait not found.",404) : error);
    });
  });
  api.get("/birthday", async (_req, res) => {
    const state = await store.read();
    res.json({
      content: present(state.published, state),
      publishedAt: state.publishedAt,
    });
  });
  const dummy = hashPassword(randomBytes(24).toString("hex"));
  api.post(
    "/auth/login",
    rateLimit({
      windowMs: 900000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: {
          message: "Too many attempts. Wait 15 minutes before trying again.",
        },
      },
    }),
    async (req, res) => {
      const { email, password } = parse(loginSchema, req.body);
      const state = await store.read();
      const admin = state.admins.find((a) => a.email === email);
      const valid = await verifyPassword(
        password,
        admin?.passwordHash || (await dummy),
      );
      if (!valid || !admin)
        throw fail(
          state.admins.length
            ? "Email or password is incorrect."
            : "Create your local administrator first: stop the server, then run npm run admin:create.",
          401,
        );
      const token = randomBytes(32).toString("hex");
      const expiresAt = Date.now() + 7200000;
      await store.update((s) => {
        s.sessions = s.sessions.filter((x) => x.expiresAt > Date.now());
        s.sessions.push({
          tokenHash: hashToken(token),
          adminId: admin.id,
          expiresAt,
        });
      });
      res.json({ token, expiresAt: new Date(expiresAt).toISOString(), email });
    },
  );
  async function admin(req, _res, next) {
    try {
      const token = /^Bearer ([a-f\d]{64})$/i.exec(
        req.get("authorization") || "",
      )?.[1];
      if (!token) throw fail("Sign in to edit your local birthday.", 401);
      const s = await store.read();
      const session = s.sessions.find(
        (x) => x.tokenHash === hashToken(token) && x.expiresAt > Date.now(),
      );
      if (!session)
        throw fail(
          "Your session expired. Sign in again; your unsaved changes are kept here.",
          401,
        );
      req.tokenHash = session.tokenHash;
      next();
    } catch (e) {
      next(e);
    }
  }
  api.post("/auth/logout", admin, async (req, res) => {
    await store.update((s) => {
      s.sessions = s.sessions.filter((x) => x.tokenHash !== req.tokenHash);
    });
    res.json({ ok: true });
  });
  api.use("/admin", admin);
  api.get("/admin/draft", async (_req, res) => {
    const s = await store.read();
    res.json({
      content: { ...s.draft, blessings: s.draft.blessings || emptyBlessings },
      revision: s.revision,
      publishedAt: s.publishedAt,
      mediaConfigured: true,
    });
  });
  api.put("/admin/draft", async (req, res) => {
    const { content, revision } = parse(draftSchema, req.body);
    const result = await store.update((s) => {
      if (s.revision !== revision)
        throw fail(
          "This draft changed in another tab. Copy your edits, then reload the latest draft.",
          409,
        );
      validateReferences(content, s);
      s.draft = content;
      s.revision++;
      return { content: s.draft, revision: s.revision };
    });
    res.json(result);
  });
  api.get("/admin/preview", async (_req, res) => {
    const s = await store.read();
    res.json({ content: present(s.draft, s, true) });
  });
  api.post("/admin/publish", async (req, res) => {
    const { revision } = parse(
      z.object({ revision: z.number().int().nonnegative() }).strict(),
      req.body,
    );
    const result = await store.update((s) => {
      if (s.revision !== revision)
        throw fail("Draft changed. Reload before publishing.", 409);
      validateReferences(s.draft, s);
      s.published = structuredClone(s.draft);
      s.publishedAt = new Date().toISOString();
      s.revision++;
      return { revision: s.revision, publishedAt: s.publishedAt };
    });
    res.json(result);
  });
  api.get("/admin/media", async (_req, res) => {
    const s = await store.read();
    const refs = referenceIds(s);
    res.json({
      configured: true,
      media: s.media
        .map((m) => ({
          ...mediaView(m, s, true),
          createdAt: m.createdAt,
          used: refs.has(m.id),
        }))
        .reverse(),
    });
  });
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024, files: 1, fields: 0 },
  }).single("file");
  api.post(
    "/admin/media",
    rateLimit({
      windowMs: 60000,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        error: { message: "Please wait a minute before uploading more files." },
      },
    }),
    upload,
    async (req, res) => {
      const f = req.file;
      if (!f) throw fail("Choose one file to upload.", 422);
      const type = await fileTypeFromBuffer(f.buffer);
      const image = ["image/jpeg", "image/png", "image/webp"].includes(
        type?.mime,
      );
      const audio = ["audio/mpeg", "audio/wav", "audio/x-wav"].includes(
        type?.mime,
      );
      const video = type?.mime === "video/mp4";
      if (!image && !audio && !video)
        throw fail("Choose a real JPEG, PNG, WebP, MP3, WAV or MP4 file.", 415);
      if (image && f.size > 8 * 1024 * 1024)
        throw fail("Photos must be no larger than 8 MB.", 413);
      const id = randomBytes(12).toString("hex");
      const ext = image ? "webp" : type.ext;
      const files = [];
      try {
        let full = f.buffer,
          thumbnail;
        if (image) {
          try {
            const photo = sharp(f.buffer, {
              limitInputPixels: 40000000,
              animated: false,
            }).rotate();
            full = await photo
              .clone()
              .resize({
                width: 2000,
                height: 2000,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 85 })
              .toBuffer();
            thumbnail = await photo
              .clone()
              .resize({
                width: 640,
                height: 800,
                fit: "inside",
                withoutEnlargement: true,
              })
              .webp({ quality: 78 })
              .toBuffer();
          } catch {
            throw fail(
              "This photo could not be processed. Try another image under 40 million pixels.",
              422,
            );
          }
        }
        const filename = `${id}.${ext}`,
          thumbnailName = image ? `${id}-thumb.webp` : null;
        for (const [name, buffer] of [
          [filename, full],
          ...(thumbnail ? [[thumbnailName, thumbnail]] : []),
        ]) {
          const file = path.join(store.directory, "uploads", name);
          await writeFile(file, buffer, { flag: "wx", mode: 0o600 });
          files.push(file);
        }
        const media = {
          id,
          kind: image ? "image" : video ? "video" : "audio",
          filename,
          thumbnailName,
          mime: image ? "image/webp" : type.mime,
          originalName: path.basename(f.originalname).slice(0, 180),
          createdAt: new Date().toISOString(),
        };
        await store.update((s) => {
          s.media.push(media);
        });
        const s = await store.read();
        res.status(201).json({ media: mediaView(media, s, true) });
      } catch (e) {
        await Promise.allSettled(files.map((f) => unlink(f)));
        throw e;
      }
    },
  );
  api.delete("/admin/media/:id", async (req, res) => {
    let removed;
    await store.update((s) => {
      if (referenceIds(s).has(req.params.id))
        throw fail(
          "Remove this file from the draft, save and publish the removal before deleting it.",
          409,
        );
      removed = s.media.find((m) => m.id === req.params.id);
      if (!removed) throw fail("File not found.", 404);
      s.media = s.media.filter((m) => m.id !== removed.id);
    });
    await Promise.allSettled(
      [removed.filename, removed.thumbnailName]
        .filter(Boolean)
        .map((name) => unlink(path.join(store.directory, "uploads", name))),
    );
    res.json({ ok: true });
  });
  api.get("/media/:id/:size", async (req, res, next) => {
    const s = await store.read();
    const media = s.media.find((m) => m.id === req.params.id);
    if (!media || !["full", "thumbnail"].includes(req.params.size))
      throw fail("File not found.", 404);
    const published = contentReferences(s.published, true);
    if (!published.has(media.id)) {
      const expires = String(req.query.expires || "");
      const signature = String(req.query.signature || "");
      const expected = sign(s, media.id, expires);
      if (
        !/^\d+$/.test(expires) ||
        Number(expires) < Date.now() / 1000 ||
        !/^[a-f\d]{64}$/.test(signature) ||
        !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      )
        throw fail(
          "This draft file is private. Sign in and refresh your preview.",
          403,
        );
    }
    const name =
      req.params.size === "thumbnail" ? media.thumbnailName : media.filename;
    if (!name) throw fail("No thumbnail exists for this file.", 404);
    res.set(
      "Content-Type",
      req.params.size === "thumbnail" ? "image/webp" : media.mime,
    );
    res.set("Cache-Control", "private, max-age=60");
    res.sendFile(path.join(store.directory, "uploads", name), (error) => {
      if (error) next(error);
    });
  });
  app.use("/api", api);
  app.use("/api", (_req, _res, next) => next(fail("Endpoint not found.", 404)));
  app.use(express.static(clientDirectory, { index: false }));
  app.get(["/", "/admin"], (_req, res) =>
    res.sendFile(path.join(clientDirectory, "index.html")),
  );
  app.use((_req, _res, next) => next(fail("Page not found.", 404)));
  app.use(localErrorHandler);
  return app;
}
