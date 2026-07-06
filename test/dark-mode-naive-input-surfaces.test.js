import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const app = readFileSync(join(root, "src/App.vue"), "utf8");
const tokenImport = readFileSync(join(root, "src/views/TokenImport/index.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const darkInputSelector = [
  "html.dark .n-input,",
  "html.dark .n-input .n-input__input,",
  "html.dark .n-input .n-input__input-el,",
  "html.dark .n-input .n-input__suffix,",
  "html[data-theme=\"dark\"] .n-input,",
  "html[data-theme=\"dark\"] .n-input .n-input__input,",
  "html[data-theme=\"dark\"] .n-input .n-input__input-el,",
  "html[data-theme=\"dark\"] .n-input .n-input__suffix",
].join("\n");

assert(app.includes(darkInputSelector), "global dark theme must cover all Naive input surfaces");

assert(
  app.includes("background-color: var(--app-surface-muted) !important;") &&
    app.includes("box-shadow: inset 0 0 0 9999px transparent;"),
  "dark Naive input internals must inherit the dark surface without bright strips",
);

assert(
  app.includes("html.dark .n-input .n-input__input-el:-webkit-autofill") &&
    app.includes("-webkit-box-shadow: 0 0 0 1000px var(--app-surface-muted) inset !important;"),
  "dark Naive input autofill must not paint a light browser background",
);

assert(
  tokenImport.includes(":global([data-theme=\"dark\"] .n-input__input),") &&
    tokenImport.includes("background-color: transparent !important;"),
  "account page must not reintroduce translucent white backgrounds inside dark Naive inputs",
);

console.log("dark mode Naive input surfaces stay fully dark");
