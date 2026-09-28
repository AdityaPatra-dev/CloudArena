"""Tournament Replay & Incident Audit Log (Flight Recorder)."""

import json
import time
from pathlib import Path
from typing import Any, Optional

from cloudarena.core.paths import REPLAYS_DIR, ensure_directories


class FlightRecorder:
    """Records high-resolution chronological events during an active wave for replay playback."""

    def __init__(self):
        self.session_active: bool = False
        self.wave_number: int = 0
        self.player_handle: str = "cadet"
        self.event_id: str = "HACKATHON_2026"
        self.start_time: float = 0.0
        self.events: list[dict[str, Any]] = []

    def start_session(self, wave: int, player_handle: str = "cadet", event_id: str = "HACKATHON_2026") -> None:
        """Initialize a new recording session when a wave starts."""
        self.session_active = True
        self.wave_number = wave
        self.player_handle = player_handle
        self.event_id = event_id
        self.start_time = time.time()
        self.events = []
        self.record(
            event_type="WAVE_STARTED",
            details=f"Attack Wave {wave} initialized and chaos injected.",
            health_status="CRITICAL",
            traffic_pct=0.0,
        )

    def record(
        self,
        event_type: str,
        details: str,
        health_status: str = "CRITICAL",
        traffic_pct: float = 0.0,
        metadata: Optional[dict[str, Any]] = None,
    ) -> None:
        """Record an incident timeline milestone with elapsed seconds."""
        elapsed = round(time.time() - self.start_time, 2) if self.start_time > 0 else 0.0
        entry = {
            "timestamp": time.time(),
            "offset_seconds": elapsed,
            "event_type": event_type,
            "details": details,
            "health_status": health_status,  # CRITICAL, DEGRADED, STABILIZING, HEALTHY
            "traffic_pct": traffic_pct,
            "metadata": metadata or {},
        }
        self.events.append(entry)

    def finish_session(self, outcome: str = "RESOLVED", score: int = 100) -> Optional[Path]:
        """Save the flight log to disk as replay JSON file."""
        if not self.session_active:
            return None

        self.record(
            event_type=f"SESSION_{outcome.upper()}",
            details=f"Wave concluded with status '{outcome}' and score {score} pts.",
            health_status="HEALTHY" if outcome == "RESOLVED" else "CRITICAL",
            traffic_pct=100.0 if outcome == "RESOLVED" else 0.0,
        )

        ensure_directories()
        timestamp_str = time.strftime("%Y%m%d_%H%M%S")
        filename = f"replay_wave{self.wave_number}_{self.player_handle}_{timestamp_str}.json"
        filepath = REPLAYS_DIR / filename

        replay_data = {
            "replay_id": f"rep_{self.player_handle}_{timestamp_str}",
            "wave_number": self.wave_number,
            "player_handle": self.player_handle,
            "event_id": self.event_id,
            "start_time": self.start_time,
            "duration_seconds": round(time.time() - self.start_time, 1),
            "final_status": outcome,
            "final_score": score,
            "timeline": self.events,
        }

        try:
            with open(filepath, "w", encoding="utf-8") as f:
                json.dump(replay_data, f, indent=2)
            self.session_active = False
            return filepath
        except Exception:
            self.session_active = False
            return None


# Global Flight Recorder singleton
flight_recorder = FlightRecorder()


def get_sample_replay() -> dict[str, Any]:
    """Return an official sample championship replay for demonstration and projector viewing."""
    return {
        "replay_id": "rep_championship_winning_run",
        "wave_number": 8,
        "wave_name": "Corrupted Ingress TLS Handshake Boss Wave",
        "player_handle": "aditya_sre",
        "event_id": "HACKATHON_2026",
        "duration_seconds": 94.5,
        "final_status": "RESOLVED",
        "final_score": 670,
        "timeline": [
            {
                "offset_seconds": 0.0,
                "event_type": "WAVE_STARTED",
                "details": "Chaos injected: Corrupted TLS private key in secret 'cloudarena-tls'. Ingress SSL handshake failing.",
                "health_status": "CRITICAL",
                "traffic_pct": 0.0,
                "pods": {"frontend": "CrashLoop", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 12.4,
                "event_type": "KUBECTL_PROBE",
                "details": "Cadet ran: kubectl get pods -n cloudarena-app",
                "health_status": "CRITICAL",
                "traffic_pct": 0.0,
                "pods": {"frontend": "CrashLoop", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 25.1,
                "event_type": "DIAGNOSTIC_LOGS",
                "details": "Cadet inspected ingress controller logs: SSL_do_handshake() failed (SSL: error:0407008B:rsa routines:RSA_padding_check_PKCS1_type_2).",
                "health_status": "CRITICAL",
                "traffic_pct": 0.0,
                "pods": {"frontend": "Error", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 45.8,
                "event_type": "REMEDIATION_ACTION",
                "details": "Cadet regenerated trusted TLS secret and patched Ingress tls.secretName.",
                "health_status": "DEGRADED",
                "traffic_pct": 42.5,
                "pods": {"frontend": "ContainerCreating", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 61.2,
                "event_type": "TRAFFIC_RECOVERY",
                "details": "HTTPS handshake successful. Traffic proxying resumed at 95.8% success.",
                "health_status": "STABILIZING",
                "traffic_pct": 95.8,
                "pods": {"frontend": "Running", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 71.2,
                "event_type": "STABILIZATION_WINDOW",
                "details": "Entered 10-second anti-flap stabilization verification countdown.",
                "health_status": "STABILIZING",
                "traffic_pct": 100.0,
                "pods": {"frontend": "Running", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 81.2,
                "event_type": "INCIDENT_RESOLVED",
                "details": "10s stabilization passed with zero restarts. Cryptographic HMAC proof generated.",
                "health_status": "HEALTHY",
                "traffic_pct": 100.0,
                "pods": {"frontend": "Running", "backend": "Running", "cache": "Running"}
            },
            {
                "offset_seconds": 84.5,
                "event_type": "SCORE_SYNCED",
                "details": "Net score +670 pts attested and synced to Cloud Leaderboard.",
                "health_status": "HEALTHY",
                "traffic_pct": 100.0,
                "pods": {"frontend": "Running", "backend": "Running", "cache": "Running"}
            }
        ]
    }


def list_available_replays() -> list[dict[str, Any]]:
    """List saved replay logs in ~/.cloudarena/replays/."""
    ensure_directories()
    replays = []
    for f in REPLAYS_DIR.glob("*.json"):
        try:
            with open(f, "r", encoding="utf-8") as rf:
                data = json.load(rf)
                replays.append({
                    "filename": f.name,
                    "filepath": str(f),
                    "replay_id": data.get("replay_id", f.stem),
                    "wave_number": data.get("wave_number", 0),
                    "player_handle": data.get("player_handle", "cadet"),
                    "duration_seconds": data.get("duration_seconds", 0),
                    "final_score": data.get("final_score", 0),
                    "event_count": len(data.get("timeline", [])),
                })
        except Exception:
            pass
    return sorted(replays, key=lambda x: x.get("filename", ""), reverse=True)
