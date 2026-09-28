"""Attack scenarios registry, lifecycle management, and snapshot reset."""

import time
from typing import Optional

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.attacks.wave1_cpu import Wave1CpuAttack
from cloudarena.attacks.wave2_memory import Wave2MemoryAttack
from cloudarena.attacks.wave3_probe import Wave3ProbeAttack
from cloudarena.attacks.wave4_traffic import Wave4TrafficAttack
from cloudarena.attacks.wave5_dns import Wave5DnsAttack
from cloudarena.attacks.wave6_storage import Wave6StorageAttack
from cloudarena.attacks.wave7_rbac import Wave7RbacAttack
from cloudarena.attacks.wave8_tls import Wave8TlsAttack
from cloudarena.core.config import load_config, save_config
from cloudarena.k8s.client import is_kubeconfig_present
from cloudarena.k8s.deployer import deploy_base_workloads, wait_for_workloads_ready

_ATTACK_REGISTRY: dict[int, BaseAttack] = {
    1: Wave1CpuAttack(),
    2: Wave2MemoryAttack(),
    3: Wave3ProbeAttack(),
    4: Wave4TrafficAttack(),
    5: Wave5DnsAttack(),
    6: Wave6StorageAttack(),
    7: Wave7RbacAttack(),
    8: Wave8TlsAttack(),
}


def get_attack(wave: int) -> BaseAttack:
    """Retrieve attack handler by wave number (1 to 8)."""
    if wave not in _ATTACK_REGISTRY:
        raise ValueError(f"Unknown wave number {wave}. Available waves: {list(_ATTACK_REGISTRY.keys())}")
    return _ATTACK_REGISTRY[wave]


def list_all_attacks() -> list[AttackInfo]:
    """Return metadata for all available attack waves."""
    return [atk.info for atk in _ATTACK_REGISTRY.values()]


def launch_wave(wave: int) -> AttackInfo:
    """Inject failure for the specified wave and update game state."""
    if not is_kubeconfig_present():
        raise RuntimeError("CloudArena cluster is not active. Run `cloudarena start` first.")

    attack = get_attack(wave)
    # Rollback any active attack first
    for a in _ATTACK_REGISTRY.values():
        try:
            a.rollback()
        except Exception:
            pass

    config = load_config()
    from cloudarena.attestation.proof import generate_wave_nonce, inject_cluster_nonce
    token = config.player.arena_token or "offline_token"
    nonce = generate_wave_nonce(token, wave, config.cluster.cluster_name)
    try:
        inject_cluster_nonce(nonce, wave)
    except Exception:
        pass

    attack.inject()

    config.game.current_wave = wave
    config.game.wave_start_time = time.time()
    config.game.hints_used_in_wave = 0
    save_config(config)

    return attack.info


def rollback_wave(wave: int) -> bool:
    """Roll back the specified attack wave."""
    attack = get_attack(wave)
    return attack.rollback()


def check_wave_resolution(wave: int) -> tuple[bool, str]:
    """Inspect whether the current wave incident has been resolved."""
    if not is_kubeconfig_present():
        return False, "Cluster is not active."
    attack = get_attack(wave)
    return attack.is_resolved()


def reset_wave_environment(wave: int) -> None:
    """Instant snapshot reset (< 3s): reconciles base workloads and re-injects current wave."""
    if not is_kubeconfig_present():
        raise RuntimeError("CloudArena cluster is not active. Run `cloudarena start` first.")

    attack = get_attack(wave)

    # 1. Rollback attack
    try:
        attack.rollback()
    except Exception:
        pass

    # 2. Re-apply base manifests to restore pristine configuration
    deploy_base_workloads()
    wait_for_workloads_ready(timeout_seconds=20)

    # 3. Re-inject wave failure
    attack.inject()

    config = load_config()
    config.game.wave_start_time = time.time()
    config.game.hints_used_in_wave = 0
    save_config(config)
