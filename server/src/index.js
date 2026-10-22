import { spawn } from "node:child_process";
import path from "node:path";
import { createApp } from "./app.js";
import { ensureAdmin, seedDataDirectory } from "./deploy.js";
import { createStore, defaultDataDirectory } from "./store.js";
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
// DATA_DIR lets a host point the app at a persistent disk (e.g. /var/data).
// Without it the project's own data/ folder is used, exactly as before.
const dataDirectory = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : defaultDataDirectory;
try {
  if (await seedDataDirectory(dataDirectory))
    console.log("First start: copied seed-data/ into the data directory.");
  const store = createStore(dataDirectory);
  await store.ready;
  const adminStatus = await ensureAdmin(
    store,
    process.env.ADMIN_EMAIL,
    process.env.ADMIN_PASSWORD,
  );
  if (adminStatus !== "skipped") console.log(`Administrator account: ${adminStatus}.`);
  const app = createApp({ store });
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(
      production
        ? `\n  THE GARDEN OF OCTOBER API is listening on port ${port}.\n`
        : `\n  THE GARDEN OF OCTOBER — For Anu, from Kushal.\n\n  Open:   http://localhost:${port}\n  Studio: http://localhost:${port}/admin\n\n  Local files only. Press Ctrl+C to stop.\n`,
    );
    if (process.platform === "win32" && process.env.OPEN_BROWSER === "1")
      spawn("cmd.exe", ["/c", "start", "", `http://localhost:${port}`], {
        detached: true,
        stdio: "ignore",
      }).unref();
  });
  server.on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? `Port ${port} is already in use. Stop the other app, then run npm start again.`
        : e.message,
    );
    process.exitCode = 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(0), 5000).unref();
    });
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
