import {
  mkdir,
  readFile,
  writeFile,
  rename,
  rm,
  copyFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID } from "node:crypto";
import { constants } from "node:fs";
import { defaultJourney, normaliseJourney, withStepDefaults, newLetter, newFinalWish, centralBirthdayWish } from "../../shared/journey.js";
export const journeyMusic = JSON.parse(await readFile(new URL("../../shared/assets/journey/manifest.json",import.meta.url),"utf8"));
import { emptyBlessings } from "../../shared/blessings.js";
export const builtinBlessings = JSON.parse(await readFile(new URL("../../shared/assets/blessings/manifest.json", import.meta.url), "utf8"));
export const initialBlessings = { ...emptyBlessings, enabled: true, photos: builtinBlessings.photos, featuredId: builtinBlessings.photos[0].id, videoId: builtinBlessings.videoId };
export const builtinMusic = JSON.parse(
  await readFile(
    new URL("../../shared/assets/music.json", import.meta.url),
    "utf8",
  ),
);
const builtinAudio = new URL(
  "../../shared/assets/october-light.wav",
  import.meta.url,
);
export const defaults = JSON.parse(
  await readFile(
    new URL("../../shared/defaults.json", import.meta.url),
    "utf8",
  ),
);
export const defaultDataDirectory = fileURLToPath(
  new URL("../../data/", import.meta.url),
);
export function createStore(directory = defaultDataDirectory) {
  const file = path.join(directory, "birthday.json");
  let queue = Promise.resolve();
  async function write(state) {
    const temp = path.join(directory, `.save-${randomUUID()}.tmp`);
    try {
      await writeFile(temp, JSON.stringify(state, null, 2) + "\n", {
        mode: 0o600,
      });
      await rename(temp, file);
    } finally {
      await rm(temp, { force: true }).catch(() => {});
    }
  }
  const ready = (async () => {
    await mkdir(path.join(directory, "uploads"), { recursive: true });
    try {
      JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      if (error.code !== "ENOENT")
        throw new Error(
          "The local birthday data file could not be read. Restore data/birthday.json from a backup; it was not overwritten.",
        );
      await write({
        version: 2,
        revision: 0,
        draft: defaults,
        published: defaults,
        publishedAt: new Date().toISOString(),
        admins: [],
        sessions: [],
        media: [builtinMusic],
        mediaKey: randomBytes(32).toString("hex"),
      });
    }
    const state = JSON.parse(await readFile(file, "utf8"));
    const needsMigration = !state.draft.blessings || !state.published.blessings;
    if (needsMigration) {
      await copyFile(file, path.join(directory, 'birthday.before-blessings.json'), constants.COPYFILE_EXCL).catch(e => { if(e.code !== 'EEXIST') throw e; });
      for (const key of ['draft','published']) if (!state[key].blessings) state[key].blessings = structuredClone(initialBlessings);
      for (const asset of builtinBlessings.media) if (!state.media.some(m => m.id === asset.id)) state.media.push(asset);
      state.revision++;
      await write(state);
    }
    if (state.journeyVersion !== 1) {
      await copyFile(file,path.join(directory,'birthday.before-keys.json'),constants.COPYFILE_EXCL).catch(e=>{if(e.code!=='EEXIST')throw e;});
      for (const snapshot of ['draft','published']) {
        const c=state[snapshot];
        const hadJourney=!!c.journey;
        c.journey=normaliseJourney(c.journey);
        if(!hadJourney&&c.musicId&&c.musicId!==builtinMusic.id)c.journey.chapters[0].trackId=c.musicId;
        c.blessings.photos=c.blessings.photos.map(withStepDefaults);
        if(c.letter===defaults.letter)c.letter=newLetter;
        if(c.finalMessage===defaults.finalMessage)c.finalMessage=newFinalWish;
      }
      for(const asset of journeyMusic)if(!state.media.some(m=>m.id===asset.id))state.media.push(asset);
      state.journeyVersion=1;state.revision++;
      await write(state);
    }
    if(state.creativeVersion!==1) {
      await copyFile(file,path.join(directory,'birthday.before-creative.json'),constants.COPYFILE_EXCL).catch(e=>{if(e.code!=='EEXIST')throw e;});
      const oldKinds=['curtains','trace','doors','flower','lamp','page','arch'];
      const newKinds=['curtains','trace','doors','flower','lamp','page','arch','ribbon','hanging','window','garland','envelope','finalcard'];
      const replacements={invitation:['seal','scratch'],lantern:['lantern','shake'],memories:['pattern','slide'],letter:['envelope','trace']};
      for(const snapshot of ['draft','published']) {
        const c=state[snapshot];c.journey=normaliseJourney(c.journey);
        if(!c.journey.centralWish)c.journey.centralWish=centralBirthdayWish;
        for(const ch of c.journey.chapters){const rule=replacements[ch.id];if(rule&&ch.unlock===rule[0])ch.unlock=rule[1];
          const recording=journeyMusic.find(m=>m.id===ch.trackId);
          if(recording){ch.trackTitle ||= recording.title;ch.artist ||= 'Original synthesised composition';ch.source ||= 'scripts/compose-journey.py';ch.license ||= 'Original project recording, included for use with this birthday website.';ch.duration ||= recording.duration;}
          else if(ch.trackId){ch.provenance='supplied';ch.source ||= 'Existing local uploaded recording';ch.license ||= 'User-supplied recording; rights not independently verified.';}
        }
        c.blessings.photos=c.blessings.photos.map((p,i)=>({...p,reveal:p.reveal===oldKinds[i%7]?newKinds[i%13]:p.reveal}));
      }
      state.creativeVersion=1;state.revision++;await write(state);
    }
    for(const asset of journeyMusic.filter(a=>state.media.some(m=>m.id===a.id))) {
      await copyFile(new URL(`../../shared/assets/journey/${asset.filename}`,import.meta.url),path.join(directory,'uploads',asset.filename),constants.COPYFILE_EXCL).catch(e=>{if(e.code!=='EEXIST')throw e;});
    }
    for (const asset of builtinBlessings.media.filter(a => state.media.some(m => m.id === a.id))) {
      for (const name of [asset.filename, asset.thumbnailName].filter(Boolean)) {
        await copyFile(new URL(`../../shared/assets/blessings/${name}`, import.meta.url), path.join(directory, 'uploads', name), constants.COPYFILE_EXCL).catch(e => { if(e.code !== 'EEXIST') throw e; });
      }
    }
    if (state.media.some((m) => m.id === builtinMusic.id)) {
      try {
        await copyFile(
          builtinAudio,
          path.join(directory, "uploads", builtinMusic.filename),
          constants.COPYFILE_EXCL,
        );
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
    }
  })();
  async function read() {
    await ready;
    await queue;
    return JSON.parse(await readFile(file, "utf8"));
  }
  function update(mutate) {
    const operation = queue.then(async () => {
      await ready;
      const state = JSON.parse(await readFile(file, "utf8"));
      const result = await mutate(state);
      await write(state);
      return result;
    });
    queue = operation.catch(() => {});
    return operation;
  }
  return { directory, ready, read, update };
}
