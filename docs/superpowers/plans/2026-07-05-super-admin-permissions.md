# 超级管理员权限 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增加内置超级管理员账号，限制系统管理模块只对管理员可见，并允许超级管理员增删普通管理员账号。

**Architecture:** 权限判断集中在 `src/utils/systemManagementData.js`，首页登录、路由守卫、导航和系统管理页面都调用同一组角色方法。系统管理页面新增 `管理员管理` 二级菜单，只在超级管理员 session 下显示。

**Tech Stack:** Vue 3 `<script setup>`、Vue Router、Naive UI、本地 `localStorage`、Node.js ESM 静态/行为测试、Vite build。

## Global Constraints

- 内置超级管理员账号必须是 `111 / 111`。
- 角色值必须包含 `super_admin`、`admin`、`user`。
- 只有 `super_admin` 和 `admin` 可以看到并进入系统管理模块。
- 只有 `super_admin` 可以新增和删除普通管理员。
- 不能删除内置超级管理员。
- 普通注册用户默认角色必须是 `user`。
- 非管理员直接访问 `/admin/system-management` 必须被重定向到 `/`。
- 本次不接真实后端接口，不修改 Token 管理流程。
- 当前环境 `git` 不可用，不做 commit。

---

## File Structure

- Modify: `src/utils/systemManagementData.js`
  - 增加角色、超级管理员、session、管理员增删方法。
- Modify: `src/router/index.js`
  - 拦截非管理员访问 `SystemManagement`。
- Modify: `src/layout/DefaultLayout.vue`
  - 仅管理员显示系统管理导航入口。
- Modify: `src/views/SystemManagement.vue`
  - 新增管理员管理二级菜单和超级管理员专属增删表单。
- Modify: `test/home-system-management-auth.test.js`
  - 覆盖超级管理员登录、管理员创建、删除、普通用户不可进入系统管理。
- Modify/Create: `test/system-admin-permissions.test.js`
  - 聚焦权限、路由、导航和管理员 UI 契约。

---

### Task 1: 权限契约测试

**Files:**
- Create: `test/system-admin-permissions.test.js`
- Modify: `test/home-system-management-auth.test.js`

**Interfaces:**
- Consumes: `systemManagementData.js` exports.
- Produces: failing assertions for admin-only system management.

- [ ] **Step 1: Write failing tests**
- [ ] **Step 2: Run RED**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-admin-permissions.test.js
```

Expected: fail because admin permission exports and UI contracts do not exist.

### Task 2: 数据层角色权限

**Files:**
- Modify: `src/utils/systemManagementData.js`

**Interfaces:**
- Produces `loginSystemUser`, `getCurrentSystemSession`, `isSystemAdminSession`, `isSystemSuperAdminSession`, `getSystemAdmins`, `createSystemAdmin`, `deleteSystemAdmin`.

- [ ] **Step 1: Add role constants and built-in super admin**
- [ ] **Step 2: Make normal registration create `role: "user"`**
- [ ] **Step 3: Make super admin login write a super admin session**
- [ ] **Step 4: Add admin create/delete helpers**
- [ ] **Step 5: Run focused permission test**

### Task 3: 路由与导航权限

**Files:**
- Modify: `src/router/index.js`
- Modify: `src/layout/DefaultLayout.vue`

**Interfaces:**
- Consumes: `isSystemAdminSession`.
- Produces: nav visibility and route guard.

- [ ] **Step 1: Hide system nav links behind `canViewSystemManagement`**
- [ ] **Step 2: Redirect non-admin `SystemManagement` visits to `/`**
- [ ] **Step 3: Run focused permission test**

### Task 4: 管理员管理 UI

**Files:**
- Modify: `src/views/SystemManagement.vue`

**Interfaces:**
- Consumes: `getSystemAdmins`, `createSystemAdmin`, `deleteSystemAdmin`, `isSystemSuperAdminSession`.
- Produces: `管理员管理` tab, create form, delete buttons.

- [ ] **Step 1: Add super-admin-only menu item**
- [ ] **Step 2: Add admin form and table**
- [ ] **Step 3: Wire create/delete handlers**
- [ ] **Step 4: Run focused tests**

### Task 5: Verification

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/system-admin-permissions.test.js
node test/home-system-management-auth.test.js
node test/home-login-modal.test.js
node test/system-management-module.test.js
node test/navigation-account-module.test.js
C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd build
```

Expected: all tests exit 0 and build exits 0.
