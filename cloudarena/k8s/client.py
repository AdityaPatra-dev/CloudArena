"""Kubernetes client configuration and declarative manifest application."""

import os
from pathlib import Path
from typing import Any, Optional
import yaml
from kubernetes import client, config as k8s_config
from kubernetes.client.rest import ApiException

from cloudarena.core.paths import KUBECONFIG_FILE


def is_kubeconfig_present() -> bool:
    """Check if the CloudArena isolated kubeconfig file exists."""
    return KUBECONFIG_FILE.exists() and KUBECONFIG_FILE.stat().st_size > 0


def get_k8s_client() -> client.ApiClient:
    """Initialize and return a Kubernetes ApiClient pointed to CloudArena kubeconfig."""
    if not is_kubeconfig_present():
        raise FileNotFoundError(
            f"CloudArena kubeconfig not found at {KUBECONFIG_FILE}. "
            "Has the cluster been created with `cloudarena start`?"
        )
    return k8s_config.new_client_from_config(config_file=str(KUBECONFIG_FILE))


def get_core_v1() -> client.CoreV1Api:
    """Get Kubernetes CoreV1Api client."""
    return client.CoreV1Api(api_client=get_k8s_client())


def get_apps_v1() -> client.AppsV1Api:
    """Get Kubernetes AppsV1Api client."""
    return client.AppsV1Api(api_client=get_k8s_client())


def apply_manifest_file(file_path: Path) -> list[Any]:
    """Load and apply all resources from a multi-document YAML manifest file."""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()
    return apply_yaml_string(content)


def apply_yaml_string(yaml_content: str) -> list[Any]:
    """Parse and apply YAML string containing one or more Kubernetes resource manifests."""
    from kubernetes import utils
    api_client = get_k8s_client()
    docs = list(yaml.safe_load_all(yaml_content))
    applied = []
    for doc in docs:
        if not doc:
            continue
        try:
            res = utils.create_from_dict(api_client, data=doc)
            applied.append(res)
        except ApiException as e:
            # If resource already exists (409 Conflict), try replacing/patching
            if e.status == 409:
                pass
            else:
                raise
    return applied
