<template>
  <div class="web-game-page">
    <div class="web-game-stage">
      <aside
        v-if="tokenOptions.length && showFloatingDock"
        class="multi-open-dock"
      >
        <header class="multi-open-dock-header">
          <div class="multi-open-dock-title">
            <strong>网页游戏</strong>
            <span>{{ gameInstances.length }} 个窗口</span>
          </div>
          <div class="multi-open-dock-actions">
            <button
              type="button"
              class="multi-open-dock-close"
              aria-label="关闭控制窗"
              title="关闭控制窗"
              @click="showFloatingDock = false"
            >
              <span class="multi-open-dock-close-icon" aria-hidden="true"></span>
            </button>
          </div>
        </header>
        <div class="multi-open-dock-body">
          <n-select
            v-model:value="selectedTokenIdForGame"
            class="multi-open-account-select"
            size="small"
            :options="multiOpenTokenOptions"
            placeholder="选择账号"
          />
          <n-button
            class="multi-open-dock-primary-action"
            type="primary"
            size="small"
            :loading="isPreparingLogin"
            :disabled="!canOpenGameInstance"
            @click="openGameInstance()"
          >
            打开游戏
          </n-button>
          <div class="multi-open-dock-link-actions">
            <n-button
              class="multi-open-dock-link-button"
              text
              type="primary"
              @click="openJsInjectorModal"
            >
              添加JS
            </n-button>
            <span class="multi-open-dock-divider" aria-hidden="true"></span>
            <n-button
              class="multi-open-dock-link-button"
              text
              type="primary"
              @click="showJsManagerModal = true"
            >
              删除JS
            </n-button>
          </div>
        </div>
      </aside>
      <button
        v-if="tokenOptions.length && !showFloatingDock"
        type="button"
        class="floating-dock-reopen"
        @click="showFloatingDock = true"
      >
        打开控制
      </button>

      <div class="web-game-content">
        <div
          v-if="gameInstances.length > 1"
          class="mobile-instance-tabs"
          aria-label="多开窗口切换"
        >
          <button
            v-for="(instance, index) in gameInstances"
            :key="instance.id"
            type="button"
            class="mobile-instance-tab"
            :class="{ active: activeGameInstanceId === instance.id }"
            @click="setActiveGameInstance(instance.id)"
          >
            {{ instance.name || `窗口 ${index + 1}` }}
          </button>
        </div>

        <div
          v-if="gameInstances.length"
          class="game-instance-grid"
          :class="`instance-count-${gameInstances.length}`"
        >
          <div class="game-instance-canvas">
            <section
              v-for="instance in gameInstances"
              :key="instance.id"
              class="game-instance-card"
              :class="{
                active: activeGameInstanceId === instance.id,
                fullscreen: isGameInstanceFullscreen(instance.id),
                minimized: isGameInstanceMinimized(instance.id),
              }"
              :style="getGameInstanceStyle(instance)"
              @click="setActiveGameInstance(instance.id)"
            >
              <header
                class="game-instance-header"
                @pointerdown="startDragGameInstance($event, instance)"
              >
                <div class="game-instance-title">
                  <img
                    v-if="instance.avatar"
                    class="game-instance-avatar"
                    :src="instance.avatar"
                    alt=""
                  />
                  <span class="game-instance-name">{{ instance.name || "未命名账号" }}</span>
                  <span v-if="instance.server" class="game-instance-server">
                    {{ instance.server }}
                  </span>
                </div>
                <div class="game-instance-actions" @pointerdown.stop @click.stop>
                  <div class="game-instance-actions-toolbar" aria-label="窗口操作">
                    <button
                      type="button"
                      class="game-window-tool-button game-instance-minimize-button"
                      :class="{ active: isGameInstanceMinimized(instance.id) }"
                      :aria-label="isGameInstanceMinimized(instance.id) ? '恢复当前窗口' : '最小化当前窗口'"
                      :title="isGameInstanceMinimized(instance.id) ? '恢复当前窗口' : '最小化当前窗口'"
                      @click="toggleGameInstanceMinimized(instance.id)"
                    >
                      <span class="game-instance-minimize-icon" aria-hidden="true"></span>
                    </button>
                    <button
                      type="button"
                      class="game-window-tool-button game-instance-fullscreen-button"
                      :class="{ active: isGameInstanceFullscreen(instance.id) }"
                      aria-label="铺满全屏"
                      title="铺满全屏"
                      @click="toggleGameInstanceFullscreen(instance.id)"
                    >
                      <span class="game-instance-fullscreen-icon" aria-hidden="true"></span>
                    </button>
                    <button
                      type="button"
                      class="game-window-tool-button game-instance-refresh-button"
                      aria-label="刷新当前窗口"
                      title="刷新当前窗口"
                      @click="refreshGameInstance(instance.id)"
                    >
                      <n-icon aria-hidden="true">
                        <Refresh />
                      </n-icon>
                    </button>
                    <button
                      type="button"
                      class="game-window-tool-button game-instance-close-button"
                      aria-label="关闭当前窗口"
                      title="关闭当前窗口"
                      @click="closeGameInstance(instance.id)"
                    >
                      <span class="game-instance-close-icon" aria-hidden="true"></span>
                    </button>
                  </div>
                </div>
              </header>
              <iframe
                :key="`${instance.id}-${instance.frameKey}`"
                class="game-frame"
                :style="getGameFrameStyle(instance)"
                :data-instance-id="instance.id"
                :src="buildGameEntryUrl(instance.account, instance.id)"
                :title="instance.name || '北冕之王'"
                allow="autoplay; fullscreen; clipboard-read; clipboard-write"
                allowfullscreen
                @load="injectStoredJsToGameFrame"
              />
              <button
                type="button"
                class="game-instance-resize-handle resize-right"
                aria-label="拖动右边缘缩放窗口"
                @pointerdown.stop.prevent="startResizeGameInstance($event, instance, 'right')"
              />
              <button
                type="button"
                class="game-instance-resize-handle resize-bottom"
                aria-label="拖动下边缘缩放窗口"
                @pointerdown.stop.prevent="startResizeGameInstance($event, instance, 'bottom')"
              />
              <button
                type="button"
                class="game-instance-resize-handle resize-corner"
                aria-label="拖动右下角缩放窗口"
                @pointerdown.stop.prevent="startResizeGameInstance($event, instance, 'corner')"
              />
            </section>
          </div>
        </div>

        <div v-else class="web-game-empty">
          <p v-if="tokenOptions.length">选择账号后点击“打开游戏”开始多开</p>
          <p v-else>还没有可用账号，请先导入 Token</p>
        </div>
      </div>
    </div>

    <n-modal
      v-model:show="showJsInjectorModal"
      preset="card"
      title="添加JS"
      class="js-injector-modal"
      :bordered="false"
      :style="{ width: 'min(720px, calc(100vw - 32px))' }"
    >
      <div class="js-injector-content">
        <div class="js-injector-file-row">
          <input
            ref="jsInjectorFileInput"
            type="file"
            accept=".js,.txt"
            class="js-injector-file-input"
            @change="readJsFile"
          />
          <n-button secondary size="small" @click="triggerJsFileSelect">
            选择文件
          </n-button>
          <span class="js-injector-file-name">
            {{ jsInjectorForm.fileName || "支持 .js / .txt 文件" }}
          </span>
        </div>
        <p v-if="jsInjectorForm.contentSummary" class="js-injector-summary">
          {{ jsInjectorForm.contentSummary }}
        </p>
      </div>
      <template #footer>
        <div class="js-injector-actions">
          <n-button @click="showJsInjectorModal = false">取消</n-button>
          <n-button
            type="primary"
            :loading="isInjectingJs"
            :disabled="!hasJsInjectorContent"
            @click="injectJsToAllGameFrames"
          >
            添加
          </n-button>
        </div>
      </template>
    </n-modal>

    <n-modal
      v-model:show="showJsManagerModal"
      preset="card"
      title="删除JS"
      class="js-manager-modal"
      :bordered="false"
      :style="{ width: 'min(680px, calc(100vw - 32px))' }"
    >
      <div class="stored-js-list">
        <div v-if="storedJsSnippets.length" class="stored-js-items">
          <div
            v-for="snippet in storedJsSnippets"
            :key="snippet.id"
            class="stored-js-item"
          >
            <div class="stored-js-info">
              <strong>{{ snippet.name || "inline-js" }}</strong>
              <span>{{ formatJsContentSize(snippet.size || snippet.content.length) }}</span>
            </div>
            <n-button
              size="small"
              tertiary
              type="error"
              @click="confirmDeleteStoredJs(snippet)"
            >
              删除
            </n-button>
          </div>
        </div>
        <div v-else class="stored-js-empty">
          还没有添加任何JS
        </div>
      </div>
    </n-modal>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { useDialog, useMessage } from "naive-ui";
