"""System pre-flight checks and hardware resource validation."""

import os
import platform
import shutil
import subprocess
from dataclasses import dataclass
from typing import Optional
import psutil

from cloudarena.core.paths import BIN_DIR


@dataclass
class CheckResult:
    name: str
    passed: bool
    details: str
    remediation: Optional[str] = None


@dataclass
class EnvironmentStatus:
    os_name: str
    architecture: str
    cpu_cores: int
    ram_gb: float
    disk_free_gb: float
    docker_installed: bool
    docker_running: bool
    docker_error: Optional[str]
    k3d_path: Optional[str]
    kubectl_path: Optional[str]
    checks: list[CheckResult]

    @property
    def all_passed(self) -> bool:
        return all(c.passed for c in self.checks)


def find_binary(binary_name: str) -> Optional[str]:
    """Look for binary in ~/.cloudarena/bin first, then in system PATH."""
    local_path = BIN_DIR / binary_name
    if local_path.is_file() and os.access(local_path, os.X_OK):
        return str(local_path)
    return shutil.which(binary_name)


def inspect_docker() -> tuple[bool, bool, Optional[str]]:
    """Check if Docker is installed and daemon is accessible."""
    docker_path = shutil.which("docker")
    if not docker_path:
        return False, False, "Docker is not installed or not in PATH."

    try:
        proc = subprocess.run(
            ["docker", "info", "--format", "{{.ServerVersion}}"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if proc.returncode == 0:
            return True, True, None

        stderr = proc.stderr.lower()
        if "permission denied" in stderr:
            user = os.environ.get("USER", "your_user")
            msg = (
                f"Docker daemon permission denied. Add user to docker group:\n"
                f"  sudo usermod -aG docker {user}\n"
                f"  newgrp docker  (or log out and log back in)"
            )
            return True, False, msg
        elif "is the docker daemon running" in stderr or "cannot connect" in stderr:
            return True, False, "Docker daemon is not running. Start with: sudo systemctl start docker"
        else:
            return True, False, proc.stderr.strip() or "Docker daemon returned non-zero code."
    except subprocess.TimeoutExpired:
        return True, False, "Docker daemon connection timed out."
    except Exception as e:
        return True, False, str(e)


def audit_environment() -> EnvironmentStatus:
    """Run full environment pre-flight audit."""
    os_name = platform.system()
    architecture = platform.machine()
    cpu_cores = os.cpu_count() or 1
    ram_bytes = psutil.virtual_memory().total
    ram_gb = round(ram_bytes / (1024**3), 2)
    disk_free = psutil.disk_usage(str(Path.home() if "Path" in globals() else "/")).free
    disk_free_gb = round(disk_free / (1024**3), 2)

    docker_installed, docker_running, docker_error = inspect_docker()
    k3d_path = find_binary("k3d")
    kubectl_path = find_binary("kubectl")

    checks: list[CheckResult] = []

    # 1. OS check
    if os_name in ("Linux", "Darwin", "Windows"):
        checks.append(CheckResult("Supported OS", True, f"{os_name} ({architecture})"))
    else:
        checks.append(
            CheckResult(
                "Supported OS",
                False,
                f"Unsupported OS: {os_name}",
                "CloudArena requires Linux, macOS, or Windows WSL2.",
            )
        )

    # 2. CPU check (>= 2 cores recommended)
    if cpu_cores >= 2:
        checks.append(CheckResult("CPU Cores", True, f"{cpu_cores} cores detected"))
    else:
        checks.append(
            CheckResult(
                "CPU Cores",
                False,
                f"Only {cpu_cores} core detected",
                "At least 2 CPU cores are recommended to run a multi-node cluster.",
            )
        )

    # 3. RAM check (>= 4GB recommended)
    if ram_gb >= 3.5:
        checks.append(CheckResult("Memory (RAM)", True, f"{ram_gb} GB total"))
    else:
        checks.append(
            CheckResult(
                "Memory (RAM)",
                False,
                f"Only {ram_gb} GB RAM detected",
                "At least 4 GB RAM is strongly recommended for k3d cluster execution.",
            )
        )

    # 4. Disk space (>= 10GB recommended)
    if disk_free_gb >= 5.0:
        checks.append(CheckResult("Free Disk Space", True, f"{disk_free_gb} GB free"))
    else:
        checks.append(
            CheckResult(
                "Free Disk Space",
                False,
                f"Only {disk_free_gb} GB free",
                "At least 5-10 GB free disk space is recommended for container images.",
            )
        )

    # 5. Docker installed
    if docker_installed:
        checks.append(CheckResult("Docker Binary", True, "Installed"))
    else:
        checks.append(
            CheckResult(
                "Docker Binary",
                False,
                "Not found",
                "Install Docker Desktop or Docker Engine: https://docs.docker.com/engine/install/",
            )
        )

    # 6. Docker daemon running
    if docker_running:
        checks.append(CheckResult("Docker Daemon", True, "Active and responsive"))
    else:
        checks.append(
            CheckResult(
                "Docker Daemon",
                False,
                "Unavailable / Access Denied",
                docker_error or "Ensure Docker is running and your user has permissions.",
            )
        )

    # 7. k3d binary
    if k3d_path:
        checks.append(CheckResult("k3d Tool", True, f"Found at {k3d_path}"))
    else:
        checks.append(
            CheckResult(
                "k3d Tool",
                False,
                "Not installed",
                "Run `cloudarena setup --install-tools` to auto-install k3d to ~/.cloudarena/bin",
            )
        )

    # 8. kubectl binary
    if kubectl_path:
        checks.append(CheckResult("kubectl Tool", True, f"Found at {kubectl_path}"))
    else:
        checks.append(
            CheckResult(
                "kubectl Tool",
                False,
                "Not installed",
                "Run `cloudarena setup --install-tools` to auto-install kubectl to ~/.cloudarena/bin",
            )
        )

    return EnvironmentStatus(
        os_name=os_name,
        architecture=architecture,
        cpu_cores=cpu_cores,
        ram_gb=ram_gb,
        disk_free_gb=disk_free_gb,
        docker_installed=docker_installed,
        docker_running=docker_running,
        docker_error=docker_error,
        k3d_path=k3d_path,
        kubectl_path=kubectl_path,
        checks=checks,
    )
