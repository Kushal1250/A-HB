// Copy the built React application to the existing static Sites preview.
// Vercel deploys client/dist directly; Render runs server/src/index.js.
import { cp, mkdir, rm } from "node:fs/promises";
const root = new URL("../", import.meta.url);
await rm(new URL("dist/", root), { recursive: true, force: true });
await cp(new URL("client/dist/", root), new URL("dist/", root), {
  recursive: true,
});
await mkdir(new URL("dist/admin/", root), { recursive: true });
await cp(
  new URL("client/dist/index.html", root),
  new URL("dist/admin/index.html", root),
);
console.log(
  "Static frontend preview prepared. Backend remains a separate Render service.",
);
