import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { createStore } from "../src/store.js";
import { randomUUID } from "node:crypto";
const store = createStore();
import { hashPassword } from "../src/services/passwords.js";
let hidden = false;
const output = new Writable({
  write(chunk, _encoding, done) {
    if (!hidden) process.stdout.write(chunk);
    done();
  },
});
const rl = createInterface({
  input: process.stdin,
  output,
  terminal: !!process.stdin.isTTY,
  historySize: 0,
});
async function secret(prompt) {
  if (!process.stdin.isTTY)
    throw new Error("Use an interactive terminal to enter a password.");
  process.stdout.write(prompt);
  hidden = true;
  try {
    return await rl.question("");
  } finally {
    hidden = false;
    process.stdout.write("\n");
  }
}
try {
  const email = (await rl.question("Admin email: ")).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email.");
  const password = await secret("New password (12–256 characters, hidden): ");
  if (password.length < 12 || password.length > 256)
    throw new Error("Password must have 12–256 characters.");
  const repeated = await secret("Confirm password (hidden): ");
  if (password !== repeated) throw new Error("Passwords do not match.");
  const state = await store.read();
  const existing = state.admins.find((a) => a.email === email);
  if (existing) {
    const confirm = await rl.question(
      "Account exists. Reset its password and sign out its sessions? Type RESET: ",
    );
    if (confirm !== "RESET") throw new Error("Cancelled.");
  }
  const passwordHash = await hashPassword(password);
  await store.update((s) => {
    const id = existing?.id || randomUUID();
    s.admins = s.admins.filter((a) => a.email !== email);
    s.admins.push({ id, email, passwordHash });
    s.sessions = s.sessions.filter((x) => x.adminId !== id);
  });
  console.log("Administrator account is ready. Sign in at /admin.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rl.close();
}
