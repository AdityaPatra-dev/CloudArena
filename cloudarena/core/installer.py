"""Automated dependency and binary installer for CloudArena (Docker, k3d, kubectl)."""

import os
import platform
import shutil
import stat
import subprocess
import time
import urllib.request
from pathlib import Path
from typing import Callable, Optional

from cloudarena.core.paths import BIN_DIR, ensure_directories

K3D_VERSION = "v5.7.4"
KUBECTL_VERSION = "v1.30.2"


def get_arch_mappings() -> tuple[str, str]:
    """Return mapped (os_str, arch_str) for binary download URLs."""
    system = platform.system().lower()
    machine = platform.machine().lower()

    if machine in ("x86_64", "amd64"):
        arch = "amd64"
    elif machine in ("aarch64", "arm64"):
        arch = "arm64"
    else:
        arch = machine

    return system, arch


def get_k3d_download_url() -> str:
    """Generate k3d download URL based on OS and architecture."""
    system, arch = get_arch_mappings()
    binary_name = f"k3d-{system}-{arch}"
    if system == "windows":
        binary_name += ".exe"
    return f"https://github.com/k3d-io/k3d/releases/download/{K3D_VERSION}/{binary_name}"


def get_kubectl_download_url() -> str:
    """Generate kubectl download URL based on OS and architecture."""
    system, arch = get_arch_mappings()
    binary_name = "kubectl"
    if system == "windows":
        binary_name += ".exe"
    return f"https://dl.k8s.io/release/{KUBECTL_VERSION}/bin/{system}/{arch}/{binary_name}"


def download_file(
    url: str,
    target_path: Path,
    progress_callback: Optional[Callable[[int, int], None]] = None,
) -> None:
    """Download a remote URL to target_path with optional progress reporting."""
    ensure_directories()
    target_path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = target_path.with_suffix(".tmp")

    def _report(block_num: int, block_size: int, total_size: int):
        if progress_callback and total_size > 0:
            downloaded = block_num * block_size
            progress_callback(min(downloaded, total_size), total_size)

    urllib.request.urlretrieve(url, temp_path, reporthook=_report)
    temp_path.replace(target_path)

    # Set executable permissions (chmod +x)
    try:
        current_mode = os.stat(target_path).st_mode
        os.chmod(target_path, current_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
    except Exception:
        pass


def install_k3d(progress_callback: Optional[Callable[[int, int], None]] = None) -> Path:
    """Download and install k3d into ~/.cloudarena/bin/k3d."""
    target = BIN_DIR / ("k3d.exe" if platform.system().lower() == "windows" else "k3d")
    url = get_k3d_download_url()
    download_file(url, target, progress_callback)
    return target


def install_kubectl(progress_callback: Optional[Callable[[int, int], None]] = None) -> Path:
    """Download and install kubectl into ~/.cloudarena/bin/kubectl."""
    target = BIN_DIR / ("kubectl.exe" if platform.system().lower() == "windows" else "kubectl")
    url = get_kubectl_download_url()
    download_file(url, target, progress_callback)
    return target


def is_docker_installed() -> bool:
    """Check if docker CLI is available in PATH."""
    return shutil.which("docker") is not None


def is_docker_running() -> bool:
    """Check if Docker daemon is responsive."""
    if not is_docker_installed():
        return False
    try:
        res = subprocess.run(
            ["docker", "info"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=4,
        )
        return res.returncode == 0
    except Exception:
        return False


def install_docker() -> bool:
    """Automatically install Docker Engine or Docker Desktop based on host OS."""
    system = platform.system().lower()

    if system == "windows":
        # Check for winget
        winget = shutil.which("winget")
        if winget:
            proc = subprocess.run([
                winget, "install", "Docker.DockerDesktop",
                "--accept-source-agreements", "--accept-package-agreements", "--silent"
            ])
            return proc.returncode == 0
        else:
            # Download official Windows installer
            installer_url = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
            installer_path = BIN_DIR / "DockerDesktopInstaller.exe"
            download_file(installer_url, installer_path)
            proc = subprocess.run([str(installer_path), "install", "--quiet"])
            return proc.returncode == 0

    elif system == "darwin":
        # macOS Homebrew or DMG
        brew = shutil.which("brew")
        if brew:
            proc = subprocess.run([brew, "install", "--cask", "docker"])
            return proc.returncode == 0
        return False

    elif system == "linux":
        # Linux convenience script
        if os.geteuid() == 0:
            cmd = "curl -fsSL https://get.docker.com | sh"
            proc = subprocess.run(cmd, shell=True)
            return proc.returncode == 0
        else:
            sudo = shutil.which("sudo")
            if sudo:
                cmd = "curl -fsSL https://get.docker.com | sudo sh && sudo usermod -aG docker $USER && sudo systemctl enable --now docker"
                proc = subprocess.run(cmd, shell=True)
                return proc.returncode == 0
        return False

    return False


def start_docker_daemon(timeout_seconds: int = 30) -> bool:
    """Attempt to launch Docker Desktop or start Docker daemon and wait for readiness."""
    system = platform.system().lower()

    try:
        if system == "windows":
            desktop_paths = [
                Path("C:/Program Files/Docker/Docker/Docker Desktop.exe"),
                Path(os.environ.get("ProgramFiles", "C:/Program Files")) / "Docker/Docker/Docker Desktop.exe",
            ]
            for p in desktop_paths:
                if p.exists():
                    subprocess.Popen([str(p)], shell=True)
                    break
        elif system == "darwin":
            subprocess.run(["open", "-a", "Docker"], check=False)
        elif system == "linux":
            if os.geteuid() == 0:
                subprocess.run(["systemctl", "start", "docker"], check=False)
            elif shutil.which("sudo"):
                subprocess.run(["sudo", "systemctl", "start", "docker"], check=False)
    except Exception:
        pass

    # Wait for docker socket to become responsive
    start_time = time.time()
    while time.time() - start_time < timeout_seconds:
        if is_docker_running():
            return True
        time.sleep(2)

    return False
