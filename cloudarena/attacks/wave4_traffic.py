"""Wave 4: Traffic Surge & Under-provisioning attack implementation."""

from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_apps_v1, get_core_v1

APP_NAMESPACE = "cloudarena-app"
SYSTEM_NAMESPACE = "cloudarena-system"
BACKEND_DEPLOYMENT = "backend-api"
TRAFFIC_DEPLOYMENT = "traffic-gen"


class Wave4TrafficAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=4,
            name="traffic_surge",
            title="Wave 4: Traffic Surge & Under-provisioning",
            difficulty="Advanced",
            symptoms="Traffic generator reports 40%+ connection timeouts; backend API latency degrades; single pod is overwhelmed.",
            expected_fix="Scale backend API to handle concurrent load (`kubectl scale deployment backend-api --replicas=3 -n cloudarena-app`) or configure horizontal scaling.",
            description="A sudden 10x traffic surge has overwhelmed the single backend container replica, requiring horizontal scaling.",
        )

    def inject(self) -> bool:
        apps_v1 = get_apps_v1()
        try:
            # 1. Clamp backend to 1 replica
            apps_v1.patch_namespaced_deployment_scale(
                name=BACKEND_DEPLOYMENT,
                namespace=APP_NAMESPACE,
                body={"spec": {"replicas": 1}},
            )
            # 2. Scale traffic-gen to 5 parallel generators
            apps_v1.patch_namespaced_deployment_scale(
                name=TRAFFIC_DEPLOYMENT,
                namespace=SYSTEM_NAMESPACE,
                body={"spec": {"replicas": 5}},
            )
            return True
        except ApiException:
            raise

    def rollback(self) -> bool:
        apps_v1 = get_apps_v1()
        try:
            # Reset traffic-gen back to 1 baseline generator
            apps_v1.patch_namespaced_deployment_scale(
                name=TRAFFIC_DEPLOYMENT,
                namespace=SYSTEM_NAMESPACE,
                body={"spec": {"replicas": 1}},
            )
            return True
        except ApiException:
            raise

    def is_resolved(self) -> tuple[bool, str]:
        apps_v1 = get_apps_v1()
        core_v1 = get_core_v1()

        # 1. Verify backend-api deployment has scaled to >= 3 replicas
        try:
            dep = apps_v1.read_namespaced_deployment(name=BACKEND_DEPLOYMENT, namespace=APP_NAMESPACE)
            desired = dep.spec.replicas or 1
            ready = dep.status.ready_replicas or 0

            if desired < 3:
                return False, f"backend-api is scaled to {desired} replicas (need at least 3 to handle surge)."

            if ready < 3:
                return False, f"Scaling in progress: {ready}/{desired} replicas ready."
        except ApiException as e:
            return False, f"API error checking deployment: {e}"

        # 2. Check all backend pods are Running
        try:
            pods = core_v1.list_namespaced_pod(
                namespace=APP_NAMESPACE,
                label_selector="app.kubernetes.io/name=backend-api",
            ).items
            ready_pods = 0
            for p in pods:
                if p.status.phase == "Running":
                    if p.status.container_statuses and all(c.ready for c in p.status.container_statuses):
                        ready_pods += 1

            if ready_pods < 3:
                return False, f"Only {ready_pods}/3 backend pods are healthy and receiving traffic."
        except ApiException as e:
            return False, f"API error checking pods: {e}"

        return True, "Backend scaled to 3+ healthy replicas; traffic load successfully distributed."