import { Refresh } from "@vicons/ionicons5";
import { useTokenStore } from "@/stores/tokenStore";

const tokenStore = useTokenStore();
const dialog = useDialog();
const message = useMessage();
const GAME_WINDOW_ASPECT_WIDTH = 320;
const GAME_WINDOW_ASPECT_HEIGHT = 560;
const MIN_GAME_WINDOW_WIDTH = 200;
const DEFAULT_GAME_WINDOW_WIDTH = 320;
const DEFAULT_GAME_WINDOW_X = 380;
const DEFAULT_GAME_WINDOW_Y = 24;
const MAX_GAME_WINDOW_WIDTH = 900;
const MAX_INLINE_JS_EDITOR_LENGTH = 120 * 1024;
const STORED_JS_SNIPPETS_STORAGE_KEY = "xyzw-web-game-stored-js-snippets";
const WEB_GAME_FULLSCREEN_CLASS = "web-game-fullscreen-active";
const selectedTokenIdForGame = ref(tokenStore.selectedToken?.id || "");
const activeGameInstanceId = ref("");
const draggingGameInstance = ref(null);
const resizingGameInstance = ref(null);
const minimizedGameInstanceIds = ref(new Set());
const isPreparingLogin = ref(false);
const isInjectingJs = ref(false);
const showJsInjectorModal = ref(false);
const showJsManagerModal = ref(false);
const showFloatingDock = ref(true);
const fullscreenGameInstanceId = ref("");
const jsInjectorFileInput = ref(null);
const jsInjectorForm = ref({
  fileName: "",
  scriptContent: "",
  contentSummary: "",
});
let jsInjectorPendingContent = "";
const storedJsSnippets = ref([]);
const preparedGameAccounts = ref({});
const gameInstances = ref([]);
const DEFAULT_WEB_GAME_MANIFEST_VERSION = "0.32.0";
const DEFAULT_GAME_LOGIN_VERSION = "1.89.8-wx";

const tokenOptions = computed(() =>
  tokenStore.gameTokens.map((token) => ({
    label: token.server ? `${token.name} - ${token.server}` : token.name,
    value: token.id,
  })),
);

const openedGameTokenIds = computed(
  () => new Set(gameInstances.value.map((instance) => instance.tokenId)),
);

const multiOpenTokenOptions = computed(() =>
  tokenStore.gameTokens.map((token) => ({
    label: token.server ? `${token.name} - ${token.server}` : token.name,
    value: token.id,
    disabled: openedGameTokenIds.value.has(token.id),
  })),
);

const canOpenGameInstance = computed(
  () =>
    !!selectedTokenIdForGame.value &&
    !openedGameTokenIds.value.has(selectedTokenIdForGame.value) &&
    !isPreparingLogin.value,
);

const hasJsInjectorContent = computed(
  () => !!(jsInjectorPendingContent || jsInjectorForm.value.scriptContent).trim(),
);

const updateGameInstanceGeometry = (instanceId, patch) => {
  gameInstances.value = gameInstances.value.map((instance) =>
    instance.id === instanceId ? { ...instance, ...patch } : instance,
  );
};

const normalizeGameWindowWidth = (value) => {
  const width = Number(value);
  if (!Number.isFinite(width)) return DEFAULT_GAME_WINDOW_WIDTH;
  const steppedWidth = Math.round(width / 10) * 10;
  return Math.min(
    MAX_GAME_WINDOW_WIDTH,
    Math.max(MIN_GAME_WINDOW_WIDTH, steppedWidth),
  );
};

const getGameFrameHeight = (width) =>
  Math.round(
    (normalizeGameWindowWidth(width) * GAME_WINDOW_ASPECT_HEIGHT) /
      GAME_WINDOW_ASPECT_WIDTH,
  );

const safeJsonParse = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const normalizeStoredJsSnippets = (snippets) => {
  if (!Array.isArray(snippets)) return [];
  return snippets
    .filter((snippet) => snippet?.id && typeof snippet.content === "string")
    .map((snippet) => ({
      id: `${snippet.id}`,
      name: snippet.name ? `${snippet.name}` : "inline-js",
      size: Number.isFinite(Number(snippet.size))
        ? Number(snippet.size)
        : snippet.content.length,
      content: snippet.content,
    }));
};

const loadStoredJsSnippets = () => {
  try {
    const savedSnippets = safeJsonParse(
      localStorage.getItem(STORED_JS_SNIPPETS_STORAGE_KEY),
    );
    storedJsSnippets.value = normalizeStoredJsSnippets(savedSnippets);
  } catch (error) {
    console.warn("load stored js snippets failed", error);
  }
};

