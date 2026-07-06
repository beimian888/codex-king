import unittest
from pathlib import Path


class Python36CompatTest(unittest.TestCase):
    def test_server_entrypoints_do_not_use_pep604_union_types(self):
        root = Path(__file__).resolve().parents[1]
        checked_files = [
            root / "app.py",
            root / "system_database.py",
        ]

        offenders = []
        for path in checked_files:
            text = path.read_text(encoding="utf-8")
            if " | None" in text or "| None" in text:
                offenders.append(str(path.name))

        self.assertEqual(offenders, [])


if __name__ == "__main__":
    unittest.main()
