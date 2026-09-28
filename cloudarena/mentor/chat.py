"""Interactive Terminal AI Incident Mentor Chat with real-time cluster context."""

import json
import os
import re
from typing import Optional
import requests
from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.prompt import Prompt

from cloudarena.core.config import load_config
from cloudarena.mentor.catalog import get_hint_tier
from cloudarena.telemetry.collector import ClusterTelemetry, snapshot_cluster_telemetry

console = Console()

CHAT_SYSTEM_PROMPT = """You are the CloudArena AI Incident Mentor, an elite Site Reliability Engineer and K8s expert tutor.
You are live pair-debugging with a cloud hackathon competitor inside their terminal.
You have real-time cluster telemetry and active wave context.

MENTORING PRINCIPLES:
1. Socratic Guidance: Never bluntly hand the exact answer immediately. Guide the cadet to discover the root cause using kubectl inspection commands.
2. Concrete Diagnostic Commands: Always suggest exact commands to run (e.g. `kubectl describe`, `kubectl logs`, `kubectl get events`).
3. Explain the Underlying Mechanism: Explain why Kubernetes behaves the way it does (e.g., how cgroups kill OOM pods, how CoreDNS resolves cluster.local, how RBAC verifies ServiceAccount tokens).
4. Concise Terminal Formatting: Format responses clearly using markdown bullet points and code blocks.
"""


def _get_context_summary(wave: int, telemetry: ClusterTelemetry) -> dict:
    return {
        "active_wave": wave,
        "is_healthy": telemetry.is_app_healthy,
        "detected_issues": telemetry.issues,
        "traffic_success_rate": f"{telemetry.traffic.success_rate_pct}%",
        "failing_pods": [
            {
                "name": p.name,
                "namespace": p.namespace,
                "phase": p.phase,
                "restarts": p.restarts,
                "termination_reason": p.termination_reason,
                "exit_code": p.exit_code,
            }
            for p in telemetry.pods
            if not p.ready or p.restarts > 0 or p.termination_reason
        ],
    }


