import React from 'react';
import { 
  Trophy, 
  UserCheck, 
  ShieldAlert, 
  Tv, 
  LogIn, 
  LogOut, 
  Radio,
  BookOpen,
  Film,
  ShieldCheck
} from 'lucide-react';
import Logo from './Logo';

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
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#060a15]/85 backdrop-blur-xl sticky top-0 z-40 transition-all duration-300 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <div 
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <Logo className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]" />
              <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-cyan-400 via-sky-200 to-indigo-400 bg-clip-text text-transparent group-hover:from-white group-hover:to-cyan-300 transition-colors">
                  CloudArena
                </span>
                <span className="hidden sm:inline-block text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 font-mono shadow-sm shadow-cyan-500/20">
                  v2.0
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono truncate max-w-[160px] sm:max-w-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="truncate">{eventConfig?.title || "Live Tournament"}</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-slate-950/70 border border-slate-800/80 backdrop-blur">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'leaderboard'
                  ? 'bg-gradient-to-r from-amber-500/20 via-sky-500/15 to-transparent text-amber-300 border border-amber-500/40 shadow-glow-amber'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400 animate-bounce" style={{ animationDuration: '3s' }} />
              <span>Leaderboard</span>
            </button>

            <button
              onClick={() => setActiveTab('hub')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'hub'
                  ? 'bg-gradient-to-r from-cyan-500/20 via-sky-500/15 to-transparent text-cyan-300 border border-cyan-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Competitor Hub</span>
              {user?.arena_token && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'docs'
                  ? 'bg-gradient-to-r from-sky-500/20 via-blue-500/15 to-transparent text-sky-300 border border-sky-500/40 shadow-glow-cyan'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Field Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('replay')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'replay'
                  ? 'bg-gradient-to-r from-indigo-500/20 via-purple-500/15 to-transparent text-indigo-300 border border-indigo-500/40 shadow-glow-purple'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Film className="w-4 h-4 text-indigo-400" />
              <span>Replay</span>
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === 'verify'
                  ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-transparent text-emerald-300 border border-emerald-500/40 shadow-glow-emerald'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify</span>
            </button>

            {/* Admin Command tab - ONLY visible to verified organizers */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  activeTab === 'admin'
                    ? 'bg-gradient-to-r from-purple-500/25 via-fuchsia-500/15 to-transparent text-purple-200 border border-purple-500/50 shadow-glow-purple'
                    : 'text-purple-300/70 hover:text-purple-200 hover:bg-purple-950/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-400 animate-pulse" />
                <span>Organizer Command</span>
              </button>
            )}

            <button
              onClick={() => setIsProjector(!isProjector)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-900/80 transition-all duration-200 border border-transparent hover:border-slate-800"
              title="Toggle Auditorium Projector Mode"
            >
              <Tv className="w-3.5 h-3.5 text-indigo-400" />
              <span>Projector</span>
            </button>
          </nav>

          {/* User Auth Info */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <img 
                  src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"} 
                  alt={user.displayName}
                  className="w-8 h-8 rounded-full border border-sky-500/40 object-cover"
                />
                <div className="hidden sm:block text-left">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.handle || user.displayName}
                  </div>
                  <div className="text-[10px] text-slate-400 mono">
                    {isAdmin ? (
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
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/20 transition transform active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign in</span>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#060a15]/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-2 flex items-center justify-around shadow-2xl shadow-black">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-200 ${
            activeTab === 'leaderboard' 
              ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)] scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-bold">Rankings</span>
        </button>

        <button
          onClick={() => setActiveTab('hub')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-200 relative ${
            activeTab === 'hub' 
              ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Token Hub</span>
          {user?.arena_token && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 ${
            activeTab === 'docs' 
              ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-bold">Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('replay')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 ${
            activeTab === 'replay' 
              ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)] scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] font-bold">Replay</span>
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all duration-200 ${
            activeTab === 'verify' 
              ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)] scale-105' 
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-bold">Verify</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all duration-200 ${
              activeTab === 'admin' 
                ? 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)] scale-105' 
                : 'text-purple-400/60'
            }`}
          >
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span className="text-[10px] font-bold">Organizer</span>
          </button>
        )}

        <button
          onClick={() => setIsProjector(!isProjector)}
          className="flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl text-slate-400 hover:text-slate-200 transition"
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-medium">Projector</span>
        </button>
      </nav>
    </>
  );
}
