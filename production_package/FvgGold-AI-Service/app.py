#!/usr/bin/env python3
"""
FvgGold AI Trader - Production Universal WSGI & HTTP Application
Compatible with:
  1. Python Shared Hosting (cPanel Python App, CloudLinux Passenger, Apache mod_wsgi)
  2. Windows VPS & Dedicated Server (Standalone HTTP Server or Gunicorn)
"""
from __future__ import annotations
import json
import os
import sys
import time
import threading
import logging
import urllib.request
import urllib.error
import secrets
import re
from typing import Dict, Any, Tuple, List, Optional
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import config
from database import db

# Configure logging
log_handlers = [logging.StreamHandler(sys.stdout)]
if config.LOG_FILE:
    try:
        log_handlers.append(logging.FileHandler(config.LOG_FILE, encoding='utf-8'))
    except Exception as e:
        sys.stderr.write(f"Could not open log file {config.LOG_FILE}: {e}\n")

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=log_handlers
)
log = logging.getLogger('fvg-app')

# In-memory service state (synchronized with thread lock)
state_lock = threading.RLock()
service_state: Dict[str, Any] = {
    'paused': False,
    'stopped': False,
    'started_at': time.time(),
    'last_heartbeat': None,
    'heartbeat': {},
    'last_decision': {},
    'last_analysis': {},
    'key_index': 0,
    'key_cooldowns': {},
    'key_last_used': None,
    'last_error': None,
}

def json_bytes(obj: Any) -> bytes:
    return json.dumps(obj, separators=(',', ':'), ensure_ascii=False).encode('utf-8')

def is_active() -> bool:
    with state_lock:
        return bool(config.GEMINI_KEYS) and not service_state['paused'] and not service_state['stopped']

def build_status_payload() -> Dict[str, Any]:
    with state_lock:
        hb = service_state['heartbeat'] or {}
        last_hb = service_state['last_heartbeat']
        age = None if not last_hb else max(0, int(time.time() - last_hb))
        active = bool(config.GEMINI_KEYS) and not service_state['paused'] and not service_state['stopped']
        
        if not config.GEMINI_KEYS:
            status = 'no_gemini_keys'
        elif service_state['stopped']:
            status = 'stopped'
        elif service_state['paused']:
            status = 'paused'
        else:
            status = 'active'
            
        config_issues = config.validate_config()

        return {
            'ok': True,
            'service': 'FvgGold AI Trader',
            'version': '2.20',
            'active': active,
            'status': status,
            'model': config.MODEL,
            'configured_keys': len(config.GEMINI_KEYS),
            'heartbeat_age_seconds': age,
            'mt5_connected_recently': (age is not None and age <= 45),
            'database_type': db.db_type,
            'config_valid': len(config_issues) == 0,
            'config_issues': config_issues,
            'last_decision': service_state['last_decision'],
            'heartbeat': hb,
            'last_error': service_state['last_error']
        }

def get_key_order() -> List[int]:
    now = time.time()
    with state_lock:
        n = len(config.GEMINI_KEYS)
        if not n:
            return []
        start = service_state['key_index'] % n
        order = [(start + i) % n for i in range(n)]
        return [i for i in order if service_state['key_cooldowns'].get(str(i), 0) <= now]

def cooldown_key(index: int, seconds: int, reason: str) -> None:
    with state_lock:
        service_state['key_cooldowns'][str(index)] = time.time() + seconds
        service_state['last_error'] = reason
        if config.GEMINI_KEYS:
            service_state['key_index'] = (index + 1) % len(config.GEMINI_KEYS)

def extract_gemini_text(result: dict) -> str:
    candidates = result.get('candidates') or []
    if not candidates:
        raise ValueError('Gemini returned no candidates')
    parts = ((candidates[0].get('content') or {}).get('parts')) or []
    text = ''.join(str(p.get('text', '')) for p in parts if isinstance(p, dict))
    if not text:
        raise ValueError('Gemini returned an empty response')
    text = re.sub(r'^\s*```(?:json)?\s*|\s*```\s*$', '', text, flags=re.I)
    return text.strip()

