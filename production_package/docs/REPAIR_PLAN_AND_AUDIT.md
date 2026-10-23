# FvgGold AI Trader — Complete System Audit & Repair Plan

## 1. Executive Architecture Map

The system consists of two distributed tiers connected over an authenticated HTTP/HTTPS JSON protocol:

```
+-------------------------------------------------------------------------+
|                              WINDOWS VPS                                |
|                                                                         |
|  [ MetaTrader 5 Terminal ]                                              |
|         │                                                               |
|         ▼                                                               |
|  [ FvgGold.mq5 EA (v2.20) ]                                             |
|     - Scans M15 Fair Value Gaps (FVG) and Order Blocks (OB)             |
|     - Computes HTF H1 EMA Bias (50/200) & Killzone Filter               |
|     - Calculates conservative risk lot size ($/tick)                   |
|     - Enforces local Daily Loss Limits (closed + floating P/L)          |
|     - Generates unique signal_id and timestamp anti-replay              |
|     - Dispatches WebRequest POST /decision with closed candle arrays    |
+-------------------------------------------------------------------------+
                                 │
           Authenticated HTTPS / HTTP (Port 443 / 8787)
           Headers: X-Service-Token / Authorization: Bearer
           Keep-Alive: Connection: close
                                 ▼
+-------------------------------------------------------------------------+
|             PYTHON HOSTING TIER (Shared Hosting or Windows VPS)         |
|                                                                         |
|  [ WSGI Web Server: cPanel Passenger / Apache / LiteSpeed / Gunicorn ]  |
|         │                                                               |
|         ▼                                                               |
|  [ app.py / passenger_wsgi.py (FvgGold AI Service v2.20) ]              |
|     ├── Security Layer: Constant-time token verification                |
|     ├── Anti-Replay: 60-second max drift check                          |
|     ├── Deduplication: Database processed_signals tracking              |
|     ├── Local Validation Gate: Direction, geometry, R:R >= 1.5, score   |
|     ├── Database Persistence: SQLite (default) or MySQL (cPanel)        |
|     └── Google Gemini AI Multi-Key Pool (Rotation & Cooldown)           |
+-------------------------------------------------------------------------+
                                 │
                     HTTPS Outbound (Port 443)
                                 ▼
+-------------------------------------------------------------------------+
|                      GOOGLE GEMINI AI STUDIO                            |
|  Model: gemini-2.5-flash (Conservative Market Reviewer)                 |
+-------------------------------------------------------------------------+
```

---

## 2. Confirmed Defects vs. Suspected Problems

| ID | Issue Description | Classification | Root Cause & Mechanism | Solution Applied |
|---|---|---|---|---|
| **D1** | PowerShell returns `{"ok":false,"error":"unauthorized"}` | **Confirmed Defect** | The `/status` endpoint requires `X-Service-Token`. Running `Invoke-RestMethod` without headers or with default placeholder token triggers 401. | Added support for standard `Authorization: Bearer` alongside `X-Service-Token`; updated PowerShell diagnostics with automated token extraction and clear feedback; enforced placeholder rejection. |
| **D2** | MT5 displays `AI: ACTIVE \| AI service HTTP 1003` | **Confirmed Defect** | `code 1003` is MetaTrader 5's internal `WebRequest` client read-timeout error (often paired with error 5203). Python's default `BaseHTTPRequestHandler` did not send `Connection: close`, causing WinInet persistent keep-alive sockets to hang. In `RefreshAIServiceState()`, `/status` succeeded (setting `AIServiceActive=true`), but subsequent `/heartbeat` timed out with 1003, overwriting status text without resetting state. | 1. Added `Connection: close` and `User-Agent` headers to both EA and Python service.<br>2. Combined `/heartbeat` response to return active state directly, eliminating dual round-trip stalls.<br>3. Classified code 1003 in MQL5 as a timeout/connection error rather than an HTTP status code. |
| **D3** | Standalone server incompatible with Shared Hosting | **Confirmed Defect** | Original `ai_service.py` was a standalone socket server bound to `127.0.0.1:8787`. Shared hosts (cPanel, Passenger, CloudLinux) prohibit opening custom daemon ports and require a standard WSGI entry point. | Created universal WSGI application (`app.py`, `passenger_wsgi.py`, `wsgi.py`) callable by cPanel Passenger, Apache mod_wsgi, or Gunicorn over standard HTTPS port 443. |
| **D4** | Floating drawdown excluded from Daily Loss Limit | **Confirmed Defect** | `TrackDailyPL()` only summed closed deals from history. An open trade suffering significant floating drawdown would not trigger the daily loss limit until closed. | Updated `TrackDailyPL()` to calculate `totalNetPL = closedDailyPL + MathMin(0.0, floatingPL)`, immediately halting entries if floating equity breach occurs. |
| **D5** | Duplicate signal execution risk | **Confirmed Defect** | EA only checked comment tags for order existence. If broker truncated comment strings or execution lagged, identical FVG candidates could trigger repeated orders. | Implemented SHA-256 deterministic `signal_id` generation and server-side database deduplication cache (`processed_signals` table). |
| **D6** | Broker Volume Step Truncation (`retcode 10014`) | **Confirmed Defect** | Floating point imprecision in `MathFloor(lot / lotStep) * lotStep` produced unnormalized floats rejected by strict broker trade servers. | Implemented decimal precision normalization using `lotStep` digit resolution and an epsilon offset before flooring. |

---

## 3. File-by-File Repair Plan

### Python AI Service
1. **`app.py`**: Refactored into a universal WSGI application with full standalone HTTP server compatibility. Implemented constant-time auth comparison, `Connection: close` headers, replay drift protection, candidate validation, signal deduplication, and Gemini key cooldown.
2. **`passenger_wsgi.py`**: Added cPanel / CloudLinux Passenger application entry point.
3. **`wsgi.py`**: Added standard WSGI runner for Gunicorn and Apache.
4. **`ai_service.py`**: Preserved as backwards-compatible entry point for Windows VPS batch launching.
5. **`config.py`**: Added centralized configuration loader, secret masking, and validator.
6. **`database.py`**: Added database persistence layer supporting dual SQLite and MySQL.
7. **`schema.sql`**: Created SQL schema for signal deduplication, trade decisions, heartbeats, and audit logs.
8. **`.env.example`**: Safe configuration template with zero real secrets.
9. **`.htaccess`**: Added Apache / LiteSpeed protection denying public access to `.env` and `.sqlite3`.
10. **`test_suite.py`**: 24 automated unit & integration tests covering all critical paths.
11. **`test_local_status.ps1`**: Fixed PowerShell diagnostic script.

### MetaTrader 5 Expert Advisor
1. **`FvgGold.mq5`** (v2.20 Production):
   - Added `Connection: close`, `User-Agent: FvgGold-EA/2.20`, and `Accept: application/json` headers.
   - Updated `AIHttpRequest` to correctly distinguish MT5 internal code `1003` from real HTTP status codes.
   - Streamlined `RefreshAIServiceState()` to use `/heartbeat` bidirectional state retrieval.
   - Added floating equity loss to `dailyPL`.
   - Fixed `NormalizeLot()` volume step normalization.
   - Added `signal_id` and `client_timestamp` to candidate payloads.
2. **`FvgGold.set`**: Validated and updated with conservative default parameters.
