"""Automated binary installer for isolated dependencies (k3d, kubectl)."""

import os
import platform
import stat
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
    temp_path = target_path.with_suffix(".tmp")

    def _report(block_num: int, block_size: int, total_size: int):
        if progress_callback and total_size > 0:
            downloaded = block_num * block_size
            progress_callback(min(downloaded, total_size), total_size)

    urllib.request.urlretrieve(url, temp_path, reporthook=_report)
    temp_path.replace(target_path)

    # Set executable permissions (chmod +x)
    current_mode = os.stat(target_path).st_mode
    os.chmod(target_path, current_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)


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