def call_gemini(candidate: dict) -> dict:
    if not config.GEMINI_KEYS:
        raise RuntimeError('No Gemini API keys configured in environment')
    
    system = (
        "You are the senior quantitative market structure analyst for FvgGold AI Trader, "
        "an institutional-grade automated trading system specialized exclusively in Gold (XAUUSD).\n\n"
        "=== TRADING STRATEGY TUTORIAL & KNOWLEDGE BASE ===\n"
        "MODULE 1: MARKET STRUCTURE & TREND ALIGNMENT\n"
        "- HTF H1 Bias: Bullish when price > 50 EMA > 200 EMA with Higher Highs/Lows. "
        "Bearish when price < 50 EMA < 200 EMA with Lower Highs/Lows.\n"
        "- Rule: NEVER approve BUY into established Bearish HTF structure unless confirmed Change of Character (CHoCH) and Break of Structure (BOS).\n"
        "- Rule: NEVER approve SELL into established Bullish HTF structure.\n\n"
        "MODULE 2: FAIR VALUE GAPS (FVG)\n"
        "- 3-Candle Imbalance: Bullish = Candle 1 High < Candle 3 Low. Bearish = Candle 1 Low > Candle 3 High.\n"
        "- Displacement: Candle 2 must have an expansive body with high volume relative to ATR.\n"
        "- Mitigation: If price traded past 50% midpoint (Consequent Encroachment), the FVG is mitigated and invalid.\n"
        "- Premium vs Discount: Bullish entries must be in DISCOUNT (below dealing range equilibrium); Bearish entries in PREMIUM.\n\n"
        "MODULE 3: ORDER BLOCKS (OB) & LIQUIDITY\n"
        "- OB: Origin candle before the displacement impulse that formed the FVG.\n"
        "- Sweeps: Prioritize setups following liquidity sweeps of equal highs (BSL) or equal lows (SSL).\n"
        "- OB Confluence: FVG overlapping or immediately adjacent to unmitigated OB is high conviction.\n\n"
        "MODULE 4: ENTRY CONFIRMATION & DECISION LOGIC\n"
        "- BUY: Proposed direction BUY, HTF Bullish/CHoCH, FVG fresh, Discount zone, R:R >= 1.5.\n"
        "- SELL: Proposed direction SELL, HTF Bearish/CHoCH, FVG fresh, Premium zone, R:R >= 1.5.\n"
        "- WAIT: Return WAIT if trend conflicts, spread is wide, momentum wicks are exhausted, or setup is ambiguous.\n\n"
        "MODULE 5: RISK MANAGEMENT\n"
        "- Hard cap risk at 0.25% equity. Never widen stop loss. R:R must be >= 1.5.\n"
        "- Never force trades. Capital preservation is priority #1."
    )
    user = {
        'candidate': candidate,
        'rules': {
            'minimum_fvg_score': float(candidate.get('fvg_score', 50.0)),
            'max_spread_points': float(candidate.get('max_spread_points', config.MAX_SPREAD_POINTS)),
            'max_risk_percent': config.MAX_RISK_PERCENT,
            'minimum_reward_to_risk': 1.5,
            'reject_if_daily_loss_limit_hit': True,
            'must_match_candidate_direction': True,
            'be_conservative_and_return_WAIT_if_uncertain': True
        }
    }
    body = {
        'systemInstruction': {'parts': [{'text': system}]},
        'contents': [{'role': 'user', 'parts': [{'text': json.dumps(user, separators=(',', ':'))}]}],
        'generationConfig': {
            'temperature': 0.1,
            'responseMimeType': 'application/json',
            'responseSchema': {
                'type': 'OBJECT',
                'properties': {
                    'decision': {'type': 'STRING', 'enum': ['BUY', 'SELL', 'WAIT']},
                    'approved': {'type': 'BOOLEAN'},
                    'confidence': {'type': 'NUMBER'},
                    'market_bias': {'type': 'STRING', 'enum': ['BULLISH', 'BEARISH', 'NEUTRAL']},
                    'setup_quality': {'type': 'STRING', 'enum': ['A_PLUS', 'HIGH', 'MEDIUM', 'LOW', 'INVALID']},
                    'reason': {'type': 'STRING'},
                    'risk_notes': {'type': 'STRING'},
                    'invalidation_reason': {'type': 'STRING'}
                },
                'required': ['decision', 'approved', 'confidence', 'market_bias', 'setup_quality', 'reason', 'risk_notes', 'invalidation_reason']
            }
        }
    }

    errors = []
    order = get_key_order()
    if not order:
        raise RuntimeError('All configured Gemini keys are cooling down or exhausted')

    for idx in order:
        key = config.GEMINI_KEYS[idx]
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{config.MODEL}:generateContent?key={key}'
        payload = json_bytes(body)
        req = urllib.request.Request(
            url, data=payload,
            headers={'Content-Type': 'application/json', 'User-Agent': 'FvgGold-AI/2.2'},
            method='POST'
        )
        try:
            with urllib.request.urlopen(req, timeout=config.REQUEST_TIMEOUT) as resp:
                resp_data = json.loads(resp.read().decode('utf-8'))
            text = extract_gemini_text(resp_data)
            parsed = json.loads(text)
            decision = str(parsed.get('decision', 'WAIT')).upper()
            confidence = float(parsed.get('confidence', 0))
            if decision not in ('BUY', 'SELL', 'WAIT') or not 0 <= confidence <= 1:
                raise ValueError('Gemini response failed schema validation')
            with state_lock:
                service_state['key_index'] = (idx + 1) % len(config.GEMINI_KEYS)
                service_state['key_last_used'] = idx + 1
                service_state['last_error'] = None
            return {
                'decision': decision,
                'approved': bool(parsed.get('approved', decision == str(candidate.get('direction')).upper() and confidence >= config.MIN_CONFIDENCE)),
                'confidence': confidence,
                'market_bias': str(parsed.get('market_bias', 'NEUTRAL')),
                'setup_quality': str(parsed.get('setup_quality', 'MEDIUM')),
                'reason': str(parsed.get('reason', 'Analysis completed'))[:500],
                'risk_notes': str(parsed.get('risk_notes', ''))[:500],
                'invalidation_reason': str(parsed.get('invalidation_reason', ''))[:500],
                'key_slot': idx + 1
            }
        except urllib.error.HTTPError as exc:
            code = exc.code
            errors.append(f'slot-{idx+1}:HTTP-{code}')
            cooldown_key(idx, 900 if code in (400, 401, 403) else config.KEY_COOLDOWN, f'Gemini HTTP {code}')
            log.warning('Gemini key slot %s failed HTTP %s', idx + 1, code)
        except Exception as exc:
            errors.append(f'slot-{idx+1}:{type(exc).__name__}')
            cooldown_key(idx, config.KEY_COOLDOWN, type(exc).__name__)
            log.warning('Gemini key slot %s failed: %s', idx + 1, type(exc).__name__)

    raise RuntimeError('Gemini unavailable across all key slots: ' + ', '.join(errors))

