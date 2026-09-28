"""Tests for Chaos Custom Scenario Plugin System & SDK."""

import tempfile
import unittest
from pathlib import Path

from cloudarena.attacks.custom import (
    CustomScenario,
    create_scenario_template,
    list_scenarios,
    load_scenario,
)


class TestCustomScenario(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_create_and_load_template(self):
        target_path = Path(self.temp_dir.name) / "test_outage.yaml"
        created_path = create_scenario_template(target_path, name="Test Outage Challenge")
        self.assertTrue(created_path.exists())

        scenario = load_scenario(created_path)
        self.assertIsInstance(scenario, CustomScenario)
        self.assertEqual(scenario.info.title, "Test Outage Challenge")
        self.assertEqual(scenario.info.wave_number, 999)
        self.assertEqual(scenario.info.difficulty, "Intermediate")
        self.assertEqual(len(scenario.hints), 3)
        self.assertIn("Hint 1", scenario.hints[0])
        self.assertTrue(len(scenario.mentor_guidance) > 10)

    def test_nonexistent_file_raises_error(self):
        nonexistent = Path(self.temp_dir.name) / "does_not_exist.yaml"
        with self.assertRaises(FileNotFoundError):
            load_scenario(nonexistent)

    def test_custom_scenario_metadata_properties(self):
        manifest_data = {
            "scenario_id": "pod_delete_flood",
            "name": "Rapid Pod Deletion Storm",
            "difficulty": "Boss",
            "author": "GDG Chaos Crew",
            "target_namespace": "prod-workloads",
            "symptoms": "Pods are repeatedly evicted.",
            "expected_fix": "Fix resource quotas.",
            "description": "High stress scenario.",
            "hints": ["Check events", "Check quotas"],
            "mentor_guidance": "Focus on ResourceQuota object in the namespace."
        }
        scenario = CustomScenario(manifest_data)
        self.assertEqual(scenario.info.name, "pod_delete_flood")
        self.assertEqual(scenario.info.title, "Rapid Pod Deletion Storm")
        self.assertEqual(scenario.info.difficulty, "Boss")
        self.assertEqual(scenario.hints, ["Check events", "Check quotas"])
        self.assertEqual(scenario.mentor_guidance, "Focus on ResourceQuota object in the namespace.")

    def test_list_scenarios(self):
        scenarios = list_scenarios()
        self.assertIsInstance(scenarios, list)


if __name__ == "__main__":
    unittest.main()
