# 🚀 PROJECT: CloudArena — Basic MVP

> **Building a basic working prototype of "CloudArena: AI-Powered Cloud Infrastructure Survival Arena" (MVP / Proof-of-Concept).**

> ⚠️ **IMPORTANT:** This is ONLY the basic MVP. Do NOT try to build a production-ready platform, unnecessary microservices, complex frontend architectures, Kubernetes operators, cloud infrastructure, payment systems, or advanced ML. The goal is simply to make the core idea work end-to-end.

---

## 1. Core Idea

CloudArena is a small competitive DevOps/Kubernetes game where each participant runs their own isolated Kubernetes environment on their laptop. 

* **The Loop:** The participant gets a sample application running inside the cluster. CloudArena introduces controlled infrastructure problems (**"attack waves"**), and the participant must investigate using Kubernetes telemetry and fix them. CloudArena detects the resolution and awards points.

```text
Laptop → Docker → Local Kubernetes cluster → Sample application → Controlled failure → Telemetry / detection → Participant fixes problem → Recovery detected → Score
```

---

## 2. Important Architecture

* Use the participant's laptop for the actual workload to avoid provisioning cloud VMs for every single participant.
* The central server, if used, should only coordinate lightweight metadata:
  * Participant
  * Event
  * Current challenge
  * Score
  * Leaderboard
* Local stack runs: **Docker**, **lightweight Kubernetes**, **sample application**, **attack simulation**, **telemetry**, and a **local AI mentor**.
* For the first MVP, the central server can be optional. The project must demonstrate the core game on a **single laptop**.

---

## 3. Local Kubernetes

* **Tooling:** Use `k3d` (preferred for easy setup) or `kind`.
* **Topology:** Create a lightweight multi-node cluster suitable for a normal college laptop with 16 GB RAM (e.g., *1 control-plane and 2 worker nodes*). Avoid heavy VM-based setups.
* **CLI Lifecycle:**
  * `cloudarena start`: Checks Docker, creates cluster, deploys sample app, starts telemetry, and prepares the game.
  * `cloudarena reset`: Resets the challenge environment.
  * `cloudarena destroy`: Completely removes the CloudArena environment.

---

## 4. Sample Application

Deploy a simple, observable application inside Kubernetes:
* **Architecture:** Load Generator $ightarrow$ API $ightarrow$ Worker *(or Load Generator $ightarrow$ Frontend $ightarrow$ API $ightarrow$ Database/Redis)*.
* **Purpose:** Generate enough activity to visibly display unhealthy CPU, memory, traffic, pod status, and latency during attacks.

---

## 5. Attack Waves & Security Model

Implement 3 to 4 initial attack types:
1. **CPU pressure** (controlled CPU-intensive workload)
2. **Memory pressure** (controlled memory-consuming workload)
3. **Pod failure** (delete/restart a predefined application pod)
4. **Traffic spike** (controlled requests against the sample application)

> 🔒 **CRITICAL SECURITY REQUIREMENT:** NEVER execute arbitrary commands on the participant's host OS. The attack engine must never accept arbitrary shell commands from the server or user; all attacks must be predefined, allowlisted, and strictly contained inside the CloudArena Kubernetes sandbox.

---

## 6. Telemetry & Incident Detection

* **Telemetry:** Use Prometheus to collect basic metrics (CPU usage, memory usage, pod status, restarts, request rate, latency, node health).
* **Detection:** Avoid complex ML initially. Use simple threshold-based rules to map the state:
  $$	ext{NORMAL} \longrightarrow 	ext{ATTACK} \longrightarrow 	ext{UNHEALTHY} \longrightarrow 	ext{PARTICIPANT FIX} \longrightarrow 	ext{HEALTHY}$$

---

## 7. Basic ML Component (Optional Add-on)

* Use lightweight telemetry data (CPU, memory, latency, request rate, restarts).
* Train/use a simple anomaly detector like **Isolation Forest** (read-only and advisory).
* *Rule:* Implement as a separate module only if it does not risk breaking the core MVP.

---

## 8. Local AI Mentor

