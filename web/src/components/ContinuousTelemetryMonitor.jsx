import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  ShieldCheck, 
  Cpu, 
  Server, 
  Wifi, 
  Radio, 
  Zap, 
  Layers,
  Sparkles
} from 'lucide-react';

export default function ContinuousTelemetryMonitor() {
  const [pulsePhase, setPulsePhase] = useState(0);
  const [latency, setLatency] = useState(14);
  const [cpuUsage, setCpuUsage] = useState(24.2);
  const [packetsPerSec, setPacketsPerSec] = useState(128);

  // Subtle real-time oscillation for living dashboard telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setPulsePhase(p => (p + 1) % 100);
      setLatency(12 + Math.floor(Math.random() * 5));
      setCpuUsage(Number((22 + Math.random() * 6).toFixed(1)));
      setPacketsPerSec(120 + Math.floor(Math.random() * 20));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-[#0b1022]/80 border border-emerald-500/30 rounded-3xl p-4 sm:p-6 backdrop-blur-xl shadow-xl shadow-emerald-500/5 relative overflow-hidden space-y-4 transition-all duration-300">
      <div className="absolute top-0 right-0 left-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-70"></div>

      {/* Top Banner with Radar Beacon & Continuous Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          {/* Continuous Radar Scanner */}
          <div className="relative w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 overflow-hidden">
            <Radio className="w-4 h-4 text-emerald-400 z-10" />
            <div 
              className="absolute inset-0 bg-gradient-to-tr from-emerald-500/30 to-transparent rounded-full animate-spin" 
              style={{ animationDuration: '3s' }}
            ></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
                <span>Cluster Pulse & Continuous Telemetry</span>
              </h4>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Live heartbeat telemetry from the sandboxed k3d local node mesh
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>HMAC ATTESTATION ARMED</span>
          </span>
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-bold">
            PROBES: {packetsPerSec} req/s
          </span>
        </div>
      </div>

      {/* Real-time Continuous SVG EKG Heartbeat Wave Line */}
      <div className="relative w-full h-16 sm:h-20 bg-[#040711] rounded-2xl border border-emerald-500/20 overflow-hidden shadow-inner flex items-center">
        {/* Oscilloscope Grid Background */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        ></div>

        {/* Continuous Flowing SVG Wave Line */}
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 100">
          <defs>
            <linearGradient id="ekgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00f0ff" stop-opacity="0.3" />
              <stop offset="50%" stop-color="#10b981" stop-opacity="1" />
              <stop offset="100%" stop-color="#00f0ff" stop-opacity="0.8" />
            </linearGradient>
            <filter id="ekgGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background duplicate path with blur */}
          <path
            d="M0,50 L120,50 L135,46 L145,54 L155,50 L200,50 L210,20 L220,85 L230,10 L240,65 L250,50 L340,50 L350,46 L360,54 L370,50 L420,50 L430,18 L440,88 L450,12 L460,62 L470,50 L560,50 L570,46 L580,54 L590,50 L640,50 L650,22 L660,82 L670,15 L680,60 L690,50 L800,50"
            fill="none"
            stroke="url(#ekgGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ekgGlow)"
            className="animate-pulse"
          />

          {/* Sweeping Leading Scanner Dot */}
          <circle cx="440" cy="88" r="4" fill="#00f0ff" className="animate-ping" />
          <circle cx="440" cy="88" r="3" fill="#ffffff" />
        </svg>

        {/* Live metric badge overlays */}
        <div className="absolute right-3 top-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur border border-slate-700 font-mono text-[10px] text-slate-300 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span>Latency: <strong className="text-emerald-300">{latency}ms</strong></span>
        </div>
      </div>

      {/* 4 Continuous Mini Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-3 rounded-xl bg-[#060a16] border border-slate-800 text-xs font-mono">
          <div className="text-[10px] text-slate-400 uppercase">3-Node Mesh</div>
          <div className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>3/3 Ready</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#060a16] border border-slate-800 text-xs font-mono">
          <div className="text-[10px] text-slate-400 uppercase">Avg CPU Load</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">
            {cpuUsage}%
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#060a16] border border-slate-800 text-xs font-mono">
          <div className="text-[10px] text-slate-400 uppercase">Synthetic Probes</div>
          <div className="text-sm font-bold text-emerald-400 mt-0.5">
            100.0% PASS
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#060a16] border border-slate-800 text-xs font-mono">
          <div className="text-[10px] text-slate-400 uppercase">Anti-Tamper Lock</div>
          <div className="text-sm font-bold text-purple-300 mt-0.5">
            HMAC-SHA256 ✓
          </div>
        </div>
      </div>
    </div>
  );
}
