"""
Configuration loader and validator for FvgGold AI Trader service.
Supports both Windows VPS standalone mode and Python shared hosting environments.
Never logs secrets or exposes API keys.
"""
from __future__ import annotations
import os
import re
import secrets
from typing import List, Set

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def load_env(path: str | None = None) -> None:
    """Safely loads key-value pairs from .env into os.environ without overwriting existing environment."""
    if not path:
        path = os.path.join(BASE_DIR, '.env')
    if not os.path.exists(path):
        return
    with open(path, 'r', encoding='utf-8') as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            k, v = line.split('=', 1)
            k, v = k.strip(), v.strip().strip('"').strip("'")
            if k and k not in os.environ:
                os.environ[k] = v

# Load environment on import
load_env()

# Service Authentication Token
SERVICE_TOKEN: str = os.getenv('AI_SERVICE_TOKEN', '').strip()
PLACEHOLDER_TOKENS: Set[str] = {
    'CHANGE_ME',
    'CHANGE_ME_TO_MATCH_ENV',
    'REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS',
    'replace-with-a-long-random-secret',
    'YOUR_SERVICE_TOKEN_HERE',
    'example_secret_token_here'
}

# Network & Host settings
HOST: str = os.getenv('SERVICE_HOST', '127.0.0.1')
PORT: int = int(os.getenv('SERVICE_PORT', '8787'))
CORS_ORIGIN: str = os.getenv('CORS_ORIGIN', '*')

# Gemini AI settings
MODEL: str = os.getenv('GEMINI_MODEL', 'gemini-2.5-flash').strip()
REQUEST_TIMEOUT: int = int(os.getenv('GEMINI_TIMEOUT_SECONDS', '12'))
KEY_COOLDOWN: int = int(os.getenv('KEY_COOLDOWN_SECONDS', '90'))

# Parse comma-separated Gemini keys, filtering out any obvious placeholders
RAW_KEYS = os.getenv('GEMINI_API_KEYS', '').split(',')
GEMINI_KEYS: List[str] = [
    k.strip() for k in RAW_KEYS 
    if k.strip() and not k.strip().startswith('REPLACE_') and not k.strip().startswith('YOUR_')
]

# Risk and filter parameters
MIN_CONFIDENCE: float = float(os.getenv('MIN_AI_CONFIDENCE', '0.70'))
MAX_RISK_PERCENT: float = float(os.getenv('MAX_RISK_PERCENT', '0.25'))
MAX_SPREAD_POINTS: float = float(os.getenv('MAX_SPREAD_POINTS', '80'))
MAX_REQUEST_DRIFT_SECONDS: int = int(os.getenv('MAX_REQUEST_DRIFT_SECONDS', '60'))

# Telegram configuration (optional)
TELEGRAM_TOKEN: str = os.getenv('TELEGRAM_BOT_TOKEN', '').strip()
RAW_CHAT_IDS = os.getenv('TELEGRAM_ALLOWED_CHAT_IDS', '').split(',')
ALLOWED_CHAT_IDS: Set[str] = {x.strip() for x in RAW_CHAT_IDS if x.strip()}

# Database configuration (MySQL with SQLite automatic fallback)
DB_TYPE: str = os.getenv('DB_TYPE', 'sqlite').lower().strip()  # 'mysql' or 'sqlite'
DB_HOST: str = os.getenv('DB_HOST', '127.0.0.1')
DB_PORT: int = int(os.getenv('DB_PORT', '3306'))
DB_USER: str = os.getenv('DB_USER', 'fvg_user')
DB_PASSWORD: str = os.getenv('DB_PASSWORD', '')
DB_NAME: str = os.getenv('DB_NAME', 'fvggold_db')
SQLITE_PATH: str = os.getenv('SQLITE_PATH', os.path.join(BASE_DIR, 'fvggold.sqlite3'))

# Logging configuration
LOG_LEVEL: str = os.getenv('LOG_LEVEL', 'INFO').upper()
LOG_FILE: str = os.getenv('LOG_FILE', os.path.join(BASE_DIR, 'ai_service.log'))

def validate_config() -> List[str]:
    """Validates configuration parameters and returns any blocking issues."""
    issues = []
    if not SERVICE_TOKEN:
        issues.append("AI_SERVICE_TOKEN is missing in .env. Generate one using secrets.token_urlsafe(48).")
    elif SERVICE_TOKEN in PLACEHOLDER_TOKENS:
        issues.append("AI_SERVICE_TOKEN is still a placeholder. Please set a unique secret.")
    elif len(SERVICE_TOKEN) < 32:
        issues.append(f"AI_SERVICE_TOKEN is too short ({len(SERVICE_TOKEN)} chars). Minimum recommended is 32 characters.")
    return issues

def mask_secret(secret: str) -> str:
    """Returns a safe, masked representation of a secret for diagnostic output."""
    if not secret:
        return "<not set>"
    if len(secret) <= 8:
        return "***"
    return secret[:4] + "..." + secret[-4:]