def validate_candidate(c: dict) -> Tuple[Optional[str], Optional[str]]:
    """
    Validates candidate trade setup against conservative trading criteria.
    Returns: (error_message, signal_id)
    """
    required = ['symbol', 'direction', 'entry', 'stop_loss', 'take_profit', 'lot', 'fvg_score', 'spread_points', 'equity']
    for k in required:
        if k not in c:
            return f'Missing required field: {k}', None
    
    if str(c['symbol']).upper().find('XAUUSD') < 0:
        return 'Configured for gold symbols containing XAUUSD only', None
    
    direction = str(c['direction']).upper()
    if direction not in ('BUY', 'SELL'):
        return 'Invalid direction (must be BUY or SELL)', None
    
    try:
        entry = float(c['entry'])
        sl = float(c['stop_loss'])
        tp = float(c['take_profit'])
        lot = float(c['lot'])
        score = float(c['fvg_score'])
        spread = float(c['spread_points'])
        equity = float(c['equity'])
        bar_time = int(c.get('bar_time', 0) or c.get('fvg_time', 0) or time.time())
    except (TypeError, ValueError):
        return 'Invalid numeric parameter format', None

    if min(entry, sl, tp, lot, equity) <= 0:
        return 'Non-positive trade parameter values detected', None
    
    if direction == 'BUY' and not (sl < entry < tp):
        return 'BUY stop/entry/target geometry invalid (must satisfy SL < Entry < TP)', None
    if direction == 'SELL' and not (tp < entry < sl):
        return 'SELL stop/entry/target geometry invalid (must satisfy TP < Entry < SL)', None

    risk = abs(entry - sl)
    reward = abs(tp - entry)
    if risk <= 0 or reward / risk < 1.5 - 1e-6:
        return f'Reward-to-risk ratio {reward/risk:.2f} below conservative minimum 1.5', None

    min_score = float(c.get('min_score_fvg', config.MIN_FVG_SCORE))
    if score < min_score:
        return f'FVG score {score:.1f} below configured minimum {min_score:.1f}', None

    max_spread_raw = c.get('max_spread_points')
    if max_spread_raw is not None and float(max_spread_raw) <= 0:
        max_spread = 0.0
    else:
        max_spread = float(max_spread_raw or config.MAX_SPREAD_POINTS)

    if max_spread > 0 and spread > max_spread:
        return f'Spread {spread:.1f} exceeds allowed limit {max_spread:.1f}', None

    daily_limit = float(c.get('daily_loss_limit', 0) or 0)
    daily_pl = float(c.get('daily_pl', 0) or 0)
    if daily_limit > 0 and daily_pl <= -daily_limit:
        return f'Daily loss limit reached (P/L ${daily_pl:.2f} <= -${daily_limit:.2f})', None

    risk_pct = float(c.get('risk_percent', 0) or 0)
    if risk_pct > config.MAX_RISK_PERCENT + 1e-6:
        return f'Requested risk percentage {risk_pct:.2f}% exceeds ceiling {config.MAX_RISK_PERCENT:.2f}%', None

    # Timestamp drift check (anti-replay)
    client_timestamp = int(c.get('client_timestamp', 0) or c.get('server_time', 0) or 0)
    if client_timestamp > 0:
        now = int(time.time())
        drift = abs(now - client_timestamp)
        if drift > config.MAX_REQUEST_DRIFT_SECONDS:
            return f'Request expired: clock drift of {drift}s exceeds {config.MAX_REQUEST_DRIFT_SECONDS}s', None

    # Generate unique signal ID for deduplication
    signal_id = c.get('signal_id')
    if not signal_id:
        raw_sig = f"{c['symbol']}_{direction}_{bar_time}_{entry:.2f}_{sl:.2f}_{tp:.2f}"
        import hashlib
        signal_id = hashlib.sha256(raw_sig.encode('utf-8')).hexdigest()[:24]

    # Check for duplicate order execution
    if not db.check_and_record_signal(signal_id, c['symbol'], direction, bar_time, entry, sl, tp):
        return f'Duplicate signal detected: candidate {signal_id} has already been evaluated and processed', signal_id

    if not is_active():
        return 'Trading service is currently paused or emergency-stopped', signal_id

    return None, signal_id

