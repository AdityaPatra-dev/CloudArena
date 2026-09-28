# 🌩️ CloudArena: Master Incident Response Playbook & Wave Solutions Guide

Welcome to the definitive **CloudArena Engineering Playbook and Solutions Manual**. This guide provides an exhaustive, line-by-line architectural breakdown of every challenge wave in CloudArena, including the exact root cause, chaos injection mechanism, telemetry symptoms, step-by-step diagnostic workflows, and instant remediation commands for both Linux/macOS and Windows.

---

## 📑 Table of Contents
1. [CloudArena Engine Architecture & Scoring Mechanics](#1-cloudarena-engine-architecture--scoring-mechanics)
2. [Master Waves Overview & Incident Matrix](#2-master-waves-overview--incident-matrix)
3. [Wave 1: Rogue CPU Hog (Compute Starvation)](#wave-1-rogue-cpu-hog)
4. [Wave 2: Memory Exhaustion (OOMKilled)](#wave-2-memory-exhaustion-oomkilled)
5. [Wave 3: Broken Health Probe (Liveness Restart Loop)](#wave-3-broken-health-probe)
6. [Wave 4: Traffic Surge & Under-Provisioning](#wave-4-traffic-surge--under-provisioning)
7. [Wave 5: CoreDNS Resolution Blackout (Internal DNS Failure)](#wave-5-coredns-resolution-blackout)
8. [Wave 6: Storage Deadlock & ReadOnly Mount (Persistence Lock)](#wave-6-storage-deadlock--readonly-mount)
9. [Wave 7: RBAC Authorization Denial (Missing RoleBinding)](#wave-7-rbac-authorization-denial)
10. [Wave 8: Corrupted Ingress TLS Handshake (Secret Corruption)](#wave-8-corrupted-ingress-tls-handshake)
11. [Custom Wave Scenario Plugin Architecture](#11-custom-wave-scenario-plugin-architecture)
12. [Master Cheat Sheet & Speed-Run Reference](#12-master-cheat-sheet--speed-run-reference)

---

## 1. CloudArena Engine Architecture & Scoring Mechanics

CloudArena runs as an isolated, sandboxed Kubernetes environment using local `k3d` clusters. When a wave begins, the game engine:
1. **Attestation Nonce Injection:** Generates a cryptographic SHA-256 HMAC nonce derived from your unique player arena token, the wave number, and cluster timestamp, embedding it into cluster ConfigMaps to prevent score spoofing.
2. **Chaos Mutation:** Injects targeted operational failures directly through the Kubernetes API (`core/v1`, `apps/v1`, `networking/v1`, `rbac/v1`).
3. **Telemetry & Radar:** The background flight recorder samples cluster state every 2 seconds, tracking MTTD (Mean Time to Detect) and MTTR (Mean Time to Resolve).
4. **Resolution Validation:** `is_resolved()` performs deep structural and functional audits against the Kubernetes API. Once the issue is resolved and all pods are healthy and ready, the engine marks the wave cleared and generates a tamper-proof proof certificate.

### Scoring Model Formula
$$\text{Score} = \text{Base Points} + \max(0, \text{Speed Bonus} - \text{Elapsed Seconds}) - \text{Hint Penalties}$$
- **Tier 1 Hint (Orientation):** $-10\text{ pts}$
- **Tier 2 Hint (Diagnostic):** $-25\text{ pts}$
- **Tier 3 Hint (Direct Tactical Clue):** $-50\text{ pts}$

---

## 2. Master Waves Overview & Incident Matrix

| Wave # | Incident Title | Difficulty | Target Namespace | Target Resource | Root Cause | Max Pts |
| :---: | :--- | :---: | :---: | :---: | :--- | :---: |
| **1** | **Rogue CPU Hog** | Beginner | `cloudarena-system` | Pod: `rogue-crypto-miner` | Unconstrained CPU spin-loop starving worker nodes | 100 |
| **2** | **Memory OOMKilled** | Intermediate | `cloudarena-app` | Deployment: `backend-api` | Container memory limits throttled below Python runtime threshold (24Mi) | 150 |
| **3** | **Broken Health Probe** | Intermediate | `cloudarena-app` | Deployment: `backend-api` | Typo in liveness probe HTTP path (`/healhtz` vs `/healthz`) | 200 |
| **4** | **Traffic Surge** | Advanced | `cloudarena-app` | Deployment: `backend-api` | 10x traffic spike with backend throttled to a single replica | 250 |
| **5** | **CoreDNS Blackout** | Advanced | `cloudarena-app` | Deployment: `frontend` | `dnsPolicy: None` pointing to blackhole IP `192.0.2.53` | 300 |
| **6** | **Storage Deadlock** | Nightmare | `cloudarena-app` | Deployment: `backend-api` | Volume mount on `/data` marked with `readOnly: true` | 350 |
| **7** | **RBAC Auth Denial** | Master | `cloudarena-app` | RoleBinding: `telemetry-reader-binding` | Revoked RoleBinding blocking ServiceAccount from listing pods (HTTP 403) | 400 |
| **8** | **Corrupted TLS Ingress**| Boss | `cloudarena-app` | Secret: `cloudarena-tls-secret` | Ingress TLS secret replaced with corrupted, invalid PEM strings | 500 |

---

## Wave 1: Rogue CPU Hog

### 1. Incident Profile
- **Title:** Wave 1: Rogue CPU Hog
- **Difficulty:** Beginner
- **Category:** Compute Resource Starvation
- **Target:** Namespace `cloudarena-system` → Pod `rogue-crypto-miner`

### 2. Scenario & Background
A background security audit flags extreme node compute exhaustion. Application latency spikes across all services, and Kubernetes metrics show worker node CPU saturation exceeding 95%.

### 3. Chaos Injection Mechanism
The engine deploys an unconstrained rogue pod into `cloudarena-system`:
```python
pod_manifest = client.V1Pod(
    metadata=client.V1ObjectMeta(
        name="rogue-crypto-miner",
        namespace="cloudarena-system",
        labels={"app.kubernetes.io/name": "rogue-miner", "cloudarena.io/incident": "wave1"},
    ),
    spec=client.V1PodSpec(
        restart_policy="Never",
        containers=[
            client.V1Container(
                name="miner",
                image="busybox:1.36",
                command=["sh", "-c", "while true; do :; done"],
                resources=client.V1ResourceRequirements(
                    requests={"cpu": "200m"} # No limits set!
                ),
            )
        ],
    ),
)
```

### 4. Symptoms & Diagnostics
1. **Check cluster-wide pod status:**
   ```bash
   cloudarena kubectl get pods -A
   ```
   *Output shows a suspicious pod running in `cloudarena-system`:*
   ```text
   NAMESPACE           NAME                                  READY   STATUS    RESTARTS   AGE
   cloudarena-app      backend-api-79b8f-x4k2                1/1     Running   0          5m
   cloudarena-system   rogue-crypto-miner                    1/1     Running   0          45s
   ```
2. **Inspect compute consumption:**
   ```bash
   cloudarena kubectl top pods -A
   ```
   *The rogue miner is consuming 100% of an available CPU core.*

### 5. Step-by-Step Remediation
Delete the rogue workload from the system namespace:
```bash
cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system
```
*(Windows PowerShell)*:
```powershell
cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system
```

### 6. Programmatic Verification Logic
The engine checks:
1. `core_v1.read_namespaced_pod("rogue-crypto-miner", "cloudarena-system")` returns HTTP 404 (deleted).
2. All `backend-api` pods in `cloudarena-app` are in `Running` phase with `ready: True`.

### 7. Progressive Hints
- **Tier 1 (10 pts):** Node CPU is saturating. Check `cloudarena kubectl top nodes`.
- **Tier 2 (25 pts):** The culprit is not in `cloudarena-app`. Inspect `cloudarena-system` via `cloudarena kubectl get pods -n cloudarena-system`.
- **Tier 3 (50 pts):** Delete the rogue pod: `cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system`.

---

## Wave 2: Memory Exhaustion (OOMKilled)

### 1. Incident Profile
- **Title:** Wave 2: Memory Exhaustion (OOMKilled)
- **Difficulty:** Intermediate
- **Category:** Cgroup Constraints & Kernel OOM
- **Target:** Namespace `cloudarena-app` → Deployment `backend-api`

### 2. Scenario & Background
The backend application has crashed and entered an infinite restart cycle (`CrashLoopBackOff`). Internal telemetry monitors show exit code 137, signifying kernel SIGKILL terminations.

### 3. Chaos Injection Mechanism
The engine patches the `backend-api` deployment with an artificially restricted memory limit of `24Mi` (the Python FastAPI runtime requires $\ge 35\text{MB}$ during startup):
```python
patch_body = {
    "spec": {
        "template": {
            "spec": {
                "containers": [
                    {
                        "name": "api",
                        "resources": {
                            "requests": {"memory": "16Mi", "cpu": "50m"},
                            "limits": {"memory": "24Mi", "cpu": "200m"},
                        },
                    }
                ]
            }
        }
    }
}
```

### 4. Symptoms & Diagnostics
1. **Check pod status in application namespace:**
   ```bash
   cloudarena kubectl get pods -n cloudarena-app
   ```
   *Output shows pod cycling through restarts:*
   ```text
   NAME                           READY   STATUS             RESTARTS      AGE
   backend-api-5c7d8f997c-9b8r1   0/1     CrashLoopBackOff   4 (45s ago)   2m
   ```
2. **Inspect pod termination status:**
   ```bash
   cloudarena kubectl describe pod -n cloudarena-app -l app.kubernetes.io/name=backend-api
   ```
   *Look for `Last State` in the container specification:*
   ```text
   Last State:     Terminated
     Reason:       OOMKilled
     Exit Code:    137
   ```

### 5. Step-by-Step Remediation
Increase the memory limit to `256Mi` (or at least `128Mi`):

**Method A (Fastest 1-Liner):**
```bash
cloudarena kubectl set resources deployment backend-api --limits=memory=256Mi -n cloudarena-app
```

**Method B (YAML Patch):**
```bash
cloudarena kubectl patch deployment backend-api -n cloudarena-app --type='strategic' -p='{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"memory":"256Mi"}}}]}}}}'
```

### 6. Programmatic Verification Logic
The engine checks:
1. `backend-api` container memory limit string parsed into bytes is $\ge 100\text{ MiB}$ ($104,857,600\text{ bytes}$).
2. Pod phase is `Running`.
3. All container statuses report `ready: True` and no pending OOM status.

### 7. Progressive Hints
- **Tier 1 (10 pts):** Pods are crashing upon boot. Run `cloudarena kubectl get pods -n cloudarena-app`.
- **Tier 2 (25 pts):** Pod exit code is 137 (OOMKilled). Run `cloudarena kubectl describe pod -n cloudarena-app -l app.kubernetes.io/name=backend-api`.
- **Tier 3 (50 pts):** Scale memory limits: `cloudarena kubectl set resources deployment backend-api --limits=memory=256Mi -n cloudarena-app`.

---

## Wave 3: Broken Health Probe

### 1. Incident Profile
- **Title:** Wave 3: Broken Health Probe
- **Difficulty:** Intermediate
- **Category:** Kubelet Probing & Lifecycle Management
- **Target:** Namespace `cloudarena-app` → Deployment `backend-api`

### 2. Scenario & Background
The backend application starts up successfully, serves traffic for approximately 30 seconds, and is then abruptly terminated by the kubelet. Service endpoints periodically disappear.

### 3. Chaos Injection Mechanism
The engine injects a subtle typo into the HTTP liveness probe endpoint path (`/healhtz` instead of `/healthz`):
```python
patch_body = {
    "spec": {
        "template": {
            "spec": {
                "containers": [
                    {
                        "name": "api",
                        "livenessProbe": {
                            "httpGet": {
                                "path": "/healhtz",  # Subtle typo
                                "port": 8080,
                            },
                            "initialDelaySeconds": 3,
                            "periodSeconds": 5,
                        },
                    }
                ]
            }
        }
    }
}
```

### 4. Symptoms & Diagnostics
1. **Check cluster events in the application namespace:**
   ```bash
   cloudarena kubectl get events -n cloudarena-app --sort-by='.metadata.creationTimestamp'
   ```
   *Notice repeated warning events from the kubelet:*
   ```text
   LAST SEEN   TYPE      REASON      OBJECT           MESSAGE
   20s         Warning   Unhealthy   pod/backend...   Liveness probe failed: HTTP probe failed with statuscode: 404
   15s         Normal    Killing     pod/backend...   Container api failed liveness probe, will be restarted
   ```
2. **Inspect the deployment probe definition:**
   ```bash
   cloudarena kubectl get deployment backend-api -n cloudarena-app -o yaml | grep -A 8 livenessProbe
   ```
   *Observe the invalid path `/healhtz`.*

### 5. Step-by-Step Remediation
Correct the liveness probe path back to `/healthz`:

**Method A (JSON Patch 1-Liner):**
```bash
cloudarena kubectl patch deployment backend-api -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/httpGet/path", "value": "/healthz"}]'
```

**Method B (Interactive Edit):**
```bash
cloudarena kubectl edit deployment backend-api -n cloudarena-app
# Locate livenessProbe -> httpGet -> path and change /healhtz to /healthz
```

### 6. Programmatic Verification Logic
The engine checks:
1. `livenessProbe.http_get.path == "/healthz"`.
2. Pods are in `Running` phase and containers have passed readiness probes.

### 7. Progressive Hints
- **Tier 1 (10 pts):** Pod restarts every 30s. Inspect events: `cloudarena kubectl get events -n cloudarena-app`.
- **Tier 2 (25 pts):** Kubelet logs HTTP 404 client errors on the probe. Run `cloudarena kubectl describe deployment backend-api -n cloudarena-app`.
- **Tier 3 (50 pts):** Fix the path typo `/healhtz` to `/healthz`: `cloudarena kubectl edit deployment backend-api -n cloudarena-app`.

---

## Wave 4: Traffic Surge & Under-Provisioning

### 1. Incident Profile
- **Title:** Wave 4: Traffic Surge & Under-Provisioning
- **Difficulty:** Advanced
- **Category:** Horizontal Scalability & Capacity Planning
- **Target:** Namespace `cloudarena-app` (`backend-api`) & `cloudarena-system` (`traffic-gen`)

### 2. Scenario & Background
A sudden 10x traffic spike hits the system. Synthetic load generators report that over 40% of connections are timing out, and application API latency exceeds 5,000ms.

### 3. Chaos Injection Mechanism
The engine throttles the backend API to a single replica while scaling the traffic generator to 5 concurrent load instances:
```python
apps_v1.patch_namespaced_deployment_scale(
    name="backend-api", namespace="cloudarena-app", body={"spec": {"replicas": 1}}
)
apps_v1.patch_namespaced_deployment_scale(
    name="traffic-gen", namespace="cloudarena-system", body={"spec": {"replicas": 5}}
)
```

### 4. Symptoms & Diagnostics
1. **Check synthetic traffic generator logs:**
   ```bash
   cloudarena kubectl logs -n cloudarena-system -l app.kubernetes.io/name=traffic-gen --tail=20
   ```
   *Output shows connection timeouts:*
   ```text
   [traffic-gen] WARN: Request to http://backend-api.cloudarena-app:8080/api/v1/health timed out after 2000ms
   [traffic-gen] ERROR: HTTP 504 Gateway Timeout (Error Rate: 42.8%)
   ```
2. **Check deployment replicas:**
   ```bash
   cloudarena kubectl get deployment backend-api -n cloudarena-app
   ```
   *Only 1 replica is active.*

### 5. Step-by-Step Remediation
Scale out the `backend-api` deployment horizontally to at least 3 replicas:

**Method A (Direct Scale Command):**
```bash
cloudarena kubectl scale deployment backend-api --replicas=3 -n cloudarena-app
```

**Method B (Horizontal Pod Autoscaler - Advanced SRE Method):**
```bash
cloudarena kubectl autoscale deployment backend-api --min=3 --max=10 --cpu-percent=70 -n cloudarena-app
```

### 6. Programmatic Verification Logic
The engine checks:
1. `backend-api` deployment `spec.replicas >= 3`.
2. `status.ready_replicas >= 3`.
3. All 3 pod replicas are in `Running` phase with passing readiness probes.

### 7. Progressive Hints
- **Tier 1 (10 pts):** High request drop rates. Inspect logs: `cloudarena kubectl logs -n cloudarena-system -l app.kubernetes.io/name=traffic-gen`.
- **Tier 2 (25 pts):** Only 1 pod replica is handling all load. Inspect `cloudarena kubectl get deployment backend-api -n cloudarena-app`.
- **Tier 3 (50 pts):** Scale backend deployment to at least 3 replicas: `cloudarena kubectl scale deployment backend-api --replicas=3 -n cloudarena-app`.

---

## Wave 5: CoreDNS Resolution Blackout

### 1. Incident Profile
- **Title:** Wave 5: CoreDNS Resolution Blackout
- **Difficulty:** Advanced
- **Category:** Cluster DNS & In-Cluster Service Discovery
- **Target:** Namespace `cloudarena-app` → Deployment `frontend`

### 2. Scenario & Background
The frontend web application can no longer communicate with the backend API. Users navigating to the public web interface receive HTTP 502/504 Bad Gateway errors.

### 3. Chaos Injection Mechanism
The engine overrides the standard Kubernetes DNS policy on the frontend deployment, forcing it to use a blackholed dummy IP (`192.0.2.53` from RFC 5737 TEST-NET-2) instead of the in-cluster CoreDNS service (`10.43.0.10`):
```python
patch_body = {
    "spec": {
        "template": {
            "spec": {
                "dnsPolicy": "None",
                "dnsConfig": {
                    "nameservers": ["192.0.2.53"],
                    "searches": ["blackhole.invalid.svc.cluster.local"],
                },
            }
        }
    }
}
```

### 4. Symptoms & Diagnostics
1. **Check frontend application logs:**
   ```bash
   cloudarena kubectl logs -n cloudarena-app -l app.kubernetes.io/name=frontend --tail=25
   ```
   *Output shows network I/O DNS timeouts:*
   ```text
   [error] dial tcp: lookup backend-api on 192.0.2.53:53: i/o timeout
   [error] [client 10.42.0.1] connect() failed (110: Connection timed out) while connecting to upstream
   ```
2. **Inspect the frontend pod's DNS policy:**
   ```bash
   cloudarena kubectl get deployment frontend -n cloudarena-app -o yaml | grep -A 5 dnsPolicy
   ```
   *Notice `dnsPolicy: None` and the blackhole nameserver.*

### 5. Step-by-Step Remediation
Restore `dnsPolicy: ClusterFirst` and remove the custom `dnsConfig`:

**Method A (JSON Patch 1-Liner):**
```bash
cloudarena kubectl patch deployment frontend -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/dnsPolicy", "value": "ClusterFirst"}, {"op": "remove", "path": "/spec/template/spec/dnsConfig"}]'
```

**Method B (YAML Strategic Merge Patch):**
```bash
cloudarena kubectl patch deployment frontend -n cloudarena-app --patch '{"spec":{"template":{"spec":{"dnsPolicy":"ClusterFirst","dnsConfig":null}}}}'
```

### 6. Programmatic Verification Logic
The engine checks:
1. `spec.dns_policy != "None"`.
2. The blackhole IP `192.0.2.53` is completely absent from `nameservers`.
3. Frontend pods have completed rollout, with all pods `Running` and `Ready`.

### 7. Progressive Hints
- **Tier 1 (10 pts):** Inter-service DNS calls failing. Inspect logs: `cloudarena kubectl logs -n cloudarena-app -l app.kubernetes.io/name=frontend`.
- **Tier 2 (25 pts):** Inspect `dnsPolicy` in deployment spec: `cloudarena kubectl get deployment frontend -n cloudarena-app -o yaml`.
- **Tier 3 (50 pts):** Restore `dnsPolicy: ClusterFirst`: `cloudarena kubectl patch deployment frontend -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/dnsPolicy", "value": "ClusterFirst"}, {"op": "remove", "path": "/spec/template/spec/dnsConfig"}]'`.

---

## Wave 6: Storage Deadlock & ReadOnly Mount

### 1. Incident Profile
- **Title:** Wave 6: Storage Deadlock & ReadOnly Mount
- **Difficulty:** Nightmare
- **Category:** Persistent Storage & POSIX Filesystem Locks
- **Target:** Namespace `cloudarena-app` → Deployment `backend-api`

### 2. Scenario & Background
All stateful transactions fail with HTTP 500 errors. Application logs indicate that database file writes and log updates cannot be committed due to an OS-level filesystem protection lock.

### 3. Chaos Injection Mechanism
The engine injects a read-only volume mount for `/data` inside the `backend-api` container:
```python
patch_body = {
    "spec": {
        "template": {
            "spec": {
                "containers": [
                    {
                        "name": "api",
                        "volumeMounts": [
                            {
                                "name": "storage-cache-vol",
                                "mountPath": "/data",
                                "readOnly": True, # Restrictive read-only flag
                            }
                        ],
                    }
                ],
                "volumes": [{"name": "storage-cache-vol", "emptyDir": {}}],
            }
        }
    }
}
```

### 4. Symptoms & Diagnostics
1. **Check backend application logs:**
   ```bash
   cloudarena kubectl logs -n cloudarena-app -l app.kubernetes.io/name=backend-api --tail=25
   ```
   *Output shows POSIX errno 30 errors:*
   ```text
   OSError: [Errno 30] Read-only file system: '/data/app.log'
   sqlite3.OperationalError: attempt to write a readonly database
   ```
2. **Inspect volume mounts in the deployment:**
   ```bash
   cloudarena kubectl describe deployment backend-api -n cloudarena-app | grep -A 5 Mounts
   ```
   *Notice `/data` is mounted with `(ro)` instead of `(rw)`.*

### 5. Step-by-Step Remediation
Toggle the mount permissions to `readOnly: false` (or remove the restriction):

**Method A (JSON Patch 1-Liner):**
```bash
cloudarena kubectl patch deployment backend-api -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/volumeMounts/0/readOnly", "value": false}]'
```

**Method B (Interactive Edit):**
```bash
cloudarena kubectl edit deployment backend-api -n cloudarena-app
# Under containers -> volumeMounts -> find /data and change readOnly: true to readOnly: false
```

### 6. Programmatic Verification Logic
The engine checks:
1. `volumeMounts` for `/data` has `read_only == False`.
2. All backend pods have reconciled to `Running` and passed readiness checks.

### 7. Progressive Hints
- **Tier 1 (10 pts):** Disk writes failing. Run `cloudarena kubectl logs -n cloudarena-app -l app.kubernetes.io/name=backend-api`.
- **Tier 2 (25 pts):** Look for `readOnly: true` in volumeMounts: `cloudarena kubectl describe deployment backend-api -n cloudarena-app`.
- **Tier 3 (50 pts):** Update the mount to writable: `cloudarena kubectl patch deployment backend-api -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/volumeMounts/0/readOnly", "value": false}]'`.

---

## Wave 7: RBAC Authorization Denial

### 1. Incident Profile
- **Title:** Wave 7: RBAC Authorization Denial
- **Difficulty:** Master
- **Category:** Kubernetes API Security & Role-Based Access Control
- **Target:** Namespace `cloudarena-app` & `cloudarena-system`

### 2. Scenario & Background
Automated telemetry monitoring, health checks, and service discovery agents have failed. Agents attempting to poll pod health report HTTP 403 Forbidden errors when contacting the Kubernetes API server.

### 3. Chaos Injection Mechanism
The engine revokes the RoleBinding `telemetry-reader-binding` in `cloudarena-app`, severing permissions for ServiceAccount `telemetry-collector` in `cloudarena-system`:
```python
rbac_v1.delete_namespaced_role_binding(
    name="telemetry-reader-binding",
    namespace="cloudarena-app",
)
```

### 4. Symptoms & Diagnostics
1. **Check probe agent logs:**
   ```bash
   cloudarena kubectl logs -n cloudarena-system -l app=telemetry-probe
   ```
   *Output shows explicit RBAC denial from the API server:*
   ```text
   HTTP/1.1 403 Forbidden
   {
     "kind": "Status",
     "status": "Failure",
     "message": "pods is forbidden: User \"system:serviceaccount:cloudarena-system:telemetry-collector\" cannot list resource \"pods\" in API group \"\" in the namespace \"cloudarena-app\"",
     "reason": "Forbidden",
     "code": 403
   }
   ```
2. **Verify missing role bindings in the application namespace:**
   ```bash
   cloudarena kubectl get rolebindings -n cloudarena-app
   ```
   *No binding exists for `telemetry-collector`.*

### 5. Step-by-Step Remediation
Create the missing RoleBinding granting `view` permissions to the ServiceAccount:

**Method A (Direct 1-Liner):**
```bash
cloudarena kubectl create rolebinding telemetry-reader-binding --clusterrole=view --serviceaccount=cloudarena-system:telemetry-collector -n cloudarena-app
```

**Method B (Declarative YAML):**
```bash
cat <<EOF | cloudarena kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: telemetry-reader-binding
  namespace: cloudarena-app
subjects:
- kind: ServiceAccount
  name: telemetry-collector
  namespace: cloudarena-system
roleRef:
  kind: ClusterRole
  name: view
  apiGroup: rbac.authorization.k8s.io
EOF
```

### 6. Programmatic Verification Logic
The engine checks:
1. `rbac_v1.list_namespaced_role_binding("cloudarena-app")` contains a binding whose subject matches `ServiceAccount: telemetry-collector` from namespace `cloudarena-system`.
2. The `role_ref` references a valid reading role (`view`, `edit`, `admin`, or `cluster-admin`).

### 7. Progressive Hints
- **Tier 1 (10 pts):** Kubernetes API authorization failures. Run `cloudarena kubectl logs -n cloudarena-system -l app=telemetry-probe`.
- **Tier 2 (25 pts):** ServiceAccount `telemetry-collector` lacks read permissions in `cloudarena-app`. Run `cloudarena kubectl get rolebindings -n cloudarena-app`.
- **Tier 3 (50 pts):** Create the RoleBinding: `cloudarena kubectl create rolebinding telemetry-reader-binding --clusterrole=view --serviceaccount=cloudarena-system:telemetry-collector -n cloudarena-app`.

---

## Wave 8: Corrupted Ingress TLS Handshake

### 1. Incident Profile
- **Title:** Wave 8: Corrupted Ingress TLS Handshake
- **Difficulty:** Boss
- **Category:** Cryptography, Ingress Controllers & Public PKI
- **Target:** Namespace `cloudarena-app` → Secret `cloudarena-tls-secret`

### 2. Scenario & Background
All HTTPS ingress termination fails across the cluster. External web browsers and clients receive `ERR_SSL_PROTOCOL_ERROR` or `SSL_ERROR_RX_RECORD_TOO_LONG`. Ingress controller logs indicate unparseable PEM byte streams.

### 3. Chaos Injection Mechanism
The engine overwrites the secret `cloudarena-tls-secret` with corrupted strings:
```python
corrupted_secret = client.V1Secret(
    metadata=client.V1ObjectMeta(
        name="cloudarena-tls-secret",
        namespace="cloudarena-app",
    ),
    type="kubernetes.io/tls",
    string_data={
        "tls.crt": "CORRUPTED_CERTIFICATE_INVALID_PEM_DATA_BLOCK",
        "tls.key": "CORRUPTED_KEY_INVALID_PRIVATE_KEY",
    },
)
core_v1.replace_namespaced_secret("cloudarena-tls-secret", "cloudarena-app", corrupted_secret)
```

### 4. Symptoms & Diagnostics
1. **Inspect the ingress status:**
   ```bash
   cloudarena kubectl describe ingress arena-ingress -n cloudarena-app
   ```
2. **Inspect the TLS secret:**
   ```bash
   cloudarena kubectl get secret cloudarena-tls-secret -n cloudarena-app -o yaml
   ```
   *Decoding the base64 payload reveals garbage text instead of a valid x509 PEM certificate.*

### 5. Step-by-Step Remediation
Generate a fresh valid RSA private key and self-signed x509 certificate, then update the Kubernetes TLS secret:

**Method A (Linux / macOS 1-Liner):**
```bash
openssl req -x509 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -days 365 -nodes -subj '/CN=cloudarena.local' && \
cloudarena kubectl create secret tls cloudarena-tls-secret --cert=/tmp/tls.crt --key=/tmp/tls.key -n cloudarena-app --dry-run=client -o yaml | cloudarena kubectl apply -f -
```

**Method B (Windows PowerShell):**
```powershell
# In PowerShell:
openssl req -x509 -newkey rsa:2048 -keyout "$env:TEMP\tls.key" -out "$env:TEMP\tls.crt" -days 365 -nodes -subj "/CN=cloudarena.local"
cloudarena kubectl create secret tls cloudarena-tls-secret --cert="$env:TEMP\tls.crt" --key="$env:TEMP\tls.key" -n cloudarena-app --dry-run=client -o yaml | cloudarena kubectl apply -f -
```

### 6. Programmatic Verification Logic
The engine checks:
1. Secret `cloudarena-tls-secret` exists in `cloudarena-app`.
2. Payload contains no `CORRUPTED` markers.
3. `tls.crt` contains valid header `-----BEGIN CERTIFICATE-----`.
4. `tls.key` contains valid private key header `-----BEGIN PRIVATE KEY-----` or `-----BEGIN RSA PRIVATE KEY-----`.

### 7. Progressive Hints
- **Tier 1 (10 pts):** HTTPS ingress failing. Inspect ingress: `cloudarena kubectl describe ingress arena-ingress -n cloudarena-app`.
- **Tier 2 (25 pts):** Ingress secret is corrupted. Inspect `cloudarena kubectl get secret cloudarena-tls-secret -n cloudarena-app -o yaml`.
- **Tier 3 (50 pts):** Re-generate certificate and update secret using `openssl` and `cloudarena kubectl create secret tls cloudarena-tls-secret`.

---

## 11. Custom Wave Scenario Plugin Architecture

CloudArena includes a custom plugin engine allowing community organizers and educators to design custom chaos scenarios using declarative YAML files located in `~/.cloudarena/scenarios/`.

### Example: Authoring a Custom Chaos Scenario (`wave9_configmap_drift.yaml`)
```yaml
name: "Wave 9: Redis Database Configuration Drift"
scenario_id: "redis_config_drift"
difficulty: "Intermediate"
target_namespace: "cloudarena-app"
symptoms: "Backend cannot connect to Redis cache; connection refused on port 6379."
expected_fix: "Patch configmap backend-config to restore REDIS_HOST=cache-redis."
description: "A misconfigured environment variable severed the backend caching pipeline."

mutation:
  kind: "configmap"
  name: "backend-config"
  action: "patch"
  patch:
    data:
      REDIS_HOST: "unreachable-host.invalid"

validation:
  resource: "configmap"
  name: "backend-config"
  field: "data.REDIS_HOST"
  expected_value: "cache-redis"

rollback:
  kind: "configmap"
  name: "backend-config"
  patch:
    data:
      REDIS_HOST: "cache-redis"

hints:
  - "Inspect the backend environment variables via cloudarena kubectl get configmap backend-config -n cloudarena-app -o yaml."
  - "Notice REDIS_HOST is set to an unreachable host."
  - "Run: cloudarena kubectl patch configmap backend-config -n cloudarena-app --type='merge' -p='{\"data\":{\"REDIS_HOST\":\"cache-redis\"}}'."
```

---

## 12. Master Cheat Sheet & Speed-Run Reference

If you are running an incident response speed-run, here is the quick-reference table of one-liners to resolve all 8 waves:

| Wave | Incident | Rapid Remediation Command |
| :---: | :--- | :--- |
| **1** | Rogue CPU Hog | `cloudarena kubectl delete pod rogue-crypto-miner -n cloudarena-system` |
| **2** | Memory OOMKilled | `cloudarena kubectl set resources deployment backend-api --limits=memory=256Mi -n cloudarena-app` |
| **3** | Broken Health Probe | `cloudarena kubectl patch deployment backend-api -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/livenessProbe/httpGet/path", "value": "/healthz"}]'` |
| **4** | Traffic Surge | `cloudarena kubectl scale deployment backend-api --replicas=3 -n cloudarena-app` |
| **5** | CoreDNS Blackout | `cloudarena kubectl patch deployment frontend -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/dnsPolicy", "value": "ClusterFirst"}, {"op": "remove", "path": "/spec/template/spec/dnsConfig"}]'` |
| **6** | Storage Deadlock | `cloudarena kubectl patch deployment backend-api -n cloudarena-app --type='json' -p='[{"op": "replace", "path": "/spec/template/spec/containers/0/volumeMounts/0/readOnly", "value": false}]'` |
| **7** | RBAC Auth Denial | `cloudarena kubectl create rolebinding telemetry-reader-binding --clusterrole=view --serviceaccount=cloudarena-system:telemetry-collector -n cloudarena-app` |
| **8** | Corrupted TLS | `openssl req -x509 -newkey rsa:2048 -keyout /tmp/tls.key -out /tmp/tls.crt -days 365 -nodes -subj '/CN=cloudarena.local' && cloudarena kubectl create secret tls cloudarena-tls-secret --cert=/tmp/tls.crt --key=/tmp/tls.key -n cloudarena-app --dry-run=client -o yaml \| cloudarena kubectl apply -f -` |

---
*Maintained by the CloudArena Core Team • Built for Google Developer Groups & Cloud Communities Worldwide.*
