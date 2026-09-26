"""Wave 1: Rogue CPU Hog attack implementation."""

from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_core_v1

ROGUE_POD_NAME = "rogue-crypto-miner"
TARGET_NAMESPACE = "cloudarena-system"


class Wave1CpuAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=1,
            name="rogue_cpu_hog",
            title="Wave 1: Rogue CPU Hog",
            difficulty="Beginner",
            symptoms="Node CPU saturates at 95%+; backend latency spikes; cluster metrics show compute starvation.",
            expected_fix="Inspect pods across all namespaces (`kubectl get pods -A` or `kubectl top pods -A`), identify the rogue pod, and delete it (`kubectl delete pod <name> -n cloudarena-system`).",
            description="An unconstrained rogue workload has been scheduled into the cluster, consuming compute resources without limits.",
        )

    def inject(self) -> bool:
        core_v1 = get_core_v1()
        pod_manifest = client.V1Pod(
            metadata=client.V1ObjectMeta(
                name=ROGUE_POD_NAME,
                namespace=TARGET_NAMESPACE,
                labels={
                    "app.kubernetes.io/name": "rogue-miner",
                    "cloudarena.io/incident": "wave1",
                },
            ),
            spec=client.V1PodSpec(
                restart_policy="Never",
                containers=[
                    client.V1Container(
                        name="miner",
                        image="busybox:1.36",
                        command=["sh", "-c", "while true; do :; done"],
                        resources=client.V1ResourceRequirements(
                            requests={"cpu": "200m"},
                            # Intentionally no CPU limits to allow saturation
                        ),
                    )
                ],
            ),
        )

        try:
            core_v1.create_namespaced_pod(namespace=TARGET_NAMESPACE, body=pod_manifest)
            return True
        except ApiException as e:
            if e.status == 409:
                # Already exists
                return True
            raise

    def rollback(self) -> bool:
        core_v1 = get_core_v1()
        try:
            core_v1.delete_namespaced_pod(
                name=ROGUE_POD_NAME,
                namespace=TARGET_NAMESPACE,
                body=client.V1DeleteOptions(grace_period_seconds=0),
            )
            return True
        except ApiException as e:
            if e.status == 404:
                return True
            raise

    def is_resolved(self) -> tuple[bool, str]:
        core_v1 = get_core_v1()
        # 1. Check if rogue pod still exists
        try:
            pod = core_v1.read_namespaced_pod(name=ROGUE_POD_NAME, namespace=TARGET_NAMESPACE)
            if pod and pod.status.phase in ("Running", "Pending"):
                return False, f"Rogue pod '{ROGUE_POD_NAME}' is still active in namespace '{TARGET_NAMESPACE}'."
        except ApiException as e:
            if e.status != 404:
                return False, f"API error checking rogue pod: {e}"

        # 2. Check that target backend-api pods are running and ready
        try:
            pods = core_v1.list_namespaced_pod(
                namespace="cloudarena-app",
                label_selector="app.kubernetes.io/name=backend-api",
            ).items
            if not pods:
                return False, "backend-api pods are missing in cloudarena-app."

            for p in pods:
                if p.status.phase != "Running":
                    return False, f"backend-api pod '{p.metadata.name}' is in {p.status.phase} phase."
                ready = False
                if p.status.container_statuses:
                    ready = all(c.ready for c in p.status.container_statuses)
                if not ready:
                    return False, f"backend-api pod '{p.metadata.name}' is not yet Ready."
        except ApiException as e:
            return False, f"API error checking backend pods: {e}"

        return True, "Rogue workload eliminated and backend API pods are fully operational."
