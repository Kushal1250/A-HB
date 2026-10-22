import { z } from "zod";
import { defaultJourney, chapterDefs, unlockKinds, revealKinds } from "../../shared/journey.js";
import { emptyBlessings } from "../../shared/blessings.js";
const text = (n) => z.string().trim().min(1).max(n);
export const photoSchema = z
  .object({
    id: z.string().uuid(),
    mediaId: z.string().regex(/^[a-f\d]{24}$/i),
    caption: z.string().max(180),
    alt: text(250),
    date: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            !isNaN(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v),
        "Use YYYY-MM-DD or leave empty",
      ),
  })
  .strict();
const mediaId = z.string().regex(/^[a-f\d]{24}$/i);
export const blessingsSchema = z.object({
 enabled: z.boolean(), title: text(120), intro: text(1500), prayer: text(3000), closing: text(1000),
 featuredId: z.string().uuid().nullable(),
 photos: z.array(z.object({ id: z.string().uuid(), mediaId, title: text(120), caption: z.string().max(500), alt: text(250), visible: z.boolean(), theme: text(100).optional(), blessing: z.string().max(1500).optional(), reveal: z.enum(revealKinds).optional() }).strict()).max(40)
   .refine(v => new Set(v.map(p => p.id)).size === v.length, 'Devotional image IDs must be unique'),
 videoId: mediaId.nullable(), videoTitle: text(120), videoDescription: text(1000),
 interactions: z.object({lamp:z.boolean(), flowers:z.boolean(), wishes:z.boolean(), gratitude:z.boolean()}).strict(),
}).strict().refine(b => b.featuredId === null || b.photos.some(p => p.id === b.featuredId && p.visible), 'Choose a visible featured image');
export const journeySchema = z.object({
 enabled: z.boolean(), autoplay: z.boolean(), volume:z.number().min(0).max(1), intensity:z.enum(['gentle','full','none']), scratchThreshold:z.number().min(.2).max(.7).default(.4),shakeSensitivity:z.number().min(8).max(30).default(14),centralWish:z.string().max(3000).default(''),
 chapters:z.array(z.object({id:z.enum(chapterDefs.map(c=>c[0])),title:text(100),key:text(80),label:text(100),instruction:text(500),unlock:z.enum(unlockKinds),visible:z.boolean(),trackId:mediaId.nullable(),trackTitle:z.string().max(160).default(''),artist:z.string().max(160).default(''),source:z.string().max(500).default(''),license:z.string().max(500).default(''),provenance:z.enum(['supplied','licensed','original']).default('original'),duration:z.number().min(0).max(86400).default(0)}).strict()).length(9)
 .refine(cs=>new Set(cs.map(c=>c.id)).size===9,'Include each chapter exactly once'),
}).strict();
export const contentSchema = z
  .object({
    blessings: blessingsSchema.default(emptyBlessings),
    journey: journeySchema.default(defaultJourney),
    name: text(80),
    shortName: text(40),
    sender: text(80),
    birthday: z
      .string()
      .refine(
        (v) =>
          v === "" ||
          (/^\d{4}-\d{2}-\d{2}$/.test(v) &&
            !isNaN(Date.parse(v)) &&
            new Date(v).toISOString().slice(0, 10) === v),
        "Use a valid YYYY-MM-DD date or leave empty",
      ),
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, "Use an IANA timezone, such as Asia/Kolkata"),
    headline: text(200),
    intro: text(500),
    letter: text(12000),
    finalMessage: text(2000),
    colors: z
      .object({
        pink: z.string().regex(/^#[\da-f]{6}$/i),
        lavender: z.string().regex(/^#[\da-f]{6}$/i),
      })
      .strict(),
    sections: z
      .object({
        constellation: z.boolean(),
        memories: z.boolean(),
        letter: z.boolean(),
      })
      .strict(),
    noIndex: z.boolean(),
    photos: z
      .array(photoSchema)
      .max(30)
      .refine(
        (v) => new Set(v.map((x) => x.id)).size === v.length,
        "Memory IDs must be unique",
      ),
    memoryVideos: z.array(z.object({id:z.string().uuid(),mediaId,title:text(120),caption:z.string().max(180),visible:z.boolean()}).strict()).max(100).refine(v=>new Set(v.map(x=>x.id)).size===v.length,'Video IDs must be unique').default([]),
    musicId: z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .nullable(),
  })
  .strict();
export const draftSchema = z
  .object({ revision: z.number().int().nonnegative(), content: contentSchema })
  .strict();
export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .email()
      .max(200)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(1).max(256),
  })
  .strict();
export function parse(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const err = new Error("Please check the highlighted fields.");
    err.status = 422;
    err.fields = result.error.issues.map((i) => ({
      field: i.path.join("."),
      message: i.message,
    }));
    throw err;
  }
  return result.data;
}
