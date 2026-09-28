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
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <div 
            onClick={() => setActiveTab('leaderboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <Logo className="w-8 h-8 sm:w-9 sm:h-9 group-hover:scale-105 transition transform" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-sky-400 via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  CloudArena
                </span>
                <span className="hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  v2.0
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono truncate max-w-[160px] sm:max-w-xs">
                {eventConfig?.title || "Live Tournament"}
              </div>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'leaderboard'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Leaderboard</span>
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
              <span>Competitor Hub</span>
              {user?.arena_token && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'docs'
                  ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              <span>Field Guide</span>
            </button>

            <button
              onClick={() => setActiveTab('replay')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'replay'
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Film className="w-4 h-4 text-indigo-400" />
              <span>Replay</span>
            </button>

            <button
              onClick={() => setActiveTab('verify')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'verify'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verify</span>
            </button>

            {/* Admin Command tab - ONLY visible to verified organizers */}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                  activeTab === 'admin'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-950/40'
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                <span>Organizer Command</span>
              </button>
            )}

            <button
              onClick={() => setIsProjector(!isProjector)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 transition"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
            activeTab === 'leaderboard' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Rankings</span>
        </button>

        <button
          onClick={() => setActiveTab('hub')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition relative ${
            activeTab === 'hub' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Token Hub</span>
          {user?.arena_token && (
            <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-emerald-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'docs' ? 'text-sky-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Guide</span>
        </button>

        <button
          onClick={() => setActiveTab('replay')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'replay' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Replay</span>
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition ${
            activeTab === 'verify' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Verify</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition ${
              activeTab === 'admin' ? 'text-purple-400' : 'text-purple-400/60'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Organizer</span>
          </button>
        )}

        <button
          onClick={() => setIsProjector(!isProjector)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-200 transition"
        >
          <Tv className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Projector</span>
        </button>
      </nav>
    </>
  );
}
