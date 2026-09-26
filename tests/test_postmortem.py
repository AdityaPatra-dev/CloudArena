"""Unit tests for Post-Mortem generator."""

import tempfile
import unittest
from pathlib import Path

from cloudarena.attacks.base import AttackInfo
from cloudarena.detection.postmortem import generate_postmortem
from cloudarena.detection.state_machine import IncidentContext, IncidentState
from cloudarena.scoring.calculator import ScoreBreakdown
import cloudarena.detection.postmortem as pm_mod


class TestPostmortem(unittest.TestCase):
    def test_generate_postmortem_creates_valid_markdown(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            orig_dir = pm_mod.POSTMORTEMS_DIR
            try:
                pm_mod.POSTMORTEMS_DIR = Path(tmp_dir)

                info = AttackInfo(
                    wave_number=1,
                    name="rogue_cpu_hog",
                    title="Wave 1: Rogue CPU Hog",
                    difficulty="Beginner",
                    symptoms="High CPU",
                    expected_fix="Delete rogue pod",
                    description="Rogue crypto miner workload",
                )
                ctx = IncidentContext(
                    wave_number=1,
                    state=IncidentState.RESOLVED,
                    degradation_time=100.0,
                    resolved_time=180.0,
                )
                score = ScoreBreakdown(
                    wave_number=1,
                    base_points=100,
                    speed_bonus=70,
                    hint_penalty=10,
                    reset_penalty=0,
                    net_wave_score=160,
                    elapsed_seconds=80,
                )

                file_path = generate_postmortem(info, ctx, score)
                self.assertTrue(file_path.exists())

                content = file_path.read_text(encoding="utf-8")
                self.assertIn("Incident Post-Mortem: Wave 1", content)
                self.assertIn("Root Cause Analysis (RCA)", content)
                self.assertIn("SRE Lessons & Production Prevention", content)
                self.assertIn(f"**Total Points Awarded:** **{score.net_wave_score} pts**", content)
            finally:
                pm_mod.POSTMORTEMS_DIR = orig_dir


if __name__ == "__main__":
    unittest.main()
