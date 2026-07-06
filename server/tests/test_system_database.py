import tempfile
import unittest
from datetime import datetime
from pathlib import Path

from server.system_database import SystemDatabase


def parse_dt(value):
    return datetime.strptime(value, "%Y-%m-%d %H:%M")


class SystemDatabaseTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db = SystemDatabase(str(Path(self.temp_dir.name) / "system.db"))
        self.db.init_schema()

    def tearDown(self):
        self.temp_dir.cleanup()

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
