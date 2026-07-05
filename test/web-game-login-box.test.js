import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const webGame = readFileSync(join(root, "src/views/WebGame.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(!webGame.includes('class="account-picker"'), "web game page must not render the login account picker");
assert(!webGame.includes('class="token-select"'), "web game page must not render the account select box");
assert(!webGame.includes("登录/进入游戏"), "web game page must not render the manual login button");
assert(!webGame.includes("LogInOutline"), "web game page must not import the login icon after removing the login box");
assert(webGame.includes("void loginSelectedToken(true);"), "web game page must still auto-enter the selected game account");
assert(webGame.includes("watch(") && webGame.includes("void loginSelectedToken(true);"), "web game account changes must auto-enter without a login button");
assert(webGame.includes("刷新游戏"), "web game page must keep the refresh control");
assert(webGame.includes("去导入 Token"), "web game page must keep the import-token fallback");

console.log("web game login box is removed while auto-entry remains");
