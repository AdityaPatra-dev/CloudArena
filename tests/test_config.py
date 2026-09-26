"""Tests for configuration persistence and default values using unittest."""

import tempfile
import unittest
from pathlib import Path
from cloudarena.core.config import AppConfig, load_config, save_config
import cloudarena.core.config as config_mod


class TestConfig(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.test_config_file = Path(self.temp_dir.name) / "config.yaml"
        self._orig_config_file = config_mod.CONFIG_FILE
        config_mod.CONFIG_FILE = self.test_config_file

    def tearDown(self):
        config_mod.CONFIG_FILE = self._orig_config_file
        self.temp_dir.cleanup()

    def test_default_config(self):
        cfg = load_config()
        self.assertEqual(cfg.player.handle, "cadet")
        self.assertTrue(cfg.player.solo_mode)
        self.assertEqual(cfg.cluster.cluster_name, "cloudarena-cluster")
        self.assertEqual(cfg.cluster.worker_nodes, 2)
        self.assertEqual(cfg.game.total_score, 0)
        self.assertEqual(cfg.game.current_wave, 0)

    def test_save_and_reload_config(self):
        cfg = AppConfig()
        cfg.player.handle = "neo"
        cfg.game.total_score = 450
        cfg.game.completed_waves = [1, 2]
        save_config(cfg)

        reloaded = load_config()
        self.assertEqual(reloaded.player.handle, "neo")
        self.assertEqual(reloaded.game.total_score, 450)
        self.assertEqual(reloaded.game.completed_waves, [1, 2])


if __name__ == "__main__":
    unittest.main()
