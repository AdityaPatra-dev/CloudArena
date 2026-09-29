import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Play, 
  RotateCcw, 
  Copy, 
  Check, 
  Sparkles, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  Flame, 
  Server,
  Zap,
  ChevronRight,
  Eye
} from 'lucide-react';

const SCENARIOS = [
  {
    id: 'start',
    label: '1. Launch Cluster',
    command: 'cloudarena start',
    tag: 'BOOTSTRAP',
    color: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/30',
    description: 'Spin up the 3-node isolated k3d cluster and microservices in under 30 seconds ($0 compute cost).',
    output: [
      { text: '🚀 CloudArena Cluster Launcher', color: 'text-cyan-300 font-bold' },
      { text: '• Checking local prerequisites: Docker ✓, k3d ✓, kubectl ✓', color: 'text-slate-400' },
      { text: '• Creating sandboxed cluster "cloudarena-cluster" (1 server + 2 agents)...', color: 'text-slate-300' },
      { text: '✓ Cluster running in user space (ports 8080/8443 forwarded)', color: 'text-emerald-400' },
      { text: '• Deploying target microservices: frontend, backend-api, cache-redis...', color: 'text-slate-300' },
      { text: '✓ All pods in namespace "cloudarena-app" are Healthy & Ready [3/3]', color: 'text-emerald-400 font-bold' },
      { text: '🎯 Sandboxed mesh ready! Run "cloudarena wave start 1" to enter battle.', color: 'text-cyan-400 font-mono' }
    ]
  },
  {
    id: 'wave1',
    label: '2. Inject Wave 1 (Chaos)',
    command: 'cloudarena wave start 1',
    tag: 'INCIDENT INJECTED',
    color: 'text-rose-400 border-rose-500/40 bg-rose-950/30',
    description: 'Injects a high-impact chaos outage into the cluster along with an encrypted HMAC verification nonce.',
    output: [
      { text: '⚔️ INCIDENT ACTIVE: Wave 1: Rogue CPU Hog', color: 'text-rose-400 font-black' },
      { text: 'Difficulty: Beginner | Target: cloudarena-app', color: 'text-amber-400' },
      { text: '', color: 'text-slate-500' },
      { text: 'Observed Symptoms:', color: 'text-slate-300 font-bold' },
      { text: '  - Node compute saturates at 98.4%', color: 'text-rose-300' },
      { text: '  - Synthetic traffic probe latency spikes from 12ms -> 1850ms', color: 'text-rose-300' },
      { text: '  - HTTP 504 Gateway Timeouts detected across endpoints', color: 'text-rose-300' },
      { text: '', color: 'text-slate-500' },
      { text: 'Mission: Triage pods via "cloudarena kubectl ...", find rogue workload, and stabilize.', color: 'text-cyan-300' },
      { text: 'Attestation Nonce: hmac_w1_9d8a2f1b committed to cluster secret.', color: 'text-slate-400 font-mono text-[11px]' }
    ]
  },
  {
    id: 'triage',
    label: '3. Triage & Inspect Pods',
    command: 'cloudarena kubectl get pods -n cloudarena-app',
    tag: 'DIAGNOSTICS',
    color: 'text-amber-400 border-amber-500/40 bg-amber-950/30',
    description: 'Inspect live pods, find CPU throttled containers, and verify crash loops.',
    output: [
      { text: 'NAME                           READY   STATUS             RESTARTS   AGE', color: 'text-slate-400 font-mono' },
      { text: 'backend-api-7b89f899c-6x2dw   1/1     Running            0          2m14s', color: 'text-emerald-400 font-mono' },
      { text: 'cache-redis-55f69c578-8m7ql   1/1     Running            0          2m14s', color: 'text-emerald-400 font-mono' },
      { text: 'frontend-6f488f7b78-4j9zw      0/1     CrashLoopBackOff   4          2m14s', color: 'text-rose-400 font-mono font-bold' },
      { text: '', color: 'text-slate-500' },
      { text: '💡 Incident Diagnostic Hint: Container throttled due to cpu limit slashed to 20m.', color: 'text-amber-300' },
      { text: 'Fix command: cloudarena kubectl set resources deployment frontend -n cloudarena-app --limits=cpu=500m', color: 'text-cyan-300' }
    ]
  },
  {
    id: 'watch',
    label: '4. Watch & Stabilize',
    command: 'cloudarena wave watch',
    tag: 'AUTO-VERIFICATION',
    color: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/30',
    description: 'Streams live synthetic HTTP traffic. Requires 10 consecutive seconds at >=95% success before attesting score.',
    output: [
      { text: '📊 CloudArena Real-Time Telemetry Monitor', color: 'text-cyan-300 font-bold' },
      { text: 'Active Wave: 1 | Target Endpoint: http://localhost:8080', color: 'text-slate-400' },
      { text: '', color: 'text-slate-500' },
      { text: '[████████████████████████████████] 100.0% Traffic Success (120 req/s)', color: 'text-emerald-400 font-bold' },
      { text: 'Latency: p50=14ms, p99=28ms | Pod Health: 3/3 Healthy', color: 'text-slate-300' },
      { text: '', color: 'text-slate-500' },
      { text: '⏱️ Stabilization window: 10.0s / 10.0s [STABLE ✓]', color: 'text-emerald-400 font-bold' },
      { text: '🔐 Cryptographic HMAC proof generated: ca_cert_7f8a9b2c3d4e5f60', color: 'text-cyan-300 font-mono' },
      { text: '🏆 WAVE 1 CLEARED! +500 PTS SYNCED TO LEADERBOARD.', color: 'text-emerald-300 font-black' }
    ]
  },
  {
    id: 'postmortem',
    label: '5. AI Post-Mortem SRE RCA',
    command: 'cloudarena postmortem',
    tag: 'AI MENTOR',
    color: 'text-purple-400 border-purple-500/40 bg-purple-950/30',
    description: 'Generates automated Google Gemini SRE root cause analysis and resilience recommendations.',
    output: [
      { text: '🧠 Google Gemini AI Incident Post-Mortem', color: 'text-purple-300 font-bold' },
      { text: '=======================================================', color: 'text-purple-500/60' },
      { text: '• Incident Classification: Compute Starvation & Cascading Latency', color: 'text-slate-300' },
      { text: '• Root Cause: Inadequate CFS quota allocation under concurrent load.', color: 'text-slate-300' },
      { text: '• Prevention Recommendation: Implement HorizontalPodAutoscaler (HPA)', color: 'text-emerald-300' },
      { text: '  and configure automated CPU limit headroom monitoring.', color: 'text-slate-400' },
      { text: '• Skill Milestone Unlocked: Kubernetes Resource Quota Management ✓', color: 'text-amber-300 font-bold' }
    ]
  }
];

