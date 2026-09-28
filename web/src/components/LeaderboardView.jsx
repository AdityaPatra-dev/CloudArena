import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Flame, 
  Clock, 
  ShieldCheck, 
  Search, 
  Snowflake, 
  Sparkles,
  Award,
  Users,
  User,
  Shield,
  Zap
} from 'lucide-react';
import { subscribeTeamStandings, getSimulatedTeamStandings } from '../firebase';

export default function LeaderboardView({ standings = [], eventConfig }) {
  const [activeTab, setActiveTab] = useState('solo'); // 'solo' | 'teams'
  const [searchTerm, setSearchTerm] = useState('');
  const [teamStandings, setTeamStandings] = useState([]);

  useEffect(() => {
    const unsub = subscribeTeamStandings((data) => {
      setTeamStandings(data || []);
    }, eventConfig?.event_id || "HACKATHON_2026");
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [eventConfig?.event_id]);

  const filteredSolo = standings.filter(s => 
    s.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.event_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTeams = teamStandings.filter(t => 
    t.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.team_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.members?.some(m => m.handle?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (totalSeconds = 0) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs}s`;
  };

  const top1Solo = standings[0];
  const top2Solo = standings[1];
  const top3Solo = standings[2];

  const top1Team = teamStandings[0];
  const top2Team = teamStandings[1];
  const top3Team = teamStandings[2];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-16 md:pb-0">

      {/* Freeze Alert Banner */}
      {eventConfig?.is_frozen && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 via-sky-500/10 to-indigo-500/20 border border-amber-500/40 p-4 sm:p-5 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Snowflake className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <div className="font-bold text-amber-300 text-sm sm:text-base flex items-center gap-2">
                Scoreboard Frozen for Final Showdown!
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                {eventConfig.freeze_message || "Submissions are registered secretly. Winners will be unveiled at closing ceremonies!"}
              </div>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/30 text-amber-200 border border-amber-500/40 shrink-0">
            FINAL HOUR FREEZE
          </span>
        </div>
      )}

      {/* Solo vs Squad View Toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="inline-flex p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg">
          <button
            onClick={() => setActiveTab('solo')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'solo'
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Solo Cadets ({standings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Squad Standings (CTF) ({teamStandings.length})</span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'solo' ? "Search cadet handle..." : "Search squad or cadet..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* ===================== SOLO CADETS VIEW ===================== */}
      {activeTab === 'solo' && (
        <>
          {/* Top Podium Showcase */}
          {standings.length >= 3 && !eventConfig?.is_frozen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1 sm:pt-4">
              
              {/* 1st Place - Gold Champion */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900/80 to-slate-900/80 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-6 relative overflow-hidden backdrop-blur shadow-2xl shadow-amber-500/10 flex flex-col justify-between transform md:-translate-y-2 hover:border-amber-400 transition">
                <div className="absolute -right-3 -bottom-3 text-7xl sm:text-8xl opacity-15">🥇</div>
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      TOURNAMENT LEADER
                    </span>
                    <span className="text-2xl sm:text-3xl">🥇</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                    @{top1Solo.handle}
                  </div>
                  <div className="text-xs text-amber-200/80 mt-1 font-mono">
                    {top1Solo.waves_cleared}/8 Waves • Clock: {formatTime(top1Solo.total_time)}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-baseline justify-between">
                  <span className="text-xs text-amber-400/80 uppercase font-mono font-bold">Verified Score</span>
                  <span className="text-2xl sm:text-3xl font-black text-amber-400 mono">{top1Solo.total_score} pts</span>
                </div>
              </div>

              {/* 2nd Place - Silver */}
              <div className="order-2 md:order-1 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between hover:border-slate-500 transition">
                <div className="absolute -right-3 -bottom-3 text-6xl sm:text-7xl opacity-10">🥈</div>
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-slate-800 text-slate-300 border border-slate-600">
                      RANK #2 • SILVER
                    </span>
                    <span className="text-xl sm:text-2xl">🥈</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-100">
                    @{top2Solo.handle}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {top2Solo.waves_cleared}/8 Waves • {formatTime(top2Solo.total_time)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 uppercase font-mono">Net Score</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-200 mono">{top2Solo.total_score} pts</span>
                </div>
              </div>

              {/* 3rd Place - Bronze */}
              <div className="order-3 md:order-3 bg-slate-900/60 border border-amber-900/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between hover:border-amber-700/60 transition">
                <div className="absolute -right-3 -bottom-3 text-6xl sm:text-7xl opacity-10">🥉</div>
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                      RANK #3 • BRONZE
                    </span>
                    <span className="text-xl sm:text-2xl">🥉</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-100">
                    @{top3Solo.handle}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {top3Solo.waves_cleared}/8 Waves • {formatTime(top3Solo.total_time)}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 uppercase font-mono">Net Score</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-500/90 mono">{top3Solo.total_score} pts</span>
                </div>
              </div>

            </div>
          )}

          {/* Desktop Solo Table */}
          <div className="hidden sm:block bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur">
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
                  {filteredSolo.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-16 text-center text-slate-500">
                        <div className="text-3xl mb-2">⚡</div>
                        <div>No competitors registered yet.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredSolo.map((s) => {
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
                            <span className="leading-tight">@{s.handle}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
                              s.waves_cleared >= 5 
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' 
                                : 'bg-sky-950/80 text-sky-300 border border-sky-800'
                            }`}>
                              {s.waves_cleared}/8 Cleared
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

          {/* Mobile Solo Cards */}
          <div className="sm:hidden space-y-2.5">
            {filteredSolo.map((s) => (
              <div key={s.handle} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base w-6 text-center text-slate-300">
                    {s.rank === 1 ? "🥇" : s.rank === 2 ? "🥈" : s.rank === 3 ? "🥉" : `#${s.rank}`}
                  </span>
                  <div>
                    <div className="font-bold text-sm text-slate-100">@{s.handle}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {s.waves_cleared}/8 Waves • {formatTime(s.total_time)}
                    </div>
                  </div>
                </div>
                <div className="font-mono font-black text-emerald-400 text-base">
                  {s.total_score} <span className="text-[10px] font-normal text-slate-500">pts</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ===================== SQUAD STANDINGS (CTF) VIEW ===================== */}
      {activeTab === 'teams' && (
        <>
          {/* Top Podium Showcase for Squads */}
          {teamStandings.length >= 3 && !eventConfig?.is_frozen && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 pt-1 sm:pt-4">
              
              {/* 1st Place Squad */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-purple-950/50 via-slate-900/80 to-slate-900/80 border-2 border-purple-500/60 rounded-2xl p-4 sm:p-6 relative overflow-hidden backdrop-blur shadow-2xl shadow-purple-500/10 flex flex-col justify-between transform md:-translate-y-2 hover:border-purple-400 transition">
                <div className="absolute -right-3 -bottom-3 text-7xl sm:text-8xl opacity-15">👑</div>
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-purple-400" />
                      CHAMPION SQUAD
                    </span>
                    <span className="text-2xl sm:text-3xl">🥇</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
                    {top1Team.team_name}
                  </div>
                  <div className="text-xs text-purple-300/80 mt-1 font-mono">
                    {top1Team.waves_cleared || 0}/8 Waves Cleared • {top1Team.member_count || (top1Team.members?.length || 1)} Operators
                  </div>
                  {top1Team.members && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {top1Team.members.map(m => (
                        <span key={m.handle} className="px-2 py-0.5 rounded-md bg-purple-950/80 text-[10px] text-purple-200 border border-purple-800/60 font-mono">
                          @{m.handle} <span className="opacity-75">({m.role})</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-purple-500/20 flex items-baseline justify-between">
                  <span className="text-xs text-purple-400 uppercase font-mono font-bold">Squad Score</span>
                  <span className="text-2xl sm:text-3xl font-black text-purple-300 mono">{top1Team.total_score} pts</span>
                </div>
              </div>

              {/* 2nd Place Squad */}
              <div className="order-2 md:order-1 bg-slate-900/60 border border-slate-700/60 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between hover:border-slate-500 transition">
                <div className="absolute -right-3 -bottom-3 text-6xl sm:text-7xl opacity-10">🥈</div>
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-slate-800 text-slate-300 border border-slate-600">
                      RANK #2 • SILVER
                    </span>
                    <span className="text-xl sm:text-2xl">🥈</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-100">
                    {top2Team.team_name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {top2Team.waves_cleared || 0}/8 Waves • {top2Team.member_count || (top2Team.members?.length || 1)} Operators
                  </div>
                  {top2Team.members && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {top2Team.members.map(m => (
                        <span key={m.handle} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 border border-slate-700 font-mono">
                          @{m.handle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 uppercase font-mono">Squad Score</span>
                  <span className="text-xl sm:text-2xl font-black text-slate-200 mono">{top2Team.total_score} pts</span>
                </div>
              </div>

              {/* 3rd Place Squad */}
              <div className="order-3 md:order-3 bg-slate-900/60 border border-amber-900/50 rounded-2xl p-4 sm:p-5 relative overflow-hidden backdrop-blur flex flex-col justify-between hover:border-amber-700/60 transition">
                <div className="absolute -right-3 -bottom-3 text-6xl sm:text-7xl opacity-10">🥉</div>
                <div>
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-bold bg-amber-950/60 text-amber-400 border border-amber-800/60">
                      RANK #3 • BRONZE
                    </span>
                    <span className="text-xl sm:text-2xl">🥉</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold text-slate-100">
                    {top3Team.team_name}
                  </div>
                  <div className="text-xs text-slate-400 mt-1 font-mono">
                    {top3Team.waves_cleared || 0}/8 Waves • {top3Team.member_count || (top3Team.members?.length || 1)} Operators
                  </div>
                  {top3Team.members && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {top3Team.members.map(m => (
                        <span key={m.handle} className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-300 border border-slate-700 font-mono">
                          @{m.handle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 uppercase font-mono">Squad Score</span>
                  <span className="text-xl sm:text-2xl font-black text-amber-400/90 mono">{top3Team.total_score} pts</span>
                </div>
              </div>

            </div>
          )}

          {/* Desktop Squad Table */}
          <div className="hidden sm:block bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60">
                    <th className="py-4 px-6 w-20 text-center">Rank</th>
                    <th className="py-4 px-6">Squad Name</th>
                    <th className="py-4 px-6">Operators & Roles</th>
                    <th className="py-4 px-6 text-center">Waves Cleared</th>
                    <th className="py-4 px-6 text-right">Combined Squad Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-16 text-center text-slate-500">
                        <div className="text-3xl mb-2">👥</div>
                        <div>No squads enlisted yet. Form a squad in Competitor Passport!</div>
                      </td>
                    </tr>
                  ) : (
                    filteredTeams.map((t) => {
                      let medal = `#${t.rank}`;
                      if (t.rank === 1) medal = "🥇";
                      if (t.rank === 2) medal = "🥈";
                      if (t.rank === 3) medal = "🥉";

                      return (
                        <tr key={t.team_id} className="hover:bg-slate-800/40 transition">
                          <td className="py-4 px-6 text-center font-bold text-slate-300 mono">
                            {medal}
                          </td>
                          <td className="py-4 px-6">
                            <div className="font-bold text-white flex items-center gap-2">
                              <Shield className="w-4 h-4 text-purple-400" />
                              <span>{t.team_name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              ID: {t.team_id}
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex flex-wrap gap-1.5 max-w-md">
                              {(t.members || []).map((m) => (
                                <span 
                                  key={m.handle} 
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-800/80 text-[11px] font-mono border border-slate-700 text-slate-200"
                                >
                                  <span className="font-bold">@{m.handle}</span>
                                  <span className="text-[10px] text-sky-400 font-normal">({m.role || 'Operator'})</span>
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-purple-950/80 text-purple-300 border border-purple-800">
                              {t.waves_cleared || 0}/8 Cleared
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <span className="font-extrabold text-purple-400 text-base mono">
                              {t.total_score} pts
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

          {/* Mobile Squad Cards */}
          <div className="sm:hidden space-y-2.5">
            {filteredTeams.map((t) => (
              <div key={t.team_id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-300">
                      {t.rank === 1 ? "🥇" : t.rank === 2 ? "🥈" : t.rank === 3 ? "🥉" : `#${t.rank}`}
                    </span>
                    <span className="font-bold text-white text-sm">{t.team_name}</span>
                  </div>
                  <div className="font-mono font-black text-purple-400 text-base">
                    {t.total_score} pts
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {t.waves_cleared || 0}/8 Waves Cleared • {t.members?.length || 1} Cadets
                </div>
                {t.members && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.members.map(m => (
                      <span key={m.handle} className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                        @{m.handle} ({m.role})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
}
