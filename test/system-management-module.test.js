import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const moduleLabel = "系统管理";
const modulePath = "/admin/system-management";

function read(relativePath) {
  return readFileSync(join(root, relativePath), "utf8");
}

function assert(condition, message) {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const router = read("src/router/index.js");
const layout = read("src/layout/DefaultLayout.vue");
const systemPage = read("src/views/SystemManagement.vue");
const variables = read("src/assets/styles/variables.scss");
const app = read("src/App.vue");

assert(
  router.includes("path: 'system-management'"),
  "router must define the system management child route",
);
assert(
  router.includes("name: 'SystemManagement'"),
  "system management route must use the SystemManagement name",
);
assert(
  router.includes("component: () => import('@/views/SystemManagement.vue')"),
  "system management route must lazy-load the SystemManagement page",
);
const systemRouteStart = router.indexOf("name: 'SystemManagement'");
const systemRouteEnd = router.indexOf("path: 'game-features'", systemRouteStart);
assert(systemRouteStart !== -1, "system management route block must exist");
assert(systemRouteEnd !== -1, "system management route should be placed before game features");
assert(
  router.slice(systemRouteStart, systemRouteEnd).includes(`title: '${moduleLabel}'`),
  "system management route title must be 系统管理",
);
assert(
  router.slice(systemRouteStart, systemRouteEnd).includes("requiresToken: false"),
  "system management static page must not require an imported token",
);

const navStart = layout.indexOf('class="nav-menu"');
const navEnd = layout.indexOf('class="nav-user"', navStart);
const desktopNavigationMarkup = layout.slice(navStart, navEnd);
const desktopSystemNav = desktopNavigationMarkup.indexOf(`to="${modulePath}"`);
const desktopGameNav = desktopNavigationMarkup.indexOf('to="/admin/game-features"');
assert(desktopSystemNav !== -1, "desktop navigation must include the system management link");
assert(
  desktopSystemNav < desktopGameNav,
  "desktop system management link must appear before game features",
);
assert(
  desktopNavigationMarkup.slice(desktopSystemNav, desktopGameNav).includes(`<span>${moduleLabel}</span>`),
  "desktop system management link must use the 系统管理 label",
);

const drawerStart = layout.indexOf('class="drawer-menu"');
const drawerEnd = layout.indexOf("</div>", drawerStart);
const drawerNavigationMarkup = layout.slice(drawerStart, drawerEnd);
const drawerSystemNav = drawerNavigationMarkup.indexOf(`to="${modulePath}"`);
const drawerGameNav = drawerNavigationMarkup.indexOf('to="/admin/game-features"');
assert(drawerSystemNav !== -1, "mobile drawer must include the system management link");
assert(
  drawerSystemNav < drawerGameNav,
  "mobile drawer system management link must appear before game features",
);
assert(
  drawerNavigationMarkup.slice(drawerSystemNav, drawerGameNav).includes(`<span>${moduleLabel}</span>`),
  "mobile drawer system management link must use the 系统管理 label",
);

for (const text of [
  "ADMIN",
  "系统管理",
  "用于管理卡密、用户和运行数据。",
  "运维总览",
  "用户管理",
  "卡密管理",
  "CDN 数据",
  "生成注册卡密，用户持卡密注册后自动激活",
  "月卡",
  "季卡",
  "年卡",
  "生成时间",
  "档位",
  "状态",
  "使用时间",
  "未使用",
  "已使用",
  "复制",
  "刷新",
  "已刷新系统管理数据",
  "展示通过首页注册并完成卡密激活的系统用户",
  "暂无注册用户",
  "管理员管理",
  "仅超级管理员可操作",
  "新增管理员",
  "暂无管理员账号",
]) {
  assert(systemPage.includes(text), `system management page must include "${text}"`);
}

for (const column of [
  "卡密",
  "档位",
  "到期时间",
  "状态",
  "使用者",
  "使用时间",
  "生成时间",
  "备注",
  "操作",
]) {
  assert(systemPage.includes(`<th>${column}</th>`), `card table must include the ${column} column`);
}

assert(systemPage.includes('const activeSection = ref("cards")'), "default section must be card management");
assert(
  systemPage.includes('const licenseCardFilterField = ref("level")'),
  "card filter must default to the level field",
);
assert(
  systemPage.includes("const licenseCardFilterValue = ref(null)"),
  "card filter must allow an empty filter value",
);
assert(
  systemPage.includes('const licenseCardSearchKeyword = ref("")'),
  "card filter must include a card-key search keyword",
);
assert(
  systemPage.includes("refreshSystemManagementData") &&
    systemPage.includes("@/utils/systemManagementData"),
  "page must import the local system management data layer",
);
assert(
  systemPage.includes("const loadSystemData = async"),
  "page must define an async system data loader",
);
assert(
  systemPage.includes("await refreshSystemManagementData()"),
  "page must await the async system data refresh helper",
);
assert(
  systemPage.includes("const licenseCards = ref([])") &&
    systemPage.includes("const users = ref([])") &&
    systemPage.includes("const admins = ref([])"),
  "page must initialize system state with empty async-backed refs",
);
assert(systemPage.includes("const summaryCards = computed("), "page must compute card summary stats locally");
assert(systemPage.includes("const filterFieldOptions = ["), "page must define card filter field options");
assert(
  systemPage.includes("const licenseCardFilterValueOptions = computed("),
  "page must compute filter values from existing license cards",
);
assert(
  systemPage.includes("const filteredLicenseCards = computed("),
  "page must compute filtered table rows locally",
);
assert(
  systemPage.includes('class="filter-bar"') &&
    systemPage.includes('aria-label="卡密筛选"') &&
    systemPage.includes('v-model:value="licenseCardFilterField"') &&
    systemPage.includes('v-model:value="licenseCardFilterValue"') &&
    systemPage.includes('v-model:value="licenseCardSearchKeyword"'),
  "card table toolbar must expose field filtering, value filtering, and card-key search",
);
assert(
  systemPage.includes('<tr v-for="card in filteredLicenseCards" :key="card.cardKey">'),
  "card table must render filtered license cards",
);
assert(
  !systemPage.includes("sortOptions") &&
    !systemPage.includes("sortKey") &&
    !systemPage.includes("sortedLicenseCards") &&
    !systemPage.includes("sort-button"),
  "card table sorting controls must be replaced by filtering controls",
);
assert(systemPage.includes("@click=\"refreshCards\""), "refresh button must call refreshCards");
assert(systemPage.includes("@click=\"copyCardKey(card)\""), "copy buttons must call copyCardKey with the row");
assert(systemPage.includes("licenseCards.value = data.licenseCards"), "refresh must reload cards from the data layer");
assert(systemPage.includes("users.value = data.users"), "refresh must reload users from the data layer");
assert(systemPage.includes("admins.value = data.admins"), "refresh must reload admins from the data layer");
assert(systemPage.includes("loadSystemData();"), "page must kick off async data loading on setup");
assert(systemPage.includes("navigator.clipboard.writeText"), "copy action must use the clipboard API when available");
assert(systemPage.includes("document.execCommand(\"copy\")"), "copy action must provide a textarea fallback");
assert(systemPage.includes('class="system-table-scroll"'), "table container must allow horizontal scrolling");
assert(systemPage.includes('class="system-empty-state"'), "non-card sections must render an empty state");
assert(
  variables.includes("--app-background: #05070b;") &&
    variables.includes("--bg-color: #05070b;"),
  "dark mode must use a clean black application background",
);
assert(
  variables.includes("--app-surface: rgba(17, 24, 39, 0.86);") &&
    variables.includes("--app-surface-strong: rgba(31, 41, 55, 0.94);") &&
    variables.includes("--card-bg: rgba(17, 24, 39, 0.88);") &&
    variables.includes("--input-bg: rgba(17, 24, 39, 0.9);"),
  "dark mode surfaces must stay visible on the black background",
);
assert(
  app.includes('const surface = dark ? "rgba(17, 24, 39, 0.88)"') &&
    app.includes('const surfaceMuted = dark ? "rgba(31, 41, 55, 0.76)"') &&
    app.includes('const border = dark ? "rgba(148, 163, 184, 0.28)"'),
  "Naive UI dark theme surfaces must stay visible on the black background",
);
const messageContainerStart = app.indexOf(".center-message-provider.n-message-container");
const messageContainerEnd = app.indexOf(".center-message-provider .n-message", messageContainerStart);
const messageContainerStyles = app.slice(messageContainerStart, messageContainerEnd);
assert(messageContainerStart !== -1, "center message provider styles must exist");
assert(
  messageContainerStyles.includes("top: 50% !important;") &&
    messageContainerStyles.includes("left: 50% !important;") &&
    messageContainerStyles.includes("transform: translate(-50%, -50%);"),
  "center message provider must center itself without a full-page overlay",
);
assert(
  !messageContainerStyles.includes("width: 100vw;") &&
    !messageContainerStyles.includes("height: 100vh;"),
  "center message provider must not cover the full page in dark mode",
);
assert(
  layout.includes(':global([data-theme="dark"] .app-ambient-background)') &&
    layout.includes("display: none;"),
  "dark mode must hide the ambient background layer instead of dimming the page",
);
assert(
  !layout.includes(':global([data-theme="dark"]) .'),
  "layout dark-mode selectors must wrap the full selector in :global(...) so html/body are never hidden",
);
assert(
  !systemPage.includes("--system-dark-panel-bg") &&
    !systemPage.includes("--system-dark-muted-text") &&
    !systemPage.includes("--system-dark-table-header-bg"),
  "system management page must not add a page-level dark overlay theme",
);
const darkSystemControlSelectors = [
  ':global([data-theme="dark"] .system-management-page .n-input)',
  ':global([data-theme="dark"] .system-management-page .n-input-wrapper)',
  ':global([data-theme="dark"] .system-management-page .n-input__input-el)',
  ':global([data-theme="dark"] .system-management-page .n-input__textarea-el)',
  ':global([data-theme="dark"] .system-management-page .n-input-number)',
  ':global([data-theme="dark"] .system-management-page .n-base-selection)',
  ':global([data-theme="dark"] .system-management-page .n-base-selection-label)',
];
for (const selector of darkSystemControlSelectors) {
  assert(
    systemPage.includes(selector),
    `system management dark mode must style ${selector} to prevent washed-out inputs`,
  );
}
assert(
  systemPage.includes("--system-control-bg: rgba(15, 23, 42, 0.82);") &&
    systemPage.includes("background: var(--system-control-bg) !important;"),
  "system management dark mode controls must use a deep input surface instead of pale Naive internals",
);
for (const column of [
  "用户名",
  "激活卡密",
  "档位",
  "到期时间",
  "注册时间",
  "最后登录",
  "状态",
]) {
  assert(systemPage.includes(`<th>${column}</th>`), `user table must include the ${column} column`);
}
for (const column of [
  "管理员账号",
  "角色",
  "创建时间",
  "最后登录",
  "状态",
  "操作",
]) {
  assert(systemPage.includes(`<th>${column}</th>`), `admin table must include the ${column} column`);
}
assert(systemPage.includes("isSystemSuperAdminSession"), "admin management menu must check super admin session state");
assert(systemPage.includes("createSystemAdmin"), "admin management form must create admins through the data layer");
assert(systemPage.includes("deleteSystemAdmin"), "admin management table must delete admins through the data layer");
assert(systemPage.includes("handleCreateAdmin"), "admin management form must submit through handleCreateAdmin");
assert(systemPage.includes("handleDeleteAdmin"), "admin management delete buttons must call handleDeleteAdmin");
assert(!systemPage.includes("axios"), "static system page must not import axios");
assert(!systemPage.includes("@/api"), "static system page must not call local API modules");

console.log("system management module route, navigation, and static page contract are present");