const saveStoredJsSnippets = () => {
  try {
    localStorage.setItem(STORED_JS_SNIPPETS_STORAGE_KEY, JSON.stringify(normalizeStoredJsSnippets(storedJsSnippets.value)));
    return true;
  } catch (error) {
    console.warn("save stored js snippets failed", error);
    message.warning("JS保存失败，刷新页面后可能需要重新添加");
    return false;
  }
};

const decodeBase64Text = (value) => {
  if (!value || typeof value !== "string") return "";
  const cleanValue = value.replace(/^data:.*base64,/, "").trim();
  try {
    return decodeURIComponent(
      Array.from(atob(cleanValue))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
  } catch {
    return "";
  }
};

const readTokenFromUrl = (value) => {
  const tokenText = `${value || ""}`.trim();
  if (!tokenText) return "";

  const readParams = (searchText) => {
    try {
      const params = new URLSearchParams(searchText.replace(/^\?/, ""));
      return (
        params.get("token") ||
        params.get("roleToken") ||
        params.get("actualToken") ||
        params.get("p") ||
        ""
      );
    } catch {
      return "";
    }
  };

  try {
    const url = new URL(tokenText);
    return readParams(url.search);
  } catch {
    if (tokenText.includes("?") || tokenText.includes("&")) {
      const query = tokenText.includes("?")
        ? tokenText.slice(tokenText.indexOf("?") + 1)
        : tokenText;
      return readParams(query);
    }
  }

  return "";
};

const encodeJsonParam = (value) => {
  const json = JSON.stringify(value);
  return btoa(
    encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex) =>
      String.fromCharCode(Number.parseInt(hex, 16)),
    ),
  );
};

const pickFirst = (source, keys) => {
  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null && `${value}`.trim() !== "") {
      return `${value}`;
    }
  }
  return "";
};

const tokenFieldKeys = ["roleToken", "actualToken", "token", "gameToken", "p"];
const loginVersionKeys = ["loginVersion", "clientVersion", "gameVersion"];
const manifestVersionKeys = ["manifestVersion", "entryVersion"];
const authQueryKeys = [
  "roleId",
  "sessId",
  "connId",
  "isRestore",
  "serverId",
  "areaId",
  "platformUId",
  "platformUid",
];

const normalizeLoginVersion = (value) => {
  const versionText = `${value || ""}`.trim();
  if (!versionText) return "";

  // The launcher manifest version is a separate entry version. The WebSocket
  // login version should match GAME_VERSION from game-defines.
  if (/^\d+\.\d+\.\d+(?:-android)?$/i.test(versionText)) {
    return "";
  }

  return versionText;
};

const unwrapTokenCandidate = (value) => {
  let tokenValue = `${value || ""}`.trim();
  if (!tokenValue) return "";

  const fromUrl = readTokenFromUrl(tokenValue);
  if (fromUrl) tokenValue = fromUrl;

  const parsedValue = safeJsonParse(tokenValue);
  if (parsedValue && typeof parsedValue === "object") {
    const nestedValue = pickFirst(parsedValue, tokenFieldKeys);
    return nestedValue && nestedValue !== tokenValue
      ? unwrapTokenCandidate(nestedValue)
      : tokenValue;
  }

  return tokenValue;
};

const buildWebGameAccount = (token) => {
  const rawToken = `${token?.token || ""}`.trim();
  const storeParseResult = rawToken ? tokenStore.parseBase64Token(rawToken) : null;
  const decodedToken = decodeBase64Text(rawToken);
  const tokenFromUrl = readTokenFromUrl(rawToken) || readTokenFromUrl(decodedToken);
  const parsedToken =
    safeJsonParse(tokenFromUrl) ||
    safeJsonParse(rawToken) ||
    safeJsonParse(decodedToken) ||
    (storeParseResult?.success ? storeParseResult.data : null) ||
    {};

  const actualToken =
    unwrapTokenCandidate(storeParseResult?.success ? storeParseResult.data?.actualToken : "") ||
    unwrapTokenCandidate(pickFirst(parsedToken, tokenFieldKeys)) ||
    unwrapTokenCandidate(tokenFromUrl) ||
    unwrapTokenCandidate(rawToken);
  const loginVersion =
    normalizeLoginVersion(pickFirst(parsedToken, loginVersionKeys)) ||
    normalizeLoginVersion(parsedToken.version) ||
    DEFAULT_GAME_LOGIN_VERSION;
  const manifestVersion =
    pickFirst(parsedToken, manifestVersionKeys) || DEFAULT_WEB_GAME_MANIFEST_VERSION;

  const authData = {
    ...parsedToken,
    token: actualToken,
    roleToken: actualToken,
    version: loginVersion,
    gameVersion: loginVersion,
    loginVersion,
    manifestVersion,
    name: token?.name || parsedToken.name || "",
    server: token?.server || parsedToken.server || "",
  };

  return {
    token: actualToken,
    authData,
    loginVersion,
    manifestVersion,
    userId: pickFirst(parsedToken, [
      "userId",
      "uid",
      "id",
      "openId",
      "platformUId",
      "platformUid",
    ]),
    openId: pickFirst(parsedToken, ["openId", "openid"]),
    name: token?.name || parsedToken.name || "",
    server: token?.server || parsedToken.server || "",
  };
};

const buildGameEntryUrl = (account, instanceId = "") => {
  if (!account?.token) {
    return "about:blank";
  }

  const params = new URLSearchParams();
  params.set("platformReplyType", "WebMiniGame");
  params.set("e", "x");
  params.set("lang", "chinese");
  params.set("source", "xyzw-web-helper");
  params.set("muted", "1");
  params.set("multiOpen", "1");
  if (instanceId) {
    params.set("instanceId", instanceId);
  }

  if (account.token) {
    params.set("token", account.token);
    params.set("roleToken", account.token);
  }
  if (account.loginVersion) {
    params.set("version", account.loginVersion);
    params.set("gameVersion", account.loginVersion);
  }
  if (account.manifestVersion) {
    params.set("manifestVersion", account.manifestVersion);
  }
  if (account.userId) {
    params.set("userId", account.userId);
    params.set("uid", account.userId);
    params.set("id", account.userId);
  }
  if (account.authData) {
    for (const key of authQueryKeys) {
      const value = account.authData[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        params.set(key, `${value}`);
      }
    }
  }
  if (account.openId) {
    params.set("openId", account.openId);
  }
  if (account.authData) {
    params.set("authUser", encodeJsonParam(account.authData));
  }
  if (account.name) {
    params.set("name", account.name);
  }
  if (account.server) {
    params.set("server", account.server);
  }

  return `/web-game/asar/index.html?${params.toString()}`;
};

