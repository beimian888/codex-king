# 系统管理模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/admin/system-management` 系统管理页面，并在默认后台布局的桌面导航和移动抽屉中提供入口。

**Architecture:** 用一个新的 `src/views/SystemManagement.vue` 单页组件承载系统管理静态首版，组件内维护二级菜单、排序和示例卡密数据。现有 `src/router/index.js` 只新增后台子路由，`src/layout/DefaultLayout.vue` 只新增导航入口，不引入后端接口或全局状态。

**Tech Stack:** Vue 3 `<script setup>`、Naive UI、`@vicons/ionicons5`、SCSS scoped styles、Node.js 静态断言测试、Vite 构建。

## Global Constraints

- 新增顶部导航入口文案必须是 `系统管理`。
- 新增路由路径必须是 `/admin/system-management`，路由名必须是 `SystemManagement`。
- 系统管理页面标题必须是 `系统管理`，页面小标签必须是 `ADMIN`。
- 二级菜单必须包含 `运维总览`、`用户管理`、`卡密管理`、`CDN 数据`。
- 默认二级菜单必须展示 `卡密管理`。
- 卡密管理必须包含统计、排序按钮、表格和复制操作。
- 表格列必须包含 `卡密`、`档位`、`到期时间`、`状态`、`使用者`、`使用时间`、`生成时间`、`备注`、`操作`。
- 本次不接真实后端接口，不实现真实卡密生成、删除、用户权限校验或 CDN 数据查询。
- 非卡密二级菜单只显示空状态说明，不承诺真实功能。
- 桌面端使用两列内容布局；移动端单列纵向浏览，表格容器允许横向滚动。
- 当前环境之前观测到 `git` 命令不可用；执行时不做本地 git commit。

---

## File Structure

- Create: `test/system-management-module.test.js`
  - 负责静态验证系统管理路由、桌面导航、移动抽屉、页面默认内容、表格列和交互契约。
- Modify: `src/router/index.js`
  - 在 `/admin` 子路由中新增 `system-management` 路由。
- Modify: `src/layout/DefaultLayout.vue`
  - 在桌面导航和移动抽屉中新增 `系统管理` 入口，复用现有 `Settings` 图标。
- Create: `src/views/SystemManagement.vue`
  - 系统管理页面主体，包含二级菜单、卡密管理示例数据、排序、复制、刷新和响应式样式。

---

### Task 1: 系统管理静态契约测试

**Files:**
- Create: `test/system-management-module.test.js`

**Interfaces:**
- Consumes: `src/router/index.js`、`src/layout/DefaultLayout.vue`、`src/views/SystemManagement.vue` 的源码文本。
- Produces: `node test/system-management-module.test.js`，用于后续任务验证系统管理模块契约。

- [ ] **Step 1: Write the failing test**

Create `test/system-management-module.test.js` with this exact content:

```js
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
  "已刷新示例数据",
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
assert(systemPage.includes('const sortKey = ref("createdAt")'), "default sort key must be createdAt");
assert(systemPage.includes("const licenseCards = ref(["), "page must define local example card data");
assert(systemPage.includes("const summaryCards = computed("), "page must compute card summary stats locally");
assert(systemPage.includes("const sortedLicenseCards = computed("), "page must compute sorted table rows locally");
assert(systemPage.includes("@click=\"sortKey = option.key\""), "sort buttons must update sortKey");
assert(systemPage.includes("@click=\"refreshCards\""), "refresh button must call refreshCards");
assert(systemPage.includes("@click=\"copyCardKey(card)\""), "copy buttons must call copyCardKey with the row");
assert(systemPage.includes("navigator.clipboard.writeText"), "copy action must use the clipboard API when available");
assert(systemPage.includes("document.execCommand(\"copy\")"), "copy action must provide a textarea fallback");
assert(systemPage.includes('class="system-table-scroll"'), "table container must allow horizontal scrolling");
assert(systemPage.includes('class="system-empty-state"'), "non-card sections must render an empty state");
assert(!systemPage.includes("axios"), "static system page must not import axios");
assert(!systemPage.includes("@/api"), "static system page must not call local API modules");

console.log("system management module route, navigation, and static page contract are present");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-management-module.test.js
```

