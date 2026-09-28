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
  Award
} from 'lucide-react';
import { elevateToAdmin, createOrJoinSquad, leaveSquad } from '../firebase';
import CertificateModal from './CertificateModal';
import Logo from './Logo';

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



  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-6 sm:my-12 p-6 sm:p-12 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md text-center shadow-2xl">
        <Logo className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-5 sm:mb-6" />
        <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
          Competitor Identity & Token Passport
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-2.5 sm:mt-3 max-w-md mx-auto leading-relaxed">
          Sign in with your Google account to mint your personal Arena Token. Link your local laptop cluster to stream telemetry and compete on the live leaderboard.
        </p>

        <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white shadow-xl shadow-sky-500/25 transition transform active:scale-95 flex items-center justify-center gap-2.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Google</span>
          </button>
        </div>

        <div className="mt-8 pt-6 sm:mt-10 sm:pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-left">
          <div className="bg-slate-950/40 p-3.5 sm:p-4 rounded-xl border border-slate-800/60">
            <div className="text-sky-400 font-bold text-xs uppercase mono mb-1">01. Zero Cost</div>
            <div className="text-xs text-slate-400">Sandboxed 3-node cluster runs locally on your laptop via k3d.</div>
          </div>
          <div className="bg-slate-950/40 p-3.5 sm:p-4 rounded-xl border border-slate-800/60">
            <div className="text-indigo-400 font-bold text-xs uppercase mono mb-1">02. Anti-Cheat</div>
            <div className="text-xs text-slate-400">K8s secret nonces and HMAC proofs secure all verified score posts.</div>
          </div>
          <div className="bg-slate-950/40 p-3.5 sm:p-4 rounded-xl border border-slate-800/60">
            <div className="text-emerald-400 font-bold text-xs uppercase mono mb-1">03. AI SRE RCA</div>
            <div className="text-xs text-slate-400">Automated post-mortems and multi-tier progressive hints.</div>
          </div>
        </div>
      </div>
    );
  }

  const token = user.arena_token || "ca_live_150ef255423a93be2c522417fa8209e4";
  const eventId = eventConfig?.event_id || "HACKATHON_2026";
  const linkCommand = `cloudarena link ${token} --event ${eventId}`;

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
      
      {/* Competitor Passport Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 sm:p-8 backdrop-blur shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <img 
              src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
              alt={user.displayName}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-sky-500/40 object-cover shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">{user.displayName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  user.role === 'admin' 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                    : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
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
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-sky-500/20 hover:from-amber-500/30 hover:to-sky-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>SRE Certificate & Badge</span>
            </button>
            <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Passport Armed 🟢
            </div>
          </div>

        </div>
      </div>

      {/* Arena Token Hub (Option B) */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-sky-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5 sm:space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                <Key className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm sm:text-lg">Personal Arena Token</h3>
                <p className="text-[11px] sm:text-xs text-slate-400">Used by your local CLI to cryptographically authenticate wave completions</p>
              </div>
            </div>

            <button
              onClick={() => setShowToken(!showToken)}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title={showToken ? "Hide Token" : "Reveal Token"}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Token Display Box */}
          <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-sky-300">
            <span className="truncate select-all break-all">{maskedToken}</span>
            <button
              onClick={() => copyToClipboard(token, setCopiedToken)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition shrink-0"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied</span>
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

        {/* Operating System Selector */}
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Choose Your Laptop Operating System:
            </span>
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold w-fit">
              <button
                onClick={() => setSelectedOs('linux')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                  selectedOs === 'linux' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🐧 Linux / macOS</span>
              </button>
              <button
                onClick={() => setSelectedOs('windows')}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                  selectedOs === 'windows' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🪟 Windows (PowerShell)</span>
              </button>
            </div>
          </div>

          {/* Quick Install Snippet */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                Step 1: Install CloudArena CLI (if not installed yet)
              </span>
              <button
                onClick={() => copyToClipboard(installCommand, setCopiedInstall)}
                className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
              >
                {copiedInstall ? "✓ Copied" : "Copy Install Command"}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#06090e] border border-slate-800 font-mono text-xs text-sky-300 overflow-x-auto select-all">
              {installCommand}
            </div>

            {selectedOs === 'windows' ? (
              <div className="text-[11px] text-slate-400 leading-relaxed">
                💡 <strong>Windows:</strong> Run in PowerShell. Make sure Docker Desktop is running with WSL2 enabled.
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 leading-relaxed">
                💡 If you encounter <code className="text-amber-300">command not found: cloudarena</code>, ensure <code className="text-sky-300">~/.local/bin</code> is in your PATH.
              </div>
            )}
          </div>
        </div>

        {/* 1-Click Terminal Snippet */}
        <div className="pt-2">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
            <span>Step 2: Link Your Terminal to the Tournament</span>
            <span className="text-slate-500 text-[11px] normal-case hidden sm:inline">Paste into terminal</span>
          </div>

          <div className="relative group">
            <div className="p-3.5 sm:p-4 rounded-xl bg-[#06090e] border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 overflow-x-auto">
              <code className="break-all">{selectedOs === 'windows' ? '> ' : '$ '}{linkCommand}</code>
              <button
                onClick={() => copyToClipboard(linkCommand, setCopiedCmd)}
                className="shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/30"
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
      <div className="bg-gradient-to-b from-purple-950/20 via-slate-900/90 to-slate-950/90 border border-purple-500/30 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base sm:text-lg">Squad Passport (CTF Team Mode)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  CO-OP ENABLED
                </span>
              </div>
              <p className="text-xs text-slate-400">Team up with fellow engineers. Incident clearances and points aggregate into squad standings!</p>
            </div>
          </div>

          {user.team_id && (
            <button
              onClick={handleSquadLeave}
              disabled={squadSubmitting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Leave Squad</span>
            </button>
          )}
        </div>

        {user.team_id ? (
          /* Active Squad State */
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/30 border border-purple-500/40 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Enlisted Squad</div>
                <div className="text-base font-bold text-purple-300 flex items-center gap-2 mt-0.5">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>{user.team_name || user.team_id}</span>
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Squad Code (Share with Teammates)</div>
                <div className="text-sm font-mono font-bold text-sky-400 mt-1 select-all">
                  {user.team_id}
                </div>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Your Operational Role</div>
                <div className="text-sm font-bold text-emerald-400 mt-0.5">
                  {user.team_role || "Operator"}
                </div>
              </div>
            </div>

            {/* Quick CLI Squad Link Command */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 text-xs font-mono">
              <div className="text-slate-300 truncate">
                <span className="text-slate-500">$ </span>
                cloudarena link {token} --team {user.team_id}
              </div>
              <button
                onClick={() => copyToClipboard(`cloudarena link ${token} --team ${user.team_id}`, setCopiedSquadCmd)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs shrink-0 flex items-center justify-center gap-1.5 transition"
              >
                {copiedSquadCmd ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSquadCmd ? "Copied" : "Copy Squad Command"}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Join / Create Squad Form */
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setSquadTab('create')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  squadTab === 'create'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create New Squad</span>
              </button>
              <button
                onClick={() => setSquadTab('join')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  squadTab === 'join'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Join with Squad Code</span>
              </button>
            </div>

            <form onSubmit={handleSquadSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {squadTab === 'create' ? (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Squad Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Titan SRE Vanguard"
                    value={squadName}
                    onChange={(e) => setSquadName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-medium"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Squad Code</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SQ_TITAN"
                    value={squadCode}
                    onChange={(e) => setSquadCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 font-mono uppercase"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Your Operational Role</label>
                <select
                  value={squadRole}
                  onChange={(e) => setSquadRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
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
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/25 transition disabled:opacity-50"
                >
                  {squadSubmitting ? "Enlisting..." : squadTab === 'create' ? "Create Squad & Join" : "Join Squad"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Organizer Verification Card */}
      {user.role !== 'admin' && (

        <div className="p-4 sm:p-6 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Are you a Tournament Organizer?</div>
              <div className="text-xs text-slate-400">Enter your organizer passcode to unlock master tournament controls.</div>
            </div>
          </div>

          <form onSubmit={handleElevate} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="password"
              placeholder="Organizer Key"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/40 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 flex-1 sm:w-36 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition"
            >
              Verify
            </button>
          </form>
          {passcodeStatus === 'error' && (
            <div className="text-xs text-rose-400 font-mono">Invalid passcode. (Default: admin2026)</div>
          )}
          {passcodeStatus === 'success' && (
            <div className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified! Access Granted.
            </div>
          )}
        </div>
      )}

      {/* Terminal Battle Protocol Step-by-Step */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6">
        <h3 className="font-extrabold text-white text-sm sm:text-base flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Complete 4-Step Hackathon Battle Guide</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 1</div>
            <div className="text-sm font-semibold text-slate-200">Install & Link</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60 overflow-x-auto">
              cloudarena link &lt;token&gt;
            </div>
            <div className="text-[11px] text-slate-500">Connects your laptop environment to this tournament account.</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 2</div>
            <div className="text-sm font-semibold text-slate-200">Start Cluster</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60 overflow-x-auto">
              cloudarena start
            </div>
            <div className="text-[11px] text-slate-500">Spins up 3-node k3d cluster and microservices ($0 compute cost).</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 3</div>
            <div className="text-sm font-semibold text-slate-200">Fight Chaos Wave</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60 overflow-x-auto">
              cloudarena wave start 1
            </div>
            <div className="text-[11px] text-slate-500">Injects outage + HMAC secret challenge into your cluster.</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 4</div>
            <div className="text-sm font-semibold text-slate-200">Fix & Verify Score</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60 overflow-x-auto">
              cloudarena wave watch
            </div>
            <div className="text-[11px] text-slate-500">Automatic 10s stabilization window checks health and posts HMAC proof.</div>
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

