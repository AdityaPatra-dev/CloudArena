"""Tests for cluster lifecycle manager and error handling."""

import unittest
from unittest.mock import patch
from cloudarena.k8s.cluster import ClusterError, get_k3d_bin, is_cluster_running


class TestCluster(unittest.TestCase):
    @patch("cloudarena.k8s.cluster.find_binary", return_value=None)
    def test_get_k3d_bin_missing_raises_error(self, mock_find):
        with self.assertRaises(ClusterError):
            get_k3d_bin()

    @patch("cloudarena.k8s.cluster.find_binary", return_value="/custom/bin/k3d")
    def test_get_k3d_bin_found(self, mock_find):
        res = get_k3d_bin()
        self.assertEqual(res, "/custom/bin/k3d")

    @patch("cloudarena.k8s.cluster.get_k3d_bin", side_effect=ClusterError("not found"))
    def test_is_cluster_running_returns_false_when_k3d_missing(self, mock_bin):
        self.assertFalse(is_cluster_running("dummy"))


if __name__ == "__main__":
    unittest.main()
