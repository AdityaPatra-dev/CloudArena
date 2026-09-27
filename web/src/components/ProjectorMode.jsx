import React from 'react';
import { Tv, Sparkles, Trophy, Minimize2 } from 'lucide-react';

export default function ProjectorMode({ standings = [], eventConfig, onClose }) {
  const top15 = standings.slice(0, 15);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#05070c] text-white p-8 sm:p-12 overflow-y-auto flex flex-col justify-between selection:bg-amber-500">
      
      {/* Top Banner */}
      <div>
        <div className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-4xl">🌩️</span>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-sky-400 via-white to-amber-300 bg-clip-text text-transparent">
                  {eventConfig?.title || "CloudArena Championship 2026"}
                </h1>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  AUDITORIUM PROJECTOR MODE
                </span>
              </div>
              <p className="text-sm text-slate-400 font-mono mt-1">
                Real-Time Chaos Survival Leaderboard • Auto-syncing live
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE TOURNAMENT
            </span>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
              title="Exit Projector Mode"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Standings Grid / Rows */}
        <div className="mt-8 space-y-2.5">
          {top15.map((s) => {
            let rowStyle = "bg-slate-900/50 border-slate-800/80";
            let medal = `#${s.rank}`;
            
            if (s.rank === 1) {
              rowStyle = "bg-gradient-to-r from-amber-950/60 via-slate-900/90 to-slate-900/90 border-amber-500/80 shadow-2xl shadow-amber-500/10";
              medal = "🥇 #1";
            } else if (s.rank === 2) {
              rowStyle = "bg-slate-900/80 border-slate-600";
              medal = "🥈 #2";
            } else if (s.rank === 3) {
              rowStyle = "bg-slate-900/80 border-amber-800/70";
              medal = "🥉 #3";
            }

            return (
              <div 
                key={s.handle} 
                className={`p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition transform hover:scale-[1.008] ${rowStyle}`}
              >
                <div className="flex items-center gap-5 sm:gap-8">
                  <div className="font-mono font-black text-xl sm:text-2xl w-16 text-center text-amber-400">
                    {medal}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-mono font-bold text-sm text-sky-300">
                      {s.handle.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-extrabold text-lg sm:text-xl text-white tracking-tight">
                        {s.handle}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {s.event_id || 'Global'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 sm:gap-12">
                  <div className="hidden sm:block text-center">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Waves Cleared</div>
                    <span className="font-mono font-bold text-sm text-sky-400">
                      {s.waves_cleared}/4 Waves
                    </span>
                  </div>

                  <div className="hidden sm:block text-right">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Time Elapsed</div>
                    <span className="font-mono text-slate-300 text-sm">
                      {formatTime(s.total_time)}
                    </span>
                  </div>

                  <div className="text-right min-w-[120px]">
                    <div className="text-[11px] font-mono text-slate-500 uppercase">Verified Score</div>
                    <span className="font-mono font-black text-2xl sm:text-3xl text-emerald-400">
                      {s.total_score} <span className="text-xs text-emerald-600">PTS</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Projector Footer */}
      <footer className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500 font-mono">
        <div>Powered by CloudArena • Real-time 3-Node Kubernetes Sandbox Attestation</div>
        <div>Press Esc or click top-right icon to exit</div>
      </footer>

    </div>
  );
}
