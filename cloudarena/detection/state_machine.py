"""Incident detection state machine with health stabilization window."""

import time
from enum import Enum
from typing import Optional
from dataclasses import dataclass, field

from cloudarena.telemetry.collector import ClusterTelemetry

STABILIZATION_WINDOW_SECONDS = 10.0


class IncidentState(str, Enum):
    IDLE = "IDLE"
    ATTACK_INJECTED = "ATTACK_INJECTED"
    INCIDENT_ACTIVE = "INCIDENT_ACTIVE"
    FIX_DETECTED = "FIX_DETECTED"
    STABILIZING = "STABILIZING"
    RESOLVED = "RESOLVED"


@dataclass
class IncidentContext:
    wave_number: int
    state: IncidentState = IncidentState.IDLE
    attack_start_time: float = field(default_factory=time.time)
    degradation_time: Optional[float] = None
    fix_start_time: Optional[float] = None
    stabilization_start_time: Optional[float] = None
    resolved_time: Optional[float] = None
    last_reason: str = "Awaiting status check"

    @property
    def time_to_detect(self) -> float:
        """Seconds between attack injection and degradation confirmation."""
        if self.degradation_time:
            return round(self.degradation_time - self.attack_start_time, 1)
        return 0.0

    @property
    def time_to_resolve(self) -> float:
        """Seconds between degradation confirmation and sustained resolution."""
        if self.resolved_time and self.degradation_time:
            return round(self.resolved_time - self.degradation_time, 1)
        elif self.resolved_time:
            return round(self.resolved_time - self.attack_start_time, 1)
        return 0.0


class IncidentStateMachine:
    """Manages the lifecycle and transitions of an infrastructure incident."""

    def __init__(self, wave_number: int, stabilization_seconds: float = STABILIZATION_WINDOW_SECONDS):
        self.wave_number = wave_number
        self.stabilization_seconds = stabilization_seconds
        self.context = IncidentContext(wave_number=wave_number, state=IncidentState.ATTACK_INJECTED)

    def transition(self, target_state: IncidentState, reason: str = "") -> None:
        """Safely transition to a target state and record relevant milestones."""
        self.context.state = target_state
        self.context.last_reason = reason
        now = time.time()

        if target_state == IncidentState.INCIDENT_ACTIVE and not self.context.degradation_time:
            self.context.degradation_time = now
        elif target_state == IncidentState.FIX_DETECTED and not self.context.fix_start_time:
            self.context.fix_start_time = now
        elif target_state == IncidentState.STABILIZING and not self.context.stabilization_start_time:
            self.context.stabilization_start_time = now
        elif target_state == IncidentState.RESOLVED and not self.context.resolved_time:
            self.context.resolved_time = now

    def update(self, telemetry: ClusterTelemetry, is_attack_resolved: bool, resolution_reason: str) -> IncidentState:
        """Process a new telemetry tick and advance the state machine accordingly."""
        now = time.time()
        current = self.context.state

        if current == IncidentState.ATTACK_INJECTED:
            # Confirm degradation: either telemetry shows issues or resolution is False
            if not telemetry.is_app_healthy or not is_attack_resolved:
                self.transition(IncidentState.INCIDENT_ACTIVE, "Degradation confirmed via cluster telemetry.")
            else:
                self.context.last_reason = "Waiting for failure conditions to manifest."

        elif current == IncidentState.INCIDENT_ACTIVE:
            if is_attack_resolved and telemetry.is_app_healthy:
                self.transition(IncidentState.STABILIZING, "Fix detected. Commencing stabilization window.")
                self.context.stabilization_start_time = now
            else:
                self.context.last_reason = resolution_reason

        elif current == IncidentState.STABILIZING:
            if not is_attack_resolved or not telemetry.is_app_healthy:
                # Flapped back to unhealthy
                self.transition(IncidentState.INCIDENT_ACTIVE, f"Health flap detected: {resolution_reason}")
                self.context.stabilization_start_time = None
            else:
                elapsed_stable = now - (self.context.stabilization_start_time or now)
                if elapsed_stable >= self.stabilization_seconds:
                    self.transition(IncidentState.RESOLVED, f"Health sustained for {int(elapsed_stable)}s.")
                else:
                    remaining = int(self.stabilization_seconds - elapsed_stable)
                    self.context.last_reason = f"Stabilizing: {remaining}s remaining..."

        return self.context.state
