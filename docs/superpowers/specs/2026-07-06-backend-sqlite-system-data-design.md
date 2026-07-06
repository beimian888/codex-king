# 后端 SQLite 管理卡密和用户名单 Design

## 背景

当前系统管理数据集中在 `src/utils/systemManagementData.js`，由浏览器 `localStorage` 保存卡密、用户、管理员、登录会话和管理员卡密额度。这样可以本地使用，但数据只存在当前浏览器，不能作为统一的管理数据库。

用户已确认选择后端方案：创建后端数据库来管理卡密和用户名单。

## 目标

- 使用后端 SQLite 数据库统一保存卡密、用户名单、管理员和管理员卡密额度。
- 保留现有业务规则：超级管理员 `111 / 111`、普通管理员权限、卡密自动生成、月卡 30 天、季卡 90 天、年卡 365 天。
- 前端系统管理页和首页登录注册改为调用后端 API，不再直接把系统管理数据写入 `localStorage`。
- 后端启动时自动初始化数据库和内置超级管理员。
- 迁移边界清晰：前端可保留登录态缓存，但卡密和用户权威数据来自后端数据库。

## 技术方案

采用 `Python Flask + sqlite3`：

- 项目已有 `server/requirements.txt`，包含 `flask`、`flask-cors`、`requests`、`werkzeug`。
- Python 标准库自带 `sqlite3`，不需要新增原生 Node SQLite 依赖。
- 数据库文件放在 `server/data/system.db`。
- 后端入口建议为 `server/app.py`。
- 数据库初始化逻辑建议放在 `server/system_database.py`，负责建表、种子数据和数据访问。

## 数据模型

### users

保存普通用户和管理员账号。

- `id`：主键
- `username`：唯一用户名
- `password_hash`：密码哈希
- `role`：`super_admin`、`admin`、`user`
- `status`：`active` 或 `disabled`
- `card_key`：普通用户激活使用的卡密
- `level`：月卡、季卡、年卡
- `expires_at`：普通用户到期时间
- `created_at`：创建时间
- `last_login_at`：最后登录时间

超级管理员启动时自动存在，用户名为 `111`。

### license_cards

保存卡密数据。

- `card_key`：主键，后端自动生成
- `level`：月卡、季卡、年卡
- `status`：`unused` 或 `used`
- `user`：使用者用户名
- `used_at`：激活时间
- `expires_at`：从激活时间开始计算的到期时间
- `created_at`：生成时间
- `created_by`：生成人
- `remark`：备注
- `updated_at`：最后修改时间

卡密规则：

- 卡密必须由后端自动生成，前端不能提交自定义卡密。
- 未使用卡密的 `expires_at` 为空。
- 注册激活后开始计算：月卡 30 天、季卡 90 天、年卡 365 天。

### admin_card_quotas

保存普通管理员按档位划分的卡密额度。

- `username`：管理员用户名
- `level`：月卡、季卡、年卡
- `quota`：可生成数量
- `used`：已生成数量

超级管理员不受额度限制。

## 权限规则

- 超级管理员可以增删改查全部卡密、用户和管理员。
- 普通管理员打开系统管理界面只显示卡密管理。
- 普通管理员只能查看自己生成的卡密。
- 普通管理员只能新增卡密，不能修改或删除卡密。
- 普通管理员新增卡密时扣减对应档位额度。
- 普通用户不能进入系统管理，也不能生成卡密。

## API 设计

后端统一使用 `/api` 前缀，返回 JSON。

### 认证

- `POST /api/auth/login`
  - 输入：`username`、`password`
  - 输出：登录用户、角色、会话信息
- `POST /api/auth/register`
  - 输入：`username`、`password`、`confirmPassword`、`cardKey`
  - 行为：校验未使用卡密，创建用户，标记卡密已使用，计算到期时间
- `POST /api/auth/logout`
  - 行为：清除服务端会话或返回前端清除登录态指令
- `GET /api/auth/session`
  - 输出：当前登录用户和角色

### 卡密

- `GET /api/system/cards`
  - 超级管理员返回全部卡密
  - 普通管理员只返回自己生成的卡密
- `POST /api/system/cards`
  - 输入：`level`、`remark`
  - 行为：后端生成卡密，记录生成人，普通管理员扣对应额度
- `PUT /api/system/cards/:cardKey`
  - 超级管理员可修改档位和备注
- `DELETE /api/system/cards/:cardKey`
  - 超级管理员可删除卡密
- `GET /api/system/cards/unused?level=月卡`
  - 返回未使用卡密、生成时间和备注，用于统计卡片弹窗

### 用户和管理员

- `GET /api/system/users`
  - 超级管理员查看普通用户列表
- `GET /api/system/admins`
  - 超级管理员查看管理员列表和额度
- `POST /api/system/admins`
  - 超级管理员新增普通管理员，并设置月卡、季卡、年卡额度
- `PUT /api/system/admins/:username/quota`
  - 超级管理员修改管理员额度
- `DELETE /api/system/admins/:username`
  - 超级管理员删除普通管理员，不能删除内置超级管理员

## 前端改造

保留 `src/utils/systemManagementData.js` 作为前端数据边界，但把内部实现从 `localStorage` 改为异步 API 调用。

需要调整的调用方：

- `src/views/Home.vue`
  - 登录、注册、退出登录调用后端 API。
  - 登录成功后仍可保存用户名和记住密码选项。
- `src/views/SystemManagement.vue`
  - 卡密、用户、管理员列表从后端刷新。
  - 新增、编辑、删除、额度修改调用后端 API。
- 路由守卫和导航权限
  - 基于后端会话或前端缓存的 session 判断是否显示系统管理入口。

为了降低一次性改动风险，`systemManagementData.js` 可以保持现有函数名，但函数改为 `async`。页面处理函数同步改成 `await`。

## 迁移策略

首版不自动导入旧 `localStorage` 数据，避免把浏览器私有测试数据误写进共享数据库。

保留一个后续可选脚本：

- 从浏览器导出旧系统管理 JSON。
- 后端提供受保护导入接口或命令行脚本。
- 导入时去重用户名和卡密。

## 错误处理

- 所有 API 返回统一结构：`{ success, message, data }`。
- 权限不足返回 403。
- 未登录返回 401。
- 用户名重复、卡密不存在、卡密已使用、额度不足返回可读中文错误。
- 数据库错误后端记录日志，前端显示通用错误提示。

## 测试策略

后端测试：

- 数据库初始化会创建表和内置超级管理员。
- 登录 `111 / 111` 成功。
- 注册使用未使用卡密后创建用户，并按激活时间计算到期时间。
- 卡密不能重复使用。
- 普通管理员只能看到自己生成的卡密。
- 普通管理员新增卡密会扣对应档位额度。
- 超级管理员可以查看所有卡密并管理管理员额度。

前端契约测试：

- `systemManagementData.js` 仍导出当前页面使用的函数名。
- 首页登录注册调用数据边界。
- 系统管理页对异步结果进行刷新。
- 普通管理员菜单只显示卡密管理。

构建验证：

- 运行现有相关 Node 静态测试。
- 运行后端 Python 测试。
- 运行 `pnpm build`。

## 非目标

- 本次不做公网用户体系、支付系统或多租户隔离。
- 本次不做旧 `localStorage` 自动导入。
- 本次不加复杂 RBAC 权限配置，仍使用现有三类角色。
- 本次不改变游戏账号 token 数据存储方式。
