import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  const [salt, hex] = stored.split(":");
  const expected = Buffer.from(hex, "hex");
  const actual = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
export const hashToken = (token) =>
  createHash("sha256").update(token).digest("hex");
