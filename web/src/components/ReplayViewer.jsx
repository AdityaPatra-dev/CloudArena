import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FastForward, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  AlertOctagon, 
  ShieldCheck, 
  Sparkles,
  Server,
  Zap,
  Film
} from 'lucide-react';

export default function ReplayViewer({ sampleReplayData }) {
  const [replay, setReplay] = useState(sampleReplayData || null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1, 2, 4
  const timerRef = useRef(null);

  // Fallback to sample replay if none provided
  useEffect(() => {
    if (!replay) {
      fetch('http://localhost:8000/api/v1/replays/sample')
        .then(res => res.json())
        .then(data => setReplay(data))
        .catch(() => {
          // Embedded fallback
          setReplay({
            replay_id: "rep_championship_winning_run",
            wave_number: 8,
            wave_name: "Corrupted Ingress TLS Handshake Boss Wave",
            player_handle: "aditya_sre",
            event_id: "HACKATHON_2026",
            duration_seconds: 94.5,
            final_status: "RESOLVED",
            final_score: 670,
            timeline: [
              { offset_seconds: 0.0, event_type: "WAVE_STARTED", details: "Chaos injected: Corrupted TLS key in secret 'cloudarena-tls'. Ingress SSL handshake failing.", health_status: "CRITICAL", traffic_pct: 0.0, pods: { frontend: "CrashLoop", backend: "Running", cache: "Running" } },
              { offset_seconds: 12.4, event_type: "KUBECTL_PROBE", details: "Cadet ran: kubectl get pods -n cloudarena-app", health_status: "CRITICAL", traffic_pct: 0.0, pods: { frontend: "CrashLoop", backend: "Running", cache: "Running" } },
              { offset_seconds: 25.1, event_type: "DIAGNOSTIC_LOGS", details: "Cadet inspected ingress controller logs: SSL_do_handshake() failed (SSL error: padding check).", health_status: "CRITICAL", traffic_pct: 0.0, pods: { frontend: "Error", backend: "Running", cache: "Running" } },
              { offset_seconds: 45.8, event_type: "REMEDIATION_ACTION", details: "Cadet regenerated trusted TLS secret and patched Ingress tls.secretName.", health_status: "DEGRADED", traffic_pct: 42.5, pods: { frontend: "ContainerCreating", backend: "Running", cache: "Running" } },
              { offset_seconds: 61.2, event_type: "TRAFFIC_RECOVERY", details: "HTTPS handshake successful. Traffic proxying resumed at 95.8% success.", health_status: "STABILIZING", traffic_pct: 95.8, pods: { frontend: "Running", backend: "Running", cache: "Running" } },
              { offset_seconds: 71.2, event_type: "STABILIZATION_WINDOW", details: "Entered 10-second anti-flap stabilization verification countdown.", health_status: "STABILIZING", traffic_pct: 100.0, pods: { frontend: "Running", backend: "Running", cache: "Running" } },
              { offset_seconds: 81.2, event_type: "INCIDENT_RESOLVED", details: "10s stabilization passed with zero restarts. Cryptographic HMAC proof generated.", health_status: "HEALTHY", traffic_pct: 100.0, pods: { frontend: "Running", backend: "Running", cache: "Running" } },
              { offset_seconds: 84.5, event_type: "SCORE_SYNCED", details: "Net score +670 pts attested and synced to Cloud Leaderboard.", health_status: "HEALTHY", traffic_pct: 100.0, pods: { frontend: "Running", backend: "Running", cache: "Running" } }
            ]
          });
        });
    }
  }, []);

  const timeline = replay?.timeline || [];
  const currentEvent = timeline[currentIndex] || timeline[0] || {};
  const totalEvents = timeline.length;

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(250, 1500 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= totalEvents - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, totalEvents]);

  const handleSeek = (e) => {
    setCurrentIndex(parseInt(e.target.value, 10));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const formatOffset = (seconds = 0) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `T+${String(mins).padStart(2, '0')}:${String(secs).padStart(4, '0')}s`;
  };

  if (!replay) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900/60 border border-slate-800 rounded-3xl">
        Loading tournament replay flight logs...
      </div>
    );
  }

  const traffic = currentEvent.traffic_pct !== undefined ? currentEvent.traffic_pct : 0;
  const healthStatus = currentEvent.health_status || "CRITICAL";

  let statusColor = "text-rose-300 border-rose-500/50 bg-rose-950/40 shadow-glow-rose";
  let statusBeacon = "bg-rose-500";
  let statusBadge = "OUTAGE ACTIVE";
  if (healthStatus === "DEGRADED") {
    statusColor = "text-amber-300 border-amber-500/50 bg-amber-950/40 shadow-glow-amber";
    statusBeacon = "bg-amber-500";
    statusBadge = "REMEDIATING CHAOS";
  } else if (healthStatus === "STABILIZING") {
    statusColor = "text-cyan-300 border-cyan-500/50 bg-cyan-950/40 shadow-glow-cyan";
    statusBeacon = "bg-cyan-500";
    statusBadge = "STABILIZING (10s)";
  } else if (healthStatus === "HEALTHY") {
    statusColor = "text-emerald-300 border-emerald-500/50 bg-emerald-950/40 shadow-glow-emerald";
    statusBeacon = "bg-emerald-500";
    statusBadge = "INCIDENT RESOLVED";
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16 md:pb-0">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-[#0b1022]/90 via-[#080d1a]/95 to-[#060a15]/95 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-indigo-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-60"></div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-sm shadow-indigo-500/20">
              <Film className="w-3.5 h-3.5 text-indigo-400" />
              FLIGHT RECORDER REPLAY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Wave {replay.wave_number} • {replay.duration_seconds}s Runtime
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight bg-gradient-to-r from-white via-indigo-100 to-sky-300 bg-clip-text text-transparent">
            {replay.wave_name || `Wave ${replay.wave_number} Incident Replay`}
          </h2>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            Cadet: <span className="text-cyan-400 font-bold">@{replay.player_handle}</span> • Event: {replay.event_id} • Verified Score: <span className="text-emerald-400 font-bold">+{replay.final_score} pts</span>
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl border font-mono font-bold text-xs sm:text-sm flex items-center gap-2.5 transition-all duration-300 ${statusColor}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusBeacon}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusBeacon}`}></span>
          </span>
          <span>{statusBadge}</span>
        </div>
      </div>

      {/* Real-Time Live Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Gauge 1: Synthetic Traffic Ingress */}
        <div className="bg-[#0b1022]/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 backdrop-blur-xl space-y-3 shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-cyan-400" />
              Traffic Success Rate
            </span>
            <span className={`font-black text-base ${traffic >= 95 ? 'text-emerald-400' : traffic > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {traffic.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-[#050811] h-3 rounded-full overflow-hidden border border-slate-800 shadow-inner">
            <div 
              className={`h-full transition-all duration-300 ${traffic >= 95 ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-glow-emerald' : traffic > 0 ? 'bg-gradient-to-r from-amber-500 to-orange-400 shadow-glow-amber' : 'bg-gradient-to-r from-rose-600 to-red-500 shadow-glow-rose'}`}
              style={{ width: `${Math.max(4, traffic)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex justify-between">
            <span>0% (Blackout)</span>
            <span className="text-emerald-400 font-semibold">Target: &gt;= 95%</span>
          </div>
        </div>

        {/* Gauge 2: Microservice Cluster Pods */}
        <div className="bg-[#0b1022]/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 backdrop-blur-xl space-y-2.5 shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="flex items-center gap-1.5 font-semibold">
              <Server className="w-4 h-4 text-indigo-400" />
              Target Microservices
            </span>
            <span className="text-[11px] text-slate-400 font-mono">Namespace: cloudarena-app</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Frontend</div>
              <div className={`font-black mt-0.5 flex items-center justify-center gap-1 ${currentEvent.pods?.frontend === 'Running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentEvent.pods?.frontend === 'Running' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                <span>{currentEvent.pods?.frontend || 'Running'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Backend</div>
              <div className={`font-black mt-0.5 flex items-center justify-center gap-1 ${currentEvent.pods?.backend === 'Running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentEvent.pods?.backend === 'Running' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                <span>{currentEvent.pods?.backend || 'Running'}</span>
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#050811] border border-slate-800 text-center">
              <div className="text-slate-400 text-[10px] uppercase font-bold">Cache/DB</div>
              <div className={`font-black mt-0.5 flex items-center justify-center gap-1 ${currentEvent.pods?.cache === 'Running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${currentEvent.pods?.cache === 'Running' ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
                <span>{currentEvent.pods?.cache || 'Running'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Gauge 3: Current Time & Step Info */}
        <div className="bg-[#0b1022]/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 sm:p-5 backdrop-blur-xl flex flex-col justify-between shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-center justify-between text-xs font-mono text-slate-300">
            <span className="font-semibold">Incident Clock</span>
            <span className="text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">{currentIndex + 1} / {totalEvents} Events</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1 tracking-tight">
            {formatOffset(currentEvent.offset_seconds || 0)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Event: <span className="text-cyan-300 font-bold">{currentEvent.event_type}</span>
          </div>
        </div>

      </div>

      {/* Visual Scrubber & Playback Controls */}
      <div className="bg-[#0b1022]/90 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-4 sm:p-6 backdrop-blur-xl space-y-4 shadow-xl transition-all duration-300">
        
        {/* Scrubber slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>T+00:00.0s</span>
            <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">{formatOffset(currentEvent.offset_seconds || 0)}</span>
            <span>{formatOffset(replay.duration_seconds)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={totalEvents - 1}
            value={currentIndex}
            onChange={handleSeek}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#050811] rounded-lg border border-slate-800"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-95 transition-all duration-200"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? "Pause" : "Play Timeline"}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-[#050811] hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition"
              title="Reset Timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-[#050811] p-1.5 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <span className="text-[10px] text-slate-400 px-2 uppercase">Speed:</span>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-3 py-1 rounded-lg transition-all duration-200 ${playbackSpeed === s ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30' : 'text-slate-400 hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Audit Log Console */}
      <div className="bg-[#050811] border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono text-xs shadow-2xl space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800/80">
          <span className="flex items-center gap-2 text-slate-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Incident Telemetry Feed</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Real-time event playback</span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pt-2 pr-1">
          {timeline.slice(0, currentIndex + 1).map((ev, i) => (
            <div 
              key={i} 
              className={`p-2.5 rounded-xl flex items-start gap-2.5 transition-all duration-200 ${i === currentIndex ? 'bg-indigo-950/60 border border-indigo-500/50 shadow-md shadow-indigo-500/20 translate-x-1' : 'bg-[#090e1c]/60 border border-transparent'}`}
            >
              <span className="text-cyan-400/80 shrink-0 font-bold text-[11px]">
                {formatOffset(ev.offset_seconds)}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono shrink-0 ${
                ev.event_type.includes('STARTED') ? 'bg-rose-950/80 text-rose-300 border border-rose-800/60' :
                ev.event_type.includes('RESOLVED') || ev.event_type.includes('SYNCED') ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' :
                ev.event_type.includes('STABILIZATION') ? 'bg-sky-950/80 text-sky-300 border border-sky-800/60' :
                'bg-slate-800/80 text-slate-300 border border-slate-700/60'
              }`}>
                {ev.event_type}
              </span>
              <span className="text-slate-300 break-words leading-relaxed text-xs">
                {ev.details}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
