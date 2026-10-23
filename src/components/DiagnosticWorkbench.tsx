import React, { useState } from 'react';
import { Terminal, CheckCircle2, AlertTriangle, ArrowRight, Play, RefreshCw, Layers } from 'lucide-react';

export const DiagnosticWorkbench: React.FC = () => {
  const [mode, setMode] = useState<'legacy_unfixed' | 'production_repaired'>('production_repaired');
  const [endpoint, setEndpoint] = useState<string>('/status');
  const [tokenInput, setTokenInput] = useState<string>('CHANGE_ME_TO_MATCH_ENV');
  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const runSimulation = async (selectedMode = mode, selectedEndpoint = endpoint, selectedToken = tokenInput) => {
    setLoading(true);
    try {
      const res = await fetch('/api/simulate-webrequest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: selectedMode,
          endpoint: selectedEndpoint,
          token: selectedToken
        })
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    runSimulation(mode, endpoint, tokenInput);
  }, [mode, endpoint]);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <Terminal className="w-5 h-5 text-amber-400" />
              <span>Interactive Diagnostic Workbench</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Simulate and inspect the exact network transactions behind both <code className="text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded">401 Unauthorized</code> and <code className="text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded">AI service HTTP 1003</code>.
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setMode('legacy_unfixed');
                setTokenInput('CHANGE_ME_TO_MATCH_ENV');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'legacy_unfixed'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Legacy Unfixed (The Bugs)
            </button>
            <button
              onClick={() => {
                setMode('production_repaired');
                setTokenInput('6Yq3b7K_9J_test_token_min_32_characters_long_for_security');
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                mode === 'production_repaired'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              v2.20 Production (The Fix)
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Endpoint Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Target Endpoint
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['/status', '/heartbeat', '/decision', '/health'].map((ep) => (
              <button
                key={ep}
                onClick={() => setEndpoint(ep)}
                className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all text-left ${
                  endpoint === ep
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {ep}
              </button>
            ))}
          </div>
        </div>

        {/* Token Simulator Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 md:col-span-2">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Simulated MQL5 EA AIServiceToken
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500"
              placeholder="Enter service token..."
            />
            <button
              onClick={() => runSimulation()}
              disabled={loading}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Simulate</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {mode === 'legacy_unfixed'
              ? 'In the legacy build, CHANGE_ME_TO_MATCH_ENV was left in inputs, causing 401s, while heartbeat socket stalls produced HTTP 1003.'
              : 'v2.20 validates token length, supports Bearer & X-Service-Token, and terminates sockets cleanly with Connection: close.'}
          </p>
        </div>
      </div>

      {/* Live Transaction Comparison */}
      {simResult && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Side */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>MQL5 WebRequest Execution</span>
              </span>
              <span className="text-xs font-mono text-slate-400">{simResult.requestUrl}</span>
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-1 font-medium">Headers Sent by MT5:</p>
              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-amber-300 border border-slate-800/80 whitespace-pre-wrap">
                {simResult.mql5Headers}
              </pre>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">WebRequest() Return Code</span>
                <span
                  className={`text-base font-mono font-bold ${
                    simResult.mt5ResultCode === 200
                      ? 'text-emerald-400'
                      : simResult.mt5ResultCode === 1003
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  {simResult.mt5ResultCode}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {simResult.mt5ResultCode === 1003 ? 'MT5 Internal Read Timeout' : 'HTTP Status or -1'}
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-500 block">MT5 Chart Dashboard Label</span>
                <span
                  className={`text-xs font-mono font-bold block mt-1 ${
                    simResult.mql5StatusDisplayed.includes('HTTP 1003') || simResult.mql5StatusDisplayed.includes('HTTP 401')
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {simResult.mql5StatusDisplayed}
                </span>
              </div>
            </div>
          </div>

          {/* Response / Diagnosis Side */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center space-x-1.5">
                {mode === 'production_repaired' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>Technical Diagnosis & Root Cause</span>
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-semibold ${
                  mode === 'production_repaired'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                }`}
              >
                {mode === 'production_repaired' ? 'RESOLVED' : 'CONFIRMED DEFECT'}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <p className="font-semibold text-slate-200 mb-1">Mechanisms & Findings:</p>
              <p className="text-slate-400">{simResult.explanation}</p>
              {simResult.remediation && (
                <p className="mt-2 text-amber-400/90 font-medium">
                  Resolution: {simResult.remediation}
                </p>
              )}
            </div>

            {simResult.responsePayload && (
              <div>
                <p className="text-xs text-slate-400 mb-1 font-medium">Response JSON Body:</p>
                <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-emerald-300 border border-slate-800/80 max-h-40 overflow-y-auto">
                  {JSON.stringify(simResult.responsePayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-Depth Post-Mortem Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-base font-bold text-white mb-3">
          Deep Technical Post-Mortem: Why "AI: ACTIVE | AI service HTTP 1003" Occurred
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
          <div className="space-y-2">
            <span className="font-bold text-amber-400 flex items-center space-x-1">
              <span>1. The "1003" Read Timeout Code</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              HTTP status codes are 3 digits (100–599) defined by RFC 9110. Code <strong>1003</strong> was not emitted by the Python server. In MetaTrader 5, <code className="text-amber-300">WebRequest()</code> returns 1003 when WinInet encounters an internal <strong>socket read timeout</strong> (paired with <code className="text-slate-200">GetLastError() == 5203</code>).
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-amber-400 flex items-center space-x-1">
              <span>2. The Missing Connection Header</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              Python's default <code className="text-slate-200">BaseHTTPRequestHandler</code> does not send <code className="text-emerald-300">Connection: close</code> for HTTP/1.1 requests unless explicitly ordered. When MT5 connected with WinInet's default keep-alive, the socket remained unclosed waiting for more packets until the client read timeout elapsed at ~10–12 seconds.
            </p>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-amber-400 flex items-center space-x-1">
              <span>3. The Status Text Race Condition</span>
            </span>
            <p className="text-slate-400 leading-relaxed">
              In <code className="text-slate-200">RefreshAIServiceState()</code>, the timer called <code className="text-slate-200">GET /status</code> (setting <code className="text-emerald-400">AIServiceActive = true</code>) and immediately dispatched <code className="text-slate-200">POST /heartbeat</code>. The heartbeat socket stalled with 1003, overwriting <code className="text-slate-200">lastAIStatusText</code> while leaving <code className="text-emerald-400">AIServiceActive = true</code>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
