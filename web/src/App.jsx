import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeaderboardView from './components/LeaderboardView';
import CompetitorHub from './components/CompetitorHub';
import AdminCommandCenter from './components/AdminCommandCenter';
import ProjectorMode from './components/ProjectorMode';
import { 
  loginWithGoogle, 
  logoutUser, 
  subscribeLeaderboard, 
  subscribeEventConfig,
  isFirebaseConfigured 
} from './firebase';
import { Terminal, Shield, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [user, setUser] = useState(null);
  const [standings, setStandings] = useState([]);
  const [eventConfig, setEventConfig] = useState(null);
  const [isProjector, setIsProjector] = useState(false);

  // Check saved local user session on mount
  useEffect(() => {
    const saved = localStorage.getItem('cloudarena_local_user');
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Subscribe to real-time leaderboard standings
  useEffect(() => {
    const unsubscribe = subscribeLeaderboard((data) => {
      setStandings(data);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Subscribe to event settings (freeze, active wave, etc.)
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
      setUser(profile);
      setActiveTab('hub');
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
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
    <div className="min-h-screen flex flex-col justify-between">
      
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
      />

      {/* Main Tab Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-grow">
        
        {/* Firebase Config Notice banner if running in local sandbox mode */}
        {!isFirebaseConfigured && (
          <div className="mb-6 p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs text-sky-200">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span>
                Running in <strong>Local Development Sandbox Mode</strong> (connecting to local FastAPI server & mock attestation).
              </span>
            </div>
            <span className="font-mono text-[11px] text-sky-400 font-bold hidden sm:inline">
              Option B Token Flow Active
            </span>
          </div>
        )}

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
            eventConfig={eventConfig}
          />
        )}

        {activeTab === 'admin' && (
          <AdminCommandCenter 
            eventConfig={eventConfig}
            standings={standings}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>CloudArena v0.2.0 • AI-Powered Sandboxed Kubernetes Incident Simulator</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>2,000 Concurrent Scale Architecture</span>
            <span>•</span>
            <span>HMAC Anti-Cheat Verified</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
