#!/usr/bin/env python3
"""
Comprehensive Automated Test Suite for FvgGold AI Trader.
Tests:
  - Authentication (valid, invalid, missing, placeholders, X-Service-Token & Bearer)
  - Public /health vs Protected /status
  - Candidate risk validation gates (geometry, R:R, score, spread, daily loss, risk %)
  - Anti-replay & timestamp drift detection
  - Duplicate signal detection & idempotency
  - Gemini API failure handling & conservative fail-closed safeguards
  - Heartbeat bidirectional state synchronization
  - Shared Hosting WSGI application compliance
"""
import os
import sys
import json
import time
import unittest
from unittest.mock import patch, MagicMock
import urllib.error

# Add service directory to sys.path
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
if TEST_DIR not in sys.path:
    sys.path.insert(0, TEST_DIR)

# Set up test environment variables before importing app
TEST_TOKEN = "test-secret-service-token-with-48-characters-minimum-for-safety"
TEST_DB_PATH = "/tmp/fvg_test_db.sqlite3"
if os.path.exists(TEST_DB_PATH):
    try: os.remove(TEST_DB_PATH)
    except Exception: pass

os.environ['AI_SERVICE_TOKEN'] = TEST_TOKEN
os.environ['GEMINI_API_KEYS'] = "test-key-alpha-12345,test-key-beta-67890"
os.environ['DB_TYPE'] = 'sqlite'
os.environ['SQLITE_PATH'] = TEST_DB_PATH

# Import application components
import config
config.SERVICE_TOKEN = TEST_TOKEN
config.SQLITE_PATH = TEST_DB_PATH
config.GEMINI_KEYS = ["test-key-alpha-12345", "test-key-beta-67890"]

from app import (
    validate_candidate,
    verify_token,
    extract_token_from_headers,
    route_request,
    application,
    call_gemini,
    service_state,
    state_lock
)
from database import db

# Explicitly initialize database tables on test database path
db.db_type = 'sqlite'
db._init_db()

class AuthenticationTests(unittest.TestCase):
    def test_valid_token_x_service_token(self):
        auth, err = verify_token(TEST_TOKEN)
        self.assertTrue(auth)
        self.assertEqual(err, "")

    def test_missing_token_fails(self):
        auth, err = verify_token("")
        self.assertFalse(auth)
        self.assertIn("Missing authentication header", err)

    def test_wrong_token_fails(self):
        auth, err = verify_token("wrong-secret-token-12345678901234567890")
        self.assertFalse(auth)
        self.assertIn("Invalid service token", err)

    def test_placeholder_token_detected(self):
        with patch.object(config, 'SERVICE_TOKEN', 'CHANGE_ME_TO_MATCH_ENV'):
            auth, err = verify_token('CHANGE_ME_TO_MATCH_ENV')
            self.assertFalse(auth)
            self.assertIn("not configured", err)

    def test_extract_token_header_variants(self):
        # Case 1: X-Service-Token
        h1 = {'x-service-token': 'token-abc'}
        self.assertEqual(extract_token_from_headers(h1), 'token-abc')

        # Case 2: Authorization: Bearer
        h2 = {'authorization': 'Bearer token-xyz'}
        self.assertEqual(extract_token_from_headers(h2), 'token-xyz')

        # Case 3: Query parameter ?token=
        self.assertEqual(extract_token_from_headers({}, '/status?token=token-query'), 'token-query')

        # Case 4: Empty headers
        self.assertEqual(extract_token_from_headers({}), '')

