import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Cpu, 
  ShieldAlert, 
  Zap, 
  HelpCircle, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Search,
  Code2,
  RefreshCw,
  Clock,
  Award,
  ChevronRight
} from 'lucide-react';

export default function DocsFieldGuide() {
  const [activeSection, setActiveSection] = useState('quickstart');
  const [copiedText, setCopiedText] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedText(code);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const sections = [
    { id: 'quickstart', label: 'Quickstart & Setup', icon: Terminal },
    { id: 'cheat-sheet', label: 'K8s Triage Cheat Sheet', icon: Code2 },
    { id: 'chaos-guide', label: 'Chaos Incident Patterns', icon: ShieldAlert },
    { id: 'scoring-hints', label: 'Scoring & AI Hints', icon: Award },
    { id: 'exit-uninstall', label: 'Exiting & Clean Teardown', icon: Trash2 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16 md:pb-0">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900/80 to-slate-900/80 border border-sky-500/30 rounded-3xl p-5 sm:p-8 backdrop-blur shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Competitor Field Guide & Documentation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Master the arena: Kubernetes triage commands, chaos troubleshooting, scoring rules, and clean laptop teardown.
          </p>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isActive 
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/30 font-bold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SECTION 1: QUICKSTART ================= */}
      {activeSection === 'quickstart' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-sky-400" />
                  <span>3-Minute Quickstart & Installation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">Everything you need to set up your environment before the tournament starts.</p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full font-bold">
                Zero Cloud Cost
              </span>
            </div>

            {/* Prerequisites */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-sky-400 uppercase font-mono">1. Docker Installed</div>
                <div className="text-xs text-slate-300 mt-1">Docker Desktop or Docker Engine running with at least 4GB RAM allocated.</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-indigo-400 uppercase font-mono">2. Python 3.10+</div>
                <div className="text-xs text-slate-300 mt-1">Python 3.10 or higher with pip. (Linux, macOS, or Windows WSL2).</div>
              </div>
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-emerald-400 uppercase font-mono">3. Arena Token</div>
                <div className="text-xs text-slate-300 mt-1">Sign in with Google on the Competitor Hub to mint your personal token.</div>
              </div>
            </div>

            {/* Step-by-Step Code Instructions */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">1</span>
                    Install CloudArena CLI (Linux & macOS)
                  </span>
                  <button 
                    onClick={() => copyCode("curl -sSL https://gdg-cloudarena.web.app/install.sh | bash")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "curl -sSL https://gdg-cloudarena.web.app/install.sh | bash" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-xs font-mono bg-slate-900 p-3 rounded-xl text-sky-300 overflow-x-auto border border-slate-800">
curl -sSL https://gdg-cloudarena.web.app/install.sh | bash
                </pre>
                <div className="text-[11px] text-slate-500">For Windows PowerShell: <code>irm https://gdg-cloudarena.web.app/install.ps1 | iex</code> or install via pip: <code>pip install git+https://github.com/adityapatra/CloudArena.git</code></div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">2</span>
                    Link your Personal Arena Token
                  </span>
                  <button 
                    onClick={() => copyCode("cloudarena link <YOUR_ARENA_TOKEN> --event HACKATHON_2026")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "cloudarena link <YOUR_ARENA_TOKEN> --event HACKATHON_2026" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-xs font-mono bg-slate-900 p-3 rounded-xl text-sky-300 overflow-x-auto border border-slate-800">
cloudarena link &lt;YOUR_ARENA_TOKEN&gt; --event HACKATHON_2026
                </pre>
                <div className="text-[11px] text-slate-500">Copy your token from the Competitor Hub tab above. Verify anytime with <code>cloudarena whoami</code>.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">3</span>
                    Spin Up the Local Sandboxed 3-Node Cluster
                  </span>
                  <button 
                    onClick={() => copyCode("cloudarena start")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "cloudarena start" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-xs font-mono bg-slate-900 p-3 rounded-xl text-emerald-400 overflow-x-auto border border-slate-800">
cloudarena start
                </pre>
                <div className="text-[11px] text-slate-500">Automatically provisions a lightweight k3d cluster with 1 server and 2 worker nodes, and deploys the base microservices.</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-mono flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center text-[10px]">4</span>
                    Launch Wave 1 Attack
                  </span>
                  <button 
                    onClick={() => copyCode("cloudarena wave start 1")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "cloudarena wave start 1" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="text-xs font-mono bg-slate-900 p-3 rounded-xl text-rose-300 overflow-x-auto border border-slate-800">
cloudarena wave start 1
                </pre>
                <div className="text-[11px] text-slate-500">Injects the outage into your cluster. You now investigate, repair, and verify!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 2: K8S CHEAT SHEET ================= */}
      {activeSection === 'cheat-sheet' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <span>Essential Kubernetes Triage Commands</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                You can run commands directly using <code>cloudarena kubectl ...</code> (which automatically routes to your sandboxed cluster) or standard <code>kubectl</code>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Inspection */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-sky-400 uppercase font-mono flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5" /> 1. Diagnostic & Inspection
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">List all pods and statuses across namespaces:</div>
                    <code className="block bg-slate-900 p-2 rounded text-sky-300 font-mono border border-slate-800">
                      cloudarena kubectl get pods -A
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Deep pod inspection (events, termination reasons, exit codes):</div>
                    <code className="block bg-slate-900 p-2 rounded text-sky-300 font-mono border border-slate-800">
                      cloudarena kubectl describe pod &lt;pod-name&gt;
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Recent cluster events sorted chronologically:</div>
                    <code className="block bg-slate-900 p-2 rounded text-sky-300 font-mono border border-slate-800">
                      cloudarena kubectl get events --sort-by=.metadata.creationTimestamp
                    </code>
                  </div>
                </div>
              </div>

              {/* Logs & Metrics */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-400 uppercase font-mono flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> 2. Live Logs & Resource Telemetry
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Stream live container logs with error filtering:</div>
                    <code className="block bg-slate-900 p-2 rounded text-amber-300 font-mono border border-slate-800">
                      cloudarena kubectl logs -f &lt;pod-name&gt; --tail=50
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Logs from the previous terminated instance (CrashLoop):</div>
                    <code className="block bg-slate-900 p-2 rounded text-amber-300 font-mono border border-slate-800">
                      cloudarena kubectl logs &lt;pod-name&gt; --previous
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Inspect live CPU and Memory utilization per pod:</div>
                    <code className="block bg-slate-900 p-2 rounded text-amber-300 font-mono border border-slate-800">
                      cloudarena kubectl top pods
                    </code>
                  </div>
                </div>
              </div>

              {/* Remediation */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 3. Remediation & Patching
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Update CPU & Memory limits on a running deployment:</div>
                    <code className="block bg-slate-900 p-2 rounded text-emerald-300 font-mono border border-slate-800">
                      cloudarena kubectl set resources deploy order-api --limits=cpu=500m,memory=512Mi --requests=cpu=200m,memory=256Mi
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Scale up replica count to absorb traffic surge:</div>
                    <code className="block bg-slate-900 p-2 rounded text-emerald-300 font-mono border border-slate-800">
                      cloudarena kubectl scale deployment frontend --replicas=3
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Trigger rolling restart after fixing configs:</div>
                    <code className="block bg-slate-900 p-2 rounded text-emerald-300 font-mono border border-slate-800">
                      cloudarena kubectl rollout restart deployment &lt;deploy-name&gt;
                    </code>
                  </div>
                </div>
              </div>

              {/* Live Telemetry Watch */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="text-xs font-bold text-purple-400 uppercase font-mono flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> 4. CloudArena Live Verification
                </div>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Watch live incident resolution and traffic success:</div>
                    <code className="block bg-slate-900 p-2 rounded text-purple-300 font-mono border border-slate-800">
                      cloudarena wave watch
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">Instant resolution check and score commit:</div>
                    <code className="block bg-slate-900 p-2 rounded text-purple-300 font-mono border border-slate-800">
                      cloudarena wave status
                    </code>
                  </div>
                  <div>
                    <div className="text-slate-300 font-semibold mb-1">View AI Incident Post-Mortem and architectural lessons:</div>
                    <code className="block bg-slate-900 p-2 rounded text-purple-300 font-mono border border-slate-800">
                      cloudarena postmortem
                    </code>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 3: CHAOS PATTERNS ================= */}
      {activeSection === 'chaos-guide' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>Chaos Incident Survival Patterns</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Deep dive into the 4 tournament incident archetypes, how they manifest, and how experienced SREs diagnose them.
              </p>
            </div>

            <div className="space-y-4">
              {/* Pattern 1 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-xs font-mono">WAVE 1</span>
                    <span>CPU Starvation & Throttling Outage</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Difficulty: Normal</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> HTTP 504 Gateway Timeouts, synthetic probe success rate plummeting below 50%, high latency.</p>
                  <p><strong>Root Cause:</strong> The target microservice has had its CPU limit slashed to near zero (e.g. <code>20m</code>) or an artificial compute stress loop is starving the runtime.</p>
                  <p><strong>Triage Step:</strong> Run <code>cloudarena kubectl top pods</code> and <code>cloudarena kubectl describe pod</code> to inspect <code>Limits: cpu</code> and throttling events.</p>
                  <p><strong>Fix:</strong> Increase the CPU request and limit to adequate values (e.g., <code>requests: cpu=100m, limits: cpu=500m</code>) via <code>kubectl set resources</code> or edit the deployment.</p>
                </div>
              </div>

              {/* Pattern 2 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono">WAVE 2</span>
                    <span>Memory Leak & OOMKilled Cascade (Exit Code 137)</span>
                  </div>
                  <span className="text-[10px] font-mono text-orange-400 uppercase font-bold">Difficulty: Hard</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> Pod repeatedly enters <code>CrashLoopBackOff</code> with frequent restart counter increments.</p>
                  <p><strong>Root Cause:</strong> Container process exceeds the cgroup memory limit and is abruptly terminated by the Linux kernel Out-Of-Memory killer (SIGKILL / Exit 137).</p>
                  <p><strong>Triage Step:</strong> Run <code>cloudarena kubectl describe pod &lt;pod-name&gt;</code> and look for <code>Last State: Terminated (Reason: OOMKilled, Exit Code: 137)</code>.</p>
                  <p><strong>Fix:</strong> Adjust the memory limit in the container specification to at least <code>512Mi</code> and ensure memory requests are correctly proportioned.</p>
                </div>
              </div>

              {/* Pattern 3 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-sky-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-xs font-mono">WAVE 3</span>
                    <span>Broken Health Probe Deadlock (Liveness & Readiness)</span>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">Difficulty: Nightmare</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> Container starts, appears healthy for ~30 seconds, then gets killed and restarted continuously. Endpoints report 0 healthy backends.</p>
                  <p><strong>Root Cause:</strong> The <code>livenessProbe</code> or <code>readinessProbe</code> is checking the wrong HTTP port (e.g. <code>8081</code> instead of <code>8080</code>) or an invalid URI path.</p>
                  <p><strong>Triage Step:</strong> Check <code>kubectl describe pod</code> events: <code>Unhealthy: Liveness probe failed: HTTP probe failed with statuscode: 404 / Connection Refused</code>.</p>
                  <p><strong>Fix:</strong> Edit the deployment manifest so the probe port and path match the application's true HTTP listening port and endpoint (e.g., <code>/healthz</code> on port <code>8080</code>).</p>
                </div>
              </div>

              {/* Pattern 4 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-purple-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-xs font-mono">WAVE 4</span>
                    <span>Ingress Surge & Traffic Overload</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Difficulty: Boss</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> Intermittent HTTP 503 errors and connection dropping under sudden traffic spikes.</p>
                  <p><strong>Root Cause:</strong> A single replica cannot handle concurrent incoming throughput; service endpoints are saturated.</p>
                  <p><strong>Triage Step:</strong> Check <code>cloudarena wave watch</code> traffic graph and <code>kubectl get endpoints</code>.</p>
                  <p><strong>Fix:</strong> Horizontally scale the deployment to 3+ replicas: <code>cloudarena kubectl scale deployment &lt;deploy-name&gt; --replicas=3</code> and verify load distribution.</p>
                </div>
              </div>

              {/* Pattern 5 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-teal-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-xs font-mono">WAVE 5</span>
                    <span>CoreDNS Resolution Blackout</span>
                  </div>
                  <span className="text-[10px] font-mono text-teal-400 uppercase font-bold">Difficulty: Advanced SRE</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> Frontend throws 502/504 Bad Gateway errors; logs show <code>lookup backend-api on 192.0.2.53:53: i/o timeout</code>; inter-service communication severed.</p>
                  <p><strong>Root Cause:</strong> Injected <code>dnsPolicy: None</code> overriding standard cluster DNS with a blackholed nameserver IP.</p>
                  <p><strong>Triage Step:</strong> Run <code>cloudarena kubectl get deployment frontend -n cloudarena-app -o yaml</code> and inspect the <code>dnsPolicy</code> and <code>dnsConfig</code> section.</p>
                  <p><strong>Fix:</strong> Restore <code>dnsPolicy: ClusterFirst</code> on the frontend deployment and remove the blackhole nameserver configuration.</p>
                </div>
              </div>

              {/* Pattern 6 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-xs font-mono">WAVE 6</span>
                    <span>Persistent Storage Deadlock & ReadOnly Mount</span>
                  </div>
                  <span className="text-[10px] font-mono text-indigo-400 uppercase font-bold">Difficulty: Nightmare SRE</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> Backend throws HTTP 500 on stateful transactions; container logs report <code>IOError: [Errno 30] Read-only file system: '/data'</code> or SQLite write errors.</p>
                  <p><strong>Root Cause:</strong> Persistence mount path <code>/data</code> was mounted with <code>readOnly: true</code> in the container specification.</p>
                  <p><strong>Triage Step:</strong> Check <code>cloudarena kubectl describe deployment backend-api -n cloudarena-app</code> under <code>Mounts:</code>.</p>
                  <p><strong>Fix:</strong> Edit or patch the deployment to set <code>readOnly: false</code> on the volume mount.</p>
                </div>
              </div>

              {/* Pattern 7 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-fuchsia-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 text-xs font-mono">WAVE 7</span>
                    <span>RBAC Authorization Failure & Token Revocation</span>
                  </div>
                  <span className="text-[10px] font-mono text-fuchsia-400 uppercase font-bold">Difficulty: Master SRE</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> Cluster telemetry agents fail to discover pods; logs report HTTP 403 Forbidden: <code>User cannot list resource 'pods' in namespace 'cloudarena-app'</code>.</p>
                  <p><strong>Root Cause:</strong> Missing or deleted <code>RoleBinding</code> connecting the agent's ServiceAccount to the application namespace.</p>
                  <p><strong>Triage Step:</strong> Check agent pod logs in <code>cloudarena-system</code>: <code>cloudarena kubectl logs -n cloudarena-system -l app=telemetry-probe</code>.</p>
                  <p><strong>Fix:</strong> Create the missing RoleBinding: <code>cloudarena kubectl create rolebinding telemetry-reader-binding --clusterrole=view --serviceaccount=cloudarena-system:telemetry-collector -n cloudarena-app</code>.</p>
                </div>
              </div>

              {/* Pattern 8 */}
              <div className="p-5 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-mono">WAVE 8</span>
                    <span>Corrupted Ingress TLS Handshake (Boss Wave)</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Difficulty: Grandmaster SRE</span>
                </div>
                <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p><strong>Symptoms:</strong> External HTTPS connections fail with SSL handshake errors (<code>ERR_SSL_PROTOCOL_ERROR</code>); Ingress reports invalid certificate PEM data.</p>
                  <p><strong>Root Cause:</strong> The Ingress TLS Secret <code>cloudarena-tls-secret</code> contains truncated or corrupted base64 certificate/key payloads.</p>
                  <p><strong>Triage Step:</strong> Check <code>cloudarena kubectl get secret cloudarena-tls-secret -n cloudarena-app -o yaml</code> and decode the certificate payload.</p>
                  <p><strong>Fix:</strong> Generate and apply a valid self-signed TLS certificate and private key matching the ingress host domain.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 4: SCORING & HINTS ================= */}
      {activeSection === 'scoring-hints' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Scoring Rules, Stability Window & AI Hints</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">Understanding how points, decay bonuses, and AI hints affect your final leaderboard ranking.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-emerald-400 font-mono uppercase">1. Continuous 10-Second Stability Window</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Simply restarting a pod is not enough! CloudArena fires automated continuous synthetic traffic probes. Your cluster must maintain at least <strong>90% traffic success rate continuously for 10 full seconds</strong> without regression before the wave is registered as resolved.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-sky-400 font-mono uppercase">2. Speed Bonus & Time Decay</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Each wave carries base points (e.g. 100, 150, 200, 250). If you resolve the incident quickly within the target duration, you earn a <strong>Speed Bonus</strong> up to +50 points. The bonus decays smoothly as time elapses.
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-purple-400 font-mono uppercase">3. Progressive AI Incident Mentor</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  If you are stuck, ask the AI mentor via <code>cloudarena hint</code>. Hints are unlocked progressively:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                    <li><strong className="text-slate-300">Level 1 (10 pts):</strong> Architectural Clue & Diagnostic Vector</li>
                    <li><strong className="text-slate-300">Level 2 (20 pts):</strong> Targeted `kubectl` diagnostic commands</li>
                    <li><strong className="text-slate-300">Level 3 (35 pts):</strong> Exact patch configuration & remediation</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 font-mono uppercase">4. Anti-Cheat HMAC Attestation</div>
                <div className="text-xs text-slate-300 leading-relaxed">
                  Upon verified resolution, the local agent computes an HMAC-SHA256 signature using a one-time cryptographic secret nonce injected directly into the k3d cluster at wave launch. Scores cannot be faked or replayed.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SECTION 5: EXIT & UNINSTALL ================= */}
      {activeSection === 'exit-uninstall' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-6">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-400" />
                <span>Exiting, Stopping Waves & Complete Laptop Teardown</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Clear instructions for students who get stuck on a wave, want to pause/exit, or want to completely wipe CloudArena from their laptops.
              </p>
            </div>

            <div className="space-y-4">
              {/* Option A: Stop Wave */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-bold text-amber-400 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Scenario 1: Stuck on a Wave? Stop or Reset Without Quitting</span>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If an attack wave is too confusing or broken and you just want to cancel the incident and return the cluster to a healthy state:
                </p>
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <code className="text-xs font-mono text-amber-300">cloudarena wave stop</code>
                  <button 
                    onClick={() => copyCode("cloudarena wave stop")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "cloudarena wave stop" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  This rolls back injected faults, resets deployments back to baseline, and unlocks the next command. Alternatively run <code>cloudarena reset</code>.
                </div>
              </div>

              {/* Option B: Free RAM */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-sm font-bold text-sky-400 flex items-center gap-2">
                  <Cpu className="w-4 h-4" />
                  <span>Scenario 2: Free Laptop Memory & CPU (Pause Cluster)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Done for the day and want to reclaim your laptop's RAM and battery? Delete the local Docker cluster. Your token and scores in the cloud are completely preserved!
                </p>
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <code className="text-xs font-mono text-sky-300">cloudarena destroy</code>
                  <button 
                    onClick={() => copyCode("cloudarena destroy")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "cloudarena destroy" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>
                <div className="text-[11px] text-slate-500">
                  You can spin the cluster right back up whenever you are ready using <code>cloudarena start</code>.
                </div>
              </div>

              {/* Option C: Complete Uninstall */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                <div className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Scenario 3: Complete Teardown & Uninstall from Laptop</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  If a student wants to completely remove CloudArena from their laptop, one simple command takes care of everything:
                </p>
                
                <div className="flex items-center justify-between bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                  <code className="text-xs font-mono text-rose-300">cloudarena uninstall</code>
                  <button 
                    onClick={() => copyCode("cloudarena uninstall")}
                    className="text-slate-400 hover:text-white transition flex items-center gap-1 text-[11px]"
                  >
                    {copiedText === "cloudarena uninstall" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copy</span>
                  </button>
                </div>

                <div className="text-xs text-slate-400 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="font-semibold text-slate-200 mb-1">What this automated uninstall does:</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Stops all Docker containers and deletes the 3-node k3d cluster.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Wipes the <code>~/.cloudarena</code> directory (local sqlite database, configs, downloaded binaries).</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Removes the CLI symlink at <code>~/.local/bin/cloudarena</code>.</span>
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-xs text-slate-300 mb-1 font-semibold">Optional: To remove the Python package itself:</div>
                  <code className="block bg-slate-900 p-2 rounded text-xs text-slate-300 font-mono border border-slate-800">
                    pip uninstall -y cloudarena
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
