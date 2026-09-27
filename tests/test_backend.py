"""Unit tests for backend database manager and FastAPI leaderboard server."""

import os
import tempfile
import unittest
from pathlib import Path
from fastapi.testclient import TestClient

from cloudarena.attestation.proof import generate_resolution_proof
from cloudarena.backend.api.app import app
from cloudarena.backend.database.db import (
    get_active_participants,
    get_connection,
    get_event_config,
    get_leaderboard_standings,
    get_user_by_token,
    join_event,
    record_heartbeat,
    submit_score,
    update_event_config,
    upsert_user,
)


class TestDatabase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp_dir.name) / "test_leaderboard.db"

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_schema_init_and_join_event(self):
        join_event(event_id="HACK_2026", handle="neo", db_path=self.db_path)
        standings = get_leaderboard_standings(event_id="HACK_2026", db_path=self.db_path)
        self.assertEqual(len(standings), 1)
        self.assertEqual(standings[0]["handle"], "neo")
        self.assertEqual(standings[0]["total_score"], 0)

    def test_submit_score_and_ranking(self):
        submit_score("HACK_2026", "player_b", 1, 100, 20, 0, 0, 120, 45, db_path=self.db_path)
        submit_score("HACK_2026", "player_a", 1, 100, 40, 0, 0, 140, 30, db_path=self.db_path)
        
        standings = get_leaderboard_standings(event_id="HACK_2026", db_path=self.db_path)
        self.assertEqual(len(standings), 2)
        # player_a has 140 pts, player_b has 120 pts
        self.assertEqual(standings[0]["handle"], "player_a")
        self.assertEqual(standings[0]["rank"], 1)
        self.assertEqual(standings[1]["handle"], "player_b")
        self.assertEqual(standings[1]["rank"], 2)

    def test_user_upsert_and_token_lookup(self):
        token = "ca_live_test12345678"
        user = upsert_user("u123", "alice@example.com", "alice", token, "player", db_path=self.db_path)
        self.assertEqual(user["arena_token"], token)

        found = get_user_by_token(token, db_path=self.db_path)
        self.assertIsNotNone(found)
        self.assertEqual(found["handle"], "alice")
        self.assertEqual(found["email"], "alice@example.com")

        missing = get_user_by_token("nonexistent_token", db_path=self.db_path)
        self.assertIsNone(missing)

    def test_event_config_and_update(self):
        cfg = get_event_config("HACK_2026", db_path=self.db_path)
        self.assertEqual(cfg["status"], "OPEN")
        self.assertFalse(cfg["is_frozen"])

        updated = update_event_config(
            "HACK_2026",
            status="IN_PROGRESS",
            is_frozen=True,
            active_wave=2,
            db_path=self.db_path,
        )
        self.assertEqual(updated["status"], "IN_PROGRESS")
        self.assertTrue(updated["is_frozen"])
        self.assertEqual(updated["active_wave"], 2)

    def test_heartbeat_and_active_participants(self):
        record_heartbeat("trinity", "HACK_2026", 2, "UNDER_ATTACK", 85, 45.0, db_path=self.db_path)
        parts = get_active_participants("HACK_2026", db_path=self.db_path)
        self.assertEqual(len(parts), 1)
        self.assertEqual(parts[0]["handle"], "trinity")
        self.assertEqual(parts[0]["live_wave"], 2)
        self.assertEqual(parts[0]["status"], "UNDER_ATTACK")


class TestApi(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_health(self):
        res = self.client.get("/api/v1/health")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["status"], "healthy")

    def test_mint_and_verify_token(self):
        mint_res = self.client.post("/api/v1/auth/mint", json={
            "email": "test@arena.io",
            "handle": "morpheus",
        })
        self.assertEqual(mint_res.status_code, 200)
        token = mint_res.json()["user"]["arena_token"]
        self.assertTrue(token.startswith("ca_live_"))

        verify_res = self.client.post("/api/v1/auth/verify", json={
            "arena_token": token,
        })
        self.assertEqual(verify_res.status_code, 200)
        self.assertEqual(verify_res.json()["user"]["handle"], "morpheus")

    def test_verify_invalid_token_returns_401(self):
        res = self.client.post("/api/v1/auth/verify", json={
            "arena_token": "ca_live_bogus_token",
        })
        self.assertEqual(res.status_code, 401)

    def test_submit_score_with_valid_cryptographic_attestation(self):
        token = "ca_live_test_valid_proof"
        wave = 3
        elapsed = 110
        nonce = "nonce_k8s_secret_12345"

        proof = generate_resolution_proof(token, wave, elapsed, nonce)

        res = self.client.post("/api/v1/score", json={
            "event_id": "TEST_HACKATHON",
            "handle": "proof_tester",
            "wave_number": wave,
            "base_points": 100,
            "speed_bonus": 30,
            "hint_penalty": 0,
            "reset_penalty": 0,
            "net_score": 130,
            "elapsed_seconds": elapsed,
            "arena_token": token,
            "cluster_nonce": nonce,
            "proof_signature": proof,
        })
        self.assertEqual(res.status_code, 200)

    def test_submit_score_with_tampered_proof_returns_403(self):
        token = "ca_live_test_valid_proof"
        res = self.client.post("/api/v1/score", json={
            "event_id": "TEST_HACKATHON",
            "handle": "cheater",
            "wave_number": 3,
            "base_points": 100,
            "speed_bonus": 30,
            "hint_penalty": 0,
            "reset_penalty": 0,
            "net_score": 130,
            "elapsed_seconds": 110,
            "arena_token": token,
            "cluster_nonce": "real_nonce",
            "proof_signature": "fake_forged_signature_12345",
        })
        self.assertEqual(res.status_code, 403)
        self.assertIn("Anti-Cheat Violation", res.json()["detail"])

    def test_heartbeat_and_admin_endpoints(self):
        # Send heartbeat
        hb_res = self.client.post("/api/v1/heartbeat", json={
            "handle": "pilot",
            "event_id": "HACK_EVENT",
            "live_wave": 1,
            "status": "INCIDENT_ACTIVE",
            "elapsed_s": 50,
            "traffic_pct": 82.5,
        })
        self.assertEqual(hb_res.status_code, 200)

        # Admin participants query
        admin_res = self.client.get("/api/v1/admin/participants?event_id=HACK_EVENT")
        self.assertEqual(admin_res.status_code, 200)
        self.assertTrue(admin_res.json()["total"] >= 1)

        # Admin config update
        cfg_res = self.client.post("/api/v1/admin/config", json={
            "event_id": "HACK_EVENT",
            "status": "IN_PROGRESS",
            "active_wave": 2,
        })
        self.assertEqual(cfg_res.status_code, 200)
        self.assertEqual(cfg_res.json()["config"]["active_wave"], 2)


if __name__ == "__main__":
    unittest.main()

