import React, { useState } from 'react';
import { KeyRound, Copy, Check, RefreshCw, Sliders, Database, Server } from 'lucide-react';

export const ConfigGenerator: React.FC = () => {
  const [token, setToken] = useState<string>('kX8jV2m9Lp4QyRt6Wz1Nc0Bv5Fs8Gh3Jx7Ka9Sd2Fg4Hj6Kl8Mn0Pq2Rs4Tu6Vw8');
  const [baseUrl, setBaseUrl] = useState<string>('https://api.yourdomain.com');
  const [model, setModel] = useState<string>('gemini-2.5-flash');
  const [minConfidence, setMinConfidence] = useState<string>('0.70');
  const [riskPercent, setRiskPercent] = useState<string>('0.25');
  const [maxSpread, setMaxSpread] = useState<string>('80');
  const [dbType, setDbType] = useState<'sqlite' | 'mysql'>('sqlite');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateNewToken = async () => {
    try {
      const res = await fetch('/api/generate-token', { method: 'POST' });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      }
    } catch {
      // Fallback in-browser secure random generator
      const arr = new Uint8Array(48);
      window.crypto.getRandomValues(arr);
      const b64 = btoa(String.fromCharCode(...arr)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      setToken(b64);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const envFileContent = `# FvgGold AI Trader - Configuration
AI_SERVICE_TOKEN=${token}
SERVICE_HOST=127.0.0.1
SERVICE_PORT=8787

# Gemini AI API
GEMINI_MODEL=${model}
GEMINI_API_KEYS=REPLACE_WITH_YOUR_GEMINI_KEY_1,REPLACE_WITH_YOUR_GEMINI_KEY_2

# Risk & Market Rules
MIN_AI_CONFIDENCE=${minConfidence}
MAX_RISK_PERCENT=${riskPercent}
MAX_SPREAD_POINTS=${maxSpread}
GEMINI_TIMEOUT_SECONDS=12
KEY_COOLDOWN_SECONDS=90
MAX_REQUEST_DRIFT_SECONDS=60

# Database Persistence
DB_TYPE=${dbType}
${dbType === 'mysql' ? 'DB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USER=fvg_user\nDB_PASSWORD=your_db_password\nDB_NAME=fvggold_db' : '# SQLite requires zero additional setup\nSQLITE_PATH=fvggold.sqlite3'}

LOG_LEVEL=INFO
TELEGRAM_BOT_TOKEN=
TELEGRAM_ALLOWED_CHAT_IDS=
`;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <KeyRound className="w-5 h-5 text-amber-400" />
          <span>Interactive Token & Configuration Generator</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Generate production-ready secrets and synchronize your Python <code className="text-amber-400">.env</code> with MetaTrader 5 EA Inputs.
        </p>
      </div>

      {/* Secret Token Generator Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Cryptographically Secure Service Token
            </h3>
            <p className="text-xs text-slate-400">
              High-entropy 384-bit secret used to authenticate the EA against the Python service.
            </p>
          </div>
          <button
            onClick={generateNewToken}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold transition-colors border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New Secret</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-amber-300 break-all select-all">
          <span className="flex-1">{token}</span>
          <button
            onClick={() => copyToClipboard(token, 'token')}
            className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            title="Copy token"
          >
            {copiedKey === 'token' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Parameters Adjuster */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5 border-b border-slate-800 pb-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Deployment Parameters</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Service Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
              placeholder="https://api.yourdomain.com"
            />
            <span className="text-[10px] text-slate-500">Shared hosting HTTPS or http://127.0.0.1:8787 for local VPS</span>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Gemini Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Min Confidence</label>
              <input
                type="text"
                value={minConfidence}
                onChange={(e) => setMinConfidence(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Max Risk %</label>
              <input
                type="text"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Database Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDbType('sqlite')}
                className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-colors ${
                  dbType === 'sqlite'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                SQLite (Zero-Config)
              </button>
              <button
                type="button"
                onClick={() => setDbType('mysql')}
                className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition-colors ${
                  dbType === 'mysql'
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                MySQL (cPanel)
              </button>
            </div>
          </div>
        </div>

        {/* Generated .env */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Python .env Template</span>
            </span>
            <button
              onClick={() => copyToClipboard(envFileContent, 'env')}
              className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
            >
              {copiedKey === 'env' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy .env</span>
            </button>
          </div>
          <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800 h-80 overflow-y-auto whitespace-pre-wrap select-all">
            {envFileContent}
          </pre>
        </div>

        {/* MT5 EA Inputs Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-amber-400" />
              <span>MetaTrader 5 EA Inputs</span>
            </span>
          </div>

          <div className="space-y-2 pt-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">UseAIApproval</span>
              <span className="text-emerald-400 font-mono font-bold">true</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">AIServiceBaseURL</span>
              <span className="text-amber-300 font-mono font-bold break-all">{baseUrl}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">AIServiceToken</span>
              <span className="text-amber-300 font-mono font-bold break-all">{token}</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">AIRequestTimeoutMs</span>
              <span className="text-slate-200 font-mono">12000</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">CancelPendingIfAIUnavailable</span>
              <span className="text-emerald-400 font-mono font-bold">true</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
