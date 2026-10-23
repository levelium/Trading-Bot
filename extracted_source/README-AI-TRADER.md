# FvgGold AI Conservative Trader — build package

This package upgrades the supplied FvgGold MT5 Expert Advisor with a local Gemini review service, fail-closed AI approval, risk checks, Telegram status/controls, and Windows Server setup files. It preserves the existing FVG/order-block strategy rather than replacing it.

## Important limits

- This is an AI-assisted rules-based EA, not a guaranteed-profitable trader and not a substitute for supervised testing.
- Gemini reviews only a candidate already found by the EA. It does not independently control the MT5 terminal or invent trades.
- The initial configuration is XAUUSD only, conservative, and risk-based. `FixedLot=0` uses risk sizing; if the broker's minimum lot would exceed the risk budget, the EA rejects the trade instead of forcing the minimum lot.
- AI approval requires FVG score >= 65, confidence >= 0.70, spread under the configured cap, and reward/risk >= 1.5. This is deliberately strict and may result in very few or no trades.
- Gemini does not receive a real-time economic calendar or broker news feed in this build. It is instructed not to invent news. Add a reliable news/calendar source only as a separately tested future integration.
- The service runs on `127.0.0.1`, so it is intended to run on the same Windows Server as MT5. Do not expose port 8787 to the public internet.
- Multiple keys help with some per-key errors, but keys in one Google Cloud project can share quota. Rotation cannot promise more quota.
- MT5 `WebRequest` is synchronous and unavailable in Strategy Tester. Backtesting the base strategy and live demo-forward-testing the complete AI flow are separate activities.

## Package layout

- `FvgGold-EA-main/FvgGold.mq5` — modified EA source, version 2.10.
- `FvgGold-EA-main/FvgGold.set` — original set file; review EA inputs before loading it because it may restore fixed-lot settings.
- `FvgGold-AI-Service/ai_service.py` — local HTTP service, Gemini key rotation, candidate validation, Telegram bot polling.
- `FvgGold-AI-Service/.env.example` — configuration template. Copy to `.env` and edit it.
- `FvgGold-AI-Service/start_service.bat` — starts the service.
- `FvgGold-AI-Service/install_autostart.ps1` — creates a Scheduled Task at user logon.
- `FvgGold-AI-Service/test_service.py` — local candidate-gate tests.

## 1. Prepare the Windows Server

1. Use the same Windows Server where the MT5 terminal will run. Keep the Windows trading user logged in for continuous operation.
2. Install a supported Python 3 release from the official Python website: https://www.python.org/downloads/windows/ . The service uses only Python's standard library; no `pip install` is required.
3. Extract this package into a folder such as `C:\FvgGoldAI`.
4. Open PowerShell in `FvgGold-AI-Service` and copy `.env.example` to `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

5. Generate a long local service secret:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

6. Put the generated value into `.env` as `AI_SERVICE_TOKEN=...`. Keep it private. You will also enter the same value in the EA input `AIServiceToken`.
7. Obtain Gemini API keys from Google's official AI Studio: https://aistudio.google.com/app/apikey . Put keys in `GEMINI_API_KEYS`, separated by commas. Do not put Gemini keys into MQL5 source, the `.set` file, Telegram, or screenshots. Never share `.env`.
8. The default model is `gemini-2.5-flash`; change `GEMINI_MODEL` if that model is not available to your account or has been retired. API availability, quota, and billing are controlled by Google.
9. Save `.env`. Ensure Windows file permissions restrict access to the trading user and administrators.

## 2. Start and test the AI service

Double-click `start_service.bat`, or run:

```powershell
python .\ai_service.py
```

A successful startup log should state that it listens on `127.0.0.1:8787`. If it exits, read the error and confirm `.env` contains a non-placeholder `AI_SERVICE_TOKEN`.

In a second PowerShell window, check the health endpoint:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/health
```

This public-to-local health endpoint contains no secrets. To test authenticated status, replace the token below with your own secret:

```powershell
$token = 'YOUR_AI_SERVICE_TOKEN'
Invoke-RestMethod -Headers @{ 'X-Service-Token' = $token } http://127.0.0.1:8787/status
```

Run local tests from the service folder:

```powershell
python -m unittest -v test_service.py
```

These tests validate local safety gates; they do not call Gemini or prove a strategy is profitable.

## 3. Install Telegram (optional but recommended)

1. In Telegram, open the official `@BotFather` bot: https://t.me/BotFather . Create a bot and copy its token into `TELEGRAM_BOT_TOKEN` in `.env`.
2. Obtain your numeric Telegram chat ID using a trusted bot or your own small bot script. Add only your own ID to `TELEGRAM_ALLOWED_CHAT_IDS`. Multiple IDs may be comma-separated, but only add people authorised to control trading.
3. Restart the AI service after editing `.env`.
4. Send `/start` to your bot. Supported commands: `/status`, `/analysis`, `/positions`, `/dailyreport`, `/pause`, `/resume`, `/stop`, `/help`.
5. `/pause` and `/stop` prevent new AI-approved entries; the EA cancels its pending orders at its next status check. They do not automatically close existing market positions. The EA continues its existing stop-loss/position-management logic while MT5 is running. Use the broker/MT5 terminal to handle an emergency liquidation decision.
6. `/resume` re-enables AI approvals. Verify the terminal, account, spread, risk settings, and demo status first.

