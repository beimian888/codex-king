<template>
  <div class="system-management-page">
    <header class="system-hero">
      <div>
        <span class="system-kicker">ADMIN</span>
        <h1>系统管理</h1>
        <p>用于管理卡密、用户和运行数据。</p>
      </div>
    </header>

    <main class="system-workspace">
      <aside class="system-sidebar" aria-label="系统管理二级菜单">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="system-side-item"
          :class="{ active: activeSection === item.key }"
          type="button"
          @click="activeSection = item.key"
        >
          <n-icon>
            <component :is="item.icon" />
          </n-icon>
          <span>{{ item.label }}</span>
        </button>
      </aside>

      <section class="system-content">
        <div v-if="activeSection === 'cards'" class="card-management-panel">
          <div class="panel-header">
            <div>
              <h2>卡密管理</h2>
              <p>生成注册卡密，用户持卡密注册后自动激活</p>
            </div>
            <div class="panel-actions">
              <n-button secondary type="primary" @click="refreshCards">
                <template #icon>
                  <n-icon>
                    <RefreshOutline />
                  </n-icon>
                </template>
                刷新
              </n-button>
              <span class="permission-note">
                <n-icon>
                  <ShieldCheckmarkOutline />
                </n-icon>
                仅管理员可操作
              </span>
            </div>
          </div>

          <div class="summary-grid" aria-label="卡密统计">
            <button
              v-for="item in summaryCards"
              :key="item.key"
              class="summary-item"
              type="button"
              @click="openUnusedCardsModal(item.key)"
            >
              <span class="summary-label">{{ item.label }}</span>
              <strong>{{ item.unused }}</strong>
              <span>未使用 / {{ item.used }} 已使用</span>
            </button>
          </div>

          <form
            class="license-card-form"
            @submit.prevent="isEditingLicenseCard ? handleUpdateLicenseCard() : handleCreateLicenseCard()"
          >
            <label class="admin-field">
              <span>档位</span>
              <n-select
                v-model:value="licenseCardForm.level"
                :options="licenseLevelOptions"
              />
            </label>
            <label class="admin-field">
              <span>备注</span>
              <n-input
                v-model:value="licenseCardForm.remark"
                placeholder="可选"
                clearable
              />
            </label>
            <div class="license-card-form-actions">
              <n-button type="primary" attr-type="submit">
                {{ isEditingLicenseCard ? "保存修改" : "新增卡密" }}
              </n-button>
              <n-button
                v-if="isEditingLicenseCard"
                secondary
                type="tertiary"
                @click="resetLicenseCardForm"
              >
                取消
              </n-button>
            </div>
          </form>

          <div class="sort-bar" aria-label="卡密排序">
            <span>排序</span>
            <button
              v-for="option in sortOptions"
              :key="option.key"
              class="sort-button"
              :class="{ active: sortKey === option.key }"
              type="button"
              @click="sortKey = option.key"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="system-table-scroll">
            <table class="license-table">
              <thead>
                <tr>
                  <th>卡密</th>
                  <th v-if="isSuperAdmin">生成人</th>
                  <th>档位</th>
                  <th>到期时间</th>
                  <th>状态</th>
                  <th>使用者</th>
                  <th>使用时间</th>
                  <th>生成时间</th>
                  <th>备注</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="card in sortedLicenseCards" :key="card.cardKey">
                  <td class="card-key-cell">{{ card.cardKey }}</td>
                  <td v-if="isSuperAdmin">{{ card.createdBy || "系统" }}</td>
                  <td>{{ card.level }}</td>
                  <td>{{ card.expiresAt || "激活后计算" }}</td>
                  <td>
                    <span class="status-badge" :class="card.status">
                      {{ card.statusText }}
                    </span>
                  </td>
                  <td>{{ card.user || "未使用" }}</td>
                  <td>{{ card.usedAt || "-" }}</td>
                  <td>{{ card.createdAt }}</td>
                  <td class="remark-cell">{{ card.remark }}</td>
                  <td class="card-action-cell">
                    <n-button size="small" secondary @click="copyCardKey(card)">
                      <template #icon>
                        <n-icon>
                          <CopyOutline />
                        </n-icon>
                      </template>
                      复制
                    </n-button>
                    <n-button
                      v-if="canManageLicenseCards"
                      size="small"
                      secondary
                      type="primary"
                      @click="handleStartEditLicenseCard(card)"
                    >
                      编辑
                    </n-button>
                    <n-button
                      v-if="canManageLicenseCards"
                      size="small"
                      secondary
                      type="error"
                      :disabled="card.status === 'used'"
                      @click="handleDeleteLicenseCard(card)"
                    >
                      删除
                    </n-button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <n-modal
            v-model:show="unusedCardsModalVisible"
            preset="card"
            :title="`${selectedUnusedCardsLevel}未使用卡密`"
            class="unused-cards-modal"
            :bordered="false"
          >
            <div v-if="selectedUnusedCards.length" class="unused-cards-table-wrap">
              <table class="unused-cards-table">
                <thead>
                  <tr>
                    <th>未使用卡密</th>
                    <th>生成时间</th>
                    <th>备注</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="card in selectedUnusedCards" :key="card.cardKey">
                    <td class="card-key-cell">{{ card.cardKey }}</td>
                    <td>{{ card.createdAt }}</td>
                    <td class="remark-cell">{{ card.remark || "-" }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="table-empty-state">
              暂无未使用卡密
            </div>
          </n-modal>
        </div>

        <div v-else-if="activeSection === 'users'" class="user-management-panel">
          <div class="panel-header">
            <div>
              <h2>用户管理</h2>
              <p>展示通过首页注册并完成卡密激活的系统用户</p>
            </div>
            <div class="panel-actions">
              <n-button secondary type="primary" @click="refreshCards">
                <template #icon>
                  <n-icon>
                    <RefreshOutline />
                  </n-icon>
                </template>
                刷新
              </n-button>
            </div>
          </div>

          <div class="system-table-scroll user-table-scroll">
            <table class="license-table user-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>激活卡密</th>
                  <th>档位</th>
                  <th>到期时间</th>
                  <th>注册时间</th>
                  <th>最后登录</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody v-if="users.length">
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.username }}</td>
                  <td class="card-key-cell">{{ user.cardKey }}</td>
                  <td>{{ user.level }}</td>
                  <td>{{ user.expiresAt }}</td>
                  <td>{{ user.createdAt }}</td>
                  <td>{{ user.lastLoginAt || "-" }}</td>
                  <td>
                    <span class="status-badge active">
                      {{ user.statusText }}
                    </span>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="7">
                    <div class="table-empty-state">暂无注册用户</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else-if='activeSection === "admins"' class="admin-management-panel">
          <div class="panel-header">
            <div>
              <h2>管理员管理</h2>
              <p>新增和删除可进入系统管理模块的普通管理员账号</p>
            </div>
            <div class="panel-actions">
              <span class="permission-note">
                <n-icon>
                  <ShieldCheckmarkOutline />
                </n-icon>
                仅超级管理员可操作
              </span>
            </div>
          </div>

          <form class="admin-create-form" @submit.prevent="handleCreateAdmin">
            <label class="admin-field">
              <span>用户名</span>
              <n-input
                v-model:value="adminForm.username"
                placeholder="请输入管理员用户名"
                clearable
              />
            </label>
            <label class="admin-field">
              <span>密码</span>
              <n-input
                v-model:value="adminForm.password"
                type="password"
                placeholder="请输入管理员密码"
                show-password-on="click"
                clearable
              />
            </label>
            <label class="admin-field">
              <span>确认密码</span>
              <n-input
                v-model:value="adminForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                show-password-on="click"
                clearable
              />
            </label>
            <label
              v-for="option in quotaLevelOptions"
              :key="option.value"
              class="admin-field"
            >
              <span>{{ option.quotaLabel }}</span>
              <n-input-number
                v-model:value="adminForm.cardCreateQuota[option.value]"
                :min="0"
                :precision="0"
                placeholder="0"
              />
            </label>
            <n-button class="admin-submit" type="primary" attr-type="submit">
              <template #icon>
                <n-icon>
                  <PersonAddOutline />
                </n-icon>
              </template>
              新增管理员
            </n-button>
          </form>

          <div class="system-table-scroll admin-table-scroll">
            <table class="license-table admin-table">
              <thead>
                <tr>
                  <th>管理员账号</th>
                  <th>角色</th>
                  <th>卡密额度</th>
                  <th>创建时间</th>
                  <th>最后登录</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody v-if="admins.length">
                <tr v-for="admin in admins" :key="admin.id">
                  <td>{{ admin.username }}</td>
                  <td>
                    <span class="role-badge" :class="admin.role">
                      {{ admin.roleText }}
                    </span>
                  </td>
                  <td>
                    <div v-if="admin.role === SYSTEM_ROLE_SUPER_ADMIN" class="quota-display">
                      不限
                    </div>
                    <div v-else class="quota-editor-list">
                      <div
                        v-for="option in quotaLevelOptions"
                        :key="option.value"
                        class="quota-editor-row"
                      >
                        <span class="quota-level-label">{{ option.label }}</span>
                        <span class="quota-count">
                          {{ getQuotaValue(admin.cardCreateUsed, option.value) }} /
                          {{ getQuotaValue(admin.cardCreateQuota, option.value) }}
                        </span>
                        <n-input-number
                          :value="getQuotaDraftValue(admin.username, option.value, admin.cardCreateQuota)"
                          :min="0"
                          :precision="0"
                          size="small"
                          @update:value="(value) => setQuotaDraftValue(admin.username, option.value, value)"
                        />
                      </div>
                      <n-button size="small" secondary @click="handleUpdateAdminCardQuota(admin)">
                        保存额度
                      </n-button>
                    </div>
                  </td>
                  <td>{{ admin.createdAt }}</td>
                  <td>{{ admin.lastLoginAt || "-" }}</td>
                  <td>
                    <span class="status-badge active">
                      {{ admin.statusText }}
                    </span>
                  </td>
                  <td class="admin-action-cell">
                    <n-button
                      size="small"
                      secondary
                      type="error"
                      :disabled="admin.role === SYSTEM_ROLE_SUPER_ADMIN"
                      @click="handleDeleteAdmin(admin)"
                    >
                      <template #icon>
                        <n-icon>
                          <TrashOutline />
                        </n-icon>
                      </template>
                      删除
                    </n-button>
                  </td>
                </tr>
              </tbody>
              <tbody v-else>
                <tr>
                  <td colspan="7">
                    <div class="table-empty-state">暂无管理员账号</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div v-else class="system-empty-state">
          <n-icon>
            <component :is="currentMenuItem.icon" />
          </n-icon>
          <h2>{{ currentMenuItem.label }}</h2>
          <p>{{ currentMenuItem.emptyText }}</p>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useMessage } from "naive-ui";
