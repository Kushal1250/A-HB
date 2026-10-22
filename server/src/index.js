import { spawn } from "node:child_process";
import { createApp } from "./app.js";
import { createStore } from "./store.js";
const store = createStore();
try {
  await store.ready;
  const app = createApp({ store });
  const port = Number(process.env.PORT || 3000);
  const server = app.listen(port, "0.0.0.0", ()  => {
    console.log(
      "\n  THE GARDEN OF OCTOBER — For Anu, from Kushal.\n\n  Open:   http://localhost:3000\n  Studio: http://localhost:3000/admin\n\n  Local files only. Press Ctrl+C to stop.\n",
    );
    if (process.platform === "win32" && process.env.OPEN_BROWSER === "1")
      spawn("cmd.exe", ["/c", "start", "", "http://localhost:3000"], {
        detached: true,
        stdio: "ignore",
      }).unref();
  });
  server.on("error", (e) => {
    console.error(
      e.code === "EADDRINUSE"
        ? "Port 3000 is already in use. Stop the other app, then run npm start again. No alternative port was opened."
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
