import React, { useState } from 'react';
import { Server, Globe, CheckCircle2, ChevronRight, Copy, Terminal, Shield, AlertCircle } from 'lucide-react';

export const DeploymentGuides: React.FC = () => {
  const [guideTab, setGuideTab] = useState<'shared_hosting' | 'windows_vps'>('shared_hosting');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Selector Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setGuideTab('shared_hosting')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center space-x-2 border-b-2 transition-colors ${
            guideTab === 'shared_hosting'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Python Shared Hosting (cPanel / WSGI / Passenger)</span>
        </button>
        <button
          onClick={() => setGuideTab('windows_vps')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center space-x-2 border-b-2 transition-colors ${
            guideTab === 'windows_vps'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Windows VPS (MetaTrader 5 Terminal & EA)</span>
        </button>
      </div>

      {guideTab === 'shared_hosting' ? (
        /* Shared Hosting Guide */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              Deploying Python AI Service on Shared Hosting
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Shared hosts (e.g. cPanel with CloudLinux / Passenger, Hostinger, SiteGround, Namecheap) do not allow continuous custom socket listeners on arbitrary ports. The FvgGold v2.20 package includes <code className="text-amber-400">passenger_wsgi.py</code> and <code className="text-amber-400">app.py</code> to execute on demand through standard HTTPS (port 443).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">1</span>
                <span>Setup Python App in cPanel</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Log into cPanel and search for <strong>Setup Python App</strong>.</li>
                <li>Click <strong>Create Application</strong>.</li>
                <li>Select Python version: <strong>3.10</strong>, <strong>3.11</strong>, or <strong>3.12</strong>.</li>
                <li>Set <strong>Application root</strong> to <code className="text-slate-200">fvggold-ai</code>.</li>
                <li>Set <strong>Application URL</strong> (e.g. <code className="text-slate-200">api.yourdomain.com</code>).</li>
                <li>Set <strong>Application startup file</strong> to <code className="text-emerald-400 font-mono">passenger_wsgi.py</code>.</li>
                <li>Set <strong>Application Entry point</strong> to <code className="text-emerald-400 font-mono">application</code>.</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">2</span>
                <span>Upload Application Files</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Using cPanel File Manager or SFTP, navigate to the application folder.</li>
                <li>Upload all files from <code className="text-slate-200">FvgGold-AI-Service/</code>:
                  <div className="text-[11px] font-mono text-slate-400 mt-1 pl-4">
                    app.py, passenger_wsgi.py, config.py, database.py, schema.sql, .htaccess, .env.example
                  </div>
                </li>
                <li>Copy <code className="text-slate-200">.env.example</code> to <code className="text-slate-200">.env</code>.</li>
                <li>Set permissions of <code className="text-slate-200">.env</code> to <strong className="text-amber-300">0600</strong>.</li>
              </ul>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">3</span>
                <span>Configure Environment Secrets</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p>Edit <code className="text-slate-200">.env</code> and insert your generated secret and Gemini keys:</p>
                <pre className="bg-slate-950 p-3 rounded text-[11px] font-mono text-amber-300 border border-slate-800">
AI_SERVICE_TOKEN=your_secure_random_token_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEYS=your_key_1,your_key_2
DB_TYPE=sqlite
                </pre>
                <p className="text-[11px] text-slate-500">In cPanel Setup Python App, click the <strong>Restart</strong> button.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">4</span>
                <span>Test Endpoint Connectivity</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p>Run in PowerShell from your local computer:</p>
                <div className="relative">
                  <pre className="bg-slate-950 p-3 rounded text-[11px] font-mono text-emerald-300 border border-slate-800 overflow-x-auto select-all">
$h = @&#123; 'X-Service-Token' = 'YOUR_TOKEN' &#125;
Invoke-RestMethod -Headers $h https://api.yourdomain.com/status
                  </pre>
                  <button
                    onClick={() => handleCopy("$h = @{ 'X-Service-Token' = 'YOUR_TOKEN' }\nInvoke-RestMethod -Headers $h https://api.yourdomain.com/status", 101)}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white"
                  >
                    {copiedIndex === 101 ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">Must return <code className="text-emerald-400">ok: true</code>, active: true, and model.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Windows VPS Guide */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              Configuring MetaTrader 5 Terminal on Windows VPS
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              MetaTrader 5 executes trades and calculates local risk guardrails. Follow these steps to compile <code className="text-amber-400">FvgGold.mq5</code> and enable HTTPS WebRequest access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">1</span>
                <span>Compile EA in MetaEditor</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>In MT5, click <strong>File → Open Data Folder</strong>.</li>
                <li>Copy <code className="text-slate-200">FvgGold-EA-main\FvgGold.mq5</code> into <code className="text-slate-200">MQL5\Experts\</code>.</li>
                <li>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">F4</kbd> to open MetaEditor.</li>
                <li>Open <code className="text-slate-200">FvgGold.mq5</code> and press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px]">F7</kbd> to compile.</li>
                <li>Confirm: <strong className="text-emerald-400">0 errors, 0 warnings</strong>.</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">2</span>
                <span>Configure MT5 WebRequest Whitelist</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p>MT5 blocks outgoing network traffic unless authorized:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Go to <strong>Tools → Options → Expert Advisors</strong>.</li>
                  <li>Check <strong>"Allow WebRequest for listed URL"</strong>.</li>
                  <li>Add your exact endpoint:
                    <div className="bg-slate-950 p-2 rounded text-emerald-300 font-mono text-[11px] mt-1">
                      https://api.yourdomain.com
                    </div>
                  </li>
                  <li>(Or <code className="text-amber-300">http://127.0.0.1:8787</code> if running Python locally on VPS).</li>
                </ol>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">3</span>
                <span>Attach to Gold Chart (M15)</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Open <strong>XAUUSD</strong> chart on <strong>M15</strong> timeframe.</li>
                <li>Drag <code className="text-slate-200">FvgGold</code> onto the chart.</li>
                <li>In Inputs:
                  <div className="text-[11px] text-slate-400 font-mono space-y-1 mt-1 pl-2">
                    <div>AIServiceBaseURL = https://api.yourdomain.com</div>
                    <div>AIServiceToken = &lt;exact token from .env&gt;</div>
                    <div>FixedLot = 0.0 (risk sizing)</div>
                    <div>RiskPercent = 0.25</div>
                  </div>
                </li>
                <li>In Common tab: Check <strong>Allow Algo Trading</strong>.</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">4</span>
                <span>Confirm Active Chart Status</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p>Observe the chart HUD at the top-left:</p>
                <pre className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-emerald-300 border border-slate-800">
=== FvgGold AI Trader v2.20 ===
HTF Bias: BULLISH | Exec TF: PERIOD_M15
ATR: 4.85 | Session: ACTIVE
Daily P/L: $0.00 (Floating: $0.00)
AI Gate: ACTIVE (CONNECTED)
Status: active
                </pre>
                <p className="text-[11px] text-slate-400">If you see "ACTIVE (CONNECTED)", trading and risk gates are fully engaged.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
