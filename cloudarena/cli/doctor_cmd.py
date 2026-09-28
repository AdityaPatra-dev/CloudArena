"""Cross-Platform Environment Doctor for CloudArena."""

import os
import platform
import shutil
import socket
import subprocess
import sys
from pathlib import Path
from typing import Any, Callable, NamedTuple, Optional
import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from cloudarena.core.environment import find_binary
from cloudarena.core.paths import BIN_DIR, CLOUDARENA_HOME

doctor_cli = typer.Typer(help="Inspect system readiness and diagnose local environment issues.")
console = Console()


class DiagnosticResult(NamedTuple):
    name: str
    status: str  # "PASS", "WARN", "FAIL"
    message: str
    remediation: Optional[str] = None


def check_os_arch() -> DiagnosticResult:
    """1. Inspect OS and CPU Architecture."""
    system = platform.system()
    machine = platform.machine()
    supported = system in ("Linux", "Darwin", "Windows")
    if supported:
        return DiagnosticResult(
            name="OS & Architecture",
            status="PASS",
            message=f"{system} ({machine}) supported.",
        )
    return DiagnosticResult(
        name="OS & Architecture",
        status="WARN",
        message=f"{system} ({machine}) may require custom configuration.",
        remediation="CloudArena is optimized for Linux, macOS, and Windows (WSL2).",
    )


def check_virtualization() -> DiagnosticResult:
    """2. Check virtualization / cgroups support."""
    if platform.system() == "Linux":
        cgroup2 = Path("/sys/fs/cgroup/cgroup.controllers").exists()
        kvm = Path("/dev/kvm").exists()
        if cgroup2 or kvm:
            return DiagnosticResult(
                name="Hardware Virtualization / cgroups",
                status="PASS",
                message="Linux cgroups v2 / KVM enabled.",
            )
        return DiagnosticResult(
            name="Hardware Virtualization / cgroups",
            status="WARN",
            message="cgroups v1 detected; cgroups v2 recommended.",
            remediation="Ensure modern kernel with systemd.unified_cgroup_hierarchy=1.",
        )
    return DiagnosticResult(
        name="Hardware Virtualization / cgroups",
        status="PASS",
        message="Host virtualization handled by hypervisor/WSL2.",
    )


