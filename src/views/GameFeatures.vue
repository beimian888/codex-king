<template>
  <div class="game-features-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="container">
        <div class="header-content">
          <div class="header-left">
            <h1 class="page-title">游戏功能</h1>
            <p class="page-subtitle">
              {{ tokenStore.selectedToken?.name || "未选择Token" }}
            </p>
          </div>

          <div class="header-actions">
            <n-button
              class="connection-status-button"
              :class="connectionStatus"
              :type="connectionButtonType"
              strong
              secondary
              round
              :title="connectionButtonTitle"
              @click="toggleConnection"
            >
              <n-icon>
                <CloudDone />
              </n-icon>
              <span>{{ connectionActionLabel }}</span>
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 反馈提示区域 -->
    <div v-if="showFeedback" class="feedback-section" />

    <!-- 功能模块网格 -->
    <div class="features-grid-section">
      <div class="container">
        <GameStatus />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { useMessage } from "naive-ui";
import { useTokenStore } from "@/stores/tokenStore";
import { CloudDone } from "@vicons/ionicons5";

const router = useRouter();
const message = useMessage();
const tokenStore = useTokenStore();

// 响应式数据
const showFeedback = ref(true);
const initializedTokenId = ref(null);

// 计算属性
const connectionStatus = computed(() => {
  if (!tokenStore.selectedToken) return "disconnected";
  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
  return status === "connected" ? "connected" : "disconnected";
});

const isConnected = computed(() => {
  return connectionStatus.value === "connected";
});

const connectionButtonType = computed(() =>
  isConnected.value ? "success" : "warning",
);

const connectionActionLabel = computed(() => {
  if (!tokenStore.selectedToken) return "选择账号";
  return isConnected.value ? "已连接" : "重新连接";
});

const connectionButtonTitle = computed(() => {
  if (!tokenStore.selectedToken) return "点击前往账号管理";
  return isConnected.value ? "点击断开连接" : "点击重新连接";
});

const pickArenaTargetId = (targets) => {
  const candidate =
    targets?.rankList?.[0] ||
    targets?.roleList?.[0] ||
    targets?.targets?.[0] ||
    targets?.targetList?.[0] ||
    targets?.list?.[0];

  if (candidate?.roleId) return candidate.roleId;
  if (candidate?.id) return candidate.id;
  return targets?.roleId || targets?.id;
};

// 方法
const handleFeatureAction = async (featureType) => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择Token");
    router.push("/admin/account-management");
    return;
  }

  const status = tokenStore.getWebSocketStatus(tokenStore.selectedToken.id);
  if (status !== "connected") {
    message.warning("WebSocket未连接，请先建立连接");
    return;
  }

  const tokenId = tokenStore.selectedToken.id;

  const actions = {
    "team-challenge": async () => {
      message.info("开始执行队伍挑战...");
      let targets;
      try {
        targets = await tokenStore.sendMessageWithPromise(
          tokenId,
          "arena_getareatarget",
          {},
          8000,
        );
      } catch (err) {
        message.error(`获取竞技场目标失败：${err.message}`);
        return;
      }
      const targetId = pickArenaTargetId(targets);
      if (!targetId) {
        message.warning("未找到可挑战的竞技场目标");
        return;
      }
      try {
        await tokenStore.sendMessageWithPromise(
          tokenId,
          "fight_startareaarena",
          { targetId },
          15000,
        );
        message.success("竞技场战斗已发起");
      } catch (err) {
        message.error(`竞技场战斗失败：${err.message}`);
      }
    },
    "daily-tasks": () => {
      message.info("启动每日任务服务...");
      tokenStore.sendMessage(tokenId, "task_claimdailyreward");
    },
    "salt-robot": () => {
      message.info("领取盐罐机器人奖励...");
      tokenStore.sendMessage(tokenId, "bottlehelper_claim");
    },
    "idle-time": () => {
      message.info("领取挂机时间奖励...");
      tokenStore.sendMessage(tokenId, "system_claimhangupreward");
    },
    "power-switch": () => {
      message.info("执行威震大开关...");
      tokenStore.sendMessage(tokenId, "role_getroleinfo");
    },
    "club-ranking": () => {
      message.info("报名俱乐部排位...");
      tokenStore.sendMessage(tokenId, "legionmatch_rolesignup");
    },
    "club-checkin": () => {
      message.info("执行俱乐部签到...");
      tokenStore.sendMessage(tokenId, "legion_signin");
    },
    "tower-challenge": () => {
      message.info("开始爬塔挑战...");
      // 关键业务：只提示 UI，不打印冗余日志
      // 实际请求体: {"ack":0,"body":{},"cmd":"fight_starttower","seq":XX,"time":TIMESTAMP}
      tokenStore.sendMessage(tokenId, "fight_starttower");
    },
  };

  const action = actions[featureType];
  if (action) {
    await action();
  } else {
    message.warning("功能暂未实现");
  }
};

