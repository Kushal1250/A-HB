// Builds seed-data/ from your local data/ folder so the content can be deployed.
//
//   npm run deploy:seed
//   node scripts/prepare-seed.mjs [sourceDir] [destDir]
//
// What it keeps:   birthday.json (published + draft), garden-entrance.png, and
//                  only the uploaded files your content actually references.
// What it leaves:  backups, *.before-*.json, half-finished uploads, unused media,
//                  and files already bundled in shared/assets (the server copies
//                  those itself on start).
// What it removes: administrator accounts and login sessions (password hashes
//                  should not live in Git; the admin is created from the
//                  ADMIN_EMAIL / ADMIN_PASSWORD environment variables instead).
import {
  copyFile,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.resolve(process.argv[2] || path.join(root, "data"));
const dest = path.resolve(process.argv[3] || path.join(root, "seed-data"));
const MAX_REPO_MB = 900; // GitHub recommends keeping repositories under ~1 GB.

const exists = (p) =>
  stat(p).then(
    () => true,
    () => false,
  );

async function filesUnder(directory) {
  const names = new Set();
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "originals") continue; // source PNGs, never served
      for (const n of await filesUnder(full)) names.add(n);
    } else names.add(entry.name);
  }
  return names;
}

try {
  if (!(await exists(path.join(source, "birthday.json"))))
    throw new Error(`Could not find ${path.join(source, "birthday.json")}. Run this from the project folder that contains data/.`);
  const state = JSON.parse(await readFile(path.join(source, "birthday.json"), "utf8"));
  const bundled = await filesUnder(path.join(root, "shared", "assets"));
  const contentText = JSON.stringify({ draft: state.draft, published: state.published });

  const keep = [];
  const filesToCopy = new Set();
  let dropped = 0;
  for (const media of state.media) {
    const names = [media.filename, media.thumbnailName].filter(Boolean);
    const referenced = contentText.includes(media.id);
    const builtin = bundled.has(media.filename);
    if (!referenced && !builtin) {
      dropped++;
      continue;
    }
    keep.push(media);
    if (!builtin) for (const n of names) filesToCopy.add(n);
  }

  const missing = [];
  for (const n of filesToCopy)
    if (!(await exists(path.join(source, "uploads", n)))) missing.push(n);
  if (missing.length)
    throw new Error(`These uploaded files are listed in birthday.json but missing from data/uploads:\n  ${missing.join("\n  ")}`);

  await rm(dest, { recursive: true, force: true });
  await mkdir(path.join(dest, "uploads"), { recursive: true });
  let bytes = 0;
  for (const n of filesToCopy) {
    await copyFile(path.join(source, "uploads", n), path.join(dest, "uploads", n));
    bytes += (await stat(path.join(source, "uploads", n))).size;
  }
  if (await exists(path.join(source, "garden-entrance.png"))) {
    await copyFile(path.join(source, "garden-entrance.png"), path.join(dest, "garden-entrance.png"));
    bytes += (await stat(path.join(source, "garden-entrance.png"))).size;
  }
  const clean = { ...state, media: keep, admins: [], sessions: [] };
  await writeFile(path.join(dest, "birthday.json"), JSON.stringify(clean, null, 2) + "\n");

  const mb = bytes / 1024 / 1024;
  console.log(`seed-data/ is ready: ${dest}`);
  console.log(`  media entries kept: ${keep.length}  (unused entries left out: ${dropped})`);
  console.log(`  uploaded files copied: ${filesToCopy.size}  (${mb.toFixed(1)} MB)`);
  console.log(`  administrators and sessions removed from the copy`);
  if (mb > MAX_REPO_MB)
    console.warn(`\nWARNING: ${mb.toFixed(0)} MB is large for a Git repository. Consider a paid persistent disk instead (see docs/DEPLOYMENT.md).`);
  console.log("\nNext: git add seed-data && git commit -m \"Add deployment seed data\" && git push");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
