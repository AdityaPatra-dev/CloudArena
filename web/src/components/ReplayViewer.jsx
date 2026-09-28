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

  let statusColor = "text-rose-400 border-rose-500/40 bg-rose-950/30";
  let statusBadge = "🔴 OUTAGE";
  if (healthStatus === "DEGRADED") {
    statusColor = "text-amber-400 border-amber-500/40 bg-amber-950/30";
    statusBadge = "🟡 REMEDIATING";
  } else if (healthStatus === "STABILIZING") {
    statusColor = "text-sky-400 border-sky-500/40 bg-sky-950/30";
    statusBadge = "🔵 STABILIZING (10s)";
  } else if (healthStatus === "HEALTHY") {
    statusColor = "text-emerald-400 border-emerald-500/40 bg-emerald-950/30";
    statusBadge = "🟢 INCIDENT RESOLVED";
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900/80 to-purple-950/40 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Film className="w-3 h-3 text-indigo-400" />
              FLIGHT RECORDER REPLAY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Wave {replay.wave_number} • {replay.duration_seconds}s Runtime
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
            {replay.wave_name || `Wave ${replay.wave_number} Incident Replay`}
          </h2>
          <p className="text-xs text-slate-300 font-mono mt-0.5">
            Cadet: <span className="text-sky-400 font-bold">@{replay.player_handle}</span> • Event: {replay.event_id} • Verified Score: <span className="text-emerald-400 font-bold">+{replay.final_score} pts</span>
          </p>
        </div>

        <div className={`px-4 py-2 rounded-2xl border font-mono font-bold text-xs sm:text-sm flex items-center gap-2 ${statusColor}`}>
          <span>{statusBadge}</span>
        </div>
      </div>

      {/* Real-Time Live Telemetry HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Gauge 1: Synthetic Traffic Ingress */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              Traffic Success Rate
            </span>
            <span className={`font-black text-base ${traffic >= 95 ? 'text-emerald-400' : traffic > 0 ? 'text-amber-400' : 'text-rose-400'}`}>
              {traffic.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800">
            <div 
              className={`h-full transition-all duration-300 ${traffic >= 95 ? 'bg-emerald-500' : traffic > 0 ? 'bg-amber-500' : 'bg-rose-500'}`}
              style={{ width: `${Math.max(4, traffic)}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-500 font-mono flex justify-between">
            <span>0% (Blackout)</span>
            <span>Target: &gt;= 95%</span>
          </div>
        </div>

        {/* Gauge 2: Microservice Cluster Pods */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-400" />
              Target Microservices
            </span>
            <span className="text-[11px] text-slate-500">Namespace: cloudarena-app</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-slate-400 text-[10px]">Frontend</div>
              <div className={`font-bold mt-0.5 ${currentEvent.pods?.frontend === 'Running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentEvent.pods?.frontend || 'Running'}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-slate-400 text-[10px]">Backend</div>
              <div className={`font-bold mt-0.5 ${currentEvent.pods?.backend === 'Running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentEvent.pods?.backend || 'Running'}
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <div className="text-slate-400 text-[10px]">Cache/DB</div>
              <div className={`font-bold mt-0.5 ${currentEvent.pods?.cache === 'Running' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {currentEvent.pods?.cache || 'Running'}
              </div>
            </div>
          </div>
        </div>

        {/* Gauge 3: Current Time & Step Info */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Incident Clock</span>
            <span className="text-purple-400 font-bold">{currentIndex + 1} / {totalEvents} Events</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">
            {formatOffset(currentEvent.offset_seconds || 0)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            Event: <span className="text-slate-200 font-bold">{currentEvent.event_type}</span>
          </div>
        </div>

      </div>

      {/* Visual Scrubber & Playback Controls */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-6 backdrop-blur space-y-4">
        
        {/* Scrubber slider */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>T+00:00.0s</span>
            <span className="text-sky-400 font-bold">{formatOffset(currentEvent.offset_seconds || 0)}</span>
            <span>{formatOffset(replay.duration_seconds)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={totalEvents - 1}
            value={currentIndex}
            onChange={handleSeek}
            className="w-full accent-indigo-500 cursor-pointer h-2 bg-slate-950 rounded-lg"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-500/20 transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? "Pause" : "Play Timeline"}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Reset Timeline"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono font-bold">
            <span className="text-[10px] text-slate-500 px-2 uppercase">Speed:</span>
            {[1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setPlaybackSpeed(s)}
                className={`px-2.5 py-1 rounded-lg transition ${playbackSpeed === s ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal Audit Log Console */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 font-mono text-xs shadow-2xl space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-900">
          <span className="flex items-center gap-1.5 text-slate-300 font-bold">
            <Terminal className="w-4 h-4 text-emerald-400" />
            Incident Event Stream
          </span>
          <span className="text-[10px] text-slate-500">Auto-scrolling with playback</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pt-2">
          {timeline.slice(0, currentIndex + 1).map((ev, i) => (
            <div 
              key={i} 
              className={`p-2 rounded-lg flex items-start gap-2.5 transition ${i === currentIndex ? 'bg-indigo-950/40 border border-indigo-500/40' : 'bg-slate-900/30'}`}
            >
              <span className="text-slate-500 shrink-0 font-bold text-[11px]">
                {formatOffset(ev.offset_seconds)}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                ev.event_type.includes('STARTED') ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                ev.event_type.includes('RESOLVED') || ev.event_type.includes('SYNCED') ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                ev.event_type.includes('STABILIZATION') ? 'bg-sky-950 text-sky-300 border border-sky-800' :
                'bg-slate-800 text-slate-300'
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
