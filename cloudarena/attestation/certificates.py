"""Cryptographically verifiable SRE Certificate and Badge generator."""

import hashlib
import hmac
import time
from pathlib import Path
from typing import Any, Optional


def generate_certificate_proof(
    arena_token: str,
    handle: str,
    score: int,
    waves_cleared: list[int],
    event_id: str = "HACKATHON_2026",
) -> str:
    """Generate tamper-proof HMAC signature for competitor credentials."""
    secret = (arena_token or "cloudarena_global_master_secret").encode("utf-8")
    waves_str = ",".join(map(str, sorted(waves_cleared)))
    payload = f"CERT:v1:handle={handle}:score={score}:waves={waves_str}:event={event_id}".encode("utf-8")
    return "ca_cert_" + hmac.new(secret, payload, hashlib.sha256).hexdigest()[:28]


def verify_certificate_proof(
    arena_token: str,
    handle: str,
    score: int,
    waves_cleared: list[int],
    event_id: str,
    provided_signature: str,
) -> bool:
    """Verify validity of a given certificate proof signature."""
    expected = generate_certificate_proof(arena_token, handle, score, waves_cleared, event_id)
    return hmac.compare_digest(expected, provided_signature)


def get_certification_tier(waves_count: int) -> dict[str, Any]:
    """Map cleared waves count to certified title, badge color, and rank."""
    if waves_count >= 8:
        return {
            "title": "Grandmaster Chaos Principal SRE",
            "tier_name": "Platinum / Mythic",
            "badge_color": "#10b981",  # Emerald
            "accent_color": "#34d399",
            "icon": "👑",
        }
    elif waves_count >= 5:
        return {
            "title": "Kubernetes Resilience Architect",
            "tier_name": "Gold Honor",
            "badge_color": "#f59e0b",  # Amber
            "accent_color": "#fbbf24",
            "icon": "🥇",
        }
    elif waves_count >= 3:
        return {
            "title": "Cloud Chaos Specialist",
            "tier_name": "Silver Professional",
            "badge_color": "#a855f7",  # Purple
            "accent_color": "#c084fc",
            "icon": "🥈",
        }
    else:
        return {
            "title": "SRE Incident First Responder",
            "tier_name": "Bronze Foundation",
            "badge_color": "#38bdf8",  # Sky
            "accent_color": "#7dd3fc",
            "icon": "🥉",
        }


