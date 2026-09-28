"""Wave 7: Broken RBAC ServiceAccount & Missing RoleBinding attack implementation."""

from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_core_v1, get_rbac_v1

SYSTEM_NAMESPACE = "cloudarena-system"
APP_NAMESPACE = "cloudarena-app"
SERVICE_ACCOUNT_NAME = "telemetry-collector"
ROLE_BINDING_NAME = "telemetry-reader-binding"


class Wave7RbacAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=7,
            name="rbac_auth_failure",
            title="Wave 7: RBAC Authorization Failure",
            difficulty="Master",
            symptoms=(
                "Cluster monitoring and automated health probes failing; "
                "telemetry-agent logs report HTTP 403 Forbidden: "
                "`User 'system:serviceaccount:cloudarena-system:telemetry-collector' cannot list "
                "resource 'pods' in API group '' in namespace 'cloudarena-app'`; "
                "service discovery is blocked by Kubernetes API RBAC."
            ),
            expected_fix=(
                "Inspect authorization errors via `cloudarena kubectl logs -n cloudarena-system -l app=telemetry-probe`, "
                "recognize the missing namespace permissions for ServiceAccount `telemetry-collector`, "
                "and create the RoleBinding: "
                "`cloudarena kubectl create rolebinding telemetry-reader-binding --clusterrole=view "
                "--serviceaccount=cloudarena-system:telemetry-collector -n cloudarena-app`."
            ),
            description=(
                "An administrative audit script revoked the RoleBinding linking the telemetry "
                "ServiceAccount to the application namespace, triggering 403 authorization denials."
            ),
        )

    def inject(self) -> bool:
        core_v1 = get_core_v1()
        rbac_v1 = get_rbac_v1()

        # 1. Ensure ServiceAccount exists in cloudarena-system
        try:
            core_v1.create_namespaced_service_account(
                namespace=SYSTEM_NAMESPACE,
                body=client.V1ServiceAccount(metadata=client.V1ObjectMeta(name=SERVICE_ACCOUNT_NAME)),
            )
        except ApiException as e:
            if e.status != 409:
                raise

        # 2. Delete the RoleBinding in cloudarena-app if present
        try:
            rbac_v1.delete_namespaced_role_binding(
                name=ROLE_BINDING_NAME,
                namespace=APP_NAMESPACE,
            )
        except ApiException as e:
            if e.status != 404:
                raise

        # 3. Create a probe pod in cloudarena-system if not existing
        probe_pod = client.V1Pod(
            metadata=client.V1ObjectMeta(
                name="telemetry-probe-agent",
                namespace=SYSTEM_NAMESPACE,
                labels={"app": "telemetry-probe", "cloudarena.io/incident": "wave7"},
            ),
            spec=client.V1PodSpec(
                service_account_name=SERVICE_ACCOUNT_NAME,
                restart_policy="Never",
                containers=[
                    client.V1Container(
                        name="probe",
                        image="curlimages/curl:8.6.0",
                        command=["sh", "-c", "sleep 3600"],
                    )
                ],
            ),
        )
        try:
            core_v1.create_namespaced_pod(namespace=SYSTEM_NAMESPACE, body=probe_pod)
        except ApiException as e:
            if e.status != 409:
                pass

        return True

    def rollback(self) -> bool:
        rbac_v1 = get_rbac_v1()
        core_v1 = get_core_v1()

        # Re-create RoleBinding
        binding = client.V1RoleBinding(
            metadata=client.V1ObjectMeta(name=ROLE_BINDING_NAME, namespace=APP_NAMESPACE),
            role_ref=client.V1RoleRef(
                api_group="rbac.authorization.k8s.io",
                kind="ClusterRole",
                name="view",
            ),
            subjects=[
                client.V1Subject(
                    kind="ServiceAccount",
                    name=SERVICE_ACCOUNT_NAME,
                    namespace=SYSTEM_NAMESPACE,
                )
            ],
        )
        try:
            rbac_v1.create_namespaced_role_binding(namespace=APP_NAMESPACE, body=binding)
        except ApiException as e:
            if e.status != 409:
                pass

        # Cleanup probe pod
        try:
            core_v1.delete_namespaced_pod(
                name="telemetry-probe-agent",
                namespace=SYSTEM_NAMESPACE,
                body=client.V1DeleteOptions(grace_period_seconds=0),
            )
        except ApiException:
            pass

        return True

    def is_resolved(self) -> tuple[bool, str]:
        rbac_v1 = get_rbac_v1()

        try:
            bindings = rbac_v1.list_namespaced_role_binding(namespace=APP_NAMESPACE).items
            for b in bindings:
                if b.subjects:
                    for s in b.subjects:
                        if (
                            s.kind == "ServiceAccount"
                            and s.name == SERVICE_ACCOUNT_NAME
                            and (s.namespace == SYSTEM_NAMESPACE or s.namespace is None)
                        ):
                            # Verify roleRef is valid (view, edit, admin, or similar)
                            if b.role_ref and b.role_ref.name in ("view", "edit", "admin", "cluster-admin"):
                                return True, f"RoleBinding '{b.metadata.name}' grants ServiceAccount '{SERVICE_ACCOUNT_NAME}' valid permissions in '{APP_NAMESPACE}'."
                            elif b.role_ref:
                                return True, f"RoleBinding '{b.metadata.name}' with role '{b.role_ref.name}' found for ServiceAccount."

            return False, f"No RoleBinding found in namespace '{APP_NAMESPACE}' granting permissions to ServiceAccount '{SERVICE_ACCOUNT_NAME}'."

        except ApiException as e:
            return False, f"API error inspecting RoleBindings: {e}"
