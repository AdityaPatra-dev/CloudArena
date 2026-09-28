"""Tests for AI Incident Mentor interactive terminal chat and offline diagnostic engine."""

import unittest
from cloudarena.mentor.chat import _get_context_summary, offline_mentor_reply, query_llm_chat
from cloudarena.telemetry.collector import ClusterTelemetry, PodTelemetry, TrafficTelemetry


class TestMentorChat(unittest.TestCase):

    def setUp(self):
        self.telemetry = ClusterTelemetry(
            timestamp=1700000000.0,
            pods=[
                PodTelemetry(
                    namespace="cloudarena-app",
                    name="payment-service-1234",
                    phase="Running",
                    ready=False,
                    restarts=3,
                    exit_code=137,
                    termination_reason="OOMKilled",
                ),
                PodTelemetry(
                    namespace="cloudarena-app",
                    name="cart-service-5678",
                    phase="Running",
                    ready=True,
                    restarts=0,
                ),
            ],
            traffic=TrafficTelemetry(
                total_samples=100,
                success_count=65,
                fail_count=35,
                success_rate_pct=65.0,
                last_status_code="500",
            ),
            is_app_healthy=False,
            issues=["High pod restart count in cloudarena-app", "Traffic success rate below 95%"],
        )

    def test_context_summary(self):
        summary = _get_context_summary(wave=2, telemetry=self.telemetry)
        self.assertEqual(summary["active_wave"], 2)
        self.assertFalse(summary["is_healthy"])
        self.assertEqual(summary["traffic_success_rate"], "65.0%")
        self.assertEqual(len(summary["failing_pods"]), 1)
        self.assertEqual(summary["failing_pods"][0]["termination_reason"], "OOMKilled")

    def test_offline_mentor_status(self):
        reply = offline_mentor_reply("What is the current status of the cluster?", 2, self.telemetry)
        self.assertIn("Cluster Health Triage", reply)
        self.assertIn("65.0%", reply)
        self.assertIn("High pod restart count", reply)

    def test_offline_mentor_memory_oom(self):
        reply = offline_mentor_reply("Why is my pod crashing with 137 exit code OOM?", 2, self.telemetry)
        self.assertIn("Memory Outage & OOMKilled", reply)
        self.assertIn("resources.limits.memory", reply)

    def test_offline_mentor_dns(self):
        reply = offline_mentor_reply("DNS lookups are failing, coredns is unreachable", 5, self.telemetry)
        self.assertIn("DNS Resolution Diagnostic Pattern", reply)
        self.assertIn("dnsPolicy", reply)

    def test_offline_mentor_storage(self):
        reply = offline_mentor_reply("Database cannot write to /data volume", 6, self.telemetry)
        self.assertIn("Storage Deadlock Diagnostic Pattern", reply)
        self.assertIn("volumeMounts[].readOnly", reply)

    def test_offline_mentor_rbac(self):
        reply = offline_mentor_reply("Got 403 forbidden error on serviceaccount", 7, self.telemetry)
        self.assertIn("RBAC Authorization Diagnostic Pattern", reply)
        self.assertIn("RoleBinding", reply)

    def test_offline_mentor_tls(self):
        reply = offline_mentor_reply("Ingress SSL certificate handshake failed", 8, self.telemetry)
        self.assertIn("Ingress & TLS Handshake Diagnostic Pattern", reply)
        self.assertIn("cloudarena-tls", reply)

    def test_query_llm_without_api_keys(self):
        # Should cleanly return None without crashing
        res = query_llm_chat([{"role": "user", "content": "hi"}], 1, self.telemetry)
        # Assuming no GEMINI_API_KEY / OLLAMA_HOST in test environment
        self.assertIsNone(res)


if __name__ == "__main__":
    unittest.main()
