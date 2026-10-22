const [major, minor, patch] = process.versions.node.split(".").map(Number);
const valid =
  (major === 22 && (minor > 22 || (minor === 22 && patch >= 2))) ||
  (major === 24 && minor >= 15) ||
  major >= 26;
if (!valid) {
  console.error(
    `\nYour Node.js ${process.versions.node} is too old for this project.\nInstall Node.js 24 LTS (24.15.0 or newer), reopen CMD, then retry.\n`,
  );
  process.exit(1);
}
