import os
from pathlib import Path

from flask import Flask, jsonify, request, session
from flask_cors import CORS

from server.system_database import SystemDatabase


def create_app(db_path: str | None = None, *, init_schema: bool = True) -> Flask:
    SystemDatabase.load_env_file()

    app = Flask(__name__)
    CORS(app, supports_credentials=True)
    app.secret_key = os.environ.get("XYZW_SECRET_KEY", "xyzw-dev-secret-key")

    if db_path:
        resolved_db_path = Path(db_path)
        resolved_db_path.parent.mkdir(parents=True, exist_ok=True)
        db = SystemDatabase(str(resolved_db_path))
    else:
        db = SystemDatabase.from_env()

    if init_schema:
        db.init_schema()

    def current_user():
        return session.get("user")

    def error_status(message: str) -> int:
        if any(marker in message for marker in ("无权限", "只有", "不能删除", "鏃犳潈闄", "鍙湁", "涓嶈兘鍒犻櫎")):
            return 403
        if any(marker in message for marker in ("请先登录", "登录已失效", "璇峰厛鐧诲綍", "鐧诲綍宸插け鏁")):
            return 401
        return 400

    def api_response(result: dict, success_status: int = 200):
        status_code = success_status if result.get("success") else error_status(result.get("message", ""))
        return jsonify(result), status_code

    def require_login():
        user = current_user()
        if not user:
            return None, (jsonify({"success": False, "message": "请先登录", "data": {}}), 401)

        result = db.get_user_session_state(user.get("username"))
        if not result.get("success"):
            session.pop("user", None)
            return None, api_response(result)

        session["user"] = result["data"]["user"]
        return result["data"]["user"], None

    def payload():
        return request.get_json(silent=True) or {}

    @app.post("/api/auth/login")
    def login():
        result = db.login_user(
            payload().get("username", ""),
            payload().get("password", ""),
        )
        if result.get("success"):
            session["user"] = result["data"]["user"]
        return api_response(result)

    @app.post("/api/auth/register")
    def register():
        result = db.register_user(payload())
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
        return api_response(db.create_license_card(user, payload()))

    @app.put("/api/system/cards/<card_key>")
    def update_card(card_key: str):
        user, error = require_login()
        if error:
            return error
        return api_response(db.update_license_card(user, card_key, payload()))

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
        return api_response(db.list_users(user))

    @app.get("/api/system/admins")
    def list_admins():
        user, error = require_login()
        if error:
            return error
        return api_response(db.list_admins(user))

    @app.post("/api/system/admins")
    def create_admin():
        user, error = require_login()
        if error:
            return error
        return api_response(db.create_admin(user, payload()))

    @app.put("/api/system/admins/<username>/quota")
    def update_admin_quota(username: str):
        user, error = require_login()
        if error:
            return error
        return api_response(db.update_admin_quota(user, username, payload()))

    @app.delete("/api/system/admins/<username>")
    def delete_admin(username: str):
        user, error = require_login()
        if error:
            return error
        return api_response(db.delete_admin(user, username))

    return app
