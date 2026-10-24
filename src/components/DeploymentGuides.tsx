import React, { useState } from 'react';
import { Server, Globe, CheckCircle2, Copy, Layers, Database, ShieldCheck } from 'lucide-react';

export const DeploymentGuides: React.FC = () => {
  const [guideTab, setGuideTab] = useState<'directadmin' | 'cpanel' | 'windows_vps'>('directadmin');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Selector Tabs */}
      <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setGuideTab('directadmin')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors ${
            guideTab === 'directadmin'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>DirectAdmin (CloudLinux / Passenger / Nginx)</span>
        </button>
        <button
          onClick={() => setGuideTab('cpanel')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors ${
            guideTab === 'cpanel'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>cPanel / CloudLinux (Setup Python App)</span>
        </button>
        <button
          onClick={() => setGuideTab('windows_vps')}
          className={`pb-3 px-4 font-semibold text-sm flex items-center space-x-2 border-b-2 whitespace-nowrap transition-colors ${
            guideTab === 'windows_vps'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>Windows VPS (MetaTrader 5 Terminal & EA)</span>
        </button>
      </div>

      {guideTab === 'directadmin' && (
        /* DirectAdmin Guide */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% COMPATIBLE
              </span>
              <h3 className="text-lg font-bold text-white">
                Deploying FvgGold AI Trader on DirectAdmin
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              <strong>Yes!</strong> FvgGold v2.20 can be hosted on DirectAdmin. Most modern DirectAdmin shared hosts run CloudLinux with the <strong>Python Selector</strong> (Passenger) or an <strong>Nginx reverse proxy</strong>. Because this project provides a standard WSGI callable in <code className="text-amber-400">passenger_wsgi.py</code> and <code className="text-amber-400">app.py</code>, it runs natively on DirectAdmin without needing arbitrary socket ports or root daemon permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">1</span>
                <span>Setup Python App in DirectAdmin</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Log into your <strong>DirectAdmin</strong> user panel.</li>
                <li>Under <strong>Extra Features</strong>, click <strong>Setup Python App</strong>.</li>
                <li>Click <strong>Create Application</strong>.</li>
                <li>Select Python version: <strong>3.10</strong>, <strong>3.11</strong>, or <strong>3.12</strong>.</li>
                <li>Application root: enter <code className="text-slate-200">fvggold-ai</code>.</li>
                <li>Application URL: select your subdomain (e.g. <code className="text-slate-200">api.yourdomain.com</code>).</li>
                <li>Application startup file: enter <code className="text-emerald-400 font-mono font-bold">passenger_wsgi.py</code>.</li>
                <li>Application Entry point: leave as <code className="text-emerald-400 font-mono font-bold">application</code>.</li>
                <li>Click <strong>Save</strong> / <strong>Create</strong>.</li>
              </ul>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">2</span>
                <span>Upload Application Files</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>In DirectAdmin, open <strong>System Info & Files → File Manager</strong>.</li>
                <li>Navigate to <code className="text-slate-200">/home/username/fvggold-ai/</code>.</li>
                <li>Upload all files from the <code className="text-slate-200">FvgGold-AI-Service/</code> package directory:
                  <div className="text-[11px] font-mono text-slate-400 mt-1 pl-4">
                    app.py, passenger_wsgi.py, config.py, database.py, schema.sql, .htaccess, .env.example
                  </div>
                </li>
                <li>Rename or copy <code className="text-slate-200">.env.example</code> to <code className="text-slate-200">.env</code>.</li>
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
                <p>Edit <code className="text-slate-200">.env</code> in DirectAdmin File Manager:</p>
                <pre className="bg-slate-950 p-3 rounded text-[11px] font-mono text-amber-300 border border-slate-800">
AI_SERVICE_TOKEN=your_generated_random_token_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_API_KEYS=your_key_1,your_key_2
MIN_AI_CONFIDENCE=0.70
MAX_RISK_PERCENT=0.25
MAX_SPREAD_POINTS=80
DB_TYPE=sqlite
                </pre>
                <p className="text-[11px] text-slate-400">In DirectAdmin <strong>Setup Python App</strong>, click <strong>Restart</strong>.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">4</span>
                <span>Free SSL & Verification</span>
              </div>
              <div className="text-xs text-slate-300 space-y-2">
                <p>Enable Let's Encrypt SSL in DirectAdmin:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>Go to <strong>Account Manager → SSL Certificates</strong>.</li>
                  <li>Select <strong>Free & automatic certificate from Let's Encrypt</strong>.</li>
                  <li>Select your subdomain and click <strong>Save</strong>.</li>
                </ul>
                <p className="mt-2 text-slate-300">Test from PowerShell on your Windows VPS:</p>
                <div className="relative">
                  <pre className="bg-slate-950 p-2.5 rounded text-[11px] font-mono text-emerald-300 border border-slate-800 overflow-x-auto select-all">
$h = @&#123; 'X-Service-Token' = 'YOUR_TOKEN' &#125;
Invoke-RestMethod -Headers $h https://api.yourdomain.com/status
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {guideTab === 'cpanel' && (
        /* cPanel Guide */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">
              Deploying Python AI Service on cPanel Shared Hosting
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              cPanel with CloudLinux / Passenger uses <code className="text-amber-400">passenger_wsgi.py</code> to execute the Python service over standard HTTPS (port 443).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-sm font-bold">
                <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xs">2</span>
                <span>Upload Files & Configure .env</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
                <li>Using cPanel File Manager, upload <code className="text-slate-200">FvgGold-AI-Service/</code> contents.</li>
                <li>Copy <code className="text-slate-200">.env.example</code> to <code className="text-slate-200">.env</code>.</li>
                <li>Configure <code className="text-slate-200">AI_SERVICE_TOKEN</code> and <code className="text-slate-200">GEMINI_API_KEYS</code>.</li>
                <li>Set permissions of <code className="text-slate-200">.env</code> to <strong className="text-amber-300">0600</strong>.</li>
                <li>Click <strong>Restart</strong> in Setup Python App.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {guideTab === 'windows_vps' && (
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
                  <li>Add your DirectAdmin or shared hosting endpoint:
                    <div className="bg-slate-950 p-2 rounded text-emerald-300 font-mono text-[11px] mt-1">
                      https://api.yourdomain.com
                    </div>
                  </li>
                  <li>Set <code className="text-slate-200">AIServiceBaseURL = https://api.yourdomain.com</code> in EA Inputs.</li>
                  <li>Set <code className="text-slate-200">AIServiceToken = &lt;token from .env&gt;</code> in EA Inputs.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
