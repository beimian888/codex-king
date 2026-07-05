# 首页登录记住密码 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首页登录成功后保存用户名，并通过“记住密码”复选项控制是否保存密码。

**Architecture:** 在 `Home.vue` 内新增独立的本地表单偏好 helper，不复用系统 session。打开登录弹窗时读取偏好，登录成功后写入偏好，注册模式不显示也不保存密码偏好。

**Tech Stack:** Vue 3 `<script setup>`、Naive UI message、浏览器 `localStorage`、Node 静态契约测试。

## Global Constraints

- 只修改首页登录弹窗相关行为。
- 不改变注册逻辑和系统 session 存储。
- 先写失败测试，确认 RED 后再实现。
- 当前目录不是 git 仓库，不执行 commit。

---

### Task 1: 首页登录表单偏好

**Files:**
- Create: `test/home-login-remember-password.test.js`
- Modify: `src/views/Home.vue`

**Interfaces:**
- Consumes: `authForm.username`、`authForm.password`、`isRegisterMode`、`handleAuthSubmit`
- Produces: `SYSTEM_AUTH_REMEMBER_KEY`、`rememberPassword`、`readRememberedAuth()`、`applyRememberedAuth()`、`saveRememberedAuth()`

- [ ] **Step 1: Write the failing test**

```js
assert(home.includes('const SYSTEM_AUTH_REMEMBER_KEY = "xyzw_system_auth_remember"'));
assert(home.includes("const rememberPassword = ref(false)"));
assert(home.includes('v-model="rememberPassword"'));
assert(home.includes("记住密码"));
assert(home.includes("const applyRememberedAuth ="));
assert(home.includes("const saveRememberedAuth ="));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/home-login-remember-password.test.js`
Expected: FAIL because `SYSTEM_AUTH_REMEMBER_KEY` and remember-password UI do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add localStorage helper functions in `Home.vue`, call `applyRememberedAuth()` after `resetAuthForm()` in `openLoginModal()`, call `saveRememberedAuth()` only after successful login, and add the checkbox in login mode.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/home-login-remember-password.test.js`
Expected: PASS.

- [ ] **Step 5: Run regression checks**

Run:
```powershell
node test/home-system-management-auth.test.js
node test/home-auth-state-navigation.test.js
pnpm build
```

Expected: all exit 0. Existing build warnings are acceptable if unchanged.
