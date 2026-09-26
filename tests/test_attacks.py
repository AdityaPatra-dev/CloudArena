"""Unit tests for Phase 3 attack engine, registry, and memory parser."""

import unittest
from unittest.mock import patch

from cloudarena.attacks.base import AttackInfo, BaseAttack
from cloudarena.attacks.manager import get_attack, list_all_attacks
from cloudarena.attacks.wave1_cpu import Wave1CpuAttack
from cloudarena.attacks.wave2_memory import Wave2MemoryAttack, parse_k8s_memory
from cloudarena.attacks.wave3_probe import Wave3ProbeAttack
from cloudarena.attacks.wave4_traffic import Wave4TrafficAttack


class TestAttacks(unittest.TestCase):
    def test_list_all_attacks_count_and_waves(self):
        attacks = list_all_attacks()
        self.assertEqual(len(attacks), 4)
        waves = [a.wave_number for a in attacks]
        self.assertEqual(waves, [1, 2, 3, 4])

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

    def test_invalid_wave_raises_value_error(self):
        with self.assertRaises(ValueError):
            get_attack(5)
        with self.assertRaises(ValueError):
            get_attack(0)

    def test_attack_info_completeness(self):
        for atk in list_all_attacks():
            self.assertTrue(atk.name)
            self.assertTrue(atk.title)
            self.assertTrue(atk.symptoms)
            self.assertTrue(atk.expected_fix)
            self.assertTrue(atk.description)
            self.assertIn(atk.difficulty, ("Beginner", "Intermediate", "Advanced"))

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
