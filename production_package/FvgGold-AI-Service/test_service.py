import os
import sys
import unittest

service_dir = os.path.dirname(os.path.abspath(__file__))
if service_dir not in sys.path:
    sys.path.insert(0, service_dir)

os.environ.setdefault('AI_SERVICE_TOKEN', 'test-secret-token-with-more-than-32-characters')
os.environ.setdefault('GEMINI_API_KEYS', 'dummy-key-for-tests')
os.environ.setdefault('SQLITE_PATH', '/tmp/fvg_test_legacy.sqlite3')

from app import validate_candidate

class CandidateGateTests(unittest.TestCase):
    def setUp(self):
        self.good = {
            'symbol': 'XAUUSD',
            'direction': 'BUY',
            'entry': 2350.0,
            'stop_loss': 2348.0,
            'take_profit': 2353.0,
            'lot': 0.01,
            'fvg_score': 70,
            'spread_points': 20,
            'max_spread_points': 80,
            'equity': 1000,
            'daily_pl': 0,
            'daily_loss_limit': 5,
            'risk_percent': 0.25
        }

    def test_good_candidate_passes_local_gate(self):
        err, _ = validate_candidate(self.good)
        self.assertIsNone(err)

    def test_rejects_non_gold(self):
        c = dict(self.good, symbol='EURUSD')
        err, _ = validate_candidate(c)
        self.assertIn('gold', err.lower())

    def test_rejects_bad_buy_geometry(self):
        c = dict(self.good, stop_loss=2351.0)
        err, _ = validate_candidate(c)
        self.assertIn('geometry', err.lower())

    def test_rejects_low_reward_risk(self):
        c = dict(self.good, take_profit=2352.0)
        err, _ = validate_candidate(c)
        self.assertIn('reward-to-risk', err.lower())

    def test_rejects_low_fvg_score(self):
        c = dict(self.good, fvg_score=50)
        err, _ = validate_candidate(c)
        self.assertIn('score', err.lower())

    def test_rejects_high_spread(self):
        c = dict(self.good, spread_points=100)
        err, _ = validate_candidate(c)
        self.assertIn('spread', err.lower())

    def test_rejects_daily_loss_limit(self):
        c = dict(self.good, daily_pl=-5)
        err, _ = validate_candidate(c)
        self.assertIn('daily loss', err.lower())

    def test_rejects_risk_above_cap(self):
        c = dict(self.good, risk_percent=0.5)
        err, _ = validate_candidate(c)
        self.assertIn('ceiling', err.lower())

if __name__ == '__main__':
    unittest.main(verbosity=2)