import {
  SYSTEM_ROLE_SUPER_ADMIN,
  createSystemLicenseCard,
  updateSystemLicenseCard,
  deleteSystemLicenseCard,
  createSystemAdmin,
  deleteSystemAdmin,
  getSystemAdmins,
  isSystemSuperAdminSession,
  refreshSystemManagementData,
  updateSystemAdminCardQuota,
} from "@/utils/systemManagementData";
import {
  CloudOutline,
  CopyOutline,
  KeyOutline,
  PeopleOutline,
  PersonAddOutline,
  RefreshOutline,
  ShieldCheckmarkOutline,
  StatsChartOutline,
  TrashOutline,
} from "@vicons/ionicons5";

const message = useMessage();

const activeSection = ref("cards");
const sortKey = ref("createdAt");
const systemData = refreshSystemManagementData();
const isSuperAdmin = ref(isSystemSuperAdminSession());

const adminMenuItems = [
  {
    key: "cards",
    label: "卡密管理",
    icon: KeyOutline,
    emptyText: "",
  },
];

const superAdminMenuItems = [
  {
    key: "overview",
    label: "运维总览",
    icon: StatsChartOutline,
    emptyText: "运维总览将在接入真实监控接口后展示在线状态、任务队列和运行告警。",
  },
  {
    key: "users",
    label: "用户管理",
    icon: PeopleOutline,
    emptyText: "",
  },
  {
    key: "admins",
    label: "管理员管理",
    icon: PeopleOutline,
    emptyText: "",
  },
  {
    key: "cards",
    label: "卡密管理",
    icon: KeyOutline,
    emptyText: "",
  },
  {
    key: "cdn",
    label: "CDN 数据",
    icon: CloudOutline,
    emptyText: "CDN 数据将在接入统计接口后展示缓存命中、流量和资源版本。",
  },
];

