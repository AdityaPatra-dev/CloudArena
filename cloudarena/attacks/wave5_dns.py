"""Wave 5: CoreDNS Resolution Blackout attack implementation."""

from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.k8s.client import get_apps_v1, get_core_v1

APP_NAMESPACE = "cloudarena-app"
FRONTEND_DEPLOYMENT = "frontend"
BLACKHOLE_DNS_IP = "192.0.2.53"


class Wave5DnsAttack(BaseAttack):
    @property
    def info(self) -> AttackInfo:
        return AttackInfo(
            wave_number=5,
            name="dns_blackout",
            title="Wave 5: CoreDNS Resolution Blackout",
            difficulty="Advanced",
            symptoms=(
                "Inter-service network calls failing across the cluster; "
                "frontend logs `dial tcp: lookup backend-api on 192.0.2.53:53: i/o timeout`; "
                "HTTP 502/504 Bad Gateway errors reported on all public endpoints."
            ),
            expected_fix=(
                "Inspect the frontend deployment DNS configuration via "
                "`cloudarena kubectl get deployment frontend -n cloudarena-app -o yaml`, "
                "identify the overridden `dnsPolicy: None` pointing to blackhole IP 192.0.2.53, "
                "and restore it to `dnsPolicy: ClusterFirst`."
            ),
            description=(
                "A misconfigured manifest injected an invalid DNS policy (`dnsPolicy: None`) "
                "into the frontend service, severing internal cluster DNS name resolution."
            ),
        )

    def inject(self) -> bool:
        apps_v1 = get_apps_v1()
        patch_body = {
            "spec": {
                "template": {
                    "spec": {
                        "dnsPolicy": "None",
                        "dnsConfig": {
                            "nameservers": [BLACKHOLE_DNS_IP],
                            "searches": ["blackhole.invalid.svc.cluster.local"],
                        },
                    }
                }
            }
        }
        try:
            apps_v1.patch_namespaced_deployment(
                name=FRONTEND_DEPLOYMENT,
                namespace=APP_NAMESPACE,
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
                        "dnsPolicy": "ClusterFirst",
                        "dnsConfig": None,
                    }
                }
            }
        }
        try:
            apps_v1.patch_namespaced_deployment(
                name=FRONTEND_DEPLOYMENT,
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
            deploy = apps_v1.read_namespaced_deployment(name=FRONTEND_DEPLOYMENT, namespace=APP_NAMESPACE)
            spec = deploy.spec.template.spec

            # 1. Verify dnsPolicy is restored to ClusterFirst
            if spec.dns_policy == "None":
                nameservers = []
                if spec.dns_config and spec.dns_config.nameservers:
                    nameservers = spec.dns_config.nameservers
                if BLACKHOLE_DNS_IP in nameservers:
                    return False, f"Frontend deployment is still using blackholed DNS nameserver ({BLACKHOLE_DNS_IP})."
                return False, "Frontend deployment dnsPolicy is still set to 'None'."

            # 2. Check that frontend pods are healthy and running
            pods = core_v1.list_namespaced_pod(
                namespace=APP_NAMESPACE,
                label_selector="app.kubernetes.io/name=frontend",
            ).items
            if not pods:
                return False, "Frontend pods not found in namespace cloudarena-app."

            running_count = 0
            for p in pods:
                if p.status.phase == "Running":
                    ready = False
                    if p.status.container_statuses:
                        ready = all(c.ready for c in p.status.container_statuses)
                    if ready:
                        running_count += 1

            if running_count == 0:
                return False, "Frontend pods are reconciling or not yet Ready."

            return True, "CoreDNS cluster resolution restored and frontend service is operating normally."

        except ApiException as e:
            return False, f"API error checking frontend DNS status: {e}"
