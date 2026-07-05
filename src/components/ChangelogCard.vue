<template>
  <div class="changelog-card">
    <div class="changelog-header">
      <div class="version-badge" :class="`badge-${entry.type}`">
        {{ entry.version }}
      </div>
      <div class="changelog-meta">
        <span class="release-date">{{ formatDate(entry.date) }}</span>
        <span class="type-tag" :class="`tag-${entry.type}`">
          {{ getTypeLabel(entry.type) }}
        </span>
      </div>
    </div>

    <div class="changelog-content">
      <div v-if="entry.title" class="changelog-title">{{ entry.title }}</div>

      <div
        v-if="entry.features && entry.features.length"
        class="change-section"
      >
        <h4 class="section-title">
          <i class="icon-sparkles">✨</i>
          新功能
        </h4>
        <ul class="change-list">
          <li v-for="(item, idx) in entry.features" :key="`feature-${idx}`">
            {{ item }}
          </li>
        </ul>
      </div>

      <div
        v-if="entry.improvements && entry.improvements.length"
        class="change-section"
      >
        <h4 class="section-title">
          <i class="icon-arrow-up">⬆️</i>
          改进优化
        </h4>
        <ul class="change-list">
          <li
            v-for="(item, idx) in entry.improvements"
            :key="`improvement-${idx}`"
          >
            {{ item }}
          </li>
        </ul>
      </div>

      <div v-if="entry.fixes && entry.fixes.length" class="change-section">
        <h4 class="section-title">
          <i class="icon-bug">🐛</i>
          修复问题
        </h4>
        <ul class="change-list">
          <li v-for="(item, idx) in entry.fixes" :key="`fix-${idx}`">
            {{ item }}
          </li>
        </ul>
      </div>

      <div
        v-if="entry.breaking && entry.breaking.length"
        class="change-section breaking"
      >
        <h4 class="section-title">
          <i class="icon-warning">⚠️</i>
          重大变更
        </h4>
        <ul class="change-list">
          <li v-for="(item, idx) in entry.breaking" :key="`breaking-${idx}`">
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  entry: {
    type: Object,
    required: true,
    validator: (value) => {
      return value.version && value.date && value.type;
    },
  },
});

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getTypeLabel = (type) => {
  const labels = {
    major: "主要版本",
    minor: "次要版本",
    patch: "补丁版本",
    hotfix: "热修复",
  };
  return labels[type] || type;
};
</script>

<style scoped>
.changelog-card {
  background: var(--card-bg);
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-xl);
  padding: 24px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.changelog-card:hover {
  border-color: var(--app-ring);
  box-shadow: var(--shadow-medium);
  transform: translateY(-2px);
}

.changelog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--app-line);
}

.version-badge {
  font-size: 20px;
  font-weight: 700;
  padding: 8px 16px;
  border: 1px solid rgba(var(--primary-color-rgb), 0.32);
  border-radius: 999px;
  background: rgba(var(--primary-color-rgb), 0.14);
  color: var(--primary-color);
}

.version-badge.badge-major {
  border-color: rgba(239, 68, 68, 0.34);
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
}

.version-badge.badge-minor {
  border-color: rgba(var(--primary-color-rgb), 0.34);
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--primary-color);
}

.version-badge.badge-patch {
  border-color: rgba(16, 185, 129, 0.34);
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-color);
}

.version-badge.badge-hotfix {
  border-color: rgba(245, 158, 11, 0.34);
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning-color);
}

.changelog-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.release-date {
  color: var(--text-secondary);
  font-size: 14px;
}

.type-tag {
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.type-tag.tag-major {
  background: rgba(239, 68, 68, 0.12);
  color: var(--error-color);
}

.type-tag.tag-minor {
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--primary-color);
}

.type-tag.tag-patch {
  background: rgba(16, 185, 129, 0.12);
  color: var(--success-color);
}

.type-tag.tag-hotfix {
  background: rgba(245, 158, 11, 0.12);
  color: var(--warning-color);
}

.changelog-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.changelog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.change-section {
  padding: 12px;
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-medium);
  background: var(--app-surface-muted);
}

.change-section.breaking {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.28);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 12px 0;
}

.section-title i {
  display: none;
}

.change-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.change-list li {
  padding-left: 24px;
  position: relative;
  color: var(--text-secondary);
  line-height: 1.6;
}

.change-list li::before {
  content: "•";
  position: absolute;
  left: 8px;
  color: var(--primary-color);
  font-weight: bold;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .changelog-card {
    padding: 16px;
  }

  .changelog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .version-badge {
    font-size: 16px;
    padding: 6px 12px;
  }

  .changelog-title {
    font-size: 16px;
  }
}
</style>