const menuItems = computed(() => isSuperAdmin.value ? superAdminMenuItems : adminMenuItems);

const sortOptions = [
  { key: "createdAt", label: "生成时间" },
  { key: "level", label: "档位" },
  { key: "status", label: "状态" },
  { key: "usedAt", label: "使用时间" },
];

const licenseLevelOptions = [
  { label: "月卡", value: "月卡" },
  { label: "季卡", value: "季卡" },
  { label: "年卡", value: "年卡" },
];
const quotaLevelOptions = [
  { label: "月卡", value: "月卡", quotaLabel: "月卡额度" },
  { label: "季卡", value: "季卡", quotaLabel: "季卡额度" },
  { label: "年卡", value: "年卡", quotaLabel: "年卡额度" },
];

const licenseCards = ref(systemData.licenseCards);
const users = ref(systemData.users);
const admins = ref(systemData.admins || getSystemAdmins());
const editingCardKey = ref("");
const unusedCardsModalVisible = ref(false);
const selectedUnusedCardsLevel = ref("月卡");
const licenseCardForm = reactive({
  level: "月卡",
  remark: "",
});
const adminForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  cardCreateQuota: {
    月卡: 0,
    季卡: 0,
    年卡: 0,
  },
});
const adminQuotaDrafts = reactive({});
const canManageLicenseCards = computed(() => isSuperAdmin.value);
const isEditingLicenseCard = computed(() => Boolean(editingCardKey.value));

