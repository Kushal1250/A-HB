import mongoose from "mongoose";
import { config } from "../src/config.js";
import { connectDatabase, Media, Birthday } from "../src/models.js";
import { mediaReferences } from "../src/services/content.js";
import { destroyMedia } from "../src/services/media.js";
const apply = process.argv.includes("--apply");
try {
  await connectDatabase(config.mongo);
  const candidates = await Media.find({
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  });
  let count = 0;
  for (const media of candidates) {
    const refs = mediaReferences(await Birthday.findById("birthday").lean());
    if (refs.has(String(media._id))) continue;
    count++;
    console.log(
      `${apply ? "Removing" : "Would remove"} unreferenced media ${media._id}`,
    );
    if (apply) await destroyMedia(media);
  }
  console.log(
    `${count} old unreferenced file(s). ${apply ? "Cleanup complete." : "Dry run. Add -- --apply to delete. Pause editing while applying cleanup."}`,
  );
} catch {
  console.error("Cleanup failed. Check database and media configuration.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
