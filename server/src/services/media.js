import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { fileTypeFromBuffer } from "file-type";
import { Media } from "../models.js";
import { config } from "../config.js";
cloudinary.config({ ...config.cloud, secure: true });
export function cloudReady() {
  return Boolean(
    config.cloud.cloud_name && config.cloud.api_key && config.cloud.api_secret,
  );
}
function unavailable() {
  const e = new Error(
    "Media uploads are not configured. Add the Cloudinary environment variables on the backend.",
  );
  e.status = 503;
  return e;
}
async function send(buffer, publicId, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: resourceType,
        type: "authenticated",
        overwrite: false,
      },
      (err, result) => (err ? reject(err) : resolve(result)),
    );
    stream.end(buffer);
  });
}
export function mediaView(media) {
  const signed = (id) =>
    cloudinary.utils.private_download_url(id, media.format, {
      resource_type: media.resourceType,
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 600,
      attachment: false,
    });
  return {
    mediaId: String(media._id),
    src: signed(media.publicId),
    thumbnail: media.thumbnailId ? signed(media.thumbnailId) : "",
    kind: media.kind,
    originalName: media.originalName,
  };
}
export async function uploadMedia(file) {
  if (!cloudReady()) throw unavailable();
  const type = await fileTypeFromBuffer(file.buffer);
  const image = ["image/jpeg", "image/png", "image/webp"].includes(type?.mime);
  const audio = ["audio/mpeg", "audio/wav", "audio/x-wav"].includes(type?.mime);
  if (!image && !audio) {
    const e = new Error(
      "Choose a JPEG, PNG, WebP, MP3, or WAV file. The file contents must match its format.",
    );
    e.status = 415;
    throw e;
  }
  if (image && file.size > 8 * 1024 * 1024) {
    const e = new Error("Photos must be 8 MB or smaller.");
    e.status = 413;
    throw e;
  }
  const base = `anu-birthday/${randomUUID()}`;
  const uploaded = [];
  try {
    let full, thumb;
    if (image) {
      const photo = sharp(file.buffer, {
        limitInputPixels: 40000000,
        animated: false,
      }).rotate();
      const fullBuffer = await photo
        .clone()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
      const thumbBuffer = await photo
        .clone()
        .resize({
          width: 640,
          height: 800,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 78 })
        .toBuffer();
      full = await send(fullBuffer, base, "image");
      uploaded.push(full);
      thumb = await send(thumbBuffer, `${base}-thumb`, "image");
      uploaded.push(thumb);
    } else {
      full = await send(file.buffer, base, "video");
      uploaded.push(full);
    }
    return await Media.create({
      kind: image ? "image" : "audio",
      publicId: full.public_id,
      thumbnailId: thumb?.public_id,
      format: full.format,
      resourceType: image ? "image" : "video",
      originalName: file.originalname.slice(0, 180),
      bytes: file.size,
    });
  } catch (error) {
    await Promise.allSettled(
      uploaded.map((m) =>
        cloudinary.uploader.destroy(m.public_id, {
          resource_type: image ? "image" : "video",
          type: "authenticated",
          invalidate: true,
        }),
      ),
    );
    throw error;
  }
}
export async function destroyMedia(media) {
  if (!cloudReady()) throw unavailable();
  for (const id of [media.publicId, media.thumbnailId].filter(Boolean)) {
    const result = await cloudinary.uploader.destroy(id, {
      resource_type: media.resourceType,
      type: "authenticated",
      invalidate: true,
    });
    if (!["ok", "not found"].includes(result.result))
      throw new Error(
        "Media provider could not remove this file. Please retry.",
      );
  }
  await Media.deleteOne({ _id: media._id });
}
