import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const globalStyles = readFileSync(join(root, "src/assets/styles/global.scss"), "utf8");
const home = readFileSync(join(root, "src/views/Home.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  globalStyles.includes(".glass-surface"),
  "global styles must define the shared glass surface utility",
);
assert(
  globalStyles.includes(".default-layout:not(.web-game-layout)") &&
    globalStyles.includes("button:not(.n-button--text-type)") &&
    globalStyles.includes(".n-button:not(.n-button--text-type)") &&
    globalStyles.includes(".arco-btn:not(.arco-btn-text):not(.arco-btn-icon-only)"),
  "default layout must apply glass surfaces to native, Naive UI, and Arco buttons",
);
assert(
  globalStyles.includes("backdrop-filter: blur(12px) saturate(1.8) brightness(1.1)") &&
    globalStyles.includes("-webkit-backdrop-filter: blur(12px) saturate(1.8) brightness(1.1)"),
  "glass buttons must keep the requested frosted backdrop filters",
);
assert(
  globalStyles.includes("@supports not (backdrop-filter: blur(10px))"),
  "glass buttons must include a no-backdrop-filter fallback",
);
assert(
  home.includes(".button,") &&
    home.includes(".mobile-menu-trigger,") &&
    home.includes(".mobile-menu-action,") &&
    home.includes(".login-submit,") &&
    home.includes(".login-register-switch,") &&
    home.includes(".login-close"),
  "home page must opt its scoped native buttons into the glass button treatment",
);
assert(
  home.includes("backdrop-filter: blur(12px) saturate(1.8) brightness(1.1)") &&
    home.includes("@supports not (backdrop-filter: blur(10px))"),
  "home scoped buttons must keep the requested frosted filter and fallback",
);

console.log("all web buttons use the shared glass surface treatment");