def verify_token(supplied_token: str) -> Tuple[bool, str]:
    """
    Verifies authentication token.
    Returns: (is_authenticated, error_reason)
    """
    configured_token = config.SERVICE_TOKEN
    if not configured_token or configured_token in config.PLACEHOLDER_TOKENS:
        return False, "Server authentication not configured: AI_SERVICE_TOKEN in .env is missing or placeholder"
    if not supplied_token:
        return False, "Missing authentication header: Provide 'X-Service-Token: <token>' or 'Authorization: Bearer <token>'"
    
    # Constant-time comparison prevents timing attacks
    if secrets.compare_digest(supplied_token, configured_token):
        return True, ""
    return False, "Unauthorized: Invalid service token provided"

def extract_token_from_headers(headers: Dict[str, str], path: str = "") -> str:
    """Extracts token from X-Service-Token, Authorization: Bearer, or ?token= / ?key= URL query parameters."""
    token = headers.get('x-service-token', '')
    if not token:
        auth_hdr = headers.get('authorization', '')
        if auth_hdr.lower().startswith('bearer '):
            token = auth_hdr[7:].strip()
    # Support URL query parameter for simple web browser testing
    if not token and '?' in path:
        import urllib.parse
        qs = urllib.parse.parse_qs(path.split('?', 1)[1])
        tokens = qs.get('token') or qs.get('key') or []
        if tokens:
            token = tokens[0].strip()
    return token.strip()

