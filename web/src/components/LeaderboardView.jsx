import React, { useState } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Search, 
  AlertTriangle, 
  Snowflake, 
  Sparkles,
  Award
} from 'lucide-react';

export default function LeaderboardView({ standings = [], eventConfig }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStandings = standings.filter(s => 
    s.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.event_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top1 = standings[0];
  const top2 = standings[1];
  const top3 = standings[2];

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* Freeze Alert Banner */}
      {eventConfig?.is_frozen && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/10 to-indigo-500/20 border border-amber-500/40 p-4 sm:p-5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Snowflake className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <div className="font-bold text-amber-300 text-sm sm:text-base flex items-center gap-2">
                Scoreboard Frozen for Final Showdown!
              </div>
              <div className="text-xs text-slate-300">
                Submissions are still registered secretly. Official winners will be unveiled at the awards ceremony!
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40">
            FINAL HOUR FREEZE
          </span>
        </div>
      )}

      {/* Top Podium Showcase */}
      {standings.length >= 3 && !eventConfig?.is_frozen && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          
          {/* 2nd Place - Silver */}
          <div className="order-2 md:order-1 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between hover:border-slate-500 transition">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">🥈</div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-600">
                  RANK #2 • SILVER
                </span>
                <span className="text-2xl">🥈</span>
              </div>
              <div className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {top2.handle}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Cleared {top2.waves_cleared}/4 Waves • {formatTime(top2.total_time)}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
              <span className="text-xs text-slate-500 uppercase font-mono">Net Score</span>
              <span className="text-2xl font-black text-slate-200 mono">{top2.total_score} pts</span>
            </div>
          </div>

          {/* 1st Place - Gold Champion */}
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900/80 to-slate-900/80 border-2 border-amber-500/60 rounded-2xl p-6 relative overflow-hidden backdrop-blur shadow-2xl shadow-amber-500/10 flex flex-col justify-between transform md:-translate-y-2 hover:border-amber-400 transition">
            <div className="absolute -right-4 -bottom-4 text-8xl opacity-15">🥇</div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  TOURNAMENT LEADER
                </span>
                <span className="text-3xl">🥇</span>
              </div>
              <div className="text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                {top1.handle}
              </div>
              <div className="text-xs text-amber-200/80 mt-1">
                Cleared {top1.waves_cleared}/4 Waves • Fast Clock: {formatTime(top1.total_time)}
              </div>
            </div>
            <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-baseline justify-between">
              <span className="text-xs text-amber-400/80 uppercase font-mono font-bold">Champion Score</span>
              <span className="text-3xl font-black text-amber-400 mono">{top1.total_score} pts</span>
            </div>
          </div>

          {/* 3rd Place - Bronze */}
          <div className="order-3 md:order-3 bg-slate-900/60 border border-amber-900/50 rounded-2xl p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between hover:border-amber-700/60 transition">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10">🥉</div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                  RANK #3 • BRONZE
                </span>
                <span className="text-2xl">🥉</span>
              </div>
              <div className="text-xl font-bold text-slate-100 flex items-center gap-2">
                {top3.handle}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Cleared {top3.waves_cleared}/4 Waves • {formatTime(top3.total_time)}
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
              <span className="text-xs text-slate-500 uppercase font-mono">Net Score</span>
              <span className="text-2xl font-black text-amber-500/90 mono">{top3.total_score} pts</span>
            </div>
          </div>

        </div>
      )}

      {/* Stats Quick Bar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4 text-xs font-mono text-slate-400 w-full sm:w-auto">
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-500">Cadets:</span>
            <span className="font-bold text-white text-sm">{standings.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-2">
            <span className="text-slate-500">Total Points:</span>
            <span className="font-bold text-sky-400 text-sm">
              {standings.reduce((acc, c) => acc + (c.total_score || 0), 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search competitor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Main Standings Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                <th className="py-4 px-6 w-20 text-center">Rank</th>
                <th className="py-4 px-6">Competitor</th>
                <th className="py-4 px-6 text-center">Waves Cleared</th>
                <th className="py-4 px-6 text-right">Elapsed Time</th>
                <th className="py-4 px-6 text-right">Hints Cost</th>
                <th className="py-4 px-6 text-right">Total Verified Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-500">
                    <div className="text-3xl mb-2">⚡</div>
                    <div>No competitors registered yet.</div>
                    <div className="text-xs text-slate-600 mt-1">Run <span className="mono text-sky-400">cloudarena link &lt;token&gt;</span> to enter the arena.</div>
                  </td>
                </tr>
              ) : (
                filteredStandings.map((s) => {
                  let medal = `#${s.rank}`;
                  if (s.rank === 1) medal = "🥇";
                  if (s.rank === 2) medal = "🥈";
                  if (s.rank === 3) medal = "🥉";

                  return (
                    <tr key={s.handle} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 text-center font-bold text-slate-300 mono">
                        {medal}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-100 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-900 to-indigo-900 border border-sky-600/30 text-sky-300 flex items-center justify-center text-xs font-mono font-bold">
                          {s.handle.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="leading-tight">{s.handle}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{s.event_id || 'Global'}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                          s.waves_cleared >= 4 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                            : 'bg-sky-950/80 text-sky-300 border border-sky-800'
                        }`}>
                          {s.waves_cleared}/4 Cleared
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-slate-400 text-xs">
                        {formatTime(s.total_time || 0)}
                      </td>
                      <td className="py-4 px-6 text-right font-mono text-xs">
                        {s.total_hints_cost > 0 ? (
                          <span className="text-rose-400">-{s.total_hints_cost} pts</span>
                        ) : (
                          <span className="text-slate-500">0 pts</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-extrabold text-emerald-400 text-base mono">
                          {s.total_score} pts
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