Expected: FAIL with `ENOENT: no such file or directory` for `src/views/SystemManagement.vue`, or FAIL with `router must define the system management child route` if the empty file already exists.

---

### Task 2: 路由和全局导航入口

**Files:**
- Modify: `src/router/index.js`
- Modify: `src/layout/DefaultLayout.vue`
- Test: `test/system-management-module.test.js`

**Interfaces:**
- Consumes: `SystemManagement.vue` lazy import path from Task 3: `@/views/SystemManagement.vue`.
- Produces: `/admin/system-management` route with route name `SystemManagement` and nav links pointing to that path.

- [ ] **Step 1: Keep the failing test focused**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-management-module.test.js
```

Expected: still FAIL because `src/views/SystemManagement.vue` is not implemented yet. This confirms Task 2 is being done under the Task 1 failing test.

- [ ] **Step 2: Add the route**

In `src/router/index.js`, insert this route block after the `AccountManagement` child route and before `GameFeatures`:

```js
      {
        path: 'system-management',
        name: 'SystemManagement',
        component: () => import('@/views/SystemManagement.vue'),
        meta: {
          title: '系统管理',
          requiresToken: false
        }
      },
```

- [ ] **Step 3: Add the desktop navigation link**

In `src/layout/DefaultLayout.vue`, insert this block in `.nav-menu` after the account management link and before the game features link:

```vue
          <router-link
            to="/admin/system-management"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Settings />
            </n-icon>
            <span>系统管理</span>
          </router-link>
```

- [ ] **Step 4: Add the mobile drawer link**

In `src/layout/DefaultLayout.vue`, insert this block in `.drawer-menu` after the account management link and before the game features link:

```vue
        <router-link
          to="/admin/system-management"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Settings />
          </n-icon>
          <span>系统管理</span>
        </router-link>
```

- [ ] **Step 5: Run test to confirm the remaining failure moved forward**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-management-module.test.js
```

Expected: FAIL because `src/views/SystemManagement.vue` is still missing or incomplete; route and navigation assertions should no longer be the first failures.

---

### Task 3: 系统管理页面

**Files:**
- Create: `src/views/SystemManagement.vue`
- Test: `test/system-management-module.test.js`

**Interfaces:**
- Consumes: Route path `/admin/system-management` and default layout navigation from Task 2.
- Produces:
  - `activeSection: Ref<"overview" | "users" | "cards" | "cdn">`
  - `sortKey: Ref<"createdAt" | "level" | "status" | "usedAt">`
  - `licenseCards: Ref<Array<LicenseCard>>`
  - `summaryCards: ComputedRef<Array<{ key: string, label: string, unused: number, used: number }>>`
  - `sortedLicenseCards: ComputedRef<Array<LicenseCard>>`
  - `refreshCards(): void`
  - `copyCardKey(card: LicenseCard): Promise<void>`

- [ ] **Step 1: Create the page implementation**

Create `src/views/SystemManagement.vue` with this exact content:

