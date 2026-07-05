<template>
  <n-config-provider :theme="naiveTheme" :theme-overrides="naiveThemeOverrides">
    <n-message-provider placement="top" container-class="center-message-provider">
      <n-loading-bar-provider>
        <n-notification-provider>
          <n-dialog-provider>
            <div id="app">
              <router-view />
            </div>
          </n-dialog-provider>
        </n-notification-provider>
      </n-loading-bar-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { darkTheme } from "naive-ui";
import { useTheme } from "@/composables/useTheme";

const { isDark, initTheme, setupSystemThemeListener, updateReactiveState } =
  useTheme();

// Naive UI 主题
const naiveTheme = computed(() => {
  return isDark.value ? darkTheme : null;
});

const naiveThemeOverrides = computed(() => {
  const dark = isDark.value;
  const primary = dark ? "#38bdf8" : "#0ea5e9";
  const primaryHover = dark ? "#7dd3fc" : "#0284c7";
  const primaryPressed = dark ? "#0ea5e9" : "#0369a1";
  const textBase = dark ? "#f8fbff" : "#132033";
  const textMuted = dark ? "#c5d2e3" : "#526174";
  const surface = dark ? "rgba(17, 24, 39, 0.88)" : "rgba(255, 255, 255, 0.54)";
  const surfaceMuted = dark ? "rgba(31, 41, 55, 0.76)" : "rgba(241, 247, 253, 0.48)";
  const border = dark ? "rgba(148, 163, 184, 0.28)" : "rgba(99, 116, 139, 0.22)";

  return {
    common: {
      primaryColor: primary,
      primaryColorHover: primaryHover,
      primaryColorPressed: primaryPressed,
      primaryColorSuppl: primaryHover,
      infoColor: dark ? "#38bdf8" : "#0ea5e9",
      successColor: "#10b981",
      warningColor: "#f59e0b",
      errorColor: "#ef4444",
      bodyColor: "transparent",
      cardColor: surface,
      modalColor: surface,
      popoverColor: surface,
      tableColor: surface,
      textColorBase: textBase,
      textColor1: textBase,
      textColor2: textMuted,
      textColor3: dark ? "#91a1b5" : "#7a8798",
      borderColor: border,
      dividerColor: border,
      borderRadius: "12px",
      borderRadiusSmall: "8px",
      fontWeightStrong: "700",
    },
    Button: {
      borderRadiusMedium: "999px",
      borderRadiusLarge: "999px",
      textColor: textBase,
      textColorHover: primary,
      textColorPressed: primaryPressed,
      border: `1px solid ${border}`,
      borderHover: `1px solid ${dark ? "rgba(56, 189, 248, 0.34)" : "rgba(14, 165, 233, 0.34)"}`,
      color: surfaceMuted,
      colorHover: surface,
      colorPressed: surfaceMuted,
    },
    Card: {
      color: surface,
      colorEmbedded: surfaceMuted,
      borderColor: border,
      borderRadius: "18px",
      titleTextColor: textBase,
    },
    Input: {
      color: surfaceMuted,
      colorFocus: surface,
      border: `1px solid ${border}`,
      borderHover: `1px solid ${dark ? "rgba(56, 189, 248, 0.42)" : "rgba(14, 165, 233, 0.42)"}`,
      borderFocus: `1px solid ${primary}`,
      caretColor: primary,
      textColor: textBase,
      placeholderColor: dark ? "#8fa1b7" : "#7a8798",
    },
    Select: {
      peers: {
        InternalSelection: {
          color: surfaceMuted,
          colorActive: surface,
          border: `1px solid ${border}`,
          borderHover: `1px solid ${dark ? "rgba(56, 189, 248, 0.42)" : "rgba(14, 165, 233, 0.42)"}`,
          borderActive: `1px solid ${primary}`,
          textColor: textBase,
          placeholderColor: dark ? "#8fa1b7" : "#7a8798",
        },
      },
    },
    Dropdown: {
      color: surface,
      optionTextColor: textBase,
      optionTextColorHover: textBase,
      optionColorHover: surfaceMuted,
      borderRadius: "12px",
    },
    Modal: {
      color: surface,
      textColor: textBase,
    },
    Dialog: {
      color: surface,
      textColor: textBase,
    },
    Drawer: {
      color: surface,
      textColor: textBase,
    },
    Tabs: {
      tabTextColorActiveLine: primary,
      barColor: primary,
      tabBorderRadius: "999px",
    },
    Tag: {
      borderRadius: "999px",
      textColor: textBase,
    },
  };
});

