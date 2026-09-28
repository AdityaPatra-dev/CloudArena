"""Client-side synchronization with central CloudArena leaderboard server."""

from typing import Optional
import requests

from cloudarena.attestation.proof import extract_cluster_nonce, generate_resolution_proof
from cloudarena.core.config import load_config
from cloudarena.scoring.calculator import ScoreBreakdown


def sync_score_to_server(breakdown: ScoreBreakdown) -> bool:
    """Post wave completion score with cryptographic attestation to central server."""
    config = load_config()
    server_url = config.central_server_url.rstrip("/")

    token = config.player.arena_token or "dev_token"
    cluster_nonce = extract_cluster_nonce() or "local_dev_nonce"
    proof = generate_resolution_proof(
        arena_token=token,
        wave=breakdown.wave_number,
        elapsed_seconds=breakdown.elapsed_seconds,
        nonce=cluster_nonce,
    )

    payload = {
        "event_id": config.player.event_id or "solo",
        "handle": config.player.handle or "cadet",
        "wave_number": breakdown.wave_number,
        "base_points": breakdown.base_points,
        "speed_bonus": breakdown.speed_bonus,
        "hint_penalty": breakdown.hint_penalty,
        "reset_penalty": breakdown.reset_penalty,
        "net_score": breakdown.net_wave_score,
        "elapsed_seconds": breakdown.elapsed_seconds,
        "cluster_nonce": cluster_nonce,
        "proof_signature": proof,
    }

    try:
        resp = requests.post(f"{server_url}/api/v1/score", json=payload, timeout=2.5)
        return resp.status_code == 200
    except Exception:
        # Offline-first resilience: never fail local gameplay if central server is unreachable
        return False


def fetch_remote_leaderboard(event_id: Optional[str] = None) -> Optional[list[dict]]:
    """Fetch live standings list from central leaderboard server."""
    config = load_config()
    server_url = config.central_server_url.rstrip("/")
    url = f"{server_url}/api/v1/leaderboard"
    params = {}
    if event_id:
        params["event_id"] = event_id
    elif config.player.event_id:
        params["event_id"] = config.player.event_id

    try:
        resp = requests.get(url, params=params, timeout=3.0)
        if resp.status_code == 200:
            return resp.json().get("standings", [])
    except Exception:
        pass
    return None