def check_docker_daemon() -> DiagnosticResult:
    """3. Check Docker Engine daemon connectivity."""
    docker_bin = shutil.which("docker")
    if not docker_bin:
        return DiagnosticResult(
            name="Docker Daemon",
            status="FAIL",
            message="Docker CLI binary not found in PATH.",
            remediation="Install Docker: https://docs.docker.com/engine/install/ or Docker Desktop.",
        )

    try:
        res = subprocess.run(
            ["docker", "info"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5,
        )
        if res.returncode == 0:
            return DiagnosticResult(
                name="Docker Daemon",
                status="PASS",
                message="Docker Engine is running and responsive.",
            )
        return DiagnosticResult(
            name="Docker Daemon",
            status="FAIL",
            message="Docker daemon is not running.",
            remediation="Start Docker: `sudo systemctl start docker` or open Docker Desktop.",
        )
    except Exception as e:
        return DiagnosticResult(
            name="Docker Daemon",
            status="FAIL",
            message=f"Failed to query Docker: {str(e)[:45]}",
            remediation="Ensure Docker daemon is started: `sudo systemctl start docker`.",
        )


def check_docker_permissions() -> DiagnosticResult:
    """4. Check Docker non-root socket permissions."""
    try:
        res = subprocess.run(
            ["docker", "ps"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=4,
        )
        if res.returncode == 0:
            return DiagnosticResult(
                name="Docker Non-Root Permissions",
                status="PASS",
                message="User can execute Docker commands without sudo.",
            )
        return DiagnosticResult(
            name="Docker Non-Root Permissions",
            status="WARN",
            message="Docker requires elevated permissions.",
            remediation="Add user to docker group: `sudo usermod -aG docker $USER && newgrp docker`.",
        )
    except Exception:
        return DiagnosticResult(
            name="Docker Non-Root Permissions",
            status="WARN",
            message="Cannot query docker socket.",
            remediation="Run `sudo usermod -aG docker $USER` and log back in.",
        )


def check_memory() -> DiagnosticResult:
    """5. Check available RAM."""
    try:
        if platform.system() == "Linux":
            with open("/proc/meminfo", "r") as f:
                for line in f:
                    if line.startswith("MemTotal:"):
                        kb = int(line.split()[1])
                        gb = kb / (1024 * 1024)
                        if gb >= 7.5:
                            return DiagnosticResult(
                                name="System Memory (RAM)",
                                status="PASS",
                                message=f"{gb:.1f} GB RAM available (>= 8 GB optimal).",
                            )
                        elif gb >= 3.8:
                            return DiagnosticResult(
                                name="System Memory (RAM)",
                                status="WARN",
                                message=f"{gb:.1f} GB RAM available (minimum 4 GB met, 8 GB recommended).",
                            )
                        else:
                            return DiagnosticResult(
                                name="System Memory (RAM)",
                                status="FAIL",
                                message=f"{gb:.1f} GB RAM is insufficient for Kubernetes clusters.",
                                remediation="Allocate at least 4 GB RAM to host or WSL2 VM.",
                            )
    except Exception:
        pass
    return DiagnosticResult(
        name="System Memory (RAM)",
        status="PASS",
        message="RAM check skipped on non-Linux host.",
    )


def check_disk_space() -> DiagnosticResult:
    """6. Check available disk space on home directory."""
    try:
        stat = shutil.disk_usage(CLOUDARENA_HOME)
        free_gb = stat.free / (1024 * 1024 * 1024)
        if free_gb >= 10.0:
            return DiagnosticResult(
                name="Disk Storage Space",
                status="PASS",
                message=f"{free_gb:.1f} GB free disk space available.",
            )
        elif free_gb >= 4.0:
            return DiagnosticResult(
                name="Disk Storage Space",
                status="WARN",
                message=f"{free_gb:.1f} GB free space remaining (low for container images).",
                remediation="Free up disk space with `docker system prune -f`.",
            )
        else:
            return DiagnosticResult(
                name="Disk Storage Space",
                status="FAIL",
                message=f"{free_gb:.1f} GB is insufficient to download images.",
                remediation="Free at least 5 GB disk space on host disk.",
            )
    except Exception as e:
        return DiagnosticResult(
            name="Disk Storage Space",
            status="WARN",
            message=f"Could not read disk usage: {e}",
        )


def check_port_availability() -> DiagnosticResult:
    """7. Check critical TCP ports (8000, 8080, 8443, 6443)."""
    ports = [8000, 8080, 8443, 6443]
    busy_ports = []
    for port in ports:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(0.2)
            result = s.connect_ex(("127.0.0.1", port))
            if result == 0:
                # Port is in use
                busy_ports.append(port)

    if not busy_ports:
        return DiagnosticResult(
            name="Port Availability (8000, 8080, 8443, 6443)",
            status="PASS",
            message="All core cluster & backend ports are free.",
        )
    return DiagnosticResult(
        name="Port Availability (8000, 8080, 8443, 6443)",
        status="WARN",
        message=f"Ports currently in use: {', '.join(map(str, busy_ports))}",
        remediation="If other services use these ports, terminate them or run `cloudarena reset`.",
    )


def check_tooling_binaries() -> DiagnosticResult:
    """8. Check k3d and kubectl binaries."""
    k3d_bin = find_binary("k3d")
    kubectl_bin = find_binary("kubectl")

    missing = []
    if not k3d_bin:
        missing.append("k3d")
    if not kubectl_bin:
        missing.append("kubectl")

    if not missing:
        return DiagnosticResult(
            name="Kubernetes Tooling (k3d, kubectl)",
            status="PASS",
            message="Both k3d and kubectl are installed and executable.",
        )
    return DiagnosticResult(
        name="Kubernetes Tooling (k3d, kubectl)",
        status="FAIL",
        message=f"Missing required binaries: {', '.join(missing)}",
        remediation="Run `cloudarena setup -i` to automatically download standalone binaries.",
    )


def check_dns_resolution() -> DiagnosticResult:
    """9. Check DNS resolution."""
    try:
        socket.gethostbyname("localhost")
        return DiagnosticResult(
            name="Local DNS Resolution",
            status="PASS",
            message="Local loopback and hostname resolution functional.",
        )
    except Exception:
        return DiagnosticResult(
            name="Local DNS Resolution",
            status="FAIL",
            message="Cannot resolve 'localhost'. Check /etc/hosts.",
            remediation="Ensure '127.0.0.1 localhost' is present in /etc/hosts.",
        )


def check_cloudarena_home() -> DiagnosticResult:
    """10. Check ~/.cloudarena directory permissions."""
    try:
        test_file = CLOUDARENA_HOME / ".doctor_probe"
        test_file.write_text("probe", encoding="utf-8")
        test_file.unlink()
        return DiagnosticResult(
            name="CloudArena Home (~/.cloudarena)",
            status="PASS",
            message=f"Directory is readable and writable at {CLOUDARENA_HOME}.",
        )
    except Exception as e:
        return DiagnosticResult(
            name="CloudArena Home (~/.cloudarena)",
            status="FAIL",
            message=f"Permission error: {e}",
            remediation=f"Ensure write permissions: `chmod -R u+rw {CLOUDARENA_HOME}`.",
        )


def check_python_environment() -> DiagnosticResult:
    """11. Check Python version."""
    major, minor = sys.version_info.major, sys.version_info.minor
    if major == 3 and minor >= 10:
        return DiagnosticResult(
            name="Python Runtime",
            status="PASS",
            message=f"Python {major}.{minor} active (>= 3.10 required).",
        )
    return DiagnosticResult(
        name="Python Runtime",
        status="FAIL",
        message=f"Python {major}.{minor} is unsupported.",
        remediation="Install Python 3.10 or higher.",
    )


def check_registry_connectivity() -> DiagnosticResult:
    """12. Check outbound connectivity to container registries."""
    test_hosts = ["registry.k8s.io", "ghcr.io", "docker.io"]
    reachable = 0
    for host in test_hosts:
        try:
            with socket.create_connection((host, 443), timeout=2):
                reachable += 1
        except Exception:
            pass

    if reachable >= 2:
        return DiagnosticResult(
            name="Registry Connectivity",
            status="PASS",
            message=f"Connected to {reachable}/{len(test_hosts)} container registries.",
        )
    elif reachable == 1:
        return DiagnosticResult(
            name="Registry Connectivity",
            status="WARN",
            message="Limited internet access to container registries.",
            remediation="Check proxy or firewall settings if pulling images fails.",
        )
    return DiagnosticResult(
        name="Registry Connectivity",
        status="WARN",
        message="Cannot reach container registries (offline mode).",
        remediation="Connect to the internet to download cluster images.",
    )


def run_all_diagnostics() -> list[DiagnosticResult]:
    """Execute all 12 pre-flight diagnostic checks."""
    checks: list[Callable[[], DiagnosticResult]] = [
        check_os_arch,
        check_virtualization,
        check_docker_daemon,
        check_docker_permissions,
        check_memory,
        check_disk_space,
        check_port_availability,
        check_tooling_binaries,
        check_dns_resolution,
        check_cloudarena_home,
        check_python_environment,
        check_registry_connectivity,
    ]
    return [chk() for chk in checks]


@doctor_cli.command("diagnose")
def run_doctor():
    """Run the 12-point pre-flight diagnostics suite."""
    console.print(Panel(
        "[bold cyan]CloudArena Pre-Flight Environment Doctor[/bold cyan]\n"
        "[dim]Analyzing hardware, Docker daemon, container virtualization, and local tooling...[/dim]",
        border_style="cyan",
    ))

    results = run_all_diagnostics()

    table = Table(show_lines=True, expand=True)
    table.add_column("Diagnostic Check", style="bold white", ratio=2)
    table.add_column("Status", justify="center", ratio=1)
    table.add_column("Details & Output", ratio=3)

    passed_count = 0
    warn_count = 0
    fail_count = 0
    remediations: list[tuple[str, str]] = []

    for r in results:
        if r.status == "PASS":
            status_cell = "[bold green]✓ PASS[/bold green]"
            passed_count += 1
        elif r.status == "WARN":
            status_cell = "[bold yellow]⚠ WARN[/bold yellow]"
            warn_count += 1
            if r.remediation:
                remediations.append((r.name, r.remediation))
        else:
            status_cell = "[bold red]✖ FAIL[/bold red]"
            fail_count += 1
            if r.remediation:
                remediations.append((r.name, r.remediation))

        table.add_row(r.name, status_cell, r.message)

    console.print(table)

    # Remediation guidance box if any warnings or failures
    if remediations:
        rem_table = Table(show_header=False, box=None, expand=True)
        rem_table.add_column("Check", style="bold yellow", ratio=1)
        rem_table.add_column("Action", style="cyan", ratio=3)
        for check_name, action in remediations:
            rem_table.add_row(f"• {check_name}:", action)

        console.print(Panel(
            rem_table,
            title="[bold yellow]Recommended Remediation Actions[/bold yellow]",
            border_style="yellow",
        ))

    # Summary
    if fail_count == 0:
        console.print(
            f"\n[bold green]✓ Doctor Verdict: Environment is Ready for CloudArena![/bold green] "
            f"({passed_count} passed, {warn_count} warnings)\n"
        )
    else:
        console.print(
            f"\n[bold red]✖ Doctor Verdict: Found {fail_count} critical issues to resolve before launching.[/bold red] "
            f"({passed_count} passed, {warn_count} warnings, {fail_count} failed)\n"
        )
        raise typer.Exit(code=1)
