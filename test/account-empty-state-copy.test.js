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

const emptyStateStart = tokenImport.indexOf('class="account-empty-state"');
assert(emptyStateStart !== -1, "account page must render a stable empty-state block");

const emptyStateEnd = tokenImport.indexOf("</a-empty>", emptyStateStart);
assert(emptyStateEnd !== -1, "account empty-state block must close with </a-empty>");

const emptyStateBlock = tokenImport.slice(emptyStateStart, emptyStateEnd);

assert(
  emptyStateBlock.includes("还没有添加任何账号"),
  "account empty-state message must say there are no accounts yet",
);
assert(
  emptyStateBlock.includes(">添加账号</a-button"),
  "account empty-state action must say add account",
);
assert(
  !emptyStateBlock.includes("还没有导入任何Token"),
  "account empty-state message must no longer mention importing Token",
);
assert(
  !emptyStateBlock.includes(">打开账号管理</a-button"),
  "account empty-state action must no longer say open account management",
);
assert(
  tokenImport.includes("const openshowImportForm = () =>") &&
    tokenImport.includes("showImportForm.value = true"),
  "account empty-state add action must open the account import modal",
);
assert(
  tokenImport.includes(':global([data-theme="dark"] .token-import-page)') &&
    tokenImport.includes(':global([data-theme="dark"] .token-import-page.in-app-layout)'),
  "account page dark-mode styles must pierce scoped CSS and apply from the html theme attribute",
);
assert(
  !/^\[data-theme="dark"\]\s+\./m.test(tokenImport),
  "account page must not use scoped dark-mode selectors that cannot match the global theme attribute",
);
assert(
  !tokenImport.includes(':global([data-theme="dark"]) .'),
  "account page dark-mode selectors must wrap the full selector in :global(...)",
);

console.log("account empty-state copy matches the requested wording");
