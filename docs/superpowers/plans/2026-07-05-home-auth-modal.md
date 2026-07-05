# 首页登录/注册弹窗 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在首页 5176 风格登录弹窗中增加“注册”切换按钮，点击后在同一弹窗内显示注册表单。

**Architecture:** 仅修改 `src/views/Home.vue`，用一个 `authMode` 响应式状态控制登录/注册两种表单。继续复用现有 `.login-modal`、`.login-container`、`.login-form`、关闭按钮、遮罩和 Esc 关闭逻辑，避免新增路由或第二套弹窗。

**Tech Stack:** Vue 3 `<script setup>`、Naive UI `n-icon`、Node.js 字符串断言测试、Vite 构建。

## Global Constraints

- 默认使用 5176 风格弹窗视觉，不恢复 Token 导入弹窗。
- 登录模式包含用户名、密码、登录按钮和新增“注册”切换按钮。
- 注册模式包含用户名、密码、确认密码、卡密四个输入框，底部提交按钮文案为“注册”。
- 关闭弹窗后再次打开时回到登录模式。
- 不接入后端接口，不改变现有首页导航逻辑。
- 当前环境 `git` 命令不可用，因此执行时不做本地 git commit。

---

## File Structure

- Modify: `test/home-login-modal.test.js`
  - 负责静态验证首页弹窗结构，防止恢复成 Token 导入弹窗。
- Modify: `src/views/Home.vue`
  - 负责首页弹窗模板、`authMode` 状态和登录/注册共用样式。

---

### Task 1: 首页认证弹窗模式切换

**Files:**
- Modify: `test/home-login-modal.test.js`
- Modify: `src/views/Home.vue`

**Interfaces:**
- Consumes: 现有 `openLoginModal()`、`closeLoginModal()`、`isLoginModalVisible`。
- Produces: `authMode`，值为 `"login"` 或 `"register"`；`isRegisterMode`，用于模板切换标题、输入框和按钮。

- [ ] **Step 1: Write the failing test**

Replace the assertions after `class="login-submit"` in `test/home-login-modal.test.js` with these assertions while keeping the existing Token modal negative assertions:

```js
assert(home.includes('class="login-submit"'), "home login modal must include the login submit button");
assert(home.includes("authMode"), "home auth modal must track login/register mode");
assert(
  home.includes('class="login-register-switch"'),
  "home login modal must include a register switch button",
);
assert(
  home.includes("@click=\"authMode = 'register'\""),
  "home register switch must change the modal to register mode",
);
assert(
  home.includes('name="confirmPassword"'),
  "home register modal must include a confirm password input",
);
assert(home.includes('name="cardKey"'), "home register modal must include a card key input");
assert(
  home.includes("isRegisterMode ? \"注册\" : \"登录\""),
  "home auth modal title and submit text must switch between login and register",
);
assert(home.includes('class="login-close"'), "home login modal must include a close button");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
& 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test/home-login-modal.test.js
```

Expected: FAIL with `home auth modal must track login/register mode` or another new register-mode assertion.

- [ ] **Step 3: Write minimal implementation**

In `src/views/Home.vue`, update the modal form opening tag:

```vue
<form class="login-form" :class="{ 'is-register': isRegisterMode }" @submit.prevent>
```

Replace the title and input area with:

```vue
<p id="login-title" class="login-title">{{ isRegisterMode ? "注册" : "登录" }}</p>
<input
  class="login-input"
  type="text"
  name="username"
  placeholder="用户名"
  autocomplete="username"
/>
<input
  class="login-input"
  type="password"
  name="password"
  placeholder="密码"
  :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
/>
<input
  v-if="isRegisterMode"
  class="login-input"
  type="password"
  name="confirmPassword"
  placeholder="确认密码"
  autocomplete="new-password"
/>
<input
  v-if="isRegisterMode"
  class="login-input"
  type="text"
  name="cardKey"
  placeholder="卡密"
  autocomplete="off"
/>
<button class="login-submit" type="submit">{{ isRegisterMode ? "注册" : "登录" }}</button>
<button
  v-if="!isRegisterMode"
  class="login-register-switch"
  type="button"
  @click="authMode = 'register'"
>
  注册
</button>
```

In the script setup import, add `computed`:

```js
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
```

Near the existing modal state, add:

```js
const authMode = ref("login");
const isRegisterMode = computed(() => authMode.value === "register");
```

Reset mode when opening and closing:

```js
const openLoginModal = () => {
  isMobileMenuOpen.value = false;
  authMode.value = "login";
  isLoginModalVisible.value = true;
};

const closeLoginModal = () => {
  isLoginModalVisible.value = false;
  authMode.value = "login";
};
```

Adjust CSS so the extra register fields fit:

```css
.login-form {
  position: relative;
  isolation: isolate;
  display: flex;
  width: min(320px, calc(100vw - 2rem));
  min-height: min(500px, calc(100dvh - 2rem));
  height: auto;
  padding: 3.75rem 0 2rem;
  flex-direction: column;
  align-items: center;
  border: 1px solid rgba(245, 222, 179, 0.16);
  border-radius: 1.5rem;
  background-image: linear-gradient(to bottom, rgba(66, 66, 66, 0.6), rgba(33, 33, 33, 0.6));
  box-shadow:
    0 0 28px rgba(245, 222, 179, 0.18),
    0 24px 70px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(8px);
}

.login-form.is-register {
  min-height: min(560px, calc(100dvh - 2rem));
}

.login-title {
  margin: 0 0 2.75rem;
  color: wheat;
  font-size: 2rem;
  font-weight: 600;
}

.login-form.is-register .login-title {
  margin-bottom: 1.5rem;
}

.login-form.is-register .login-submit {
  margin-top: 2rem;
}

.login-register-switch {
  width: min(17rem, calc(100% - 3rem));
  height: 2.75rem;
  margin-top: 0.85rem;
  color: wheat;
  border: 1px solid rgba(245, 222, 179, 0.48);
  border-radius: 0.9rem;
  background-color: transparent;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 240ms;
}

.login-register-switch:hover,
.login-register-switch:focus-visible {
  color: #212121;
  background-color: wheat;
  outline: none;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
& 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test/home-login-modal.test.js
```

Expected: PASS with `home login button opens the 5176 login modal`.

- [ ] **Step 5: Run related regression test**

Run:

```powershell
& 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' test/navigation-account-module.test.js
```

Expected: PASS with `account module renders in the default layout and is correctly ordered`.

- [ ] **Step 6: Run production build**

Run:

```powershell
$env:Path = 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;' + $env:Path
& 'C:\Users\you\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\pnpm.cmd' build
```

Expected: exit code 0. Existing Sass, sourcemap/eval, router export, and chunk-size warnings may remain.

- [ ] **Step 7: Skip git commit in this workspace**

Run:

```powershell
git status --short
```

Expected in this workspace: PowerShell reports `git` is not recognized. Do not attempt a commit here.
