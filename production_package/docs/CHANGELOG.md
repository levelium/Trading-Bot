# FvgGold AI Trader — Version Changelog

## Version 2.20 (Production Rebuild & Shared Hosting Adaptation)

### Security & Authentication:
* **Fixed Authentication 401 bug**: Implemented dual-header support (`X-Service-Token` and `Authorization: Bearer <token>`).
* **Constant-Time Verification**: Replaced naive string comparisons with `secrets.compare_digest` to prevent timing attacks.
* **Placeholder Guard**: Enforced strict startup rejection of default placeholder tokens (`CHANGE_ME_TO_MATCH_ENV`, etc.).
* **Anti-Replay Protection**: Added client timestamp validation with 60-second max drift rejection.
* **Signal Deduplication**: Implemented deterministic SHA-256 `signal_id` hashing with database primary key enforcement to prevent duplicate orders.
* **Secret Masking**: Ensured tokens, API keys, and database passwords are never printed to logs or HTTP error responses.

### Network Protocol & MT5 Compatibility:
* **Fixed MT5 HTTP 1003 bug**: Identified code 1003 as MT5's internal `WebRequest` read-timeout/socket error. Added explicit `Connection: close`, `User-Agent: FvgGold-EA/2.20`, and `Accept: application/json` headers on both client and server to prevent socket hang.
* **Unified Heartbeat & Status**: Enhanced `/heartbeat` to return the service active status in a single round trip, cutting synchronous blocking HTTP calls by 50%.
* **Diagnostic Code Disambiguation**: Updated MQL5 to distinguish internal WebRequest codes (`1003`) from RFC HTTP status codes.

### Shared Hosting Adaptation:
* **WSGI Compliance**: Implemented standard WSGI entry points (`app.py`, `passenger_wsgi.py`, `wsgi.py`) natively supported by cPanel Python App (CloudLinux Passenger), Apache mod_wsgi, and Gunicorn.
* **No Persistent Port Daemon Requirement**: Allowed request-driven execution over standard HTTPS port 443 without requiring custom socket listeners or root server privileges.
* **Database Layer**: Implemented dual SQLite (zero-config file DB) and MySQL persistence for trade decisions, heartbeats, and audit logs.
* **Apache Security Configuration**: Provided `.htaccess` protecting `.env`, `.sqlite3`, and `.log` files from public web access.

### Trading Safety & Risk Controls:
* **Daily Loss Limit Hardening**: Enhanced `TrackDailyPL()` to calculate `totalNetPL = closedDailyPL + MathMin(0.0, floatingPL)`, ensuring unrealized floating drawdowns immediately halt new entries.
* **Volume Step Precision**: Fixed `NormalizeLot()` to round using broker volume step decimal resolution, eliminating broker `10014 (INVALID_VOLUME)` rejections.
* **Conservative Lot Floor**: Enforced rejection of candidates where the calculated risk lot is smaller than broker minimum, preventing over-leveraged trades on smaller accounts.
* **Independent Two-Tier Risk Gates**: Re-validated spread, FVG score, geometry, and risk percent on the Python server independently of the EA.

### Testing & Deliverables:
* **24 Automated Tests**: Built comprehensive `test_suite.py` covering authentication, status, validation, replay, deduplication, Gemini failover, and WSGI compliance.
* **Updated Diagnostic Tools**: Enhanced `test_local_status.ps1` with automated token reading and multi-endpoint verification.
