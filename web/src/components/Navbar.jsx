import React from 'react';
import { 
  Trophy, 
  UserCheck, 
  ShieldAlert, 
  Tv, 
  LogIn, 
  LogOut, 
  Terminal, 
  Radio, 
  Sparkles 
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  user, 
  onLogin, 
  onLogout, 
  eventConfig, 
  isProjector, 
  setIsProjector 
}) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-4">
          <div 
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition transform">
              <span className="text-xl">🌩️</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-sky-400 via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  CloudArena
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-wider">
                  2.0
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <span>{eventConfig?.title || "Live Tournament"}</span>
              </div>
            </div>
          </div>

          {/* Live broadcast pill */}
          <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/60">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              LIVE TOURNAMENT
            </span>
            {eventConfig?.is_frozen && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60 animate-pulse">
                ❄️ FROZEN
              </span>
            )}
          </div>
        </div>

        {/* Center: Navigation tabs */}
        <nav className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'leaderboard'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab('hub')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'hub'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Competitor Hub</span>
            {user?.arena_token && (
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'admin'
                ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Organizer Command</span>
          </button>

          <button
            onClick={() => setIsProjector(!isProjector)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
            title="Toggle Auditorium Projector Mode"
          >
            <Tv className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">Projector</span>
          </button>
        </nav>

        {/* Right: Auth User identity */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2.5">
              <img 
                src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                alt={user.displayName}
                className="w-8 h-8 rounded-full border border-sky-500/40 object-cover"
              />
              <div className="hidden md:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight">
                  {user.handle || user.displayName}
                </div>
                <div className="text-[10px] text-slate-400 mono">
                  {user.role === 'admin' ? (
                    <span className="text-purple-400 font-bold">ORGANIZER</span>
                  ) : (
                    <span className="text-emerald-400">CADET</span>
                  )}
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition rounded-lg hover:bg-slate-900/80"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition transform active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign in with Google</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
