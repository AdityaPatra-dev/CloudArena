# 🌩️ CloudArena: AI-Powered Cloud Infrastructure Survival Arena

> **CloudArena** is a zero-cost, gamified educational platform where engineers, students, and DevOps practitioners master Kubernetes incident response by surviving automated, escalating infrastructure attacks in a safe, locally sandboxed environment.

[![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Kubernetes](https://img.shields.io/badge/kubernetes-k3d%20v1.30-326CE5.svg)](https://k3d.io)
[![Tests](https://img.shields.io/badge/tests-99%2F99%20passing-brightgreen.svg)]()
[![Platform](https://img.shields.io/badge/live-gdg--cloudarena.web.app-0284c7.svg)](https://gdg-cloudarena.web.app)

---

## 🌐 Live Web Platform & Tournament Portal
Access the live production dashboard, public SRE certificate verifier, and organizer command center:
👉 **[https://gdg-cloudarena.web.app](https://gdg-cloudarena.web.app)**

---

## 🎯 Why CloudArena?

* **Zero-Cost & Local-First:** Runs 100% locally on your laptop inside Docker via `k3d` (1 control plane, 2 worker nodes). Zero cloud bills, no AWS/GCP accounts, no credit cards required.
* **Standardized Battlefield:** Every player starts with an identical, isolated cluster deploying microservices (Redis cache, Python backend API, React/Nginx frontend, synthetic traffic generator).
* **8 Escalating Chaos Waves:** Injects progressive real-world infrastructure failures:
  * **Wave 1:** Rogue CPU Hog (Compute starvation & unconstrained miner pod)
  * **Wave 2:** Memory Exhaustion & OOMKilled (Linux kernel Exit Code 137)
  * **Wave 3:** Broken Health Probe (Liveness probe HTTP path typo & restart flapping)
  * **Wave 4:** Traffic Surge & Bottleneck (10x synthetic surge & horizontal pod scaling)
  * **Wave 5:** CoreDNS Resolution Blackout (Misconfigured DNS policy & inter-service failure)
  * **Wave 6:** Storage Deadlock & ReadOnly Mount (Stateful persistence lock)
  * **Wave 7:** RBAC Authorization Denial (Missing RoleBinding & 403 API denials)
  * **Wave 8:** Corrupted Ingress TLS Handshake (Secret corruption & PKI recovery)
* **Kubeconfig & Environment Isolation:** CloudArena runs isolated binaries in `~/.cloudarena/bin/` and stores credentials at `~/.cloudarena/kubeconfig.yaml`. It **never** touches or alters your system `~/.kube/config`.
* **AI Incident Mentor:** Anti-spoiler guidance engine providing 3-tier progressive hints (`-10`, `-25`, `-50` pts) using an offline rule catalog or online LLMs (Gemini / Ollama).
* **Anti-Cheat Cryptographic Proofs:** All wave completions require an HMAC-SHA256 nonce verification injected directly into cluster ConfigMaps during wave launch.
* **Verifiable SRE Credentials:** Mints cryptographically signed, verifiable certificates and SVG badges upon tournament completion.

---

## ⚡ Quickstart & Zero-Friction Installation

CloudArena features automated zero-friction installers that **auto-detect, install, and configure all prerequisites** (Python 3, Docker Desktop/Engine, k3d, kubectl, and CLI), skipping components you already have installed.

### 🪟 Windows (Open PowerShell as Administrator)
```powershell
irm https://gdg-cloudarena.web.app/install.ps1 | iex
```
*(Or via direct archive pip install without Git)*:
```powershell
pip install https://github.com/AdityaPatra-dev/CloudArena/archive/refs/heads/main.zip
```

### 🐧 Linux & 🍎 macOS (Open Terminal)
```bash
curl -sSL https://gdg-cloudarena.web.app/install.sh | bash
```

### 🧑‍💻 Manual Developer Installation
```bash
git clone https://github.com/AdityaPatra-dev/CloudArena.git
cd CloudArena

python3 -m venv .venv
source .venv/bin/activate
pip install -e .
cloudarena setup -i
```

---

## ⚔️ The Battle Loop

### 1. Authenticate with the Cloud Arena
Sign in to [https://gdg-cloudarena.web.app](https://gdg-cloudarena.web.app) with Google to get your personal Arena Token:
```bash
cloudarena link <YOUR_ARENA_TOKEN> --event HACKATHON_2026
```

### 2. Spin Up the Battlefield Cluster
```bash
cloudarena start
```
*CloudArena's self-healing engine automatically checks Docker daemon status, wakes up services, and verifies cluster health.*

### 3. Launch an Attack Wave
```bash
cloudarena wave start 1
```

### 4. Check Incident Status
```bash
cloudarena wave status
```

### 5. Request AI Mentor Clues (Progressive Hints)
If stuck, consult the AI Incident Mentor (prompts confirmation before deducting points):
```bash
cloudarena hint
```

### 6. Diagnose and Remediate
Investigate and resolve using standard Kubernetes commands through CloudArena's isolated proxy:
```bash
# Example: Inspect pods and eliminate rogue workload in Wave 1
cloudarena kubectl get pods -A
cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system
```

### 7. Confirm Victory & View Attestation Proof
```bash
cloudarena wave status
```

### 8. View Incident Post-Mortem
Inspect the automatically generated post-mortem report (Root Cause Analysis, Timeline, and Prevention Tips):
```bash
cloudarena postmortem 1
```

### 9. Instant Wave Reset (< 3s)
If you break manifests or get tangled during an incident, instantly restore the clean baseline:
```bash
cloudarena reset
```

### 10. Clean Teardown
When finished, cleanly wipe the cluster, downloaded tools, and Docker networks:
```bash
cloudarena destroy
```
*(To completely remove all binaries, databases, and local configs)*:
```bash
cloudarena uninstall
```

---

## 🛡️ Cyber Attack Defense & Security Architecture

CloudArena is architected with multi-layered defenses to withstand standard web attacks, script-kiddie denial-of-service attempts, credential theft, and scoreboard spoofing:

### 1. OWASP Top 10 Web Security Defenses
* **Content Security Policy (CSP):** Enforces a strict whitelist of trusted script, connect, style, and font origins (`default-src 'self'`). Inline script execution and unauthorized external third-party domains are blocked.
* **Cross-Site Scripting (XSS) Prevention:** The web frontend strictly utilizes React JSX virtual DOM rendering with automated HTML entity encoding. Raw HTML sinks (`dangerouslySetInnerHTML`, `eval()`) are banned and absent across all components.
* **Clickjacking Protection:** Armed with `X-Frame-Options: DENY` and CSP `frame-ancestors 'none'`, prohibiting unauthorized iframe embedding.
* **MIME Sniffing Immunity:** Enforces `X-Content-Type-Options: nosniff`.
* **Transport Layer Security & Protocol Downgrade:** Enforces HTTPS with HTTP Strict Transport Security (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`).
* **Cross-Origin Opener Policy (COOP):** Set to `same-origin-allow-popups` to isolate application memory contexts while cleanly supporting Google OAuth popups.

### 2. Database & API Security (Cloud Firestore)
* **Zero Privilege Escalation:** Database security rules enforce that regular participants cannot elevate themselves to the `admin` role or modify another user's personal `arena_token`.
* **Account & Token Privacy:** Personal Arena Tokens are stored in private user profiles accessible only by the owner or verified event organizers (`isOwner(userId) || isAdmin()`).
* **Document Bloat & Storage Exhaustion Defense:** All write payloads on public collections (such as handles and team names) are length-bounded (e.g., handles $\le 32$ chars, team names $\le 40$ chars, squads capped at 10 cadets) to prevent document bloat and database quota exhaustion attacks.
* **Write Rate Limiting:** Rapid script flooding on participant profiles is throttled at the database security rule layer (`request.time >= resource.data.updated_at + duration.value(2, 's')`).

### 3. Anti-Cheat & Anti-Spoofing Protocol
* **Cryptographic HMAC Attestation:** When a wave begins, the game engine generates a unique SHA-256 HMAC nonce combining the player's private token, the wave ID, and a cluster timestamp.
* **Cluster Secret Verification:** This nonce is injected into the local cluster's Kubernetes secrets/ConfigMaps. When verifying resolution, CloudArena binds the recovery proof to this nonce, ensuring that scores cannot be forged without actually solving the wave on a running cluster.
* **Score Bounds Validation:** Database rules strictly enforce that submitted scores cannot exceed maximum wave limits ($0 \le \text{score} \le 1000$) and valid wave ranges ($1 \le \text{wave} \le 8$).

### 4. DDoS & Quota-Exhaustion Protection (2,000+ Students on Free Tier)
* **Single-Document Cache Strategy:** Rather than having thousands of spectator browsers stream individual queries from `participants`, the web frontend reads a single aggregated document (`cached_leaderboard/top100`), reducing read volume from $N \times 100$ down to $1$ read per client.
* **Edge CDN Caching:** Static bundles and installers are cached via Google Global CDN Edge (`Cache-Control: public, max-age=31536000`), ensuring that even thousands of concurrent users consume minimal bandwidth.

---

## 📖 Master Solutions Playbook

For an exhaustive, step-by-step engineering walkthrough of all 8 challenge waves, root cause analyses, diagnostic commands, and solutions, consult:
👉 **[WAVES_MASTER_PLAYBOOK_AND_SOLUTIONS.md](WAVES_MASTER_PLAYBOOK_AND_SOLUTIONS.md)**

---

## 🏛️ Project Architecture

```text
CloudArena/
├── cloudarena/
│   ├── attacks/           # Chaos scenarios (Waves 1-8), manager & custom YAML scenario plugin engine
│   ├── attestation/       # HMAC nonce injection, SHA-256 proofs & verifiable SVG certificates
│   ├── backend/           # FastAPI tournament leaderboard, WebSocket feeds & SQLite database
│   ├── cli/               # Typer CLI subcommands (start, wave, doctor, link, hint, reset, postmortem)
│   ├── core/              # Config management, environment inspector & zero-friction automated installer
│   ├── detection/         # Incident detection state machine & automated post-mortems
│   ├── k8s/               # k3d cluster lifecycle manager & Kubernetes YAML deployer
│   ├── manifests/         # Bundled target microservices (frontend, api, cache, traffic-gen)
│   ├── mentor/            # AI Incident Mentor (offline 3-tier catalog & LLM connector)
│   ├── scoring/           # Score calculator, speed bonus, penalties & sync client
│   └── telemetry/         # Flight recorder, node/pod telemetry & radar collector
├── web/                   # Vite + React + TailwindCSS live cloud tournament platform
│   ├── public/            # Automated installers (install.sh, install.ps1) & brand assets (cloudarena.png)
│   └── src/               # UI components (Leaderboard, CompetitorHub, AdminCenter, ProjectorMode, Docs)
├── tests/                 # Automated unit test suite (99 comprehensive tests)
├── firebase.json          # Hardened hosting config, CSP, HSTS, and cache rules
├── firestore.rules        # Role-based access control, write bounds, and anti-cheat validation
├── docker-compose.yml     # Standalone local leaderboard deployment
└── pyproject.toml         # Python package specification and CLI entrypoints
```

---

## 🧪 Testing

Run the automated test suite covering all 8 waves, CLI tools, telemetry, and attestation (99 unit tests):

```bash
python3 -m unittest discover -s tests -v
```

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

*Maintained by the CloudArena Core Team • Built for Google Developer Groups & Cloud Communities Worldwide.*
