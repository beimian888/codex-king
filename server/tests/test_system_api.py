import tempfile
import unittest
from pathlib import Path
import sqlite3
from contextlib import closing

from server.app import create_app


class SystemApiTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.app = create_app(str(Path(self.temp_dir.name) / "system.db"))
        self.client = self.app.test_client()

    def tearDown(self):
        try:
            self.temp_dir.cleanup()
        except PermissionError:
            pass

    def login(self, username="111", password="111"):
        return self.client.post(
            "/api/auth/login",
            json={"username": username, "password": password},
        )

    def create_card(self, level="月卡", remark="api"):
        return self.client.post(
            "/api/system/cards",
            json={"level": level, "remark": remark},
        )

    def test_login_session_and_card_crud(self):
        unauthenticated = self.client.get("/api/auth/session")
        self.assertEqual(unauthenticated.status_code, 401)
        self.assertFalse(unauthenticated.get_json()["success"])

        login = self.login()
        self.assertEqual(login.status_code, 200)
        self.assertTrue(login.get_json()["success"])
        self.assertEqual(login.get_json()["data"]["user"]["role"], "super_admin")

        session = self.client.get("/api/auth/session")
        self.assertEqual(session.status_code, 200)
        self.assertEqual(session.get_json()["data"]["user"]["username"], "111")

        created = self.create_card()
        self.assertEqual(created.status_code, 200)
        card = created.get_json()["data"]["card"]
        self.assertTrue(card["cardKey"].startswith("XYZW-"))

        listed = self.client.get("/api/system/cards")
        self.assertEqual(listed.status_code, 200)
        self.assertTrue(
            any(
                item["cardKey"] == card["cardKey"]
                for item in listed.get_json()["data"]["licenseCards"]
            )
        )

        updated = self.client.put(
            f"/api/system/cards/{card['cardKey']}",
            json={"level": "季卡", "remark": "changed"},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["data"]["card"]["level"], "季卡")

        deleted = self.client.delete(f"/api/system/cards/{card['cardKey']}")
        self.assertEqual(deleted.status_code, 200)
        self.assertTrue(deleted.get_json()["success"])

        logout = self.client.post("/api/auth/logout")
        self.assertEqual(logout.status_code, 200)
        self.assertTrue(logout.get_json()["success"])

        ended = self.client.get("/api/auth/session")
        self.assertEqual(ended.status_code, 401)

    def test_register_requires_unused_card(self):
        self.login()
        card = self.client.post(
            "/api/system/cards",
            json={"level": "年卡", "remark": "signup"},
        ).get_json()["data"]["card"]

        registered = self.client.post(
            "/api/auth/register",
            json={
                "username": "bob",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardKey": card["cardKey"],
            },
        )
        self.assertEqual(registered.status_code, 200)
        self.assertTrue(registered.get_json()["success"])
        self.assertEqual(registered.get_json()["data"]["user"]["role"], "user")

        reused = self.client.post(
            "/api/auth/register",
            json={
                "username": "bob2",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardKey": card["cardKey"],
            },
        )
        self.assertEqual(reused.status_code, 400)
        self.assertFalse(reused.get_json()["success"])

        denied_users = self.client.get("/api/system/users")
        self.assertEqual(denied_users.status_code, 403)

        self.login()
        users = self.client.get("/api/system/users")
        self.assertEqual(users.status_code, 200)
        self.assertTrue(
            any(user["username"] == "bob" for user in users.get_json()["data"]["users"])
        )

    def test_admin_permissions_and_admin_routes_use_session(self):
        unauthenticated = self.client.get("/api/system/admins")
        self.assertEqual(unauthenticated.status_code, 401)
        self.assertFalse(unauthenticated.get_json()["success"])

        self.login()

        created_admin = self.client.post(
            "/api/system/admins",
            json={
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"月卡": 1, "季卡": 0, "年卡": 0},
            },
        )
        self.assertEqual(created_admin.status_code, 200)
        self.assertTrue(created_admin.get_json()["success"])

        admins = self.client.get("/api/system/admins")
        self.assertEqual(admins.status_code, 200)
        self.assertTrue(
            any(admin["username"] == "manager" for admin in admins.get_json()["data"]["admins"])
        )

        updated_quota = self.client.put(
            "/api/system/admins/manager/quota",
            json={"月卡": 2, "季卡": 1, "年卡": 0},
        )
        self.assertEqual(updated_quota.status_code, 200)
        self.assertEqual(
            updated_quota.get_json()["data"]["admin"]["cardCreateQuota"]["月卡"],
            2,
        )

        self.login("manager", "secret123")
        created = self.create_card(remark="manager")
        self.assertEqual(created.status_code, 200)
        card_key = created.get_json()["data"]["card"]["cardKey"]

        denied_delete = self.client.delete(f"/api/system/cards/{card_key}")
        self.assertEqual(denied_delete.status_code, 403)
        self.assertFalse(denied_delete.get_json()["success"])

        forbidden_admin_create = self.client.post(
            "/api/system/admins",
            json={
                "username": "blocked",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"月卡": 1, "季卡": 0, "年卡": 0},
            },
        )
        self.assertEqual(forbidden_admin_create.status_code, 403)

        self.login()
        deleted_admin = self.client.delete("/api/system/admins/manager")
        self.assertEqual(deleted_admin.status_code, 200)
        self.assertTrue(deleted_admin.get_json()["success"])

        admins_after_delete = self.client.get("/api/system/admins")
        self.assertFalse(
            any(
                admin["username"] == "manager"
                for admin in admins_after_delete.get_json()["data"]["admins"]
            )
        )

    def test_deleted_admin_session_is_rejected_for_card_routes(self):
        self.login()
        self.client.post(
            "/api/system/admins",
            json={
                "username": "manager",
                "password": "secret123",
                "confirmPassword": "secret123",
                "cardCreateQuota": {"鏈堝崱": 1, "瀛ｅ崱": 0, "骞村崱": 0},
            },
        )
        self.login("manager", "secret123")

        db_path = Path(self.temp_dir.name) / "system.db"
        with closing(sqlite3.connect(db_path)) as conn:
            conn.execute("DELETE FROM admin_card_quotas WHERE admin_user_id IN (SELECT id FROM users WHERE username = ?)", ("manager",))
            conn.execute("DELETE FROM users WHERE username = ?", ("manager",))
            conn.commit()

        listed = self.client.get("/api/system/cards")
        self.assertIn(listed.status_code, (401, 403))
        self.assertFalse(listed.get_json()["success"])

        created = self.create_card(remark="stale-session")
        self.assertIn(created.status_code, (401, 403))
        self.assertFalse(created.get_json()["success"])

        session = self.client.get("/api/auth/session")
        self.assertEqual(session.status_code, 401)
        self.assertFalse(session.get_json()["success"])


if __name__ == "__main__":
    unittest.main()
