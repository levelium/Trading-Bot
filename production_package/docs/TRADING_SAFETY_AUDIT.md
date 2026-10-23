# FvgGold AI Trader — Trading Safety & Risk Audit

## 1. Safety Principles & Fail-Closed Architecture

The FvgGold AI Trader enforces a **fail-closed** architecture:
* If the Python AI service is unreachable, offline, timing out, or returns an error, the EA **will not trade**.
* If `CancelPendingIfAIUnavailable = true`, any pending limit orders placed for unmitigated FVGs are automatically removed when communication drops.
* The AI service acts solely as a **conservative setup reviewer**. It cannot force trades, increase lot sizes, average down, remove stop losses, or bypass the EA's local hard risk limits.
* If the AI approves a trade, but local risk limits (daily loss limit, max spread, margin check) are breached, the EA rejects the trade locally.

---

## 2. Risk Sizing & Contract Specifications

### Fixed vs. Risk-Based Lot Calculation
When `FixedLot = 0.0`, the EA calculates position size strictly from the account equity and stop loss distance:

$$\text{Risk Amount (\$) } = \text{Account Equity} \times \frac{\text{RiskPercent}}{100}$$

$$\text{Calculated Lot} = \frac{\text{Risk Amount}}{\left(\frac{\text{SL Distance}}{\text{Tick Size}}\right) \times \text{Tick Value}}$$

### Minimum Lot Floor Protection:
A common bug in retail trading bots is forcing the broker minimum lot (e.g. `0.01`) when calculated risk would require `0.004` lots. On a small account, forcing a `0.01` lot might risk 3% or 5% of the account instead of the desired 0.25%.
**FvgGold v2.20 safety check:**
```mql5
// Never force the broker minimum if it breaches the configured risk budget
if(lot < validMin - 0.0000001) return(0);
```
If your account size is too small for a 0.25% risk stop loss on Gold, the EA **rejects the setup** instead of over-leveraging your account.

### Volume Step Rounding:
Broker trade servers reject order placement with error `10014 (TRADE_RETCODE_INVALID_VOLUME)` if lot sizes do not match `SYMBOL_VOLUME_STEP`.
In v2.20, `NormalizeLot()` determines the decimal resolution of `lotStep` and calculates:
```mql5
lot = MathFloor((lot / lotStep) + 0.00001) * lotStep;
lot = NormalizeDouble(lot, lotDigits);
```

---

## 3. Daily Loss Limit & Floating Drawdown Tracking

In earlier versions, daily P/L only tallied closed trades from the account history. A trade experiencing large floating drawdown would not trigger the daily loss limit until the trade hit stop-loss or closed.

In v2.20, `TrackDailyPL()` tracks both:
1. `closedPL`: Deals closed since midnight server time.
2. `floatingPL`: Unrealized floating losses on open positions belonging to this Magic Number and Symbol.

```mql5
bool IsDailyLimitHit()
{
   if(DailyLossLimit <= 0) return(false);
   double totalNetPL = dailyPL + MathMin(0.0, floatingPL);
   return(totalNetPL <= -DailyLossLimit);
}
```
If total losses reach `-$DailyLossLimit`, the EA:
1. Stops evaluating new FVGs.
2. Cancels all outstanding pending limit orders.
3. Halts further order entry until midnight resets the daily cycle.

---

## 4. Spread and Market Execution Checks

Gold (`XAUUSD`) is prone to severe spread widening during rollover (21:00 - 23:00 GMT) and major economic news releases (CPI, NFP, FOMC).
* Before placing any order, the EA verifies:
  $$\text{Current Spread in Points} \le \text{MaxSpreadPoints}$$
* The Python service independently re-validates:
  $$\text{spread\_points} \le \text{MAX\_SPREAD\_POINTS}$$
* If spread is elevated, both tiers independently block the entry.

---

## 5. Duplicate Entry & Mitigation Protection

* **`HasOrderNearFVG`**: Scans all active orders and open positions for the comment tag `FVG_<time>`.
* **Database Signal Cache**: Checks table `processed_signals` using deterministic SHA-256 hash.
* **Mitigation Pruning**: If price penetrates beyond an FVG's midpoint before an entry triggers, the zone is flagged as mitigated and deleted from memory.

---

## 6. Restart Recovery & Trade Reconciliation

When MetaTrader 5 or the VPS restarts:
1. `OnInit()` restores indicator handles and establishes communication with the Python service.
2. `CountMyPositions()` and `CountMyPending()` scan all active orders and positions filtered strictly by `MagicNumber` and `Symbol()`.
3. `TrackDailyPL()` re-queries the broker's deal history from `dailyDate` to `TimeCurrent()`, restoring exact daily P/L state.
4. Active trades placed prior to restart continue to be monitored by `ManagePositions()` for break-even triggers.