const createGameInstanceId = (tokenId) =>
  `game_${tokenId || "token"}_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;

const prepareGameAccount = async (token) => {
  if (preparedGameAccounts.value[token.id]) {
    return preparedGameAccounts.value[token.id];
  }

  const account = await tokenStore.prepareWebGameLogin(token.id);
  preparedGameAccounts.value = {
    ...preparedGameAccounts.value,
    [token.id]: account,
  };
  return account;
};

const setActiveGameInstance = (instanceId) => {
  if (gameInstances.value.some((instance) => instance.id === instanceId)) {
    activeGameInstanceId.value = instanceId;
  }
};

const isMobileViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(max-width: 768px)")?.matches;

const isGameInstanceFullscreen = (instanceId) =>
  fullscreenGameInstanceId.value === instanceId;

const isGameInstanceMinimized = (instanceId) =>
  minimizedGameInstanceIds.value.has(instanceId);

const clearGameInstanceMinimized = (instanceId) => {
  if (!minimizedGameInstanceIds.value.has(instanceId)) return;
  const nextIds = new Set(minimizedGameInstanceIds.value);
  nextIds.delete(instanceId);
  minimizedGameInstanceIds.value = nextIds;
};

const toggleGameInstanceMinimized = (instanceId) => {
  const nextIds = new Set(minimizedGameInstanceIds.value);
  if (nextIds.has(instanceId)) {
    nextIds.delete(instanceId);
  } else {
    nextIds.add(instanceId);
  }
  minimizedGameInstanceIds.value = nextIds;
  setActiveGameInstance(instanceId);
};

const findGameInstanceFrame = (instanceId) =>
  Array.from(document.querySelectorAll(".game-frame")).find(
    (frame) => frame.dataset.instanceId === instanceId,
  );

const findGameInstanceCard = (instanceId) =>
  Array.from(document.querySelectorAll(".game-instance-card")).find(
    (card) =>
      card.querySelector(".game-frame")?.dataset.instanceId === instanceId,
  );

const requestElementFullscreen = async (element) => {
  const requestFullscreen =
    element?.requestFullscreen ||
    element?.webkitRequestFullscreen ||
    element?.mozRequestFullScreen ||
    element?.msRequestFullscreen;

  if (!requestFullscreen) return false;

  try {
    await requestFullscreen.call(element);
    return true;
  } catch {
    return false;
  }
};

const exitNativeFullscreen = async () => {
  const exitFullscreen =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;

  if (!document.fullscreenElement || !exitFullscreen) return;
  await exitFullscreen.call(document);
};

const enterGameInstanceFullscreen = async (instanceId, options = {}) => {
  const { silent = false, preferNative = true } = options;
  setActiveGameInstance(instanceId);
  clearGameInstanceMinimized(instanceId);
  fullscreenGameInstanceId.value = instanceId;
  await nextTick();

  if (!preferNative) return;

  const fullscreenTarget =
    findGameInstanceFrame(instanceId) || findGameInstanceCard(instanceId);
  const nativeFullscreenStarted =
    await requestElementFullscreen(fullscreenTarget);

  if (!nativeFullscreenStarted && !silent) {
    message.warning("浏览器未允许原生全屏，已切换为页面内铺满显示");
  }
};

const leaveGameInstanceFullscreen = async () => {
  fullscreenGameInstanceId.value = "";
  await exitNativeFullscreen();
};

const toggleGameInstanceFullscreen = (instanceId) => {
  if (isGameInstanceFullscreen(instanceId)) {
    leaveGameInstanceFullscreen();
    return;
  }

  enterGameInstanceFullscreen(instanceId);
};

const syncFullscreenState = () => {
  if (!document.fullscreenElement) {
    fullscreenGameInstanceId.value = "";
  }
};

const syncWebGameFullscreenChrome = () => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle(WEB_GAME_FULLSCREEN_CLASS, Boolean(fullscreenGameInstanceId.value));
};

const getGameInstanceStyle = (instance) => ({
  left: `${instance.x}px`,
  top: `${instance.y}px`,
  width: `${instance.width}px`,
});

const getGameFrameStyle = (instance) => ({
  height: `${getGameFrameHeight(instance.width)}px`,
});

const getCornerResizeWidth = (widthFromRight, widthFromBottom, startWidth) => {
  const deltaFromRight = widthFromRight - startWidth;
  const deltaFromBottom = widthFromBottom - startWidth;
  return Math.abs(deltaFromRight) >= Math.abs(deltaFromBottom)
    ? widthFromRight
    : widthFromBottom;
};

const getResizedGameWindowWidth = (event, resizeState) => {
  const deltaX = event.clientX - resizeState.startClientX;
  const deltaY = event.clientY - resizeState.startClientY;
  const widthFromRight = resizeState.startWidth + deltaX;
  const widthFromBottom =
    resizeState.startWidth +
    (deltaY * GAME_WINDOW_ASPECT_WIDTH) / GAME_WINDOW_ASPECT_HEIGHT;

  if (resizeState.edge === "right") {
    return normalizeGameWindowWidth(widthFromRight);
  }

  if (resizeState.edge === "bottom") {
    return normalizeGameWindowWidth(widthFromBottom);
  }

  return normalizeGameWindowWidth(
    getCornerResizeWidth(widthFromRight, widthFromBottom, resizeState.startWidth),
  );
};

const startDragGameInstance = (event, instance) => {
  if (event.button !== undefined && event.button !== 0) return;
  if (isGameInstanceFullscreen(instance.id)) return;
  setActiveGameInstance(instance.id);
  draggingGameInstance.value = {
    id: instance.id,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startX: instance.x,
    startY: instance.y,
  };
  event.currentTarget?.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", moveDraggingGameInstance);
  window.addEventListener("pointerup", stopDraggingGameInstance, { once: true });
  window.addEventListener("pointercancel", stopDraggingGameInstance, { once: true });
};

const moveDraggingGameInstance = (event) => {
  const dragState = draggingGameInstance.value;
  if (!dragState || event.pointerId !== dragState.pointerId) return;
  const x = Math.max(0, dragState.startX + event.clientX - dragState.startClientX);
  const y = Math.max(0, dragState.startY + event.clientY - dragState.startClientY);
  updateGameInstanceGeometry(dragState.id, { x, y });
};

const stopDraggingGameInstance = () => {
  draggingGameInstance.value = null;
  window.removeEventListener("pointermove", moveDraggingGameInstance);
};

const startResizeGameInstance = (event, instance, edge) => {
  if (event.button !== undefined && event.button !== 0) return;
  if (isGameInstanceFullscreen(instance.id)) return;
  setActiveGameInstance(instance.id);
  resizingGameInstance.value = {
    id: instance.id,
    edge,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    startWidth: instance.width,
  };
  event.currentTarget?.setPointerCapture?.(event.pointerId);
  window.addEventListener("pointermove", moveResizingGameInstance);
  window.addEventListener("pointerup", stopResizingGameInstance, { once: true });
  window.addEventListener("pointercancel", stopResizingGameInstance, { once: true });
};

const moveResizingGameInstance = (event) => {
  const resizeState = resizingGameInstance.value;
  if (!resizeState || event.pointerId !== resizeState.pointerId) return;
  const width = getResizedGameWindowWidth(event, resizeState);
  updateGameInstanceGeometry(resizeState.id, { width });
};

const stopResizingGameInstance = () => {
  resizingGameInstance.value = null;
  window.removeEventListener("pointermove", moveResizingGameInstance);
};

const openGameInstance = async (
  tokenId = selectedTokenIdForGame.value,
  options = {},
) => {
  const { silent = false } = options;
  if (!tokenId) {
    message.warning("请选择要多开的游戏账号");
    return;
  }

  if (gameInstances.value.some((instance) => instance.tokenId === tokenId)) {
    message.warning("该账号已经打开了一个游戏窗口");
    return;
  }

  if (isPreparingLogin.value) return;

  const token = tokenStore.gameTokens.find((item) => item.id === tokenId);
  if (!token) {
    message.error("未找到对应的 Token");
    return;
  }

  isPreparingLogin.value = true;
  try {
    const account = await prepareGameAccount(token);
    const instance = {
      id: createGameInstanceId(token.id),
      tokenId: token.id,
      name: token.name || account.name || "未命名账号",
      server: token.server || account.server || "",
      avatar: token.avatar || "",
      account,
      width: DEFAULT_GAME_WINDOW_WIDTH,
      x: DEFAULT_GAME_WINDOW_X + gameInstances.value.length * 28,
      y: DEFAULT_GAME_WINDOW_Y + gameInstances.value.length * 28,
      frameKey: 0,
    };
    gameInstances.value = [...gameInstances.value, instance];
    activeGameInstanceId.value = instance.id;
    if (isMobileViewport()) {
      await enterGameInstanceFullscreen(instance.id, {
        silent: true,
        preferNative: false,
      });
    }
    if (!silent) {
      message.success(`已新增 ${instance.name} 游戏窗口`);
    }
  } catch (error) {
    message.error(
      `登录准备失败: ${error?.message || error || "unknown error"}`,
    );
  } finally {
    isPreparingLogin.value = false;
  }
};

const closeGameInstance = (instanceId) => {
  const nextInstances = gameInstances.value.filter(
    (instance) => instance.id !== instanceId,
  );
  gameInstances.value = nextInstances;
  clearGameInstanceMinimized(instanceId);
  if (fullscreenGameInstanceId.value === instanceId) {
    fullscreenGameInstanceId.value = "";
    exitNativeFullscreen();
  }
  if (activeGameInstanceId.value === instanceId) {
    activeGameInstanceId.value = nextInstances.at(-1)?.id || "";
  }
};

const refreshGameInstance = (instanceId) => {
  gameInstances.value = gameInstances.value.map((instance) =>
    instance.id === instanceId
      ? { ...instance, frameKey: instance.frameKey + 1 }
      : instance,
  );
  setActiveGameInstance(instanceId);
};

const openJsInjectorModal = () => {
  showJsInjectorModal.value = true;
};

const triggerJsFileSelect = () => {
  jsInjectorFileInput.value?.click();
};

const formatJsContentSize = (size) => {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(2)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
};

const setJsInjectorPendingContent = (content, fileName = "") => {
  const scriptContent = `${content || ""}`;
  const isLargeScript = scriptContent.length > MAX_INLINE_JS_EDITOR_LENGTH;
  jsInjectorPendingContent = scriptContent;
  jsInjectorForm.value = {
    fileName,
    scriptContent: isLargeScript ? "" : scriptContent,
    contentSummary: isLargeScript
      ? `已读取较大脚本 ${formatJsContentSize(scriptContent.length)}，为避免卡顿不在编辑框中显示。`
      : "",
  };
};

const readJsFile = (event) => {
  const file = event?.target?.files?.[0];
  if (!file) return;

  const fileName = file.name || "";
  if (!/\.(js|txt)$/i.test(fileName)) {
    message.warning("仅支持选择 .js 或 .txt 文件");
    event.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    setJsInjectorPendingContent(reader.result || "", fileName);
    event.target.value = "";
  };
  reader.onerror = () => {
    message.error("读取JS文件失败");
    event.target.value = "";
  };
  reader.readAsText(file);
};

const createJsSnippetId = () =>
  `js-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getGameFrames = () => Array.from(document.querySelectorAll(".game-frame"));

