import { access, cp, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword, verifyPassword } from "./services/passwords.js";

// Folder created by `npm run deploy:seed` and committed to Git.
export const defaultSeedDirectory = fileURLToPath(
  new URL("../../seed-data/", import.meta.url),
);

const exists = (file) =>
  access(file).then(
    () => true,
    () => false,
  );

/**
 * Hosts such as Render start with an empty checkout and the real `data/`
 * folder is (deliberately) not in Git. On first boot, copy the committed
 * seed-data/ folder into the live data directory.
 *
 * - Never overwrites an existing birthday.json (safe on a persistent disk).
 * - Does nothing when there is no seed folder (normal local use).
 * Returns true when files were copied.
 */
export async function seedDataDirectory(
  directory,
  seedDirectory = defaultSeedDirectory,
) {
  if (path.resolve(directory) === path.resolve(seedDirectory)) return false;
  if (await exists(path.join(directory, "birthday.json"))) return false;
  if (!(await exists(path.join(seedDirectory, "birthday.json")))) return false;
  await mkdir(directory, { recursive: true });
  await cp(seedDirectory, directory, {
    recursive: true,
    force: false,
    errorOnExist: false,
  });
  return true;
}

/**
 * Hosts without a shell (Render free plan) cannot run `npm run admin:create`.
 * If ADMIN_EMAIL and ADMIN_PASSWORD are set, make sure that administrator
 * exists. The environment variable is the source of truth: changing
 * ADMIN_PASSWORD and restarting updates the stored password hash.
 * Returns "skipped" | "created" | "updated" | "unchanged".
 */
export async function ensureAdmin(store, rawEmail, password) {
  const email = String(rawEmail || "")
    .trim()
    .toLowerCase();
  if (!email && !password) return "skipped";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("ADMIN_EMAIL must be a valid email address.");
  if (typeof password !== "string" || password.length < 12 || password.length > 256)
    throw new Error("ADMIN_PASSWORD must have 12-256 characters.");
  const state = await store.read();
  const existing = state.admins.find((a) => a.email === email);
  if (existing && (await verifyPassword(password, existing.passwordHash)))
    return "unchanged";
  const passwordHash = await hashPassword(password);
  await store.update((s) => {
    const id = existing?.id || randomUUID();
    s.admins = s.admins.filter((a) => a.email !== email);
    s.admins.push({ id, email, passwordHash });
    s.sessions = s.sessions.filter((x) => x.adminId !== id);
  });
  return existing ? "updated" : "created";
}
