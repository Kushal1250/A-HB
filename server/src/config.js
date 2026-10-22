import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
export const config = {
  port: Number(process.env.PORT || 5000),
  mongo: process.env.MONGODB_URI || "",
  origins: (process.env.FRONTEND_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  production: process.env.NODE_ENV === "production",
  trustProxy: Number(process.env.TRUST_PROXY || 0),
  cloud: {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  },
};
