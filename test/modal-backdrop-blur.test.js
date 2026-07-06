import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const app = readFileSync(join(root, "src/App.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  app.includes(".n-modal-mask") &&
    app.includes("backdrop-filter: blur(18px) saturate(140%);") &&
    app.includes("-webkit-backdrop-filter: blur(18px) saturate(140%);"),
  "Naive modal mask must blur and soften the page behind dialogs",
);

assert(
  app.includes("background: rgba(226, 232, 240, 0.15) !important;"),
  "light modal mask must use a 15% translucent veil",
);

assert(
  app.includes("html[data-theme=\"dark\"] .n-modal-mask") &&
    app.includes("background: rgba(2, 6, 23, 0.15) !important;"),
  "dark modal mask must use a 15% translucent veil",
);

assert(
  app.includes("@supports not ((backdrop-filter: blur(1px))") &&
    app.includes("background: rgba(15, 23, 42, 0.15) !important;"),
  "modal mask must provide a readable fallback when backdrop-filter is unavailable",
);

console.log("modal backdrop blur styles are defined for light and dark themes");
