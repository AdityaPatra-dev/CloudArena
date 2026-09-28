"""Custom Chaos Scenario Plugin System & SDK for CloudArena."""

import json
from pathlib import Path
from typing import Any, Optional
import yaml
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.core.paths import MANIFESTS_DIR, SCENARIOS_DIR, ensure_directories
from cloudarena.k8s.client import get_apps_v1, get_core_v1, is_kubeconfig_present


class CustomScenario(BaseAttack):
    """Dynamic chaos scenario loaded from a declarative YAML manifest."""

    def __init__(self, data: dict[str, Any], filepath: Optional[Path] = None):
        self.data = data
        self.filepath = filepath
        self._name = data.get("name", "Custom Chaos Scenario")
        self._scenario_id = data.get("scenario_id", "custom_scenario")
        self._difficulty = data.get("difficulty", "Intermediate")
        self._target_namespace = data.get("target_namespace", "cloudarena-app")
        self._mutation = data.get("mutation", {})
        self._validation = data.get("validation", {})
        self._rollback_spec = data.get("rollback", {})
        self._hints = data.get("hints", [])
        self._mentor_guidance = data.get("mentor_guidance", "Investigate pod logs and recent mutations.")

    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=999,
            name=self._scenario_id,
            title=self._name,
            difficulty=self._difficulty,
            symptoms=self.data.get("symptoms", "Simulated custom outage active."),
            expected_fix=self.data.get("expected_fix", "Restore resource spec to expected values."),
            description=self.data.get("description", "A custom user-defined chaos scenario."),
        )

    @property
    def hints(self) -> list[str]:
        return self._hints

    @property
    def mentor_guidance(self) -> str:
        return self._mentor_guidance

    def inject(self) -> bool:
        """Execute the declarative mutation against the target cluster."""
        if not is_kubeconfig_present():
            return False

        kind = self._mutation.get("kind", "").lower()
        target_name = self._mutation.get("name", "")
        action = self._mutation.get("action", "patch")
        patch_body = self._mutation.get("patch", {})

        apps_v1 = get_apps_v1()
        core_v1 = get_core_v1()

        try:
            if kind == "deployment":
                if action == "scale_down":
                    replicas = self._mutation.get("replicas", 0)
                    apps_v1.patch_namespaced_deployment_scale(
                        name=target_name,
                        namespace=self._target_namespace,
                        body={"spec": {"replicas": replicas}},
                    )
                elif action == "patch" or patch_body:
                    apps_v1.patch_namespaced_deployment(
                        name=target_name,
                        namespace=self._target_namespace,
                        body=patch_body,
                    )
                return True

            elif kind == "configmap":
                if action == "patch" or patch_body:
                    core_v1.patch_namespaced_config_map(
                        name=target_name,
                        namespace=self._target_namespace,
                        body=patch_body,
                    )
                return True

            elif kind == "secret":
                if action == "patch" or patch_body:
                    core_v1.patch_namespaced_secret(
                        name=target_name,
                        namespace=self._target_namespace,
                        body=patch_body,
                    )
                return True

            elif kind == "service":
                if action == "delete":
                    core_v1.delete_namespaced_service(
                        name=target_name,
                        namespace=self._target_namespace,
                    )
                return True

            return True
        except Exception:
            return False

    def is_resolved(self) -> tuple[bool, str]:
        """Verify the custom validation conditions."""
        if not is_kubeconfig_present():
            return False, "Kubeconfig not found."

        check_type = self._validation.get("check_type", "pod_ready")
        target_resource = self._validation.get("target_resource", "")
        expected = self._validation.get("expected", "Running")

        apps_v1 = get_apps_v1()
        core_v1 = get_core_v1()

        try:
            if check_type == "pod_ready":
                pod_list = core_v1.list_namespaced_pod(
                    namespace=self._target_namespace,
                    label_selector=f"app={target_resource}" if target_resource else None,
                )
                if not pod_list.items:
                    return False, f"No pods found matching '{target_resource}'."

                for pod in pod_list.items:
                    if pod.status.phase != "Running":
                        return False, f"Pod {pod.metadata.name} is in phase '{pod.status.phase}'."
                    for cs in pod.status.container_statuses or []:
                        if not cs.ready:
                            return False, f"Container {cs.name} is not ready."
                return True, "All target pods are healthy and ready."

            elif check_type == "deployment_available":
                dep = apps_v1.read_namespaced_deployment(
                    name=target_resource,
                    namespace=self._target_namespace,
                )
                available = dep.status.available_replicas or 0
                expected_reps = int(expected) if str(expected).isdigit() else 1
                if available >= expected_reps:
                    return True, f"Deployment {target_resource} has {available} available replicas."
                return False, f"Deployment {target_resource} has {available}/{expected_reps} replicas."

            elif check_type == "service_exists":
                core_v1.read_namespaced_service(
                    name=target_resource,
                    namespace=self._target_namespace,
                )
                return True, f"Service {target_resource} exists and is active."

            return True, "Custom validation conditions met."
        except Exception as e:
            return False, f"Validation pending: {str(e)[:50]}"

    def rollback(self) -> bool:
        """Execute the rollback specification to restore initial state."""
        if not is_kubeconfig_present():
            return False

        kind = self._rollback_spec.get("kind", self._mutation.get("kind", "")).lower()
        target_name = self._rollback_spec.get("name", self._mutation.get("name", ""))
        patch_body = self._rollback_spec.get("patch", {})
        action = self._rollback_spec.get("action", "patch")

        apps_v1 = get_apps_v1()
        core_v1 = get_core_v1()

        try:
            if kind == "deployment":
                if action == "scale_up" or "replicas" in self._rollback_spec:
                    reps = self._rollback_spec.get("replicas", 1)
                    apps_v1.patch_namespaced_deployment_scale(
                        name=target_name,
                        namespace=self._target_namespace,
                        body={"spec": {"replicas": reps}},
                    )
                elif patch_body:
                    apps_v1.patch_namespaced_deployment(
                        name=target_name,
                        namespace=self._target_namespace,
                        body=patch_body,
                    )
                return True
            return True
        except Exception:
            return False