const levelOrder = {
  月卡: 1,
  季卡: 2,
  年卡: 3,
};

const createEmptyQuotaDraft = () =>
  Object.fromEntries(quotaLevelOptions.map((option) => [option.value, 0]));

const getQuotaValue = (quota, level) => {
  const value = Number(quota?.[level] ?? 0);
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
};

const currentMenuItem = computed(
  () =>
    menuItems.value.find((item) => item.key === activeSection.value) ||
    menuItems.value.find((item) => item.key === "cards"),
);

const summaryCards = computed(() =>
  ["月卡", "季卡", "年卡"].map((level) => {
    const cards = licenseCards.value.filter((card) => card.level === level);
    return {
      key: level,
      label: level,
      unused: cards.filter((card) => card.status === "unused").length,
      used: cards.filter((card) => card.status === "used").length,
    };
  }),
);

const selectedUnusedCards = computed(() =>
  licenseCards.value.filter(
    (card) =>
      card.level === selectedUnusedCardsLevel.value &&
      card.status === "unused",
  ),
);

const sortedLicenseCards = computed(() => {
  return [...licenseCards.value].sort((a, b) => {
    if (sortKey.value === "level") {
      return levelOrder[a.level] - levelOrder[b.level];
    }
    if (sortKey.value === "status") {
      return a.status.localeCompare(b.status);
    }
    if (sortKey.value === "usedAt") {
      return (b.usedAt || "").localeCompare(a.usedAt || "");
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
});

const openUnusedCardsModal = (level) => {
  selectedUnusedCardsLevel.value = level;
  unusedCardsModalVisible.value = true;
};

const copyWithTextarea = (text) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  document.body.removeChild(textarea);
  return copied;
};

const copyCardKey = async (card) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(card.cardKey);
    } else if (!copyWithTextarea(card.cardKey)) {
      throw new Error("copy failed");
    }
    message.success(`已复制卡密：${card.cardKey}`);
  } catch {
    message.error("复制失败，请手动选择卡密");
  }
};

