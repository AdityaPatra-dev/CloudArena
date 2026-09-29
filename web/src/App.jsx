import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeaderboardView from './components/LeaderboardView';
import CompetitorHub from './components/CompetitorHub';
import AdminCommandCenter from './components/AdminCommandCenter';
import ProjectorMode from './components/ProjectorMode';
import DocsFieldGuide from './components/DocsFieldGuide';
import ReplayViewer from './components/ReplayViewer';
import CredentialVerifier from './components/CredentialVerifier';
import Logo from './components/Logo';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeLeaderboard, 
  subscribeEventConfig,
  initAuthListener,
  isFirebaseConfigured 
} from './firebase';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [user, setUser] = useState(null);
  const [standings, setStandings] = useState([]);
  const [eventConfig, setEventConfig] = useState(null);
  const [isProjector, setIsProjector] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cloudarena_theme') || 'dark';
  });

  // Apply theme to documentElement & body
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark');
      body.classList.add('light-theme');
      body.classList.remove('dark');
    } else {
      root.classList.add('dark');
      root.classList.remove('light-theme');
      body.classList.add('dark');
      body.classList.remove('light-theme');
    }
    localStorage.setItem('cloudarena_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Persistent Auth Listener across page refreshes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verify')) {
      setActiveTab('verify');
    } else if (params.get('tab')) {
      setActiveTab(params.get('tab'));
    }

    const unsubscribe = initAuthListener((profile) => {
      setUser(profile);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Protect admin tab from non-admins
  useEffect(() => {
    if (activeTab === 'admin' && user?.role !== 'admin') {
      setActiveTab('leaderboard');
    }
  }, [activeTab, user]);

  // Subscribe to real-time leaderboard standings
  useEffect(() => {
    const unsubscribe = subscribeLeaderboard((data) => {
      setStandings(data);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to event settings (freeze, active wave, custom titles, timing)
  useEffect(() => {
    const unsubscribe = subscribeEventConfig((config) => {
      setEventConfig(config);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const profile = await loginWithGoogle();
      if (profile) {
        setUser(profile);
        setActiveTab('hub');
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setActiveTab('leaderboard');
  };

  if (isProjector) {
    return (
      <ProjectorMode 
        standings={standings} 
        eventConfig={eventConfig} 
        onClose={() => setIsProjector(false)} 
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between relative overflow-x-hidden cyber-grid selection:bg-cyan-500 selection:text-black">
      
      {/* Dynamic Ambient Background Glow Orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[130px] animate-floatSlow"></div>
        <div className="absolute top-1/4 -right-40 w-[30rem] h-[30rem] rounded-full bg-purple-600/10 blur-[150px] animate-floatReverse"></div>
        <div className="absolute bottom-10 left-1/3 w-80 h-80 rounded-full bg-emerald-500/8 blur-[120px] animate-pulseGlow"></div>
      </div>

      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        eventConfig={eventConfig}
        isProjector={isProjector}
        setIsProjector={setIsProjector}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Tab Body with animated view transitions */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-grow relative z-10">
        
        {/* Firebase Config Notice banner only if running in mock dev mode */}
        {!isFirebaseConfigured && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs text-sky-200 backdrop-blur shadow-lg shadow-sky-500/5 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>Running in <strong className="text-white">Local Development Sandbox Mode</strong></span>
            </div>
            <span className="font-mono text-[10px] text-sky-400 font-bold hidden sm:inline px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
              Option B Active
            </span>
          </div>
        )}

        <div key={activeTab} className="animate-fadeInUp">
          {activeTab === 'leaderboard' && (
            <LeaderboardView 
              standings={standings} 
              eventConfig={eventConfig} 
            />
          )}

          {activeTab === 'hub' && (
            <CompetitorHub 
              user={user} 
              onLogin={handleLogin}
              onUserUpdated={(updated) => setUser(updated)}
              eventConfig={eventConfig}
            />
          )}

          {activeTab === 'docs' && (
            <DocsFieldGuide />
          )}

          {activeTab === 'replay' && (
            <ReplayViewer />
          )}

          {activeTab === 'verify' && (
            <CredentialVerifier />
          )}

          {activeTab === 'admin' && user?.role === 'admin' && (
            <AdminCommandCenter 
              eventConfig={eventConfig}
              standings={standings}
              user={user}
            />
          )}
        </div>
      </main>

      {/* Futuristic Cyber Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/70 backdrop-blur-md py-4 sm:py-5 text-xs text-slate-500 font-mono relative z-10 hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Logo className="w-5 h-5 inline-block hover:rotate-12 transition-transform duration-300" />
            <span className="text-slate-300 font-medium">CloudArena v2.0</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">AI-Powered Sandboxed Kubernetes Incident Simulator</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Telemetry Online</span>
            </div>
            <span>•</span>
            <span>2,000+ Concurrent Scale</span>
            <span>•</span>
            <span className="text-sky-400">HMAC Anti-Cheat Verified 🛡️</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
