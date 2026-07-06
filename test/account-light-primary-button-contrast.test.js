import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tokenImport = readFileSync(join(root, "src/views/TokenImport/index.vue"), "utf8");
const globalStyles = readFileSync(join(root, "src/assets/styles/global.scss"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  globalStyles.includes(
    ".default-layout:not(.web-game-layout) .token-import-page .header-actions .n-button.n-button--primary-type",
  ) &&
    globalStyles.includes(
      ".default-layout:not(.web-game-layout) .token-import-page .account-password-submit.n-button.n-button--primary-type",
    ) &&
    globalStyles.includes(
      ".default-layout:not(.web-game-layout) .token-import-page .account-empty-state .arco-btn.arco-btn-primary",
    ),
  "account page light mode must override the global glass button style for header, password, and empty-state primary buttons",
);

assert(
  globalStyles.includes("background: linear-gradient(135deg, #0369a1, #075985) !important;") &&
    globalStyles.includes("border-color: rgba(3, 105, 161, 0.95) !important;") &&
    globalStyles.includes("color: #ffffff !important;"),
  "account page light primary buttons must use an AA-readable deep blue fill with white text",
);

assert(
  globalStyles.includes(
    ".default-layout:not(.web-game-layout) .token-import-page .n-button--primary-type .n-button__content",
  ) &&
    globalStyles.includes(
      ".default-layout:not(.web-game-layout) .token-import-page .arco-btn-primary .arco-btn-content",
    ) &&
    globalStyles.includes("text-shadow: 0 1px 1px rgba(8, 47, 73, 0.28);"),
  "account page light primary button labels must remain legible inside Naive and Arco button content",
);

console.log("account page light primary buttons keep readable labels");
