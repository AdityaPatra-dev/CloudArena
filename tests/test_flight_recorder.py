"""Tests for Tournament Incident Flight Recorder and Replay Engine."""

import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from fastapi.testclient import TestClient

from cloudarena.telemetry.flight_recorder import (
    FlightRecorder,
    get_sample_replay,
    list_available_replays,
)
from cloudarena.backend.api.app import app


class TestFlightRecorder(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_sample_replay_structure(self):
        sample = get_sample_replay()
        self.assertEqual(sample["wave_number"], 8)
        self.assertEqual(sample["final_status"], "RESOLVED")
        self.assertGreater(len(sample["timeline"]), 3)
        self.assertIn("traffic_pct", sample["timeline"][0])
        self.assertIn("pods", sample["timeline"][0])

    def test_flight_recorder_session_lifecycle(self):
        recorder = FlightRecorder()
        recorder.start_session(wave=3, player_handle="sre_champion", event_id="HACK_2026")
        self.assertTrue(recorder.session_active)
        self.assertEqual(recorder.wave_number, 3)

        recorder.record(
            event_type="KUBECTL_GET_PODS",
            details="Investigating pod status in namespace",
            health_status="CRITICAL",
            traffic_pct=10.0,
            metadata={"command": "kubectl get pods -A"}
        )
        self.assertEqual(len(recorder.events), 2)  # WAVE_STARTED + KUBECTL_GET_PODS

        filepath = recorder.finish_session(outcome="RESOLVED", score=350)
        self.assertIsNotNone(filepath)
        self.assertTrue(Path(filepath).exists())
        self.assertFalse(recorder.session_active)

        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        self.assertEqual(data["player_handle"], "sre_champion")
        self.assertEqual(data["final_score"], 350)
        self.assertEqual(data["final_status"], "RESOLVED")
        self.assertGreaterEqual(len(data["timeline"]), 3)

    def test_list_replays(self):
        replays = list_available_replays()
        self.assertIsInstance(replays, list)

    def test_api_sample_replay(self):
        response = self.client.get("/api/v1/replays/sample")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["replay_id"], "rep_championship_winning_run")
        self.assertIn("timeline", data)

    def test_api_list_replays(self):
        response = self.client.get("/api/v1/replays/list")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("replays", data)
