"""Wave 6: Persistent Storage Deadlock & ReadOnly Mount attack implementation."""

from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_apps_v1, get_core_v1

APP_NAMESPACE = "cloudarena-app"
BACKEND_DEPLOYMENT = "backend-api"
VOLUME_NAME = "storage-cache-vol"


class Wave6StorageAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=6,
            name="storage_deadlock",
            title="Wave 6: Storage Deadlock & ReadOnly Mount",
            difficulty="Nightmare",
            symptoms=(
                "Backend service throwing I/O write errors; logs display "
                "`IOError: [Errno 30] Read-only file system: '/data/app.log'` or "
                "`sqlite3.OperationalError: attempt to write a readonly database`; "
                "stateful transaction commits fail with HTTP 500."
            ),
            expected_fix=(
                "Inspect the backend-api deployment volume mounts via "
                "`cloudarena kubectl get deployment backend-api -n cloudarena-app -o yaml`, "
                "identify the conflicting volume mount `/data` marked with `readOnly: true`, "
                "and patch the deployment to set `readOnly: false` or remove the restrictive mount."
            ),
            description=(
                "An operational misconfiguration mounted the backend persistence directory "
                "`/data` with read-only flags (`readOnly: true`), halting all stateful persistence."
            ),
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
                                "volumeMounts": [
                                    {
                                        "name": VOLUME_NAME,
                                        "mountPath": "/data",
                                        "readOnly": True,
                                    }
                                ],
                            }
                        ],
                        "volumes": [
                            {
                                "name": VOLUME_NAME,
                                "emptyDir": {},
                            }
                        ],
                    }
                }
            }
        }
        try:
            apps_v1.patch_namespaced_deployment(
                name=BACKEND_DEPLOYMENT,
                namespace=APP_NAMESPACE,
                body=patch_body,
            )
            return True
        except ApiException:
            raise

    def rollback(self) -> bool:
        apps_v1 = get_apps_v1()
        # Remove or restore readOnly to False
        patch_body = {
            "spec": {
                "template": {
                    "spec": {
                        "containers": [
                            {
                                "name": "api",
                                "volumeMounts": [
                                    {
                                        "name": VOLUME_NAME,
                                        "mountPath": "/data",
                                        "readOnly": False,
                                    }
                                ],
                            }
                        ],
                    }
                }
            }
        }
        try:
            apps_v1.patch_namespaced_deployment(
                name=BACKEND_DEPLOYMENT,
                namespace=APP_NAMESPACE,
                body=patch_body,
            )
            return True
        except ApiException:
            raise

    def is_resolved(self) -> tuple[bool, str]:
        apps_v1 = get_apps_v1()
        core_v1 = get_core_v1()

        try:
            deploy = apps_v1.read_namespaced_deployment(name=BACKEND_DEPLOYMENT, namespace=APP_NAMESPACE)
            containers = deploy.spec.template.spec.containers
            api_container = next((c for c in containers if c.name == "api"), None)

            if not api_container:
                return False, "Container 'api' not found in backend-api deployment."

            # Check if volumeMounts on /data is still readOnly
            if api_container.volume_mounts:
                for vm in api_container.volume_mounts:
                    if vm.mount_path == "/data" and vm.read_only:
                        return False, "Volume mount '/data' is still configured with 'readOnly: true'."

            # Check that backend pods are Running and Ready
            pods = core_v1.list_namespaced_pod(
                namespace=APP_NAMESPACE,
                label_selector="app.kubernetes.io/name=backend-api",
            ).items
            if not pods:
                return False, "backend-api pods not found in namespace cloudarena-app."

            running_ready = 0
            for p in pods:
                if p.status.phase == "Running":
                    ready = False
                    if p.status.container_statuses:
                        ready = all(c.ready for c in p.status.container_statuses)
                    if ready:
                        running_ready += 1

            if running_ready == 0:
                return False, "backend-api pods are still restarting or not in Ready state."

            return True, "Storage mount permissions restored to read-write and backend persistence is operational."

        except ApiException as e:
            return False, f"API error checking storage configuration: {e}"
