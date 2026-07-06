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
assert(!webGame.includes("void loginSelectedToken(true);"), "web game page must not auto-open a window on entry");
assert(!webGame.includes("loginSelectedToken"), "web game page must only open windows from the add-window action");
assert(!webGame.includes("刷新游戏"), "web game page must not render the refresh toolbar");
assert(webGame.includes("请先导入 Token"), "web game page must keep the import-token empty-state fallback");
assert(!webGame.includes("MAX_GAME_INSTANCES"), "web game multi-open must not cap visible game windows at 4");
assert(!webGame.includes("最多同时多开"), "web game add-window action must not block windows by a hard count limit");
assert(!webGame.includes("gameInstances.value.length <"), "web game add-window availability must not depend on a hard window count");
assert(webGame.includes("gameInstances = ref([])"), "web game page must manage multiple iframe instances");
assert(webGame.includes("openGameInstance"), "web game page must expose an add-window action");
assert(webGame.includes("打开游戏"), "web game add-window action must be labeled 打开游戏");
assert(!webGame.includes("新增窗口"), "web game add-window copy must not use 新增窗口");
assert(webGame.includes('class="multi-open-dock"'), "web game page must render the multi-open add-window entry");
assert(webGame.includes('class="multi-open-account-select"'), "web game add-window entry must require choosing an account");
assert(webGame.includes(':options="multiOpenTokenOptions"'), "web game account picker must show multi-open-aware options");
assert(webGame.includes("openedGameTokenIds"), "web game page must track accounts that already have a window");
assert(webGame.includes("disabled: openedGameTokenIds.value.has(token.id)"), "web game account picker must disable already-open accounts");
assert(webGame.includes("instance.tokenId === tokenId"), "web game page must block opening the same account twice");
assert(webGame.includes('@click="openGameInstance()"'), "web game add-window entry must call openGameInstance");
assert(!webGame.includes("refreshActiveGame"), "web game page must remove the active-window refresh control");
assert(webGame.includes("closeGameInstance"), "web game page must close an individual game window");
assert(webGame.includes("mobile-instance-tabs"), "web game mobile layout must switch windows with tabs");
assert(webGame.includes("instanceId"), "web game iframe URLs must include a per-window instance id");
assert(webGame.includes('class="game-instance-grid"'), "web game page must render a multi-window grid");
assert(webGame.includes('v-for="instance in gameInstances"'), "web game page must render one iframe per game instance");

console.log("web game opens windows only from the add-window action");
