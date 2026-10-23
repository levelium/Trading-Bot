# FvgGold AI Trader — Windows VPS & MT5 Setup Guide

This guide walks through configuring the MetaTrader 5 terminal and the FvgGold MQL5 Expert Advisor on a Windows VPS.

---

## 1. MetaTrader 5 Terminal Preparation

1. Log into your Windows VPS using Remote Desktop (RDP).
2. Install your broker's MetaTrader 5 terminal.
3. Sign into your **Demo Account** first. Never use a live-money account during initial setup or testing.
4. Ensure the **Algo Trading** button on the MT5 top toolbar is enabled (green icon).

---

## 2. Install and Compile the EA in MetaEditor

1. Open MetaTrader 5.
2. Click **File → Open Data Folder**.
3. In the Windows File Explorer window that opens, navigate to:
   ```
   MQL5\Experts\
   ```
4. Copy the entire `FvgGold-EA-main` folder into `MQL5\Experts\`.
5. Return to MT5 and press **F4** on your keyboard (or click the IDE icon) to open **MetaEditor**.
6. In the MetaEditor Navigator on the left, expand `Experts` → `FvgGold-EA-main` and double-click `FvgGold.mq5`.
7. Press **F7** on your keyboard (or click **Compile** in the toolbar).
8. Verify the compilation log at the bottom:
   * It must report: `0 errors, 0 warnings`.
   * An executable file `FvgGold.ex5` is automatically generated in the same directory.
9. Close MetaEditor.

---

## 3. Enable WebRequest in MetaTrader 5

MetaTrader 5 blocks all outgoing HTTP/HTTPS calls by default for security. You must explicitly allow your Python service URL:

1. In MT5, click **Tools → Options** (or press **Ctrl + O**).
2. Switch to the **Expert Advisors** tab.
3. Ensure the following checkboxes are checked:
   * [x] **Allow algorithmic trading**
   * [x] **Allow WebRequest for listed URL**
4. Under the WebRequest list, click **Add new URL** (green plus icon) and add your Python service endpoint:
   * If running Python on the **same Windows VPS**:
     ```
     http://127.0.0.1:8787
     ```
   * If running Python on **Shared Hosting (HTTPS)**:
     ```
     https://api.yourdomain.com
     ```
   *(Be sure there are no trailing spaces or trailing slashes).*
5. Click **OK** to save settings.

---

## 4. Attach EA to Gold Chart and Configure Inputs

1. In the MT5 Market Watch window, locate your broker's gold symbol (typically `XAUUSD`, `XAUUSD.a`, or `GOLD`).
2. Right-click the symbol and choose **Chart Window**.
3. Set the chart timeframe to **M15** (15 Minutes).
4. In the MT5 Navigator panel (`Ctrl + N`), expand **Expert Advisors** and drag `FvgGold` onto the M15 chart.
5. In the Properties window that pops up, switch to the **Inputs** tab:
   * **UseAIApproval**: `true`
   * **AIServiceBaseURL**: `http://127.0.0.1:8787` (or your shared hosting `https://api.yourdomain.com`)
   * **AIServiceToken**: Paste the exact same token set in the Python service's `.env`
   * **FixedLot**: `0.0` (enables risk-based lot sizing)
   * **RiskPercent**: `0.25` (0.25% equity risk per trade)
   * **ConservativeRiskPercent**: `0.25`
   * **DailyLossLimit**: Set to an amount suitable for your demo balance (e.g. `$25.00` on a $1,000 account)
   * **MaxTrades**: `1`
   * **MaxSpreadPoints**: `80.0` (adjust based on broker typical gold spread)
   * **CancelPendingIfAIUnavailable**: `true` (ensures fail-closed protection)
6. Switch to the **Common** tab and verify:
   * [x] **Allow Algo Trading** is checked.
7. Click **OK**.

---

## 5. Verify Successful Operation on Chart

Within 5 seconds, the top-left chart dashboard will update:

```
=== FvgGold AI Trader v2.20 ===
HTF Bias: BULLISH | Exec TF: PERIOD_M15
ATR: 4.85 | Session: ACTIVE
Active FVGs: 2 | OBs: 1
Open Trades: 0 | Pending: 0
Daily P/L: $0.00 (Floating: $0.00)
AI Gate: ACTIVE (CONNECTED)
Status: active
```

If you see `AI Gate: ACTIVE (CONNECTED)`, your EA and Python AI service are fully linked, authenticated, and monitoring the market with complete risk controls.
