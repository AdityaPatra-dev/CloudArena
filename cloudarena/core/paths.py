"""Filesystem and directory path management for CloudArena."""

import os
from pathlib import Path


def _resolve_home_dir() -> Path:
    if "CLOUDARENA_HOME" in os.environ:
        return Path(os.environ["CLOUDARENA_HOME"])
    
    default_home = Path.home() / ".cloudarena"
    try:
        default_home.mkdir(parents=True, exist_ok=True)
        return default_home
    except OSError:
        # Fallback to local workspace or tmp in constrained/sandboxed environments
        local_fallback = Path.cwd() / ".cloudarena"
        try:
            local_fallback.mkdir(parents=True, exist_ok=True)
            return local_fallback
        except OSError:
            tmp_fallback = Path("/tmp/.cloudarena")
            tmp_fallback.mkdir(parents=True, exist_ok=True)
            return tmp_fallback


CLOUDARENA_HOME = _resolve_home_dir()
BIN_DIR = CLOUDARENA_HOME / "bin"
CONFIG_FILE = CLOUDARENA_HOME / "config.yaml"
KUBECONFIG_FILE = CLOUDARENA_HOME / "kubeconfig.yaml"
LOGS_DIR = CLOUDARENA_HOME / "logs"
POSTMORTEMS_DIR = CLOUDARENA_HOME / "postmortems"
REPLAYS_DIR = CLOUDARENA_HOME / "replays"

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
MANIFESTS_DIR = PACKAGE_ROOT / "manifests"


def ensure_directories() -> None:
    """Create all required CloudArena directories if they do not exist."""
    for d in (CLOUDARENA_HOME, BIN_DIR, LOGS_DIR, POSTMORTEMS_DIR, REPLAYS_DIR):
        try:
            d.mkdir(parents=True, exist_ok=True)
        except OSError:
            pass



def get_extended_path_env() -> dict[str, str]:
    """Return an os.environ copy with ~/.cloudarena/bin prepended to PATH."""
    env = os.environ.copy()
    bin_path = str(BIN_DIR)
    current_path = env.get("PATH", "")
    if bin_path not in current_path.split(os.pathsep):
        env["PATH"] = f"{bin_path}{os.pathsep}{current_path}"
    return env
