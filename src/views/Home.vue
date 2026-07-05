<template>
  <main class="lithos-home-page" @mousemove="handleMouseMove">
    <nav class="hero-nav" aria-label="首页导航">
      <router-link class="brand" to="/" aria-label="返回首页">
        <img src="/icons/codex-icon.svg" alt="北冕之王" draggable="false" />
        <span>beimian</span>
      </router-link>

      <div class="desktop-nav">
        <div class="radio-group" role="radiogroup" aria-label="功能模块">
          <div v-for="item in navItems" :key="item.id" class="radio-option">
            <input
              :id="item.id"
              v-model="activeNavOption"
              type="radio"
              name="codex-section"
              :value="item.id"
              @change="goTo(item.to)"
            />
            <label class="radio-label" :for="item.id">
              {{ item.label }}
            </label>
          </div>
          <div class="slider" />
        </div>
      </div>

      <div class="nav-actions">
        <button
          class="button desktop-login"
          :class="{ 'is-welcome': isSystemLoggedIn }"
          type="button"
          :aria-label="isSystemLoggedIn ? '退出当前账号' : '登录'"
          @click="handleLoginButtonClick"
        >
          <span class="login-button-label">{{ loginButtonText }}</span>
          <span v-if="isSystemLoggedIn" class="login-button-logout">退出登录</span>
        </button>
        <button
          class="mobile-menu-trigger"
          :class="{ 'is-open': isMobileMenuOpen }"
          type="button"
          aria-label="打开导航菜单"
          aria-controls="mobile-navigation-menu"
          :aria-expanded="isMobileMenuOpen"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <n-icon>
            <component :is="isMobileMenuOpen ? Close : Menu" />
          </n-icon>
        </button>
      </div>

      <div
        v-if="isMobileMenuOpen"
        id="mobile-navigation-menu"
        class="mobile-menu-panel"
        aria-label="移动端导航"
      >
        <button
          v-for="(item, index) in navItems"
          :key="item.id"
          class="mobile-menu-action"
          :class="{ 'is-active': activeNavOption === item.id }"
          :style="{ animationDelay: `${70 + index * 50}ms` }"
          type="button"
          :aria-pressed="activeNavOption === item.id"
          @click="handleMobileNavClick(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </nav>

    <div
      v-if="isLoginModalVisible"
      class="login-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
      @mousedown.self="closeLoginModal"
    >
      <div class="login-container" @mousedown.stop>
        <form class="login-form" :class="{ 'is-register': isRegisterMode }" @submit.prevent="handleAuthSubmit">
          <button
            class="login-close"
            type="button"
            aria-label="关闭登录弹窗"
            @click="closeLoginModal"
          >
            <n-icon>
              <Close />
            </n-icon>
          </button>
          <p id="login-title" class="login-title">{{ isRegisterMode ? "注册" : "登录" }}</p>
          <input
            v-model="authForm.username"
            class="login-input"
            type="text"
            name="username"
            placeholder="用户名"
            autocomplete="username"
          />
          <input
            v-model="authForm.password"
            class="login-input"
            type="password"
            name="password"
            placeholder="密码"
            :autocomplete="isRegisterMode ? 'new-password' : 'current-password'"
          />
          <label v-if="!isRegisterMode" class="remember-password-option">
            <input v-model="rememberPassword" type="checkbox" autocomplete="off" />
            <span>记住密码</span>
          </label>
          <input
            v-if="isRegisterMode"
            v-model="authForm.confirmPassword"
            class="login-input"
            type="password"
            name="confirmPassword"
            placeholder="确认密码"
            autocomplete="new-password"
          />
          <input
            v-if="isRegisterMode"
            v-model="authForm.cardKey"
            class="login-input"
            type="text"
            name="cardKey"
            placeholder="卡密"
            autocomplete="off"
          />
          <p v-if="authFeedback" class="auth-feedback" :class="authFeedbackType">
            {{ authFeedback }}
          </p>
          <button class="login-submit" type="submit" :disabled="isAuthSubmitting">
            {{ isRegisterMode ? "注册" : "登录" }}
          </button>
          <button
            v-if="!isRegisterMode"
            class="login-register-switch"
            type="button"
            @click="authMode = 'register'"
          >
            注册
          </button>
        </form>
      </div>
    </div>

    <section class="hero-stage" aria-label="北冥之王首页">
      <div class="hero-image hero-image-base" :style="{ backgroundImage: `url(${BG_IMAGE_1})` }" />
      <canvas ref="maskCanvas" class="mask-canvas" aria-hidden="true" />
      <div
        class="hero-image hero-image-reveal"
        :style="{
          backgroundImage: `url(${BG_IMAGE_2})`,
          WebkitMaskImage: maskUrl ? `url(${maskUrl})` : undefined,
          maskImage: maskUrl ? `url(${maskUrl})` : undefined,
        }"
      />

      <div class="hero-copy" aria-hidden="false">
        <h1>
          <span class="font-playfair hero-anim hero-reveal" style="animation-delay: 0.25s">
            codex
          </span>
          <span class="hero-anim hero-reveal" style="animation-delay: 0.42s">
            king
          </span>
        </h1>
        <p class="hero-anim hero-reveal" style="animation-delay: 0.56s">
          咸鱼之王综合平台
        </p>
      </div>

      <div class="mobile-login hero-anim hero-fade" style="animation-delay: 0.7s">
        <button
          class="button"
          :class="{ 'is-welcome': isSystemLoggedIn }"
          type="button"
          :aria-label="isSystemLoggedIn ? '退出当前账号' : '登录'"
          @click="handleLoginButtonClick"
        >
          <span class="login-button-label">{{ loginButtonText }}</span>
          <span v-if="isSystemLoggedIn" class="login-button-logout">退出登录</span>
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
import { Close, Menu } from "@vicons/ionicons5";
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { useMessage } from "naive-ui";
import { useRouter } from "vue-router";
import {
  getCurrentSystemSession,
  loginSystemUser,
  logoutSystemUser,
  registerSystemUser,
} from "@/utils/systemManagementData";

