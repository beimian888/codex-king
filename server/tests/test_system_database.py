import tempfile
import unittest
from contextlib import closing
from datetime import datetime
from pathlib import Path
import sqlite3
from unittest.mock import patch

from server.system_database import LICENSE_LEVELS, SystemDatabase


def parse_dt(value):
    return datetime.strptime(value, "%Y-%m-%d %H:%M")


class SystemDatabaseTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db = SystemDatabase(str(Path(self.temp_dir.name) / "system.db"))
        self.db.init_schema()

    def tearDown(self):
        try:
            self.temp_dir.cleanup()
        except PermissionError:
            pass

    def fetch_admin_quota(self, username):
        with closing(sqlite3.connect(self.db.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute(
                """
                SELECT q.level, q.quota, q.used
                FROM admin_card_quotas q
                JOIN users u ON u.id = q.admin_user_id
                WHERE u.username = ?
                ORDER BY q.level
                """,
                (username,),
            ).fetchall()
        return {row["level"]: {"quota": row["quota"], "used": row["used"]} for row in rows}

    def fetch_user_row(self, username):
        with closing(sqlite3.connect(self.db.db_path)) as conn:
            conn.row_factory = sqlite3.Row
            row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
        return dict(row) if row else None

    def test_super_admin_is_seeded_and_can_login(self):
        result = self.db.login_user("111", "111")
        self.assertTrue(result["success"])
        self.assertEqual(result["data"]["user"]["role"], "super_admin")
        self.assertEqual(result["message"], "登录成功")

    def test_card_activation_starts_expiry_clock(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        card = self.db.create_license_card(super_admin, {"level": "月卡", "remark": "first"})["data"]["card"]

        registered = self.db.register_user(
            {
                "username": "alice",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardKey": card["cardKey"],
            }
        )

        self.assertTrue(registered["success"])
        cards = self.db.list_license_cards(super_admin)["data"]["licenseCards"]
        activated = next(item for item in cards if item["cardKey"] == card["cardKey"])
        self.assertEqual(activated["status"], "used")
        self.assertEqual(activated["user"], "alice")
        self.assertEqual((parse_dt(activated["expiresAt"]) - parse_dt(activated["usedAt"])).days, 30)

        user_row = self.fetch_user_row("alice")
        self.assertEqual(user_row["level"], "月卡")
        self.assertEqual(user_row["expires_at"], activated["expiresAt"])

    def test_admin_quota_and_visibility_are_enforced(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        created_admin = self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"月卡": 1, "季卡": 0, "年卡": 0},
            },
        )
        self.assertTrue(created_admin["success"])

        manager = self.db.login_user("manager", "secret123")["data"]["user"]
        first = self.db.create_license_card(manager, {"level": "月卡", "remark": "owned"})
        second = self.db.create_license_card(manager, {"level": "月卡", "remark": "over"})
        year_card = self.db.create_license_card(manager, {"level": "年卡", "remark": "denied"})

        self.assertTrue(first["success"])
        self.assertFalse(second["success"])
        self.assertIn("额度", second["message"])
        self.assertFalse(year_card["success"])

        manager_cards = self.db.list_license_cards(manager)["data"]["licenseCards"]
        self.assertEqual(len(manager_cards), 1)
        self.assertEqual(manager_cards[0]["createdBy"], "manager")

        all_cards = self.db.list_license_cards(super_admin)["data"]["licenseCards"]
        self.assertGreaterEqual(len(all_cards), 1)
        self.assertTrue(any(card["cardKey"] == first["data"]["card"]["cardKey"] for card in all_cards))

        denied_update = self.db.update_license_card(manager, first["data"]["card"]["cardKey"], {"remark": "no"})
        denied_delete = self.db.delete_license_card(manager, first["data"]["card"]["cardKey"])
        self.assertFalse(denied_update["success"])
        self.assertFalse(denied_delete["success"])

    def test_normal_user_cannot_create_license_card(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        card = self.db.create_license_card(super_admin, {"level": "月卡", "remark": "first"})["data"]["card"]
        self.db.register_user(
            {
                "username": "alice",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardKey": card["cardKey"],
            }
        )
        alice = self.db.login_user("alice", "secret123")["data"]["user"]

        result = self.db.create_license_card(alice, {"level": "月卡", "remark": "blocked"})

        self.assertFalse(result["success"])

    def test_create_license_card_ignores_payload_card_key(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]

        result = self.db.create_license_card(
            super_admin,
            {"level": "月卡", "remark": "first", "cardKey": "XYZW-FAKE-FAKE"},
        )

        self.assertTrue(result["success"])
        self.assertNotEqual(result["data"]["card"]["cardKey"], "XYZW-FAKE-FAKE")

    def test_create_license_card_returns_failure_when_admin_actor_no_longer_exists(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"鏈堝崱": 1, "瀛ｅ崱": 0, "骞村崱": 0},
            },
        )
        manager = self.db.login_user("manager", "secret123")["data"]["user"]

        with closing(sqlite3.connect(self.db.db_path)) as conn:
            conn.execute("DELETE FROM admin_card_quotas WHERE admin_user_id IN (SELECT id FROM users WHERE username = ?)", ("manager",))
            conn.execute("DELETE FROM users WHERE username = ?", ("manager",))
            conn.commit()

        result = self.db.create_license_card(manager, {"level": "鏈堝崱", "remark": "ghost"})

        self.assertFalse(result["success"])

    def test_super_admin_rebalances_admin_quota_when_moving_or_deleting_unused_card(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"月卡": 2, "季卡": 2, "年卡": 1},
            },
        )
        manager = self.db.login_user("manager", "secret123")["data"]["user"]
        month_card = self.db.create_license_card(manager, {"level": "月卡", "remark": "owned"})["data"]["card"]
        season_card = self.db.create_license_card(manager, {"level": "季卡", "remark": "owned"})["data"]["card"]

        initial = self.fetch_admin_quota("manager")
        self.assertEqual(initial["月卡"]["used"], 1)
        self.assertEqual(initial["季卡"]["used"], 1)

        moved = self.db.update_license_card(
            super_admin,
            month_card["cardKey"],
            {"level": "季卡", "remark": "moved"},
        )
        after_move = self.fetch_admin_quota("manager")
        self.assertTrue(moved["success"])
        self.assertEqual(after_move["月卡"]["used"], 0)
        self.assertEqual(after_move["季卡"]["used"], 2)

        deleted = self.db.delete_license_card(super_admin, season_card["cardKey"])
        after_delete = self.fetch_admin_quota("manager")
        self.assertTrue(deleted["success"])
        self.assertEqual(after_delete["季卡"]["used"], 1)

        self.db.delete_license_card(super_admin, month_card["cardKey"])
        after_second_delete = self.fetch_admin_quota("manager")
        self.assertEqual(after_second_delete["季卡"]["used"], 0)
        self.assertGreaterEqual(after_second_delete["季卡"]["used"], 0)

    def test_updating_used_card_level_recomputes_expiry_and_syncs_user(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        card = self.db.create_license_card(super_admin, {"level": "月卡", "remark": "first"})["data"]["card"]
        self.db.register_user(
            {
                "username": "alice",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardKey": card["cardKey"],
            }
        )

        before = next(
            item
            for item in self.db.list_license_cards(super_admin)["data"]["licenseCards"]
            if item["cardKey"] == card["cardKey"]
        )
        updated = self.db.update_license_card(super_admin, card["cardKey"], {"level": "年卡"})
        after = updated["data"]["card"]

        self.assertTrue(updated["success"])
        self.assertEqual(after["status"], "used")
        self.assertEqual(after["usedAt"], before["usedAt"])
        self.assertEqual((parse_dt(after["expiresAt"]) - parse_dt(after["usedAt"])).days, 365)

        user_row = self.fetch_user_row("alice")
        self.assertEqual(user_row["level"], "年卡")
        self.assertEqual(user_row["expires_at"], after["expiresAt"])

    def test_super_admin_can_update_quota_and_delete_cards(self):
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"月卡": 1, "季卡": 1, "年卡": 1},
            },
        )
        quota = self.db.update_admin_quota(super_admin, "manager", {"月卡": 2, "季卡": 3, "年卡": 4})
        self.assertTrue(quota["success"])
        self.assertEqual(quota["data"]["admin"]["cardCreateQuota"]["年卡"], 4)

        card = self.db.create_license_card(super_admin, {"level": "季卡", "remark": "delete me"})["data"]["card"]
        updated = self.db.update_license_card(super_admin, card["cardKey"], {"level": "年卡", "remark": "changed"})
        deleted = self.db.delete_license_card(super_admin, card["cardKey"])

        self.assertTrue(updated["success"])
        self.assertEqual(updated["data"]["card"]["level"], "年卡")
        self.assertTrue(deleted["success"])


    def test_super_admin_can_list_users_and_admins(self):
        month_level, season_level, year_level = LICENSE_LEVELS
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        card = self.db.create_license_card(super_admin, {"level": month_level, "remark": "signup"})["data"]["card"]
        self.db.register_user(
            {
                "username": "alice",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardKey": card["cardKey"],
            }
        )
        self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {month_level: 1, season_level: 0, year_level: 0},
            },
        )

        users = self.db.list_users(super_admin)
        admins = self.db.list_admins(super_admin)

        self.assertTrue(users["success"])
        self.assertTrue(any(user["username"] == "alice" for user in users["data"]["users"]))
        self.assertTrue(admins["success"])
        self.assertTrue(any(admin["username"] == "111" for admin in admins["data"]["admins"]))
        self.assertTrue(any(admin["username"] == "manager" for admin in admins["data"]["admins"]))

    def test_non_super_admin_cannot_list_or_delete_admins(self):
        month_level, season_level, year_level = LICENSE_LEVELS
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {month_level: 1, season_level: 0, year_level: 0},
            },
        )
        manager = self.db.login_user("manager", "secret123")["data"]["user"]

        users = self.db.list_users(manager)
        admins = self.db.list_admins(manager)
        deleted = self.db.delete_admin(manager, "manager")

        self.assertFalse(users["success"])
        self.assertFalse(admins["success"])
        self.assertFalse(deleted["success"])

    def test_super_admin_can_delete_admin(self):
        month_level, season_level, year_level = LICENSE_LEVELS
        super_admin = self.db.login_user("111", "111")["data"]["user"]
        self.db.create_admin(
            super_admin,
            {
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {month_level: 1, season_level: 0, year_level: 0},
            },
        )

        deleted = self.db.delete_admin(super_admin, "manager")
        admins = self.db.list_admins(super_admin)

        self.assertTrue(deleted["success"])
        self.assertEqual(deleted["data"]["admin"]["username"], "manager")
        self.assertFalse(any(admin["username"] == "manager" for admin in admins["data"]["admins"]))

    def test_from_env_builds_mysql_config_for_server_deploy(self):
        with patch.dict(
            "os.environ",
            {
                "DB_HOST": "127.0.0.1",
                "DB_PORT": "3306",
                "DB_NAME": "xyzw_system",
                "DB_USER": "xyzw_system",
                "DB_PASSWORD": "secret",
            },
            clear=True,
        ):
            db = SystemDatabase.from_env()

        self.assertEqual(db.engine, "mysql")
        self.assertEqual(db.config["host"], "127.0.0.1")
        self.assertEqual(db.config["port"], 3306)
        self.assertEqual(db.config["database"], "xyzw_system")
        self.assertEqual(db.config["user"], "xyzw_system")
        self.assertEqual(db.config["password"], "secret")

    def test_from_env_can_read_dotenv_file(self):
        env_path = Path(self.temp_dir.name) / ".env"
        env_path.write_text(
            "\n".join(
                [
                    "DB_HOST=127.0.0.1",
                    "DB_PORT=3307",
                    "DB_NAME=xyzw_system",
                    "DB_USER=xyzw_system",
                    "DB_PASSWORD=from_file",
                ]
            ),
            encoding="utf-8",
        )

        with patch.dict("os.environ", {}, clear=True):
            db = SystemDatabase.from_env(env_path)

        self.assertEqual(db.config["port"], 3307)
        self.assertEqual(db.config["password"], "from_file")


if __name__ == "__main__":
    unittest.main()