const waitForJsInjectionTurn = () =>
  new Promise((resolve) => {
    if (typeof window.requestAnimationFrame === "function") {
      window.requestAnimationFrame(() => resolve());
      return;
    }
    window.setTimeout(resolve, 0);
  });

const hasInjectedSnippet = (iframeDocument, snippetId) =>
  Array.from(
    iframeDocument.querySelectorAll(
      'script[data-injected-by="xyzw-web-helper"]',
    ),
  ).some((script) => script.dataset.injectedId === snippetId);

const injectJsSnippetToGameFrame = (iframe, snippet) => {
  const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDocument) return false;
  if (hasInjectedSnippet(iframeDocument, snippet.id)) return true;

  const script = iframeDocument.createElement("script");
  script.type = "text/javascript";
  script.dataset.injectedBy = "xyzw-web-helper";
  script.dataset.injectedId = snippet.id;
  script.dataset.injectedName = snippet.name;
  script.textContent = snippet.content;
  (iframeDocument.head || iframeDocument.documentElement).appendChild(script);
  return true;
};

const injectStoredJsToGameFrame = (event) => {
  const iframe = event?.target;
  if (!iframe || !storedJsSnippets.value.length) return;

  window.setTimeout(async () => {
    for (const snippet of storedJsSnippets.value) {
      await waitForJsInjectionTurn();
      try {
        injectJsSnippetToGameFrame(iframe, snippet);
      } catch (error) {
        console.warn("inject stored js failed", error);
      }
    }
  }, 0);
};

const injectJsToAllGameFrames = async () => {
  const scriptContent =
    jsInjectorPendingContent || jsInjectorForm.value.scriptContent;
  if (!scriptContent.trim()) {
    message.warning("请先选择JS文件");
    return;
  }

  const snippet = {
    id: createJsSnippetId(),
    name: jsInjectorForm.value.fileName || "inline-js",
    size: scriptContent.length,
    content: scriptContent,
  };
  const frames = getGameFrames();
  isInjectingJs.value = true;
  try {
    storedJsSnippets.value = [...storedJsSnippets.value, snippet];
    saveStoredJsSnippets();
    let injectedCount = 0;
    for (const iframe of frames) {
      await waitForJsInjectionTurn();
      if (injectJsSnippetToGameFrame(iframe, snippet)) {
        injectedCount += 1;
      }
    }
    showJsInjectorModal.value = false;
    if (injectedCount) {
      message.success(
        `已应用到 ${injectedCount} 个窗口，后续新窗口自动生效`,
      );
    } else {
      message.success("JS已保存，打开游戏窗口后自动生效");
    }
  } catch (error) {
    message.error(`注入JS失败: ${error?.message || error || "unknown error"}`);
  } finally {
    isInjectingJs.value = false;
  }
};

