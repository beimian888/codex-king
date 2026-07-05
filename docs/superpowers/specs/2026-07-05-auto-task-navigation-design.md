# 自动任务导航命名设计

## Goal

将面向用户的“批量日常”模块统一命名为“自动任务”，并让首页“自动任务”入口跳转到批量自动任务模块。

## Approach

- 保留现有路由路径 `/admin/batch-daily-tasks`，避免破坏旧链接和已有导航结构。
- 将 `BatchDailyTasks` 路由的 `meta.title` 改为 `自动任务`。
- 将默认布局中 `/admin/batch-daily-tasks` 的导航文案从 `批量日常` 改为 `自动任务`。
- 将首页胶囊导航第四项从 `日常任务 -> /admin/daily-tasks` 改为 `自动任务 -> /admin/batch-daily-tasks`。
- 将 `BatchDailyTasks.vue` 页面主标题从 `批量日常任务` 改为 `自动任务`。

## Testing

新增静态契约测试，检查首页、默认布局、路由元信息和批量任务页标题都使用 `自动任务`，并确认首页不再把该入口指向 `/admin/daily-tasks`。
