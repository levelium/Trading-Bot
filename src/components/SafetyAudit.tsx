import React from 'react';
import { ShieldCheck, TrendingUp, DollarSign, Lock, AlertOctagon, CheckCircle2 } from 'lucide-react';

export const SafetyAudit: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-amber-400" />
          <span>Trading Safety & Strategy Audit</span>
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Detailed verification of the core FVG strategy, lot sizing math, drawdown protections, and conservative fail-closed gates.
        </p>
      </div>

      {/* Two Tier Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Preserved Strategy Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span>Preserved Core FVG Trading Strategy</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">M15 Fair Value Gap Detection</strong>
                <span className="text-slate-400">Scans 3-candle imbalance gaps (Low[i-2] &gt; High[i] for Bullish, High[i-2] &lt; Low[i] for Bearish) with minimum point gap threshold.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Multi-Factor Quality Scoring (0–100)</strong>
                <span className="text-slate-400">Scores displacement candle body/range ratio (30%), gap size vs ATR (30%), HTF alignment (20%), freshness (10%), and Premium/Discount location (10%). Requires score &ge; 65 for AI approval.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Order Block Confluence Bonus (+20 pts)</strong>
                <span className="text-slate-400">Detects preceding impulse candles exceeding 1.5x ATR. Awards +20 point bonus when FVG overlaps or lies near an active Order Block.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">H1 Higher Timeframe Trend Bias</strong>
                <span className="text-slate-400">EMA 50 vs EMA 200 on H1 period. Filters out trades opposing macro direction.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">London / NY Killzone Filter</strong>
                <span className="text-slate-400">Restricts order placement to peak institutional liquidity windows (London 07:00–10:00 GMT, Overlap 12:00–16:00 GMT, NY session to 21:00 GMT).</span>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Risk Protections Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center space-x-2 border-b border-slate-800 pb-3">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Audited & Hardened Risk Controls</span>
          </h3>

          <div className="space-y-3 text-xs text-slate-300">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Exact Risk-Based Sizing ($/tick formula)</strong>
                <span className="text-slate-400">Position size scales strictly to stop-loss distance and equity risk percent (0.25%).</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Conservative Lot Floor Protection</strong>
                <span className="text-slate-400">If calculated risk lot is smaller than broker minimum (e.g. calculated 0.003 lots vs 0.01 min), the EA rejects the trade rather than forcing minimum lot and over-risking.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Daily Loss Limit with Floating Equity Drawdown</strong>
                <span className="text-slate-400">Tracks closed deals PLUS open floating losses (<code className="text-amber-300">closedPL + min(0, floatingPL)</code>). Instantly halts new entries and deletes pending orders if breached.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Strict Volume Step Normalization</strong>
                <span className="text-slate-400">Rounds to broker <code className="text-slate-200">SYMBOL_VOLUME_STEP</code> with decimal precision protection, eliminating broker reject error 10014.</span>
              </div>
            </div>

            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-white block">Fail-Closed & Order Pruning</strong>
                <span className="text-slate-400">If the Python service is offline, token is mismatched, or Gemini is unavailable, all pending limit orders are automatically cancelled and no new orders are entered.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
          Independent Two-Tier Validation Matrix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase">
                <th className="pb-3 font-semibold">Rule / Check</th>
                <th className="pb-3 font-semibold">MT5 EA Tier</th>
                <th className="pb-3 font-semibold">Python AI Tier</th>
                <th className="pb-3 font-semibold">Action On Breach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="py-2.5 font-medium text-white">Symbol Restriction</td>
                <td className="py-2.5 font-mono text-emerald-400">Symbol() contains XAUUSD</td>
                <td className="py-2.5 font-mono text-emerald-400">Enforced XAUUSD</td>
                <td className="py-2.5 text-rose-400 font-medium">Reject immediately</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Reward-to-Risk Ratio</td>
                <td className="py-2.5 font-mono text-emerald-400">R:R &ge; 1.5 Target</td>
                <td className="py-2.5 font-mono text-emerald-400">Hard reject if R:R &lt; 1.5</td>
                <td className="py-2.5 text-rose-400 font-medium">Reject immediately</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Maximum Spread Points</td>
                <td className="py-2.5 font-mono text-emerald-400">Spread &le; MaxSpreadPoints</td>
                <td className="py-2.5 font-mono text-emerald-400">Spread &le; MAX_SPREAD_POINTS</td>
                <td className="py-2.5 text-rose-400 font-medium">Block order entry</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">FVG Quality Score</td>
                <td className="py-2.5 font-mono text-emerald-400">MinScoreFVG &ge; 50</td>
                <td className="py-2.5 font-mono text-emerald-400">Conservative gate &ge; 65</td>
                <td className="py-2.5 text-rose-400 font-medium">Wait / No approval</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Daily Loss Limit ($)</td>
                <td className="py-2.5 font-mono text-emerald-400">Closed + Floating Loss Check</td>
                <td className="py-2.5 font-mono text-emerald-400">Candidate daily_pl check</td>
                <td className="py-2.5 text-rose-400 font-medium">Cancel pendings, halt trades</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">Duplicate Signal / Bar</td>
                <td className="py-2.5 font-mono text-emerald-400">HasOrderNearFVG tag check</td>
                <td className="py-2.5 font-mono text-emerald-400">Database primary key hash</td>
                <td className="py-2.5 text-rose-400 font-medium">Reject duplicate signal</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-white">AI Direction Reversal</td>
                <td className="py-2.5 font-mono text-emerald-400">Must match candidate direction</td>
                <td className="py-2.5 font-mono text-emerald-400">AI cannot flip direction</td>
                <td className="py-2.5 text-rose-400 font-medium">Forced to WAIT</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
