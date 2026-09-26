# 🌩️ CloudArena: Platform Summary

> **CloudArena** is a zero-cost, gamified educational platform where participants learn Kubernetes troubleshooting by surviving automated infrastructure attacks in a safe, locally sandboxed environment.

---

### ⚙️ Core Mechanics
* **Standardized Battlefield:** Every player starts with an identical local cluster setup (e.g., *3 nodes, 5 services, preset resources*).
* **Escalating Waves:** The system automatically injects progressive infrastructure threats—CPU spikes, mass pod failures, network degradation, and 10x traffic surges.
* **Dynamic Scoring:** A live leaderboard ranks players based on wave survival, recovery speed, and efficiency, with point penalties for utilizing hints.

### 🧠 The Learning Engine
* **AI Incident Mentor:** Players don't need to be Kubernetes experts. A local AI reads cluster telemetry and offers contextual guidance to help players find bottlenecks without giving away the direct answer.

### 💻 Frictionless User Experience
The entire lifecycle runs safely inside a Docker sandbox via a dead-simple CLI:

```bash
cloudarena setup       # Prepares the local environment
cloudarena join [ID]   # Connects to the specific event
cloudarena start       # Initiates the attack waves
cloudarena destroy     # Safely wipes the entire environment clean
```

### 🛠️ Organizer Tools
* **Event Designer:** Hosts use a no-code dashboard to easily configure custom scenarios. They can define match duration, difficulty levels, hint limits, and toggle specific attack vectors (CPU, Memory, Network, etc.) without writing a single line of code.
