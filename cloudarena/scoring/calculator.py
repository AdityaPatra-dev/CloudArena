"""Scoring calculator and player score persistence."""

from dataclasses import dataclass
from cloudarena.core.config import load_config, save_config

BASE_WAVE_POINTS = 100
TARGET_SECONDS = 300  # 5 minutes
HINT_PENALTIES = {
    1: 10,
    2: 25,
    3: 50,
}
RESET_PENALTY = 20


@dataclass
class ScoreBreakdown:
    wave_number: int
    base_points: int
    speed_bonus: int
    hint_penalty: int
    reset_penalty: int
    net_wave_score: int
    elapsed_seconds: int
    target_seconds: int = TARGET_SECONDS


def calculate_wave_score(
    wave: int,
    elapsed_seconds: float,
    hints_used: int = 0,
    resets_used: int = 0,
) -> ScoreBreakdown:
    """Calculate wave score including speed bonus and deductions."""
    elapsed = max(1, int(elapsed_seconds))
    
    # Speed bonus: decays linearly from 100 to 0 over 300s
    time_ratio = min(1.0, elapsed / float(TARGET_SECONDS))
    speed_bonus = max(0, int(100 * (1.0 - time_ratio)))

    # Hint penalty sum
    hint_penalty = 0
    for level in range(1, hints_used + 1):
        hint_penalty += HINT_PENALTIES.get(level, 25)

    reset_penalty = resets_used * RESET_PENALTY

    net = BASE_WAVE_POINTS + speed_bonus - hint_penalty - reset_penalty
    # Guaranteed minimum floor of 10 points for successfully resolving
    net_score = max(10, net)

    return ScoreBreakdown(
        wave_number=wave,
        base_points=BASE_WAVE_POINTS,
        speed_bonus=speed_bonus,
        hint_penalty=hint_penalty,
        reset_penalty=reset_penalty,
        net_wave_score=net_score,
        elapsed_seconds=elapsed,
        target_seconds=TARGET_SECONDS,
    )


def record_wave_completion(breakdown: ScoreBreakdown) -> int:
    """Add wave score to player's total score and mark wave as completed."""
    config = load_config()
    config.game.total_score += breakdown.net_wave_score
    if breakdown.wave_number not in config.game.completed_waves:
        config.game.completed_waves.append(breakdown.wave_number)
    # Advance wave if next exists
    if config.game.current_wave in (0, breakdown.wave_number) and breakdown.wave_number < 4:
        config.game.current_wave = breakdown.wave_number + 1
    save_config(config)
    return config.game.total_score