def query_llm_chat(messages: list[dict], wave: int, telemetry: ClusterTelemetry) -> Optional[str]:
    """Query external LLM (Gemini or Ollama) with multi-turn conversation context."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("CLOUDARENA_AI_KEY")
    ollama_url = os.environ.get("OLLAMA_HOST")

    context = _get_context_summary(wave, telemetry)
    system_instruction = f"{CHAT_SYSTEM_PROMPT}\n\nCURRENT CLUSTER CONTEXT:\n{json.dumps(context, indent=2)}"

    # 1. Try Gemini
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            gemini_contents = []
            for msg in messages:
                role = "user" if msg["role"] == "user" else "model"
                gemini_contents.append({"role": role, "parts": [{"text": msg["content"]}]})

            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": gemini_contents,
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 600},
            }
            resp = requests.post(url, json=payload, timeout=8.0)
            if resp.status_code == 200:
                data = resp.json()
                return data["candidates"][0]["content"]["parts"][0]["text"].strip()
        except Exception:
            pass

    # 2. Try Ollama
    if ollama_url:
        try:
            url = f"{ollama_url.rstrip('/')}/api/chat"
            ollama_messages = [{"role": "system", "content": system_instruction}] + messages
            resp = requests.post(
                url,
                json={"model": os.environ.get("OLLAMA_MODEL", "llama3"), "messages": ollama_messages, "stream": False},
                timeout=10.0,
            )
            if resp.status_code == 200:
                return resp.json()["message"]["content"].strip()
        except Exception:
            pass

    return None


def offline_mentor_reply(query: str, wave: int, telemetry: ClusterTelemetry) -> str:
    """Smart pattern-matching offline mentor providing tailored SRE guidance."""
    q = query.lower()

    # Generic SRE status or triage request
    if any(k in q for k in ["status", "what is happening", "what's happening", "where to start", "overview"]):
        status_txt = "🔴 **Degraded / Outage Detected**" if not telemetry.is_app_healthy else "🟢 **Cluster Operational**"
        issues_txt = "\n".join(f"- ⚠️ {i}" for i in telemetry.issues) if telemetry.issues else "- All microservices responding."
        return (
            f"### 🔍 Cluster Health Triage\n\n"
            f"**Current Status:** {status_txt}\n\n"
            f"**Traffic Success Rate:** `{telemetry.traffic.success_rate_pct}%`\n\n"
            f"**Active Findings:**\n{issues_txt}\n\n"
            f"**Recommended First Step:**\n"
            f"```bash\nkubectl get pods -n cloudarena-app -o wide\nkubectl get events -n cloudarena-app --sort-by='.lastTimestamp'\n```"
        )

    # DNS issues (Wave 5 or DNS queries)
    if any(k in q for k in ["dns", "resolve", "lookup", "coredns", "name resolution"]):
        return (
            "### 🌐 DNS Resolution Diagnostic Pattern\n\n"
            "When pods fail to resolve internal or external services, check two layers:\n\n"
            "1. **CoreDNS Pods in `kube-system`:**\n"
            "   ```bash\n   kubectl get pods -n kube-system -l k8s-app=kube-dns\n   kubectl logs -n kube-system -l k8s-app=kube-dns\n   ```\n\n"
            "2. **Pod DNS Specification (`dnsPolicy`):**\n"
            "   Verify if the failing pod has its `dnsPolicy` set to `None` with an empty or broken `dnsConfig`.\n"
            "   Normal Kubernetes pods should use:\n"
            "   ```yaml\n   dnsPolicy: ClusterFirst\n   ```"
        )

    # Memory / OOMKilled (Wave 2 or memory queries)
    if any(k in q for k in ["oom", "oomkilled", "memory", "137", "crashloopbackoff"]):
        return (
            "### 🧠 Memory Outage & OOMKilled Diagnostic Pattern\n\n"
            "When Kubernetes kills a container with **Exit Code 137**, the Linux cgroup memory limit was exceeded.\n\n"
            "1. **Inspect Termination Reason:**\n"
            "   ```bash\n   kubectl describe pod -n cloudarena-app -l app.kubernetes.io/name=payment-service\n   ```\n"
            "   Look for `Last State: Terminated` with `Reason: OOMKilled`.\n\n"
            "2. **Remediation Strategy:**\n"
            "   Check `resources.limits.memory` in the Deployment specification. Either raise the ceiling or optimize the application payload."
        )

    # CPU / Starvation (Wave 1)
    if any(k in q for k in ["cpu", "throttling", "starvation", "slow", "load", "quota"]):
        return (
            "### ⚡ CPU Throttling & Starvation Diagnostic Pattern\n\n"
            "When CPU limits are set excessively low (e.g. `20m`), CFS quota throttling triggers severe latency spikes.\n\n"
            "1. **Check CPU metrics and requests:**\n"
            "   ```bash\n   kubectl top pods -n cloudarena-app\n   kubectl get deploy -n cloudarena-app -o yaml | grep -A 5 resources\n   ```\n\n"
            "2. **Remediation:**\n"
            "   Set realistic CPU limits (e.g. `200m` to `500m`) to prevent container execution starvation."
        )

    # Health Probes (Wave 3)
    if any(k in q for k in ["probe", "liveness", "readiness", "startup", "health"]):
        return (
            "### 💓 Health Probe Deadlock Diagnostic Pattern\n\n"
            "A pod entering continuous restart cycles is frequently suffering from a broken **Liveness Probe**.\n\n"
            "1. **Inspect Probe Failures:**\n"
            "   ```bash\n   kubectl describe pod -n cloudarena-app\n   ```\n"
            "   Check the `Events:` section for `Liveness probe failed: HTTP probe failed with statuscode: 404`.\n\n"
            "2. **Remediation:**\n"
            "   Verify the probe `httpGet.path` and `port` against the actual server routes (e.g., `/healthz` vs `/health`)."
        )

    # Storage (Wave 6)
    if any(k in q for k in ["storage", "disk", "readonly", "pvc", "pv", "mount", "write"]):
        return (
            "### 💾 Storage Deadlock Diagnostic Pattern\n\n"
            "If database or cache writes fail with `Read-only file system`:\n\n"
            "1. **Inspect VolumeMounts:**\n"
            "   ```bash\n   kubectl get deploy -n cloudarena-app -o yaml\n   ```\n"
            "   Check if `volumeMounts[].readOnly` is accidentally set to `true` on write paths like `/data`.\n\n"
            "2. **Verify PVC Status:**\n"
            "   ```bash\n   kubectl get pvc -n cloudarena-app\n   ```"
        )

    # RBAC (Wave 7)
    if any(k in q for k in ["rbac", "permission", "403", "forbidden", "serviceaccount", "rolebinding"]):
        return (
            "### 🔐 RBAC Authorization Diagnostic Pattern\n\n"
            "When a microservice receives `403 Forbidden` from the Kubernetes API server:\n\n"
            "1. **Test Permissions Directly:**\n"
            "   ```bash\n   kubectl auth can-i get pods --as=system:serviceaccount:cloudarena-app:telemetry-collector -n cloudarena-app\n   ```\n\n"
            "2. **Check RoleBinding:**\n"
            "   Ensure the ServiceAccount is bound to a `ClusterRole` or `Role` granting the required `apiGroups` and `verbs`."
        )

    # TLS / Ingress (Wave 8 or Wave 4)
    if any(k in q for k in ["tls", "ssl", "certificate", "ingress", "handshake", "502"]):
        return (
            "### 🔒 Ingress & TLS Handshake Diagnostic Pattern\n\n"
            "If HTTPS requests fail during the SSL handshake:\n\n"
            "1. **Inspect TLS Secret:**\n"
            "   ```bash\n   kubectl get secret -n cloudarena-app\n   kubectl describe secret cloudarena-tls -n cloudarena-app\n   ```\n\n"
            "2. **Inspect Ingress Controller Logs:**\n"
            "   ```bash\n   kubectl logs -n kube-system -l app.kubernetes.io/name=traefik\n   ```"
        )

    # Fallback contextual hint from catalog
    tier = get_hint_tier(wave if wave > 0 else 1, 1)
    return (
        f"### 💡 SRE Guidance\n\n"
        f"You are investigating active issues in the cluster. Here is a directional hint:\n\n"
        f"**{tier.title}**\n\n{tier.content}\n\n"
        f"Type `status` to refresh cluster vitals, or ask about specific components like `memory`, `dns`, `probes`, or `logs`."
    )


def run_mentor_chat(wave_override: Optional[int] = None):
    """Launch the interactive streaming terminal chat with the SRE Incident Mentor."""
    config = load_config()
    current_wave = wave_override or config.game.current_wave

    console.print(Panel(
        f"[bold cyan]🤖 CloudArena AI Incident Mentor — Interactive Terminal Session[/bold cyan]\n\n"
        f"• Active Wave:    [bold yellow]{'Wave ' + str(current_wave) if current_wave > 0 else 'Sandbox (No Wave)'}[/bold yellow]\n"
        f"• Cadet Handle:   [bold white]@{config.player.handle}[/bold white]\n"
        f"• AI Engine:      [bold green]{'Gemini / Online' if os.environ.get('GEMINI_API_KEY') else 'Offline Rule Intelligence 🛡️'}[/bold green]\n\n"
        f"Ask questions about errors, failing pods, or architecture patterns.\n"
        f"Commands: [bold cyan]status[/bold cyan] (refresh vitals), [bold cyan]hint[/bold cyan] (tiered clue), [bold red]exit[/bold red] (quit session)",
        title="[bold]SRE Mentor Link[/bold]",
        border_style="cyan",
    ))

    messages: list[dict] = []

    while True:
        try:
            user_input = Prompt.ask("\n[bold cyan]cadet@mentor[/bold cyan]").strip()
            if not user_input:
                continue

            if user_input.lower() in ("exit", "quit", "q", ":q"):
                console.print("[dim]Ending mentor session. Good luck resolving the incident! 🌩️[/dim]")
                break

            telemetry = snapshot_cluster_telemetry()

            # Handle quick commands
            if user_input.lower() == "hint":
                tier = get_hint_tier(current_wave if current_wave > 0 else 1, 1)
                console.print(Panel(tier.content, title=f"Tier 1 Hint: {tier.title}", border_style="yellow"))
                continue

            messages.append({"role": "user", "content": user_input})

            # Attempt LLM query first
            with console.status("[bold cyan]Mentor is analyzing cluster logs and telemetry...[/bold cyan]"):
                reply = query_llm_chat(messages, current_wave, telemetry)

            # Fallback to offline rule engine
            if not reply:
                reply = offline_mentor_reply(user_input, current_wave, telemetry)

            messages.append({"role": "assistant", "content": reply})

            console.print()
            console.print(Panel(Markdown(reply), title="[bold green]AI SRE Mentor[/bold green]", border_style="green"))

        except (KeyboardInterrupt, EOFError):
            console.print("\n[dim]Mentor session closed.[/dim]")
            break
