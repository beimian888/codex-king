<template>
  <div class="web-game-page">
    <div class="game-toolbar">
      <div class="toolbar-actions">
        <n-button
          v-if="!tokenOptions.length"
          secondary
          type="primary"
          @click="goToTokens"
        >
          去导入 Token
        </n-button>
        <n-tooltip v-else trigger="hover">
          <template #trigger>
            <n-button circle tertiary @click="refreshGame">
              <template #icon>
                <n-icon>
                  <Refresh />
                </n-icon>
              </template>
            </n-button>
          </template>
          刷新游戏
        </n-tooltip>
      </div>
    </div>

    <iframe
      :key="frameKey"
      class="game-frame"
      :src="gameEntryUrl"
      title="北冕之王"
      allow="autoplay; fullscreen; clipboard-read; clipboard-write"
      allowfullscreen
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useMessage } from "naive-ui";
import { Refresh } from "@vicons/ionicons5";
import { useRouter } from "vue-router";
import { useTokenStore } from "@/stores/tokenStore";

const tokenStore = useTokenStore();
const router = useRouter();
const message = useMessage();
const frameKey = ref(0);
const selectedTokenIdForGame = ref(tokenStore.selectedToken?.id || "");
const activeGameTokenId = ref("");
const isPreparingLogin = ref(false);
const preparedGameAccounts = ref({});
const DEFAULT_WEB_GAME_MANIFEST_VERSION = "0.32.0";
const DEFAULT_GAME_LOGIN_VERSION = "1.89.8-wx";

const tokenOptions = computed(() =>
  tokenStore.gameTokens.map((token) => ({
    label: token.server ? `${token.name} - ${token.server}` : token.name,
    value: token.id,
  })),
);

const activeGameToken = computed(() =>
  tokenStore.gameTokens.find((token) => token.id === activeGameTokenId.value),
);

const safeJsonParse = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
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

const activeGameAccount = computed(() => {
  const tokenId = activeGameTokenId.value;
  if (!tokenId) return null;
  return (
    preparedGameAccounts.value[tokenId] ||
    (activeGameToken.value ? buildWebGameAccount(activeGameToken.value) : null)
  );
});

const gameEntryUrl = computed(() => {
  if (!activeGameAccount.value?.token) {
    return "about:blank";
  }

  const params = new URLSearchParams();
  params.set("platformReplyType", "WebMiniGame");
  params.set("e", "x");
  params.set("lang", "chinese");
  params.set("source", "xyzw-web-helper");

  if (activeGameAccount.value?.token) {
    params.set("token", activeGameAccount.value.token);
    params.set("roleToken", activeGameAccount.value.token);
  }
  if (activeGameAccount.value?.loginVersion) {
    params.set("version", activeGameAccount.value.loginVersion);
    params.set("gameVersion", activeGameAccount.value.loginVersion);
  }
  if (activeGameAccount.value?.manifestVersion) {
    params.set("manifestVersion", activeGameAccount.value.manifestVersion);
  }
  if (activeGameAccount.value?.userId) {
    params.set("userId", activeGameAccount.value.userId);
    params.set("uid", activeGameAccount.value.userId);
    params.set("id", activeGameAccount.value.userId);
  }
  if (activeGameAccount.value?.authData) {
    for (const key of authQueryKeys) {
      const value = activeGameAccount.value.authData[key];
      if (value !== undefined && value !== null && `${value}`.trim() !== "") {
        params.set(key, `${value}`);
      }
    }
  }
  if (activeGameAccount.value?.openId) {
    params.set("openId", activeGameAccount.value.openId);
  }
  if (activeGameAccount.value?.authData) {
    params.set("authUser", encodeJsonParam(activeGameAccount.value.authData));
  }
  if (activeGameAccount.value?.name) {
    params.set("name", activeGameAccount.value.name);
  }
  if (activeGameAccount.value?.server) {
    params.set("server", activeGameAccount.value.server);
  }

  return `/web-game/asar/index.html?${params.toString()}`;
});

watch(
  () => tokenStore.selectedToken?.id,
  (tokenId) => {
    if (tokenId && tokenId !== selectedTokenIdForGame.value) {
      selectedTokenIdForGame.value = tokenId;
      void loginSelectedToken(true);
    }
  },
);

const loginSelectedToken = async (silent = false) => {
  if (!selectedTokenIdForGame.value) {
    message.warning("请选择要登录的游戏账号");
    return;
  }

  if (isPreparingLogin.value) return;

  const token = tokenStore.gameTokens.find(
    (item) => item.id === selectedTokenIdForGame.value,
  );
  if (!token) {
    message.error("未找到对应的 Token");
    return;
  }

  isPreparingLogin.value = true;
  try {
    const account = await tokenStore.prepareWebGameLogin(token.id);
    preparedGameAccounts.value = {
      ...preparedGameAccounts.value,
      [token.id]: account,
    };
    activeGameTokenId.value = token.id;
    frameKey.value += 1;
    if (!silent) {
      message.success(`正在进入 ${token.name}`);
    }
  } catch (error) {
    message.error(
      `登录准备失败: ${error?.message || error || "unknown error"}`,
    );
  } finally {
    isPreparingLogin.value = false;
  }
};

const refreshGame = () => {
  frameKey.value += 1;
};

const goToTokens = () => {
  router.push("/admin/account-management");
};

onMounted(() => {
  tokenStore.initTokenStore();
  const fallbackTokenId =
    tokenStore.selectedToken?.id || tokenStore.gameTokens[0]?.id || "";
  if (fallbackTokenId) {
    selectedTokenIdForGame.value = fallbackTokenId;
    void loginSelectedToken(true);
  }
});
</script>

<style scoped>
.web-game-page {
  height: calc(100dvh - 64px);
  min-height: 560px;
  background: #05070a;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.game-toolbar {
  width: 100%;
  box-sizing: border-box;
  min-height: 48px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  background: #0c1118;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.game-frame {
  width: min(100%, 430px);
  flex: 1 1 auto;
  min-height: 0;
  align-self: center;
  display: block;
  border: 0;
  background: #000;
}

@media (max-width: 768px) {
  .web-game-page {
    height: calc(100dvh - 56px);
    min-height: 480px;
  }

  .game-toolbar {
    min-height: 48px;
  }

  .toolbar-actions {
    justify-content: flex-end;
  }

  .game-frame {
    width: 100%;
  }
}

@media (min-width: 769px) {
  .game-frame {
    border-left: 1px solid rgba(255, 255, 255, 0.08);
    border-right: 1px solid rgba(255, 255, 255, 0.08);
  }
}
</style>