const removeInjectedJsSnippetFromFrames = (snippetId) => {
  for (const iframe of getGameFrames()) {
    try {
      const iframeDocument =
        iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDocument) continue;
      Array.from(
        iframeDocument.querySelectorAll(
          'script[data-injected-by="xyzw-web-helper"]',
        ),
      )
        .filter((script) => script.dataset.injectedId === snippetId)
        .forEach((script) => script.remove());
    } catch (error) {
      console.warn("remove injected js failed", error);
    }
  }
};

const removeStoredJsSnippet = (snippetId) => {
  storedJsSnippets.value = storedJsSnippets.value.filter(
    (snippet) => snippet.id !== snippetId,
  );
  saveStoredJsSnippets();
  removeInjectedJsSnippetFromFrames(snippetId);
  message.success("已删除JS，后续窗口不会再自动应用");
};

const confirmDeleteStoredJs = (snippet) => {
  dialog.warning({
    title: "删除JS",
    content: `确认删除 ${snippet.name || "inline-js"}？已执行的脚本副作用可能需要刷新窗口后才会消失。`,
    positiveText: "确认删除",
    negativeText: "取消",
    onPositiveClick: () => removeStoredJsSnippet(snippet.id),
  });
};

watch(
  () => tokenStore.selectedToken?.id,
  (tokenId) => {
    if (!tokenId || tokenId === selectedTokenIdForGame.value) return;
    selectedTokenIdForGame.value = tokenId;
  },
);

watch(fullscreenGameInstanceId, syncWebGameFullscreenChrome, { immediate: true });

onMounted(() => {
  tokenStore.initTokenStore();
  loadStoredJsSnippets();
  if (tokenStore.selectedToken?.id) {
    selectedTokenIdForGame.value = tokenStore.selectedToken.id;
  }
  document.addEventListener("fullscreenchange", syncFullscreenState);
});

onUnmounted(() => {
  document.removeEventListener("fullscreenchange", syncFullscreenState);
  document.documentElement.classList.remove(WEB_GAME_FULLSCREEN_CLASS);
});
</script>

<style scoped>
.web-game-page {
  --web-game-page-bg:
    radial-gradient(circle at 14% 0%, rgba(14, 165, 233, 0.12), transparent 32%),
    radial-gradient(circle at 84% 8%, rgba(20, 184, 166, 0.1), transparent 28%),
    linear-gradient(180deg, #f8fbff 0%, #edf4fb 100%);
  --web-game-dock-bg: rgba(249, 252, 255, 0.82);
  --web-game-dock-border: rgba(139, 157, 178, 0.34);
  --web-game-dock-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 18px 42px rgba(32, 50, 78, 0.13);
  --web-game-count-color: #334155;
  --web-game-card-bg: rgba(255, 255, 255, 0.78);
  --web-game-card-border: rgba(99, 116, 139, 0.2);
  --web-game-card-shadow: 0 18px 40px rgba(32, 50, 78, 0.13);
  --web-game-card-active-shadow:
    0 0 0 1px rgba(14, 165, 233, 0.16),
    0 20px 44px rgba(32, 50, 78, 0.16);
  --web-game-header-bg: rgba(248, 251, 255, 0.86);
  --web-game-header-border: rgba(99, 116, 139, 0.16);
  --web-game-title-color: #132033;
  --web-game-server-color: #0369a1;
  --web-game-server-bg: rgba(14, 165, 233, 0.12);
  --web-game-toolbar-bg: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.98) 0%,
    rgba(246, 250, 255, 0.96) 100%
  );
  --web-game-toolbar-border: rgba(226, 232, 240, 0.92);
  --web-game-toolbar-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    inset 0 -1px 0 rgba(203, 213, 225, 0.28),
    0 4px 12px rgba(15, 23, 42, 0.12);
  --web-game-toolbar-color: #020817;
  --web-game-toolbar-hover-color: #020617;
  --web-game-toolbar-hover-bg: rgba(226, 232, 240, 0.62);
  --web-game-toolbar-divider: rgba(148, 163, 184, 0.42);
  --web-game-empty-color: rgba(71, 85, 105, 0.82);
  --web-game-mobile-tabs-bg: rgba(248, 251, 255, 0.9);
  --web-game-mobile-tab-bg: rgba(255, 255, 255, 0.7);
  --web-game-mobile-tab-color: #475569;
  --web-game-frame-bg: #05070a;
  --web-game-dock-gap: 20px;
  position: relative;
  height: calc(100dvh - 64px);
  min-height: 560px;
  background: var(--web-game-page-bg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:global([data-theme="dark"] .web-game-page) {
  --web-game-page-bg: #05070a;
  --web-game-dock-bg: rgba(15, 23, 42, 0.84);
  --web-game-dock-border: rgba(148, 163, 184, 0.28);
  --web-game-dock-shadow: 0 14px 30px rgba(0, 0, 0, 0.32);
  --web-game-count-color: #cbd5e1;
  --web-game-card-bg: #020617;
  --web-game-card-border: rgba(148, 163, 184, 0.22);
  --web-game-card-shadow: 0 18px 36px rgba(0, 0, 0, 0.32);
  --web-game-card-active-shadow:
    0 0 0 1px rgba(56, 189, 248, 0.2),
    0 20px 44px rgba(0, 0, 0, 0.4);
  --web-game-header-bg: rgba(15, 23, 42, 0.94);
  --web-game-header-border: rgba(148, 163, 184, 0.18);
  --web-game-title-color: #f8fafc;
  --web-game-server-color: #bae6fd;
  --web-game-server-bg: rgba(14, 165, 233, 0.16);
  --web-game-toolbar-bg: linear-gradient(
    180deg,
    rgba(30, 41, 59, 0.94) 0%,
    rgba(15, 23, 42, 0.92) 100%
  );
  --web-game-toolbar-border: rgba(148, 163, 184, 0.24);
  --web-game-toolbar-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    inset 0 -1px 0 rgba(2, 6, 23, 0.42),
    0 4px 12px rgba(0, 0, 0, 0.32);
  --web-game-toolbar-color: #e5edf7;
  --web-game-toolbar-hover-color: #ffffff;
  --web-game-toolbar-hover-bg: rgba(148, 163, 184, 0.14);
  --web-game-toolbar-divider: rgba(203, 213, 225, 0.2);
  --web-game-empty-color: rgba(226, 232, 240, 0.72);
  --web-game-mobile-tabs-bg: #05070a;
  --web-game-mobile-tab-bg: rgba(15, 23, 42, 0.88);
  --web-game-mobile-tab-color: #cbd5e1;
}

.web-game-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  display: flex;
  padding: 0;
  overflow: hidden;
}

