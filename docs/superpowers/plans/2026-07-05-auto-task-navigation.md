# 自动任务导航命名 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“批量日常”对外更名为“自动任务”，并让首页自动任务入口跳转至批量任务模块。

**Architecture:** 保留 `/admin/batch-daily-tasks` 路径作为自动任务模块的稳定地址，只更新展示文案和首页入口目标。测试使用项目现有静态契约风格，覆盖首页、默认布局、路由和页面标题。

**Tech Stack:** Vue 3、Vue Router、现有 Node 静态契约测试。

## Global Constraints

- 不改 `/admin/batch-daily-tasks` 路由路径。
- 首页“自动任务”必须跳转到 `/admin/batch-daily-tasks`。
- 默认布局中原“批量日常”展示文案统一为“自动任务”。
- 原 `/admin/daily-tasks` 模块保留。

---

### Task 1: 自动任务命名与首页跳转

**Files:**
- Create: `test/auto-task-navigation.test.js`
- Modify: `src/views/Home.vue`
- Modify: `src/router/index.js`
- Modify: `src/layout/DefaultLayout.vue`
- Modify: `src/views/BatchDailyTasks.vue`

**Interfaces:**
- Consumes: existing `/admin/batch-daily-tasks` route and `BatchDailyTasks.vue` module.
- Produces: visible label `自动任务` for batch task entry points.

- [ ] **Step 1: Write the failing test**

Add `test/auto-task-navigation.test.js` to assert homepage, layout, router, and batch page title contract.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/auto-task-navigation.test.js`
Expected: FAIL because homepage still points the fourth capsule to `/admin/daily-tasks` and visible labels still include `批量日常`.

- [ ] **Step 3: Write minimal implementation**

Update labels and route meta title only. Do not rename files or route paths.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/auto-task-navigation.test.js`
Expected: PASS with `auto task navigation contract is satisfied`.

- [ ] **Step 5: Run final verification**

Run related navigation tests and `pnpm build`.
