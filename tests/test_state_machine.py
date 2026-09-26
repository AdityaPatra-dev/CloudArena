"""Unit tests for IncidentStateMachine and stabilization window."""

import time
import unittest
from cloudarena.detection.state_machine import IncidentStateMachine, IncidentState
from cloudarena.telemetry.collector import ClusterTelemetry


class TestStateMachine(unittest.TestCase):
    def test_state_machine_happy_path_with_stabilization(self):
        # 0.2s stabilization window for fast unit testing
        sm = IncidentStateMachine(wave_number=1, stabilization_seconds=0.2)
        self.assertEqual(sm.context.state, IncidentState.ATTACK_INJECTED)

        # 1. First tick with degradation -> becomes INCIDENT_ACTIVE
        bad_telemetry = ClusterTelemetry(is_app_healthy=False, issues=["High CPU"])
        s1 = sm.update(bad_telemetry, is_attack_resolved=False, resolution_reason="Rogue pod running")
        self.assertEqual(s1, IncidentState.INCIDENT_ACTIVE)
        self.assertIsNotNone(sm.context.degradation_time)

        # 2. Fix detected -> becomes STABILIZING
        good_telemetry = ClusterTelemetry(is_app_healthy=True, issues=[])
        s2 = sm.update(good_telemetry, is_attack_resolved=True, resolution_reason="Resolved")
        self.assertEqual(s2, IncidentState.STABILIZING)

        # 3. Intermediate tick before stabilization window completes -> still STABILIZING
        s3 = sm.update(good_telemetry, is_attack_resolved=True, resolution_reason="Resolved")
        self.assertEqual(s3, IncidentState.STABILIZING)

        # 4. Wait past stabilization window -> becomes RESOLVED
        time.sleep(0.25)
        s4 = sm.update(good_telemetry, is_attack_resolved=True, resolution_reason="Resolved")
        self.assertEqual(s4, IncidentState.RESOLVED)
        self.assertIsNotNone(sm.context.resolved_time)
        self.assertGreater(sm.context.time_to_resolve, 0)

    def test_health_flap_resets_stabilization(self):
        sm = IncidentStateMachine(wave_number=2, stabilization_seconds=0.5)
        bad_telemetry = ClusterTelemetry(is_app_healthy=False, issues=["OOMKilled"])
        good_telemetry = ClusterTelemetry(is_app_healthy=True, issues=[])

        sm.update(bad_telemetry, False, "Pod crashed")
        self.assertEqual(sm.context.state, IncidentState.INCIDENT_ACTIVE)

        sm.update(good_telemetry, True, "Fix applied")
        self.assertEqual(sm.context.state, IncidentState.STABILIZING)

        # Flap occurs!
        sm.update(bad_telemetry, False, "Crashed again")
        self.assertEqual(sm.context.state, IncidentState.INCIDENT_ACTIVE)
        self.assertIsNone(sm.context.stabilization_start_time)


if __name__ == "__main__":
    unittest.main()