## 4. Install the EA in MT5

1. In MT5, use **File → Open Data Folder**.
2. Copy `FvgGold-EA-main\FvgGold.mq5` into `MQL5\Experts\` (you can use a subfolder such as `MQL5\Experts\FvgGoldAI\`).
3. Press **F4** to open MetaEditor, open the copied file, and compile with **F7**. Check for zero errors. This package was not compiled in MetaEditor in this build environment, so compilation on your terminal is still required.
4. In MT5, open **Tools → Options → Expert Advisors** and add `http://127.0.0.1:8787` to the allowed WebRequest URL list. Do not add the Gemini API URL here; MT5 only contacts the local service.
5. Attach the EA to your broker's gold chart (often `XAUUSD`, `XAUUSD.a`, or `XAUUSDm`) on M15. This build only accepts symbols whose name contains `XAUUSD`.
6. In EA inputs set:
   - `UseAIApproval = true`
   - `AIServiceBaseURL = http://127.0.0.1:8787`
   - `AIServiceToken` = the exact same secret as `AI_SERVICE_TOKEN` in `.env`
   - `FixedLot = 0.0` (risk-based sizing)
   - `RiskPercent = 0.25`
   - `ConservativeRiskPercent = 0.25`
   - `MaxTrades = 1`
   - `DailyLossLimit` to an amount appropriate for your demo account currency and size
   - `MaxSpreadPoints` appropriate for your broker's symbol digits and normal spread
7. Confirm **Algo Trading** is enabled and that the terminal is connected to the demo account. The dashboard should show `AI: ACTIVE` after the service responds.
8. Do not load the old `FvgGold.set` without reviewing it. It can reset `FixedLot` or risk-related inputs. Use the defaults from the new source and check every input manually.

## 5. Conservative safety behavior

- If the service is unavailable, token mismatches, Gemini is unavailable, or AI returns a malformed/low-confidence/wrong-direction response, the EA does not place a new order.
- The EA cancels its own pending orders when the service is unavailable/paused if `CancelPendingIfAIUnavailable=true`.
- The EA retains local daily-loss checks and stop-loss/take-profit management.
- If the minimum tradable broker lot would exceed the configured risk budget, the EA rejects the candidate instead of increasing lot size.
- The local service validates symbol, direction, stop/target geometry, FVG score, spread, daily loss limit, requested risk cap, and minimum reward/risk independently of Gemini.
- API keys and Telegram bot tokens belong only in `.env`; the EA receives only the local shared secret.

## 6. Auto-start on Windows Server

After the service works manually and tests pass, open PowerShell as the same Windows user who runs MT5 and execute:

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\install_autostart.ps1
```

This creates a Scheduled Task at user logon. Confirm the task in Task Scheduler. The script does not install MT5 as a service and does not guarantee that the broker session remains logged in after reboot. Test reboot/reconnect behaviour before unattended use.

## 7. Demo validation checklist

Before any real funds are considered:

- Compile in MetaEditor and resolve all compiler errors/warnings.
- Verify `/health`, authenticated `/status`, and the EA's `AI: ACTIVE` status.
- Verify Gemini API keys are valid and quotas available; never test with a live-money account first.
- Verify one AI decision in Experts/service logs and check that the approved direction matches the candidate.
- Test invalid token, stopped service, all keys unavailable, Telegram `/pause`, `/stop`, and `/resume`.
- Confirm pending orders are cancelled when the service pauses or becomes unreachable.
- Confirm every order has a valid SL and TP and the lot-size risk calculation is appropriate for the broker's contract specifications.
- Test with MT5 demo forward data for several weeks and across different volatility conditions. Record drawdown, net expectancy after costs, profit factor, and execution errors.
- Never infer future performance from a short test or an AI confidence score.

## Notes on deployment

This is an implementation starter and must be compiled, configured, and tested on your broker/Windows Server before trading. Do not expose the local service port to the internet. Do not share `.env`, API keys, service token, account credentials, or Telegram bot token.

---

## Rebuild / unauthorized diagnostic update

See `REBUILD-AND-FIX-GUIDE.md` for the exact shared-token configuration steps and `FvgGold-AI-Service/test_local_status.ps1` for an authenticated `/status` test. The `/status` endpoint intentionally rejects unauthenticated requests; a plain `Invoke-RestMethod http://127.0.0.1:8787/status` call is expected to return `unauthorized`.
