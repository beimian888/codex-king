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
  tokenImport.includes("grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));"),
  "account card grid must use auto-fit so two cards stretch across the available panel instead of leaving an empty column",
);

assert(
  tokenImport.includes("grid-template-columns: minmax(0, 1fr) auto;") &&
    tokenImport.includes("align-items: center;") &&
    tokenImport.includes("min-height: 96px;") &&
    tokenImport.includes("padding: 18px 20px;"),
  "account cards must use a compact horizontal header with actions aligned to the right",
);

assert(
  tokenImport.includes(".token-card-command-row {\n  align-items: center;") &&
    tokenImport.includes("justify-content: flex-end;") &&
    tokenImport.includes(".token-card-actions {\n  flex-wrap: nowrap;"),
  "account card action buttons must stay in a single compact row on desktop",
);

assert(
  tokenImport.includes(".account-password-panel {\n  margin-top: 18px;") &&
    tokenImport.includes("padding: 18px 20px;") &&
    tokenImport.includes("gap: 12px;"),
  "password panel must be tightened to match the compact account list rhythm",
);

console.log("account management layout is compact and fills the panel");