class EndpointRoutingTests(unittest.TestCase):
    def test_health_public_access(self):
        code, res = route_request('GET', '/health', {}, b'', '127.0.0.1')
        self.assertEqual(code, 200)
        self.assertTrue(res.get('ok'))
        self.assertEqual(res.get('service'), 'FvgGold AI Trader')

    def test_status_query_param_auth(self):
        code, res = route_request('GET', f'/status?token={TEST_TOKEN}', {}, b'', '127.0.0.1')
        self.assertEqual(code, 200)
        self.assertTrue(res.get('ok'))
        self.assertEqual(res.get('status'), 'active')

    def test_status_unauthenticated_returns_401(self):
        code, res = route_request('GET', '/status', {}, b'', '127.0.0.1')
        self.assertEqual(code, 401)
        self.assertFalse(res.get('ok'))
        self.assertEqual(res.get('error'), 'unauthorized')

    def test_status_authenticated_returns_200(self):
        headers = {'x-service-token': TEST_TOKEN}
        code, res = route_request('GET', '/status', headers, b'', '127.0.0.1')
        self.assertEqual(code, 200)
        self.assertTrue(res.get('ok'))
        self.assertIn('active', res)
        self.assertIn('model', res)

    def test_status_bearer_auth(self):
        headers = {'authorization': f'Bearer {TEST_TOKEN}'}
        code, res = route_request('GET', '/status', headers, b'', '127.0.0.1')
        self.assertEqual(code, 200)
        self.assertTrue(res.get('ok'))

    def test_heartbeat_bidirectional_state(self):
        headers = {'x-service-token': TEST_TOKEN}
        payload = json.dumps({
            'symbol': 'XAUUSD',
            'balance': 10000.0,
            'equity': 10050.0,
            'daily_pl': 50.0,
            'positions': 0,
            'pending': 1,
            'server_time': int(time.time())
        }).encode('utf-8')
        code, res = route_request('POST', '/heartbeat', headers, payload, '127.0.0.1')
        self.assertEqual(code, 200)
        self.assertTrue(res.get('ok'))
        self.assertIn('active', res)
        self.assertIn('status', res)

class CandidateValidationTests(unittest.TestCase):
    def setUp(self):
        self.valid_candidate = {
            'symbol': 'XAUUSD',
            'direction': 'BUY',
            'entry': 2350.0,
            'stop_loss': 2348.0,
            'take_profit': 2354.0,
            'lot': 0.02,
            'fvg_score': 75.0,
            'spread_points': 18.0,
            'max_spread_points': 80.0,
            'equity': 5000.0,
            'daily_pl': 10.0,
            'daily_loss_limit': 50.0,
            'risk_percent': 0.20,
            'client_timestamp': int(time.time()),
            'bar_time': int(time.time()) - 300
        }

    def test_valid_candidate_passes(self):
        err, sig_id = validate_candidate(self.valid_candidate)
        self.assertIsNone(err)
        self.assertIsNotNone(sig_id)

    def test_rejects_non_gold_symbols(self):
        c = dict(self.valid_candidate, symbol='EURUSD')
        err, _ = validate_candidate(c)
        self.assertIn('gold', err.lower())

    def test_rejects_invalid_buy_geometry(self):
        # Stop loss above entry
        c = dict(self.valid_candidate, stop_loss=2352.0)
        err, _ = validate_candidate(c)
        self.assertIn('geometry', err.lower())

    def test_rejects_invalid_sell_geometry(self):
        # Stop loss below entry
        c = dict(self.valid_candidate, direction='SELL', entry=2350.0, stop_loss=2345.0, take_profit=2355.0)
        err, _ = validate_candidate(c)
        self.assertIn('geometry', err.lower())

    def test_rejects_poor_reward_to_risk(self):
        # Reward 1.0 vs Risk 2.0 = 0.5 ratio (minimum required is 1.5)
        c = dict(self.valid_candidate, take_profit=2351.0)
        err, _ = validate_candidate(c)
        self.assertIn('reward-to-risk', err.lower())

    def test_rejects_low_fvg_score(self):
        c = dict(self.valid_candidate, fvg_score=60.0)
        err, _ = validate_candidate(c)
        self.assertIn('score', err.lower())

    def test_rejects_high_spread(self):
        c = dict(self.valid_candidate, spread_points=95.0)
        err, _ = validate_candidate(c)
        self.assertIn('spread', err.lower())

    def test_rejects_daily_loss_limit(self):
        c = dict(self.valid_candidate, daily_pl=-50.0, daily_loss_limit=50.0)
        err, _ = validate_candidate(c)
        self.assertIn('daily loss limit', err.lower())

    def test_rejects_excessive_risk_percent(self):
        c = dict(self.valid_candidate, risk_percent=0.50)
        err, _ = validate_candidate(c)
        self.assertIn('exceeds ceiling', err.lower())

    def test_rejects_expired_signal_replay(self):
        # Old timestamp (e.g. 5 minutes ago)
        c = dict(self.valid_candidate, client_timestamp=int(time.time()) - 300)
        err, _ = validate_candidate(c)
        self.assertIn('expired', err.lower())

    def test_duplicate_signal_prevention(self):
        sig = "unique-test-signal-hash-999"
        c1 = dict(self.valid_candidate, signal_id=sig)
        err1, s1 = validate_candidate(c1)
        self.assertIsNone(err1)
        
        # Second submission must be rejected as duplicate
        c2 = dict(self.valid_candidate, signal_id=sig)
        err2, s2 = validate_candidate(c2)
        self.assertIn('duplicate signal', err2.lower())

