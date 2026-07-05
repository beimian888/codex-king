import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const accountLabel = "\u8d26\u53f7\u7ba1\u7406";
const oldTokenManagerLabel = "Token\u7ba1\u7406";
const accountModulePath = "/admin/account-management";
const hiddenNavigationPaths = [
  "/admin/message-test",
  "/admin/profile",
  "/admin/daily-tasks",
];

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

function assertNavigationLinkHidden(markup, path, location) {
  const pathIndex = markup.indexOf(`to="${path}"`);
  if (pathIndex === -1) {
    return;
  }

  const blockStart = markup.lastIndexOf("<router-link", pathIndex);
  const blockEnd = markup.indexOf("</router-link>", pathIndex);
  const linkBlock = markup.slice(blockStart, blockEnd);
  assert(
    linkBlock.includes('v-if="false"'),
    `${location} navigation must hide ${path}`,
  );
}

const layout = read("src/layout/DefaultLayout.vue");
const router = read("src/router/index.js");
const profile = read("src/views/Profile.vue");
const tokenImport = read("src/views/TokenImport/index.vue");
const gameFeatures = read("src/views/GameFeatures.vue");

const brandStart = layout.indexOf('class="nav-brand"');
const menuStart = layout.indexOf('class="nav-menu"');
const brandLogoLink = layout.indexOf('to="/"', brandStart);
assert(brandLogoLink !== -1, "desktop brand logo must link back to the home page");
assert(brandLogoLink < menuStart, "desktop brand logo home link must appear before module navigation");
assert(
  layout.slice(brandStart, menuStart).includes('class="brand-logo-link"'),
  "desktop brand logo home link must have a stable class",
);
assert(
  layout.slice(brandStart, menuStart).includes('class="brand-logo"'),
  "desktop brand logo image must stay inside the home link area",
);

const navStart = layout.indexOf('class="nav-menu"');
const gameFeatureNav = layout.indexOf('to="/admin/game-features"', navStart);
const accountNav = layout.indexOf(`to="${accountModulePath}"`, navStart);
assert(accountNav !== -1, "desktop account module must render in the default layout content area");
assert(accountNav < gameFeatureNav, "desktop account module must appear before game features");
assert(
  layout.slice(accountNav, gameFeatureNav).includes(`<span>${accountLabel}</span>`),
  "desktop account module label must be account management",
);

const drawerStart = layout.indexOf('class="drawer-menu"');
const gameFeatureDrawer = layout.indexOf('to="/admin/game-features"', drawerStart);
const accountDrawer = layout.indexOf(`to="${accountModulePath}"`, drawerStart);
assert(accountDrawer !== -1, "mobile drawer account module must render in the default layout content area");
assert(accountDrawer < gameFeatureDrawer, "mobile drawer account module must appear before game features");
assert(
  layout.slice(accountDrawer, gameFeatureDrawer).includes(`<span>${accountLabel}</span>`),
  "mobile drawer account module label must be account management",
);
const navEnd = layout.indexOf('class="nav-user"', navStart);
const desktopNavigationMarkup = layout.slice(navStart, navEnd);
const drawerEnd = layout.indexOf("</div>", drawerStart);
const drawerNavigationMarkup = layout.slice(drawerStart, drawerEnd);
for (const path of hiddenNavigationPaths) {
  assertNavigationLinkHidden(desktopNavigationMarkup, path, "desktop");
  assertNavigationLinkHidden(drawerNavigationMarkup, path, "mobile drawer");
}

assert(
  !layout.includes("<AccountManager embedded />"),
  "account manager must not be appended under unrelated modules",
);
assert(
  !layout.includes('id="account-management-panel"'),
  "global layout must not create an account-management-panel under every module",
);
assert(
  layout.includes("isAccountManagementRoute"),
  "layout must detect the account management route",
);
assert(
  layout.includes("!isAccountManagementRoute.value"),
  "account management route must not render the global ambient background",
);
assert(
  router.includes("path: 'account-management'"),
  "router must define account management as a DefaultLayout child page",
);
assert(
  router.includes("name: 'AccountManagement'"),
  "account management child route must have its own route name",
);
const accountRouteStart = router.indexOf("name: 'AccountManagement'");
const accountRouteEnd = router.indexOf("path: 'game-features'", accountRouteStart);
assert(
  router.slice(accountRouteStart, accountRouteEnd).includes(`title: '${accountLabel}'`),
  "account management child route title must not be garbled",
);
assert(
  !router.includes("璐﹀彿绠＄悊"),
  "router must not contain mojibake account title text",
);
assert(
  router.includes("component: () => import('@/views/TokenImport/index.vue')"),
  "account management child route must reuse the token import account page",
);
assert(
  router.includes("path: '/tokens'"),
  "legacy /tokens route must remain available for existing links and import params",
);
assert(
  router.includes("inAppLayout: true"),
  "account management child route must pass the in-app layout mode to avoid duplicate chrome",
);
assert(
  router.includes(`title: '${accountLabel}'`),
  "token route title must be renamed to account management",
);
assert(
  profile.includes(`<h2>${accountLabel}</h2>`),
  "profile account section heading must be account management",
);
assert(
  tokenImport.includes(">添加账号</a-button"),
  "token import empty-state action must be add account",
);
assert(
  tokenImport.includes("!inAppLayout.value && !tokenStore.hasTokens"),
  "in-app account module must not auto-open the standalone import modal",
);
assert(
  tokenImport.includes(':default-visible="!inAppLayout && !tokenStore.hasTokens"'),
  "in-app account module modal default state must stay closed",
);
assert(
  tokenImport.includes('class="account-empty-state"'),
  "in-app account empty state must use a visible module panel",
);
const tokenSectionHeader = tokenImport.indexOf('class="section-header"');
const accountSwitcher = tokenImport.indexOf('class="account-switcher"', tokenSectionHeader);
assert(
  accountSwitcher === -1,
  "account switcher must be moved out of the account management list header",
);

const gameHeaderActions = gameFeatures.indexOf('class="header-actions"');
const gameConnectionStatus = gameFeatures.indexOf('class="connection-status"', gameHeaderActions);
assert(
  gameHeaderActions !== -1 && gameConnectionStatus !== -1,
  "game feature header must keep the connection status control",
);
assert(
  !gameFeatures.includes('class="game-feature-account-switcher"') &&
    !gameFeatures.includes("accountSwitcherOptions") &&
    !gameFeatures.includes("const switchAccount =") &&
    !gameFeatures.includes('placeholder="切换账号"'),
  "game feature header must remove the account switcher",
);
assert(
  gameFeatures.includes("padding: 14px 0 12px") &&
    gameFeatures.includes("font-size: var(--font-size-xl)") &&
    gameFeatures.includes("min-height: 32px"),
  "game feature header must use a reduced-height layout",
);

for (const [file, content] of [
  ["src/layout/DefaultLayout.vue", layout],
  ["src/router/index.js", router],
  ["src/views/Profile.vue", profile],
  ["src/views/TokenImport/index.vue", tokenImport],
  ["src/views/GameFeatures.vue", gameFeatures],
]) {
  assert(!content.includes(oldTokenManagerLabel), `${file} still contains the old token manager label`);
}

console.log("account module renders in the default layout and is correctly ordered");
