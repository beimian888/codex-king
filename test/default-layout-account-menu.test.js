import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const layout = readFileSync(join(root, "src/layout/DefaultLayout.vue"), "utf8");

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

assert(
  !layout.includes("清除所有Token并退出") && !layout.includes("clearAllTokens"),
  "account menu must remove the destructive clear-all-tokens logout option",
);

assert(
  layout.includes('class="account-menu-list"') &&
    layout.includes('v-for="account in accountMenuAccounts"'),
  "account menu must render a selectable multi-account list",
);

assert(
  layout.includes("accountMenuAccounts") && layout.includes("tokenStore.gameTokens"),
  "account menu accounts must be derived from the token store account list",
);

assert(
  layout.includes("@click=\"switchAccount(account.id)\"") &&
    layout.includes("tokenStore.selectToken(tokenId)"),
  "clicking an account in the menu must switch accounts through tokenStore.selectToken",
);

assert(
  layout.includes("@click=\"handleSystemLogout\"") &&
    layout.includes("logoutSystemUser()") &&
    layout.includes('router.push("/")'),
  "logout must clear the system session and return to the home page",
);

assert(
  !layout.includes("tokenStore.removeToken(currentTokenId)") &&
    !layout.includes("tokenStore.removeToken("),
  "logout must not delete any saved account token",
);

assert(
  layout.includes("max-height: calc(48px * 3)") &&
    layout.includes("overflow-y: auto"),
  "account menu list must show at most three accounts before scrolling",
);

assert(
  layout.includes(">退出登录</button>"),
  "account menu must expose a clear logout action",
);

console.log("default layout account menu supports multi-account selection and system logout without deleting accounts");
