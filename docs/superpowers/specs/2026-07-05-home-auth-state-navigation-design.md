# 首页登录态与导航拦截设计

## 目标

首页读取系统管理本地登录 session。未登录时，首页胶囊导航和移动菜单不进入功能模块，并提示“登录后体验完整内容”；已登录时，登录按钮显示欢迎文案且不可点击。

## 设计

- 首页复用 `src/utils/systemManagementData.js` 的 `getCurrentSystemSession()`，不新增独立登录状态来源。
- 首页维护 `currentSystemSession`，派生 `isSystemLoggedIn` 和 `loginButtonText`。
- 顶部和移动登录按钮在已登录时显示 `欢迎，<用户名>`，设置 `disabled`，保留现有金色按钮视觉但使用不可点击状态。
- `goTo(path)` 统一拦截首页功能入口：未登录时清空当前胶囊选中态、关闭移动菜单、显示 `message.warning("登录后体验完整内容")`，不调用 `router.push`。
- 登录/注册成功后刷新首页 session，再沿用现有成功跳转逻辑。

## 验收

- 未登录点击首页胶囊按钮不跳转，并显示指定提示。
- 已登录后登录按钮变成欢迎文案且不可点击。
- 首页刷新后仍能从本地 session 识别登录态。
- 不改变系统管理路由守卫和管理员权限规则。
