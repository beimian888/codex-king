import tempfile
import unittest
from datetime import datetime
from pathlib import Path
import sqlite3

from server.system_database import SystemDatabase


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
        with sqlite3.connect(self.db.db_path) as conn:
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
        with sqlite3.connect(self.db.db_path) as conn:
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


if __name__ == "__main__":
    unittest.main()
