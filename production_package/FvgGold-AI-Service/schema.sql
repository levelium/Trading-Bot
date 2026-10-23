-- FvgGold AI Trader Database Schema
-- Compatible with MySQL 5.7+ / 8.0+, MariaDB 10.3+, and SQLite 3

-- Table 1: Processed Signals (Deduplication & Replay Protection)
CREATE TABLE IF NOT EXISTS processed_signals (
    signal_id VARCHAR(64) PRIMARY KEY,
    symbol VARCHAR(32) NOT NULL,
    direction VARCHAR(8) NOT NULL,
    bar_time BIGINT NOT NULL,
    entry_price DOUBLE NOT NULL,
    stop_loss DOUBLE NOT NULL,
    take_profit DOUBLE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: AI Trade Decisions (Full Audit Trail)
CREATE TABLE IF NOT EXISTS trade_decisions (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- SQLite syntax; in MySQL use INT AUTO_INCREMENT
    signal_id VARCHAR(64),
    symbol VARCHAR(32) NOT NULL,
    direction VARCHAR(8) NOT NULL,
    decision VARCHAR(8) NOT NULL,
    approved INTEGER NOT NULL, -- 0 = false, 1 = true
    confidence DOUBLE NOT NULL,
    fvg_score DOUBLE NOT NULL,
    spread_points DOUBLE NOT NULL,
    entry_price DOUBLE NOT NULL,
    stop_loss DOUBLE NOT NULL,
    take_profit DOUBLE NOT NULL,
    lot_size DOUBLE NOT NULL,
    reason TEXT,
    risk_notes TEXT,
    model VARCHAR(64),
    key_slot INTEGER,
    client_ip VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: EA Terminal Heartbeats (Status & Account Monitoring)
CREATE TABLE IF NOT EXISTS terminal_heartbeats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol VARCHAR(32) NOT NULL,
    balance DOUBLE NOT NULL,
    equity DOUBLE NOT NULL,
    daily_pl DOUBLE NOT NULL,
    open_positions INTEGER NOT NULL,
    pending_orders INTEGER NOT NULL,
    server_time BIGINT NOT NULL,
    client_ip VARCHAR(64),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: API Access Log (Diagnostic & Rate Monitoring)
CREATE TABLE IF NOT EXISTS api_access_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint VARCHAR(64) NOT NULL,
    method VARCHAR(8) NOT NULL,
    status_code INTEGER NOT NULL,
    client_ip VARCHAR(64),
    authenticated INTEGER NOT NULL,
    duration_ms DOUBLE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
