"""Orchestrates deployment and readiness verification of base workloads."""

import time
from typing import Callable, Optional
from kubernetes.client.rest import ApiException

from cloudarena.core.paths import MANIFESTS_DIR, get_manifests_dir
from cloudarena.k8s.client import apply_manifest_file, get_apps_v1, get_core_v1


class DeploymentError(Exception):
    """Raised when workload deployment fails or times out."""
    pass


def deploy_base_workloads(progress_callback: Optional[Callable[[str], None]] = None) -> list[str]:
    """Apply all standard bundled manifests in alphabetical order."""
    target_dir = get_manifests_dir()
    manifest_files = sorted(target_dir.glob("*.yaml")) if target_dir.exists() else []

    if not manifest_files:
        raise DeploymentError(f"No manifest files found in {target_dir}")

    deployed_files = []
    for manifest_path in manifest_files:
        if progress_callback:
            progress_callback(f"Applying {manifest_path.name}...")
        try:
            apply_manifest_file(manifest_path)
            deployed_files.append(manifest_path.name)
        except Exception as e:
            raise DeploymentError(f"Failed to apply {manifest_path.name}: {e}")

    return deployed_files


def wait_for_workloads_ready(
    namespaces: list[str] = ["cloudarena-app", "cloudarena-system"],
    timeout_seconds: int = 90,
    poll_interval: int = 2,
    progress_callback: Optional[Callable[[str], None]] = None,
) -> bool:
    """Poll deployments until all replicas are ready or timeout occurs."""
    apps_v1 = get_apps_v1()
    start_time = time.time()

    while time.time() - start_time < timeout_seconds:
        all_ready = True
        pending_list = []

        for ns in namespaces:
            try:
                deployments = apps_v1.list_namespaced_deployment(namespace=ns).items
                for dep in deployments:
                    name = dep.metadata.name
                    desired = dep.spec.replicas or 1
                    ready = dep.status.ready_replicas or 0
                    if ready < desired:
                        all_ready = False
                        pending_list.append(f"{ns}/{name} ({ready}/{desired})")
            except ApiException as e:
                if e.status == 404:
                    all_ready = False
                    pending_list.append(f"{ns} namespace initializing")
                else:
                    raise

        if all_ready and pending_list == []:
            return True

        if progress_callback and pending_list:
            progress_callback(f"Waiting for: {', '.join(pending_list)}")

        time.sleep(poll_interval)

    raise DeploymentError(
        f"Workloads failed to become ready within {timeout_seconds}s. Pending: {', '.join(pending_list)}"
    )


def get_workloads_summary(namespaces: list[str] = ["cloudarena-app", "cloudarena-system"]) -> list[dict]:
    """Retrieve tabular summary of pods across CloudArena namespaces."""
    core_v1 = get_core_v1()
    summary = []
    for ns in namespaces:
        try:
            pods = core_v1.list_namespaced_pod(namespace=ns).items
            for pod in pods:
                name = pod.metadata.name
                phase = pod.status.phase or "Unknown"
                restarts = 0
                ready = False
                if pod.status.container_statuses:
                    for cs in pod.status.container_statuses:
                        restarts += cs.restart_count
                        if cs.ready:
                            ready = True
                
                # Check for specific failure reasons
                status_str = phase
                if pod.status.container_statuses:
                    waiting = pod.status.container_statuses[0].state.waiting
                    if waiting and waiting.reason:
                        status_str = waiting.reason

                summary.append({
                    "namespace": ns,
                    "name": name,
                    "status": status_str,
                    "ready": "Yes" if ready else "No",
                    "restarts": restarts,
                    "ip": pod.status.pod_ip or "Pending",
                    "node": pod.spec.node_name or "Pending",
                })
        except Exception:
            pass
    return summary
