"""Unit tests for cryptographic attestation and anti-cheat proof engine."""

import unittest
from unittest.mock import MagicMock, patch
from cloudarena.attestation.proof import (
    generate_wave_nonce,
    generate_resolution_proof,
    verify_resolution_proof,
    inject_cluster_nonce,
    extract_cluster_nonce,
)


class TestAttestation(unittest.TestCase):
    def test_nonce_generation_deterministic(self):
        token = "ca_live_abcdef1234567890"
        nonce1 = generate_wave_nonce(token, wave=1, cluster_name="test-cluster", timestamp=1000.0)
        nonce2 = generate_wave_nonce(token, wave=1, cluster_name="test-cluster", timestamp=1000.0)
        self.assertEqual(nonce1, nonce2)
        self.assertEqual(len(nonce1), 32)

    def test_nonce_varies_with_wave_and_token(self):
        nonce_wave1 = generate_wave_nonce("token_a", wave=1, cluster_name="cluster", timestamp=1000.0)
        nonce_wave2 = generate_wave_nonce("token_a", wave=2, cluster_name="cluster", timestamp=1000.0)
        nonce_token_b = generate_wave_nonce("token_b", wave=1, cluster_name="cluster", timestamp=1000.0)
        self.assertNotEqual(nonce_wave1, nonce_wave2)
        self.assertNotEqual(nonce_wave1, nonce_token_b)

    def test_resolution_proof_verification_valid(self):
        token = "ca_live_9f81a7b4"
        wave = 2
        elapsed = 145
        nonce = "d41d8cd98f00b204e9800998ecf8427e"

        proof = generate_resolution_proof(token, wave, elapsed, nonce)
        self.assertIsInstance(proof, str)
        self.assertTrue(len(proof) >= 32)

        # Verification passes with correct signature
        self.assertTrue(verify_resolution_proof(token, wave, elapsed, nonce, proof))

    def test_resolution_proof_tamper_detection(self):
        token = "ca_live_9f81a7b4"
        proof = generate_resolution_proof(token, wave=1, elapsed_seconds=60, nonce="nonce123")

        # Wrong elapsed time
        self.assertFalse(verify_resolution_proof(token, wave=1, elapsed_seconds=59, nonce="nonce123", provided_signature=proof))
        # Wrong wave
        self.assertFalse(verify_resolution_proof(token, wave=2, elapsed_seconds=60, nonce="nonce123", provided_signature=proof))
        # Wrong nonce
        self.assertFalse(verify_resolution_proof(token, wave=1, elapsed_seconds=60, nonce="fake_nonce", provided_signature=proof))
        # Wrong token
        self.assertFalse(verify_resolution_proof("other_token", wave=1, elapsed_seconds=60, nonce="nonce123", provided_signature=proof))

    @patch("cloudarena.attestation.proof.is_kubeconfig_present", return_value=False)
    def test_inject_cluster_nonce_no_kubeconfig(self, mock_k8s):
        result = inject_cluster_nonce("test_nonce", 1)
        self.assertFalse(result)

    @patch("cloudarena.attestation.proof.is_kubeconfig_present", return_value=False)
    def test_extract_cluster_nonce_no_kubeconfig(self, mock_k8s):
        result = extract_cluster_nonce()
        self.assertIsNone(result)

    @patch("cloudarena.attestation.proof.is_kubeconfig_present", return_value=True)
    @patch("cloudarena.attestation.proof.get_core_v1")
    def test_inject_and_extract_cluster_nonce_with_k8s(self, mock_get_v1, mock_k8s):
        mock_client = MagicMock()
        mock_get_v1.return_value = mock_client

        # Mock secret extraction
        mock_secret = MagicMock()
        mock_secret.data = {}
        mock_secret.string_data = {"nonce": "injected_nonce_val"}
        mock_client.read_namespaced_secret.return_value = mock_secret

        res_inject = inject_cluster_nonce("injected_nonce_val", 1)
        self.assertTrue(res_inject)
        mock_client.create_namespaced_secret.assert_called_once()

        extracted = extract_cluster_nonce()
        self.assertEqual(extracted, "injected_nonce_val")


if __name__ == "__main__":
    unittest.main()