# --- Core Router Function (Used by both WSGI and Standalone HTTP) ---
def route_request(method: str, path: str, headers: Dict[str, str], body_bytes: bytes, client_ip: str) -> Tuple[int, Dict[str, Any]]:
    start_time = time.time()
    clean_path = path.split('?')[0].rstrip('/')
    if not clean_path:
        clean_path = '/'
    
    # 1. Public Health Check (No Auth Required)
    if method == 'GET' and clean_path in ('/health', '/'):
        res = {
            'ok': True,
            'service': 'FvgGold AI Trader',
            'version': '2.20',
            'model': config.MODEL,
            'server_time': int(time.time())
        }
        db.record_access(clean_path, method, 200, client_ip, True, (time.time() - start_time) * 1000)
        return 200, res

    # 2. Authentication Check for All Protected Endpoints
    supplied_token = extract_token_from_headers(headers, path)
    is_auth, auth_err = verify_token(supplied_token)
    if not is_auth:
        status_code = 503 if "not configured" in auth_err else 401
        db.record_access(clean_path, method, status_code, client_ip, False, (time.time() - start_time) * 1000, auth_err)
        return status_code, {'ok': False, 'error': 'unauthorized', 'detail': auth_err}

    # 3. GET Endpoints
    if method == 'GET':
        if clean_path == '/status':
            payload = build_status_payload()
            db.record_access(clean_path, method, 200, client_ip, True, (time.time() - start_time) * 1000)
            return 200, payload
        
        elif clean_path == '/analysis':
            with state_lock:
                a = dict(service_state['last_analysis'])
            return 200, {'ok': True, 'analysis': a}
        
        elif clean_path == '/history':
            decisions = db.get_recent_decisions(15)
            return 200, {'ok': True, 'decisions': decisions}

        elif clean_path == '/report':
            with state_lock:
                hb = dict(service_state['heartbeat'])
            return 200, {'ok': True, 'heartbeat': hb, 'status': build_status_payload()}

        return 404, {'ok': False, 'error': 'not_found', 'path': clean_path}

    # 4. POST Endpoints
    if method == 'POST':
        if len(body_bytes) > 131072: # 128 KB
            return 413, {'ok': False, 'error': 'payload_too_large'}
        
        try:
            body = json.loads(body_bytes.decode('utf-8')) if body_bytes else {}
            if not isinstance(body, dict):
                return 400, {'ok': False, 'error': 'JSON object required'}
        except Exception as e:
            return 400, {'ok': False, 'error': 'invalid_json', 'detail': str(e)}

        # Heartbeat endpoint with bidirectional state return
        if clean_path == '/heartbeat':
            with state_lock:
                service_state['heartbeat'] = body
                service_state['last_heartbeat'] = time.time()
            db.record_heartbeat(body, client_ip)
            
            # Return active state directly inside heartbeat response to eliminate dual-call latency
            status_data = build_status_payload()
            return 200, {
                'ok': True,
                'active': status_data['active'],
                'status': status_data['status'],
                'server_time': int(time.time())
            }

        # Decision endpoint
        if clean_path == '/decision':
            validation_error, signal_id = validate_candidate(body)
            body['signal_id'] = signal_id or body.get('signal_id', '')

            if validation_error:
                out = {
                    'ok': True,
                    'decision': 'WAIT',
                    'approved': False,
                    'confidence': 0.0,
                    'market_bias': str(body.get('higher_timeframe_bias', 'NEUTRAL')),
                    'setup_quality': 'INVALID',
                    'reason': validation_error,
                    'invalidation_reason': validation_error,
                    'risk_notes': 'Local conservative gate rejected candidate',
                    'signal_id': body['signal_id']
                }
                with state_lock:
                    service_state['last_decision'] = out
                    service_state['last_analysis'] = out
                db.record_decision(dict(body, **out), client_ip)
                return 200, out

            # Call Gemini
            try:
                gemini_res = call_gemini(body)
                decision = gemini_res['decision']
                confidence = gemini_res['confidence']
                reason = gemini_res['reason']
                risk_notes = gemini_res['risk_notes']
                market_bias = gemini_res.get('market_bias', 'NEUTRAL')
                setup_quality = gemini_res.get('setup_quality', 'MEDIUM')
                invalidation_reason = gemini_res.get('invalidation_reason', '')

                # Enforce server-side approval logic
                approved = (
                    decision == str(body['direction']).upper()
                    and confidence >= config.MIN_CONFIDENCE
                    and is_active()
                )

                out = {
                    'ok': True,
                    'decision': decision,
                    'approved': bool(approved),
                    'confidence': confidence,
                    'market_bias': market_bias,
                    'setup_quality': setup_quality,
                    'reason': reason,
                    'risk_notes': risk_notes,
                    'invalidation_reason': invalidation_reason,
                    'model': config.MODEL,
                    'key_slot': gemini_res.get('key_slot'),
                    'signal_id': body['signal_id']
                }
                with state_lock:
                    service_state['last_decision'] = out
                    service_state['last_analysis'] = out
                
                db.record_decision(dict(body, **out), client_ip)
                log.info("AI review symbol=%s candidate=%s decision=%s approved=%s confidence=%.2f",
                         body.get('symbol'), body.get('direction'), decision, approved, confidence)
                return 200, out

            except Exception as exc:
                log.error("AI decision failed: %s", exc)
                with state_lock:
                    service_state['last_error'] = str(exc)
                out = {
                    'ok': False,
                    'decision': 'WAIT',
                    'approved': False,
                    'confidence': 0.0,
                    'reason': 'AI service unavailable; fail-closed safeguard active',
                    'error': str(exc),
                    'signal_id': body.get('signal_id', '')
                }
                return 503, out

        return 404, {'ok': False, 'error': 'not_found', 'path': clean_path}

    return 405, {'ok': False, 'error': 'method_not_allowed'}