const BG_IMAGE_1 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_195923_b0ba8ace-1d1d-4f2c-9a28-1ab84b330680.png&w=1280&q=85";
const BG_IMAGE_2 =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260609_201152_bba90a12-bf12-459f-91f0-51f237dbaf3b.png&w=1280&q=85";
const SPOTLIGHT_R = 260;
const SYSTEM_AUTH_REMEMBER_KEY = "xyzw_system_auth_remember";

const navItems = [
  { id: "option1", label: "账号管理", to: "/admin/account-management" },
  { id: "option2", label: "游戏功能", to: "/admin/game-features" },
  { id: "option3", label: "网页游戏", to: "/admin/web-game" },
  { id: "option4", label: "自动任务", to: "/admin/batch-daily-tasks" },
];

const router = useRouter();
const message = useMessage();
const activeNavOption = ref("");
const isMobileMenuOpen = ref(false);
const isLoginModalVisible = ref(false);
const authMode = ref("login");
const isRegisterMode = computed(() => authMode.value === "register");
const authForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  cardKey: "",
});
const rememberPassword = ref(false);
const authFeedback = ref("");
const authFeedbackType = ref("error");
const isAuthSubmitting = ref(false);
const currentSystemSession = ref(getCurrentSystemSession());
const loginRequiredWarning = ref(null);
const isSystemLoggedIn = computed(() => Boolean(currentSystemSession.value?.username));
const loginButtonText = computed(() =>
  isSystemLoggedIn.value ? `欢迎 ${currentSystemSession.value.username}` : "登录",
);
const maskCanvas = ref(null);
const maskUrl = ref("");
const mouse = { x: -999, y: -999 };
const smooth = { x: -999, y: -999 };
let rafId = 0;

const handleMouseMove = (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
};

const sizeCanvas = () => {
  const canvas = maskCanvas.value;
  if (!canvas) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};

