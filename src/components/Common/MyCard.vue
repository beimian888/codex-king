<template>
  <div class="status-card">
    <div class="card-header">
      <div class="status-icon">
        <slot name="icon"></slot>
      </div>
      <div class="status-title">
        <slot name="title"></slot>
      </div>
      <div class="status-badge" :class="statusClass">
        <div class="status-dot" />
        <slot name="badge"></slot>
      </div>
      <slot name="extra"></slot>
    </div>
    <div class="card-content">
      <slot name="default"></slot>
    </div>
    <div class="card-action" :class="statusClass">
      <slot name="action"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
declare type StatusKey = "active" | "weekly" | "energy" | "completed";

const $props = defineProps<{
  statusClass: StatusKey | Record<StatusKey, boolean>;
}>();
</script>

<style lang="scss">
.status-card {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.36), rgba(255, 255, 255, 0.14)),
    var(--card-bg);
  border: 1px solid var(--app-glass-border);
  border-radius: var(--border-radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-light);
  backdrop-filter: blur(30px) saturate(180%);
  -webkit-backdrop-filter: blur(30px) saturate(180%);
  min-height: 200px;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(120deg, rgba(255, 255, 255, 0.36), transparent 42%);
    opacity: 0.46;
  }

  > * {
    position: relative;
    z-index: 1;
  }

  &:hover {
    border-color: var(--app-ring);
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
  }

  .active {
    --bg-color: rgba(34, 197, 94, 0.1);
    --font-color: var(--success-color);

    --pr-color: var(--success-color);
    --f-color: var(--success-color);

    background: var(--bg-color);
    color: var(--font-color);
  }

  .weekly {
    --bg-color: rgba(59, 130, 246, 0.1);
    --font-color: var(--info-color);

    --pr-color: var(--info-color);
    --f-color: var(--info-color);

    background: var(--bg-color);
    color: var(--font-color);
  }

  .energy {
    --bg-color: rgba(245, 158, 11, 0.1);
    --font-color: var(--warning-color);

    --pr-color: var(--warning-color);
    --f-color: var(--warning-color);

    background: var(--bg-color);
    color: var(--font-color);
  }

  .completed {
    --bg-color: rgba(34, 197, 94, 0.1);
    --font-color: var(--success-color);

    --pr-color: var(--success-color);
    --f-color: var(--success-color);

    --bg-tertiary: var(--success-color);
    --text-tertiary: rgba(255, 255, 255, 1);

    background: var(--bg-color);
    color: var(--font-color);
  }
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);

  .status-icon {
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    object-fit: contain;
    display: grid;
    place-items: center;
    border-radius: 12px;
    background: var(--app-surface-muted);
    border: 1px solid var(--app-line);

    > img {
      width: 32px;
      height: 32px;
      object-fit: contain;
    }
  }

  .status-title {
    flex: 1;

    h3 {
      font-size: var(--font-size-md);
      font-weight: var(--font-weight-semibold);
      color: var(--text-primary);
      margin: 0 0 var(--spacing-xs) 0;
    }

    p {
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      margin: 0;
    }
  }

  .status-badge {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--border-radius-full);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    background: var(--bg-color);
    color: var(--font-color);
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: currentColor;
  }
}

.card-content {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  h3 {
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-semibold);
    color: var(--text-primary);
    margin: 0 0 var(--spacing-xs) 0;
  }

  p {
    margin: 0;
  }

  .description {
    line-height: 1.5;
  }

  margin-bottom: var(--spacing-lg);

  // .time-display {
  //   font-size: 1.5rem;
  //   /* text-2xl */
  //   font-weight: 700;
  //   /* font-bold */
  //   color: var(--text-primary);
  //   text-align: center;
  //   margin-bottom: var(--spacing-md);
  //   font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
  //   letter-spacing: 0.1em;
  //   text-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
  //   background: var(--bg-tertiary);
  //   padding: 0.75rem 1rem;
  //   border-radius: 0.5rem;
  //   border: 1px solid var(--border-light);
  //   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  //   transition: all 0.2s ease-in-out;

  //   &:hover {
  //     transform: translateY(-1px);
  //     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  //   }
  // }

  // .club-name {
  //   color: var(--text-secondary);
  //   font-size: var(--font-size-sm);
  //   margin-bottom: var(--spacing-lg);

  //   strong {
  //     color: var(--text-primary);
  //     font-weight: var(--font-weight-medium);
  //   }
  // }

  // .tower-info {
  //   display: flex;
  //   justify-content: space-between;
  //   align-items: center;
  //   margin-bottom: var(--spacing-lg);

  //   .label {
  //     color: var(--text-secondary);
  //     font-size: var(--font-size-sm);
  //   }

  //   .tower-level {
  //     font-size: var(--font-size-lg);
  //     font-weight: var(--font-weight-bold);
  //     color: var(--text-primary);
  //   }
  // }
}

.card-action {
  display: flex;
  gap: var(--spacing-sm);

  > button {
    cursor: pointer;
    flex: 1;
    width: 100%;
    font-size: var(--font-size-sm);
    font-weight: 700;
    padding: var(--spacing-sm) var(--spacing-md);
    border: 1px solid var(--app-line);
    border-radius: var(--border-radius-full);
    color: var(--text-primary);
    background-color: var(--app-surface-muted);
    transition:
      background-color var(--transition-fast),
      border-color var(--transition-fast),
      color var(--transition-fast),
      transform var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
      border-color: var(--app-ring);
      color: var(--primary-color);
      transform: translateY(-1px);
    }

    &:active {
      transform: translateY(0);
    }

    &:disabled {
      background: var(--bg-tertiary);
      color: var(--text-tertiary);
      cursor: not-allowed;
      transform: none;
    }
  }
}

[data-theme="dark"] .status-card {
  background:
    linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04)),
    var(--card-bg);
}

[data-theme="dark"] .status-card::before {
  opacity: 0.24;
}

@media (max-width: 768px) {
  .status-card {
    padding: var(--spacing-md);
    min-height: auto;
  }

  .card-header {
    flex-wrap: wrap;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-md);

    .status-title {
      min-width: 100px;
    }

    .status-badge {
      margin-left: auto;
    }
  }
}
</style>