// 已移除 sendWebSocketMessage，使用 tokenStore.sendMessage 代替

const connectWebSocket = () => {
  if (!tokenStore.selectedToken) {
    message.warning("请先选择一个Token");
    router.push("/admin/account-management");
    return;
  }

  try {
    const tokenId = tokenStore.selectedToken.id;
    const token = tokenStore.selectedToken.token;
    const wsUrl = tokenStore.selectedToken.wsUrl;

    // 使用 tokenStore 的 WebSocket 连接管理
    tokenStore.createWebSocketConnection(tokenId, token, wsUrl);
    message.info("正在建立 WebSocket 连接...");

    // 等待连接建立
    setTimeout(async () => {
      const status = tokenStore.getWebSocketStatus(tokenId);
      if (status === "connected") {
        message.success("WebSocket 连接成功");
        // 连接成功后自动初始化游戏数据
        await initializeGameData();
      }
    }, 2000);
  } catch (error) {
    console.error("WebSocket连接失败:", error);
    message.error("WebSocket连接失败");
  }
};

const disconnectWebSocket = () => {
  if (tokenStore.selectedToken) {
    const tokenId = tokenStore.selectedToken.id;
    tokenStore.closeWebSocketConnection(tokenId);
    message.info("WebSocket连接已断开");
  }
};

const toggleConnection = () => {
  if (connectionStatus.value === "connected") {
    disconnectWebSocket();
  } else {
    connectWebSocket();
  }
};

// handleWebSocketMessage 已移除，消息处理由 tokenStore 负责

const ensureSelectedToken = () => {
  let selectedNow = false;
  if (!tokenStore.selectedToken && tokenStore.gameTokens.length > 0) {
    selectedNow = Boolean(tokenStore.selectToken(tokenStore.gameTokens[0].id));
  }
  return {
    token: tokenStore.selectedToken,
    selectedNow,
  };
};

// 生命周期
onMounted(() => {
  tokenStore.initTokenStore();

  const { token, selectedNow } = ensureSelectedToken();
  if (!token) {
    router.push("/admin/account-management");
    return;
  }

  if (selectedNow) {
    return;
  }

  const status = tokenStore.getWebSocketStatus(token.id);
  if (status === "connected") {
    initializeGameData();
  } else if (status !== "connecting") {
    connectWebSocket();
  }
});

// 监听当前选中 Token 的连接错误（如 token 过期）并给出明确提示
watch(
  () => {
    if (!tokenStore.selectedToken)
      return { status: "disconnected", lastError: null };
    const conn = tokenStore.wsConnections[tokenStore.selectedToken.id];
    return { status: conn?.status, lastError: conn?.lastError };
  },
  (cur) => {
    if (!cur) return;
    if (cur.status === "connected") {
      const tokenId = tokenStore.selectedToken?.id;
      if (tokenId && initializedTokenId.value !== tokenId) {
        initializedTokenId.value = tokenId;
        initializeGameData();
      }
      return;
    }
    initializedTokenId.value = null;

    if (cur.status === "error" && cur.lastError) {
      const err = String(cur.lastError.error || "").toLowerCase();
      if (err.includes("token") && err.includes("expired")) {
        const importMethod = tokenStore.selectedToken?.importMethod;
        if (
          importMethod === "url" ||
          importMethod === "bin" ||
          importMethod === "wxQrcode"
        ) {
          message.warning("Token已过期，正在尝试自动刷新...");
          return;
        }
        message.error("当前 Token 已过期，请重新导入后再试");
        router.push("/admin/account-management");
      }
    }
  },
  { deep: true },
);

// 初始化游戏数据
const initializeGameData = async () => {
  if (!tokenStore.selectedToken) return;

  try {
    const tokenId = tokenStore.selectedToken.id;
    // 获取初始化数据（静默）
    tokenStore.sendMessage(tokenId, "role_getroleinfo");
    tokenStore.sendMessage(tokenId, "tower_getinfo");
    tokenStore.sendMessage(tokenId, "evotower_getinfo");
    tokenStore.sendMessage(tokenId, "presetteam_getinfo");
    const res = await tokenStore.sendMessageWithPromise(
      tokenId,
      "fight_startlevel",
    );
    tokenStore.setBattleVersion(res?.battleData?.version);
  } catch (error) {
    // 静默处理初始化异常
  }
};

