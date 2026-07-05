<template>
  <div class="not-found-page">
    <div class="container">
      <div class="error-content">
        <div class="error-visual">
          <div class="error-number">404</div>
          <div class="error-icon">
            <n-icon size="120">
              <Search />
            </n-icon>
          </div>
        </div>

        <div class="error-text">
          <h1>页面未找到</h1>
          <p>抱歉，您访问的页面不存在或已被移除。</p>
        </div>

        <div class="error-actions">
          <n-button type="primary" size="large" @click="router.push('/admin/game-features')">
            返回游戏功能
          </n-button>
          <n-button size="large" @click="router.back()"> 返回上一页 </n-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { Search } from "@vicons/ionicons5";

const router = useRouter();
</script>

<style scoped lang="scss">
.not-found-page {
  min-height: 100vh;
  background: var(--app-background);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
}

/* 深色主题下背景 */
[data-theme="dark"] .not-found-page {
  background: var(--app-background);
}

.error-content {
  text-align: center;
  color: var(--text-primary);
  max-width: 600px;
  padding: var(--spacing-2xl);
  border: 1px solid var(--app-line);
  border-radius: var(--border-radius-xl);
  background: var(--card-bg);
  box-shadow: var(--shadow-medium);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.error-visual {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.error-number {
  font-size: 12rem;
  font-weight: var(--font-weight-bold);
  opacity: 0.1;
  line-height: 1;
}

.error-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.6;
}

.error-text {
  margin-bottom: var(--spacing-2xl);

  h1 {
    font-size: var(--font-size-3xl);
    font-weight: var(--font-weight-bold);
    margin-bottom: var(--spacing-md);
  }

  p {
    font-size: var(--font-size-lg);
    opacity: 0.9;
    margin: 0;
  }
}

.error-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}

@media (max-width: 640px) {
  .error-number {
    font-size: 8rem;
  }

  .error-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>
