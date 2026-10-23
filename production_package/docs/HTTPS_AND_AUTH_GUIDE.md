# FvgGold AI Trader — HTTPS & Authentication Security Guide

## 1. Authentication Protocol Architecture

Communication between the MetaTrader 5 Expert Advisor and the Python service relies on a shared high-entropy secret token passed via HTTP request headers:

```http
POST /decision HTTP/1.1
Host: api.yourdomain.com
User-Agent: FvgGold-EA/2.20
Connection: close
Accept: application/json
Content-Type: application/json
X-Service-Token: 6Yq3b7K_9J...vM4x8P2w
Content-Length: 1248
```

Both of the following header formats are accepted:
1. `X-Service-Token: <token>` (Default used by MQL5 EA)
2. `Authorization: Bearer <token>` (Standard OAuth2 / REST format supported by tools and curl)

---

## 2. Generating Strong Cryptographic Tokens

Never invent a token by hand or use dictionary words. Use Python's cryptographically secure pseudo-random number generator (`secrets` module):

```bash
# Generates 48 bytes of entropy encoded as a URL-safe base64 string (64 characters):
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Example output:
```text
kX8jV2m9Lp4QyRt6Wz1Nc0Bv5Fs8Gh3Jx7Ka9Sd2Fg4Hj6Kl8Mn0Pq2Rs4Tu6Vw8
```

### Critical Token Rules:
* Must be at least 32 characters long (48+ characters strongly recommended).
* Never share the token publicly, commit it to GitHub, or paste it into public forums.
* Configure the token in `.env` as `AI_SERVICE_TOKEN=...`.
* Configure the token in MT5 EA inputs as `AIServiceToken = ...`.
* Never enter Gemini API keys into `AIServiceToken`! They are distinct credentials.

---

## 3. Server-Side Constant-Time Validation

In `app.py`, token verification uses `secrets.compare_digest`:

```python
def verify_token(supplied_token: str) -> Tuple[bool, str]:
    if not config.SERVICE_TOKEN or config.SERVICE_TOKEN in config.PLACEHOLDER_TOKENS:
        return False, "Server authentication not configured: AI_SERVICE_TOKEN in .env is missing or placeholder"
    if not supplied_token:
        return False, "Missing authentication header (X-Service-Token or Authorization: Bearer)"
    if secrets.compare_digest(supplied_token, config.SERVICE_TOKEN):
        return True, ""
    return False, "Unauthorized: Invalid service token provided"
```

This prevents **timing side-channel attacks**, where an attacker measures slight differences in response times to guess individual characters of the secret token.

---

## 4. Anti-Replay & Timestamp Drift Guardrail

To prevent an adversary or malfunctioning network proxy from replaying old trading signals, candidate requests include a client timestamp. The Python service rejects any candidate where clock drift exceeds `MAX_REQUEST_DRIFT_SECONDS` (default 60 seconds):

```python
client_timestamp = int(c.get('client_timestamp', 0) or 0)
if client_timestamp > 0:
    drift = abs(int(time.time()) - client_timestamp)
    if drift > config.MAX_REQUEST_DRIFT_SECONDS:
        return f'Request expired: clock drift of {drift}s exceeds {config.MAX_REQUEST_DRIFT_SECONDS}s', None
```

Ensure both your Windows VPS clock and shared hosting server clocks are synchronized with standard NTP time servers.

---

## 5. Signal Idempotency & Deduplication

To prevent duplicate orders from being placed if network retries occur or if multiple ticks process the same bar, each candidate is hashed:

$$\text{signal\_id} = \text{SHA256}(\text{Symbol} + \text{Direction} + \text{BarTime} + \text{Entry} + \text{SL} + \text{TP})[0..24]$$

The database enforces a primary key constraint on `processed_signals.signal_id`. If an identical signal arrives a second time, it is recognized and safely rejected with:
```json
{
  "ok": true,
  "decision": "WAIT",
  "approved": false,
  "reason": "Duplicate signal detected: candidate has already been evaluated"
}
```

---

## 6. HTTPS and SSL/TLS Configuration on Shared Hosting

When hosting remotely, all communication **must** use HTTPS to encrypt payloads and tokens in transit.

1. **cPanel AutoSSL**: Most cPanel hosts automatically issue a free Let's Encrypt or Sectigo certificate within minutes of pointing your domain DNS records.
2. **Cloudflare**: If using Cloudflare DNS:
   * Set SSL/TLS encryption mode to **Full (Strict)**.
   * If you use Cloudflare, ensure you do not use Cloudflare's Bot Fight Mode on API subdomains, as MT5 WebRequest lacks a standard browser JavaScript engine and will receive challenge pages.
   * Add a Cloudflare Page Rule or WAF Rule to bypass bot challenges for your API path `/status`, `/heartbeat`, and `/decision` when the `X-Service-Token` header matches your secret.
