# 首页登录态与导航拦截 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 首页根据本地系统 session 显示登录态，并在未登录时阻止功能胶囊导航跳转。

**Architecture:** 复用 `systemManagementData.js` 的 session 读取能力，首页只负责展示和交互拦截。所有首页入口走同一个 `goTo(path)`，避免桌面胶囊和移动菜单行为不一致。

**Tech Stack:** Vue 3 `<script setup>`、Vue Router、Naive UI message、本地 `localStorage` session、Node 静态契约测试、Vite build。

## Global Constraints

- 未登录提示文案必须是 `登录后体验完整内容`。
- 登录后登录按钮必须不可点击。
- 首页登录态必须来自 `getCurrentSystemSession()`。
- 不改真实后端、不改 Token 管理流程、不放宽系统管理权限。
- 当前环境没有可用 git 元数据，不做 commit。

---

## File Structure

- Modify: `src/views/Home.vue`
  - 读取 session，派生登录态，更新登录按钮，拦截导航。
- Create: `test/home-auth-state-navigation.test.js`
  - 首页登录态与导航拦截静态契约。
- Modify if needed: existing home tests
  - 只在静态契约与新结构冲突时更新。

### Task 1: 首页登录态与导航拦截

**Files:**
- Create: `test/home-auth-state-navigation.test.js`
- Modify: `src/views/Home.vue`

**Interfaces:**
- Consumes: `getCurrentSystemSession()`.
- Produces: `isSystemLoggedIn`, `loginButtonText`, `refreshSystemSession`, guarded `goTo(path)`.

- [ ] **Step 1: Write failing test**
  - Assert home imports `getCurrentSystemSession`.
  - Assert login buttons use `loginButtonText` and `:disabled="isSystemLoggedIn"`.
  - Assert `goTo` warns with `登录后体验完整内容` before `router.push`.
  - Assert auth success refreshes session.

- [ ] **Step 2: Run RED**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
node test/home-auth-state-navigation.test.js
```

Expected: fail because `Home.vue` does not yet read session or guard navigation.

- [ ] **Step 3: Implement minimal code**
  - Import `getCurrentSystemSession`.
  - Add `currentSystemSession`, `isSystemLoggedIn`, `loginButtonText`, `refreshSystemSession`.
  - Add disabled/welcome state to desktop and mobile login buttons.
  - Guard `goTo(path)`.
  - Refresh session after auth success and on mount/focus/storage.

- [ ] **Step 4: Verify**

Run:

```powershell
node test/home-auth-state-navigation.test.js
node test/home-login-modal.test.js
node test/home-system-management-auth.test.js
C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd build
```
