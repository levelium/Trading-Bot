import React from 'react';
import { ShieldCheck, CheckCircle2, ArrowRight, Server, Terminal, Lock, Globe, AlertTriangle, Download, Database } from 'lucide-react';

interface OverviewHeroProps {
  onSelectTab: (tab: string) => void;
}

export const OverviewHero: React.FC<OverviewHeroProps> = ({ onSelectTab }) => {
  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Production-Ready Architecture Rebuild</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            FvgGold AI Trader v2.20
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Successfully adapted the Python AI decision service for <strong className="text-amber-300">Python-compatible shared hosting</strong> (cPanel / Passenger / WSGI) while preserving the existing <strong className="text-white">Fair Value Gap & Order Block trading strategy</strong> running on your <strong className="text-amber-300">Windows VPS MetaTrader 5</strong> terminal. Both critical authentication and socket timeout bugs have been systematically resolved.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="/api/download-zip"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Download Complete Package ZIP (65 KB)</span>
            </a>
            <button
              onClick={() => onSelectTab('diagnostic')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Inspect 1003 & 401 Post-Mortem</span>
            </button>
            <button
              onClick={() => onSelectTab('tests')}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/20 text-emerald-300 font-semibold text-xs transition-colors border border-emerald-500/30"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>View 24/24 Automated Tests</span>
            </button>
          </div>
        </div>
      </div>

      {/* Architecture Visual Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center space-x-2">
          <Server className="w-4 h-4 text-amber-400" />
          <span>Production Distributed Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          {/* Box 1: Windows VPS */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
                <Server className="w-4 h-4" />
                <span>Tier 1: Windows VPS</span>
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">Client Tier</span>
            </div>
            <p className="text-xs text-white font-semibold">MetaTrader 5 & FvgGold EA v2.20</p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>XAUUSD M15 FVG & OB Scanner</li>
              <li>H1 EMA 50/200 Trend Bias</li>
              <li>Calculates $/tick risk lot sizing</li>
              <li>Daily Loss Limit (Closed + Floating)</li>
              <li>Sends WebRequest with Connection: close</li>
            </ul>
          </div>

          {/* Box 2: Python Shared Hosting */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-xl p-4 space-y-2 relative shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1.5">
                <Globe className="w-4 h-4" />
                <span>Tier 2: Shared Hosting</span>
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-semibold border border-emerald-500/30">
                HTTPS Port 443
              </span>
            </div>
            <p className="text-xs text-white font-semibold">WSGI Service (passenger_wsgi.py)</p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>Constant-time token authentication</li>
              <li>60s timestamp anti-replay guard</li>
              <li>SHA-256 signal deduplication cache</li>
              <li>Local conservative gate (R:R &ge; 1.5, score &ge; 65)</li>
              <li>Dual SQLite & MySQL persistence</li>
            </ul>
          </div>

          {/* Box 3: Google Gemini */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 flex items-center space-x-1.5">
                <Lock className="w-4 h-4" />
                <span>Tier 3: Google Cloud</span>
              </span>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-1.5 py-0.5 rounded font-semibold border border-sky-500/30">
                AI Reviewer
              </span>
            </div>
            <p className="text-xs text-white font-semibold">Gemini 2.5 Flash API</p>
            <ul className="text-[11px] text-slate-400 space-y-1 list-disc list-inside">
              <li>Multi-key rotation & cooldown pool</li>
              <li>Conservative market reviewer</li>
              <li>Never reverses candidate direction</li>
              <li>Requires confidence &ge; 0.70</li>
              <li>Fail-closed safeguard on error</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Confirmed Defects & Resolutions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Audit of Confirmed Defects & Verifications
        </h3>

        <div className="space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-400">
                Defect 1: PowerShell status check returns {`{"ok":false,"error":"unauthorized"}`}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                FIXED & TESTED
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Root Cause:</strong> The <code className="text-slate-200">/status</code> endpoint enforces token security. Plain PowerShell <code className="text-slate-200">Invoke-RestMethod</code> sends no headers, or token had whitespace/placeholder mismatches.
              <br />
              <strong>Fix:</strong> Implemented dual-header support (<code className="text-amber-300">X-Service-Token</code> and <code className="text-amber-300">Authorization: Bearer</code>), constant-time validation, placeholder guards, and an automated diagnostic PowerShell script (<code className="text-slate-200">test_local_status.ps1</code>).
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-400">
                Defect 2: MT5 Chart displays "AI: ACTIVE | AI service HTTP 1003"
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                FIXED & TESTED
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Root Cause:</strong> Code 1003 is <em>not</em> an HTTP status; it is MT5's WinInet client socket read-timeout code. Python's default HTTP server did not send <code className="text-slate-200">Connection: close</code>, causing MT5's keep-alive socket to hang. Additionally, <code className="text-slate-200">RefreshAIServiceState()</code> executed two blocking calls (<code className="text-slate-200">/status</code> then <code className="text-slate-200">/heartbeat</code>). When the second call timed out with 1003, it overwrote the status text without resetting <code className="text-slate-200">AIServiceActive = true</code>.
              <br />
              <strong>Fix:</strong> Enforced <code className="text-emerald-400">Connection: close</code>, combined heartbeat and active status return into a single POST, and updated MQL5 to correctly label code 1003 as a client read timeout.
            </p>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-400">
                Defect 3: Python service assumed local dedicated port daemon
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                FIXED & TESTED
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Root Cause:</strong> Python shared hosting does not permit running standalone persistent daemons bound to arbitrary ports like 8787.
              <br />
              <strong>Fix:</strong> Re-engineered the Python tier into a standard WSGI application (<code className="text-emerald-400">passenger_wsgi.py</code> / <code className="text-emerald-400">app.py</code>) natively supported by cPanel Setup Python App over standard HTTPS port 443, with dual SQLite & MySQL database support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
