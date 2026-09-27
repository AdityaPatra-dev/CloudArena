"""Cryptographic cluster attestation and anti-cheat proof generator."""

import base64
import hashlib
import hmac
import time
from typing import Optional
from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.k8s.client import get_core_v1, is_kubeconfig_present

NONCE_SECRET_NAME = "cloudarena-incident-nonce"
TARGET_NAMESPACE = "cloudarena-system"


def generate_wave_nonce(arena_token: str, wave: int, cluster_name: str, timestamp: Optional[float] = None) -> str:
    """Generate deterministic HMAC nonce for a wave attack session."""
    ts = timestamp or time.time()
    secret_key = (arena_token or "offline_dev_key").encode("utf-8")
    payload = f"wave:{wave}:cluster:{cluster_name}:ts:{int(ts)}".encode("utf-8")
    return hmac.new(secret_key, payload, hashlib.sha256).hexdigest()[:32]


def inject_cluster_nonce(nonce: str, wave: int) -> bool:
    """Inject cryptographic challenge nonce as a protected Secret inside the cluster."""
    if not is_kubeconfig_present():
        return False

    core_v1 = get_core_v1()
    now_str = str(int(time.time()))

    secret_body = client.V1Secret(
        metadata=client.V1ObjectMeta(
            name=NONCE_SECRET_NAME,
            namespace=TARGET_NAMESPACE,
            labels={"cloudarena.io/attestation": "true"},
        ),
        string_data={
            "nonce": nonce,
            "wave": str(wave),
            "injected_at": now_str,
        },
    )

    try:
        core_v1.create_namespaced_secret(namespace=TARGET_NAMESPACE, body=secret_body)
        return True
    except ApiException as e:
        if e.status == 409:
            # Already exists -> replace
            core_v1.replace_namespaced_secret(
                name=NONCE_SECRET_NAME,
                namespace=TARGET_NAMESPACE,
                body=secret_body,
            )
            return True
        return False
    except Exception:
        return False


def extract_cluster_nonce() -> Optional[str]:
    """Read the challenge nonce from the cluster secret."""
    if not is_kubeconfig_present():
        return None

    core_v1 = get_core_v1()
    try:
        secret = core_v1.read_namespaced_secret(name=NONCE_SECRET_NAME, namespace=TARGET_NAMESPACE)
        if secret.data and "nonce" in secret.data:
            return base64.b64decode(secret.data["nonce"]).decode("utf-8")
        elif secret.string_data and "nonce" in secret.string_data:
            return secret.string_data["nonce"]
    except Exception:
        return None
    return None


def generate_resolution_proof(arena_token: str, wave: int, elapsed_seconds: int, nonce: str) -> str:
    """Generate signed cryptographic proof of incident resolution."""
    secret_key = (arena_token or "offline_dev_key").encode("utf-8")
    message = f"RESOLVED:wave={wave}:elapsed={elapsed_seconds}:nonce={nonce}".encode("utf-8")
    return hmac.new(secret_key, message, hashlib.sha256).hexdigest()


def verify_resolution_proof(
    arena_token: str,
    wave: int,
    elapsed_seconds: int,
    nonce: str,
    provided_signature: str,
) -> bool:
    """Verify cryptographic proof of resolution on server-side."""
    expected = generate_resolution_proof(arena_token, wave, elapsed_seconds, nonce)
    return hmac.compare_digest(expected, provided_signature)