```vue
<template>
  <div class="system-management-page">
    <header class="system-hero">
      <div>
        <span class="system-kicker">ADMIN</span>
        <h1>系统管理</h1>
        <p>用于管理卡密、用户和运行数据。</p>
      </div>
    </header>

    <main class="system-workspace">
      <aside class="system-sidebar" aria-label="系统管理二级菜单">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="system-side-item"
          :class="{ active: activeSection === item.key }"
          type="button"
          @click="activeSection = item.key"
        >
          <n-icon>
            <component :is="item.icon" />
          </n-icon>
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <section class="system-content">
        <div v-if="activeSection === 'cards'" class="card-management-panel">
          <div class="panel-header">
            <div>
              <h2>卡密管理</h2>
              <p>生成注册卡密，用户持卡密注册后自动激活</p>
            </div>
            <div class="panel-actions">
              <n-button secondary type="primary" @click="refreshCards">
                <template #icon>
                  <n-icon>
                    <RefreshOutline />
                  </n-icon>
                </template>
                刷新
              </n-button>
              <span class="permission-note">
                <n-icon>
                  <ShieldCheckmarkOutline />
                </n-icon>
                仅管理员可操作
              </span>
            </div>
          </div>

          <div class="summary-grid" aria-label="卡密统计">
            <div v-for="item in summaryCards" :key="item.key" class="summary-item">
              <span class="summary-label">{{ item.label }}</span>
              <strong>{{ item.unused }}</strong>
              <span>未使用 / {{ item.used }} 已使用</span>
            </div>
          </div>

          <div class="sort-bar" aria-label="卡密排序">
            <span>排序</span>
            <button
              v-for="option in sortOptions"
              :key="option.key"
              class="sort-button"
              :class="{ active: sortKey === option.key }"
              type="button"
              @click="sortKey = option.key"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="system-table-scroll">
            <table class="license-table">
              <thead>
                <tr>
                  <th>卡密</th>
                  <th>档位</th>
                  <th>到期时间</th>
                  <th>状态</th>
                  <th>使用者</th>
                  <th>使用时间</th>
                  <th>生成时间</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="card in sortedLicenseCards" :key="card.cardKey">
                  <td class="card-key-cell">{{ card.cardKey }}</td>
                  <td>{{ card.level }}</td>
                  <td>{{ card.expiresAt }}</td>
                  <td>
                    <span class="status-badge" :class="card.status">
                      {{ card.statusText }}
                    </span>
                  </td>
                  <td>{{ card.user || "未使用" }}</td>
                  <td>{{ card.usedAt || "-" }}</td>
                  <td>{{ card.createdAt }}</td>
                  <td class="remark-cell">{{ card.remark }}</td>
                  <td>
                    <n-button size="small" secondary @click="copyCardKey(card)">
                      <template #icon>
                        <n-icon>
                          <CopyOutline />
                        </n-icon>
                      </template>
                      复制
                    </n-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="system-empty-state">
          <n-icon>
            <component :is="currentMenuItem.icon" />
          </n-icon>
          <h2>{{ currentMenuItem.label }}</h2>
          <p>{{ currentMenuItem.emptyText }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useMessage } from "naive-ui";
import {
  CloudOutline,
  CopyOutline,
  KeyOutline,
  PeopleOutline,
  RefreshOutline,
  ShieldCheckmarkOutline,
  StatsChartOutline,
} from "@vicons/ionicons5";

const message = useMessage();

const activeSection = ref("cards");
const sortKey = ref("createdAt");

const menuItems = [
  {
    key: "overview",
    label: "运维总览",
    icon: StatsChartOutline,
    emptyText: "运维总览将在接入真实监控接口后展示在线状态、任务队列和运行告警。",
  },
  {
    key: "users",
    label: "用户管理",
    icon: PeopleOutline,
    emptyText: "用户管理将在接入权限接口后展示账号列表、角色和登录状态。",
  },
  {
    key: "cards",
    label: "卡密管理",
    icon: KeyOutline,
    emptyText: "",
  },
  {
    key: "cdn",
    label: "CDN 数据",
    icon: CloudOutline,
    emptyText: "CDN 数据将在接入统计接口后展示缓存命中、流量和资源版本。",
  },
];

const sortOptions = [
  { key: "createdAt", label: "生成时间" },
  { key: "level", label: "档位" },
  { key: "status", label: "状态" },
  { key: "usedAt", label: "使用时间" },
];

const licenseCards = ref([
  {
    cardKey: "XYZW-MONTH-8F2K-Q7PA",
    level: "月卡",
    expiresAt: "2026-08-05 23:59",
    status: "unused",
    statusText: "未使用",
    user: "",
    usedAt: "",
    createdAt: "2026-07-05 09:20",
    remark: "活动赠送",
  },
  {
    cardKey: "XYZW-SEASON-J4VN-2RKC",
    level: "季卡",
    expiresAt: "2026-10-05 23:59",
    status: "used",
    statusText: "已使用",
    user: "北冕一号",
    usedAt: "2026-07-05 10:18",
    createdAt: "2026-07-04 21:42",
    remark: "老用户续期",
  },
  {
    cardKey: "XYZW-YEAR-M9HD-6LZT",
    level: "年卡",
    expiresAt: "2027-07-05 23:59",
    status: "unused",
    statusText: "未使用",
    user: "",
    usedAt: "",
    createdAt: "2026-07-03 15:06",
    remark: "管理员生成",
  },
  {
    cardKey: "XYZW-MONTH-A2PW-9XNE",
    level: "月卡",
    expiresAt: "2026-08-05 23:59",
    status: "used",
    statusText: "已使用",
    user: "盐场观察员",
    usedAt: "2026-07-04 18:33",
    createdAt: "2026-07-02 11:28",
    remark: "测试账号",
  },
]);

const levelOrder = {
  月卡: 1,
  季卡: 2,
  年卡: 3,
};

const currentMenuItem = computed(
  () => menuItems.find((item) => item.key === activeSection.value) || menuItems[2],
);

const summaryCards = computed(() =>
  ["月卡", "季卡", "年卡"].map((level) => {
    const cards = licenseCards.value.filter((card) => card.level === level);
    return {
      key: level,
      label: level,
      unused: cards.filter((card) => card.status === "unused").length,
      used: cards.filter((card) => card.status === "used").length,
    };
  }),
);

const sortedLicenseCards = computed(() => {
  return [...licenseCards.value].sort((a, b) => {
    if (sortKey.value === "level") {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    if (sortKey.value === "status") {
      return a.status.localeCompare(b.status);
    }
    if (sortKey.value === "usedAt") {
      return (b.usedAt || "").localeCompare(a.usedAt || "");
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
});

const copyWithTextarea = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
};

const copyCardKey = async (card) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(card.cardKey);
    } else if (!copyWithTextarea(card.cardKey)) {
      throw new Error("copy failed");
    }
    message.success(`已复制卡密：${card.cardKey}`);
  } catch {
    message.error("复制失败，请手动选择卡密");
  }
};

const refreshCards = () => {
  sortKey.value = "createdAt";
  message.success("已刷新示例数据");
};
</script>

<style scoped lang="scss">
.system-management-page {
  min-height: calc(100dvh - 66px);
  padding: 28px clamp(14px, 3vw, 32px) calc(32px + env(safe-area-inset-bottom));
  color: var(--text-primary);
}

.system-hero {
  max-width: 1400px;
  margin: 0 auto 18px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.system-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--app-line);
  border-radius: 6px;
  background: var(--app-surface-muted);
  color: var(--primary-color);
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0;
}

.system-hero h1 {
  margin: 10px 0 6px;
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

.system-hero p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.system-workspace {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.system-sidebar,
.system-content {
  border: 1px solid var(--app-line);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.system-sidebar {
  padding: 8px;
  display: grid;
  gap: 6px;
}

.system-side-item {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.system-side-item:hover,
.system-side-item.active {
  border-color: rgba(var(--primary-color-rgb), 0.26);
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.system-content {
  min-width: 0;
  padding: 18px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-header h2,
.system-empty-state h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  letter-spacing: 0;
}

.panel-header p,
.system-empty-state p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.panel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.permission-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 0 9px;
  border: 1px solid var(--app-line);
  border-radius: 7px;
  background: var(--app-surface-muted);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.summary-item {
  min-width: 0;
  padding: 12px;
  border: 1px solid var(--app-line);
  border-radius: 8px;
  background: var(--app-surface-muted);
}

.summary-label,
.summary-item span:last-child {
  display: block;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.summary-item strong {
  display: block;
  margin: 6px 0 2px;
  font-size: var(--font-size-2xl);
  line-height: 1;
}

.sort-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.sort-button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--app-line);
  border-radius: 7px;
  background: var(--app-surface-muted);
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
}

.sort-button.active,
.sort-button:hover {
  border-color: rgba(var(--primary-color-rgb), 0.28);
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.system-table-scroll {
  overflow-x: auto;
  border: 1px solid var(--app-line);
  border-radius: 8px;
}

.license-table {
  width: 100%;
  min-width: 1060px;
  border-collapse: collapse;
  background: var(--app-surface-muted);
}

.license-table th,
.license-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--app-line);
  text-align: left;
  vertical-align: middle;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.license-table th {
  background: var(--table-header-bg);
  color: var(--text-secondary);
  font-weight: 800;
}

.license-table tr:last-child td {
  border-bottom: 0;
}

.card-key-cell,
.remark-cell {
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: 800;
}

.status-badge.unused {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-color);
}

.status-badge.used {
  background: rgba(245, 158, 11, 0.14);
  color: var(--warning-color);
}

.system-empty-state {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.system-empty-state .n-icon {
  font-size: 42px;
  color: var(--primary-color);
}

@media (max-width: 900px) {
  .system-management-page {
    min-height: calc(100dvh - 58px);
    padding: 18px var(--spacing-md) calc(24px + env(safe-area-inset-bottom));
  }

  .system-workspace {
    grid-template-columns: 1fr;
  }

  .system-sidebar {
    grid-template-columns: repeat(4, minmax(128px, 1fr));
    overflow-x: auto;
  }

  .system-side-item {
    justify-content: center;
  }

  .panel-header {
    flex-direction: column;
  }

  .panel-actions {
    justify-content: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .system-sidebar {
    grid-template-columns: 1fr 1fr;
  }

  .system-side-item {
    justify-content: flex-start;
  }

  .system-content {
    padding: 14px;
  }
}
</style>
```