def load_scenario(path: Path) -> CustomScenario:
    """Load a custom scenario from a YAML manifest file."""
    if not path.exists():
        raise FileNotFoundError(f"Custom scenario manifest not found at: {path}")

    with open(path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f) or {}

    return CustomScenario(data=data, filepath=path)


def list_scenarios() -> list[dict[str, Any]]:
    """Discover all custom scenarios in ~/.cloudarena/scenarios and builtin manifests."""
    ensure_directories()
    scenarios = []

    search_dirs = [SCENARIOS_DIR, MANIFESTS_DIR / "scenarios"]
    for d in search_dirs:
        if not d.exists():
            continue
        for file in d.glob("*.yaml"):
            try:
                scenario = load_scenario(file)
                scenarios.append({
                    "id": scenario._scenario_id,
                    "name": scenario._name,
                    "difficulty": scenario._difficulty,
                    "path": str(file),
                    "author": scenario.data.get("author", "Community"),
                    "hints_count": len(scenario.hints),
                })
            except Exception:
                pass

    return scenarios


def create_scenario_template(path: Path, name: str = "custom-outage") -> Path:
    """Create a starter scenario template YAML file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    template = {
        "scenario_id": name.lower().replace(" ", "_"),
        "name": name,
        "difficulty": "Intermediate",
        "author": "SRE Instructor",
        "target_namespace": "cloudarena-app",
        "symptoms": "Backend service returning 503 Service Unavailable.",
        "expected_fix": "Fix configuration or restore deployment replicas.",
        "description": "Custom declarative scenario created with CloudArena SDK.",
        "mutation": {
            "kind": "deployment",
            "name": "backend-api",
            "action": "scale_down",
            "replicas": 0,
        },
        "validation": {
            "check_type": "deployment_available",
            "target_resource": "backend-api",
            "expected": 1,
        },
        "rollback": {
            "kind": "deployment",
            "name": "backend-api",
            "action": "scale_up",
            "replicas": 1,
        },
        "hints": [
            "Hint 1: Run 'kubectl get deployments -n cloudarena-app' to check pod counts.",
            "Hint 2: Notice that backend-api has 0/0 available replicas.",
            "Hint 3: Scale the deployment: 'kubectl scale deployment backend-api -n cloudarena-app --replicas=1'.",
        ],
        "mentor_guidance": "The backend-api deployment was scaled to 0. Competitor should scale it back up.",
    }

    with open(path, "w", encoding="utf-8") as f:
        yaml.safe_dump(template, f, default_flow_style=False, sort_keys=False)

    return path