.web-game-content {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.multi-open-dock {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  width: min(458px, calc(100% - 48px));
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 20px 20px 28px;
  border: 1px solid var(--web-game-dock-border);
  border-radius: 18px;
  background: var(--web-game-dock-bg);
  box-shadow: var(--web-game-dock-shadow);
  backdrop-filter: blur(22px) saturate(155%);
  -webkit-backdrop-filter: blur(22px) saturate(155%);
  overflow: hidden;
  transform: scale(0.84);
  transform-origin: top left;
}

.multi-open-dock-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.multi-open-dock-title {
  min-width: 0;
  display: grid;
  gap: 3px;
  color: var(--web-game-title-color);
  line-height: 1.2;
}

.multi-open-dock-title strong {
  font-size: 17px;
  font-weight: 900;
}

.multi-open-dock-title span {
  color: var(--web-game-count-color);
  font-size: 13px;
  font-weight: 800;
}

.multi-open-dock-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
}

.multi-open-dock-close {
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--web-game-count-color) 35%, transparent);
  border-radius: 50%;
  color: var(--web-game-title-color);
  background:
    radial-gradient(circle at 38% 26%, rgba(255, 255, 255, 0.86), transparent 36%),
    color-mix(in srgb, var(--web-game-title-color) 4%, transparent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.78),
    0 2px 5px rgba(15, 23, 42, 0.08);
  display: grid;
  place-items: center;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.multi-open-dock-close:hover {
  background: color-mix(in srgb, var(--web-game-title-color) 10%, transparent);
}

.multi-open-dock-close:active {
  transform: translateY(1px);
}

.multi-open-dock-close-icon {
  position: relative;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: block;
}

.multi-open-dock-close-icon::before,
.multi-open-dock-close-icon::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.multi-open-dock-close-icon::before {
  inset: 0;
  border: 2px solid currentColor;
}

.multi-open-dock-close-icon::after {
  top: 50%;
  left: 50%;
  width: 8px;
  height: 8px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.multi-open-dock-body {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.floating-dock-reopen {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--web-game-dock-border);
  border-radius: 999px;
  color: var(--web-game-title-color);
  background: var(--web-game-dock-bg);
  box-shadow: var(--web-game-dock-shadow);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
  font: inherit;
  font-size: 13px;
  font-weight: 900;
  cursor: pointer;
}

.floating-dock-reopen:active {
  transform: translateY(1px);
}

.multi-open-count {
  color: var(--web-game-count-color);
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
}

.multi-open-account-select {
  width: 100%;
}

.multi-open-account-select :deep(.n-base-selection) {
  --n-height: 48px;
  --n-border-radius: 15px;
  --n-border: 1px solid rgba(139, 157, 178, 0.26);
  --n-border-hover: 1px solid rgba(14, 165, 233, 0.36);
  --n-border-focus: 1px solid rgba(14, 165, 233, 0.5);
  --n-box-shadow-focus: 0 0 0 2px rgba(14, 165, 233, 0.1);
  background: rgba(248, 251, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  font-size: 15px;
  font-weight: 700;
}

.multi-open-dock-primary-action {
  min-width: 102px;
  height: 39px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.3),
    0 10px 20px rgba(14, 165, 233, 0.22);
}

.multi-open-dock-link-actions {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 26px;
  margin-top: -2px;
}

.multi-open-dock-link-button {
  min-width: 58px;
  font-size: 15px;
  font-weight: 700;
}

.multi-open-dock-divider {
  width: 1px;
  height: 24px;
  background: rgba(148, 163, 184, 0.34);
}

.mobile-instance-tabs {
  display: none;
}

.game-instance-grid {
  flex: 1 1 auto;
  min-height: 0;
  padding: 0;
  overflow: auto;
}

.game-instance-canvas {
  position: relative;
  min-width: 100%;
  min-height: 100%;
}

.game-instance-card {
  position: absolute;
  min-width: 200px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--web-game-card-border);
  border-radius: 14px;
  background: var(--web-game-card-bg);
  box-shadow: var(--web-game-card-shadow);
}

.game-instance-card.active {
  border-color: rgba(56, 189, 248, 0.62);
  box-shadow: var(--web-game-card-active-shadow);
}

.game-instance-header {
  min-height: 42px;
  padding: 7px 9px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: var(--web-game-header-bg);
  border-bottom: 1px solid var(--web-game-header-border);
  cursor: move;
  user-select: none;
  touch-action: none;
}

.game-instance-title {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--web-game-title-color);
  font-weight: 800;
}

.game-instance-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  flex: 0 0 auto;
}

.game-instance-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.game-instance-server {
  flex: 0 0 auto;
  padding: 2px 7px;
  border-radius: 999px;
  color: var(--web-game-server-color);
  background: var(--web-game-server-bg);
  font-size: 12px;
  font-weight: 700;
}

.game-instance-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.game-instance-actions-toolbar {
  height: 32px;
  padding: 2px 4px;
  border: 1px solid var(--web-game-toolbar-border);
  border-radius: 999px;
  background: var(--web-game-toolbar-bg);
  box-shadow: var(--web-game-toolbar-shadow);
  backdrop-filter: blur(10px) saturate(125%);
  -webkit-backdrop-filter: blur(10px) saturate(125%);
  display: flex;
  align-items: center;
  gap: 0;
}

.game-window-tool-button {
  position: relative;
  width: 27px;
  height: 26px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  color: var(--web-game-toolbar-color);
  background: transparent;
  display: grid;
  place-items: center;
  font-weight: 900;
  cursor: pointer;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.game-window-tool-button + .game-window-tool-button::before {
  content: "";
  position: absolute;
  top: 6px;
  bottom: 6px;
  left: -1px;
  width: 1px;
  background: var(--web-game-toolbar-divider);
  box-shadow: 1px 0 0 rgba(255, 255, 255, 0.82);
}

.game-window-tool-button:hover,
.game-window-tool-button.active {
  color: var(--web-game-toolbar-hover-color);
  background: var(--web-game-toolbar-hover-bg);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.64);
}

.game-window-tool-button:active {
  transform: translateY(1px);
}

