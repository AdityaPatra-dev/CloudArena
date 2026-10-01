import React, { useState } from 'react';
import { 
  Key, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Sparkles, 
  ExternalLink, 
  Eye, 
  EyeOff,
  LogIn,
  AlertCircle,
  HelpCircle,
  Shield,
  CheckCircle2,
  Users,
  UserPlus,
  LogOut,
  Award,
  Zap
} from 'lucide-react';
import { elevateToAdmin, createOrJoinSquad, leaveSquad } from '../firebase';
import CertificateModal from './CertificateModal';
import Logo from './Logo';
import ContinuousTelemetryMonitor from './ContinuousTelemetryMonitor';
import InteractiveTerminalSimulator from './InteractiveTerminalSimulator';

export default function CompetitorHub({ user, onLogin, onUserUpdated, eventConfig }) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [copiedInstall, setCopiedInstall] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [selectedOs, setSelectedOs] = useState('linux'); // 'linux' | 'windows'
  const [passcode, setPasscode] = useState('');
  const [passcodeStatus, setPasscodeStatus] = useState(null); // null | 'success' | 'error'

  // Squad State
  const [squadTab, setSquadTab] = useState('create'); // 'create' | 'join'
  const [squadName, setSquadName] = useState('');
  const [squadCode, setSquadCode] = useState('');
  const [squadRole, setSquadRole] = useState('Captain');
  const [copiedSquadCmd, setCopiedSquadCmd] = useState(false);
  const [squadSubmitting, setSquadSubmitting] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [cliMode, setCliMode] = useState('standard'); // 'standard' | 'zeropath'
  const [copiedPathFix, setCopiedPathFix] = useState(false);

  const token = user?.arena_token || "ca_live_sandbox_cadet_2026";
  const eventId = eventConfig?.event_id || "HACKATHON_2026";
  const linkCommand = cliMode === 'zeropath'
    ? (selectedOs === 'windows' ? `python -m cloudarena link ${token} --event ${eventId}` : `python3 -m cloudarena link ${token} --event ${eventId}`)
    : `cloudarena link ${token} --event ${eventId}`;
  const pathExportSnippet = 'export PATH="$HOME/.local/bin:$PATH"';

  const installCommand = selectedOs === 'windows' 
    ? "pip install https://github.com/AdityaPatra-dev/CloudArena/archive/refs/heads/main.zip"
    : "curl -sSL https://gdg-cloudarena.web.app/install.sh | bash";

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleElevate = async (e) => {
    e.preventDefault();
    if (!user) return;
    const updated = await elevateToAdmin(user, passcode);
    if (updated) {
      setPasscodeStatus('success');
      if (onUserUpdated) onUserUpdated(updated);
    } else {
      setPasscodeStatus('error');
    }
  };

  const handleSquadSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      if (onLogin) onLogin();
      return;
    }
    setSquadSubmitting(true);
    try {
      const code = squadTab === 'join' ? squadCode : null;
      const name = squadTab === 'create' ? squadName : null;
      const updated = await createOrJoinSquad(user, name, code, squadRole, eventId);
      if (updated && onUserUpdated) {
        onUserUpdated(updated);
      }
      setSquadName('');
      setSquadCode('');
    } catch (err) {
      console.warn("Error enlisting in squad:", err);
    } finally {
      setSquadSubmitting(false);
    }
  };

  const handleSquadLeave = async () => {
    if (!user) return;
    setSquadSubmitting(true);
    try {
      const updated = await leaveSquad(user, eventId);
      if (updated && onUserUpdated) {
        onUserUpdated(updated);
      }
    } catch (err) {
      console.warn("Error leaving squad:", err);
    } finally {
      setSquadSubmitting(false);
    }
  };

  const maskedToken = showToken ? token : `${token.substring(0, 7)}••••••••••••••••${token.substring(token.length - 4)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 animate-fadeIn pb-16 md:pb-0">
      
      {/* If Not Logged In: Sign-in Hero Banner */}
      {!user ? (
        <div className="p-6 sm:p-10 bg-slate-900/70 border border-cyan-500/30 rounded-3xl backdrop-blur-xl text-center shadow-[0_0_50px_rgba(0,212,255,0.12)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
          <Logo className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 animate-floatSlow filter drop-shadow-[0_0_20px_rgba(0,212,255,0.45)]" />
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight bg-gradient-to-r from-white via-cyan-100 to-sky-300 bg-clip-text text-transparent">
            Competitor Identity & Token Passport
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Sign in with your Google account to mint your personal Arena Token. Link your local laptop cluster to stream telemetry and compete on the live leaderboard.
          </p>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-xl shadow-cyan-500/25 hover:shadow-[0_0_25px_rgba(0,240,255,0.4)] transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign in with Google</span>
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-cyan-500/20 hover:border-cyan-400/40 transition-all">
              <div className="text-cyan-400 font-bold text-xs uppercase mono mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                01. Zero Cost
              </div>
              <div className="text-[11px] text-slate-400">Sandboxed 3-node cluster runs locally on your laptop via k3d.</div>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 transition-all">
              <div className="text-indigo-400 font-bold text-xs uppercase mono mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                02. Anti-Cheat
              </div>
              <div className="text-[11px] text-slate-400">K8s secret nonces and HMAC proofs secure all verified score posts.</div>
            </div>
            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-emerald-500/20 hover:border-emerald-400/40 transition-all">
              <div className="text-emerald-400 font-bold text-xs uppercase mono mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                03. AI SRE RCA
              </div>
              <div className="text-[11px] text-slate-400">Automated post-mortems and multi-tier progressive hints.</div>
            </div>
          </div>
        </div>
      ) : (
        /* Competitor Passport Card (When Logged In) */
        <div className="bg-[#0b1022]/80 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden transition-all duration-300 group">
          <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60"></div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="relative">
                <img 
                  src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
                  alt={user.displayName}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ring-2 ring-cyan-400/50 ring-offset-2 ring-offset-[#080d1a] shadow-lg shadow-cyan-500/20 object-cover shrink-0 group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b1022] flex items-center justify-center shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight group-hover:text-cyan-200 transition-colors">
                    {user.displayName}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    user.role === 'admin' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20' 
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-500/20'
                  }`}>
                    {user.role === 'admin' ? 'ORGANIZER' : 'COMPETITOR'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[240px] sm:max-w-md">
                  @{user.handle || 'cadet'} • {user.email}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowCertModal(true)}
                className="shimmer-badge px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 hover:scale-[1.02] active:scale-95"
              >
                <Award className="w-4 h-4 text-amber-400 animate-pulseGlow" />
                <span>SRE Certificate & Badge</span>
              </button>
              <div className="px-3.5 py-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 flex items-center gap-2 text-xs font-bold text-emerald-300 shadow-sm shadow-emerald-500/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Passport Armed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Continuous Telemetry & Cluster Pulse */}
      <ContinuousTelemetryMonitor />

      {/* Arena Token Hub (Option B) */}
      <div className="bg-gradient-to-b from-[#0b1022]/90 via-[#080d1a]/95 to-[#050811]/95 border border-cyan-500/30 hover:border-cyan-400/50 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-cyan-500/10 space-y-6 transition-all duration-300">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-500/25 shrink-0">
                <Key className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-lg flex items-center gap-2">
                  <span>Personal Arena Token</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">HMAC-SHA256</span>
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Used by your local CLI to cryptographically authenticate wave completions</p>
              </div>
            </div>

            <button
              onClick={() => setShowToken(!showToken)}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 rounded-xl border border-transparent hover:border-slate-700 transition"
              title={showToken ? "Hide Token" : "Reveal Token"}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Token Display Box */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3.5 rounded-2xl bg-[#050811] border border-cyan-500/25 font-mono text-xs sm:text-sm text-cyan-300 shadow-inner">
            <span className="truncate select-all break-all tracking-wide">{maskedToken}</span>
            <button
              onClick={() => copyToClipboard(token, setCopiedToken)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition shrink-0 border border-slate-700 shadow-sm"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Token</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Operating System & Execution Mode Selectors */}
        <div className="pt-2 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              1. Choose Laptop Environment:
            </span>
            <div className="flex items-center gap-1 bg-[#050811] p-1 rounded-xl border border-slate-800 text-xs font-semibold w-fit">
              <button
                onClick={() => setSelectedOs('linux')}
                className={`px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  selectedOs === 'linux' ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white shadow-md shadow-cyan-600/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🐧 Linux / macOS</span>
              </button>
              <button
                onClick={() => setSelectedOs('windows')}
                className={`px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  selectedOs === 'windows' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🪟 Windows (PowerShell)</span>
              </button>
            </div>
          </div>

          {/* Execution Mode Selector (Standard vs Zero-PATH) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              2. Command Execution Style:
            </span>
            <div className="flex items-center gap-1 bg-[#050811] p-1 rounded-xl border border-slate-800 text-xs font-semibold w-fit">
              <button
                onClick={() => setCliMode('standard')}
                className={`px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  cliMode === 'standard' ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-600/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Standard (cloudarena)</span>
              </button>
              <button
                onClick={() => setCliMode('zeropath')}
                className={`px-3 py-1 rounded-lg transition-all duration-200 flex items-center gap-1.5 ${
                  cliMode === 'zeropath' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/30 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Zero-PATH (python3 -m)</span>
              </button>
            </div>
          </div>

          {/* Quick Install Snippet */}
          <div className="p-4 rounded-2xl bg-[#060a16] border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-[11px] font-bold flex items-center justify-center">1</span>
                <span>Install CloudArena CLI (if not installed yet)</span>
              </span>
              <button
                onClick={() => copyToClipboard(installCommand, setCopiedInstall)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 transition"
              >
                {copiedInstall ? "✓ Copied!" : "Copy Install Command"}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#03060c] border border-cyan-500/20 font-mono text-xs text-cyan-300 overflow-x-auto select-all">
              {installCommand}
            </div>

            {selectedOs === 'windows' ? (
              <div className="text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Windows:</strong> Run in PowerShell. Make sure Docker Desktop is running with WSL2 enabled.
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  💡 If you see <code className="text-amber-300">command not found: cloudarena</code>, either use the <span className="text-emerald-400 font-bold">Zero-PATH</span> toggle above or export your PATH:
                </div>
                <button
                  onClick={() => copyToClipboard(pathExportSnippet, setCopiedPathFix)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono shrink-0 transition flex items-center gap-1"
                >
                  {copiedPathFix ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPathFix ? "Copied PATH Export!" : "Copy PATH Fix"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Terminal Snippet */}
        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Link Your Terminal to the Tournament</span>
            </span>
            <span className="text-slate-500 text-[11px] normal-case hidden sm:inline">Paste into terminal</span>
          </div>

          <div className="relative group">
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#03060c] border border-emerald-500/30 font-mono text-xs sm:text-sm text-emerald-400 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-x-auto shadow-inner">
              <code className="break-all">{selectedOs === 'windows' ? '> ' : '$ '}{linkCommand}</code>
              <button
                onClick={() => copyToClipboard(linkCommand, setCopiedCmd)}
                className="shrink-0 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-95"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Command</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Squad Passport (Co-op CTF Mode) */}
      <div className="bg-gradient-to-b from-purple-950/30 via-[#0b1022]/90 to-[#060a15]/95 border border-purple-500/40 hover:border-purple-400/60 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-purple-500/10 space-y-6 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-sm shadow-purple-500/25 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">Squad Passport (CTF Team Mode)</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20">
                  CO-OP ENABLED
                </span>
              </div>
              <p className="text-xs text-slate-400">Team up with fellow engineers. Incident clearances and points aggregate into squad standings!</p>
            </div>
          </div>

          {user?.team_id && (
            <button
              onClick={handleSquadLeave}
              disabled={squadSubmitting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:shadow-rose-500/20"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Squad</span>
            </button>
          )}
        </div>

        {!user ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-purple-200">Co-op Squad Mode Enlistment</div>
              <div className="text-xs text-slate-400 mt-1">
                Sign in with Google to create or join a squad with your teammates and aggregate scores on the live leaderboard.
              </div>
            </div>
            <button
              onClick={onLogin}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In to Enlist</span>
            </button>
          </div>
        ) : user.team_id ? (
          /* Active Squad State */
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/40 border border-purple-500/40 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#060a16] p-3.5 rounded-xl border border-purple-500/30">
                <div className="text-[10px] text-purple-400 font-mono uppercase font-bold tracking-wider">Enlisted Squad</div>
                <div className="text-base font-bold text-white flex items-center gap-2 mt-0.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>{user.team_name || user.team_id}</span>
                </div>
              </div>
              <div className="bg-[#060a16] p-3.5 rounded-xl border border-purple-500/30">
                <div className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wider">Squad Code (Share with Teammates)</div>
                <div className="text-sm font-mono font-bold text-cyan-300 mt-1 select-all">
                  {user.team_id}
                </div>
              </div>
              <div className="bg-[#060a16] p-3.5 rounded-xl border border-purple-500/30">
                <div className="text-[10px] text-emerald-400 font-mono uppercase font-bold tracking-wider">Your Operational Role</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {user.team_role || "Operator"}
                </div>
              </div>
            </div>

            {/* Quick CLI Squad Link Command */}
            <div className="p-3.5 rounded-xl bg-[#03060c] border border-purple-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="text-purple-300 truncate">
                <span className="text-slate-500">$ </span>
                {cliMode === 'zeropath' ? (selectedOs === 'windows' ? `python -m cloudarena link ${token} --team ${user.team_id}` : `python3 -m cloudarena link ${token} --team ${user.team_id}`) : `cloudarena link ${token} --team ${user.team_id}`}
              </div>
              <button
                onClick={() => copyToClipboard(cliMode === 'zeropath' ? (selectedOs === 'windows' ? `python -m cloudarena link ${token} --team ${user.team_id}` : `python3 -m cloudarena link ${token} --team ${user.team_id}`) : `cloudarena link ${token} --team ${user.team_id}`, setCopiedSquadCmd)}
                className="px-3.5 py-1.5 rounded-lg bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs shrink-0 flex items-center justify-center gap-1.5 transition border border-purple-700/50 shadow-sm"
              >
                {copiedSquadCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSquadCmd ? "Copied!" : "Copy Squad Command"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Join / Create Squad Form */
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800/90 pb-2.5">
              <button
                onClick={() => setSquadTab('create')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  squadTab === 'create'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Squad</span>
              </button>
              <button
                onClick={() => setSquadTab('join')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                  squadTab === 'join'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join with Squad Code</span>
              </button>
            </div>

            <form onSubmit={handleSquadSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {squadTab === 'create' ? (
                <div>
                  <label className="text-[11px] font-mono text-purple-300 block mb-1 font-semibold">Squad Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titan SRE Vanguard"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-purple-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400 focus:ring-1 focus:ring-purple-400 font-medium transition"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-mono text-cyan-300 block mb-1 font-semibold">Squad Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQ_TITAN"
                    value={squadCode}
                    onChange={(e) => setSquadCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-cyan-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono uppercase transition"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono text-slate-300 block mb-1 font-semibold">Your Operational Role</label>
                <select
                  value={squadRole}
                  onChange={(e) => setSquadRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#050811] border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-400 font-medium transition"
                >
                  <option value="Captain">Squad Captain</option>
                  <option value="SRE Lead">SRE Lead</option>
                  <option value="Chaos Specialist">Chaos Specialist</option>
                  <option value="Triage Engineer">Triage Engineer</option>
                  <option value="Platform Architect">Platform Architect</option>
                  <option value="Operator">General Operator</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={squadSubmitting}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50"
                >
                  {squadSubmitting ? "Enlisting..." : squadTab === 'create' ? "Create Squad & Join" : "Join Squad"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Organizer Verification Card */}
      {user && user.role !== 'admin' && (
        <div className="p-5 sm:p-6 rounded-3xl bg-[#0b1022]/80 border border-purple-500/30 hover:border-purple-400/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl transition-all duration-300">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/40 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Are you a Tournament Organizer?</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">ORGANIZER KEY</span>
              </div>
              <div className="text-xs text-slate-400">Enter your organizer passcode to unlock master tournament controls.</div>
            </div>
          </div>

          <form onSubmit={handleElevate} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="password"
              placeholder="Organizer Key"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-[#050811] border border-purple-500/40 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 flex-1 sm:w-40 font-mono transition"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-md shadow-purple-600/30 hover:scale-105 active:scale-95"
            >
              Verify
            </button>
          </form>
          {passcodeStatus === 'error' && (
            <div className="text-xs text-rose-400 font-mono">Invalid passcode. (Default: admin2026)</div>
          )}
          {passcodeStatus === 'success' && (
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified! Access Granted.
            </div>
          )}
        </div>
      )}

      {/* Interactive CLI & Chaos Simulator */}
      <InteractiveTerminalSimulator />

      {/* Terminal Battle Protocol Step-by-Step */}
      <div className="bg-[#0b1022]/80 border border-slate-800 hover:border-cyan-500/30 rounded-3xl p-5 sm:p-8 space-y-5 sm:space-y-6 shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Complete 4-Step Hackathon Battle Guide (3D Pipeline)</span>
          </h3>
          <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full">
            {cliMode === 'zeropath' ? 'Mode: Zero-PATH Direct' : 'Mode: Standard CLI'}
          </span>
        </div>

        {/* 3D Animated Battle Pipeline Showcase */}
        <div className="w-full rounded-2xl overflow-hidden border border-cyan-500/30 shadow-2xl shadow-cyan-500/10 bg-[#040711] group">
          <img 
            src="/assets/battle_loop_3d.svg" 
            alt="3D Animated Battle Loop Pipeline" 
            className="w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.01]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <div className="p-4 rounded-2xl bg-[#060a16] border border-slate-800/90 hover:border-cyan-500/50 hover:-translate-y-1.5 hover:shadow-glow-cyan transition-all duration-300 space-y-2 group">
            <div className="text-xs font-mono font-black text-cyan-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">01</span>
              <span>INSTALL & LINK</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">Terminal Handshake</div>
            <div className="text-xs text-cyan-300 font-mono bg-[#03060c] p-2.5 rounded-xl border border-cyan-500/20 overflow-x-auto select-all">
              {cliMode === 'zeropath' ? 'python3 -m cloudarena link' : 'cloudarena link <token>'}
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">Connects your laptop environment to this tournament account.</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#060a16] border border-slate-800/90 hover:border-cyan-500/50 hover:-translate-y-1.5 hover:shadow-glow-cyan transition-all duration-300 space-y-2 group">
            <div className="text-xs font-mono font-black text-sky-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-500/20 flex items-center justify-center text-[10px]">02</span>
              <span>START CLUSTER</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">Launch 3-Node Mesh</div>
            <div className="text-xs text-sky-300 font-mono bg-[#03060c] p-2.5 rounded-xl border border-sky-500/20 overflow-x-auto select-all">
              {cliMode === 'zeropath' ? 'python3 -m cloudarena start' : 'cloudarena start'}
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">Spins up 3-node k3d cluster and microservices ($0 compute cost).</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#060a16] border border-slate-800/90 hover:border-amber-500/50 hover:-translate-y-1.5 hover:shadow-glow-amber transition-all duration-300 space-y-2 group">
            <div className="text-xs font-mono font-black text-amber-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-[10px]">03</span>
              <span>FIGHT CHAOS</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">Trigger Incident</div>
            <div className="text-xs text-amber-300 font-mono bg-[#03060c] p-2.5 rounded-xl border border-amber-500/20 overflow-x-auto select-all">
              {cliMode === 'zeropath' ? 'python3 -m cloudarena wave start 1' : 'cloudarena wave start 1'}
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">Injects outage + HMAC secret challenge into your cluster.</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#060a16] border border-slate-800/90 hover:border-emerald-500/50 hover:-translate-y-1.5 hover:shadow-glow-emerald transition-all duration-300 space-y-2 group">
            <div className="text-xs font-mono font-black text-emerald-400 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">04</span>
              <span>VERIFY SCORE</span>
            </div>
            <div className="text-xs font-semibold text-slate-200">Watch & Sync</div>
            <div className="text-xs text-emerald-300 font-mono bg-[#03060c] p-2.5 rounded-xl border border-emerald-500/20 overflow-x-auto select-all">
              {cliMode === 'zeropath' ? 'python3 -m cloudarena wave watch' : 'cloudarena wave watch'}
            </div>
            <div className="text-[11px] text-slate-400 leading-relaxed">10s stabilization window checks health and posts HMAC proof.</div>
          </div>
        </div>
      </div>

      {showCertModal && (
        <CertificateModal
          user={user}
          eventConfig={eventConfig}
          onClose={() => setShowCertModal(false)}
        />
      )}

    </div>
  );
}

