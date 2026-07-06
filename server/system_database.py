import random
import sqlite3
import string
from contextlib import contextmanager
from datetime import datetime, timedelta

from werkzeug.security import check_password_hash, generate_password_hash


ROLE_SUPER_ADMIN = "super_admin"
ROLE_ADMIN = "admin"
ROLE_USER = "user"
LICENSE_LEVELS = ("月卡", "季卡", "年卡")
LICENSE_DURATION_DAYS = {"月卡": 30, "季卡": 90, "年卡": 365}
SUPER_ADMIN_USERNAME = "111"
SUPER_ADMIN_PASSWORD = "111"


def _now_text():
    return datetime.now().strftime("%Y-%m-%d %H:%M")


def _parse_dt(value):
    return datetime.strptime(value, "%Y-%m-%d %H:%M")


def _response(success, message, **data):
    return {"success": success, "message": message, "data": data}


class SystemDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path

    @contextmanager
    def _connect(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def init_schema(self) -> None:
        with self._connect() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    card_key TEXT,
                    level TEXT,
                    expires_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    last_login_at TEXT
                )
                """
            )
            self._ensure_user_columns(conn)
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS license_cards (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    card_key TEXT NOT NULL UNIQUE,
                    level TEXT NOT NULL,
                    remark TEXT DEFAULT '',
                    status TEXT NOT NULL,
                    user TEXT,
                    used_at TEXT,
                    expires_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    created_by TEXT NOT NULL
                )
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS admin_card_quotas (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    admin_user_id INTEGER NOT NULL,
                    level TEXT NOT NULL,
                    quota INTEGER NOT NULL DEFAULT 0,
                    used INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(admin_user_id, level),
                    FOREIGN KEY(admin_user_id) REFERENCES users(id)
                )
                """
            )

            existing = conn.execute(
                "SELECT id FROM users WHERE username = ?", (SUPER_ADMIN_USERNAME,)
            ).fetchone()
            if not existing:
                now = _now_text()
                conn.execute(
                    """
                    INSERT INTO users (username, password_hash, role, created_at, updated_at, last_login_at)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        SUPER_ADMIN_USERNAME,
                        generate_password_hash(SUPER_ADMIN_PASSWORD),
                        ROLE_SUPER_ADMIN,
                        now,
                        now,
                        None,
                    ),
                )

    def login_user(self, username: str, password: str) -> dict:
        with self._connect() as conn:
            row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
            if not row or not check_password_hash(row["password_hash"], password):
                return _response(False, "用户名或密码错误")

            now = _now_text()
            conn.execute(
                "UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?",
                (now, now, row["id"]),
            )
            refreshed = conn.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()
            return _response(True, "登录成功", user=self._serialize_user(conn, refreshed))

    def create_admin(self, actor: dict, payload: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")
        if payload.get("password") != payload.get("confirmPassword"):
            return _response(False, "两次密码不一致")

        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""
        if not username or not password:
            return _response(False, "用户名和密码不能为空")

        with self._connect() as conn:
            existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
            if existing:
                return _response(False, "用户名已存在")

            now = _now_text()
            cursor = conn.execute(
                """
                INSERT INTO users (username, password_hash, role, created_at, updated_at, last_login_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (username, generate_password_hash(password), ROLE_ADMIN, now, now, None),
            )
            admin_id = cursor.lastrowid
            quota_payload = payload.get("cardCreateQuota") or {}
            for level in LICENSE_LEVELS:
                conn.execute(
                    """
                    INSERT INTO admin_card_quotas (admin_user_id, level, quota, used)
                    VALUES (?, ?, ?, 0)
                    """,
                    (admin_id, level, int(quota_payload.get(level, 0))),
                )

            admin = conn.execute("SELECT * FROM users WHERE id = ?", (admin_id,)).fetchone()
            return _response(True, "管理员创建成功", admin=self._serialize_user(conn, admin))

    def create_license_card(self, actor: dict, payload: dict) -> dict:
        if actor.get("role") not in {ROLE_SUPER_ADMIN, ROLE_ADMIN}:
            return _response(False, "无权限")

        level = payload.get("level")
        if level not in LICENSE_LEVELS:
            return _response(False, "无效的卡密类型")

        with self._connect() as conn:
            if actor.get("role") == ROLE_ADMIN:
                admin_row = conn.execute(
                    "SELECT * FROM users WHERE username = ?", (actor.get("username"),)
                ).fetchone()
                quota_row = conn.execute(
                    """
                    SELECT * FROM admin_card_quotas
                    WHERE admin_user_id = ? AND level = ?
                    """,
                    (admin_row["id"], level),
                ).fetchone()
                if not quota_row or quota_row["used"] >= quota_row["quota"]:
                    return _response(False, "该类型卡密创建额度不足")

            now = _now_text()
            card_key = self._generate_card_key(conn)
            conn.execute(
                """
                INSERT INTO license_cards (
                    card_key, level, remark, status, user, used_at, expires_at,
                    created_at, updated_at, created_by
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    card_key,
                    level,
                    payload.get("remark", ""),
                    "unused",
                    None,
                    None,
                    None,
                    now,
                    now,
                    actor["username"],
                ),
            )
            if actor.get("role") == ROLE_ADMIN:
                conn.execute(
                    """
                    UPDATE admin_card_quotas
                    SET used = used + 1
                    WHERE admin_user_id = (
                        SELECT id FROM users WHERE username = ?
                    ) AND level = ?
                    """,
                    (actor["username"], level),
                )

            row = conn.execute(
                "SELECT * FROM license_cards WHERE card_key = ?", (card_key,)
            ).fetchone()
            return _response(True, "卡密创建成功", card=self._serialize_card(row))

    def register_user(self, payload: dict) -> dict:
        if payload.get("password") != payload.get("confirmPassword"):
            return _response(False, "两次密码不一致")

        username = (payload.get("username") or "").strip()
        password = payload.get("password") or ""
        card_key = (payload.get("cardKey") or "").strip()
        if not username or not password or not card_key:
            return _response(False, "注册信息不完整")

        with self._connect() as conn:
            existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
            if existing:
                return _response(False, "用户名已存在")

            card = conn.execute(
                "SELECT * FROM license_cards WHERE card_key = ?", (card_key,)
            ).fetchone()
            if not card or card["status"] != "unused":
                return _response(False, "卡密不可用")

            now = datetime.now()
            now_text = now.strftime("%Y-%m-%d %H:%M")
            expires_at = (now + timedelta(days=LICENSE_DURATION_DAYS[card["level"]])).strftime(
                "%Y-%m-%d %H:%M"
            )
            cursor = conn.execute(
                """
                INSERT INTO users (
                    username, password_hash, role, card_key, level, expires_at,
                    created_at, updated_at, last_login_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    username,
                    generate_password_hash(password),
                    ROLE_USER,
                    card_key,
                    card["level"],
                    expires_at,
                    now_text,
                    now_text,
                    None,
                ),
            )
            conn.execute(
                """
                UPDATE license_cards
                SET status = ?, user = ?, used_at = ?, expires_at = ?, updated_at = ?
                WHERE id = ?
                """,
                ("used", username, now_text, expires_at, now_text, card["id"]),
            )
            user = conn.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
            return _response(True, "注册成功", user=self._serialize_user(conn, user))

    def list_license_cards(self, actor: dict) -> dict:
        with self._connect() as conn:
            if actor.get("role") == ROLE_SUPER_ADMIN:
                rows = conn.execute(
                    "SELECT * FROM license_cards ORDER BY id DESC"
                ).fetchall()
            elif actor.get("role") == ROLE_ADMIN:
                rows = conn.execute(
                    """
                    SELECT * FROM license_cards
                    WHERE created_by = ?
                    ORDER BY id DESC
                    """,
                    (actor.get("username"),),
                ).fetchall()
            else:
                return _response(False, "无权限")

            return _response(
                True,
                "查询成功",
                licenseCards=[self._serialize_card(row) for row in rows],
            )

    def update_license_card(self, actor: dict, card_key: str, payload: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")

        with self._connect() as conn:
            card = conn.execute(
                "SELECT * FROM license_cards WHERE card_key = ?", (card_key,)
            ).fetchone()
            if not card:
                return _response(False, "卡密不存在")

            level = payload.get("level", card["level"])
            if level not in LICENSE_LEVELS:
                return _response(False, "无效的卡密类型")

            remark = payload.get("remark", card["remark"])
            now = _now_text()
            next_expires_at = card["expires_at"]
            if card["status"] == "used" and level != card["level"]:
                next_expires_at = self._calculate_expires_at(card["used_at"], level)
            conn.execute(
                """
                UPDATE license_cards
                SET level = ?, remark = ?, expires_at = ?, updated_at = ?
                WHERE card_key = ?
                """,
                (level, remark, next_expires_at, now, card_key),
            )
            self._rebalance_admin_quota_usage(conn, card, level)
            if card["status"] == "used":
                self._sync_used_card_user(conn, card["user"], card["card_key"], level, next_expires_at, now)
            updated = conn.execute(
                "SELECT * FROM license_cards WHERE card_key = ?", (card_key,)
            ).fetchone()
            return _response(True, "卡密更新成功", card=self._serialize_card(updated))

    def delete_license_card(self, actor: dict, card_key: str) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")

        with self._connect() as conn:
            card = conn.execute(
                "SELECT * FROM license_cards WHERE card_key = ?", (card_key,)
            ).fetchone()
            if not card:
                return _response(False, "卡密不存在")
            self._adjust_admin_quota_used(conn, card["created_by"], card["level"], -1)
            conn.execute("DELETE FROM license_cards WHERE card_key = ?", (card_key,))
            return _response(True, "卡密删除成功", card=self._serialize_card(card))

    def update_admin_quota(self, actor: dict, username: str, quota: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")

        with self._connect() as conn:
            admin = conn.execute(
                "SELECT * FROM users WHERE username = ? AND role = ?",
                (username, ROLE_ADMIN),
            ).fetchone()
            if not admin:
                return _response(False, "管理员不存在")

            for level in LICENSE_LEVELS:
                conn.execute(
                    """
                    UPDATE admin_card_quotas
                    SET quota = ?
                    WHERE admin_user_id = ? AND level = ?
                    """,
                    (int(quota.get(level, 0)), admin["id"], level),
                )
            refreshed = conn.execute("SELECT * FROM users WHERE id = ?", (admin["id"],)).fetchone()
            return _response(True, "额度更新成功", admin=self._serialize_user(conn, refreshed))

    def list_users(self, actor: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")

        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM users
                WHERE role = ?
                ORDER BY id DESC
                """,
                (ROLE_USER,),
            ).fetchall()
            return _response(
                True,
                "查询成功",
                users=[self._serialize_user(conn, row) for row in rows],
            )

    def list_admins(self, actor: dict) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")

        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT *
                FROM users
                WHERE role IN (?, ?)
                ORDER BY id ASC
                """,
                (ROLE_SUPER_ADMIN, ROLE_ADMIN),
            ).fetchall()
            return _response(
                True,
                "查询成功",
                admins=[self._serialize_user(conn, row) for row in rows],
            )

    def delete_admin(self, actor: dict, username: str) -> dict:
        if actor.get("role") != ROLE_SUPER_ADMIN:
            return _response(False, "无权限")
        if not username:
            return _response(False, "管理员不存在")

        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT *
                FROM users
                WHERE username = ? AND role = ?
                """,
                (username, ROLE_ADMIN),
            ).fetchone()
            if not row:
                return _response(False, "管理员不存在")

            admin = self._serialize_user(conn, row)
            conn.execute("DELETE FROM admin_card_quotas WHERE admin_user_id = ?", (row["id"],))
            conn.execute("DELETE FROM users WHERE id = ?", (row["id"],))
            return _response(True, "管理员已删除", admin=admin)

    def _serialize_user(self, conn, row):
        data = {
            "id": row["id"],
            "username": row["username"],
            "role": row["role"],
            "cardKey": row["card_key"] if "card_key" in row.keys() else None,
            "level": row["level"] if "level" in row.keys() else None,
            "expiresAt": row["expires_at"] if "expires_at" in row.keys() else None,
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "lastLoginAt": row["last_login_at"],
        }
        if row["role"] == ROLE_ADMIN:
            quota_rows = conn.execute(
                """
                SELECT level, quota, used
                FROM admin_card_quotas
                WHERE admin_user_id = ?
                """,
                (row["id"],),
            ).fetchall()
            data["cardCreateQuota"] = {item["level"]: item["quota"] for item in quota_rows}
            data["cardCreateUsed"] = {item["level"]: item["used"] for item in quota_rows}
        return data

    def _serialize_card(self, row):
        return {
            "id": row["id"],
            "cardKey": row["card_key"],
            "level": row["level"],
            "remark": row["remark"],
            "status": row["status"],
            "user": row["user"],
            "usedAt": row["used_at"],
            "expiresAt": row["expires_at"],
            "createdAt": row["created_at"],
            "updatedAt": row["updated_at"],
            "createdBy": row["created_by"],
        }

    def _generate_card_key(self, conn):
        alphabet = string.ascii_uppercase + string.digits
        while True:
            segment_a = "".join(random.choices(alphabet, k=4))
            segment_b = "".join(random.choices(alphabet, k=4))
            card_key = f"XYZW-{segment_a}-{segment_b}"
            existing = conn.execute(
                "SELECT 1 FROM license_cards WHERE card_key = ?", (card_key,)
            ).fetchone()
            if not existing:
                return card_key

    def _ensure_user_columns(self, conn):
        columns = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
        if "card_key" not in columns:
            conn.execute("ALTER TABLE users ADD COLUMN card_key TEXT")
        if "level" not in columns:
            conn.execute("ALTER TABLE users ADD COLUMN level TEXT")
        if "expires_at" not in columns:
            conn.execute("ALTER TABLE users ADD COLUMN expires_at TEXT")

    def _calculate_expires_at(self, used_at, level):
        return (_parse_dt(used_at) + timedelta(days=LICENSE_DURATION_DAYS[level])).strftime(
            "%Y-%m-%d %H:%M"
        )

    def _rebalance_admin_quota_usage(self, conn, card, next_level):
        if card["level"] == next_level:
            return
        self._adjust_admin_quota_used(conn, card["created_by"], card["level"], -1)
        self._adjust_admin_quota_used(conn, card["created_by"], next_level, 1)

    def _adjust_admin_quota_used(self, conn, username, level, delta):
        admin = conn.execute(
            "SELECT id FROM users WHERE username = ? AND role = ?",
            (username, ROLE_ADMIN),
        ).fetchone()
        if not admin:
            return

        quota = conn.execute(
            """
            SELECT used
            FROM admin_card_quotas
            WHERE admin_user_id = ? AND level = ?
            """,
            (admin["id"], level),
        ).fetchone()
        if not quota:
            return

        conn.execute(
            """
            UPDATE admin_card_quotas
            SET used = ?
            WHERE admin_user_id = ? AND level = ?
            """,
            (max(quota["used"] + delta, 0), admin["id"], level),
        )

    def _sync_used_card_user(self, conn, username, card_key, level, expires_at, updated_at):
        if not username:
            return
        conn.execute(
            """
            UPDATE users
            SET card_key = ?, level = ?, expires_at = ?, updated_at = ?
            WHERE username = ? AND role = ?
            """,
            (card_key, level, expires_at, updated_at, username, ROLE_USER),
        )
