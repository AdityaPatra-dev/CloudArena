"""Tests for Squad and Team Co-op CTF mode across CLI, DB, and FastAPI backend."""

import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from cloudarena.backend.api.app import app
from cloudarena.backend.database.db import (
    get_connection,
    get_team_roster,
    get_team_standings,
    join_team,
    leave_team,
    submit_score,
)
from cloudarena.core.config import PlayerConfig


class TestSquadAndTeams(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_teams.db"
        self.conn = get_connection(self.db_path)
        self.conn.close()
        self.client = TestClient(app)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_player_config_squad_defaults(self):
        cfg = PlayerConfig(handle="pilot")
        self.assertIsNone(cfg.team_id)
        self.assertIsNone(cfg.team_name)
        self.assertEqual(cfg.team_role, "Operator")
        self.assertTrue(cfg.solo_mode)

        # Enlisted cadet
        team_cfg = PlayerConfig(
            handle="neo",
            team_id="SQ-TITAN",
            team_name="Squad Titan",
            team_role="SRE Lead",
            solo_mode=False,
        )
        self.assertEqual(team_cfg.team_id, "SQ-TITAN")
        self.assertEqual(team_cfg.team_name, "Squad Titan")
        self.assertEqual(team_cfg.team_role, "SRE Lead")
        self.assertFalse(team_cfg.solo_mode)

    def test_database_team_operations(self):
        # 1. Join Team
        join_team(
            team_id="SQUAD_ALPHA",
            team_name="Alpha Centauri",
            handle="cadet_one",
            role="Captain",
            event_id="HACK_2026",
            db_path=self.db_path,
        )
        join_team(
            team_id="SQUAD_ALPHA",
            team_name="Alpha Centauri",
            handle="cadet_two",
            role="Chaos Specialist",
            event_id="HACK_2026",
            db_path=self.db_path,
        )

        # 2. Check Roster
        roster = get_team_roster("SQUAD_ALPHA", db_path=self.db_path)
        self.assertEqual(len(roster), 2)
        handles = [r["handle"] for r in roster]
        self.assertIn("cadet_one", handles)
        self.assertIn("cadet_two", handles)

        # 3. Submit Scores
        submit_score(
            event_id="HACK_2026",
            handle="cadet_one",
            wave_number=1,
            base_points=100,
            speed_bonus=20,
            hint_penalty=0,
            reset_penalty=0,
            net_score=120,
            elapsed_seconds=60,
            db_path=self.db_path,
        )
        submit_score(
            event_id="HACK_2026",
            handle="cadet_two",
            wave_number=2,
            base_points=150,
            speed_bonus=30,
            hint_penalty=0,
            reset_penalty=0,
            net_score=180,
            elapsed_seconds=80,
            db_path=self.db_path,
        )

        # 4. Check Team Standings
        standings = get_team_standings(event_id="HACK_2026", db_path=self.db_path)
        self.assertEqual(len(standings), 1)
        team = standings[0]
        self.assertEqual(team["team_id"], "SQUAD_ALPHA")
        self.assertEqual(team["team_name"], "Alpha Centauri")
        self.assertEqual(team["total_score"], 300)  # 120 + 180
        self.assertEqual(team["waves_cleared"], 2)
        self.assertEqual(team["member_count"], 2)

        # 5. Leave Team
        leave_team("SQUAD_ALPHA", "cadet_two", db_path=self.db_path)
        roster_after = get_team_roster("SQUAD_ALPHA", db_path=self.db_path)
        self.assertEqual(len(roster_after), 1)
        self.assertEqual(roster_after[0]["handle"], "cadet_one")

    def test_api_teams_endpoints(self):
        # 1. Join Team Endpoint
        res_join = self.client.post("/api/v1/teams/join", json={
            "team_id": "SQ_DELTA",
            "team_name": "Delta Force",
            "handle": "delta_lead",
            "role": "Captain",
            "event_id": "TEST_EVENT",
        })
        self.assertEqual(res_join.status_code, 200)

        # 2. Roster Endpoint
        res_roster = self.client.get("/api/v1/teams/roster", params={"team_id": "SQ_DELTA"})
        self.assertEqual(res_roster.status_code, 200)
        self.assertEqual(len(res_roster.json()["members"]), 1)

        # 3. Submit Score with Team ID
        res_score = self.client.post("/api/v1/score", json={
            "event_id": "TEST_EVENT",
            "handle": "delta_lead",
            "team_id": "SQ_DELTA",
            "team_name": "Delta Force",
            "team_role": "Captain",
            "wave_number": 1,
            "base_points": 100,
            "speed_bonus": 50,
            "hint_penalty": 0,
            "reset_penalty": 0,
            "net_score": 150,
            "elapsed_seconds": 45,
        })
        self.assertEqual(res_score.status_code, 200)

        # 4. Standings Endpoint
        res_standings = self.client.get("/api/v1/teams/standings", params={"event_id": "TEST_EVENT"})
        self.assertEqual(res_standings.status_code, 200)
        teams = res_standings.json()["standings"]
        self.assertTrue(any(t["team_id"] == "SQ_DELTA" for t in teams))


if __name__ == "__main__":
    unittest.main()
