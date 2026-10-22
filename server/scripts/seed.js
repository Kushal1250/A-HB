import mongoose from "mongoose";
import { config } from "../src/config.js";
import { connectDatabase } from "../src/models.js";
import { seed } from "../src/services/content.js";
try {
  await connectDatabase(config.mongo);
  await seed();
  console.log("Birthday content is ready. Existing edits were preserved.");
} catch {
  console.error("Seed failed. Check MongoDB configuration.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
