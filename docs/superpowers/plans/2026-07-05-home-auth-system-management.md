# 首页登录注册接入系统管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让首页 5176 登录/注册弹窗使用系统管理本地数据，注册消耗卡密，登录校验本地用户，并让系统管理页面展示同一份用户和卡密状态。

**Architecture:** 新增 `src/utils/systemManagementData.js` 作为本地数据边界，首页只调用注册/登录方法，系统管理只读取卡密和用户列表。页面不直接拼装 `localStorage` 结构，避免登录、注册、表格三处逻辑漂移。

**Tech Stack:** Vue 3 `<script setup>`、Vue Router、Naive UI message、`localStorage`、Node.js ESM 测试、Vite build。

## Global Constraints

- 首页登录和注册成功后跳转 `/admin/system-management`。
- 注册必须校验用户名、密码、确认密码、卡密。
- 注册成功必须把对应卡密标记为 `used`，写入使用者和使用时间。
- 登录必须从系统管理本地用户表校验用户名和密码。
- 系统管理卡密管理必须读取本地数据层。
- 系统管理用户管理必须展示注册用户表。
- 本次不接真实后端接口，不改 Token 管理流程。
- 当前环境 `git` 不可用，不做 commit。

---

## File Structure

- Create: `src/utils/systemManagementData.js`
  - 本地系统管理数据边界，提供卡密、用户、注册、登录和刷新读取方法。
- Modify: `src/views/Home.vue`
  - 首页弹窗接入注册/登录方法，提交后跳转系统管理。
- Modify: `src/views/SystemManagement.vue`
  - 卡密表改为读取本地数据层，用户管理改为用户表。
- Create: `test/home-system-management-auth.test.js`
  - 覆盖数据层行为、首页接入契约、系统管理读取契约。
- Modify: `test/system-management-module.test.js`
  - 更新刷新文案和本地数据读取契约。

---

### Task 1: 本地系统管理数据契约测试

**Files:**
- Create: `test/home-system-management-auth.test.js`

**Interfaces:**
- Consumes: `src/utils/systemManagementData.js`
- Produces: executable Node test for `registerSystemUser`, `loginSystemUser`, `getSystemLicenseCards`, `getSystemUsers`

- [ ] **Step 1: Write failing test**

Create `test/home-system-management-auth.test.js` with assertions that:

- registering with `XYZW-MONTH-8F2K-Q7PA` succeeds
- the card becomes `used`
- a user row is created
- duplicate usernames fail
- reused card keys fail
- login succeeds with the right password
- login fails with a wrong password
- Home imports and calls the data functions
- SystemManagement imports and renders users from the data layer

- [ ] **Step 2: Run RED**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/home-system-management-auth.test.js
```

Expected: fail because `src/utils/systemManagementData.js` does not exist.

### Task 2: Implement local data layer

**Files:**
- Create: `src/utils/systemManagementData.js`

**Interfaces:**
- Produces:
  - `getSystemLicenseCards(): Array<LicenseCard>`
  - `getSystemUsers(): Array<SystemUser>`
  - `registerSystemUser(form): { success: boolean, message: string, user?: SystemUser }`
  - `loginSystemUser(form): { success: boolean, message: string, user?: SystemUser }`
  - `refreshSystemManagementData(): { licenseCards: Array<LicenseCard>, users: Array<SystemUser> }`

- [ ] **Step 1: Implement minimal localStorage-backed data functions**
- [ ] **Step 2: Run focused test until green**

### Task 3: Connect Home.vue

**Files:**
- Modify: `src/views/Home.vue`

**Interfaces:**
- Consumes: `registerSystemUser`, `loginSystemUser`
- Produces: `handleAuthSubmit()` for the shared login/register form

- [ ] **Step 1: Add reactive auth form and feedback**
- [ ] **Step 2: Bind inputs with `v-model`**
- [ ] **Step 3: Submit login/register through data layer**
- [ ] **Step 4: Redirect success to `/admin/system-management`**
- [ ] **Step 5: Run focused test**

### Task 4: Connect SystemManagement.vue

**Files:**
- Modify: `src/views/SystemManagement.vue`

**Interfaces:**
- Consumes: `refreshSystemManagementData`
- Produces: card and user tables backed by local system data

- [ ] **Step 1: Replace hard-coded card state with data-layer state**
- [ ] **Step 2: Add user management table**
- [ ] **Step 3: Refresh both users and cards**
- [ ] **Step 4: Run focused tests**

### Task 5: Verification

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/home-system-management-auth.test.js
node test/home-login-modal.test.js
node test/system-management-module.test.js
node test/navigation-account-module.test.js
C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd build
```

Expected: all Node tests exit 0 and Vite build exits 0.

