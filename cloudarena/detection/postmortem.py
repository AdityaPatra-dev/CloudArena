"""Automated Incident Post-Mortem generator providing SRE learning insights."""

import time
from datetime import datetime
from pathlib import Path
from typing import Optional

from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel

from cloudarena.attacks.base import AttackInfo
from cloudarena.core.paths import POSTMORTEMS_DIR, ensure_directories
from cloudarena.detection.state_machine import IncidentContext
from cloudarena.scoring.calculator import ScoreBreakdown

_SRE_KNOWLEDGE_BASE = {
    1: {
        "rca": "A rogue container without resource limits was scheduled onto a worker node, executing an unthrottled CPU spin loop. This starved neighboring pods of CPU cycles, inflating response latency across the cluster.",
        "prevention": (
            "1. Enforce Kubernetes ResourceQuotas and LimitRanges on every namespace to prevent rogue pods from running without explicit CPU/memory caps.\n"
            "2. Implement Kyverno or OPA Gatekeeper admission webhooks to reject manifests lacking resource limits.\n"
            "3. Isolate mission-critical pods using node affinities and taints/tolerations."
        ),
    },
    2: {
        "rca": "The backend application container had its memory limit configured to 24Mi, which fell below Python's runtime working set. The Linux kernel cgroup controller triggered the Out-Of-Memory (OOM) killer, terminating the container with Exit Code 137.",
        "prevention": (
            "1. Profile container memory consumption under normal and peak loads before specifying resource ceilings.\n"
            "2. Set memory requests equal to average working set and limits with a 30-50% buffer to absorb transient allocations.\n"
            "3. Unlike CPU throttling, memory violations result in immediate process termination; monitor container memory saturation alerts proactively."
        ),
    },
    3: {
        "rca": "The deployment manifest contained a typo in the HTTP liveness probe path (`/healhtz` instead of `/healthz`). The kubelet received 404 Not Found on probe checks, deemed the container unhealthy, and repeatedly restarted it every 30 seconds.",
        "prevention": (
            "1. Differentiate between `readinessProbe` (determines if pod receives traffic) and `livenessProbe` (determines if pod must be killed).\n"
            "2. Always configure a generous `initialDelaySeconds` and `failureThreshold` to avoid restart flapping during cold boot.\n"
            "3. Run automated manifest schema linters (such as `kube-linter` or `polaris`) in CI/CD pipelines."
        ),
    },
    4: {
        "rca": "Synthetic traffic surged 5-10x, but the backend service was restricted to a single container replica. Request queues backed up, latency degraded beyond 1500ms, and connections began dropping with 502/503 errors.",
        "prevention": (
            "1. Avoid running single-replica deployments in production environments; deploy at least 2-3 replicas across distinct failure domains.\n"
            "2. Configure Horizontal Pod Autoscalers (HPA) targeting 70% CPU or custom request-rate metrics.\n"
            "3. Implement graceful degradation, rate limiting, and circuit breakers (e.g. envoy / ingress controllers)."
        ),
    },
}


def generate_postmortem(
    attack_info: AttackInfo,
    context: IncidentContext,
    score: ScoreBreakdown,
) -> Path:
    """Generate markdown post-mortem file and return file path."""
    ensure_directories()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    file_timestamp = int(time.time())
    file_path = POSTMORTEMS_DIR / f"wave_{attack_info.wave_number}_{file_timestamp}.md"

    sre_data = _SRE_KNOWLEDGE_BASE.get(attack_info.wave_number, {
        "rca": attack_info.description,
        "prevention": "Follow standard Kubernetes reliability and telemetry practices.",
    })

    content = f"""# 📝 Incident Post-Mortem: Wave {attack_info.wave_number} — {attack_info.title}

> **Incident ID:** CA-INC-WAVE{attack_info.wave_number}-{file_timestamp}  
> **Date:** {now_str}  
> **Difficulty:** {attack_info.difficulty}  
> **Status:** RESOLVED ✅  

---

## ⏱️ Incident Timeline & Key Metrics
* **Time to Detect (TTD):** {context.time_to_detect}s
* **Time to Resolve (TTR):** {context.time_to_resolve}s
* **Total Wave Duration:** {score.elapsed_seconds}s

## 🏆 Scoring Breakdown
* **Base Points:** +{score.base_points} pts
* **Speed Bonus:** +{score.speed_bonus} pts
* **Hint Penalties:** -{score.hint_penalty} pts
* **Reset Penalties:** -{score.reset_penalty} pts
* **Total Points Awarded:** **{score.net_wave_score} pts**

---

## 🔍 Root Cause Analysis (RCA)
{sre_data['rca']}

## 🛠️ Effective Resolution
{attack_info.expected_fix}

## 💡 SRE Lessons & Production Prevention
{sre_data['prevention']}

---
*Report generated automatically by CloudArena Incident Engine.*
"""

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    return file_path


def display_postmortem_in_console(file_path: Path) -> None:
    """Render markdown post-mortem directly to rich terminal."""
    console = Console()
    with open(file_path, "r", encoding="utf-8") as f:
        md = Markdown(f.read())
    console.print(Panel(md, title="[bold cyan]Post-Mortem Analysis[/bold cyan]", border_style="cyan"))
