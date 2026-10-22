import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const local = path => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  resolve: { alias: [
    { find: 'birthday-original-jsx', replacement: local('./node_modules/react/jsx-runtime.js') },
    { find: 'birthday-original-jsx-dev', replacement: local('./node_modules/react/jsx-dev-runtime.js') },
    { find: /^react\/jsx-runtime$/, replacement: local('./src/name-runtime.jsx') },
    { find: /^react\/jsx-dev-runtime$/, replacement: local('./src/name-runtime.jsx') },
  ] },
  plugins: [react()],
  server: { host: "127.0.0.1", port: 3000, strictPort: true },
  preview: { host: "127.0.0.1", port: 3000, strictPort: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    restoreMocks: true,
  },
});
