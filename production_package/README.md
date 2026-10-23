# FvgGold AI Trader — Production Package v2.20

**Architecture:** Distributed MetaTrader 5 Expert Advisor (Windows VPS) + Python AI Service (Shared Hosting or Windows VPS).  
**Strategy:** Conservative Fair Value Gap (FVG) + Order Block (OB) Confluence on Gold (XAUUSD M15).  
**Reviewer:** Google Gemini 2.5 Flash conservative market setup reviewer.

---

## What Is In This Package

```
FvgGold-AI-Trader-Production-Suite/
├── FvgGold-AI-Service/                # Python AI Decision & Review Service
│   ├── app.py                         # Universal WSGI & Standalone HTTP Application
│   ├── passenger_wsgi.py              # cPanel / CloudLinux Passenger Entry Point
│   ├── wsgi.py                        # Standard WSGI Entry Point (Gunicorn / Apache)
│   ├── ai_service.py                  # Windows VPS Standalone Runner
│   ├── config.py                      # Configuration Loader & Validator
│   ├── database.py                    # Dual SQLite & MySQL Persistence Layer
│   ├── schema.sql                     # Database Schema
│   ├── requirements.txt               # Dependencies (Standard Library first)
│   ├── .env.example                   # Safe Configuration Template (Zero Secrets)
│   ├── .htaccess                      # Apache / LiteSpeed Security Rules
│   ├── test_suite.py                  # 24 Automated Unit & Integration Tests
│   ├── test_local_status.ps1          # Diagnostic PowerShell Script
│   ├── start_service.bat              # Windows VPS Service Launcher
│   └── install_autostart.ps1          # Windows Scheduled Task Auto-Start
├── FvgGold-EA-main/                   # MetaTrader 5 Expert Advisor Tier
│   ├── FvgGold.mq5                    # Repaired MQL5 Source Code (v2.20)
│   ├── FvgGold.set                    # Parameter Preset with Conservative Risk Defaults
│   ├── README.md                      # Detailed Strategy & Input Documentation
│   └── mql5_description.md            # Technical Architecture Specification
└── docs/                              # Production Operations Documentation
    ├── REPAIR_PLAN_AND_AUDIT.md       # Full Audit & Confirmed Defect Analysis
    ├── WINDOWS_VPS_SETUP.md           # Step-by-Step Windows VPS & MT5 Setup
    ├── SHARED_HOSTING_DEPLOYMENT.md   # Step-by-Step cPanel / Passenger Deployment
    ├── HTTPS_AND_AUTH_GUIDE.md        # Authentication, Tokens & SSL Configuration
    ├── TRADING_SAFETY_AUDIT.md        # Risk Math, Lot Sizing & Drawdown Rules
    ├── TROUBLESHOOTING_GUIDE.md       # Root Causes for 1003, 401, 4014, and Fixes
    ├── CHANGELOG.md                   # Complete Version History
    └── ROLLBACK_INSTRUCTIONS.md       # Emergency Rollback Procedures
```

---

## Key Bugs Fixed in This Release

1. **PowerShell Unauthorized (`401`)**: Supported both `X-Service-Token` and standard `Authorization: Bearer` headers; added placeholder detection and diagnostic scripts.
2. **MT5 `AI: ACTIVE | AI service HTTP 1003`**: Identified code 1003 as MT5's internal `WebRequest` socket read-timeout error; added explicit `Connection: close` headers to prevent WinInet keep-alive hangs; combined heartbeat and status checks to eliminate dual blocking calls.
3. **Shared Hosting Incompatibility**: Re-architected the Python service into a standard WSGI application (`passenger_wsgi.py` / `app.py`) natively supported by cPanel Python App without requiring persistent arbitrary socket daemons.
4. **Floating Equity Drawdown**: Added unrealized floating losses to `dailyPL`, preventing trading during active intraday equity drawdowns.
5. **Volume Step Normalization**: Fixed floating-point lot step calculation to eliminate broker `retcode 10014 (INVALID_VOLUME)`.
6. **Duplicate Order Prevention**: Implemented deterministic SHA-256 signal hashing and database deduplication cache.

---

## Quick Start (3 Steps)

### Step 1: Deploy Python Service
* **On Shared Hosting (cPanel)**: Create a Python 3.10+ app with `passenger_wsgi.py`, copy `.env.example` to `.env`, set `AI_SERVICE_TOKEN`, and restart the app. (See `docs/SHARED_HOSTING_DEPLOYMENT.md`).
* **On Windows VPS**: Copy `.env.example` to `.env`, set `AI_SERVICE_TOKEN`, and run `start_service.bat`. (See `docs/WINDOWS_VPS_SETUP.md`).

### Step 2: Configure MT5
1. Copy `FvgGold-EA-main/FvgGold.mq5` into `MQL5\Experts\` on your Windows VPS.
2. Open MetaEditor (**F4**) and press **F7** to compile with 0 errors.
3. In MT5, go to **Tools → Options → Expert Advisors**, enable **"Allow WebRequest for listed URL"**, and add your service URL (`https://api.yourdomain.com` or `http://127.0.0.1:8787`).
4. Attach `FvgGold` to `XAUUSD` on the **M15** timeframe.
5. Set `AIServiceToken` to match `.env`.

### Step 3: Verify
Run `test_local_status.ps1` or check the MT5 chart dashboard for:
```
AI Gate: ACTIVE (CONNECTED)
Status: active
```

*Always test on an MT5 Demo Account before live use.*
