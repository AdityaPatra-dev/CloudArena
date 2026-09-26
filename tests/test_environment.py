"""Tests for environment inspection and binary locator using unittest."""

import tempfile
import unittest
from pathlib import Path
from cloudarena.core.environment import audit_environment, find_binary
import cloudarena.core.environment as env_mod


class TestEnvironment(unittest.TestCase):
    def test_audit_environment_structure(self):
        status = audit_environment()
        self.assertGreaterEqual(status.cpu_cores, 1)
        self.assertGreater(status.ram_gb, 0)
        self.assertIn(status.os_name, ("Linux", "Darwin", "Windows"))
        self.assertGreaterEqual(len(status.checks), 6)

    def test_find_binary_fallback(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            mock_bin_dir = Path(temp_dir) / "bin"
            mock_bin_dir.mkdir(parents=True, exist_ok=True)
            fake_k3d = mock_bin_dir / "k3d"
            fake_k3d.write_text("#!/bin/sh\necho k3d")
            fake_k3d.chmod(0o755)

            orig_bin_dir = env_mod.BIN_DIR
            try:
                env_mod.BIN_DIR = mock_bin_dir
                res = find_binary("k3d")
                self.assertEqual(res, str(fake_k3d))
            finally:
                env_mod.BIN_DIR = orig_bin_dir


if __name__ == "__main__":
    unittest.main()