const syncAdminQuotaDrafts = () => {
  admins.value.forEach((admin) => {
    if (admin.role !== SYSTEM_ROLE_SUPER_ADMIN) {
      adminQuotaDrafts[admin.username] = quotaLevelOptions.reduce((draft, option) => ({
        ...draft,
        [option.value]: getQuotaValue(admin.cardCreateQuota, option.value),
      }), {});
    }
  });
};

const getQuotaDraftValue = (username, level, fallbackQuota) =>
  adminQuotaDrafts[username]?.[level] ?? getQuotaValue(fallbackQuota, level);

const setQuotaDraftValue = (username, level, value) => {
  if (!adminQuotaDrafts[username]) {
    adminQuotaDrafts[username] = createEmptyQuotaDraft();
  }
  adminQuotaDrafts[username][level] = value ?? 0;
};

const resetLicenseCardForm = () => {
  editingCardKey.value = "";
  licenseCardForm.level = "月卡";
  licenseCardForm.remark = "";
};

const refreshSystemState = () => {
  const data = refreshSystemManagementData();
  isSuperAdmin.value = isSystemSuperAdminSession();
  licenseCards.value = data.licenseCards;
  users.value = data.users;
  admins.value = data.admins;
  syncAdminQuotaDrafts();
  if (!isSuperAdmin.value && activeSection.value !== "cards") {
    activeSection.value = "cards";
  }
};

const handleCreateLicenseCard = () => {
  const result = createSystemLicenseCard({
    level: licenseCardForm.level,
    remark: licenseCardForm.remark,
  });

  if (!result.success) {
    message.error(result.message);
    return;
  }

  refreshSystemState();
  resetLicenseCardForm();
  message.success(result.message);
};

const handleStartEditLicenseCard = (card) => {
  editingCardKey.value = card.cardKey;
  licenseCardForm.level = card.level;
  licenseCardForm.remark = card.remark || "";
};

const handleUpdateLicenseCard = () => {
  const result = updateSystemLicenseCard(editingCardKey.value, {
    level: licenseCardForm.level,
    remark: licenseCardForm.remark,
  });

  if (!result.success) {
    message.error(result.message);
    return;
  }

  refreshSystemState();
  resetLicenseCardForm();
  message.success(result.message);
};

const handleDeleteLicenseCard = (card) => {
  const result = deleteSystemLicenseCard(card.cardKey);
  if (!result.success) {
    message.error(result.message);
    return;
  }

  refreshSystemState();
  if (editingCardKey.value === card.cardKey) {
    resetLicenseCardForm();
  }
  message.success(result.message);
};

const refreshCards = () => {
  refreshSystemState();
  sortKey.value = "createdAt";
  message.success("已刷新系统管理数据");
};

const resetAdminForm = () => {
  adminForm.username = "";
  adminForm.password = "";
  adminForm.confirmPassword = "";
  adminForm.cardCreateQuota = createEmptyQuotaDraft();
};

const handleCreateAdmin = () => {
  const result = createSystemAdmin({
    username: adminForm.username,
    password: adminForm.password,
    confirmPassword: adminForm.confirmPassword,
    cardCreateQuota: adminForm.cardCreateQuota,
  });

  if (!result.success) {
    message.error(result.message);
    return;
  }

  admins.value = getSystemAdmins();
  syncAdminQuotaDrafts();
  resetAdminForm();
  message.success(result.message);
};

const handleUpdateAdminCardQuota = (admin) => {
  const result = updateSystemAdminCardQuota(
    admin.username,
    adminQuotaDrafts[admin.username] ?? admin.cardCreateQuota ?? createEmptyQuotaDraft(),
  );
  if (!result.success) {
    message.error(result.message);
    return;
  }

  admins.value = getSystemAdmins();
  syncAdminQuotaDrafts();
  message.success(result.message);
};

