<template>
  <div class="default-layout" :class="{ 'web-game-layout': isWebGameRoute }">
    <OrbBackground
      v-if="showAmbientBackground"
      class="app-ambient-background"
      :hue="22"
      :hover-intensity="0.34"
      :background-color="ambientBackgroundColor"
    />
    <!-- 顶部导航 -->
    <nav class="dashboard-nav">
      <div class="nav-container">
        <div class="nav-brand">
          <router-link to="/" class="brand-logo-link" aria-label="返回首页">
            <img src="/icons/codex-icon.svg" alt="北冕之王" class="brand-logo" />
          </router-link>
          <div class="brand-toggle" @click="isMobileMenuOpen = true">
            <n-icon>
              <Menu />
            </n-icon>
            <span class="brand-text">北冕之王</span>
          </div>
        </div>

        <div class="nav-menu">
          <router-link
            to="/admin/account-management"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <PersonCircle />
            </n-icon>
            <span>账号管理</span>
          </router-link>
          <router-link
            v-if="canViewSystemManagement"
            to="/admin/system-management"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Settings />
            </n-icon>
            <span>系统管理</span>
          </router-link>
          <router-link
            to="/admin/game-features"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Cube />
            </n-icon>
            <span>游戏功能</span>
          </router-link>
          <router-link
            to="/admin/web-game"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <GameController />
            </n-icon>
            <span>网页游戏</span>
          </router-link>
          <router-link
            to="/admin/batch-daily-tasks"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <Layers />
            </n-icon>
            <span>自动任务</span>
          </router-link>
          <router-link
            v-if="false"
            to="/admin/message-test"
            class="nav-item"
            active-class="active"
          >
            <n-icon>
              <ChatbubbleEllipsesSharp />
            </n-icon>
            <span>消息测试</span>
          </router-link>
          <router-link to="/admin/legion-war" class="nav-item" active-class="active"  v-if="isNowInLegionWarTime()" >
            <n-icon>
              <LockOpen />
            </n-icon>
            <span>实时盐场</span>
          </router-link>
        </div>

        <div class="nav-user">
          <!-- 主题切换按钮 -->
          <ThemeToggle />

          <n-popover
            v-model:show="isAccountMenuOpen"
            trigger="click"
            placement="bottom-end"
            :show-arrow="false"
            content-class="account-menu-popover"
          >
            <template #trigger>
            <div class="user-info">
              <n-avatar
                :src="selectedToken?.avatar || '/icons/codex-icon.svg'"
                size="medium"
                fallback-src="/icons/codex-icon.svg"
              />
              <span class="username">{{
                selectedToken?.name || "未选择Token"
              }}</span>
              <n-icon>
                <ChevronDown />
              </n-icon>
            </div>
            </template>
            <div class="account-menu">
              <div v-if="accountMenuAccounts.length" class="account-menu-list">
                <button
                  v-for="account in accountMenuAccounts"
                  :key="account.id"
                  type="button"
                  class="account-menu-item"
                  :class="{ active: selectedTokenId === account.id }"
                  @click="switchAccount(account.id)"
                >
                  <n-avatar
                    :src="account.avatar || '/icons/codex-icon.svg'"
                    size="small"
                    fallback-src="/icons/codex-icon.svg"
                  />
                  <span class="account-menu-name">{{ account.name || "未命名账号" }}</span>
                  <span v-if="selectedTokenId === account.id" class="account-menu-current">当前</span>
                </button>
              </div>
              <button
                v-else
                type="button"
                class="account-menu-empty"
                @click="goToAccountManagement"
              >
                添加账号
              </button>
              <button
                type="button"
                class="account-menu-logout"
                @click="handleSystemLogout"
              >退出登录</button>
            </div>
          </n-popover>
        </div>
      </div>
    </nav>
    <n-drawer
      v-model:show="isMobileMenuOpen"
      placement="left"
      style="width: 260px"
    >
      <div class="drawer-menu">
        <router-link
          to="/admin/account-management"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <PersonCircle />
          </n-icon>
          <span>账号管理</span>
        </router-link>
        <router-link
          v-if="canViewSystemManagement"
          to="/admin/system-management"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Settings />
          </n-icon>
          <span>系统管理</span>
        </router-link>
        <router-link
          to="/admin/game-features"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Cube />
          </n-icon>
          <span>游戏功能</span>
        </router-link>
        <router-link
          to="/admin/web-game"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <GameController />
          </n-icon>
          <span>网页游戏</span>
        </router-link>
        <router-link
          v-if="false"
          to="/admin/daily-tasks"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Settings />
          </n-icon>
          <span>任务管理</span>
        </router-link>
        <router-link
          to="/admin/batch-daily-tasks"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Layers />
          </n-icon>
          <span>自动任务</span>
        </router-link>
        <router-link
          v-if="false"
          to="/admin/message-test"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <ChatbubbleEllipsesSharp />
          </n-icon>
          <span>消息测试</span>
        </router-link>
          <router-link to="/admin/legion-war" class="nav-item" active-class="active"  v-if="isNowInLegionWarTime()" >
            <n-icon>
              <LockOpen />
            </n-icon>
            <span>实时盐场</span>
          </router-link>
        <router-link
          v-if="false"
          to="/admin/profile"
          class="drawer-item"
          @click="isMobileMenuOpen = false"
        >
          <n-icon>
            <Settings />
          </n-icon>
          <span>个人设置</span>
        </router-link>
      </div>
    </n-drawer>
    <div class="main">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import {
  useTokenStore,
  selectedToken,
  selectedTokenId,
} from "@/stores/tokenStore";
import ThemeToggle from "@/components/Common/ThemeToggle.vue";
import {
  PersonCircle,
  Cube,
  GameController,
  Settings,
  ChevronDown,
  ChatbubbleEllipsesSharp,
  LockClosedSharp,LockOpen,
  Menu,
  Layers,
} from "@vicons/ionicons5";