onUnmounted(() => {
  // WebSocket 连接由 tokenStore 管理，不需要手动清理
});
</script>

<style scoped lang="scss">
.game-features-page {
  min-height: 100dvh;
  background: transparent;
  padding-bottom: calc(var(--spacing-md) + env(safe-area-inset-bottom));
}

/* 深色主题下背景 */
:global([data-theme="dark"] .game-features-page) {
  background: transparent;
}

// 页面头部
.page-header {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.78), rgba(241, 247, 253, 0.58)),
    var(--app-surface);
  border-bottom: 1px solid var(--app-line);
  box-shadow: 0 12px 36px rgba(32, 50, 78, 0.08);
  backdrop-filter: blur(20px) saturate(150%);
  -webkit-backdrop-filter: blur(20px) saturate(150%);
  padding: 14px 0 12px;
}

:global([data-theme="dark"] .page-header) {
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.84), rgba(30, 41, 59, 0.62)),
    var(--app-surface);
  box-shadow: 0 14px 40px rgba(0, 0, 0, 0.24);
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .page-header {
    padding: 12px 0;
    margin-bottom: 10px;

    .header-content {
      flex-direction: column;
      gap: var(--spacing-sm);
      text-align: center;
    }

    .page-title {
      font-size: var(--font-size-xl);
    }
  }

  .features-grid-section {
    padding: var(--spacing-md) 0;
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  min-width: 0;
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0 0 2px 0;
  letter-spacing: 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin: 0;
}

.connection-status-button {
  gap: var(--spacing-xs);
  min-height: 32px;
  font-size: var(--font-size-sm);
  font-weight: 700;
  white-space: nowrap;

  :deep(.n-button__content) {
    gap: var(--spacing-xs);
  }

  &.connected :deep(.n-button__content) {
    color: var(--success-color);
  }
}

// 反馈提示区域
.feedback-section {
  padding: 8px 0 0;
}

// 功能模块网格
.features-grid-section {
  padding: 14px 0 var(--spacing-lg);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-lg);
}

.feature-card {
  background: var(--card-bg);
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);

  &:hover {
    border-color: var(--app-ring);
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }

  // 不同功能的主题色
  &.team-challenge {
    border-color: rgba(32, 128, 240, 0.34);
  }

  &.daily-tasks {
    border-color: rgba(240, 160, 32, 0.34);
  }

  &.salt-robot {
    border-color: rgba(24, 160, 88, 0.34);
  }

  &.idle-time {
    border-color: rgba(208, 48, 80, 0.34);
  }

  &.power-switch {
    border-color: rgba(124, 58, 237, 0.34);
  }

  &.club-ranking {
    border-color: rgba(245, 158, 11, 0.34);
  }

  &.club-checkin {
    border-color: rgba(16, 185, 129, 0.34);
  }

  &.tower-challenge {
    border-color: rgba(99, 102, 241, 0.34);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--border-radius-medium);
  background: var(--primary-color-light);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.feature-title {
  flex: 1;

  h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }
}

.feature-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.feature-badge,
.feature-status {
  flex-shrink: 0;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--border-radius-small);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
}

.feature-status {
  &.in-progress {
    background: rgba(240, 160, 32, 0.1);
    color: var(--warning-color);
  }

  &.completed {
    background: rgba(24, 160, 88, 0.1);
    color: var(--success-color);
  }

  &.waiting {
    background: rgba(32, 128, 240, 0.1);
    color: var(--info-color);
  }
}

.card-content {
  margin-bottom: var(--spacing-lg);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);

  .stage-text {
    font-weight: var(--font-weight-medium);
    color: var(--text-primary);
  }

  .progress-text {
    font-weight: var(--font-weight-medium);
    color: var(--text-secondary);
  }
}

.time-display {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  text-align: center;
  margin-bottom: var(--spacing-sm);
  font-family: "SF Mono", "Monaco", "Inconsolata", "Roboto Mono", monospace;
}

.task-description {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}

.card-actions {
  margin-top: var(--spacing-lg);
}

// 响应式设计
@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .container {
    padding: 0 var(--spacing-md);
  }

  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }

  .header-actions {
    justify-content: center;
    width: 100%;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .feature-card {
    padding: var(--spacing-md);
  }

  .card-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
}
</style>
