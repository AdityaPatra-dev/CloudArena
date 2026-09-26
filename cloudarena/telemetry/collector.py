"""Telemetry collector for pods, nodes, and synthetic traffic metrics."""

import re
import time
from dataclasses import dataclass, field
from typing import Optional
from kubernetes import client
from kubernetes.client.rest import ApiException

from cloudarena.k8s.client import get_core_v1, is_kubeconfig_present


@dataclass
class PodTelemetry:
    namespace: str
    name: str
    phase: str
    ready: bool
    restarts: int
    exit_code: Optional[int] = None
    termination_reason: Optional[str] = None
    cpu_usage_m: Optional[int] = None
    memory_usage_mi: Optional[float] = None


@dataclass
class NodeTelemetry:
    name: str
    status: str
    roles: str
    cpu_usage_m: Optional[int] = None
    memory_usage_mi: Optional[float] = None


@dataclass
class TrafficTelemetry:
    total_samples: int = 0
    success_count: int = 0
    fail_count: int = 0
    success_rate_pct: float = 100.0
    last_status_code: str = "200"


@dataclass
class ClusterTelemetry:
    timestamp: float = field(default_factory=time.time)
    pods: list[PodTelemetry] = field(default_factory=list)
    nodes: list[NodeTelemetry] = field(default_factory=list)
    traffic: TrafficTelemetry = field(default_factory=TrafficTelemetry)
    is_app_healthy: bool = True
    issues: list[str] = field(default_factory=list)


def collect_traffic_stats() -> TrafficTelemetry:
    """Read recent logs from traffic-gen in cloudarena-system to compute success rate."""
    core_v1 = get_core_v1()
    try:
        pods = core_v1.list_namespaced_pod(
            namespace="cloudarena-system",
            label_selector="app.kubernetes.io/name=traffic-gen",
        ).items
        if not pods:
            return TrafficTelemetry()

        running_pod = next((p for p in pods if p.status.phase == "Running"), pods[0])
        pod_name = running_pod.metadata.name

        logs = core_v1.read_namespaced_pod_log(
            name=pod_name,
            namespace="cloudarena-system",
            tail_lines=30,
        )

        lines = [line.strip() for line in logs.splitlines() if "->" in line]
        if not lines:
            return TrafficTelemetry()

        total = len(lines)
        ok_count = sum(1 for l in lines if "OK (200)" in l)
        fail_count = total - ok_count
        rate = round((ok_count / total) * 100.0, 1)

        last_code = "200"
        match = re.search(r"\(([0-9]{3})\)", lines[-1])
        if match:
            last_code = match.group(1)

        return TrafficTelemetry(
            total_samples=total,
            success_count=ok_count,
            fail_count=fail_count,
            success_rate_pct=rate,
            last_status_code=last_code,
        )
    except Exception:
        return TrafficTelemetry()


def collect_pod_telemetry(namespaces: list[str] = ["cloudarena-app", "cloudarena-system"]) -> list[PodTelemetry]:
    """Gather pod statuses, container states, and restart counts."""
    core_v1 = get_core_v1()
    results = []

    for ns in namespaces:
        try:
            pods = core_v1.list_namespaced_pod(namespace=ns).items
            for pod in pods:
                phase = pod.status.phase or "Unknown"
                restarts = 0
                ready = False
                exit_code = None
                term_reason = None

                if pod.status.container_statuses:
                    for cs in pod.status.container_statuses:
                        restarts += cs.restart_count
                        if cs.ready:
                            ready = True
                        if cs.last_state and cs.last_state.terminated:
                            exit_code = cs.last_state.terminated.exit_code
                            term_reason = cs.last_state.terminated.reason
                        elif cs.state and cs.state.waiting:
                            term_reason = cs.state.waiting.reason

                results.append(PodTelemetry(
                    namespace=ns,
                    name=pod.metadata.name,
                    phase=phase,
                    ready=ready,
                    restarts=restarts,
                    exit_code=exit_code,
                    termination_reason=term_reason,
                ))
        except Exception:
            pass

    return results


def collect_node_telemetry() -> list[NodeTelemetry]:
    """Gather node status and roles."""
    core_v1 = get_core_v1()
    results = []
    try:
        nodes = core_v1.list_node().items
        for node in nodes:
            name = node.metadata.name
            ready_cond = next((c for c in node.status.conditions if c.type == "Ready"), None)
            status = "Ready" if ready_cond and ready_cond.status == "True" else "NotReady"
            roles = [l.split("/")[-1] for l in node.metadata.labels if "node-role.kubernetes.io/" in l]
            role_str = ",".join(roles) if roles else "worker"
            results.append(NodeTelemetry(
                name=name,
                status=status,
                roles=role_str,
            ))
    except Exception:
        pass
    return results


def snapshot_cluster_telemetry() -> ClusterTelemetry:
    """Take a unified snapshot of cluster metrics and detect current health degradation."""
    if not is_kubeconfig_present():
        return ClusterTelemetry(is_app_healthy=False, issues=["Cluster disconnected / kubeconfig missing."])

    pods = collect_pod_telemetry()
    nodes = collect_node_telemetry()
    traffic = collect_traffic_stats()

    issues: list[str] = []

    # 1. Pod health check in cloudarena-app
    app_pods = [p for p in pods if p.namespace == "cloudarena-app"]
    for p in app_pods:
        if p.phase != "Running":
            issues.append(f"Pod '{p.name}' is in non-running phase: {p.phase}")
        elif not p.ready:
            issues.append(f"Pod '{p.name}' containers are not Ready")
        if p.termination_reason in ("OOMKilled", "CrashLoopBackOff", "Error"):
            issues.append(f"Pod '{p.name}' failed with {p.termination_reason} (Exit {p.exit_code or '?'})")

    # 2. Rogue workloads check in cloudarena-system
    system_pods = [p for p in pods if p.namespace == "cloudarena-system"]
    for p in system_pods:
        if "rogue" in p.name.lower() and p.phase == "Running":
            issues.append(f"Rogue compute pod detected: '{p.name}'")

    # 3. Traffic success rate check
    if traffic.total_samples >= 5 and traffic.success_rate_pct < 80.0:
        issues.append(f"Traffic error rate high: {100 - traffic.success_rate_pct:.1f}% dropped (Last: {traffic.last_status_code})")

    # 4. Node ready check
    for n in nodes:
        if n.status != "Ready":
            issues.append(f"Node '{n.name}' is {n.status}")

    is_healthy = len(issues) == 0

    return ClusterTelemetry(
        timestamp=time.time(),
        pods=pods,
        nodes=nodes,
        traffic=traffic,
        is_app_healthy=is_healthy,
        issues=issues,
    )
