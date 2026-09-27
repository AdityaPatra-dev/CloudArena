"""Unit tests for CLI wave stop and uninstall commands."""

import unittest
from unittest.mock import MagicMock, patch
from pathlib import Path
from cloudarena.cli.uninstall_cmd import run_uninstall
from cloudarena.cli.wave_cmd import stop_wave
from cloudarena.core.config import AppConfig


class TestCliUninstallStop(unittest.TestCase):
    @patch("cloudarena.cli.wave_cmd.rollback_wave")
    @patch("cloudarena.cli.wave_cmd.load_config")
    def test_wave_stop_command(self, mock_load, mock_rollback):
        config = AppConfig()
        config.game.current_wave = 2
        mock_load.return_value = config

        stop_wave(wave=2)
        mock_rollback.assert_called_once_with(2)

    @patch("cloudarena.cli.uninstall_cmd.Path.home")
    @patch("cloudarena.cli.uninstall_cmd.shutil.rmtree")
    @patch("cloudarena.cli.uninstall_cmd.delete_cluster")
    @patch("cloudarena.cli.uninstall_cmd.is_cluster_running")
    @patch("cloudarena.cli.uninstall_cmd.CLOUDARENA_HOME")
    @patch("cloudarena.cli.uninstall_cmd.load_config")
    def test_run_uninstall_force(
        self, mock_load, mock_home_dir, mock_is_running, mock_delete, mock_rmtree, mock_path_home
    ):
        config = AppConfig()
        config.cluster.cluster_name = "cloudarena-cluster"
        mock_load.return_value = config
        mock_is_running.return_value = True
        mock_home_dir.exists.return_value = True

        fake_symlink = MagicMock()
        fake_symlink.is_symlink.return_value = True
        fake_symlink.exists.return_value = True

        fake_home = MagicMock()
        fake_home.__truediv__.return_value.__truediv__.return_value.__truediv__.return_value = fake_symlink
        mock_path_home.return_value = fake_home

        run_uninstall(force=True)

        mock_delete.assert_called_once_with("cloudarena-cluster")
        mock_rmtree.assert_called_once_with(mock_home_dir)


if __name__ == "__main__":
    unittest.main()
