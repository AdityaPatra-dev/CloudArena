"""Validate that all bundled Kubernetes manifests are valid and correctly structured."""

import unittest
import yaml
from cloudarena.core.paths import MANIFESTS_DIR


class TestManifests(unittest.TestCase):
    def test_manifests_directory_exists(self):
        self.assertTrue(MANIFESTS_DIR.exists())
        yaml_files = list(MANIFESTS_DIR.glob("*.yaml"))
        self.assertGreaterEqual(len(yaml_files), 5)

    def test_manifests_are_valid_yaml(self):
        yaml_files = sorted(MANIFESTS_DIR.glob("*.yaml"))
        names = [f.name for f in yaml_files]
        self.assertIn("00_namespaces.yaml", names)
        self.assertIn("01_cache.yaml", names)
        self.assertIn("02_backend.yaml", names)
        self.assertIn("03_frontend.yaml", names)
        self.assertIn("04_traffic_gen.yaml", names)

        for file_path in yaml_files:
            with open(file_path, "r", encoding="utf-8") as f:
                docs = list(yaml.safe_load_all(f))
                self.assertGreater(len(docs), 0, f"{file_path.name} has no valid YAML docs")
                for doc in docs:
                    self.assertIsInstance(doc, dict, f"{file_path.name} contains non-dict doc")
                    self.assertIn("apiVersion", doc)
                    self.assertIn("kind", doc)
                    self.assertIn("metadata", doc)
                    self.assertIn("name", doc["metadata"])

    def test_namespaces_present(self):
        ns_file = MANIFESTS_DIR / "00_namespaces.yaml"
        with open(ns_file, "r", encoding="utf-8") as f:
            docs = list(yaml.safe_load_all(f))
        ns_names = [d["metadata"]["name"] for d in docs if d["kind"] == "Namespace"]
        self.assertIn("cloudarena-app", ns_names)
        self.assertIn("cloudarena-system", ns_names)


if __name__ == "__main__":
    unittest.main()
