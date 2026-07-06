import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGame = readFileSync(join(root, "src/views/WebGame.vue"), "utf8");
const defaultLayout = readFileSync(join(root, "src/layout/DefaultLayout.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  webGame.includes("--web-game-page-bg") &&
    webGame.includes("--web-game-card-bg") &&
    webGame.includes("--web-game-empty-color"),
  "web game page must define theme variables for the page, cards, and empty text",
);

assert(
  webGame.includes(':global([data-theme="dark"] .web-game-page)'),
  "web game page must provide dark theme overrides instead of one permanent dark style",
);

assert(
  webGame.includes("background: var(--web-game-page-bg)") &&
    webGame.includes("background: var(--web-game-card-bg)") &&
    webGame.includes("color: var(--web-game-empty-color)"),
  "web game background panel and empty state must consume theme variables",
);

assert(
  !/\.web-game-page\s*\{[\s\S]*?background:\s*#05070a;/.test(webGame),
  "web game page background must not be permanently hard-coded to dark",
);

assert(
  defaultLayout.includes("background: var(--web-game-layout-bg, var(--app-background))"),
  "web game route layout background must follow theme variables",
);

console.log("web game background follows light and dark theme variables");
