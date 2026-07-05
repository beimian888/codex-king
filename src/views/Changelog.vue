<template>
  <div class="changelog-page">
    <div class="changelog-container">
      <!-- 页面头部 -->
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">
            <i class="icon-history">📜</i>
            更新日志
          </h1>
          <p class="page-description">查看系统的最新更新和改进内容</p>
        </div>

        <!-- 筛选器 -->
        <div class="filter-section">
          <div class="filter-group">
            <label>版本类型：</label>
            <div class="filter-buttons">
              <button
                v-for="type in versionTypes"
                :key="type.value"
                :class="['filter-btn', { active: selectedType === type.value }]"
                @click="selectedType = type.value"
              >
                {{ type.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🚀</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalVersions }}</div>
            <div class="stat-label">总版本数</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✨</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalFeatures }}</div>
            <div class="stat-label">新功能</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🐛</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalFixes }}</div>
            <div class="stat-label">修复问题</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⬆️</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.totalImprovements }}</div>
            <div class="stat-label">优化改进</div>
          </div>
        </div>
      </div>

      <!-- 更新日志列表 -->
      <div class="changelog-list">
        <transition-group name="changelog-fade">
          <ChangelogCard
            v-for="entry in filteredChangelogs"
            :key="entry.version"
            :entry="entry"
          />
        </transition-group>

        <!-- 空状态 -->
        <div v-if="filteredChangelogs.length === 0" class="empty-state">
          <div class="empty-icon">📭</div>
          <p class="empty-text">暂无该类型的更新日志</p>
          <button class="reset-filter-btn" @click="selectedType = 'all'">
            重置筛选
          </button>
        </div>
      </div>

      <!-- 订阅更新 -->
      <div class="subscribe-section">
        <div class="subscribe-card">
          <div class="subscribe-icon">🔔</div>
          <div class="subscribe-content">
            <h3 class="subscribe-title">订阅更新通知</h3>
            <p class="subscribe-desc">第一时间获取系统更新信息</p>
          </div>
          <button class="subscribe-btn" @click="handleSubscribe">
            {{ isSubscribed ? "已订阅" : "立即订阅" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import ChangelogCard from "@/components/ChangelogCard.vue";
import { useChangelogStore } from "@/stores/changelogStore";

const changelogStore = useChangelogStore();

const selectedType = ref("all");
const isSubscribed = ref(false);

const versionTypes = [
  { value: "all", label: "全部" },
  { value: "major", label: "主要版本" },
  { value: "minor", label: "次要版本" },
  { value: "patch", label: "补丁" },
  { value: "hotfix", label: "热修复" },
];

const filteredChangelogs = computed(() => {
  if (selectedType.value === "all") {
    return changelogStore.changelogs;
  }
  return changelogStore.changelogs.filter(
    (changelog) => changelog.type === selectedType.value,
  );
});

const stats = computed(() => ({
  totalVersions: changelogStore.changelogs.length,
  totalFeatures: changelogStore.changelogs.reduce(
    (sum, log) => sum + (log.features?.length || 0),
    0,
  ),
  totalFixes: changelogStore.changelogs.reduce(
    (sum, log) => sum + (log.fixes?.length || 0),
    0,
  ),
  totalImprovements: changelogStore.changelogs.reduce(
    (sum, log) => sum + (log.improvements?.length || 0),
    0,
  ),
}));

const handleSubscribe = () => {
  isSubscribed.value = !isSubscribed.value;
  if (isSubscribed.value) {
    localStorage.setItem("changelog_subscribed", "true");
    alert("已成功订阅更新通知！");
  } else {
    localStorage.removeItem("changelog_subscribed");
    alert("已取消订阅");
  }
};

onMounted(() => {
  isSubscribed.value = localStorage.getItem("changelog_subscribed") === "true";
});
</script>

<style scoped>
.changelog-page {
  min-height: 100vh;
  background: transparent;
  padding: 40px 20px;
}

.changelog-container {
  max-width: 900px;
  margin: 0 auto;
}

/* 页面头部 */
.page-header {
  margin-bottom: 40px;
}

.header-content {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 36px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.icon-history {
  display: none;
}

.page-description {
  font-size: 16px;
  color: var(--text-secondary);
  margin: 0;
}

/* 筛选器 */
.filter-section {
  background: var(--card-bg);
  border-radius: var(--border-radius-xl);
  padding: 20px;
  border: 1px solid var(--app-line);
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.filter-group label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.filter-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 8px 16px;
  border: 1px solid var(--app-line);
  background: var(--app-surface-muted);
  color: var(--text-secondary);
  border-radius: 999px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  background: var(--app-surface-strong);
  border-color: var(--primary-color);
  color: var(--text-primary);
}

.filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

/* 统计卡片 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-xl);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.stat-icon {
  display: none;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 更新日志列表 */
.changelog-list {
  margin-bottom: 40px;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--card-bg);
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-light);
}

.empty-icon {
  display: none;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 16px;
  margin: 0 0 20px 0;
}

.reset-filter-btn {
  padding: 10px 24px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-filter-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(var(--primary-color-rgb), 0.22);
}

/* 订阅部分 */
.subscribe-section {
  margin-top: 40px;
}

.subscribe-card {
  background:
    linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.14), rgba(20, 184, 166, 0.12)),
    var(--card-bg);
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-xl);
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.subscribe-icon {
  display: none;
}

.subscribe-content {
  flex: 1;
}

.subscribe-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.subscribe-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.subscribe-btn {
  padding: 12px 32px;
  background: var(--primary-color);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.subscribe-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 24px rgba(var(--primary-color-rgb), 0.24);
}

/* 过渡动画 */
.changelog-fade-enter-active,
.changelog-fade-leave-active {
  transition: all 0.3s ease;
}

.changelog-fade-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.changelog-fade-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .changelog-page {
    padding: 20px 12px;
  }

  .page-title {
    font-size: 28px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .subscribe-card {
    flex-direction: column;
    text-align: center;
    padding: 24px;
  }

  .filter-buttons {
    justify-content: center;
  }
}
</style>