const handleDeleteAdmin = (admin) => {
  if (admin.role === SYSTEM_ROLE_SUPER_ADMIN) {
    message.error("内置超级管理员不能删除");
    return;
  }

  const result = deleteSystemAdmin(admin.username);
  if (!result.success) {
    message.error(result.message);
    return;
  }

  admins.value = getSystemAdmins();
  syncAdminQuotaDrafts();
  message.success(result.message);
};

syncAdminQuotaDrafts();
</script>

<style scoped lang="scss">
.system-management-page {
  min-height: calc(100dvh - 66px);
  padding: 28px clamp(14px, 3vw, 32px) calc(32px + env(safe-area-inset-bottom));
  color: var(--text-primary);
}

.system-hero {
  max-width: 1400px;
  margin: 0 auto 18px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.system-kicker {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border: 1px solid var(--app-line);
  border-radius: 6px;
  background: var(--app-surface-muted);
  color: var(--primary-color);
  font-size: var(--font-size-xs);
  font-weight: 800;
  letter-spacing: 0;
}

.system-hero h1 {
  margin: 10px 0 6px;
  font-size: var(--font-size-3xl);
  line-height: var(--line-height-tight);
  letter-spacing: 0;
}

.system-hero p {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--font-size-md);
}

.system-workspace {
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 190px minmax(0, 1fr);
  gap: 14px;
  align-items: start;
}

.system-sidebar,
.system-content {
  border: 1px solid var(--app-line);
  border-radius: 8px;
  background: var(--card-bg);
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.system-sidebar {
  padding: 8px;
  display: grid;
  gap: 6px;
}

.system-side-item {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast);
}

.system-side-item:hover,
.system-side-item.active {
  border-color: rgba(var(--primary-color-rgb), 0.26);
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.system-content {
  min-width: 0;
  padding: 18px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.panel-header h2,
.system-empty-state h2 {
  margin: 0;
  font-size: var(--font-size-xl);
  letter-spacing: 0;
}

.panel-header p,
.system-empty-state p {
  margin: 6px 0 0;
  color: var(--text-secondary);
  line-height: var(--line-height-normal);
}

.panel-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.permission-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 34px;
  padding: 0 9px;
  border: 1px solid var(--app-line);
  border-radius: 7px;
  background: var(--app-surface-muted);
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
  font-weight: 700;
  white-space: nowrap;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 14px;
}

.summary-item {
  min-width: 0;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--app-line);
  border-radius: 8px;
  background: var(--app-surface-muted);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.summary-item:hover,
.summary-item:focus-visible {
  border-color: rgba(var(--primary-color-rgb), 0.34);
  background: var(--primary-color-light);
}

.summary-item:active {
  transform: translateY(1px);
}

.summary-label,
.summary-item span:last-child {
  display: block;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.summary-item strong {
  display: block;
  margin: 6px 0 2px;
  font-size: var(--font-size-2xl);
  line-height: 1;
}

.sort-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.sort-button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid var(--app-line);
  border-radius: 7px;
  background: var(--app-surface-muted);
  color: var(--text-secondary);
  font-weight: 700;
  cursor: pointer;
}

.sort-button.active,
.sort-button:hover {
  border-color: rgba(var(--primary-color-rgb), 0.28);
  background: var(--primary-color-light);
  color: var(--primary-color);
}

.system-table-scroll {
  overflow-x: auto;
  border: 1px solid var(--app-line);
  border-radius: 8px;
}

.license-table {
  width: 100%;
  min-width: 1160px;
  border-collapse: collapse;
  background: var(--app-surface-muted);
}

.license-table th,
.license-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--app-line);
  text-align: left;
  vertical-align: middle;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.license-table th {
  background: var(--table-header-bg);
  color: var(--text-secondary);
  font-weight: 800;
}

.license-table tr:last-child td {
  border-bottom: 0;
}