* **Role:** A small local AI mentor that provides progressive hints without controlling Kubernetes or executing commands.
* **Input Structure:** Structured metadata (e.g., incident type, node name, CPU usage, pod restarts, wave number).
* **Progressive Hints Example:**
  * *Hint 1:* "Something is wrong with the compute resources."
  * *Hint 2:* "A worker node is experiencing unusually high CPU usage."
  * *Hint 3:* "Inspect the workloads consuming CPU on that node."
* **Fallback:** Use a lightweight rule-based fallback if a small local model (200–300 MB) is unavailable. The system must work even if the AI is offline.

---

## 9. Game Mechanics & Scoring

* **Waves:** Progress through 3–4 waves (CPU, Memory, Pod Failure, Traffic).
* **Scoring Rules:**
  * Survive wave: `+100`
  * Resolve incident: `+100`
  * Fast recovery: `Bonus points`
  * Use AI hint: `-10`
  * Failure: `0 points`
* **Data Tracked:** Participant, wave, attack type, start time, recovery time, hints used, and score.

---

## 10. Basic CLI & Backend

### **CLI Commands**
* `cloudarena setup` — Checks Docker, dependencies, and resources.
* `cloudarena start` — Creates the environment.
* `cloudarena status` — Shows cluster health, nodes, pods, current wave, and score.
* `cloudarena hint` — Fetches an AI/rule-based hint.
* `cloudarena reset` — Resets the environment.
* `cloudarena destroy` — Tears down the environment.

### **FastAPI Backend & SQLite**
* Avoid heavy databases/queues. Provide minimal endpoints:
  * `POST /event/join`
  * `GET /event/status`
  * `GET /challenge/current`
  * `POST /score`
  * `GET /leaderboard`

---

## 11. Offline/Network Resilience & Security

* **Offline-First:** College Wi-Fi can be unreliable. The local agent must run clusters, execute attacks, collect telemetry, and calculate local scores independently. Synchronization happens when the network allows.
* **Security Isolation:** Workloads and attacks remain strictly restricted to the sandbox cluster. No arbitrary shell command execution.

---

## 12. Recommended Project Structure

```text
cloudarena/
├── agent/
│   ├── cli/
│   ├── cluster/
│   ├── telemetry/
│   └── mentor/
├── attacks/
│   ├── cpu/
│   ├── memory/
│   ├── pod_failure/
│   └── traffic/
├── detection/
├── ml/
├── backend/
│   ├── api/
│   ├── scoring/
│   └── database/
├── dashboard/
├── kubernetes/
│   ├── cluster/
│   └── workloads/
├── challenges/
├── docker-compose.yml
├── README.md
└── install.sh
```

---

## 13. Development Order

1. **Phase 1-4:** Docker + k3d/kind setup, 3-node cluster, sample app deployment, and CLI (`start`, `status`, `destroy`).
2. **Phase 5-9:** Implement CPU attack $ightarrow$ unhealthy detection $ightarrow$ manual fix $ightarrow$ recovery detection $ightarrow$ scoring. *(Core MVP completed here!)*
3. **Phase 10-17:** Add Memory attack, Pod failure, Traffic spike, Prometheus telemetry, AI mentor, ML anomaly detector, FastAPI leaderboard, and basic dashboard.

---

## 14. What NOT to Build Now

* ❌ Production-grade auth or payment systems
* ❌ Cloud VM provisioning for every participant
* ❌ Complex microservices, operators, or distributed databases
* ❌ Advanced reinforcement learning, custom LLM training, or RAG
* ❌ Highly polished frontends or enterprise security features

---

## 15. Future Extensions (Post-MVP)

* Advanced chaos engineering, adaptive difficulty, fine-tuned LoRA models, RAG knowledge base, cloud-hosted multiplayer tournaments, and expanded challenges (Terraform, Docker, Networking, SRE).

---

## ✅ Final Success Criteria Checklist

The MVP is complete when:
* [ ] Local Kubernetes cluster can be created automatically
* [ ] Sample application runs successfully
* [ ] At least one controlled attack works and is isolated inside the sandbox
* [ ] Telemetry/health accurately detects the problem
* [ ] Participant can fix the issue, and recovery is automatically detected
* [ ] Score is calculated properly
* [ ] At least 3 attack types work end-to-end
* [ ] Basic AI mentor/hint system functions
* [ ] Basic leaderboard displays results
* [ ] Environment can be easily reset and destroyed
