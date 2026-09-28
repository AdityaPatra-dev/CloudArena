"""Tests for Terminal SRE Telemetry TUI Dashboard."""

import unittest
from rich.layout import Layout
from rich.panel import Panel
from rich.table import Table

from cloudarena.cli.dashboard_cmd import (
    build_event_log_panel,
    build_footer,
    build_header,
    build_pods_table,
    build_traffic_panel,
    get_live_cluster_data,
    make_dashboard_layout,
)


class TestDashboardTUI(unittest.TestCase):

    def test_build_header_active_wave(self):
        panel = build_header(handle="cadet_ace", wave_num=3, event_id="GDG_2026")
        self.assertIsInstance(panel, Panel)

    def test_build_header_calm(self):
        panel = build_header(handle="cadet_ace", wave_num=None, event_id="GDG_2026")
        self.assertIsInstance(panel, Panel)

    def test_build_traffic_panel_various_levels(self):
        # 100% optimal
        p1 = build_traffic_panel(100.0)
        self.assertIsInstance(p1, Panel)

        # 50% degraded
        p2 = build_traffic_panel(50.0)
        self.assertIsInstance(p2, Panel)

        # 0% outage
        p3 = build_traffic_panel(0.0)
        self.assertIsInstance(p3, Panel)

    def test_build_pods_table(self):
        pods = [
            {"name": "frontend", "ready": "1/1", "status": "Running", "restarts": 0},
            {"name": "backend", "ready": "0/1", "status": "CrashLoopBackOff", "restarts": 5},
        ]
        table = build_pods_table(pods)
        self.assertIsInstance(table, Table)
        self.assertEqual(len(table.rows), 2)

    def test_build_empty_pods_table(self):
        table = build_pods_table([])
        self.assertIsInstance(table, Table)
        self.assertEqual(len(table.rows), 1)

    def test_build_event_log_panel(self):
        events = [
            {"time": "12:00:01", "badge": "POLL", "message": "Health check ok"},
            {"time": "12:00:02", "badge": "FAIL", "message": "Connection refused"},
        ]
        panel = build_event_log_panel(events)
        self.assertIsInstance(panel, Panel)

    def test_make_dashboard_layout(self):
        layout = make_dashboard_layout(
            handle="neo",
            wave_num=2,
            event_id="HACK_2026",
            pods=[{"name": "test-pod", "ready": "1/1", "status": "Running", "restarts": 0}],
            traffic_pct=85.0,
            events=[{"time": "12:00:00", "badge": "OK", "message": "Sample event"}],
        )
        self.assertIsInstance(layout, Layout)
        self.assertIsNotNone(layout["header"])
        self.assertIsNotNone(layout["traffic"])
        self.assertIsNotNone(layout["footer"])

    def test_get_live_cluster_data(self):
        pods, traffic, events = get_live_cluster_data()
        self.assertIsInstance(pods, list)
        self.assertIsInstance(traffic, float)
        self.assertIsInstance(events, list)


if __name__ == "__main__":
    unittest.main()
