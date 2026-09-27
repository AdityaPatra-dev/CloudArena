# 🌩️ CloudArena: Master Architecture, File Structure & Evolution Roadmap

> **Document Version:** 2.1.0  
> **Status:** Living Master Specification & Strategic Evolution Plan  
> **Live Web Platform:** [https://gdg-cloudarena.web.app](https://gdg-cloudarena.web.app)  
> **Firebase Project ID:** `gdg-cloudarena` (Project Number: `395221996321`)  
> **Software Release:** `v0.2.0`  
> **Target Concurrency:** 2,000+ Hackathon Competitors @ $0.00 Cloud Compute Cost  

---

## 📑 Table of Contents

1. [Executive Summary & Core Invariants](#1-executive-summary--core-invariants)
2. [Complete Codebase File Tree & Module Responsibility Matrix](#2-complete-codebase-file-tree--module-responsibility-matrix)
3. [Deep Architectural Subsystem Breakdown](#3-deep-architectural-subsystem-breakdown)
   - [3.1 Local Sandboxed Kubernetes Engine (`k3d` in Docker)](#31-local-sandboxed-kubernetes-engine)
   - [3.2 Chaos Injection & Instant Snapshot Reset Engine](#32-chaos-injection--instant-snapshot-reset-engine)
   - [3.3 Cryptographic Anti-Cheat Attestation Engine](#33-cryptographic-anti-cheat-attestation-engine)
   - [3.4 Telemetry Collector & 10-Second Stabilization State Machine](#34-telemetry-collector--10-second-stabilization-state-machine)
   - [3.5 Progressive AI SRE Incident Mentor & Automated Post-Mortems](#35-progressive-ai-sre-incident-mentor--automated-post-mortems)
   - [3.6 Option B Token Authentication Flow](#36-option-b-token-authentication-flow)
   - [3.7 Cloud Firestore Quota Management (2,000 Concurrent Users)](#37-cloud-firestore-quota-management)
   - [3.8 Web Platform, Mobile UX & Organizer Command Center](#38-web-platform-mobile-ux--organizer-command-center)
4. [Tooling & Dependency Manifest](#4-tooling--dependency-manifest)
5. [Codebase Audit & Gap Analysis](#5-codebase-audit--gap-analysis)
6. [Innovation Ideation: Next-Level Features to Elevate CloudArena](#6-innovation-ideation-next-level-features-to-elevate-cloudarena)
7. [Step-by-Step Evolution Implementation Roadmap (Phases 7–10)](#7-step-by-step-evolution-implementation-roadmap)

---

## 1. Executive Summary & Core Invariants

**CloudArena** is an educational, zero-cost, gamified platform where engineering students, developers, and DevOps engineers learn production Kubernetes troubleshooting by surviving automated infrastructure attacks in a sandboxed 3-node cluster running locally on their laptop.

### Core Architectural Invariants:
1. **Zero Cloud Compute Cost:** Compute runs on participants' laptops via `k3d` in Docker ($0.00 cloud VM bills). For a 2,000-person hackathon, this saves **$10,000–$25,000** compared to AWS EKS or GCP GKE.
2. **Zero-Lag Terminal Commands:** `kubectl logs`, `kubectl top`, and `kubectl describe` execute with 0ms network latency.
3. **Cryptographic Anti-Cheat Proofs:** Eliminates score spoofing. Ephemeral nonces injected into cluster secrets (`secret/cloudarena-incident-nonce`) are mathematically signed via HMAC-SHA256 upon resolution.
4. **Offline Resilience:** If venue Wi-Fi drops, participants can still troubleshoot and clear waves locally; scores buffer and sync when connectivity returns.
5. **Full Organizer Authority:** Real-time event lifecycle management, synchronized wave broadcast triggers, duration and stage customizers, live participant supervision radar, and instant scoreboard freezing.

---

## 2. Complete Codebase File Tree & Module Responsibility Matrix

```text
/home/adityapatra/Documents/GitHub/CloudArena
├── .firebaserc                          # Firebase CLI active project mapping (gdg-cloudarena)
├── .gitignore                           # Excludes venv, .env, .firebase, dist, node_modules
├── Dockerfile.server                    # Production Python 3.11 container for FastAPI leaderboard
├── docker-compose.yml                   # Docker Compose specification with persistent data volume
├── firestore.rules                      # Production Firestore Security Rules (RBAC, scoring, profiles)
├── pyproject.toml                       # Packaging, CLI entry point (cloudarena), Python dependencies
├── README.md                            # Public open-source repository documentation
├── CloudArena_MVP_Blueprint.md          # Initial Phase 1 architectural blueprint
├── IDEATION_AND_ROADMAP.md              # Foundation 6-phase implementation roadmap
├── ENTERPRISE_HACKATHON_ARCHITECTURE_AND_ROADMAP.md # 2,000-user scale & benchmark spec
├── FIREBASE_INTEGRATION_AND_ADMIN_SPEC.md           # Firebase configuration walkthrough
│
├── cloudarena/                          # Core Python Package (4,192 Lines of Code)
│   ├── __init__.py                      # Package identity & version (0.1.0)
│   ├── core/                            # System paths, config, and binary downloads
│   │   ├── paths.py                     # ~/.cloudarena directories, socket paths, kubeconfig
│   │   ├── config.py                    # Pydantic AppConfig model (Player, Cluster, GameState)
│   │   ├── environment.py               # Pre-flight audit (Docker, RAM, CPU, virtualization)
│   │   └── installer.py                 # Streaming chunked downloader for k3d & kubectl
│   │
│   ├── k8s/                             # Local Sandboxed Kubernetes Engine
│   │   ├── client.py                    # Isolated kubeconfig loader (preserves host ~/.kube)
│   │   ├── cluster.py                   # k3d cluster creation (1 server + 2 agents), status, wipe
│   │   └── deployer.py                  # Manifest applicator & ready-state health checker
│   │
│   ├── manifests/                       # Target Microservices Kubernetes Manifests
│   │   ├── 00_namespaces.yaml           # cloudarena-app & cloudarena-system namespaces
│   │   ├── 01_cache.yaml                # Redis in-memory cache deployment & service
│   │   ├── 02_backend.yaml              # Python API backend deployment (3 replicas), service
│   │   ├── 03_frontend.yaml             # Nginx reverse proxy frontend deployment & NodePort
│   │   └── 04_traffic_gen.yaml          # Continuous synthetic traffic generator
│   │
│   ├── attacks/                         # Chaos Scenarios & Lifecycle Manager
│   │   ├── base.py                      # Abstract BaseAttack class & AttackInfo schema
│   │   ├── wave1_cpu.py                 # Wave 1: CPU Starvation (Rogue spin-loop miner)
│   │   ├── wave2_memory.py              # Wave 2: Memory Leak Cascade (24Mi OOMKilled loop)
│   │   ├── wave3_probe.py               # Wave 3: Broken Health Probe (Typo /healhtz 404 loop)
│   │   ├── wave4_traffic.py             # Wave 4: Traffic Surge & Under-provisioning (1 replica)
│   │   └── manager.py                   # Attack registry, inject, rollback, and <3s snapshot reset
│   │
│   ├── attestation/                     # Cryptographic Anti-Cheat Engine
│   │   └── proof.py                     # HMAC challenge nonce, K8s secret injection, verification
│   │
│   ├── telemetry/                       # Metrics Ingestion
│   │   └── collector.py                 # Live pod restarts, node CPU/RAM %, synthetic traffic success %
│   │
│   ├── detection/                       # Incident Resolution & RCA
│   │   ├── state_machine.py             # 10s stabilization window, flap detection, health checks
│   │   └── postmortem.py                # Auto-generated markdown SRE Root-Cause Analysis postmortem
│   │
│   ├── mentor/                          # Progressive AI SRE Mentor
│   │   ├── catalog.py                   # 12 deterministic offline hints across 3 progression tiers
│   │   ├── llm.py                       # Gemini / Ollama integration with anti-spoiler prompt
│   │   └── engine.py                    # Hint dispenser and penalty deduction manager
│   │
│   ├── scoring/                         # Tournament Scoring Engine
│   │   ├── calculator.py                # Base points, linear speed bonus, hint penalties
│   │   └── sync.py                      # Cryptographic proof sender & adaptive 30s heartbeat
│   │
│   ├── backend/                         # Leaderboard Server & Local Gateway
│   │   ├── api/
│   │   │   └── app.py                   # FastAPI app, token auth, admin config, React SPA mount
│   │   └── database/
│   │       └── db.py                    # SQLite storage (users, scores, event_config, heartbeats)
│   │
│   └── cli/                             # CLI Commands Engine (Typer + Rich)
│       ├── main.py                      # Root CLI application with banner and 14 commands
│       ├── setup_cmd.py                 # `cloudarena setup [-i]` (Prerequisite checker & installer)
│       ├── status_cmd.py                # `cloudarena status` (Cluster health & game state)
│       ├── start_cmd.py                 # `cloudarena start` (Provisions 3-node cluster)
│       ├── destroy_cmd.py               # `cloudarena destroy` (Safely wipes cluster clean)
│       ├── wave_cmd.py                  # `cloudarena wave start|status|watch|rollback|list`
│       ├── hint_cmd.py                  # `cloudarena hint` (Tier 1/2/3 guidance)
│       ├── reset_cmd.py                 # `cloudarena reset` (Instant <3s snapshot baseline reset)
│       ├── postmortem_cmd.py            # `cloudarena postmortem` (Displays generated RCA report)
│       ├── leaderboard_cmd.py           # `cloudarena leaderboard` (Terminal standings table)
│       ├── server_cmd.py                # `cloudarena server start` (Runs FastAPI & web dashboard)
│       ├── link_cmd.py                  # `cloudarena link <token>` (Option B Cloud Linking)
│       └── whoami_cmd.py                # `cloudarena whoami` (Identity passport & cloud status)
│
├── web/                                 # Web Platform (React 18 + Vite 5 + Tailwind + Firebase)
│   ├── index.html                       # HTML5 entry template with viewport optimizations
│   ├── package.json                     # Node dependencies (Firebase v10, Lucide, Tailwind)
│   ├── vite.config.js                   # Vite configuration (server on port 5173, React plugin)
│   ├── tailwind.config.js               # Cyberpunk / SRE dark color themes & font families
│   ├── postcss.config.js                # Tailwind & Autoprefixer plugin configuration
│   ├── .env                             # Real Firebase credentials (gitignored)
│   ├── .env.example                     # Clean template for credentials
│   │
│   ├── public/                          # Static Assets & One-Line Installers
│   │   ├── install.sh                   # Linux/macOS curl installer script
│   │   └── install.ps1                  # Windows PowerShell installer script
│   │
│   └── src/                             # React Source Code (2,092 Lines of Code)
│       ├── main.jsx                     # React root renderer
│       ├── index.css                    # Tailwind directives & glow effects
│       ├── App.jsx                      # Main app controller with persistent auth listener
│       ├── firebase.js                  # Firebase Auth, Firestore listeners, and admin elevation
│       └── components/                  # UI Components
│           ├── Logo.jsx                 # Vector SVG geometric cloud-shield logo
│           ├── Navbar.jsx               # Header with mobile bottom tab navigation
│           ├── LeaderboardView.jsx      # Podium cards, mobile responsive standings, freeze banner
│           ├── CompetitorHub.jsx        # Google Sign-In, token card, Windows/Linux OS switcher
│           ├── AdminCommandCenter.jsx   # Event config, wave customizer, duration editors, live radar
│           └── ProjectorMode.jsx        # High-contrast 4K auditorium display mode
│
└── tests/                               # Comprehensive Unit Test Suite (12 files, 48 tests)
    ├── test_attacks.py                  # Verifies all 4 attack definitions, metadata, and memory parsing
    ├── test_attestation.py              # Nonce determinism, HMAC proofs, secret injection, anti-cheat
    ├── test_backend.py                  # FastAPI routes, auth mint/verify, scoreboard freeze, radar
    ├── test_cli_link_whoami.py          # Token masking, config persistence, whoami passport output
    ├── test_cluster.py                  # k3d binary detection and cluster running checks
    ├── test_config.py                   # Default config models, saving, and YAML reloading
    ├── test_environment.py              # Environment audit, Docker detection, fallback paths
    ├── test_k8s_manifests.py            # Validates all 5 Kubernetes YAML manifests are parseable
    ├── test_mentor.py                   # 3-tier catalog integrity, progression limit, LLM fallback
    ├── test_postmortem.py               # Markdown SRE RCA postmortem formatting and generation
    ├── test_scoring.py                  # Speed bonus, hint deductions, score floor guarantees
    └── test_state_machine.py            # 10s stabilization window and health flap detection
```

---

## 3. Deep Architectural Subsystem Breakdown

### 3.1 Local Sandboxed Kubernetes Engine
- **Tooling:** Uses `k3d` (lightweight wrapper for Rancher's `k3s` running in Docker containers).
- **Cluster Topography:** 1 Control-Plane node (`server-0`) and 2 Worker nodes (`agent-0`, `agent-1`).
- **Isolation Guarantee:** All cluster configurations and kubeconfigs are written strictly to `~/.cloudarena/k3d.kubeconfig`. The host's `~/.kube/config` is never modified or contaminated.
- **Embedded Wrapper:** `cloudarena kubectl <args>` transparently targets the sandboxed cluster without requiring host alias configuration.

### 3.2 Chaos Injection & Instant Snapshot Reset Engine
- **Wave 1 (CPU Starvation):** Schedules an unconstrained container running a CPU burn loop (`while true; do :; done`) in `cloudarena-system`, starving application worker nodes.
- **Wave 2 (Memory Leak OOMKilled):** Throttles `backend-api` deployment memory limits to 24Mi; Python startup exceeds cgroup memory, causing Linux kernel Exit Code 137 (`OOMKilled`) crash loops.
- **Wave 3 (Broken Health Probe):** Patches the container's `livenessProbe` HTTP path to `/healhtz` (typo); kubelet receives HTTP 404s and repeatedly restarts the pod every 30 seconds.
- **Wave 4 (Traffic Surge & Under-provisioning):** Clamps `backend-api` to a single replica while scaling `traffic-gen` in `cloudarena-system` to 5 parallel workers, overwhelming connections until scaled to $\ge 3$ replicas.
- **Instant Snapshot Reset (`< 3s`):** When a participant runs `cloudarena reset`, the engine reconciles baseline manifests, wipes transient chaos, and re-injects the wave failure in under 3 seconds.

### 3.3 Cryptographic Anti-Cheat Attestation Engine
Simple REST `POST /score` endpoints are vulnerable to forged requests. CloudArena prevents cheating through cluster-coupled cryptographic proofs:
1. **Challenge Nonce Generation:**
   $$\text{Nonce} = \text{HMAC-SHA256}(\text{ArenaToken}, \text{Wave} + \text{ClusterName} + \text{Timestamp})[:32]$$
2. **K8s Secret Challenge Injection:** The CLI injects this challenge directly into the participant's cluster as a protected secret: `cloudarena-system/cloudarena-incident-nonce`.
3. **Signed Proof of Resolution:**
   $$\text{Signature} = \text{HMAC-SHA256}(\text{ArenaToken}, \text{"RESOLVED"} + \text{Wave} + \text{ElapsedSeconds} + \text{Nonce})$$
4. **Server Verification:** The server re-computes the HMAC signature using the user's stored token and rejects any mismatched score submissions with HTTP 403 Forbidden.

### 3.4 Telemetry Collector & 10-Second Stabilization State Machine
- **Flap Prevention:** Fixes in Kubernetes often take time to stabilize (e.g. pods cycling during rollout). The state machine requires the cluster to remain continuously healthy for a strict **10-second stabilization window**.
- **Flap Detection:** If a pod crashes or fails a probe during the 10 seconds, the timer immediately resets to 0.
- **Synthetic Traffic Validation:** Probes the frontend and backend services through `cloudarena-system/traffic-gen` to verify HTTP 200 success rate $> 95\%$.

### 3.5 Progressive AI SRE Incident Mentor & Automated Post-Mortems
- **Deterministic 3-Tier Offline Catalog:** 12 offline hints across 3 tiers (Directional, Component Diagnostic, Tactical Action Clue) ensuring participants are never stuck even without internet or LLM API keys.
- **AI LLM Mentoring Engine:** When configured with Gemini or Ollama, the mentor answers participant queries using strict pedagogical system prompts that guide troubleshooting without spoiling exact commands.
- **Automated RCA Post-Mortem:** Upon wave completion, the engine generates an SRE Incident Post-Mortem in markdown detailing: Executive Summary, Impact, Root Cause, Timeline, and Prevention Recommendations.

### 3.6 Option B Token Authentication Flow
```mermaid
sequenceDiagram
    autonumber
    actor Player as Competitor
    participant Web as Web Dashboard (https://gdg-cloudarena.web.app)
    participant Auth as Firebase Auth (Google Sign-In)
    participant DB as Cloud Firestore
    participant CLI as Local Laptop Terminal (cloudarena)
    participant K8s as Sandboxed k3d Cluster

    Player->>Web: Clicks "Sign in with Google"
    Web->>Auth: Authenticates Gmail account
    Auth-->>Web: Google OAuth Credential + UID
    Web->>DB: Upserts profile & mints Arena Token (ca_live_...)
    Web-->>Player: Displays Token Hub with copyable snippet
    Player->>CLI: cloudarena link ca_live_... --event HACKATHON_2026
    CLI->>CLI: Stores token in ~/.cloudarena/config.yaml
    Player->>CLI: cloudarena start && cloudarena wave start 1
    CLI->>K8s: Provisions 3-node cluster & injects Secret Nonce
    Player->>CLI: Fixes incident & runs cloudarena wave watch
    CLI->>DB: Transmits signed HMAC proof & updates verified score
    DB-->>Web: Real-time update on live leaderboard & organizer radar
```

### 3.7 Cloud Firestore Quota Management
For 2,000 concurrent participants:
- **Event-Driven Writes:** Telemetry is not streamed every second. Writes occur strictly on state transitions: `ATTACK_INJECTED`, `HINT_REQUESTED`, `WAVE_RESOLVED`.
- **Adaptive Heartbeats (30s interval):** Active incidents send a compressed 200-byte heartbeat every 30 seconds (~66 writes/sec total, well within Firestore's 10,000 writes/sec limit).
- **Cached Top-100 Document:** Public spectators query a single cached document (`events/{id}/cached_leaderboard/top100`) rather than reading 2,000 separate participant rows.

### 3.8 Web Platform, Mobile UX & Organizer Command Center
- **Framework:** React 18, Vite 5, Tailwind CSS, Firebase SDK v10, Lucide Icons.
- **Persistent Sessions:** `initAuthListener` restores authenticated Google sessions across page reloads.
- **Mobile-First UX:** Fixed bottom navigation bar on smartphones, responsive card layout replacing wide tables, and mobile-optimized podium.
- **Organizer Authority:** Role-guarded admin tab (`user.role === 'admin'`) with custom stage customizer (renaming, duration, points), freeze scoreboard controls, and live radar.
- **Auditorium Projector Mode:** High-contrast 4K projector display for closing ceremonies.

---

## 4. Tooling & Dependency Manifest

### Python Dependencies (`pyproject.toml`):
| Package | Minimum Version | Installed Version | Purpose |
| :--- | :--- | :--- | :--- |
| `typer` | `>= 0.12.0` | `0.12.3` | CLI command routing, options, and help generation |
| `rich` | `>= 13.7.0` | `13.7.1` | Terminal formatting, tables, panels, and spinners |
| `pydantic` | `>= 2.7.0` | `2.7.4` | Configuration models and data validation |
| `pyyaml` | `>= 6.0.1` | `6.0.1` | Kubernetes manifests and config serialization |
| `kubernetes` | `>= 29.0.0` | `29.0.0` | Official Kubernetes Python client |
| `requests` | `>= 2.31.0` | `2.31.0` | Streaming binary downloads and REST calls |
| `psutil` | `>= 5.9.0` | `5.9.8` | Host CPU, RAM, and Docker process inspection |
| `fastapi` | `>= 0.110.0` | `0.110.0` | Central Leaderboard REST API server |
| `uvicorn` | `>= 0.29.0` | `0.29.0` | ASGI web server |
| `httpx` | `>= 0.27.0` | `0.28.1` | Async HTTP testing client |

### JavaScript / Node Dependencies (`web/package.json`):
| Package | Version | Purpose |
| :--- | :--- | :--- |
| `react` | `^18.3.1` | UI Component framework |
| `react-dom` | `^18.3.1` | Virtual DOM rendering |
| `firebase` | `^10.12.2` | Firebase Auth, Firestore real-time listeners |
| `lucide-react` | `^0.395.0` | Icons |
| `vite` | `^5.3.1` | Production bundler & dev server |
| `tailwindcss` | `^3.4.4` | Responsive styling |

### Sandboxed Engine Binaries:
| Binary | Target Version | Storage Path | Architecture |
| :--- | :--- | :--- | :--- |
| `k3d` | `v5.7.4` | `~/.cloudarena/bin/k3d` | `linux-amd64` |
| `kubectl` | `v1.30.2` | `~/.cloudarena/bin/kubectl` | `linux-amd64` |

---

## 5. Codebase Audit & Gap Analysis

| Subsystem | Current State | Audit Verdict | Potential Area of Growth |
| :--- | :--- | :--- | :--- |
| **Cluster Sandboxing** | 1 server + 2 agents via `k3d` in Docker | ✅ **Rock Solid** | Add support for Apple Silicon `arm64` auto-detection in installer. |
| **Chaos Scenarios** | Waves 1 to 4 implemented and tested | ✅ **Verified** | Expand with advanced real-world incidents (DNS, PVCs, RBAC, Ingress TLS). |
| **Anti-Cheat Engine** | HMAC nonces & cluster secret injection | ✅ **Production Ready** | Add periodic hash audit of pod specs to detect unauthorized modifications. |
| **Web Platform** | React/Vite live on Firebase Hosting | ✅ **Live & Responsive** | Add team/squad registration and live in-browser terminal preview. |
| **AI Mentor** | 12 offline hints + Gemini prompt | ✅ **Functional** | Add interactive terminal streaming chat (`cloudarena mentor chat`). |
| **Organizer Controls** | Stage names, durations, points, freeze | ✅ **Complete** | Add 1-click live chaos replay on projector. |

---

## 6. Innovation Ideation: Next-Level Features to Elevate CloudArena

To transform CloudArena from a great hackathon tool into an **industry-defining cloud competition platform**, here are high-impact features planned for future phases:

### Ideation 1: Advanced Chaos Waves (Waves 5 to 8)
- **Wave 5 (CoreDNS Outage):** Misconfigured `kube-dns` ConfigMap causes all service name resolutions (`backend-api.cloudarena-app.svc.cluster.local`) to fail with `NXDOMAIN`.
- **Wave 6 (Storage Binding Deadlock):** PersistentVolumeClaim requesting an invalid `StorageClass` or insufficient storage capacity, causing stateful caching pods to hang in `Pending`.
- **Wave 7 (RBAC Permission Barrier):** Microservice pod ServiceAccount missing RoleBinding permissions to watch ConfigMaps, throwing `403 Forbidden` API errors in application logs.
- **Wave 8 (TLS Certificate & Secret Invalidation):** Expired TLS certificate or missing secret key in Nginx ingress causing SSL handshake failures.

### Ideation 2: Real-Time Team / Squad CTF Mode
- Allow 2 to 4 competitors to form a **Squad** with an invite code.
- Shared squad score:
  $$\text{Squad Score} = \sum_{\text{members}} \text{Wave Scores} + \text{Co-op Speed Bonus}$$
- Web dashboard displays Squad Standings and individual role assignments (e.g. Network Specialist, Storage Specialist).

### Ideation 3: Interactive Streaming Terminal Mentor (`cloudarena mentor chat`)
- An interactive SRE chat session directly inside the terminal:
  ```bash
  cloudarena mentor chat
  ```
- Uses local Ollama models (offline) or Google Gemini 1.5 Pro to converse with the student about their active incident, analyzing logs and guiding their thought process interactively.

### Ideation 4: Cryptographically Verifiable SRE Certification Badges
- Upon clearing all waves, competitors receive a **Certified CloudArena Kubernetes Troubleshooter** digital credential.
- Automated SVG / PDF badge with an embedded QR code linking to `https://gdg-cloudarena.web.app/verify/{proof_id}` for LinkedIn profiles and resumes.

### Ideation 5: Live Incident Replay for Auditorium Closing Ceremonies
- The engine records the sequence of participant `kubectl` commands and pod health transitions.
- During awards ceremonies, the organizer can click **Replay Winning Run** on the Projector Mode display to show a high-speed timelapse of how the champion solved Wave 4 in record time.

---

## 7. Step-by-Step Evolution Implementation Roadmap (Phases 7–10)

```mermaid
gantt
    title CloudArena Evolution Roadmap
    dateFormat  YYYY-MM-DD
    section Completed Foundation
    Phase 1: Sandboxed Cluster Engine      :done, p1, 2026-09-26, 1d
    Phase 2: Chaos Scenarios (Waves 1-4)    :done, p2, 2026-09-27, 1d
    Phase 3: Telemetry & Stabilization      :done, p3, 2026-09-27, 1d
    Phase 4: Progressive AI SRE Mentor      :done, p4, 2026-09-27, 1d
    Phase 5: Cryptographic Anti-Cheat       :done, p5, 2026-09-28, 1d
    Phase 6: Firebase Platform & Mobile UI  :done, p6, 2026-09-28, 1d
    section Future Evolution
    Phase 7: Advanced Chaos Waves (5-8)    :active, p7, 2026-09-29, 2d
    Phase 8: Team & Squad Co-op CTF Mode    :p8, after p7, 2d
    Phase 9: Interactive Terminal AI Chat  :p9, after p8, 2d
    Phase 10: Verifiable SRE Badges & Replay:p10, after p9, 2d
```

### Detailed Phase Specifications:

#### Phase 7: Advanced Chaos Waves (Waves 5 to 8)
1. Implement `cloudarena/attacks/wave5_dns.py` (CoreDNS ConfigMap corruption).
2. Implement `cloudarena/attacks/wave6_storage.py` (StorageClass deadlock).
3. Implement `cloudarena/attacks/wave7_rbac.py` (Missing RoleBinding).
4. Implement `cloudarena/attacks/wave8_tls.py` (Corrupted TLS Ingress secret).
5. Add 12 corresponding 3-tier progressive hints to `catalog.py`.

#### Phase 8: Team / Squad Mode & Dynamic CTF Scoring
1. Update `PlayerConfig` with `team_id`, `team_name`, and `team_role`.
2. Add Team Creation & Join flow on `web/src/components/CompetitorHub.jsx`.
3. Add Team Standings view on `web/src/components/LeaderboardView.jsx`.

#### Phase 9: Interactive Streaming Terminal Mentor
1. Implement `cloudarena/cli/chat_cmd.py` (`cloudarena mentor chat`).
2. Add streaming token output with Rich Markdown live rendering.
3. Pass active cluster telemetry and recent pod events as context to Gemini.

#### Phase 10: Verifiable SRE Badges & Incident Replay
1. Generate SVG certificate badge upon clearing all waves with HMAC signature.
2. Add public verification route on web platform (`/verify/:proof_id`).
3. Add tournament replay timeline viewer for auditorium projector display.

---
*Maintained by CloudArena Core Team • Built for Google Developer Groups & Cloud Communities Worldwide.*