import { useRoute, useRouter } from 'vue-router'
import { useMessage } from 'naive-ui'
import { computed, onMounted, ref } from 'vue'
import { isNowInLegionWarTime } from '@/utils/clubBattleUtils'
import { isSystemAdminSession, logoutSystemUser } from '@/utils/systemManagementData'
import OrbBackground from "@/components/Common/OrbBackground.vue";
import { useTheme } from "@/composables/useTheme";

const tokenStore = useTokenStore();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const { isDark } = useTheme();

const isMobileMenuOpen = ref(false);
const isAccountMenuOpen = ref(false);
const isWebGameRoute = computed(() => route.name === "WebGame" || route.path.includes("/web-game"));
const isAccountManagementRoute = computed(
  () => route.name === "AccountManagement" || route.path.includes("/account-management"),
);
const canViewSystemManagement = computed(() => isSystemAdminSession());
const showAmbientBackground = computed(() => !isWebGameRoute.value && !isAccountManagementRoute.value);
const ambientBackgroundColor = computed(() =>
  isDark.value ? "#07111f" : "#eef6ff",
);

const accountMenuAccounts = computed(() => tokenStore.gameTokens || []);

onMounted(() => {
  tokenStore.initTokenStore();
});

// 方法
const switchAccount = (tokenId) => {
  if (!tokenId || selectedTokenId.value === tokenId) {
    isAccountMenuOpen.value = false;
    return;
  }

  const token = tokenStore.selectToken(tokenId);
  if (token) {
    message.success(`已切换到 ${token.name || "账号"}`);
  }
  isAccountMenuOpen.value = false;
};

const goToAccountManagement = () => {
  isAccountMenuOpen.value = false;
  router.push("/admin/account-management");
};

const handleSystemLogout = () => {
  logoutSystemUser();
  isAccountMenuOpen.value = false;
  message.success("已退出登录");
  router.push("/");
};
</script>

<style scoped lang="scss">
.default-layout {
  min-height: 100dvh;
  position: relative;
  isolation: isolate;
  overflow-x: hidden;
  background: var(--app-background);
  color: var(--text-primary);
}

.default-layout.web-game-layout {
  background: #05070b;
}

.app-ambient-background {
  position: fixed;
  inset: -18vh -12vw auto;
  height: 72vh;
  min-height: 560px;
  z-index: 0;
  opacity: 0.36;
  pointer-events: none;
  filter: saturate(1.08);
}

:global([data-theme="dark"] .app-ambient-background) {
  display: none;
}

.dashboard-nav {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.56), rgba(255, 255, 255, 0.28)),
    var(--app-surface);
  border-bottom: 1px solid var(--app-glass-border);
  box-shadow: 0 12px 34px rgba(32, 50, 78, 0.08);
  backdrop-filter: blur(28px) saturate(180%);
  -webkit-backdrop-filter: blur(28px) saturate(180%);
  padding: 0 clamp(12px, 2.4vw, 28px);
  position: sticky;
  top: 0;
  z-index: var(--z-sticky);
}