.game-instance-minimize-icon {
  width: 16px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.game-instance-fullscreen-icon {
  position: relative;
  width: 15px;
  height: 15px;
  display: block;
}

.game-instance-fullscreen-icon::before,
.game-instance-fullscreen-icon::after {
  content: "";
  position: absolute;
  width: 7px;
  height: 7px;
}

.game-instance-fullscreen-icon::before {
  top: 1px;
  right: 1px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  border-radius: 2px 2px 0 0;
}

.game-instance-fullscreen-icon::after {
  left: 1px;
  bottom: 1px;
  border-bottom: 2px solid currentColor;
  border-left: 2px solid currentColor;
  border-radius: 0 0 2px 2px;
}

.game-instance-refresh-button .n-icon {
  font-size: 18px;
  filter: drop-shadow(0 0 0 currentColor);
  transform: scale(1.08);
}

.game-instance-refresh-button .n-icon :deep(svg) {
  stroke-width: 48px;
}

.game-instance-close-icon {
  position: relative;
  width: 19px;
  height: 19px;
  border-radius: 50%;
}

.game-instance-close-icon::before,
.game-instance-close-icon::after {
  content: "";
  position: absolute;
  border-radius: 50%;
}

.game-instance-close-icon::before {
  inset: 2px;
  border: 2px solid currentColor;
}

.game-instance-close-icon::after {
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: currentColor;
  transform: translate(-50%, -50%);
}

.game-instance-card.minimized {
  height: 42px !important;
}

.game-instance-card.minimized .game-frame,
.game-instance-card.minimized .game-instance-resize-handle {
  display: none;
}

.game-instance-card.fullscreen {
  position: fixed;
  position: fixed !important;
  inset: 0 !important;
  z-index: 1000;
  width: 100dvw !important;
  height: 100dvh !important;
  min-width: 0;
  max-width: none !important;
  border-radius: 0;
  border: 0;
  background: #000;
}

.game-instance-card.fullscreen .game-instance-header {
  position: absolute;
  top: 0;
  right: 0;
  left: 0;
  z-index: 5;
  background: color-mix(in srgb, var(--web-game-header-bg) 78%, transparent);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
}

.game-instance-card.fullscreen .game-frame {
  width: 100%;
  height: 100% !important;
  flex: 1 1 auto;
}

.game-instance-card.fullscreen .game-instance-resize-handle {
  display: none;
}

.game-frame {
  width: 100%;
  flex: 0 0 auto;
  min-height: 0;
  align-self: center;
  display: block;
  border: 0;
  background: var(--web-game-frame-bg);
}

.game-instance-resize-handle {
  position: absolute;
  z-index: 4;
  padding: 0;
  border: 0;
  background: transparent;
  opacity: 0;
  touch-action: none;
}

.resize-right {
  top: 42px;
  right: 0;
  bottom: 10px;
  width: 10px;
  cursor: ew-resize;
}

.resize-bottom {
  right: 10px;
  bottom: 0;
  left: 0;
  height: 10px;
  cursor: ns-resize;
}

.resize-corner {
  right: 0;
  bottom: 0;
  width: 18px;
  height: 18px;
  cursor: nwse-resize;
}

.web-game-empty {
  flex: 1 1 auto;
  display: grid;
  place-items: center;
  color: var(--web-game-empty-color);
  font-weight: 700;
  text-align: center;
}

.js-injector-content {
  display: grid;
  gap: 14px;
}

.js-injector-file-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  color: var(--text-secondary);
  font-size: 13px;
}

.js-injector-file-input {
  display: none;
}

.js-injector-file-name {
  min-width: 0;
  flex: 1;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.js-injector-summary {
  margin: -4px 0 0;
  color: var(--text-tertiary);
  font-size: 12px;
  line-height: 1.5;
}

.stored-js-list {
  display: grid;
  gap: 10px;
}

.stored-js-items {
  display: grid;
  gap: 10px;
  max-height: min(52vh, 420px);
  overflow: auto;
  padding-right: 2px;
}

.stored-js-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 46px;
  padding: 10px 12px;
  border: 1px solid var(--app-glass-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.stored-js-info {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.stored-js-info strong {
  min-width: 0;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stored-js-info span {
  color: var(--text-tertiary);
  font-size: 12px;
}

.stored-js-empty {
  min-height: 120px;
  display: grid;
  place-items: center;
  color: var(--text-tertiary);
  font-weight: 700;
}

.js-injector-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:global(.js-injector-modal.n-card),
:global(.js-manager-modal.n-card) {
  background: var(--app-surface-strong);
  border: 1px solid var(--app-glass-border);
  box-shadow: var(--shadow-heavy);
  backdrop-filter: blur(18px) saturate(160%);
}

@media (max-width: 768px) {
  .web-game-page {
    height: calc(100dvh - 56px);
    min-height: 480px;
  }

  .web-game-stage {
    padding: 0;
  }

  .multi-open-dock {
    top: 12px;
    right: auto;
    left: 12px;
    width: min(360px, calc(100% - 24px));
    box-sizing: border-box;
    padding: 18px 16px 22px;
    max-width: none;
    align-items: center;
  }

  .multi-open-dock-body {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: center;
    gap: 20px;
  }

  .floating-dock-reopen {
    top: 12px;
    left: 12px;
  }

  .multi-open-account-select {
    width: 100%;
  }

  .js-injector-file-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .mobile-instance-tabs {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 8px 112px 8px 12px;
    background: var(--web-game-mobile-tabs-bg);
    border-bottom: 1px solid var(--web-game-header-border);
  }

  .mobile-instance-tab {
    flex: 0 0 auto;
    max-width: 160px;
    padding: 7px 12px;
    border: 1px solid var(--web-game-card-border);
    border-radius: 999px;
    color: var(--web-game-mobile-tab-color);
    background: var(--web-game-mobile-tab-bg);
    font: inherit;
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-instance-tab.active {
    color: #020617;
    background: #38bdf8;
    border-color: #38bdf8;
  }

  .game-instance-grid {
    display: block;
    padding: 0;
    overflow: hidden;
  }

  .game-instance-canvas {
    min-height: 100%;
  }

  .game-instance-card {
    display: none;
    position: relative;
    left: auto !important;
    top: auto !important;
    width: 100% !important;
    height: 100%;
    border-radius: 0;
    border-right: 0;
    border-left: 0;
  }

  .game-instance-card.active {
    display: flex;
  }

  .game-instance-card.fullscreen .game-instance-header {
    display: none;
  }

  .game-frame {
    width: 100%;
    height: auto !important;
    flex: 1 1 auto;
  }

  .game-instance-card.fullscreen .game-instance-header {
    display: none;
  }

  .game-instance-card.fullscreen .game-frame {
    height: 100% !important;
  }

  .game-instance-resize-handle {
    display: none;
  }
}

@media (min-width: 769px) {
  .game-frame {
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>