export default function InteractiveTerminalSimulator() {
  const [activeScenarioId, setActiveScenarioId] = useState('start');
  const [typedCommand, setTypedCommand] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visibleLinesCount, setVisibleLinesCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const typingTimerRef = useRef(null);
  const streamTimerRef = useRef(null);

  const currentScenario = SCENARIOS.find(s => s.id === activeScenarioId) || SCENARIOS[0];

  const runScenario = (scenario) => {
    setActiveScenarioId(scenario.id);
    setTypedCommand('');
    setVisibleLinesCount(0);
    setIsTyping(true);

    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    if (streamTimerRef.current) clearInterval(streamTimerRef.current);

    const fullCmd = scenario.command;
    let charIndex = 0;

    typingTimerRef.current = setInterval(() => {
      charIndex++;
      setTypedCommand(fullCmd.substring(0, charIndex));

      if (charIndex >= fullCmd.length) {
        clearInterval(typingTimerRef.current);
        setIsTyping(false);

        // Stream output lines progressively
        let lineIdx = 0;
        streamTimerRef.current = setInterval(() => {
          lineIdx++;
          setVisibleLinesCount(lineIdx);
          if (lineIdx >= scenario.output.length) {
            clearInterval(streamTimerRef.current);
          }
        }, 120);
      }
    }, 45);
  };

  useEffect(() => {
    runScenario(SCENARIOS[0]);
    return () => {
      if (typingTimerRef.current) clearInterval(typingTimerRef.current);
      if (streamTimerRef.current) clearInterval(streamTimerRef.current);
    };
  }, []);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0b1022]/90 border border-cyan-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-cyan-500/10 space-y-5 backdrop-blur-xl relative overflow-hidden transition-all duration-300">
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-70"></div>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/20 shrink-0">
            <Terminal className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Interactive CLI & Chaos Simulator</span>
              </h3>
              <span className="shimmer-badge px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                LIVE INTERACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Click any tournament action below to experience the real-time typewriter terminal stream before running it locally on your laptop!
            </p>
          </div>
        </div>

        <button
          onClick={() => handleCopy(currentScenario.command)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#050811] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
          <span>{copied ? "Copied Command!" : "Copy Command"}</span>
        </button>
      </div>

      {/* Scenario Action Buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {SCENARIOS.map((sc) => {
          const isActive = activeScenarioId === sc.id;
          return (
            <button
              key={sc.id}
              onClick={() => runScenario(sc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-white shadow-lg shadow-cyan-500/30 scale-[1.02]'
                  : 'bg-[#050811] hover:bg-slate-800/80 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              <span>{sc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Terminal Window Box */}
      <div className="rounded-2xl bg-[#040711] border border-slate-800 font-mono text-xs shadow-2xl overflow-hidden">
        {/* macOS style header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#070c1a] border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-600"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600"></span>
            <span className="ml-2 text-[11px] text-slate-400 font-mono">cadet@laptop: ~/cloudarena</span>
          </div>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${currentScenario.color}`}>
            {currentScenario.tag}
          </span>
        </div>

        {/* Console stream body with typing effect */}
        <div className="p-4 sm:p-5 space-y-2 min-h-[220px] max-h-[340px] overflow-y-auto leading-relaxed select-all">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <span className="text-slate-500">$</span>
            <span className="text-white">{typedCommand}</span>
            <span className="w-2 h-4 bg-cyan-400 inline-block animate-pulse"></span>
          </div>

          <div className="space-y-1 pt-1.5">
            {currentScenario.output.slice(0, visibleLinesCount).map((line, idx) => (
              <div key={idx} className={`${line.color} transition-opacity duration-150`}>
                {line.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
