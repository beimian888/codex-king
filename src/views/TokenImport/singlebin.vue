<template>
  <n-form class="single-bin-import-form" :label-placement="'top'" :size="'large'" :show-label="true">
    <n-form-item :label="'bin文件'" :show-label="true">
      <a-upload
        class="single-bin-upload"
        accept="*.bin,*.dmp"
        @before-upload="uploadBin"
        draggable
        dropzone
        placeholder="点击或拖拽bin文件到此处上传"
        clearable>
      </a-upload>
    </n-form-item>

    <div class="form-actions">
      <n-button v-if="tokenStore.hasTokens" size="large" block @click="cancel">
        取消
      </n-button>
    </div>
  </n-form>
</template>

<script lang="ts" setup>
import { useTokenStore } from "@/stores/tokenStore";

import {
  NForm,
  NFormItem,
  NButton,
  useMessage,
} from "naive-ui";

import PQueue from "p-queue";
import useIndexedDB from "@/hooks/useIndexedDB";
import { getTokenId, transformToken } from "@/utils/token";

const $emit = defineEmits(["cancel", "ok"]);

const { storeArrayBuffer } = useIndexedDB();

const cancel = () => {
  $emit("cancel");
};

const tokenStore = useTokenStore();
const message = useMessage();

const tQueue = new PQueue({ concurrency: 1, interval: 1000 });

const initName = (fileName: string) => {
  if (!fileName) return;
  fileName = fileName.trim();
  let binRes = fileName.match(/^bin-(.*?)服-([0-2])-([0-9]{6,12})-(.*)\.bin$/);
  console.log(binRes);
  if (binRes) {
    return {
      server: binRes[1],
      roleIndex: binRes[2],
      roleId: binRes[3],
      roleName: binRes[4],
    };
  }
  return {
    server: "",
    roleIndex: "",
    roleId: "",
    roleName: "",
  };
};

const readFileAsArrayBuffer = (file: File) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as ArrayBuffer);
    reader.onerror = () => reject(new Error("读取文件失败，请重试"));
    reader.readAsArrayBuffer(file);
  });

const addSingleBinToken = async (role: {
  id: string;
  name: string;
  token: string;
  server: string;
  wsUrl: string;
  importMethod: string;
}) => {
  const gameToken = tokenStore.gameTokens.find((t) => t.id === role.id);
  let tokenId = role.id;
  if (gameToken) {
    tokenStore.updateToken(gameToken.id, {
      ...role,
    });
    tokenId = gameToken.id;
  } else {
    const token = tokenStore.addToken({
      ...role,
    });
    tokenId = token.id;
  }
  void tokenStore.fetchTokenAvatar(tokenId);
};

const uploadBin = (binFile: File) => {
  tQueue.add(async () => {
    try {
      const roleMeta = initName(binFile.name) as any;
      const userToken = await readFileAsArrayBuffer(binFile);
      const tokenId = getTokenId(userToken);
      const roleToken = await transformToken(userToken);
      const roleName = roleMeta.roleName || binFile.name.split(".")?.[0] || "";
      const saved = await storeArrayBuffer(tokenId, userToken);
      if (!saved) {
        message.error("保存BIN数据到IndexedDB失败");
        return;
      }

      await addSingleBinToken({
        id: tokenId,
        token: roleToken,
        name: roleName,
        server: roleMeta.server + "" + roleMeta.roleIndex || "",
        wsUrl: "",
        importMethod: "bin",
      });

      message.success("账号添加成功");
      $emit("ok");
    } catch (error: any) {
      message.error(error?.message || "读取文件失败，请重试");
    }
  });
  return false; // 阻止自动上传
};
</script>

<style scoped lang="scss">
.single-bin-import-form {
  color: var(--account-ink, #172033);
}

.single-bin-import-form :deep(.n-form-item-label),
.single-bin-import-form :deep(.n-form-item-label__text) {
  color: var(--account-ink, #172033);
  font-size: 14px;
  font-weight: 800;
}

.single-bin-upload {
  width: 100%;
}

.single-bin-upload :deep(.arco-upload) {
  width: 100%;
}

.single-bin-upload :deep(.arco-upload-drag) {
  min-height: 190px;
  padding: 42px 22px;
  border: 1px dashed rgba(14, 165, 233, 0.34);
  border-radius: 22px;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.62), rgba(241, 247, 253, 0.44)),
    rgba(255, 255, 255, 0.38);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.82),
    0 16px 34px rgba(42, 54, 86, 0.08);
  color: var(--account-ink, #172033);
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease,
    background 180ms ease;
}

.single-bin-upload :deep(.arco-upload-drag:hover),
.single-bin-upload :deep(.arco-upload-drag-active) {
  border-color: rgba(14, 165, 233, 0.68);
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.76), rgba(236, 248, 255, 0.58)),
    rgba(255, 255, 255, 0.48);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 18px 38px rgba(14, 165, 233, 0.16);
  transform: translateY(-1px);
}

.single-bin-upload :deep(.arco-icon-plus) {
  color: #0ea5e9;
  font-size: 24px;
  filter: drop-shadow(0 8px 18px rgba(14, 165, 233, 0.22));
}

.single-bin-upload :deep(.arco-upload-drag-text) {
  color: var(--account-ink, #172033);
  font-size: 15px;
  font-weight: 700;
}

.single-bin-upload :deep(.arco-upload-tip) {
  color: var(--account-muted, #667085);
  font-size: 13px;
}

.form-actions {
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-actions :deep(.n-button) {
  min-height: 44px;
  border-radius: 999px;
  font-weight: 800;
  background: rgba(255, 255, 255, 0.58);
  border-color: rgba(129, 141, 170, 0.24);
  color: var(--account-ink, #172033);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

:global([data-theme="dark"] .single-bin-import-form) {
  color: var(--account-ink, #f8fafc);
}

:global([data-theme="dark"] .single-bin-import-form .n-form-item-label),
:global([data-theme="dark"] .single-bin-import-form .n-form-item-label__text) {
  color: var(--account-ink, #f8fafc) !important;
}

:global([data-theme="dark"] .single-bin-upload .arco-upload-drag) {
  border-color: rgba(56, 189, 248, 0.28);
  background:
    linear-gradient(145deg, rgba(30, 41, 59, 0.84), rgba(15, 23, 42, 0.92)),
    rgba(15, 23, 42, 0.86);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    0 18px 38px rgba(0, 0, 0, 0.3);
  color: var(--account-ink, #f8fafc);
}

:global([data-theme="dark"] .single-bin-upload .arco-upload-drag:hover),
:global([data-theme="dark"] .single-bin-upload .arco-upload-drag-active) {
  border-color: rgba(56, 189, 248, 0.58);
  background:
    linear-gradient(145deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96)),
    rgba(15, 23, 42, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 20px 42px rgba(14, 165, 233, 0.12);
}

:global([data-theme="dark"] .single-bin-upload .arco-upload-drag-text) {
  color: var(--account-ink, #f8fafc);
}

:global([data-theme="dark"] .single-bin-upload .arco-upload-tip) {
  color: var(--account-muted, #b6c2d2);
}

:global([data-theme="dark"] .single-bin-import-form .form-actions .n-button) {
  background: rgba(30, 41, 59, 0.88);
  border-color: rgba(148, 163, 184, 0.26);
  color: var(--account-ink, #f8fafc);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
</style>
