import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const main = readFileSync(join(root, "src/main.js"), "utf8");
const viteConfig = readFileSync(join(root, "vite.config.js"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  !main.includes('import naive from "naive-ui"') &&
    !main.includes("import naive from 'naive-ui'") &&
    !main.includes("app.use(naive)"),
  "main entry must not globally register all of Naive UI",
);

assert(
  viteConfig.includes("NaiveUiResolver") &&
    viteConfig.includes("NaiveUiResolver && NaiveUiResolver()"),
  "Vite component auto-registration must include NaiveUiResolver for on-demand Naive UI components",
);

assert(
  viteConfig.includes("filter(Boolean)") &&
    viteConfig.includes("resolvers: componentResolvers"),
  "Vite component resolvers must filter optional resolvers and use the shared resolver list",
);

console.log("naive ui is configured for on-demand component loading");
