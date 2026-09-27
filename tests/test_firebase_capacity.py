"""Capacity simulation and quota stress analysis for CloudArena on Firebase Free (Spark) Tier."""

import unittest


class FirebaseFreeTierModel:
    """Exact mathematical model of Firebase Spark Free Tier quotas."""
    DAILY_READS_LIMIT = 50_000
    DAILY_WRITES_LIMIT = 20_000
    DAILY_BANDWIDTH_BYTES = 360 * 1024 * 1024  # 360 MB
    MAX_CONCURRENT_CONNECTIONS = 1_000_000
    SINGLE_DOC_WRITE_RATE_PER_SEC = 1.0  # Firestore 1 write/sec hotspot limit
    GZIP_BUNDLE_BYTES = 184 * 1024  # 184 KB (JS + CSS + HTML)

    @classmethod
    def calculate_naive_architecture_reads(cls, students: int, top_n: int = 100) -> int:
        """Naive architecture: Every student subscribes directly to top N individual docs."""
        return students * top_n

    @classmethod
    def calculate_aggregated_architecture_reads(cls, students: int, updates_count: int) -> int:
        """Aggregated architecture: Every student listens to 1 cached_leaderboard/top100 doc."""
        initial_reads = students * 1
        live_update_reads = students * updates_count
        return initial_reads + live_update_reads

    @classmethod
    def max_leaderboard_updates_allowed(cls, students: int) -> int:
        """Maximum number of leaderboard broadcasts possible within the 50,000 daily read limit."""
        remaining_reads = cls.DAILY_READS_LIMIT - (students * 1)
        if remaining_reads <= 0:
            return 0
        return remaining_reads // students

    @classmethod
    def calculate_writes_for_event(cls, students: int, waves_per_student: int = 4, cached_updates: int = 24) -> int:
        """Calculate total writes: user profile creation + wave score submissions + cache writes."""
        profile_writes = students * 1
        score_writes = students * waves_per_student
        cache_writes = cached_updates
        return profile_writes + score_writes + cache_writes

    @classmethod
    def calculate_bandwidth_mb(cls, cold_page_loads: int) -> float:
        """Calculate hosting bandwidth in MB."""
        return (cold_page_loads * cls.GZIP_BUNDLE_BYTES) / (1024 * 1024)


class TestFirebaseCapacityAndQuotas(unittest.TestCase):
    def test_naive_architecture_failure(self):
        """Verify that naive architecture fails at scale."""
        # 500 students listening to 100 individual participant docs consumes 50,000 reads instantly
        reads_500 = FirebaseFreeTierModel.calculate_naive_architecture_reads(500, top_n=100)
        self.assertEqual(reads_500, 50_000)

        # 2,000 students in naive architecture would consume 200,000 reads (400% over quota)
        reads_2000 = FirebaseFreeTierModel.calculate_naive_architecture_reads(2000, top_n=100)
        self.assertEqual(reads_2000, 200_000)
        self.assertGreater(reads_2000, FirebaseFreeTierModel.DAILY_READS_LIMIT)

    def test_aggregated_architecture_2000_students(self):
        """Verify that the aggregated top100 document pattern succeeds for 2,000 students."""
        # Initial connect: 2,000 students = 2,000 reads
        # 20 live leaderboard broadcasts = 40,000 reads
        # Total = 42,000 reads (well under 50,000)
        reads = FirebaseFreeTierModel.calculate_aggregated_architecture_reads(students=2000, updates_count=20)
        self.assertEqual(reads, 42_000)
        self.assertLessEqual(reads, FirebaseFreeTierModel.DAILY_READS_LIMIT)

        max_updates = FirebaseFreeTierModel.max_leaderboard_updates_allowed(students=2000)
        self.assertEqual(max_updates, 24)

    def test_aggregated_architecture_500_students(self):
        """500 students can receive up to 99 live updates on free tier."""
        max_updates = FirebaseFreeTierModel.max_leaderboard_updates_allowed(students=500)
        self.assertEqual(max_updates, 99)

    def test_aggregated_architecture_100_students(self):
        """100 students can receive up to 499 live updates on free tier."""
        max_updates = FirebaseFreeTierModel.max_leaderboard_updates_allowed(students=100)
        self.assertEqual(max_updates, 499)

    def test_write_quota_2000_students(self):
        """Verify that persistent writes for 2,000 students fit in 20,000 daily writes."""
        # 2,000 profiles + 8,000 wave submissions (4 waves each) + 24 cache writes = 10,024 writes
        total_writes = FirebaseFreeTierModel.calculate_writes_for_event(students=2000, waves_per_student=4, cached_updates=24)
        self.assertEqual(total_writes, 10_024)
        self.assertLessEqual(total_writes, FirebaseFreeTierModel.DAILY_WRITES_LIMIT)
        # We have 9,976 writes remaining as safety margin
        remaining = FirebaseFreeTierModel.DAILY_WRITES_LIMIT - total_writes
        self.assertGreater(remaining, 9_000)

    def test_heartbeat_ddos_risk_demonstration(self):
        """Demonstrate why heartbeats must NOT be written to Firestore directly on Free Tier."""
        # If 2,000 students write heartbeats every 10 seconds (6/min):
        # In just 2 minutes: 2,000 * 6 * 2 = 24,000 writes! (Exhausts entire 20,000 daily quota)
        heartbeats_per_min = 2000 * 6
        self.assertEqual(heartbeats_per_min, 12_000)
        time_to_exhaustion_mins = FirebaseFreeTierModel.DAILY_WRITES_LIMIT / heartbeats_per_min
        self.assertAlmostEqual(time_to_exhaustion_mins, 1.6666, places=3)
        # This mathematically proves radar heartbeats must be kept on edge / WebSocket / FastAPI!


if __name__ == "__main__":
    unittest.main()