.user-table {
  min-width: 920px;
}

:deep(.unused-cards-modal) {
  width: min(760px, calc(100vw - 32px));
  border-radius: 8px;
  background: var(--card-bg);
}

.unused-cards-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--app-line);
  border-radius: 8px;
}

.unused-cards-table {
  width: 100%;
  min-width: 560px;
  border-collapse: collapse;
  background: var(--app-surface-muted);
}

.unused-cards-table th,
.unused-cards-table td {
  padding: 11px 12px;
  border-bottom: 1px solid var(--app-line);
  text-align: left;
  vertical-align: middle;
  font-size: var(--font-size-sm);
  white-space: nowrap;
}

.unused-cards-table th {
  background: var(--table-header-bg);
  color: var(--text-secondary);
  font-weight: 800;
}

.unused-cards-table tr:last-child td {
  border-bottom: 0;
}

.license-card-form,
.admin-create-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr)) auto;
  gap: 12px;
  align-items: end;
  margin-bottom: 16px;
  padding: 14px;
  border: 1px solid var(--app-line);
  border-radius: 8px;
  background: var(--app-surface-muted);
}

.admin-create-form {
  grid-template-columns: repeat(6, minmax(128px, 1fr)) auto;
}

.license-card-form-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 190px;
}

.admin-field {
  min-width: 0;
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 800;
}

.admin-submit {
  min-width: 132px;
}

.admin-table {
  min-width: 1120px;
}

.card-action-cell,
.admin-action-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.admin-action-cell {
  width: 116px;
}

.quota-display {
  color: var(--text-secondary);
  font-weight: 700;
}

.quota-editor-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px 12px;
}

.quota-editor-row {
  display: grid;
  grid-template-columns: 42px 54px minmax(96px, 120px);
  align-items: center;
  gap: 8px;
}

.quota-level-label,
.quota-count {
  color: var(--text-secondary);
  font-weight: 700;
}

.quota-count {
  font-variant-numeric: tabular-nums;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: 800;
}

.role-badge.super_admin {
  background: rgba(168, 85, 247, 0.14);
  color: #7c3aed;
}

.role-badge.admin {
  background: rgba(var(--primary-color-rgb), 0.14);
  color: var(--primary-color);
}

.table-empty-state {
  min-height: 132px;
  display: grid;
  place-items: center;
  color: var(--text-secondary);
  font-weight: 700;
}

.card-key-cell,
.remark-cell {
  max-width: 210px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: var(--font-size-xs);
  font-weight: 800;
}

.status-badge.unused {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-color);
}

.status-badge.used {
  background: rgba(245, 158, 11, 0.14);
  color: var(--warning-color);
}

.status-badge.active {
  background: rgba(14, 165, 233, 0.14);
  color: var(--primary-color);
}

.system-empty-state {
  min-height: 360px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 28px;
  text-align: center;
}

.system-empty-state .n-icon {
  font-size: 42px;
  color: var(--primary-color);
}

@media (max-width: 900px) {
  .system-management-page {
    min-height: calc(100dvh - 58px);
    padding: 18px var(--spacing-md) calc(24px + env(safe-area-inset-bottom));
  }

  .system-workspace {
    grid-template-columns: 1fr;
  }

  .system-sidebar {
    grid-template-columns: repeat(4, minmax(128px, 1fr));
    overflow-x: auto;
  }

  .system-side-item {
    justify-content: center;
  }

  .panel-header {
    flex-direction: column;
  }

  .panel-actions {
    justify-content: flex-start;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .license-card-form,
  .admin-create-form {
    grid-template-columns: 1fr;
  }

  .quota-editor-list {
    grid-template-columns: 1fr;
  }

  .license-card-form-actions,
  .admin-submit {
    width: 100%;
  }

  .license-card-form-actions {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 520px) {
  .system-sidebar {
    grid-template-columns: 1fr 1fr;
  }

  .system-side-item {
    justify-content: flex-start;
  }

  .system-content {
    padding: 14px;
  }
}
</style>