const drawRevealMask = () => {
  const canvas = maskCanvas.value;
  const context = canvas?.getContext("2d");

  if (canvas && context) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createRadialGradient(
      smooth.x,
      smooth.y,
      0,
      smooth.x,
      smooth.y,
      SPOTLIGHT_R,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,1)");
    gradient.addColorStop(0.6, "rgba(255,255,255,0.75)");
    gradient.addColorStop(0.75, "rgba(255,255,255,0.4)");
    gradient.addColorStop(0.88, "rgba(255,255,255,0.12)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(smooth.x, smooth.y, SPOTLIGHT_R, 0, Math.PI * 2);
    context.fill();
    maskUrl.value = canvas.toDataURL();
  }
};

const animateReveal = () => {
  smooth.x += (mouse.x - smooth.x) * 0.1;
  smooth.y += (mouse.y - smooth.y) * 0.1;
  drawRevealMask();
  rafId = window.requestAnimationFrame(animateReveal);
};

const refreshSystemSession = () => {
  currentSystemSession.value = getCurrentSystemSession();
};

const readRememberedAuth = () => {
  try {
    const raw = localStorage.getItem(SYSTEM_AUTH_REMEMBER_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

const applyRememberedAuth = () => {
  const saved = readRememberedAuth();
  if (!saved) {
    return;
  }

  authForm.username = saved.username || "";
  rememberPassword.value = Boolean(saved.rememberPassword);
  authForm.password = saved.rememberPassword ? saved.password || "" : "";
};

const saveRememberedAuth = () => {
  const payload = {
    username: authForm.username,
    rememberPassword: rememberPassword.value,
  };

  if (rememberPassword.value) {
    payload.password = authForm.password;
  }

  try {
    localStorage.setItem(SYSTEM_AUTH_REMEMBER_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage failures so a successful login is not blocked by browser settings.
  }
};

const showLoginRequiredWarning = () => {
  if (loginRequiredWarning.value) {
    return;
  }

  loginRequiredWarning.value = message.warning("登录后体验完整内容", {
    onAfterLeave: () => {
      loginRequiredWarning.value = null;
    },
  });
};

const goTo = (path) => {
  isMobileMenuOpen.value = false;
  if (!isSystemLoggedIn.value) {
    activeNavOption.value = "";
    showLoginRequiredWarning();
    return;
  }
  router.push(path);
};

const openLoginModal = () => {
  if (isSystemLoggedIn.value) {
    return;
  }
  isMobileMenuOpen.value = false;
  authMode.value = "login";
  resetAuthForm();
  applyRememberedAuth();
  isLoginModalVisible.value = true;
};

const handleSystemLogout = () => {
  logoutSystemUser();
  isLoginModalVisible.value = false;
  authMode.value = "login";
  activeNavOption.value = "";
  resetAuthForm();
  refreshSystemSession();
  message.success("已退出登录");
};

const handleLoginButtonClick = () => {
  if (isSystemLoggedIn.value) {
    handleSystemLogout();
    return;
  }

  openLoginModal();
};

const closeLoginModal = () => {
  isLoginModalVisible.value = false;
  authMode.value = "login";
  resetAuthForm();
};

const resetAuthForm = () => {
  authForm.username = "";
  authForm.password = "";
  authForm.confirmPassword = "";
  authForm.cardKey = "";
  rememberPassword.value = false;
  authFeedback.value = "";
  authFeedbackType.value = "error";
};

const handleAuthSubmit = () => {
  if (isAuthSubmitting.value) {
    return;
  }

  isAuthSubmitting.value = true;
  authFeedback.value = "";

  const result = isRegisterMode.value
    ? registerSystemUser({
        username: authForm.username,
        password: authForm.password,
        confirmPassword: authForm.confirmPassword,
        cardKey: authForm.cardKey,
      })
    : loginSystemUser({
        username: authForm.username,
        password: authForm.password,
      });

  isAuthSubmitting.value = false;
  authFeedbackType.value = result.success ? "success" : "error";
  authFeedback.value = result.message;

  if (!result.success) {
    message.error(result.message);
    return;
  }

  message.success(result.message);
  if (!isRegisterMode.value) {
    saveRememberedAuth();
  }
  refreshSystemSession();
  router.push("/admin/system-management");
};

const handleLoginKeydown = (event) => {
  if (event.key === "Escape" && isLoginModalVisible.value) {
    closeLoginModal();
  }
};

const handleMobileNavClick = (item) => {
  activeNavOption.value = item.id;
  goTo(item.to);
};

onMounted(async () => {
  await nextTick();
  refreshSystemSession();
  sizeCanvas();
  window.addEventListener("resize", sizeCanvas);
  window.addEventListener("keydown", handleLoginKeydown);
  window.addEventListener("storage", refreshSystemSession);
  window.addEventListener("focus", refreshSystemSession);
  rafId = window.requestAnimationFrame(animateReveal);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", sizeCanvas);
  window.removeEventListener("keydown", handleLoginKeydown);
  window.removeEventListener("storage", refreshSystemSession);
  window.removeEventListener("focus", refreshSystemSession);
  if (rafId) {
    window.cancelAnimationFrame(rafId);
  }
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@1,400;1,500;1,600&display=swap");

.lithos-home-page,
.lithos-home-page * {
  box-sizing: border-box;
}

.lithos-home-page {
  min-height: 100dvh;
  overflow: hidden;
  background: #000;
  color: #fff;
  font-family: "Inter", sans-serif;
  letter-spacing: 0;
}

.font-playfair {
  font-family: "Playfair Display", serif;
  font-style: italic;
}

.hero-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  text-decoration: none;
}

.brand img {
  width: 40px;
  height: 40px;
  user-select: none;
}

.brand span {
  font-family: "Playfair Display", serif;
  font-size: 24px;
  font-style: italic;
  line-height: 1;
}

.desktop-nav {
  position: absolute;
  left: 50%;
  display: block;
  transform: translateX(-50%) scale(1.1);
  transform-origin: center top;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.login-modal {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.68);
  backdrop-filter: blur(10px);
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.login-form {
  position: relative;
  isolation: isolate;
  display: flex;
  width: min(320px, calc(100vw - 2rem));
  min-height: min(460px, calc(100dvh - 2rem));
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

.login-form::before {
  content: "";
  position: absolute;
  inset: -14px;
  z-index: -1;
  border-radius: 2rem;
  background-image: linear-gradient(to bottom, rgba(66, 66, 66, 0.36), rgba(33, 33, 33, 0.36));
  filter: blur(16px);
  opacity: 0.75;
  pointer-events: none;
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

.auth-feedback {
  width: min(17rem, calc(100% - 3rem));
  min-height: 1.25rem;
  margin: 0.75rem 0 0;
  color: wheat;
  font-size: 0.875rem;
  line-height: 1.4;
  text-align: center;
}

.auth-feedback.error {
  color: #ffd4ba;
}

.auth-feedback.success {
  color: #d9ffd8;
}

.login-input {
  width: min(17rem, calc(100% - 3rem));
  margin: 0.5rem 0;
  padding: 1rem 0.5rem;
  color: wheat;
  border: none;
  border-bottom: 1px solid wheat;
  background-color: inherit;
  outline: none;
  transition: all 400ms;
}

.login-input::placeholder {
  color: rgba(245, 222, 179, 0.68);
}

.login-input:hover,
.login-input:focus {
  border: none;
  border-radius: 0.9rem;
  background-color: #424242;
}

.remember-password-option {
  display: flex;
  width: min(17rem, calc(100% - 3rem));
  align-items: center;
  gap: 0.5rem;
  margin: 0.35rem 0 0;
  color: rgba(245, 222, 179, 0.86);
  font-size: 0.9rem;
  line-height: 1.3;
  cursor: pointer;
  user-select: none;
}

.remember-password-option input {
  width: 1rem;
  height: 1rem;
  flex: 0 0 auto;
  accent-color: wheat;
  cursor: pointer;
}

.remember-password-option span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.login-submit {
  width: min(17rem, calc(100% - 3rem));
  height: 3rem;
  margin-top: 3.5rem;
  color: #212121;
  border: none;
  border-radius: 0.9rem;
  background-color: wheat;
  box-shadow:
    0 0 10px antiquewhite,
    0 0 10px antiquewhite;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 400ms;
}

.login-submit:disabled {
  opacity: 0.72;
  cursor: not-allowed;
}

.login-submit:hover,
.login-submit:focus-visible {
  background-color: antiquewhite;
  box-shadow: none;
  outline: none;
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

.login-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: wheat;
  border: 1px solid rgba(245, 222, 179, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 200ms;
}

.login-close:hover,
.login-close:focus-visible {
  color: #212121;
  background-color: wheat;
  outline: none;
}

.login-close .n-icon {
  font-size: 18px;
}

.button {
  position: relative;
  z-index: 1;
  display: inline-grid;
  min-height: 48px;
  place-items: center;
  overflow: hidden;
  max-width: min(260px, calc(100vw - 2rem));
  padding: 10px 24px;
  color: rgb(193, 163, 98);
  border: 2px solid rgb(193, 163, 98);
  border-radius: 34px;
  background-color: transparent;
  font-size: 18px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 300ms cubic-bezier(0.23, 1, 0.32, 1),
    box-shadow 300ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

.button::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  width: 50px;
  height: 50px;
  margin: auto;
  border-radius: inherit;
  background-color: rgb(193, 163, 98);
  scale: 0;
  transition: scale 600ms cubic-bezier(0.23, 1, 0.32, 1);
}

.button:hover::before,
.button:focus-visible::before {
  scale: 3;
}

.button:hover,
.button:focus-visible {
  color: #212121;
  box-shadow: 0 0 20px rgba(193, 163, 98, 0.4);
  transform: scale(1.1);
  outline: none;
}

.login-button-label,
.login-button-logout {
  grid-area: 1 / 1;
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition:
    opacity 300ms cubic-bezier(0.23, 1, 0.32, 1),
    transform 300ms cubic-bezier(0.23, 1, 0.32, 1);
}

.login-button-logout {
  opacity: 0;
  transform: translateX(-18%) scale(0.82);
  pointer-events: none;
}

.button:active {
  transform: scale(1);
}

.button.is-welcome {
  color: rgba(245, 222, 179, 0.86);
  border-color: rgba(193, 163, 98, 0.72);
  background-color: rgba(0, 0, 0, 0.26);
  box-shadow: none;
  cursor: pointer;
}

.button.is-welcome::before {
  background-color: rgb(193, 163, 98);
}

.button.is-welcome:hover,
.button.is-welcome:focus-visible {
  color: #212121;
  border-color: transparent;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
  transform: scale(1.05);
}

.button.is-welcome:hover::before,
.button.is-welcome:focus-visible::before {
  scale: 4;
}

.button.is-welcome:hover .login-button-label,
.button.is-welcome:focus-visible .login-button-label {
  opacity: 0;
  transform: translateX(22%) scale(0.86);
}

.button.is-welcome:hover .login-button-logout,
.button.is-welcome:focus-visible .login-button-logout {
  opacity: 1;
  transform: translateX(0) scale(1);
  animation: button-logout-shake 420ms ease-in-out both;
}

.radio-group {
  position: relative;
  display: flex;
  width: clamp(360px, 38vw, 424px);
  height: 40px;
  padding: 4px;
  gap: 0;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.15);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(20px);
  animation: slide-in 600ms ease-out;
}

.radio-group::before {
  content: "";
  position: absolute;
  inset: -2px;
  z-index: -1;
  border-radius: 50px;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  opacity: 0;
  animation: shine 3s linear infinite;
}

.radio-option {
  position: relative;
  z-index: 1;
  flex: 1;
  animation: fade-in 500ms ease-out backwards;
}

.radio-option:nth-child(1) {
  animation-delay: 100ms;
}

.radio-option:nth-child(2) {
  animation-delay: 200ms;
}

.radio-option:nth-child(3) {
  animation-delay: 300ms;
}

.radio-option:nth-child(4) {
  animation-delay: 400ms;
}

.radio-option input[type="radio"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.radio-label {
  position: relative;
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border-radius: 25px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: color 300ms ease;
}

.radio-label::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.1);
  opacity: 0;
  transition: opacity 300ms ease;
}

.radio-label:hover {
  color: rgba(255, 255, 255, 0.9);
}

.radio-label:hover::before {
  opacity: 1;
}

.radio-option input[type="radio"]:checked + .radio-label {
  color: #667eea;
}

.slider {
  position: absolute;
  top: 4px;
  bottom: 4px;
  z-index: 0;
  border-radius: 25px;
  background: #fff;
  box-shadow:
    0 3px 12px rgba(0, 0, 0, 0.15),
    0 1px 4px rgba(0, 0, 0, 0.1);
  transition: all 400ms cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

.radio-group:has(#option1:checked) .slider {
  left: 4px;
  width: calc(25% - 2px);
}

.radio-group:has(#option2:checked) .slider {
  left: calc(25% + 2px);
  width: calc(25% - 2px);
}

.radio-group:has(#option3:checked) .slider {
  left: 50%;
  width: calc(25% - 2px);
}

.radio-group:has(#option4:checked) .slider {
  left: calc(75% - 2px);
  width: calc(25% - 2px);
}

.radio-group:has(input[type="radio"]:checked) .slider {
  animation: pulse 600ms ease-out;
}

.mobile-menu-trigger {
  position: relative;
  z-index: 3;
  display: none;
  width: 44px;
  height: 44px;
  place-items: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.32);
  border-radius: 999px;
  background:
    radial-gradient(circle at 32% 18%, rgba(255, 255, 255, 0.28), transparent 42%),
    rgba(255, 255, 255, 0.16);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    0 10px 28px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px) saturate(160%);
  cursor: pointer;
  transition:
    transform 240ms cubic-bezier(0.23, 1, 0.32, 1),
    background 240ms ease,
    border-color 240ms ease;
}

.mobile-menu-trigger .n-icon {
  font-size: 20px;
}

.mobile-menu-trigger.is-open,
.mobile-menu-trigger:hover,
.mobile-menu-trigger:focus-visible {
  border-color: rgba(255, 255, 255, 0.52);
  background:
    radial-gradient(circle at 32% 18%, rgba(255, 255, 255, 0.36), transparent 42%),
    rgba(255, 255, 255, 0.22);
  transform: scale(1.06);
  outline: none;
}

.mobile-menu-trigger:active {
  transform: scale(0.96);
}

.mobile-menu-panel {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 1rem;
  z-index: 2;
  display: flex;
  width: min(15rem, calc(100vw - 2rem));
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.55rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.26);
  border-radius: 1.35rem;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.06)),
    rgba(12, 12, 12, 0.58);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 24px 60px rgba(0, 0, 0, 0.42);
  backdrop-filter: blur(22px) saturate(155%);
  transform-origin: top right;
  animation: mobile-menu-expand 340ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.mobile-menu-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 84% 0%, rgba(255, 255, 255, 0.2), transparent 36%),
    linear-gradient(90deg, rgba(255, 255, 255, 0.1), transparent 48%);
}

.mobile-menu-action {
  position: relative;
  z-index: 1;
  isolation: isolate;
  display: flex;
  min-height: 44px;
  width: 100%;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.88);
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0;
  opacity: 0;
  cursor: pointer;
  transform: translateY(-8px) scale(0.88);
  animation: mobile-action-reveal 420ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition:
    color 220ms ease,
    border-color 220ms ease,
    background 220ms ease,
    box-shadow 220ms ease;
}

.mobile-menu-action::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: #fff;
  opacity: 0;
  transform: scale(0.28);
  transition:
    opacity 260ms ease,
    transform 260ms cubic-bezier(0.23, 1, 0.32, 1);
}

