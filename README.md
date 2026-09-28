# 🌩️ CloudArena: AI-Powered Cloud Infrastructure Survival Arena

> **CloudArena** is a zero-cost, gamified educational platform where engineers, students, and DevOps practitioners master Kubernetes troubleshooting by surviving automated, escalating infrastructure attacks in a safe, locally sandboxed environment.

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Kubernetes](https://img.shields.io/badge/kubernetes-k3d%20v1.30-326CE5.svg)](https://k3d.io)
[![Tests](https://img.shields.io/badge/tests-30%2F30%20passing-brightgreen.svg)]()

---

## 🎯 Why CloudArena?

* **Zero-Cost & Local-First:** Runs 100% locally on your laptop inside Docker via `k3d` (1 control plane, 2 worker nodes). Zero cloud bills, no AWS/GCP accounts, no credit cards required.
* **Standardized Battlefield:** Every player starts with an identical, isolated cluster deploying microservices (Redis cache, Python backend API, Nginx frontend, synthetic traffic generator).
* **Escalating Chaos Waves:** Injects progressive real-world infrastructure failures:
  * **Wave 1:** Rogue CPU Hog (Compute starvation)
  * **Wave 2:** Memory Exhaustion & OOMKilled (Exit Code 137)
  * **Wave 3:** Broken Health Probe (Continuous restart flapping)
  * **Wave 4:** Traffic Surge & Bottleneck (Horizontal scaling challenge)
* **Kubeconfig & Environment Isolation:** CloudArena runs isolated binaries in `~/.cloudarena/bin/` and keeps credentials at `~/.cloudarena/kubeconfig.yaml`. It will **never** touch or break your system `~/.kube/config`.
* **AI Incident Mentor:** Anti-spoiler guidance engine providing 3-tier progressive hints (`-10`, `-25`, `-50` pts) using an offline rule catalog or online LLMs (Gemini / Ollama).
* **SRE Learning Loop:** Automatically generates an Incident Post-Mortem (Root Cause Analysis, Timeline, and Prevention Tips) upon clearing each wave.
* **Live Tournament Dashboard:** Built-in FastAPI server with SQLite and real-time TailwindCSS dashboard for hackathons and workshops.

---

## ⚡ Quickstart Guide

### 1. Installation & Environment Setup
Clone the repository and install dependencies:

```bash
git clone https://github.com/AdityaPatra-dev/CloudArena.git
cd CloudArena

python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

### 2. Pre-Flight Audit & Automatic Tooling
Check system requirements and auto-download `k3d` and `kubectl` to `~/.cloudarena/bin/`:

```bash
cloudarena setup -i
```

> **Note on Linux Docker Permissions:** Ensure your user account belongs to the `docker` group:
> ```bash
> sudo usermod -aG docker $USER && newgrp docker
> ```

### 3. Spin Up the Battlefield
Provision the 3-node cluster and deploy the target microservices:

```bash
cloudarena start
```

Inspect cluster state safely using the isolated kubectl proxy:
```bash
cloudarena kubectl get nodes
cloudarena kubectl get pods -A
```

---

## ⚔️ The Battle Loop

### Launch an Attack Wave
```bash
cloudarena wave start 1
```

### Check Resolution Status
```bash
cloudarena wave status
```

### Request Contextual Guidance (AI Mentor)
If stuck, consult the AI Incident Mentor (prompts before deducting points):
```bash
cloudarena hint
```

### Troubleshoot & Fix
Investigate using standard Kubernetes commands:
```bash
# Example: Inspect pods and eliminate rogue workload in Wave 1
cloudarena kubectl get pods -A
cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system
```

### Confirm Victory & View Score
```bash
cloudarena wave status
```

### Read the SRE Incident Post-Mortem
Inspect the automatically generated post-mortem report:
```bash
cloudarena postmortem 1
```

### Instant Wave Reset (< 3s)
If you break manifests or get tangled during an incident, instantly restore the clean baseline:
```bash
cloudarena reset
```

### Master Playbook & Incident Solutions
For an exhaustive, step-by-step engineering walkthrough of all 8 challenge waves, root cause analyses, and solutions, consult:
👉 **[WAVES_MASTER_PLAYBOOK_AND_SOLUTIONS.md](WAVES_MASTER_PLAYBOOK_AND_SOLUTIONS.md)**

### Teardown
When finished, cleanly wipe the cluster and Docker networks:
```bash
cloudarena destroy
```

---

## 🌐 Live Tournament Leaderboard Server

For organizers hosting a workshop, hackathon, or classroom tournament:

### Start the Server Locally
```bash
cloudarena server start --port 8000
```
* **Live Web Dashboard:** [http://localhost:8000/](http://localhost:8000/) (auto-updates every 3s)
* **REST API Documentation:** [http://localhost:8000/docs](http://localhost:8000/docs)

### Or Deploy via Docker Compose
```bash
docker compose up -d
```

### View Standings in the CLI
```bash
cloudarena leaderboard
```

---

## 🧪 Testing

Run the automated test suite covering all phases (30 unit tests):

```bash
python3 -m unittest discover -s tests -p "test_*.py" -v
```

---

## 🏛️ Project Architecture

```text
CloudArena/
├── cloudarena/
│   ├── attacks/           # Sandboxed attack scenarios (Waves 1 to 4) & reset manager
│   ├── backend/           # FastAPI tournament leaderboard & SQLite database
│   ├── cli/               # Typer CLI subcommands (setup, start, wave, hint, reset, postmortem)
│   ├── core/              # Config management, environment inspector, auto-installer
│   ├── detection/         # Incident detection state machine & automated post-mortems
│   ├── k8s/               # k3d cluster lifecycle manager & YAML applier
│   ├── manifests/         # Bundled base microservices (frontend, api, cache, traffic-gen)
│   ├── mentor/            # AI Incident Mentor (offline 3-tier catalog & LLM connector)
│   ├── scoring/           # Score calculator, speed bonus, penalties & sync client
│   └── telemetry/         # Pod, node, and traffic telemetry collector
├── tests/                 # Full unit test suite (30 tests)
├── docker-compose.yml     # Standalone leaderboard deployment
├── Dockerfile.server      # Container build for leaderboard server
└── pyproject.toml         # Package definition and dependencies
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.
