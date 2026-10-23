# FvgGold AI Trader — rebuilt diagnostic package

This package preserves the existing FVG strategy and source files. It adds clearer recovery/deployment instructions and an authenticated PowerShell health-check to address the observed `unauthorized` response. It is not a claim that the EA has been compiled in MetaEditor or tested on a live broker.

## 1. Fix the current `unauthorized` result on Windows VPS

The Python service intentionally protects `/status` with the `X-Service-Token` header. This command will normally fail with `unauthorized` because it does not send that header:

```powershell
Invoke-RestMethod http://127.0.0.1:8787/status
```

### Configure one shared secret

1. In `FvgGold-AI-Service`, copy `.env.example` to `.env`.
2. Generate a strong token in PowerShell:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

3. Put the generated value after `AI_SERVICE_TOKEN=` in `.env`. Do not include spaces around the value.
4. Start/restart the Python service using `start_service.bat`.
5. In MT5, open the EA's Inputs and set `AIServiceToken` to **exactly the same value**. Do not leave `CHANGE_ME_TO_MATCH_ENV`.
6. In MT5, go to Tools → Options → Expert Advisors and add `http://127.0.0.1:8787` to the allowed WebRequest URLs. Restart/re-attach the EA if needed.
7. Run `test_local_status.ps1` from the `FvgGold-AI-Service` directory. It reads the token from `.env` and sends the correct header.

Never put a Gemini API key in `AIServiceToken`. These are separate credentials. Never publish `.env` or share either secret.

## 2. Expected test results

- `/health` is a public, minimal process-health endpoint and does not prove the token is correct.
- `/status` requires `X-Service-Token`. A successful response should contain `ok: true`, an `active` field, and the configured model/key count.
- If `/status` returns `unauthorized`, the token is missing or differs from the service's `.env` token.
- If MT5 reports `WebRequest failed error=...`, check the MT5 WebRequest allow-list and local firewall.
- If MT5 reports `AI service HTTP 401`, check that the EA input token exactly matches `.env` and restart/re-attach the EA.
- If MT5 reports another HTTP status, inspect `ai_service.log` for the matching request and error.

The EA intentionally fails closed when AI approval is unavailable. Do not disable this protection to force trades.

## 3. Test the service logic

From the service folder:

```powershell
python test_service.py
```

The current eight candidate-validation unit tests passed during packaging. They test local candidate validation only; they do not test Gemini connectivity, broker execution, EA compilation, profitability, or live-market behaviour.

## 4. About shared hosting

The included `ai_service.py` is a local threaded HTTP server based on Python's `http.server`; it is not a WSGI entry point for typical cPanel Python App hosting. Do not upload it unchanged and assume it will run there. A separate shared-hosting adapter and secure public HTTPS URL will be needed, and the EA's `AIServiceBaseURL` will then need to use that HTTPS URL. Check that the host permits outbound Gemini HTTPS calls, the required Python version, and persistent or scheduled work as needed.

When remote hosting is configured, do not expose the local service on `0.0.0.0` without a firewall and TLS/reverse proxy. Prefer HTTPS, a strong shared secret, request limits, timestamp/replay protection, and restrictive server-side network rules.

## 5. Live-trading caution

Use a demo account while testing. Review daily-loss calculations, floating equity drawdown, order duplication, position sizing, spread limits, broker symbol naming, and fail-closed behaviour before live use. An AI approval is not a guarantee of a profitable or safe trade.
