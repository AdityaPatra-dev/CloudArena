"""Optional LLM-assisted mentoring integration with anti-spoiler prompt guards."""

import json
import os
from typing import Optional
import requests

from cloudarena.mentor.catalog import HintTier
from cloudarena.telemetry.collector import ClusterTelemetry

SYSTEM_PROMPT = """You are the CloudArena AI Incident Mentor, an expert SRE tutor.
Your job is to coach developers in Kubernetes troubleshooting without spoiling the answer.

STRICT ANTI-SPOILER RULES:
- Level 1 (Cost: 10 pts): Provide high-level directional guidance only. Point to the architecture layer (e.g. compute, memory, networking, probes). NEVER mention pod names or commands.
- Level 2 (Cost: 25 pts): Diagnostic guidance. Suggest specific Kubernetes investigation commands and namespaces to inspect. Mention symptoms to look for. Do not give the exact fix.
- Level 3 (Cost: 50 pts): Tactical clue. Point out the exact misconfiguration and suggest the corrective action.

Always keep your advice concise, professional, and encouraging. Return your response in clean markdown."""


def query_llm_mentor(
    wave: int,
    level: int,
    telemetry: ClusterTelemetry,
) -> Optional[HintTier]:
    """Query external LLM (Gemini or Ollama) for contextual mentoring, or return None."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("CLOUDARENA_AI_KEY")
    ollama_url = os.environ.get("OLLAMA_HOST")

    context_summary = {
        "wave": wave,
        "hint_level_requested": level,
        "degradation_detected": not telemetry.is_app_healthy,
        "reported_issues": telemetry.issues,
        "pods_status": [
            {
                "name": p.name,
                "namespace": p.namespace,
                "phase": p.phase,
                "ready": p.ready,
                "restarts": p.restarts,
                "termination_reason": p.termination_reason,
            }
            for p in telemetry.pods
            if p.namespace in ("cloudarena-app", "cloudarena-system")
        ],
        "traffic_success_rate": f"{telemetry.traffic.success_rate_pct}%",
    }

    user_prompt = (
        f"Incident Context:\n{json.dumps(context_summary, indent=2)}\n\n"
        f"Please provide a Level {level} hint for the participant."
    )

    # 1. Try Gemini API if key is present
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {"role": "user", "parts": [{"text": f"{SYSTEM_PROMPT}\n\n{user_prompt}"}]}
                ],
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 300},
            }
            resp = requests.post(url, json=payload, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                costs = {1: 10, 2: 25, 3: 50}
                return HintTier(
                    level=level,
                    title=f"AI Mentor (Level {level})",
                    cost_pts=costs.get(level, 25),
                    content=text,
                )
        except Exception:
            pass

    # 2. Try Local Ollama if configured
    if ollama_url:
        try:
            payload = {
                "model": "llama3",
                "system": SYSTEM_PROMPT,
                "prompt": user_prompt,
                "stream": False,
            }
            resp = requests.post(f"{ollama_url.rstrip('/')}/api/generate", json=payload, timeout=5)
            if resp.status_code == 200:
                text = resp.json().get("response", "").strip()
                if text:
                    costs = {1: 10, 2: 25, 3: 50}
                    return HintTier(
                        level=level,
                        title=f"Local AI Mentor (Level {level})",
                        cost_pts=costs.get(level, 25),
                        content=text,
                    )
        except Exception:
            pass

    return None
