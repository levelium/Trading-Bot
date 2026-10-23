# FvgGold AI Trader — Troubleshooting & Diagnostics Guide

This reference guide provides root-cause explanations and corrective steps for common setup and operational issues.

---

## 1. PowerShell: `{"ok":false,"error":"unauthorized"}`

### Symptom:
Running `Invoke-RestMethod http://127.0.0.1:8787/status` returns:
```json
{"ok": false, "error": "unauthorized"}
```

### Cause:
1. The `/status` endpoint is protected and requires an authentication token.
2. The request was sent without the `X-Service-Token` or `Authorization: Bearer` header.
3. Or the token sent does not match `AI_SERVICE_TOKEN` in `.env`.
4. Or `.env` still contains a default placeholder such as `CHANGE_ME_TO_MATCH_ENV`.

### Fix:
1. Open `.env` in the `FvgGold-AI-Service` folder.
2. Generate a valid token:
   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
3. Set `AI_SERVICE_TOKEN=<your_new_token>` in `.env`.
4. Restart the Python service.
5. Run the included diagnostic script:
   ```powershell
   .\test_local_status.ps1
   ```
   This script automatically reads your `.env` token and tests both public `/health` and authenticated `/status`.

---

## 2. MT5 Chart: `AI: ACTIVE | AI service HTTP 1003`

### Symptom:
The chart dashboard indicates `AI: ACTIVE`, but displays `AI service HTTP 1003`.

### Cause:
1. **1003 is NOT an HTTP response code**; it is MetaTrader 5's internal `WebRequest` client read-timeout error (paired with error `5203`).
2. Python's default HTTP server did not send an explicit `Connection: close` header, causing MT5's WinInet client to keep TCP sockets open expecting persistent keep-alive data. When the read timeout was reached, MT5 generated code `1003`.
3. In earlier versions, `RefreshAIServiceState()` called `/status` (succeeding and setting `AIServiceActive=true`), and then immediately called `/heartbeat`. When `/heartbeat` timed out with 1003, it overwrote the status text without resetting the active flag.

### Fix (Resolved in v2.20):
1. **Header fix**: Both the Python service and MQL5 EA now exchange `Connection: close` headers and close sockets cleanly on every request.
2. **Unified sync**: `RefreshAIServiceState()` now retrieves active state directly in the `/heartbeat` response, eliminating dual blocking calls.
3. **Diagnostic classification**: MQL5 now correctly reports code 1003 as `MT5 WebRequest timeout/connection error (1003)` rather than mislabeling it as an HTTP status code.

---

## 3. MT5: `WebRequest failed error=4014`

### Symptom:
The MT5 chart displays `URL not allowed` or `WebRequest failed error=4014`.

### Cause:
In MetaTrader 5, error `4014` is `ERR_FUNCTION_NOT_ALLOWED`. It means the target URL has not been added to MT5's trusted WebRequest whitelist.

### Fix:
1. In MT5, open **Tools → Options → Expert Advisors**.
2. Check **"Allow WebRequest for listed URL"**.
3. Add your exact base URL:
   * For local VPS: `http://127.0.0.1:8787`
   * For shared hosting: `https://api.yourdomain.com`
4. Ensure there is no trailing slash (`/`) and no trailing spaces.
5. Click **OK** and reload or re-attach the EA.

---

## 4. MT5: `AI service HTTP 401`

### Symptom:
The chart displays `HTTP 401 Unauthorized`.

### Cause:
The `AIServiceToken` entered in MT5's EA Inputs does not match `AI_SERVICE_TOKEN` in the Python service's `.env` file.

### Fix:
1. Open the `.env` file on your server and copy the exact value of `AI_SERVICE_TOKEN`.
2. On the MT5 chart, press **F7** to open EA Properties.
3. Switch to the **Inputs** tab and paste the token into `AIServiceToken`.
4. Ensure there are no accidental spaces before or after the token.
5. Click **OK**.

---

## 5. MT5: `AI service HTTP 503`

### Symptom:
The chart displays `HTTP 503 AI Service Unavailable`.

### Cause:
1. No Gemini API keys are configured in `GEMINI_API_KEYS` in `.env`.
2. All configured Gemini API keys have exhausted their quota or are cooling down after rate limits.
3. Outbound HTTPS connections to Google's API (`generativelanguage.googleapis.com`) are blocked by your server firewall or shared hosting outbound rules.

### Fix:
1. In `.env`, add 1 or 2 fresh Gemini API keys from https://aistudio.google.com/app/apikey.
2. Test outbound connectivity from your server:
   ```bash
   curl -I https://generativelanguage.googleapis.com
   ```
3. Restart the Python service.

---

## 6. Broker Trade Error: `retcode 10014 (INVALID_VOLUME)`

### Symptom:
The Experts tab logs `BuyLimit failed retcode=10014`.

### Cause:
The calculated lot size does not conform to the broker's minimum lot or volume step (e.g. attempting to place `0.025` lots when the broker requires `0.01` steps).

### Fix:
FvgGold v2.20 includes fixed lot normalization:
```mql5
lot = MathFloor((lot / lotStep) + 0.00001) * lotStep;
lot = NormalizeDouble(lot, lotDigits);
```
Confirm your broker symbol properties in MT5 Market Watch (`Right-click symbol → Specification`) and verify `Volume step` and `Volume min`.
