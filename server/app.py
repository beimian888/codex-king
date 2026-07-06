import os
from pathlib import Path

from flask import Flask, jsonify, request, session
from flask_cors import CORS

from server.system_database import ROLE_ADMIN, ROLE_SUPER_ADMIN, SystemDatabase


def create_app(db_path: str | None = None) -> Flask:
    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    app.secret_key = os.environ.get("XYZW_SECRET_KEY", "xyzw-dev-secret-key")

    resolved_db_path = Path(db_path) if db_path else Path(__file__).resolve().parent / "data" / "system.db"
    resolved_db_path.parent.mkdir(parents=True, exist_ok=True)

    db = SystemDatabase(str(resolved_db_path))
    db.init_schema()

    def current_user():
        return session.get("user")

    def require_login():
        user = current_user()
        if not user:
            return None, (jsonify({"success": False, "message": "请先登录", "data": {}}), 401)
        return user, None

    def api_response(result: dict, success_status: int = 200):
        status_code = success_status if result.get("success") else _error_status(result.get("message", ""))
        return jsonify(result), status_code

    def _error_status(message: str) -> int:
        if any(marker in message for marker in ("无权限", "只有", "不能删除")):
            return 403
        if any(marker in message for marker in ("请先登录", "登录已失效")):
            return 401
        return 400

    def _payload():
        return request.get_json(silent=True) or {}

    def _list_users(actor: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return {"success": False, "message": "无权限", "data": {}}

        with db._connect() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM users
                WHERE role = ?
                ORDER BY id DESC
                """,
                ("user",),
            ).fetchall()
            return {
                "success": True,
                "message": "查询成功",
                "data": {"users": [db._serialize_user(conn, row) for row in rows]},
            }

    def _list_admins(actor: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return {"success": False, "message": "无权限", "data": {}}

        with db._connect() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM users
                WHERE role IN (?, ?)
                ORDER BY id ASC
                """,
                (ROLE_SUPER_ADMIN, ROLE_ADMIN),
            ).fetchall()
            return {
                "success": True,
                "message": "查询成功",
                "data": {"admins": [db._serialize_user(conn, row) for row in rows]},
            }

    def _delete_admin(actor: dict, username: str) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return {"success": False, "message": "无权限", "data": {}}
        if not username:
            return {"success": False, "message": "管理员不存在", "data": {}}

        with db._connect() as conn:
            row = conn.execute(
                """
                SELECT *
                FROM users
                WHERE username = ? AND role = ?
                """,
                (username, ROLE_ADMIN),
            ).fetchone()
            if not row:
                return {"success": False, "message": "管理员不存在", "data": {}}

            admin = db._serialize_user(conn, row)
            conn.execute("DELETE FROM admin_card_quotas WHERE admin_user_id = ?", (row["id"],))
            conn.execute("DELETE FROM users WHERE id = ?", (row["id"],))
            return {
                "success": True,
                "message": "管理员已删除",
                "data": {"admin": admin},
            }

    @app.post("/api/auth/login")
    def login():
        result = db.login_user(
            _payload().get("username", ""),
            _payload().get("password", ""),
        )
        if result.get("success"):
            session["user"] = result["data"]["user"]
        return api_response(result)

    @app.post("/api/auth/register")
    def register():
        result = db.register_user(_payload())
        if result.get("success"):
            session["user"] = result["data"]["user"]
        return api_response(result)

    @app.post("/api/auth/logout")
    def logout():
        session.pop("user", None)
        return jsonify({"success": True, "message": "退出成功", "data": {}}), 200

    @app.get("/api/auth/session")
    def get_session():
        user, error = require_login()
        if error:
            return error
        return jsonify({"success": True, "message": "查询成功", "data": {"user": user}}), 200

    @app.get("/api/system/cards")
    def list_cards():
        user, error = require_login()
        if error:
            return error
        return api_response(db.list_license_cards(user))

    @app.post("/api/system/cards")
    def create_card():
        user, error = require_login()
        if error:
            return error
        return api_response(db.create_license_card(user, _payload()))

    @app.put("/api/system/cards/<card_key>")
    def update_card(card_key: str):
        user, error = require_login()
        if error:
            return error
        return api_response(db.update_license_card(user, card_key, _payload()))

    @app.delete("/api/system/cards/<card_key>")
    def delete_card(card_key: str):
        user, error = require_login()
        if error:
            return error
        return api_response(db.delete_license_card(user, card_key))

    @app.get("/api/system/users")
    def list_users():
        user, error = require_login()
        if error:
            return error
        return api_response(_list_users(user))

    @app.get("/api/system/admins")
    def list_admins():
        user, error = require_login()
        if error:
            return error
        return api_response(_list_admins(user))

    @app.post("/api/system/admins")
    def create_admin():
        user, error = require_login()
        if error:
            return error
        return api_response(db.create_admin(user, _payload()))

    @app.put("/api/system/admins/<username>/quota")
    def update_admin_quota(username: str):
        user, error = require_login()
        if error:
            return error
        return api_response(db.update_admin_quota(user, username, _payload()))

    @app.delete("/api/system/admins/<username>")
    def delete_admin(username: str):
        user, error = require_login()
        if error:
            return error
        return api_response(_delete_admin(user, username))

    return app