# --- WSGI Application Entry Point (For cPanel Passenger, Apache, Gunicorn) ---
def application(environ: Dict[str, Any], start_response: Any) -> List[bytes]:
    method = environ.get('REQUEST_METHOD', 'GET').upper()
    path = environ.get('PATH_INFO', '/')
    client_ip = environ.get('HTTP_X_FORWARDED_FOR', environ.get('REMOTE_ADDR', '127.0.0.1')).split(',')[0].strip()

    # Extract HTTP headers into lowercase dictionary
    headers = {}
    for key, value in environ.items():
        if key.startswith('HTTP_'):
            header_name = key[5:].replace('_', '-').lower()
            headers[header_name] = value
        elif key in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            headers[key.replace('_', '-').lower()] = value

    # Read body
    try:
        content_length = int(environ.get('CONTENT_LENGTH', 0) or 0)
    except ValueError:
        content_length = 0
    
    body_bytes = b''
    if content_length > 0:
        wsgi_input = environ.get('wsgi.input')
        if wsgi_input:
            body_bytes = wsgi_input.read(content_length)

    status_code, response_data = route_request(method, path, headers, body_bytes, client_ip)
    
    status_text = {
        200: '200 OK',
        400: '400 Bad Request',
        401: '401 Unauthorized',
        404: '404 Not Found',
        405: '405 Method Not Allowed',
        413: '413 Payload Too Large',
        500: '500 Internal Server Error',
        503: '503 Service Unavailable'
    }.get(status_code, f'{status_code} Status')

    data = json_bytes(response_data)
    response_headers = [
        ('Content-Type', 'application/json; charset=utf-8'),
        ('Content-Length', str(len(data))),
        ('Connection', 'close'),
        ('Cache-Control', 'no-store, no-cache, must-revalidate'),
        ('X-Content-Type-Options', 'nosniff'),
        ('Access-Control-Allow-Origin', config.CORS_ORIGIN),
        ('Access-Control-Allow-Headers', 'Content-Type, X-Service-Token, Authorization')
    ]
    
    start_response(status_text, response_headers)
    return [data]

# --- Standalone HTTP Server (For Windows VPS / Local Dev) ---
class StandaloneHandler(BaseHTTPRequestHandler):
    server_version = 'FvgGoldAI/2.20'

    def log_message(self, fmt, *args):
        log.info('HTTP %s - %s', self.address_string(), fmt % args)

    def _handle(self):
        method = self.command
        path = self.path
        client_ip = self.client_address[0] if self.client_address else '127.0.0.1'

        headers = {k.lower(): v for k, v in self.headers.items()}
        try:
            length = int(headers.get('content-length', 0))
        except ValueError:
            length = 0
        
        body_bytes = self.rfile.read(length) if length > 0 else b''

        status_code, response_data = route_request(method, path, headers, body_bytes, client_ip)
        data = json_bytes(response_data)

        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Connection', 'close') # Prevents MT5 WinInet read timeouts (HTTP 1003)
        self.send_header('Cache-Control', 'no-store, no-cache')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Access-Control-Allow-Origin', config.CORS_ORIGIN)
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Service-Token, Authorization')
        self.end_headers()
        self.wfile.write(data)
        self.close_connection = True # Explicit socket closure

    def do_GET(self):
        self._handle()

    def do_POST(self):
        self._handle()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', config.CORS_ORIGIN)
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Service-Token, Authorization')
        self.send_header('Connection', 'close')
        self.end_headers()
        self.close_connection = True

def main():
    validation_issues = config.validate_config()
    if validation_issues:
        for issue in validation_issues:
            log.warning("Config Issue: %s", issue)
    
    server = ThreadingHTTPServer((config.HOST, config.PORT), StandaloneHandler)
    server.daemon_threads = True
    log.info("FvgGold AI Trader listening on %s:%s (Model: %s, Keys: %d)",
             config.HOST, config.PORT, config.MODEL, len(config.GEMINI_KEYS))
    try:
        server.serve_forever(poll_interval=0.5)
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()

if __name__ == '__main__':
    main()