.mobile-menu-action:hover,
.mobile-menu-action:focus-visible,
.mobile-menu-action.is-active {
  border-color: rgba(255, 255, 255, 0.56);
  color: #667eea;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
  outline: none;
}

.mobile-menu-action:hover::before,
.mobile-menu-action:focus-visible::before,
.mobile-menu-action.is-active::before {
  opacity: 1;
  transform: scale(1);
}

.hero-stage {
  position: relative;
  width: 100%;
  height: 100dvh;
  overflow: hidden;
  background: #000;
}

.hero-image {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  pointer-events: none;
}

.hero-image-base {
  z-index: 10;
  animation: hero-zoom 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.hero-image-reveal {
  z-index: 30;
  -webkit-mask-size: 100% 100%;
  mask-size: 100% 100%;
}

.mask-canvas {
  display: none;
}

.hero-copy {
  position: absolute;
  top: 14%;
  left: 0;
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 20px;
  text-align: center;
  pointer-events: none;
}

.hero-copy h1 {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 16px;
  margin: 0;
  color: #fff;
  font-size: clamp(48px, 8vw, 96px);
  font-weight: 400;
  line-height: 0.95;
  white-space: nowrap;
}

.hero-copy h1 span:first-child {
  letter-spacing: 0;
}

.hero-copy h1 span:last-child {
  letter-spacing: 0;
}

.hero-copy p {
  margin: 16px 0 0;
  color: #fff;
  font-size: clamp(20px, 3.2vw, 38px);
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.08em;
}

.hero-anim {
  opacity: 0;
  animation-fill-mode: forwards;
  animation-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

.hero-reveal {
  animation-name: hero-reveal;
  animation-duration: 1.1s;
}

.hero-fade {
  animation-name: hero-fade-up;
  animation-duration: 1s;
}

.mobile-login {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 22%;
  z-index: 50;
  display: none;
  justify-content: center;
}

::selection {
  background-color: gray;
}

@keyframes hero-reveal {
  0% {
    opacity: 0;
    filter: blur(12px);
    transform: translateY(28px);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

@keyframes hero-fade-up {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes hero-zoom {
  0% {
    transform: scale(1.12);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse {
  0%,
  100% {
    box-shadow:
      0 3px 12px rgba(0, 0, 0, 0.15),
      0 1px 4px rgba(0, 0, 0, 0.1);
  }

  50% {
    box-shadow:
      0 5px 20px rgba(102, 126, 234, 0.3),
      0 2px 8px rgba(0, 0, 0, 0.15);
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%) rotate(45deg);
  }

  100% {
    transform: translateX(100%) rotate(45deg);
  }
}

@keyframes mobile-menu-expand {
  0% {
    opacity: 0;
    clip-path: inset(0 0 92% 76% round 999px);
    transform: scale(0.72);
  }

  100% {
    opacity: 1;
    clip-path: inset(0 0 0 0 round 1.35rem);
    transform: scale(1);
  }
}

@keyframes mobile-action-reveal {
  0% {
    opacity: 0;
    transform: translateY(-8px) scale(0.88);
  }

  62% {
    opacity: 1;
    transform: translateY(0) scale(1.08);
  }

  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes button-logout-shake {
  0% {
    rotate: 0deg;
  }

  25% {
    rotate: 4deg;
  }

  50% {
    rotate: -4deg;
  }

  75% {
    rotate: 1deg;
  }

  100% {
    rotate: 0deg;
  }
}

@media (max-width: 767px) {
  .hero-nav {
    padding: 16px;
  }

  .desktop-nav,
  .desktop-login {
    display: none;
  }

  .mobile-menu-trigger,
  .mobile-login {
    display: grid;
  }

  .mobile-login {
    display: flex;
  }

  .hero-copy h1 {
    gap: 12px;
    font-size: clamp(48px, 14vw, 72px);
  }

  .hero-copy p {
    font-size: clamp(20px, 7vw, 32px);
  }
}

@media (min-width: 768px) {
  .hero-stage {
    transform: scale(0.9);
    transform-origin: center top;
  }

  .hero-stage {
    width: calc(100% / 0.9);
    height: calc(100dvh / 0.9);
    margin-left: calc((100% - (100% / 0.9)) / 2);
  }
}

@media (max-width: 420px) {
  .brand span {
    font-size: 22px;
  }

  .brand img {
    width: 36px;
    height: 36px;
  }

  .hero-copy h1 {
    gap: 10px;
    font-size: clamp(42px, 13vw, 58px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-anim,
  .hero-image-base,
  .radio-group,
  .radio-option,
  .mobile-menu-panel,
  .mobile-menu-action {
    animation: none;
    opacity: 1;
  }

  .button,
  .button::before,
  .login-button-label,
  .login-button-logout,
  .mobile-menu-trigger,
  .mobile-menu-action,
  .mobile-menu-action::before,
  .slider {
    transition: none;
  }

  .button.is-welcome:hover .login-button-logout,
  .button.is-welcome:focus-visible .login-button-logout {
    animation: none;
  }
}
</style>
