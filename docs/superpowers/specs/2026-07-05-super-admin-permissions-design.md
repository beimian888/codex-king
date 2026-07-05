# 超级管理员与系统管理权限设计

## 目标

增加一个本地内置超级管理员账号，并让系统管理模块只对管理员可见、可进入。超级管理员可以新增和删除普通管理员账号；普通管理员可以进入系统管理，但不能管理管理员；普通注册用户不能看到系统管理模块，也不能通过地址直接进入。

## 账号与角色

- 内置超级管理员：
  - 用户名：`111`
  - 密码：`111`
  - 角色：`super_admin`
- 普通管理员：
  - 角色：`admin`
  - 只能由超级管理员在系统管理中创建或删除。
- 普通注册用户：
  - 角色：`user`
  - 通过首页注册卡密创建，不能进入系统管理。

## 数据边界

继续使用 `src/utils/systemManagementData.js` 作为唯一权限数据边界，新增：

- `getCurrentSystemSession()`
- `isSystemAdminSession()`
- `isSystemSuperAdminSession()`
- `getSystemAdmins()`
- `createSystemAdmin(form)`
- `deleteSystemAdmin(username)`

首页登录仍调用 `loginSystemUser()`。当登录 `111 / 111` 时，不查本地用户表，直接写入超级管理员 session。普通管理员和普通用户仍从本地用户表校验。

## 页面与路由

- `DefaultLayout.vue` 中的“系统管理”桌面导航和移动抽屉入口只在 `isSystemAdminSession()` 为真时渲染。
- `router.beforeEach` 中拦截 `SystemManagement`：非管理员 session 访问时重定向首页 `/`。
- `SystemManagement.vue` 新增 `管理员管理` 二级菜单。
- `管理员管理` 只对超级管理员展示。
- 超级管理员可以创建普通管理员，字段为用户名、密码、确认密码。
- 超级管理员可以删除普通管理员，不能删除内置超级管理员。

## 非目标

- 不接真实后端权限接口。
- 不加密码加密。
- 不做管理员修改密码。
- 不影响 Token 管理和游戏账号导入流程。
