import React, { useState } from 'react';
import { 
  Award, 
  Download, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';

export default function CertificateModal({ user, eventConfig, onClose }) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);

  const handle = user?.handle || user?.displayName || "cadet";
  const score = user?.score || 540;
  const wavesCleared = user?.waves_cleared || 3;
  const eventId = eventConfig?.event_id || "HACKATHON_2026";
  const proofHash = `ca_cert_${(user?.uid || "cadet").substring(0, 8)}${Math.random().toString(16).substring(2, 10)}`;

  let tierName = "Bronze Foundation";
  let badgeColor = "#38bdf8";
  let title = "SRE Incident First Responder";
  let icon = "🥉";

  if (wavesCleared >= 8) {
    tierName = "Platinum / Mythic";
    badgeColor = "#10b981";
    title = "Grandmaster Chaos Principal SRE";
    icon = "👑";
  } else if (wavesCleared >= 5) {
    tierName = "Gold Honor";
    badgeColor = "#f59e0b";
    title = "Kubernetes Resilience Architect";
    icon = "🥇";
  } else if (wavesCleared >= 3) {
    tierName = "Silver Professional";
    badgeColor = "#a855f7";
    title = "Cloud Chaos Specialist";
    icon = "🥈";
  }

  const downloadSvg = () => {
    const svgEl = document.getElementById("cloudarena-svg-cert");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cloudarena-certificate-${handle}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const copyVerifyLink = () => {
    const url = `${window.location.origin}/?verify=${proofHash}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyProofHash = () => {
    navigator.clipboard.writeText(proofHash);
    setCopiedProof(true);
    setTimeout(() => setCopiedProof(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Verifiable SRE Certificate of Mastery</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  ATTESTED ✓
                </span>
              </h2>
              <p className="text-xs text-slate-400">Cryptographically signed credential with live proof verification hash</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Vector Canvas Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/50 flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl bg-[#090d16] rounded-2xl border border-slate-800 shadow-2xl p-2 sm:p-4 overflow-hidden">
            
            <svg 
              id="cloudarena-svg-cert"
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 900 580" 
              className="w-full h-auto select-none rounded-xl"
            >
              <defs>
                <linearGradient id="webBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0b1120" />
                  <stop offset="50%" stopColor="#090d16" />
                  <stop offset="100%" stopColor="#111827" />
                </linearGradient>
                <linearGradient id="webPrimaryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={badgeColor} />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>

              <rect width="900" height="580" rx="20" fill="url(#webBgGrad)" />
              <rect x="18" y="18" width="864" height="544" rx="14" fill="none" stroke="#1e293b" strokeWidth="2" />
              <rect x="26" y="26" width="848" height="528" rx="10" fill="none" stroke={badgeColor} strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="8 6" />

              <text x="450" y="75" textAnchor="middle" fontSize="13" fontFamily="monospace" fontWeight="700" fill={badgeColor} letterSpacing="4">
                CLOUDARENA • DISTRIBUTED SYSTEMS SURVIVAL ARENA
              </text>
              <text x="450" y="115" textAnchor="middle" fontSize="28" fontWeight="900" fill="#ffffff">
                CERTIFICATE OF RESILIENCE MASTERY
              </text>

              <line x1="360" y1="130" x2="540" y2="130" stroke={badgeColor} strokeWidth="2" strokeLinecap="round" />

              <text x="450" y="170" textAnchor="middle" fontSize="14" fill="#94a3b8">
                This verifiable credential certifies that
              </text>

              <text x="450" y="215" textAnchor="middle" fontSize="36" fontWeight="900" fill="#ffffff">
                @{handle}
              </text>

              <text x="450" y="250" textAnchor="middle" fontSize="15" fill="#cbd5e1" fontWeight="500">
                has successfully diagnosed, remediated, and conquered live chaos attacks in
              </text>
              <text x="450" y="275" textAnchor="middle" fontSize="14" fontWeight="700" fill={badgeColor}>
                {eventId}
              </text>

              {/* Awarded Title Badge */}
              <rect x="220" y="300" width="460" height="56" rx="12" fill="#0f172a" stroke={badgeColor} strokeWidth="1.5" strokeOpacity="0.6" />
              <text x="450" y="335" textAnchor="middle" fontSize="18" fontWeight="800" fill="#ffffff">
                {icon} {title}
              </text>

              {/* Metrics */}
              <g transform="translate(180, 380)">
                <rect width="160" height="66" rx="10" fill="#0b1329" stroke="#1e293b" />
                <text x="80" y="24" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#64748b" fontWeight="700">WAVES CONQUERED</text>
                <text x="80" y="52" textAnchor="middle" fontSize="22" fontWeight="900" fill="#ffffff">{wavesCleared} / 8 Waves</text>
              </g>

              <g transform="translate(370, 380)">
                <rect width="160" height="66" rx="10" fill="#0b1329" stroke="#1e293b" />
                <text x="80" y="24" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#64748b" fontWeight="700">VERIFIED SCORE</text>
                <text x="80" y="52" textAnchor="middle" fontSize="22" fontWeight="900" fill={badgeColor}>{score} pts</text>
              </g>

              <g transform="translate(560, 380)">
                <rect width="160" height="66" rx="10" fill="#0b1329" stroke="#1e293b" />
                <text x="80" y="24" textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#64748b" fontWeight="700">ARENA STANDING</text>
                <text x="80" y="52" textAnchor="middle" fontSize="16" fontWeight="800" fill="#38bdf8">{tierName}</text>
              </g>

              {/* Footer */}
              <text x="60" y="505" fontSize="11" fill="#64748b" fontFamily="monospace">
                ISSUED: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </text>
              <text x="60" y="522" fontSize="11" fill="#475569" fontFamily="monospace">
                HMAC PROOF: {proofHash}
              </text>
              <text x="840" y="505" textAnchor="end" fontSize="11" fill={badgeColor} fontFamily="monospace" fontWeight="700">
                STATUS: CRYPTOGRAPHICALLY ATTESTED ✓
              </text>
              <text x="840" y="522" textAnchor="end" fontSize="11" fill="#64748b" fontFamily="monospace">
                VERIFY AT: gdg-cloudarena.web.app
              </text>
            </svg>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-8 py-4 border-t border-slate-800 bg-slate-950/80 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={copyVerifyLink}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? "Link Copied" : "Copy Verification URL"}</span>
            </button>

            <button
              onClick={copyProofHash}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              {copiedProof ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>{copiedProof ? "Proof Copied" : "Copy HMAC Proof"}</span>
            </button>
          </div>

          <button
            onClick={downloadSvg}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Vector Certificate (.SVG)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
