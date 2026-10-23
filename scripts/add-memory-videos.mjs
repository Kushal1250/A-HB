// Adds the clips in new-videos/ to the project as Video memories.
//
//   npm run add:videos                      (updates data/ and seed-data/)
//   node scripts/add-memory-videos.mjs data seed-data
//
// For every target folder that contains birthday.json it will:
//   - copy the MP4 + poster files into <target>/uploads/ (never overwrites)
//   - add the media records and the Video memories entries to BOTH the draft
//     and the published content, at the end of the list
//   - keep a backup next to the file the first time (birthday.before-videos.json)
// It is safe to run twice: clips that are already present are skipped.
// Administrator accounts, sessions and every other setting are left untouched.
//
// STOP the server (Ctrl+C) before running this against data/.
import { copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "new-videos");
const MAX_VIDEOS = 100; // same limit the server enforces
const targets = (process.argv.length > 2 ? process.argv.slice(2) : ["data", "seed-data"]).map((t) => path.resolve(root, t));

const exists = (p) => stat(p).then(() => true, () => false);

try {
  if (!(await exists(path.join(source, "manifest.json"))))
    throw new Error(`Could not find ${path.join(source, "manifest.json")}. Extract the update ZIP into the project folder first.`);
  const manifest = JSON.parse(await readFile(path.join(source, "manifest.json"), "utf8"));
  let touched = 0;
  for (const target of targets) {
    const file = path.join(target, "birthday.json");
    const label = path.relative(root, target) || target;
    if (!(await exists(file))) {
      console.log(`- ${label}: no birthday.json here, skipped`);
      continue;
    }
    const state = JSON.parse(await readFile(file, "utf8"));
    await mkdir(path.join(target, "uploads"), { recursive: true });

    let addedMedia = 0;
    for (const media of manifest.media) {
      for (const name of [media.filename, media.thumbnailName].filter(Boolean)) {
        const to = path.join(target, "uploads", name);
        if (!(await exists(to))) await copyFile(path.join(source, "uploads", name), to);
      }
      if (!state.media.some((m) => m.id === media.id)) {
        state.media.push(media);
        addedMedia++;
      }
    }

    let addedClips = 0;
    for (const key of ["draft", "published"]) {
      const content = state[key];
      if (!content) continue;
      content.memoryVideos ||= [];
      for (const clip of manifest.memoryVideos) {
        if (content.memoryVideos.some((v) => v.mediaId === clip.mediaId)) continue;
        if (content.memoryVideos.length >= MAX_VIDEOS)
          throw new Error(`${label}: the ${key} content already has ${MAX_VIDEOS} videos (the maximum).`);
        content.memoryVideos.push({ ...clip });
        if (key === "draft") addedClips++;
      }
    }

    if (addedMedia || addedClips) {
      const backup = path.join(target, "birthday.before-videos.json");
      if (!(await exists(backup))) await copyFile(file, backup);
      state.revision = (state.revision || 0) + 1;
      const temp = `${file}.tmp`;
      await writeFile(temp, JSON.stringify(state, null, 2) + "\n");
      await rename(temp, file);
      touched++;
    }
    const total = state.draft?.memoryVideos?.length ?? 0;
    console.log(`- ${label}: added ${addedClips} video(s) (${total} videos in total)`);
  }
  console.log(touched ? "\nDone. Start the app with npm start and open the Memory chapter to check the new clips." : "\nNothing to change: the clips are already there.");
  console.log("To publish online: git add . && git commit -m \"Add 5 memory videos\" && git push origin main");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
