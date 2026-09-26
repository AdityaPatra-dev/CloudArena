"""Wave 2: Memory Leak & OOMKilled attack implementation."""

import re
from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_apps_v1, get_core_v1

TARGET_NAMESPACE = "cloudarena-app"
DEPLOYMENT_NAME = "backend-api"


def parse_k8s_memory(mem_str: str) -> int:
    """Convert Kubernetes memory quantity string to bytes."""
    mem_str = mem_str.strip()
    match = re.match(r"^(\d+)([A-Za-z]+)?$", mem_str)
    if not match:
        return 0

    val = int(match.group(1))
    unit = match.group(2) or ""

    multipliers = {
        "": 1,
        "k": 1000,
        "M": 1000**2,
        "G": 1000**3,
        "Ki": 1024,
        "Mi": 1024**2,
        "Gi": 1024**3,
    }
    return val * multipliers.get(unit, 1)


class Wave2MemoryAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=2,
            name="memory_oom",
            title="Wave 2: Memory Exhaustion (OOMKilled)",
            difficulty="Intermediate",
            symptoms="Backend pods entering CrashLoopBackOff with Exit Code 137 (OOMKilled); API becomes unavailable.",
            expected_fix="Diagnose container crash reason via `kubectl describe pod` or `kubectl get events`, identify the memory ceiling constraint, and increase deployment limits (`kubectl set resources deployment backend-api --limits=memory=256Mi -n cloudarena-app`).",
            description="The backend service memory limit was throttled below its working set threshold, triggering kernel OOM terminations.",
        )

    def inject(self) -> bool:
        apps_v1 = get_apps_v1()
        # Choke memory limit down to 24Mi (Python requires ~30MB baseline)
        patch_body = {
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": "api",
                                "resources": {
                                    "requests": {"memory": "16Mi", "cpu": "50m"},
                                    "limits": {"memory": "24Mi", "cpu": "200m"},
                                },
                            }
                        ]
                    }
                }
            }
        }
        try:
            apps_v1.patch_namespaced_deployment(
                name=DEPLOYMENT_NAME,
                namespace=TARGET_NAMESPACE,
                body=patch_body,
            )
            return True
        except ApiException:
            raise

    def rollback(self) -> bool:
        apps_v1 = get_apps_v1()
        patch_body = {
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": "api",
                                "resources": {
                                    "requests": {"memory": "128Mi", "cpu": "100m"},
                                    "limits": {"memory": "256Mi", "cpu": "500m"},
                                },
                            }
                        ]
                    }
                }
            }
        }
        try:
            apps_v1.patch_namespaced_deployment(
                name=DEPLOYMENT_NAME,
                namespace=TARGET_NAMESPACE,
                body=patch_body,
            )
            return True
        except ApiException:
            raise

    def is_resolved(self) -> tuple[bool, str]:
        apps_v1 = get_apps_v1()
        core_v1 = get_core_v1()

        # 1. Verify deployment memory limit is >= 128Mi
        try:
            dep = apps_v1.read_namespaced_deployment(name=DEPLOYMENT_NAME, namespace=TARGET_NAMESPACE)
            containers = dep.spec.template.spec.containers
            api_c = next((c for c in containers if c.name == "api"), None)
            if not api_c or not api_c.resources or not api_c.resources.limits:
                return False, "backend-api container has no memory limit configured."

            mem_limit_str = api_c.resources.limits.get("memory", "0")
            mem_bytes = parse_k8s_memory(mem_limit_str)
            min_required_bytes = 100 * 1024 * 1024  # At least 100Mi

            if mem_bytes < min_required_bytes:
                return False, f"Memory limit is {mem_limit_str} (needs at least 128Mi to prevent OOM)."
        except ApiException as e:
            return False, f"Error inspecting deployment: {e}"

        # 2. Check running pods are ready and not OOMKilled
        try:
            pods = core_v1.list_namespaced_pod(
                namespace=TARGET_NAMESPACE,
                label_selector="app.kubernetes.io/name=backend-api",
            ).items
            if not pods:
                return False, "backend-api pods are not yet deployed."

            for p in pods:
                if p.status.phase != "Running":
                    return False, f"backend-api pod is in '{p.status.phase}' phase."
                if p.status.container_statuses:
                    for cs in p.status.container_statuses:
                        if not cs.ready:
                            return False, f"Container '{cs.name}' is not yet Ready."
                        if cs.last_state and cs.last_state.terminated:
                            if cs.last_state.terminated.reason == "OOMKilled":
                                return False, "Container was previously OOMKilled; awaiting stabilized run."
        except ApiException as e:
            return False, f"Error reading pod status: {e}"

        return True, "Memory limits expanded and backend-api pods running stably without OOM."
