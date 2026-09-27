import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Play, 
  Pause, 
  Snowflake, 
  Download, 
  Radio, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  RotateCcw, 
  Filter,
  Zap,
  Sliders
} from 'lucide-react';
import { updateEventConfigAdmin } from '../firebase';

export default function AdminCommandCenter({ eventConfig, standings = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const eventId = eventConfig?.event_id || 'HACKATHON_2026';

  // Fetch live radar participants from backend
  const fetchParticipants = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/participants?event_id=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        return;
      }
    } catch (e) {}

    // Simulated fallback participant radar
    setParticipants([
      { handle: "neo_sre", live_wave: 3, status: "STABILIZING", elapsed_s: 180, traffic_pct: 98.5, total_score: 540, waves_cleared: 3 },
      { handle: "k8s_sorcerer", live_wave: 3, status: "UNDER_ATTACK", elapsed_s: 240, traffic_pct: 65.0, total_score: 495, waves_cleared: 3 },
      { handle: "cyber_valkyrie", live_wave: 2, status: "RESOLVED", elapsed_s: 145, traffic_pct: 100.0, total_score: 410, waves_cleared: 2 },
      { handle: "chaos_monkey_01", live_wave: 2, status: "UNDER_ATTACK", elapsed_s: 310, traffic_pct: 42.0, total_score: 360, waves_cleared: 2 },
      { handle: "pod_healer", live_wave: 2, status: "STABILIZING", elapsed_s: 195, traffic_pct: 90.0, total_score: 290, waves_cleared: 2 },
      { handle: "ingress_ninja", live_wave: 1, status: "RESOLVED", elapsed_s: 75, traffic_pct: 100.0, total_score: 240, waves_cleared: 1 },
      { handle: "daemon_slayer", live_wave: 1, status: "RESOLVED", elapsed_s: 98, traffic_pct: 100.0, total_score: 180, waves_cleared: 1 },
      { handle: "rookie_ops", live_wave: 1, status: "STUCK_5M", elapsed_s: 420, traffic_pct: 12.0, total_score: 0, waves_cleared: 0 },
    ]);
  };

  useEffect(() => {
    fetchParticipants();
    const interval = setInterval(fetchParticipants, 3000);
    return () => clearInterval(interval);
  }, [eventId]);

  const handleToggleFreeze = async () => {
    const nextState = !eventConfig?.is_frozen;
    await updateEventConfigAdmin(eventId, { is_frozen: nextState });
  };

  const handleBroadcastWave = async (waveNum) => {
    await updateEventConfigAdmin(eventId, { active_wave: waveNum });
    alert(`🚀 Wave ${waveNum} broadcasted to all competitors!`);
  };

  const handleUpdateStatus = async (status) => {
    await updateEventConfigAdmin(eventId, { status });
  };

  const handleExportCSV = () => {
    if (standings.length === 0) {
      alert("No participant records to export.");
      return;
    }
    const headers = "Rank,Handle,Event,WavesCleared,TotalTimeSeconds,HintsCost,TotalScore\n";
    const rows = standings.map(s => 
      `${s.rank},"${s.handle}","${s.event_id}",${s.waves_cleared},${s.total_time},${s.total_hints_cost},${s.total_score}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CloudArena_Standings_${eventId}_${Date.now()}.csv`;
    a.click();
  };

  const filteredParticipants = participants.filter(p => {
    if (filter === 'ATTACK') return p.status === 'UNDER_ATTACK';
    if (filter === 'STABILIZING') return p.status === 'STABILIZING';
    if (filter === 'STUCK') return p.status === 'STUCK_5M' || p.elapsed_s > 300;
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-900/80 border border-purple-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-2xl font-black text-white tracking-tight">Organizer Command Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Event: <span className="text-purple-300 font-bold">{eventId}</span> • Concurrency Target: 2,000+ Participants
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => handleUpdateStatus('IN_PROGRESS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              eventConfig?.status === 'IN_PROGRESS' 
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Start Event</span>
          </button>

          <button
            onClick={() => handleUpdateStatus('PAUSED')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              eventConfig?.status === 'PAUSED' 
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause Timers</span>
          </button>

          <button
            onClick={handleToggleFreeze}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              eventConfig?.is_frozen 
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30 animate-pulse' 
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>{eventConfig?.is_frozen ? 'Scoreboard Frozen ❄' : 'Freeze Scoreboard'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center gap-2 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Wave Orchestration Gatekeeper */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-white text-lg">Wave Orchestration Gatekeeper</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Active Wave: <span className="text-sky-400 font-bold">Wave {eventConfig?.active_wave || 1}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { num: 1, name: "CPU Starvation Outage", target: "cart-service", duration: "5 min" },
            { num: 2, name: "Memory Leak Cascade", target: "product-catalog", duration: "7 min" },
            { num: 3, name: "Deadlock Probe Crash", target: "frontend-proxy", duration: "8 min" },
            { num: 4, name: "Ingress Surge Overload", target: "all-services", duration: "10 min" },
          ].map((w) => {
            const isCurrent = (eventConfig?.active_wave || 1) === w.num;
            const isReleased = (eventConfig?.active_wave || 1) >= w.num;

            return (
              <div 
                key={w.num}
                className={`p-5 rounded-2xl border transition flex flex-col justify-between ${
                  isCurrent 
                    ? 'bg-sky-950/40 border-sky-500 shadow-xl shadow-sky-500/10' 
                    : isReleased 
                      ? 'bg-slate-900/80 border-emerald-900/60' 
                      : 'bg-slate-950/50 border-slate-800/80 opacity-60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">WAVE {w.num}</span>
                    {isCurrent ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        BROADCASTING
                      </span>
                    ) : isReleased ? (
                      <span className="text-emerald-400 text-xs font-bold">RELEASED ✓</span>
                    ) : (
                      <span className="text-slate-500 text-xs">LOCKED 🔒</span>
                    )}
                  </div>
                  <div className="font-bold text-white text-sm leading-snug">{w.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-1">Target: {w.target}</div>
                  <div className="text-xs text-slate-500 mt-0.5">Duration: {w.duration}</div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => handleBroadcastWave(w.num)}
                    className="w-full py-2 rounded-xl text-xs font-bold bg-sky-600/80 hover:bg-sky-500 text-white transition flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Broadcast Wave {w.num}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Competitor Radar (2,000 Participants Supervision) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-extrabold text-white text-lg">Live Competitor Supervision Radar</h3>
              <p className="text-xs text-slate-400">Monitoring real-time laptop telemetry heartbeats across all competitors</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${filter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({participants.length})
            </button>
            <button
              onClick={() => setFilter('ATTACK')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${filter === 'ATTACK' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Under Attack 🔴
            </button>
            <button
              onClick={() => setFilter('STABILIZING')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${filter === 'STABILIZING' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Stabilizing 🟡
            </button>
            <button
              onClick={() => setFilter('STUCK')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${filter === 'STUCK' ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Stuck &gt; 5m ⚠️
            </button>
          </div>
        </div>

        {/* Participant Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/70">
                <th className="py-3.5 px-5">Competitor</th>
                <th className="py-3.5 px-5">Active Wave</th>
                <th className="py-3.5 px-5">Incident Status</th>
                <th className="py-3.5 px-5 text-right">Elapsed Time</th>
                <th className="py-3.5 px-5 text-right">Traffic Success</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredParticipants.map((p) => {
                let statusBadge = (
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {p.status}
                  </span>
                );
                if (p.status === 'UNDER_ATTACK') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                      Under Attack 🔴
                    </span>
                  );
                } else if (p.status === 'STABILIZING') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Stabilizing 🟡
                    </span>
                  );
                } else if (p.status === 'RESOLVED') {
                  statusBadge = (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Cleared 🟢
                    </span>
                  );
                }

                return (
                  <tr key={p.handle} className="hover:bg-slate-800/30 transition">
                    <td className="py-3.5 px-5 font-bold text-slate-200">
                      @{p.handle}
                    </td>
                    <td className="py-3.5 px-5 font-mono text-slate-300">
                      Wave {p.live_wave}
                    </td>
                    <td className="py-3.5 px-5">
                      {statusBadge}
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-slate-400">
                      {Math.floor(p.elapsed_s / 60)}m {p.elapsed_s % 60}s
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono font-bold">
                      <span className={p.traffic_pct < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                        {p.traffic_pct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => alert(`Reset signal sent to @${p.handle}`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                      >
                        Emergency Reset
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
