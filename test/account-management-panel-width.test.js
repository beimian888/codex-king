import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tokenImport = readFileSync(join(root, "src/views/TokenImport/index.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  tokenImport.includes("--account-panel-width: 100%;"),
  "account management page must define one shared panel width from the page container",
);

assert(
  tokenImport.includes(".tokens-section,\n.account-password-panel {") &&
    tokenImport.includes("width: var(--account-panel-width);") &&
    tokenImport.includes("margin-inline: auto;"),
  "account list and password panels must share the same centered width rule",
);

assert(
  tokenImport.includes(".tokens-section {\n  margin-top: 0;") &&
    tokenImport.includes(".account-password-panel {\n  margin-top: 18px;"),
  "account list and password panels must keep their vertical spacing after sharing width",
);

console.log("account management panels share the same width");
