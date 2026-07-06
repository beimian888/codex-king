import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const tokenImport = readFileSync(
  join(root, "src/views/TokenImport/index.vue"),
  "utf8",
);

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const headerActionsStart = tokenImport.indexOf('class="header-actions"');
const headerActionsEnd = tokenImport.indexOf("</div>", headerActionsStart);
const headerActions = tokenImport.slice(headerActionsStart, headerActionsEnd);

assert(headerActionsStart !== -1, "account page must render header actions");

assert(
  headerActions.includes("添加账号") && !headerActions.includes("添加Token"),
  "account page primary action must be renamed from add token to add account",
);

assert(
  !headerActions.includes("批量功能") &&
    !headerActions.includes("批量操作") &&
    !headerActions.includes("goToBatchDailyTasks") &&
    !headerActions.includes("bulkOptions") &&
    !headerActions.includes("handleBulkAction"),
  "account page header must remove batch feature and batch operation actions",
);

console.log("account management header actions are simplified");