- [ ] **Step 2: Run the focused test**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-management-module.test.js
```

Expected: PASS with `system management module route, navigation, and static page contract are present`.

- [ ] **Step 3: Run related navigation regression test**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/navigation-account-module.test.js
```

Expected: PASS with `account module renders in the default layout and is correctly ordered`.

---

### Task 4: Build Verification

**Files:**
- Verify: `src/views/SystemManagement.vue`
- Verify: `src/router/index.js`
- Verify: `src/layout/DefaultLayout.vue`
- Verify: `test/system-management-module.test.js`

**Interfaces:**
- Consumes: Completed Tasks 1-3.
- Produces: Fresh evidence that static tests and production build succeed.

- [ ] **Step 1: Run the full focused verification set**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-management-module.test.js
node test/navigation-account-module.test.js
```

Expected:

```text
system management module route, navigation, and static page contract are present
account module renders in the default layout and is correctly ordered
```

- [ ] **Step 2: Run production build**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
pnpm build
```

Expected: exit code 0. Existing warnings about Sass legacy JS API, sourcemaps/eval in bundled game assets, router named exports, or chunk size may still appear; no build error should appear.

- [ ] **Step 3: Check changed files without committing**

Run:

```powershell
git status --short
```

Expected in this workspace: PowerShell may report `git` is not recognized. If `git` is available, confirm changed files are limited to:

```text
docs/superpowers/plans/2026-07-05-system-management-implementation.md
test/system-management-module.test.js
src/router/index.js
src/layout/DefaultLayout.vue
src/views/SystemManagement.vue
```

Do not create a commit in this workspace because the local environment has previously lacked `git`.

---

## Self-Review

- Spec coverage: Task 1 tests and Tasks 2-3 implementation cover route, desktop navigation, mobile drawer, page title, `ADMIN` label, secondary menu, default card management, stats, sort buttons, table columns, copy action, refresh behavior, empty states, static local data, and responsive table scrolling.
- Placeholder scan: This plan does not contain `TODO`, `TBD`, `implement later`, or unspecified error-handling steps. Product empty states are written as concrete visible copy.
- Type consistency: `activeSection`, `sortKey`, `licenseCards`, `summaryCards`, `sortedLicenseCards`, `refreshCards`, and `copyCardKey` are named consistently across tests, implementation, and verification.
