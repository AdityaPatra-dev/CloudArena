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
  AlertCircle
} from 'lucide-react';

export default function CompetitorHub({ user, onLogin, eventConfig }) {
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showToken, setShowToken] = useState(false);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 sm:p-12 bg-slate-900/60 border border-slate-800 rounded-3xl backdrop-blur-md text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-sky-500/20">
          <Terminal className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Competitor Identity & Token Passport
        </h2>
        <p className="text-sm text-slate-400 mt-3 max-w-md mx-auto leading-relaxed">
          Sign in with your Google account to mint your personal Arena Token. Link your local laptop cluster to stream telemetry and compete on the live leaderboard.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onLogin}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600 hover:from-sky-400 hover:to-purple-500 text-white shadow-xl shadow-sky-500/25 transition transform active:scale-95 flex items-center justify-center gap-2.5"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign in with Google</span>
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="text-sky-400 font-bold text-xs uppercase mono mb-1">01. Zero Cost</div>
            <div className="text-xs text-slate-400">Sandboxed 3-node cluster runs locally on your laptop via k3d.</div>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="text-indigo-400 font-bold text-xs uppercase mono mb-1">02. Anti-Cheat</div>
            <div className="text-xs text-slate-400">K8s secret challenge nonces and HMAC proofs secure all score syncs.</div>
          </div>
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
            <div className="text-emerald-400 font-bold text-xs uppercase mono mb-1">03. AI SRE RCA</div>
            <div className="text-xs text-slate-400">Post-mortems and multi-tier progressive hints guide your troubleshooting.</div>
          </div>
        </div>
      </div>
    );
  }

  const token = user.arena_token || "ca_live_9f81a7b4c2e1f5d6a7b8c9d0e1f2a3b4";
  const eventId = eventConfig?.event_id || "HACKATHON_2026";
  const linkCommand = `cloudarena link ${token} --event ${eventId}`;

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const maskedToken = showToken ? token : `${token.substring(0, 7)}••••••••••••••••${token.substring(token.length - 4)}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      
      {/* Competitor Passport Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={user.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"}
              alt={user.displayName}
              className="w-16 h-16 rounded-2xl border-2 border-sky-500/40 object-cover shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white tracking-tight">{user.displayName}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono">
                  {user.role === 'admin' ? 'ORGANIZER' : 'COMPETITOR'}
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Handle: <span className="text-slate-200 font-bold">@{user.handle || 'cadet'}</span> • {user.email}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Passport Armed 🟢
            </div>
          </div>
        </div>
      </div>

      {/* Arena Token Hub (Option B) */}
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-sky-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base sm:text-lg">Personal Arena Token</h3>
                <p className="text-xs text-slate-400">Used by your local CLI to cryptographically authenticate wave completions</p>
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
          <div className="mt-4 flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm text-sky-300">
            <span className="truncate select-all">{maskedToken}</span>
            <button
              onClick={() => copyToClipboard(token, setCopiedToken)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
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

        {/* 1-Click Terminal Snippet */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono mb-2 flex items-center justify-between">
            <span>Terminal Link Snippet (One-Click Copy)</span>
            <span className="text-slate-500 text-[11px] normal-case">Paste into your terminal</span>
          </div>

          <div className="relative group">
            <div className="p-4 rounded-xl bg-[#06090e] border border-slate-800 font-mono text-xs sm:text-sm text-emerald-400 flex items-center justify-between gap-4 overflow-x-auto">
              <code>$ {linkCommand}</code>
              <button
                onClick={() => copyToClipboard(linkCommand, setCopiedCmd)}
                className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-md shadow-sky-600/30"
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

      {/* Terminal Battle Protocol Step-by-Step */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <h3 className="font-extrabold text-white text-base flex items-center gap-2">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span>Local Environment Battle Protocol</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 1</div>
            <div className="text-sm font-semibold text-slate-200">Link Token</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
              cloudarena link &lt;token&gt;
            </div>
            <div className="text-[11px] text-slate-500">Binds your laptop environment to this tournament account.</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 2</div>
            <div className="text-sm font-semibold text-slate-200">Start Cluster</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
              cloudarena start
            </div>
            <div className="text-[11px] text-slate-500">Provisions 3-node k3d cluster and target microservices in 45s.</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 3</div>
            <div className="text-sm font-semibold text-slate-200">Engage Wave</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
              cloudarena wave start 1
            </div>
            <div className="text-[11px] text-slate-500">Injects chaotic outage and cryptographic nonce challenge.</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="text-xs font-mono font-bold text-sky-400">STEP 4</div>
            <div className="text-sm font-semibold text-slate-200">Verify & Sync</div>
            <div className="text-xs text-slate-400 font-mono bg-slate-900 p-2 rounded border border-slate-800/60">
              cloudarena whoami
            </div>
            <div className="text-[11px] text-slate-500">Automatic HMAC proof generation posts verified score.</div>
          </div>
        </div>
      </div>

    </div>
  );
}
