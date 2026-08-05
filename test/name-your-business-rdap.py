#!/usr/bin/env python3

from io import BytesIO
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch
from urllib.error import HTTPError


CHECKER_PATH = Path(__file__).resolve().parents[1] / "skills" / "name-your-business" / "scripts" / "check_domains.py"
sys.dont_write_bytecode = True
SPEC = importlib.util.spec_from_file_location("name_your_business_domain_checker", CHECKER_PATH)
assert SPEC and SPEC.loader
CHECKER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CHECKER)


class FakeResponse(BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        self.close()
        return False


class DomainCheckerTests(unittest.TestCase):
    def test_registered_domain_uses_domain_object_and_events(self):
        payload = {
            "objectClassName": "domain",
            "ldhName": "HELD.EXAMPLE",
            "status": ["active"],
            "events": [
                {"eventAction": "registration", "eventDate": "2024-01-01T00:00:00Z"},
                {"eventAction": "expiration", "eventDate": "2027-01-01T00:00:00Z"},
            ],
        }
        response = FakeResponse(json.dumps(payload).encode("utf-8"))

        with patch.object(CHECKER, "urlopen", return_value=response):
            result = CHECKER.query_domain(
                "held.example",
                ["https://registry.example/rdap"],
                1.0,
                "2026-08-04T00:00:00Z",
            )

        self.assertEqual(result["registry_status"], "registered")
        self.assertEqual(result["registration_date"], "2024-01-01T00:00:00Z")
        self.assertEqual(result["expiration_date"], "2027-01-01T00:00:00Z")

    def test_not_found_is_only_a_no_record_signal(self):
        error = HTTPError(
            "https://registry.example/rdap/domain/open.example",
            404,
            "Not Found",
            None,
            None,
        )
        with patch.object(CHECKER, "urlopen", side_effect=error):
            result = CHECKER.query_domain(
                "open.example",
                ["https://registry.example/rdap"],
                1.0,
                "2026-08-04T00:00:00Z",
            )

        self.assertEqual(result["registry_status"], "no_record")
        self.assertIn("confirm with a live registrar", result["note"])
        self.assertNotIn("available", json.dumps(result).lower())

    def test_rate_limit_stays_unknown(self):
        error = HTTPError(
            "https://registry.example/rdap/domain/maybe.example",
            429,
            "Rate Limited",
            None,
            None,
        )
        with patch.object(CHECKER, "urlopen", side_effect=error):
            result = CHECKER.query_domain(
                "maybe.example",
                ["https://registry.example/rdap"],
                1.0,
                "2026-08-04T00:00:00Z",
            )

        self.assertEqual(result["registry_status"], "unknown")
        self.assertIn("HTTP 429", result["note"])

    def test_success_without_domain_object_stays_unknown(self):
        response = FakeResponse(json.dumps({"notices": []}).encode("utf-8"))
        with patch.object(CHECKER, "urlopen", return_value=response):
            result = CHECKER.query_domain(
                "ambiguous.example",
                ["https://registry.example/rdap"],
                1.0,
                "2026-08-04T00:00:00Z",
            )

        self.assertEqual(result["registry_status"], "unknown")
        self.assertIn("without an RDAP domain object", result["note"])


if __name__ == "__main__":
    unittest.main()
