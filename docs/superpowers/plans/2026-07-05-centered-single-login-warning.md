# Centered Single Login Warning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Center the login-required warning and make repeated blocked home navigation clicks show only one active warning.

**Architecture:** Global message placement belongs in `src/App.vue` through `n-message-provider` container styling. Home-specific duplicate prevention belongs in `src/views/Home.vue` using a warning instance ref cleared by the message lifecycle.

**Tech Stack:** Vue 3 `<script setup>`, Naive UI `n-message-provider` and `useMessage`, existing static Node contract tests.

## Global Constraints

- Preserve the exact warning copy: `登录后体验完整内容`.
- Do not add a custom toast component or new dependency.
- Keep the duplicate-warning guard scoped to the home navigation login gate.

---

### Task 1: Message Placement And Home Warning Guard

**Files:**
- Modify: `src/App.vue`
- Modify: `src/views/Home.vue`
- Test: `test/home-auth-state-navigation.test.js`

**Interfaces:**
- Consumes: Naive UI `message.warning(content, options)` returning a message instance.
- Produces: `loginRequiredWarning` ref and `showLoginRequiredWarning()` helper in `Home.vue`.

- [ ] **Step 1: Write the failing test**

Add assertions that `App.vue` sets `placement="center"` on `n-message-provider`, and that `Home.vue` uses `loginRequiredWarning` plus `onAfterLeave` to block repeated warning creation.

- [ ] **Step 2: Run test to verify it fails**

Run: `node test/home-auth-state-navigation.test.js`
Expected: FAIL because the provider has no center placement and home navigation calls `message.warning(...)` directly.

- [ ] **Step 3: Write minimal implementation**

Set `<n-message-provider placement="top" container-class="center-message-provider">` and add global CSS that makes `.center-message-provider` cover the viewport with flex centering. In `Home.vue`, add `const loginRequiredWarning = ref(null);`, add `showLoginRequiredWarning()`, call it from the blocked navigation path, and clear the ref in the message `onAfterLeave` option.

- [ ] **Step 4: Run test to verify it passes**

Run: `node test/home-auth-state-navigation.test.js`
Expected: PASS with `home login state and gated navigation contract are present`.

- [ ] **Step 5: Run final verification**

Run: `node test/home-system-management-auth.test.js`, `node test/system-admin-permissions.test.js`, and `pnpm build`.
Expected: all commands exit 0. Existing build warnings may remain unchanged.