class GeminiFailoverTests(unittest.TestCase):
    def setUp(self):
        with state_lock:
            service_state['key_cooldowns'] = {}
            service_state['key_index'] = 0

    @patch('urllib.request.urlopen')
    def test_gemini_success_and_schema_parsing(self, mock_urlopen):
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            'candidates': [{
                'content': {
                    'parts': [{'text': '{"decision": "BUY", "confidence": 0.85, "reason": "Strong order flow and valid gap", "risk_notes": "Clean liquidity above"}'}]
                }
            }]
        }).encode('utf-8')
        mock_ctx = MagicMock()
        mock_ctx.__enter__.return_value = mock_resp
        mock_urlopen.return_value = mock_ctx

        res = call_gemini({'symbol': 'XAUUSD', 'direction': 'BUY'})
        self.assertEqual(res['decision'], 'BUY')
        self.assertEqual(res['confidence'], 0.85)

    @patch('urllib.request.urlopen')
    def test_gemini_rate_limit_failover(self, mock_urlopen):
        # First key hits HTTP 429 (rate limit), second key succeeds
        mock_err = urllib.error.HTTPError('http://url', 429, 'Rate limit', {}, None)
        
        mock_resp = MagicMock()
        mock_resp.read.return_value = json.dumps({
            'candidates': [{
                'content': {
                    'parts': [{'text': '{"decision": "BUY", "confidence": 0.78, "reason": "Second key slot succeeded", "risk_notes": "Normal"}'}]
                }
            }]
        }).encode('utf-8')
        
        mock_ctx = MagicMock()
        mock_ctx.__enter__.return_value = mock_resp
        mock_urlopen.side_effect = [mock_err, mock_ctx]
        
        res = call_gemini({'symbol': 'XAUUSD', 'direction': 'BUY'})
        self.assertEqual(res['decision'], 'BUY')
        self.assertEqual(res['confidence'], 0.78)

class WSGIComplianceTests(unittest.TestCase):
    def test_wsgi_interface(self):
        environ = {
            'REQUEST_METHOD': 'GET',
            'PATH_INFO': '/health',
            'REMOTE_ADDR': '127.0.0.1',
            'wsgi.input': None
        }
        status_captured = []
        headers_captured = []

        def fake_start_response(status, headers):
            status_captured.append(status)
            headers_captured.append(headers)

        body_parts = application(environ, fake_start_response)
        self.assertEqual(status_captured[0], '200 OK')
        body = json.loads(b''.join(body_parts).decode('utf-8'))
        self.assertTrue(body['ok'])
        self.assertEqual(body['service'], 'FvgGold AI Trader')
        
        # Check Connection: close header is sent
        headers_dict = dict(headers_captured[0])
        self.assertEqual(headers_dict.get('Connection'), 'close')

if __name__ == '__main__':
    unittest.main(verbosity=2)
