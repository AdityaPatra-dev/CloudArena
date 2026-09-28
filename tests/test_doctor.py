"""Tests for Cross-Platform Environment Doctor."""

import unittest
from unittest.mock import patch

from cloudarena.cli.doctor_cmd import (
    DiagnosticResult,
    check_cloudarena_home,
    check_disk_space,
    check_dns_resolution,
    check_memory,
    check_os_arch,
    check_port_availability,
    check_python_environment,
    check_registry_connectivity,
    check_tooling_binaries,
    check_virtualization,
    run_all_diagnostics,
)


class TestDoctorDiagnostics(unittest.TestCase):

    def test_run_all_diagnostics_count(self):
        results = run_all_diagnostics()
        self.assertEqual(len(results), 12)
        for r in results:
            self.assertIsInstance(r, DiagnosticResult)
            self.assertIn(r.status, ("PASS", "WARN", "FAIL"))
            self.assertTrue(len(r.name) > 0)
            self.assertTrue(len(r.message) > 0)

    def test_check_os_arch(self):
        res = check_os_arch()
        self.assertIn(res.status, ("PASS", "WARN"))

    def test_check_python_environment(self):
        res = check_python_environment()
        self.assertEqual(res.status, "PASS")
        self.assertIn("Python", res.message)

    def test_check_cloudarena_home(self):
        res = check_cloudarena_home()
        self.assertEqual(res.status, "PASS")

    def test_check_disk_space(self):
        res = check_disk_space()
        self.assertIn(res.status, ("PASS", "WARN", "FAIL"))

    def test_check_dns_resolution(self):
        res = check_dns_resolution()
        self.assertEqual(res.status, "PASS")

    def test_check_port_availability(self):
        res = check_port_availability()
        self.assertIn(res.status, ("PASS", "WARN"))

    @patch("cloudarena.cli.doctor_cmd.find_binary", return_value=None)
    def test_check_tooling_missing_binaries(self, mock_find):
        res = check_tooling_binaries()
        self.assertEqual(res.status, "FAIL")
        self.assertIn("Missing", res.message)
        self.assertIsNotNone(res.remediation)


if __name__ == "__main__":
    unittest.main()
