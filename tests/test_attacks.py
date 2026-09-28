"""Unit tests for attack engine, registry, 8 challenge waves, and memory parser."""

import unittest
from unittest.mock import patch

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.attacks.manager import get_attack, list_all_attacks
from cloudarena.attacks.wave1_cpu import Wave1CpuAttack
from cloudarena.attacks.wave2_memory import Wave2MemoryAttack, parse_k8s_memory
from cloudarena.attacks.wave3_probe import Wave3ProbeAttack
from cloudarena.attacks.wave4_traffic import Wave4TrafficAttack
from cloudarena.attacks.wave5_dns import Wave5DnsAttack
from cloudarena.attacks.wave6_storage import Wave6StorageAttack
from cloudarena.attacks.wave7_rbac import Wave7RbacAttack
from cloudarena.attacks.wave8_tls import Wave8TlsAttack
from cloudarena.mentor.catalog import get_hint_tier
from cloudarena.detection.postmortem import _SRE_KNOWLEDGE_BASE


class TestAttacks(unittest.TestCase):
    def test_list_all_attacks_count_and_waves(self):
        attacks = list_all_attacks()
        self.assertEqual(len(attacks), 8)
        waves = [a.wave_number for a in attacks]
        self.assertEqual(waves, [1, 2, 3, 4, 5, 6, 7, 8])

    def test_get_attack_instances(self):
        a1 = get_attack(1)
        self.assertIsInstance(a1, Wave1CpuAttack)
        self.assertEqual(a1.info.name, "rogue_cpu_hog")
        self.assertEqual(a1.info.difficulty, "Beginner")

        a2 = get_attack(2)
        self.assertIsInstance(a2, Wave2MemoryAttack)
        self.assertEqual(a2.info.name, "memory_oom")
        self.assertEqual(a2.info.difficulty, "Intermediate")

        a3 = get_attack(3)
        self.assertIsInstance(a3, Wave3ProbeAttack)
        self.assertEqual(a3.info.name, "broken_probe")
        self.assertEqual(a3.info.difficulty, "Intermediate")

        a4 = get_attack(4)
        self.assertIsInstance(a4, Wave4TrafficAttack)
        self.assertEqual(a4.info.name, "traffic_surge")
        self.assertEqual(a4.info.difficulty, "Advanced")

        a5 = get_attack(5)
        self.assertIsInstance(a5, Wave5DnsAttack)
        self.assertEqual(a5.info.name, "dns_blackout")
        self.assertEqual(a5.info.difficulty, "Advanced")

        a6 = get_attack(6)
        self.assertIsInstance(a6, Wave6StorageAttack)
        self.assertEqual(a6.info.name, "storage_deadlock")
        self.assertEqual(a6.info.difficulty, "Nightmare")

        a7 = get_attack(7)
        self.assertIsInstance(a7, Wave7RbacAttack)
        self.assertEqual(a7.info.name, "rbac_auth_failure")
        self.assertEqual(a7.info.difficulty, "Master")

        a8 = get_attack(8)
        self.assertIsInstance(a8, Wave8TlsAttack)
        self.assertEqual(a8.info.name, "tls_handshake_corruption")
        self.assertEqual(a8.info.difficulty, "Boss")

    def test_invalid_wave_raises_value_error(self):
        with self.assertRaises(ValueError):
            get_attack(9)
        with self.assertRaises(ValueError):
            get_attack(0)

    def test_attack_info_completeness(self):
        for atk in list_all_attacks():
            self.assertTrue(atk.name)
            self.assertTrue(atk.title)
            self.assertTrue(atk.symptoms)
            self.assertTrue(atk.expected_fix)
            self.assertTrue(atk.description)
            self.assertIn(atk.difficulty, ("Beginner", "Intermediate", "Advanced", "Nightmare", "Master", "Boss"))

    def test_hint_catalog_completeness_all_8_waves(self):
        """Verify that all 8 waves have all 3 tiers of progressive hints configured."""
        for wave in range(1, 9):
            for level in (1, 2, 3):
                hint = get_hint_tier(wave, level)
                self.assertIsNotNone(hint, f"Missing hint for wave {wave} tier {level}")
                self.assertTrue(hint.title)
                self.assertTrue(hint.content)
                self.assertGreater(hint.cost_pts, 0)

    def test_postmortem_kb_all_8_waves(self):
        """Verify that SRE Knowledge Base has post-mortem root causes and prevention for all 8 waves."""
        for wave in range(1, 9):
            self.assertIn(wave, _SRE_KNOWLEDGE_BASE)
            self.assertTrue(_SRE_KNOWLEDGE_BASE[wave]["rca"])
            self.assertTrue(_SRE_KNOWLEDGE_BASE[wave]["prevention"])

    def test_parse_k8s_memory(self):
        self.assertEqual(parse_k8s_memory("128Mi"), 128 * 1024 * 1024)
        self.assertEqual(parse_k8s_memory("256Mi"), 256 * 1024 * 1024)
        self.assertEqual(parse_k8s_memory("1Gi"), 1024 * 1024 * 1024)
        self.assertEqual(parse_k8s_memory("500M"), 500 * 1000 * 1000)
        self.assertEqual(parse_k8s_memory("64Ki"), 64 * 1024)
        self.assertEqual(parse_k8s_memory("1000"), 1000)
        self.assertEqual(parse_k8s_memory("invalid"), 0)


if __name__ == "__main__":
    unittest.main()
