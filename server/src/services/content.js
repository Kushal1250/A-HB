import { readFileSync } from "node:fs";
import { Birthday, Media } from "../models.js";
import { contentSchema, parse } from "../validation.js";
import { mediaView } from "./media.js";
export const defaults = JSON.parse(
  readFileSync(
    new URL("../../../shared/defaults.json", import.meta.url),
    "utf8",
  ),
);
export async function seed() {
  return Birthday.findOneAndUpdate(
    { _id: "birthday" },
    {
      $setOnInsert: {
        draft: defaults,
        published: defaults,
        revision: 0,
        publishedAt: new Date(),
      },
    },
    { upsert: true, new: true },
  );
}
export async function assertMedia(content) {
  const ids = [
    ...content.photos.map((p) => p.mediaId),
    ...(content.musicId ? [content.musicId] : []),
  ];
  const assets = await Media.find({ _id: { $in: ids } }).lean();
  const map = new Map(assets.map((m) => [String(m._id), m]));
  for (const p of content.photos) {
    if (map.get(p.mediaId)?.kind !== "image") {
      const e = new Error("One of the selected photos no longer exists.");
      e.status = 422;
      throw e;
    }
  }
  if (content.musicId && map.get(content.musicId)?.kind !== "audio") {
    const e = new Error("The selected audio no longer exists.");
    e.status = 422;
    throw e;
  }
}
export async function saveDraft(content, revision) {
  parse(contentSchema, content);
  await assertMedia(content);
  const doc = await Birthday.findOneAndUpdate(
    { _id: "birthday", revision },
    { $set: { draft: content }, $inc: { revision: 1 } },
    { new: true },
  );
  if (!doc) {
    const e = new Error(
      "This draft changed in another tab. Copy your unsaved text before reloading.",
    );
    e.status = 409;
    throw e;
  }
  return doc;
}
export async function present(content) {
  const ids = [
    ...content.photos.map((p) => p.mediaId),
    ...(content.musicId ? [content.musicId] : []),
  ];
  const assets = await Media.find({ _id: { $in: ids } }).lean();
  const map = new Map(assets.map((m) => [String(m._id), m]));
  return {
    ...content,
    photos: content.photos.map((p) => ({
      ...p,
      ...(map.has(p.mediaId)
        ? mediaView(map.get(p.mediaId))
        : { src: "", thumbnail: "" }),
    })),
    music: map.has(content.musicId)
      ? mediaView(map.get(content.musicId))
      : null,
  };
}
export const mediaReferences = (doc) =>
  new Set(
    [...(doc?.draft?.photos || []), ...(doc?.published?.photos || [])]
      .map((p) => p.mediaId)
      .concat([doc?.draft?.musicId, doc?.published?.musicId].filter(Boolean)),
  );
