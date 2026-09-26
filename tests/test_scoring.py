"""Unit tests for Phase 4 scoring calculator and persistence."""

import tempfile
import unittest
from pathlib import Path

from cloudarena.core.config import AppConfig, load_config
import cloudarena.core.config as cfg_mod
from cloudarena.scoring.calculator import (
    BASE_WAVE_POINTS,
    calculate_wave_score,
    record_wave_completion,
)


class TestScoring(unittest.TestCase):
    def test_instant_clear_max_speed_bonus(self):
        breakdown = calculate_wave_score(wave=1, elapsed_seconds=5, hints_used=0, resets_used=0)
        self.assertEqual(breakdown.base_points, 100)
        self.assertGreaterEqual(breakdown.speed_bonus, 95)
        self.assertEqual(breakdown.hint_penalty, 0)
        self.assertEqual(breakdown.reset_penalty, 0)
        self.assertGreaterEqual(breakdown.net_wave_score, 195)

    def test_slow_clear_zero_speed_bonus(self):
        breakdown = calculate_wave_score(wave=2, elapsed_seconds=360, hints_used=0)
        self.assertEqual(breakdown.speed_bonus, 0)
        self.assertEqual(breakdown.net_wave_score, 100)

    def test_hint_and_reset_penalties(self):
        # 2 hints (-35) and 1 reset (-20)
        breakdown = calculate_wave_score(wave=1, elapsed_seconds=150, hints_used=2, resets_used=1)
        self.assertEqual(breakdown.hint_penalty, 35)
        self.assertEqual(breakdown.reset_penalty, 20)
        # 100 base + 50 speed - 35 hints - 20 reset = 95
        self.assertEqual(breakdown.net_wave_score, 95)

    def test_score_floor_guarantee(self):
        # Heavy penalties should not drive score below 10 pts
        breakdown = calculate_wave_score(wave=1, elapsed_seconds=400, hints_used=3, resets_used=5)
        self.assertEqual(breakdown.net_wave_score, 10)

    def test_record_wave_completion_updates_config(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            test_file = Path(tmp_dir) / "config.yaml"
            orig = cfg_mod.CONFIG_FILE
            try:
                cfg_mod.CONFIG_FILE = test_file
                breakdown = calculate_wave_score(wave=1, elapsed_seconds=60, hints_used=0)
                total = record_wave_completion(breakdown)
                self.assertEqual(total, breakdown.net_wave_score)

                cfg = load_config()
                self.assertEqual(cfg.game.total_score, breakdown.net_wave_score)
                self.assertIn(1, cfg.game.completed_waves)
                self.assertEqual(cfg.game.current_wave, 2)
            finally:
                cfg_mod.CONFIG_FILE = orig


if __name__ == "__main__":
    unittest.main()
