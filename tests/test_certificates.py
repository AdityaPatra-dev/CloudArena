"""Tests for SRE Certificate and Cryptographic Attestation Badge generator."""

import tempfile
import unittest
from pathlib import Path

from cloudarena.attestation.certificates import (
    generate_certificate_proof,
    generate_certificate_svg,
    get_certification_tier,
    save_certificate_file,
    verify_certificate_proof,
)


class TestCertificates(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_proof_generation_and_verification(self):
        token = "ca_live_9f81a7b4c2e1f5d6"
        handle = "aditya_sre"
        score = 850
        waves = [1, 2, 3, 4, 5]
        event = "HACKATHON_2026"

        proof = generate_certificate_proof(token, handle, score, waves, event)
        self.assertTrue(proof.startswith("ca_cert_"))

        # Valid verification
        self.assertTrue(verify_certificate_proof(token, handle, score, waves, event, proof))

        # Tampered score verification failure
        self.assertFalse(verify_certificate_proof(token, handle, score + 10, waves, event, proof))

        # Tampered handle verification failure
        self.assertFalse(verify_certificate_proof(token, "impostor", score, waves, event, proof))

    def test_certification_tiers(self):
        tier1 = get_certification_tier(1)
        self.assertEqual(tier1["tier_name"], "Bronze Foundation")

        tier4 = get_certification_tier(4)
        self.assertEqual(tier4["tier_name"], "Silver Professional")

        tier6 = get_certification_tier(6)
        self.assertEqual(tier6["tier_name"], "Gold Honor")

        tier8 = get_certification_tier(8)
        self.assertEqual(tier8["tier_name"], "Platinum / Mythic")

    def test_svg_generation_content(self):
        svg = generate_certificate_svg(
            handle="cloud_cadet",
            score=620,
            waves_cleared=[1, 2, 3, 4],
            event_id="CHAMPIONSHIP_2026",
            proof_hash="ca_cert_test_hash",
        )
        self.assertTrue(svg.startswith("<svg"))
        self.assertTrue(svg.endswith("</svg>"))
        self.assertIn("@cloud_cadet", svg)
        self.assertIn("620 pts", svg)
        self.assertIn("CHAMPIONSHIP_2026", svg)
        self.assertIn("ca_cert_test_hash", svg)
        self.assertIn("4 / 8 Waves", svg)

    def test_save_certificate_file(self):
        target = Path(self.temp_dir.name) / "cert.svg"
        saved = save_certificate_file(
            output_path=target,
            handle="aditya_sre",
            score=700,
            waves_cleared=[1, 2, 3, 4, 5],
        )
        self.assertTrue(target.exists())
        self.assertGreater(target.stat().st_size, 500)


if __name__ == "__main__":
    unittest.main()
