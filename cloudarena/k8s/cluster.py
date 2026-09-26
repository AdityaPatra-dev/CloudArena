"""k3d cluster lifecycle management (create, delete, inspect)."""

import json
import os
import subprocess
from typing import Optional

from cloudarena.core.environment import find_binary
from cloudarena.core.paths import KUBECONFIG_FILE, ensure_directories, get_extended_path_env


class ClusterError(Exception):
    """Raised when a cluster lifecycle operation fails."""
    pass


def get_k3d_bin() -> str:
    """Resolve path to k3d binary or raise ClusterError."""
    bin_path = find_binary("k3d")
    if not bin_path:
        raise ClusterError(
            "k3d binary not found. Please run `cloudarena setup -i` to install it."
        )
    return bin_path


def is_cluster_running(cluster_name: str = "cloudarena-cluster") -> bool:
    """Check if the named k3d cluster currently exists and has active nodes."""
    try:
        k3d = get_k3d_bin()
    except ClusterError:
        return False

    env = get_extended_path_env()
    proc = subprocess.run(
        [k3d, "cluster", "list", "--output", "json"],
        capture_output=True,
        text=True,
        env=env,
    )
    if proc.returncode != 0:
        return False

    try:
        clusters = json.loads(proc.stdout)
        if isinstance(clusters, list):
            for c in clusters:
                if c.get("name") == cluster_name:
                    # Check if servers or agents count > 0
                    return True
    except Exception:
        return False

    return False


def create_cluster(
    cluster_name: str = "cloudarena-cluster",
    workers: int = 2,
    timeout: str = "180s",
) -> None:
    """Create a multi-node k3d cluster and write kubeconfig to isolated file."""
    k3d = get_k3d_bin()
    ensure_directories()
    env = get_extended_path_env()

    if is_cluster_running(cluster_name):
        # Refresh kubeconfig just in case
        export_kubeconfig(cluster_name)
        return

    cmd = [
        k3d,
        "cluster",
        "create",
        cluster_name,
        "--servers",
        "1",
        "--agents",
        str(workers),
        "--wait",
        "--timeout",
        timeout,
        "--kubeconfig-switch-context=false",
        "--kubeconfig-update-default=false",
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True, env=env)
    if proc.returncode != 0:
        raise ClusterError(f"Failed to create k3d cluster: {proc.stderr or proc.stdout}")

    export_kubeconfig(cluster_name)


def export_kubeconfig(cluster_name: str = "cloudarena-cluster") -> None:
    """Extract cluster kubeconfig into ~/.cloudarena/kubeconfig.yaml."""
    k3d = get_k3d_bin()
    env = get_extended_path_env()

    proc = subprocess.run(
        [k3d, "kubeconfig", "get", cluster_name],
        capture_output=True,
        text=True,
        env=env,
    )
    if proc.returncode != 0:
        raise ClusterError(f"Failed to get kubeconfig: {proc.stderr}")

    with open(KUBECONFIG_FILE, "w", encoding="utf-8") as f:
        f.write(proc.stdout)

    os.chmod(KUBECONFIG_FILE, 0o600)


def delete_cluster(cluster_name: str = "cloudarena-cluster") -> None:
    """Delete the k3d cluster and clean up kubeconfig."""
    try:
        k3d = get_k3d_bin()
    except ClusterError:
        return

    env = get_extended_path_env()
    subprocess.run([k3d, "cluster", "delete", cluster_name], capture_output=True, env=env)

    if KUBECONFIG_FILE.exists():
        try:
            KUBECONFIG_FILE.unlink()
        except OSError:
            pass


def list_nodes_summary() -> list[dict[str, str]]:
    """Return summary of cluster nodes via Kubernetes API."""
    from cloudarena.k8s.client import get_core_v1
    core_v1 = get_core_v1()
    nodes = core_v1.list_node().items
    summary = []
    for node in nodes:
        name = node.metadata.name
        ready_cond = next((c for c in node.status.conditions if c.type == "Ready"), None)
        status = "Ready" if ready_cond and ready_cond.status == "True" else "NotReady"
        roles = []
        for label in node.metadata.labels:
            if "node-role.kubernetes.io/" in label:
                roles.append(label.split("/")[-1])
        role_str = ",".join(roles) if roles else "worker"
        summary.append({
            "name": name,
            "status": status,
            "role": role_str,
            "k8s_version": node.status.node_info.kubelet_version,
        })
    return summary
