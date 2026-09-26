"""Incident Mentor engine orchestrating hint levels, deductions, and fallback logic."""

from typing import Optional, Tuple
from cloudarena.core.config import load_config, save_config
from cloudarena.mentor.catalog import HintTier, get_hint_tier
from cloudarena.mentor.llm import query_llm_mentor
from cloudarena.telemetry.collector import snapshot_cluster_telemetry

MAX_HINTS_PER_WAVE = 3


class MentorEngine:
    """Manages progressive hint access and deduction tracking."""

    @staticmethod
    def get_next_hint_info() -> Tuple[int, int, int]:
        """Return (current_wave, next_hint_level, cost_points)."""
        config = load_config()
        current_wave = config.game.current_wave
        used = config.game.hints_used_in_wave
        next_level = used + 1
        costs = {1: 10, 2: 25, 3: 50}
        cost = costs.get(next_level, 50)
        return current_wave, next_level, cost

    @classmethod
    def request_hint(cls, force_offline: bool = False) -> Tuple[Optional[HintTier], str]:
        """Request the next tiered hint for the active wave.

        Returns:
            (HintTier, "Source description") if available,
            (None, "Reason") if not applicable.
        """
        config = load_config()
        current_wave = config.game.current_wave

        if current_wave == 0:
            return None, "No attack wave is currently active. Launch a wave with `cloudarena wave start` first."

        used = config.game.hints_used_in_wave
        if used >= MAX_HINTS_PER_WAVE:
            return None, f"Maximum hint limit ({MAX_HINTS_PER_WAVE}) has been reached for Wave {current_wave}."

        next_level = used + 1
        telemetry = snapshot_cluster_telemetry()

        hint_result: Optional[HintTier] = None
        source = "Offline Catalog"

        # 1. Attempt LLM mentor if not forced offline
        if not force_offline:
            hint_result = query_llm_mentor(current_wave, next_level, telemetry)
            if hint_result:
                source = "AI Incident Mentor (Online)"

        # 2. Fallback to deterministic offline catalog
        if not hint_result:
            hint_result = get_hint_tier(current_wave, next_level)
            source = "Incident Mentor (Rule Catalog)"

        if not hint_result:
            return None, f"No hint available for Wave {current_wave} Level {next_level}."

        # Increment hint count and persist
        config.game.hints_used_in_wave += 1
        save_config(config)

        return hint_result, source
