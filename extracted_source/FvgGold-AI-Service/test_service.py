import os, unittest
os.environ.setdefault('AI_SERVICE_TOKEN','test-secret-token-with-more-than-32-characters')
os.environ.setdefault('GEMINI_API_KEYS','dummy-key-for-tests')
from ai_service import validate_candidate

class CandidateGateTests(unittest.TestCase):
    def setUp(self):
        self.good = {
            'symbol':'XAUUSD','direction':'BUY','entry':2350.0,'stop_loss':2348.0,'take_profit':2353.0,
            'lot':0.01,'fvg_score':70,'spread_points':20,'max_spread_points':80,'equity':1000,
            'daily_pl':0,'daily_loss_limit':5,'risk_percent':0.25
        }
    def test_good_candidate_passes_local_gate(self):
        self.assertIsNone(validate_candidate(self.good))
    def test_rejects_non_gold(self):
        c=dict(self.good,symbol='EURUSD')
        self.assertIn('gold',validate_candidate(c).lower())
    def test_rejects_bad_buy_geometry(self):
        c=dict(self.good,stop_loss=2351.0)
        self.assertIn('geometry',validate_candidate(c).lower())
    def test_rejects_low_reward_risk(self):
        c=dict(self.good,take_profit=2352.0)
        self.assertIn('reward-to-risk',validate_candidate(c).lower())
    def test_rejects_low_fvg_score(self):
        c=dict(self.good,fvg_score=50)
        self.assertIn('score',validate_candidate(c).lower())
    def test_rejects_high_spread(self):
        c=dict(self.good,spread_points=100)
        self.assertIn('spread',validate_candidate(c).lower())
    def test_rejects_daily_loss_limit(self):
        c=dict(self.good,daily_pl=-5)
        self.assertIn('daily loss',validate_candidate(c).lower())
    def test_rejects_risk_above_cap(self):
        c=dict(self.good,risk_percent=0.5)
        self.assertIn('risk percentage',validate_candidate(c).lower())

if __name__=='__main__': unittest.main(verbosity=2)