:global([data-theme="dark"] .dashboard-nav) {
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.62), rgba(15, 23, 42, 0.32)),
    var(--app-surface);
  box-shadow: 0 16px 44px rgba(0, 0, 0, 0.28);
}

.nav-container {
  display: flex;
  align-items: center;
  height: 66px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-right: var(--spacing-xl);
}

.brand-logo-link {
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  color: inherit;
  text-decoration: none;
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 3px;
  }
}

.brand-logo {
  width: 42px;
  height: 42px;
  border: 1px solid var(--app-glass-border);
  border-radius: 12px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.66),
    0 10px 24px rgba(32, 50, 78, 0.12);
  object-fit: cover;
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.brand-toggle {
  display: none;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  font-size: var(--font-size-lg);
}

.brand-toggle .n-icon {
  font-size: inherit;
}

.nav-menu {
  display: flex;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  color: var(--text-secondary);
  font-weight: 650;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background-color 180ms ease,
    border-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;

  &:hover {
    background: var(--app-surface-muted);
    border-color: var(--app-line);
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  &.active {
    background:
      linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.18), rgba(20, 184, 166, 0.12)),
      var(--app-surface-strong);
    border-color: rgba(var(--primary-color-rgb), 0.28);
    color: var(--primary-color);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
  }
}

.nav-user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 40px;
  max-width: 220px;
  padding: 4px 10px 4px 4px;
  border: 1px solid var(--app-line);
  border-radius: 999px;
  background: var(--app-surface-muted);
  cursor: pointer;
  transition:
    background-color 180ms ease,
    border-color 180ms ease;

  &:hover {
    background: var(--app-surface-strong);
    border-color: var(--app-ring);
  }
}

.username {
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.account-menu-popover) {
  padding: 6px;
  border-radius: 14px;
  background: var(--app-surface-strong);
  border: 1px solid var(--app-glass-border);
  box-shadow: 0 12px 30px rgba(32, 50, 78, 0.14);
}

.account-menu {
  width: min(260px, calc(100vw - 32px));
}

.account-menu-list {
  max-height: calc(48px * 3);
  overflow-y: auto;
  padding-right: 2px;
}

.account-menu-list::-webkit-scrollbar {
  width: 6px;
}

.account-menu-list::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(var(--primary-color-rgb), 0.28);
}

.account-menu-item,
.account-menu-empty,
.account-menu-logout {
  width: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.account-menu-item:hover,
.account-menu-empty:hover {
  background: var(--app-surface-muted);
}

.account-menu-item.active {
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--primary-color);
}

.account-menu-name {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 650;
}

.account-menu-current {
  flex: 0 0 auto;
  color: var(--primary-color);
  font-size: 12px;
  font-weight: 700;
}

.account-menu-empty {
  justify-content: center;
  color: var(--primary-color);
  font-weight: 700;
}

.account-menu-logout {
  justify-content: center;
  margin-top: 6px;
  border-top: 1px solid var(--app-line);
  border-radius: 0 0 10px 10px;
  color: #dc2626;
  font-weight: 700;
}

.account-menu-logout:hover {
  background: rgba(220, 38, 38, 0.1);
}

.main {
  position: relative;
  z-index: 1;
  min-height: calc(100dvh - 66px);
}

@media (max-width: 768px) {
  .nav-item span {
    display: none;
  }

  .nav-menu {
    display: none;
  }

  .nav-item {
    padding: var(--spacing-sm);
    flex: 0 0 auto;
  }

  .nav-container {
    height: 58px;
  }

  .brand-logo-link,
  .brand-logo {
    display: none;
  }

  .brand-toggle {
    display: inline-flex;
  }

  .user-info {
    max-width: 150px;
  }
}

.drawer-menu {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--bg-primary);
}

.drawer-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-height: 42px;
  padding: 0 var(--spacing-md);
  border-radius: 999px;
  color: var(--text-secondary);
  text-decoration: none;
}

.drawer-item.router-link-active {
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.nav-item.disabled {
  background: var(--bg-tertiary);
  color: var(--text-disabled);
  cursor: not-allowed;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .app-ambient-background {
    display: none;
  }

  .nav-item,
  .user-info {
    transition: none;
  }

  .nav-item:hover {
    transform: none;
  }
}
</style>
