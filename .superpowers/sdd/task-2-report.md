# Task 2 Report - Flask API Routes

## 状态

DONE_WITH_CONCERNS

## 提交

`d537e5f008eaf58ac271d7841e72f149bd0ec0ae`

## 运行过的命令和结果

1. `python -m unittest server.tests.test_system_api -v`
   - 结果：RED，失败于 `ModuleNotFoundError: No module named 'server.app'`

2. `python -m pip show flask`
   - 结果：未找到 `flask`

3. `python -m pip show flask-cors`
   - 结果：未找到 `flask-cors`

4. `python -m pip install -r server/requirements.txt`
   - 结果：安装/确认 `flask`、`flask-cors`、`requests`、`werkzeug`

5. `python -m unittest server.tests.test_system_api -v`
   - 结果：首次 GREEN 前出现 1 个失败，原因是测试错误地以普通用户会话访问 `/api/system/users`，修正测试后继续

6. `python -m unittest server.tests.test_system_api -v`
   - 结果：PASS，3/3 通过

7. `python -m unittest server.tests.test_system_database server.tests.test_system_api -v`
   - 结果：PASS，11/11 通过；过程中出现多条 `sqlite3.ResourceWarning: unclosed database`

## 自检说明

- 先写 `server/tests/test_system_api.py`，并确认 RED 来自缺失的 `server.app.create_app`
- 在 `server/app.py` 中实现了 Flask app factory、会话处理、`/api/auth/*` 与 `/api/system/*` 路由
- 路由层对登录态、权限和错误状态码做了统一封装，业务逻辑优先复用 `SystemDatabase`
- 新增测试覆盖了登录/会话、注册与卡密复用、卡密 CRUD、管理员配额与权限、管理员删除
- 写入范围仅涉及：
  - `server/app.py`
  - `server/tests/test_system_api.py`
  - `.superpowers/sdd/task-2-report.md`

## 担忧点

- 组合运行数据库与 API 测试时，现有数据层会触发多条 `sqlite3.ResourceWarning: unclosed database`；本任务验收测试通过，但这个警告值得后续单独排查
- `GET /api/system/users`、`GET /api/system/admins`、`DELETE /api/system/admins/<username>` 当前在路由层使用了 `SystemDatabase` 的私有连接/序列化辅助能力，因为 Task 1 暂未暴露对应公开方法
