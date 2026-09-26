"""Unit tests for Phase 5 AI Incident Mentor and progressive hint engine."""

import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from cloudarena.core.config import AppConfig, load_config, save_config
import cloudarena.core.config as cfg_mod
from cloudarena.mentor.catalog import get_hint_tier, _HINT_CATALOG
from cloudarena.mentor.engine import MentorEngine
from cloudarena.mentor.llm import query_llm_mentor
from cloudarena.telemetry.collector import ClusterTelemetry


class TestMentor(unittest.TestCase):
    def test_catalog_all_waves_and_levels(self):
        for wave in range(1, 5):
            self.assertIn(wave, _HINT_CATALOG)
            for level in (1, 2, 3):
                hint = get_hint_tier(wave, level)
                self.assertIsNotNone(hint, f"Missing hint for wave {wave} level {level}")
                self.assertEqual(hint.level, level)
                self.assertIn(hint.cost_pts, (10, 25, 50))
                self.assertTrue(len(hint.content) > 10)

    def test_hint_progression_and_limit(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_file = Path(tmp_dir) / "config.yaml"
            orig = cfg_mod.CONFIG_FILE
            try:
                cfg_mod.CONFIG_FILE = test_file
                cfg = AppConfig()
                cfg.game.current_wave = 1
                cfg.game.hints_used_in_wave = 0
                save_config(cfg)

                # Hint 1 (Directional)
                wave, level, cost = MentorEngine.get_next_hint_info()
                self.assertEqual((wave, level, cost), (1, 1, 10))
                h1, src = MentorEngine.request_hint(force_offline=True)
                self.assertIsNotNone(h1)
                self.assertEqual(h1.level, 1)
                self.assertEqual(h1.cost_pts, 10)

                # Hint 2 (Diagnostic)
                wave, level, cost = MentorEngine.get_next_hint_info()
                self.assertEqual((wave, level, cost), (1, 2, 25))
                h2, src = MentorEngine.request_hint(force_offline=True)
                self.assertIsNotNone(h2)
                self.assertEqual(h2.level, 2)
                self.assertEqual(h2.cost_pts, 25)

                # Hint 3 (Tactical Clue)
                wave, level, cost = MentorEngine.get_next_hint_info()
                self.assertEqual((wave, level, cost), (1, 3, 50))
                h3, src = MentorEngine.request_hint(force_offline=True)
                self.assertIsNotNone(h3)
                self.assertEqual(h3.level, 3)
                self.assertEqual(h3.cost_pts, 50)

                # Hint 4 (Exceeded limit)
                h4, reason = MentorEngine.request_hint(force_offline=True)
                self.assertIsNone(h4)
                self.assertIn("Maximum hint limit (3) has been reached", reason)

                cfg_reloaded = load_config()
                self.assertEqual(cfg_reloaded.game.hints_used_in_wave, 3)
            finally:
                cfg_mod.CONFIG_FILE = orig

    def test_llm_query_returns_none_when_unconfigured(self):
        telemetry = ClusterTelemetry(is_app_healthy=False)
        with patch.dict("os.environ", {}, clear=True):
            res = query_llm_mentor(wave=1, level=1, telemetry=telemetry)
            self.assertIsNone(res)


if __name__ == "__main__":
    unittest.main()
