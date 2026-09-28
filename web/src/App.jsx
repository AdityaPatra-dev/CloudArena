import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LeaderboardView from './components/LeaderboardView';
import CompetitorHub from './components/CompetitorHub';
import AdminCommandCenter from './components/AdminCommandCenter';
import ProjectorMode from './components/ProjectorMode';
import DocsFieldGuide from './components/DocsFieldGuide';
import ReplayViewer from './components/ReplayViewer';
import CredentialVerifier from './components/CredentialVerifier';
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
    <div className="min-h-screen flex flex-col justify-between selection:bg-sky-500 selection:text-white">
      
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 w-full flex-grow">
        
        {/* Firebase Config Notice banner only if running in mock dev mode */}
        {!isFirebaseConfigured && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-center justify-between text-xs text-sky-200">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-sky-500/20 text-sky-400">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>Running in <strong>Local Development Sandbox Mode</strong></span>
            </div>
            <span className="font-mono text-[10px] text-sky-400 font-bold hidden sm:inline">
              Option B Active
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
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-5 text-center text-xs text-slate-500 font-mono hidden md:block">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div>CloudArena v0.2.0 • AI-Powered Sandboxed Kubernetes Incident Simulator</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>2,000+ Concurrent Scale</span>
            <span>•</span>
            <span>HMAC Anti-Cheat Verified</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