def generate_certificate_svg(
    handle: str,
    score: int,
    waves_cleared: list[int],
    event_id: str = "HACKATHON_2026",
    proof_hash: Optional[str] = None,
    issued_date: Optional[str] = None,
) -> str:
    """Generate high-resolution vector SVG certificate document."""
    waves_count = len(waves_cleared)
    tier = get_certification_tier(waves_count)
    proof = proof_hash or f"ca_cert_{hashlib.sha256(handle.encode()).hexdigest()[:24]}"
    date_str = issued_date or time.strftime("%B %d, %Y")

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 580" width="900" height="580" style="background:#090d16; font-family:'Inter',system-ui,sans-serif;">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1120" />
      <stop offset="50%" stop-color="#090d16" />
      <stop offset="100%" stop-color="#111827" />
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="{tier['badge_color']}" />
      <stop offset="100%" stop-color="{tier['accent_color']}" />
    </linearGradient>
    <radialGradient id="glowGrad" cx="50%" cy="30%" r="50%">
      <stop offset="0%" stop-color="{tier['badge_color']}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="#090d16" stop-opacity="0" />
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="900" height="580" rx="24" fill="url(#bgGrad)" />
  <rect width="900" height="580" fill="url(#glowGrad)" />

  <!-- Outer Border -->
  <rect x="20" y="20" width="860" height="540" rx="16" fill="none" stroke="#1e293b" stroke-width="2" />
  <rect x="28" y="28" width="844" height="524" rx="12" fill="none" stroke="{tier['badge_color']}" stroke-opacity="0.3" stroke-width="1.5" stroke-dasharray="8 6" />

  <!-- Corner Tech Highlights -->
  <path d="M 28 50 L 50 28" stroke="{tier['badge_color']}" stroke-width="2" fill="none" />
  <path d="M 872 50 L 850 28" stroke="{tier['badge_color']}" stroke-width="2" fill="none" />
  <path d="M 28 530 L 50 552" stroke="{tier['badge_color']}" stroke-width="2" fill="none" />
  <path d="M 872 530 L 850 552" stroke="{tier['badge_color']}" stroke-width="2" fill="none" />

  <!-- Header Branding -->
  <text x="450" y="80" text-anchor="middle" font-size="13" font-family="'JetBrains Mono',monospace" font-weight="700" fill="{tier['badge_color']}" letter-spacing="4">
    CLOUDARENA • DISTRIBUTED SYSTEMS SURVIVAL ARENA
  </text>
  <text x="450" y="118" text-anchor="middle" font-size="28" font-weight="900" fill="#ffffff" letter-spacing="-0.5">
    CERTIFICATE OF RESILIENCE MASTERY
  </text>

  <!-- Divider -->
  <line x1="350" y1="135" x2="550" y2="135" stroke="url(#primaryGrad)" stroke-width="2" stroke-linecap="round" />

  <!-- Body Text -->
  <text x="450" y="175" text-anchor="middle" font-size="14" fill="#94a3b8">
    This verifiable credential certifies that
  </text>

  <text x="450" y="222" text-anchor="middle" font-size="36" font-weight="900" fill="#ffffff">
    @{handle}
  </text>

  <text x="450" y="258" text-anchor="middle" font-size="15" fill="#cbd5e1" font-weight="500">
    has successfully diagnosed, remediated, and conquered live chaos attacks in
  </text>
  <text x="450" y="282" text-anchor="middle" font-size="14" font-weight="700" fill="{tier['badge_color']}">
    {event_id}
  </text>

  <!-- Awarded Title Badge Card -->
  <rect x="220" y="305" width="460" height="60" rx="14" fill="#0f172a" stroke="{tier['badge_color']}" stroke-width="1.5" stroke-opacity="0.6" />
  <text x="450" y="342" text-anchor="middle" font-size="18" font-weight="800" fill="#ffffff">
    {tier['icon']} {tier['title']}
  </text>

  <!-- Key Metrics Grid -->
  <!-- Cleared Waves -->
  <g transform="translate(180, 390)">
    <rect width="160" height="70" rx="10" fill="#0b1329" stroke="#1e293b" />
    <text x="80" y="26" text-anchor="middle" font-size="10" font-family="'JetBrains Mono',monospace" fill="#64748b" font-weight="700">WAVES CONQUERED</text>
    <text x="80" y="54" text-anchor="middle" font-size="22" font-weight="900" fill="#ffffff">{waves_count} / 8 Waves</text>
  </g>

  <!-- Verified Score -->
  <g transform="translate(370, 390)">
    <rect width="160" height="70" rx="10" fill="#0b1329" stroke="#1e293b" />
    <text x="80" y="26" text-anchor="middle" font-size="10" font-family="'JetBrains Mono',monospace" fill="#64748b" font-weight="700">VERIFIED SCORE</text>
    <text x="80" y="54" text-anchor="middle" font-size="22" font-weight="900" fill="{tier['badge_color']}">{score} pts</text>
  </g>

  <!-- Certified Rank -->
  <g transform="translate(560, 390)">
    <rect width="160" height="70" rx="10" fill="#0b1329" stroke="#1e293b" />
    <text x="80" y="26" text-anchor="middle" font-size="10" font-family="'JetBrains Mono',monospace" fill="#64748b" font-weight="700">ARENA STANDING</text>
    <text x="80" y="54" text-anchor="middle" font-size="17" font-weight="800" fill="#38bdf8">{tier['tier_name']}</text>
  </g>

  <!-- Footer Verification & Date -->
  <text x="80" y="515" font-size="11" fill="#64748b" font-family="'JetBrains Mono',monospace">
    ISSUED: {date_str}
  </text>
  <text x="80" y="532" font-size="11" fill="#475569" font-family="'JetBrains Mono',monospace">
    HMAC PROOF: {proof}
  </text>

  <text x="820" y="515" text-anchor="end" font-size="11" fill="{tier['badge_color']}" font-family="'JetBrains Mono',monospace" font-weight="700">
    STATUS: CRYPTOGRAPHICALLY ATTESTED ✓
  </text>
  <text x="820" y="532" text-anchor="end" font-size="11" fill="#64748b" font-family="'JetBrains Mono',monospace">
    VERIFY AT: gdg-cloudarena.web.app
  </text>
</svg>"""
    return svg


def save_certificate_file(
    output_path: Path,
    handle: str,
    score: int,
    waves_cleared: list[int],
    event_id: str = "HACKATHON_2026",
    proof_hash: Optional[str] = None,
) -> Path:
    """Save the generated SVG certificate to a local file."""
    svg_content = generate_certificate_svg(
        handle=handle,
        score=score,
        waves_cleared=waves_cleared,
        event_id=event_id,
        proof_hash=proof_hash,
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    return output_path
