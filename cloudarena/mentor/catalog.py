"""Offline, deterministic 3-tier progressive hint catalog for all challenge waves."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class HintTier:
    level: int
    title: str
    cost_pts: int
    content: str
    suggested_command: Optional[str] = None


_HINT_CATALOG: dict[int, dict[int, HintTier]] = {
    1: {
        1: HintTier(
            level=1,
            title="Directional / Orientation",
            cost_pts=10,
            content=(
                "Compute resource saturation detected on the cluster. "
                "One of your worker nodes is experiencing extreme CPU starvation, causing "
                "application response latencies to inflate."
            ),
            suggested_command="cloudarena kubectl top nodes",
        ),
        2: HintTier(
            level=2,
            title="Component Diagnostic",
            cost_pts=25,
            content=(
                "The CPU saturation is not coming from your application in `cloudarena-app`. "
                "Inspect workloads scheduled across other namespaces, particularly `cloudarena-system`. "
                "Look for rogue pods consuming excessive CPU cores."
            ),
            suggested_command="cloudarena kubectl get pods -n cloudarena-system",
        ),
        3: HintTier(
            level=3,
            title="Tactical Action Clue",
            cost_pts=50,
            content=(
                "The pod `rogue-crypto-miner` in namespace `cloudarena-system` was launched without CPU limits "
                "and is running a spin-loop. Delete this rogue pod to restore cluster compute capacity."
            ),
            suggested_command="cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system",
        ),
    },
    2: {
        1: HintTier(
            level=1,
            title="Directional / Orientation",
            cost_pts=10,
            content=(
                "Application instability detected. Pods are repeatedly crashing upon boot. "
                "This indicates an operating system signal termination rather than a standard code exception."
            ),
            suggested_command="cloudarena kubectl get pods -n cloudarena-app",
        ),
        2: HintTier(
            level=2,
            title="Component Diagnostic",
            cost_pts=25,
            content=(
                "Inspect the termination reason and exit code for the failing `backend-api` pod. "
                "Check whether the Linux kernel terminated the container with Exit Code 137 (OOMKilled) "
                "due to restrictive cgroup limits."
            ),
            suggested_command="cloudarena kubectl describe pod -n cloudarena-app -l app.kubernetes.io/name=backend-api",
        ),
        3: HintTier(
            level=3,
            title="Tactical Action Clue",
            cost_pts=50,
            content=(
                "The `backend-api` deployment memory limit is throttled to 24Mi, which is too low for the Python runtime. "
                "Increase the container memory limit to at least 256Mi."
            ),
            suggested_command="cloudarena kubectl set resources deployment backend-api --limits=memory=256Mi -n cloudarena-app",
        ),
    },
    3: {
        1: HintTier(
            level=1,
            title="Directional / Orientation",
            cost_pts=10,
            content=(
                "The backend application is caught in a continuous restart loop. "
                "The application starts, runs for ~30 seconds, and is then killed by the kubelet. "
                "Check the health probing mechanisms."
            ),
            suggested_command="cloudarena kubectl get events -n cloudarena-app --sort-by='.metadata.creationTimestamp'",
        ),
        2: HintTier(
            level=2,
            title="Component Diagnostic",
            cost_pts=25,
            content=(
                "Examine the pod's `livenessProbe` configuration and recent event logs. "
                "The kubelet is receiving HTTP 404 client errors when checking the container's health probe."
            ),
            suggested_command="cloudarena kubectl describe deployment backend-api -n cloudarena-app",
        ),
        3: HintTier(
            level=3,
            title="Tactical Action Clue",
            cost_pts=50,
            content=(
                "There is a typo in the `livenessProbe` path: `/healhtz` instead of `/healthz`. "
                "Edit the deployment or patch the probe path back to `/healthz`."
            ),
            suggested_command="cloudarena kubectl edit deployment backend-api -n cloudarena-app",
        ),
    },
    4: {
        1: HintTier(
            level=1,
            title="Directional / Orientation",
            cost_pts=10,
            content=(
                "High request drop rates and latency degradation detected under traffic surge. "
                "Check the synthetic traffic logs from `traffic-gen` in `cloudarena-system` to see the failure rate."
            ),
            suggested_command="cloudarena kubectl logs -n cloudarena-system -l app.kubernetes.io/name=traffic-gen --tail=20",
        ),
        2: HintTier(
            level=2,
            title="Component Diagnostic",
            cost_pts=25,
            content=(
                "The traffic generator is sending concurrent requests, but the `backend-api` service has "
                "only 1 single pod replica. The single pod cannot keep up with the incoming connection volume."
            ),
            suggested_command="cloudarena kubectl get deployment backend-api -n cloudarena-app",
        ),
        3: HintTier(
            level=3,
            title="Tactical Action Clue",
            cost_pts=50,
            content=(
                "Scale out the `backend-api` deployment horizontally to at least 3 replicas so Kubernetes "
                "can distribute concurrent incoming traffic across multiple pods."
            ),
            suggested_command="cloudarena kubectl scale deployment backend-api --replicas=3 -n cloudarena-app",
        ),
    },
}


def get_hint_tier(wave: int, level: int) -> Optional[HintTier]:
    """Retrieve hint for a given wave and progression level (1, 2, or 3)."""
    wave_hints = _HINT_CATALOG.get(wave)
    if not wave_hints:
        return None
    return wave_hints.get(level)
