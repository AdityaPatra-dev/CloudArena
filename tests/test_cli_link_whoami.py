"""Unit tests for CLI link and whoami commands."""

import unittest
from unittest.mock import patch
import typer

from cloudarena.cli.link_cmd import mask_token, run_link
from cloudarena.cli.whoami_cmd import run_whoami
from cloudarena.core.config import AppConfig


class TestCliLinkWhoAmI(unittest.TestCase):
    def test_mask_token(self):
        short = "123"
        self.assertEqual(mask_token(short), "••••••••")

        token = "ca_live_9f81a7b4c2e1f5d6a7b8c9d0"
        masked = mask_token(token)
        self.assertTrue(masked.startswith("ca_live"))
        self.assertTrue(masked.endswith("c9d0"))
        self.assertIn("••••••••", masked)

    @patch("cloudarena.cli.link_cmd.save_config")
    @patch("cloudarena.cli.link_cmd.load_config")
    def test_run_link_success(self, mock_load, mock_save):
        config = AppConfig()
        mock_load.return_value = config

        run_link("ca_live_9f81a7b4c2e1f5d6", event="HACK_2026", handle="cyber_warrior")

        self.assertEqual(config.player.arena_token, "ca_live_9f81a7b4c2e1f5d6")
        self.assertTrue(config.player.is_linked)
        self.assertFalse(config.player.solo_mode)
        self.assertEqual(config.player.event_id, "HACK_2026")
        self.assertEqual(config.player.handle, "cyber_warrior")
        mock_save.assert_called_once_with(config)

    def test_run_link_short_token_raises_exit(self):
        with self.assertRaises(typer.Exit):
            run_link("short")

    @patch("cloudarena.cli.whoami_cmd.load_config")
    def test_run_whoami(self, mock_load):
        config = AppConfig()
        config.player.handle = "test_player"
        config.player.is_linked = True
        config.player.arena_token = "ca_live_9f81a7b4c2e1f5d6"
        mock_load.return_value = config

        # Should execute cleanly without error
        try:
            run_whoami()
        except Exception as e:
            self.fail(f"run_whoami raised exception: {e}")


if __name__ == "__main__":
    unittest.main()