// 监听主题变化事件
const handleThemeChange = () => {
  // 确保响应式状态同步
  updateReactiveState();
  // 强制重新渲染
  setTimeout(() => {
    updateReactiveState();
  }, 50);
};

onMounted(() => {
  initTheme();
  setupSystemThemeListener();

  // 监听自定义主题变化事件
  window.addEventListener("theme-change", handleThemeChange);

  // 初始化时更新状态
  updateReactiveState();
});

onUnmounted(() => {
  window.removeEventListener("theme-change", handleThemeChange);
});
</script>

<style>
/* 主题变量 */
:root {
  --text-color: var(--text-primary);
}

/* 深色主题变量 */
.dark {
  --text-color: var(--text-primary);
}

/* 深色主题样式优化 - 针对Naive UI组件 */
html.dark,
html[data-theme="dark"] {
  color-scheme: dark;
}

html.dark .n-form-item-label,
html.dark .n-form-item-label__text,
html[data-theme="dark"] .n-form-item-label,
html[data-theme="dark"] .n-form-item-label__text {
  color: var(--text-secondary) !important;
}

html.dark .n-input,
html[data-theme="dark"] .n-input {
  background-color: var(--app-surface-muted) !important;
  border-color: var(--app-line) !important;
}

html.dark .n-modal,
html.dark .n-drawer,
html.dark .n-popover,
html.dark .n-dropdown,
html.dark .n-tooltip,
html.dark .n-dialog,
html[data-theme="dark"] .n-modal,
html[data-theme="dark"] .n-drawer,
html[data-theme="dark"] .n-popover,
html[data-theme="dark"] .n-dropdown,
html[data-theme="dark"] .n-tooltip,
html[data-theme="dark"] .n-dialog {
  color: var(--text-primary) !important;
}

html.dark .n-modal .n-card,
html.dark .n-drawer-content,
html.dark .n-popover-content,
html.dark .n-dropdown-option,
html.dark .n-dialog__content,
html[data-theme="dark"] .n-modal .n-card,
html[data-theme="dark"] .n-drawer-content,
html[data-theme="dark"] .n-popover-content,
html[data-theme="dark"] .n-dropdown-option,
html[data-theme="dark"] .n-dialog__content {
  color: var(--text-primary) !important;
}

html.dark .n-dropdown-option__label,
html.dark .n-select-option,
html.dark .n-menu-item-content,
html[data-theme="dark"] .n-dropdown-option__label,
html[data-theme="dark"] .n-select-option,
html[data-theme="dark"] .n-menu-item-content {
  color: var(--text-primary) !important;
}

html.dark .n-collapse-item__header,
html.dark .n-radio-button,
html.dark .n-card,
html.dark .n-card__content,
html.dark .n-tag,
html[data-theme="dark"] .n-collapse-item__header,
html[data-theme="dark"] .n-radio-button,
html[data-theme="dark"] .n-card,
html[data-theme="dark"] .n-card__content,
html[data-theme="dark"] .n-tag {
  color: var(--text-primary) !important;
}

html.dark .n-input__placeholder,
html.dark ::placeholder,
html[data-theme="dark"] .n-input__placeholder,
html[data-theme="dark"] ::placeholder {
  color: var(--text-tertiary) !important;
}

body.dark .n-modal-container,
body.dark .n-drawer-container,
body.dark .n-popover-container,
body[data-theme="dark"] .n-modal-container,
body[data-theme="dark"] .n-drawer-container,
body[data-theme="dark"] .n-popover-container {
  color: var(--text-primary) !important;
}

#app {
  min-height: 100vh;
  background: var(--app-background);
  color: var(--text-color);
  transition:
    background 0.3s ease,
    color 0.3s ease;
}

.center-message-provider.n-message-container {
  top: 50% !important;
  right: auto !important;
  bottom: auto !important;
  left: 50% !important;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  width: max-content;
  max-width: calc(100vw - 32px);
  height: auto;
  background: transparent !important;
  pointer-events: none;
}

.center-message-provider .n-message {
  max-width: calc(100vw - 32px);
  pointer-events: auto;
}

/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  font-family:
    "SF Pro Display",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    "PingFang SC",
    "Hiragino Sans GB",
    "Microsoft YaHei",
    "Helvetica Neue",
    Helvetica,
    Arial,
    sans-serif;
  color: var(--text-color);
  transition: color 0.3s ease;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(99, 116, 139, 0.12);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(99, 116, 139, 0.34);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(var(--primary-color-rgb), 0.52);
}
</style>
