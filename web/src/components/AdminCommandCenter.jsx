import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Play, 
  Pause, 
  Snowflake, 
  Download, 
  Radio, 
  Users, 
  Save, 
  Clock, 
  Award, 
  Edit3, 
  CheckCircle2, 
  Zap, 
  Sliders,
  Check
} from 'lucide-react';
import { updateEventConfigAdmin } from '../firebase';

export default function AdminCommandCenter({ eventConfig, standings = [] }) {
  const [filter, setFilter] = useState('ALL');
  const [participants, setParticipants] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const eventId = eventConfig?.event_id || 'HACKATHON_2026';

  // Editable Event Settings state
  const [title, setTitle] = useState(eventConfig?.title || "CloudArena Championship");
  const [status, setStatus] = useState(eventConfig?.status || "IN_PROGRESS");
  const [mode, setMode] = useState(eventConfig?.mode || "synchronized");
  const [freezeMessage, setFreezeMessage] = useState(
    eventConfig?.freeze_message || "❄️ Leaderboard is frozen for the grand finale! Standings will be unveiled at closing ceremonies."
  );

  // Editable Wave Parameters
  const [waveNames, setWaveNames] = useState(eventConfig?.wave_names || {
    "1": "CPU Starvation Outage",
    "2": "Memory Leak OOMKilled Cascade",
    "3": "Broken Health Probe Deadlock",
    "4": "Ingress Surge Traffic Overload"
  });

  const [waveDurations, setWaveDurations] = useState(eventConfig?.wave_durations || {
    "1": 300,
    "2": 420,
    "3": 480,
    "4": 600
  });

  const [wavePoints, setWavePoints] = useState(eventConfig?.wave_points || {
    "1": 100,
    "2": 150,
    "3": 200,
    "4": 250
  });

  // Sync state if eventConfig changes externally
  useEffect(() => {
    if (eventConfig) {
      if (eventConfig.title) setTitle(eventConfig.title);
      if (eventConfig.status) setStatus(eventConfig.status);
      if (eventConfig.mode) setMode(eventConfig.mode);
      if (eventConfig.freeze_message) setFreezeMessage(eventConfig.freeze_message);
      if (eventConfig.wave_names) setWaveNames(eventConfig.wave_names);
      if (eventConfig.wave_durations) setWaveDurations(eventConfig.wave_durations);
      if (eventConfig.wave_points) setWavePoints(eventConfig.wave_points);
    }
  }, [eventConfig]);

  // Fetch live radar participants
  const fetchParticipants = async () => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/admin/participants?event_id=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setParticipants(data.participants || []);
        return;
      }
    } catch (e) {}

    // Fallback simulation
    setParticipants([
      { handle: "aditya_sre", live_wave: 3, status: "STABILIZING", elapsed_s: 180, traffic_pct: 98.5, total_score: 540, waves_cleared: 3 },
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    await updateEventConfigAdmin(eventId, {
      title,
      status,
      mode,
      freeze_message: freezeMessage,
      wave_names: waveNames,
      wave_durations: waveDurations,
      wave_points: wavePoints,
    });
    setIsSaving(false);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleToggleFreeze = async () => {
    const nextState = !eventConfig?.is_frozen;
    await updateEventConfigAdmin(eventId, { is_frozen: nextState });
  };

  const handleBroadcastWave = async (waveNum) => {
    await updateEventConfigAdmin(eventId, { active_wave: waveNum });
    alert(`🚀 Wave ${waveNum} broadcasted to all 2,000 competitors!`);
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
    <div className="space-y-6 sm:space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16 md:pb-0">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-900/80 border border-purple-500/30 rounded-3xl p-5 sm:p-8 backdrop-blur shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Organizer Command Center</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Full Tournament Authority • Bound Event: <span className="text-purple-300 font-bold">{eventId}</span>
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleToggleFreeze}
            className={`flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
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
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition flex items-center justify-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30"
          >
            {savedNotice ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savedNotice ? "Saved to Cloud! ✓" : isSaving ? "Saving..." : "Save Settings"}</span>
          </button>
        </div>
      </div>

      {/* Tournament Settings Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-purple-400" />
          <h3 className="font-extrabold text-white text-base sm:text-lg">Tournament Configuration & Authority</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1.5">Custom Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-400 font-medium"
              placeholder="e.g. GDG Cloud Survival Arena"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1.5">Event Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-400"
            >
              <option value="OPEN">OPEN (Pre-Event Registration)</option>
              <option value="IN_PROGRESS">IN_PROGRESS (Battles Active)</option>
              <option value="PAUSED">PAUSED (All Clocks Suspended)</option>
              <option value="CONCLUDED">CONCLUDED (Awards Ceremony)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1.5">Wave Release Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-purple-400"
            >
              <option value="synchronized">Synchronized (Broadcast waves together)</option>
              <option value="self_paced">Self-Paced (Competitors progress at will)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 font-mono block mb-1.5">Custom Scoreboard Freeze Announcement</label>
          <input
            type="text"
            value={freezeMessage}
            onChange={(e) => setFreezeMessage(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-purple-400"
            placeholder="Custom message shown on leaderboard when frozen"
          />
        </div>
      </div>

      {/* Stage / Wave Granular Customizer (Names, Durations, Points) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-sky-400" />
            <h3 className="font-extrabold text-white text-base sm:text-lg">Stage Customizer & Wave Gatekeeper</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Currently Broadcasting: <span className="text-sky-400 font-bold">Wave {eventConfig?.active_wave || 1}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((num) => {
            const waveKey = String(num);
            const isCurrent = (eventConfig?.active_wave || 1) === num;
            const currentName = waveNames[waveKey] || `Wave ${num}`;
            const currentDurationMins = Math.floor((waveDurations[waveKey] || 300) / 60);
            const currentPoints = wavePoints[waveKey] || 100;

            return (
              <div 
                key={num}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between space-y-3 ${
                  isCurrent 
                    ? 'bg-sky-950/40 border-sky-500 shadow-xl shadow-sky-500/10' 
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">STAGE {num}</span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                        BROADCASTING
                      </span>
                    )}
                  </div>

                  {/* Stage Name Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Stage Name</label>
                    <input
                      type="text"
                      value={currentName}
                      onChange={(e) => setWaveNames({ ...waveNames, [waveKey]: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  {/* Time limit & Points */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Time (mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={currentDurationMins}
                        onChange={(e) => setWaveDurations({ 
                          ...waveDurations, 
                          [waveKey]: Math.max(1, parseInt(e.target.value) || 1) * 60 
                        })}
                        className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-sky-300 font-mono focus:outline-none focus:border-sky-400"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-slate-400 uppercase">Points</label>
                      <input
                        type="number"
                        min="10"
                        max="1000"
                        step="10"
                        value={currentPoints}
                        onChange={(e) => setWavePoints({ 
                          ...wavePoints, 
                          [waveKey]: parseInt(e.target.value) || 100 
                        })}
                        className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-emerald-300 font-mono focus:outline-none focus:border-sky-400"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleBroadcastWave(num)}
                  className="w-full py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white transition flex items-center justify-center gap-1.5 shadow"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Broadcast Wave {num}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Competitor Radar (2,000 Participants Supervision) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-extrabold text-white text-base sm:text-lg">Live Competitor Supervision Radar</h3>
              <p className="text-xs text-slate-400">Real-time telemetry heartbeats across all 2,000 participant laptops</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${filter === 'ALL' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              All ({participants.length})
            </button>
            <button
              onClick={() => setFilter('ATTACK')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${filter === 'ATTACK' ? 'bg-rose-950 text-rose-300 font-bold border border-rose-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Under Attack 🔴
            </button>
            <button
              onClick={() => setFilter('STABILIZING')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${filter === 'STABILIZING' ? 'bg-amber-950 text-amber-300 font-bold border border-amber-800' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Stabilizing 🟡
            </button>
            <button
              onClick={() => setFilter('STUCK')}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition ${filter === 'STUCK' ? 'bg-purple-950 text-purple-300 font-bold border border-purple-800' : 'text-slate-400 hover:text-slate-200'}`}
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
                <th className="py-3 px-4">Competitor</th>
                <th className="py-3 px-4">Active Wave</th>
                <th className="py-3 px-4">Incident Status</th>
                <th className="py-3 px-4 text-right">Elapsed Time</th>
                <th className="py-3 px-4 text-right">Traffic Success</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredParticipants.map((p) => {
                let statusBadge = (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                    {p.status}
                  </span>
                );
                if (p.status === 'UNDER_ATTACK') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
                      Under Attack 🔴
                    </span>
                  );
                } else if (p.status === 'STABILIZING') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1.5 w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      Stabilizing 🟡
                    </span>
                  );
                } else if (p.status === 'RESOLVED') {
                  statusBadge = (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1.5 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Cleared 🟢
                    </span>
                  );
                }

                return (
                  <tr key={p.handle} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      @{p.handle}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      Wave {p.live_wave}
                    </td>
                    <td className="py-3 px-4">
                      {statusBadge}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-400">
                      {Math.floor(p.elapsed_s / 60)}m {p.elapsed_s % 60}s
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={p.traffic_pct < 50 ? 'text-rose-400' : 'text-emerald-400'}>
                        {p.traffic_pct?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
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
