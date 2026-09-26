"""Wave 3: Misconfigured Health Probe attack implementation."""

from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_apps_v1, get_core_v1

TARGET_NAMESPACE = "cloudarena-app"
DEPLOYMENT_NAME = "backend-api"


class Wave3ProbeAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=3,
            name="broken_probe",
            title="Wave 3: Broken Health Probe",
            difficulty="Intermediate",
            symptoms="Backend pods cycle in restart loops every 30s; endpoints drop from the service; events log 404 probe failures.",
            expected_fix="Inspect events via `kubectl describe pod backend-api`, observe probe failure on invalid endpoint path `/healhtz`, and patch the deployment probe path back to `/healthz`.",
            description="The deployment's liveness probe was misconfigured with a typo in the HTTP endpoint path, causing kubelet to repeatedly terminate the pod.",
        )

    def inject(self) -> bool:
        apps_v1 = get_apps_v1()
        patch_body = {
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": "api",
                                "livenessProbe": {
                                    "httpGet": {
                                        "path": "/healhtz",  # Subtle typo
                                        "port": 8080,
                                    },
                                    "initialDelaySeconds": 3,
                                    "periodSeconds": 5,
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
                                "livenessProbe": {
                                    "httpGet": {
                                        "path": "/healthz",
                                        "port": 8080,
                                    },
                                    "initialDelaySeconds": 5,
                                    "periodSeconds": 10,
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

        # 1. Check deployment probe path
        try:
            dep = apps_v1.read_namespaced_deployment(name=DEPLOYMENT_NAME, namespace=TARGET_NAMESPACE)
            containers = dep.spec.template.spec.containers
            api_c = next((c for c in containers if c.name == "api"), None)
            if not api_c:
                return False, "api container spec not found."

            if api_c.liveness_probe and api_c.liveness_probe.http_get:
                path = api_c.liveness_probe.http_get.path
                if path != "/healthz":
                    return False, f"livenessProbe path is still '{path}' (expected '/healthz')."
        except ApiException as e:
            return False, f"API error inspecting deployment: {e}"

        # 2. Check pod readiness
        try:
            pods = core_v1.list_namespaced_pod(
                namespace=TARGET_NAMESPACE,
                label_selector="app.kubernetes.io/name=backend-api",
            ).items
            if not pods:
                return False, "backend-api pods are not yet scheduled."

            for p in pods:
                if p.status.phase != "Running":
                    return False, f"Pod {p.metadata.name} is in phase '{p.status.phase}'."
                if p.status.container_statuses:
                    for cs in p.status.container_statuses:
                        if not cs.ready:
                            return False, f"Pod {p.metadata.name} container is not ready."
        except ApiException as e:
            return False, f"API error checking pods: {e}"

        return True, "Health probe path restored to /healthz and backend pods running reliably."
