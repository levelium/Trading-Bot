"""
Database abstraction layer for FvgGold AI Trader.
Supports SQLite (standard library, zero external dependencies)
and MySQL/MariaDB for shared hosting or dedicated servers.
"""
from __future__ import annotations
import sqlite3
import time
import logging
from typing import Dict, Any, Optional, List
import config

log = logging.getLogger('fvg-db')

class Database:
    def __init__(self):
        self.db_type = config.DB_TYPE
        self._init_db()

    def _get_sqlite_conn(self) -> sqlite3.Connection:
        conn = sqlite3.connect(config.SQLITE_PATH, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        if self.db_type == 'mysql':
            try:
                import pymysql
                conn = pymysql.connect(
                    host=config.DB_HOST,
                    port=config.DB_PORT,
                    user=config.DB_USER,
                    password=config.DB_PASSWORD,
                    database=config.DB_NAME,
                    autocommit=True
                )
                with conn.cursor() as cur:
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS processed_signals (
                        signal_id VARCHAR(64) PRIMARY KEY,
                        symbol VARCHAR(32) NOT NULL,
                        direction VARCHAR(8) NOT NULL,
                        bar_time BIGINT NOT NULL,
                        entry_price DOUBLE NOT NULL,
                        stop_loss DOUBLE NOT NULL,
                        take_profit DOUBLE NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB;
                    """)
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS trade_decisions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        signal_id VARCHAR(64),
                        symbol VARCHAR(32) NOT NULL,
                        direction VARCHAR(8) NOT NULL,
                        decision VARCHAR(8) NOT NULL,
                        approved TINYINT NOT NULL,
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
                        key_slot INT,
                        client_ip VARCHAR(64),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB;
                    """)
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS terminal_heartbeats (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        symbol VARCHAR(32) NOT NULL,
                        balance DOUBLE NOT NULL,
                        equity DOUBLE NOT NULL,
                        daily_pl DOUBLE NOT NULL,
                        open_positions INT NOT NULL,
                        pending_orders INT NOT NULL,
                        server_time BIGINT NOT NULL,
                        client_ip VARCHAR(64),
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB;
                    """)
                    cur.execute("""
                    CREATE TABLE IF NOT EXISTS api_access_log (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        endpoint VARCHAR(64) NOT NULL,
                        method VARCHAR(8) NOT NULL,
                        status_code INT NOT NULL,
                        client_ip VARCHAR(64),
                        authenticated TINYINT NOT NULL,
                        duration_ms DOUBLE,
                        error_message TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    ) ENGINE=InnoDB;
                    """)
                conn.close()
                log.info("MySQL database initialized successfully on %s:%s", config.DB_HOST, config.DB_PORT)
                return
            except Exception as e:
                log.warning("Could not connect to MySQL (%s). Falling back to SQLite at %s", e, config.SQLITE_PATH)
                self.db_type = 'sqlite'

        # Fallback / Default: SQLite
        conn = self._get_sqlite_conn()
        with conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS processed_signals (
                signal_id VARCHAR(64) PRIMARY KEY,
                symbol VARCHAR(32) NOT NULL,
                direction VARCHAR(8) NOT NULL,
                bar_time BIGINT NOT NULL,
                entry_price REAL NOT NULL,
                stop_loss REAL NOT NULL,
                take_profit REAL NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS trade_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                signal_id VARCHAR(64),
                symbol VARCHAR(32) NOT NULL,
                direction VARCHAR(8) NOT NULL,
                decision VARCHAR(8) NOT NULL,
                approved INTEGER NOT NULL,
                confidence REAL NOT NULL,
                fvg_score REAL NOT NULL,
                spread_points REAL NOT NULL,
                entry_price REAL NOT NULL,
                stop_loss REAL NOT NULL,
                take_profit REAL NOT NULL,
                lot_size REAL NOT NULL,
                reason TEXT,
                risk_notes TEXT,
                model VARCHAR(64),
                key_slot INTEGER,
                client_ip VARCHAR(64),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS terminal_heartbeats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol VARCHAR(32) NOT NULL,
                balance REAL NOT NULL,
                equity REAL NOT NULL,
                daily_pl REAL NOT NULL,
                open_positions INTEGER NOT NULL,
                pending_orders INTEGER NOT NULL,
                server_time BIGINT NOT NULL,
                client_ip VARCHAR(64),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            conn.execute("""
            CREATE TABLE IF NOT EXISTS api_access_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                endpoint VARCHAR(64) NOT NULL,
                method VARCHAR(8) NOT NULL,
                status_code INTEGER NOT NULL,
                client_ip VARCHAR(64),
                authenticated INTEGER NOT NULL,
                duration_ms REAL,
                error_message TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
        conn.close()
        log.info("SQLite database initialized at %s", config.SQLITE_PATH)

    def check_and_record_signal(self, signal_id: str, symbol: str, direction: str, 
                               bar_time: int, entry: float, sl: float, tp: float) -> bool:
        """
        Checks if signal_id was already processed.
        Returns True if signal is new and recorded.
        Returns False if signal is a duplicate.
        """
        if not signal_id:
            return True
        conn = self._get_sqlite_conn()
        try:
            with conn:
                cur = conn.execute("SELECT signal_id FROM processed_signals WHERE signal_id = ?", (signal_id,))
                if cur.fetchone() is not None:
                    return False  # Duplicate signal!
                conn.execute(
                    "INSERT INTO processed_signals (signal_id, symbol, direction, bar_time, entry_price, stop_loss, take_profit) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (signal_id, symbol, direction, bar_time, entry, sl, tp)
                )
            return True
        finally:
            conn.close()

    def record_decision(self, data: Dict[str, Any], client_ip: str = "") -> None:
        """Stores AI decision in audit table."""
        conn = self._get_sqlite_conn()
        try:
            with conn:
                conn.execute("""
                INSERT INTO trade_decisions (
                    signal_id, symbol, direction, decision, approved, confidence,
                    fvg_score, spread_points, entry_price, stop_loss, take_profit,
                    lot_size, reason, risk_notes, model, key_slot, client_ip
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    data.get('signal_id', ''),
                    data.get('symbol', ''),
                    data.get('direction', ''),
                    data.get('decision', 'WAIT'),
                    1 if data.get('approved') else 0,
                    float(data.get('confidence', 0.0)),
                    float(data.get('fvg_score', 0.0)),
                    float(data.get('spread_points', 0.0)),
                    float(data.get('entry', 0.0)),
                    float(data.get('stop_loss', 0.0)),
                    float(data.get('take_profit', 0.0)),
                    float(data.get('lot', 0.0)),
                    str(data.get('reason', '')),
                    str(data.get('risk_notes', '')),
                    str(data.get('model', config.MODEL)),
                    data.get('key_slot', 0),
                    client_ip
                ))
        except Exception as e:
            log.error("Failed to record trade decision: %s", e)
        finally:
            conn.close()

    def record_heartbeat(self, data: Dict[str, Any], client_ip: str = "") -> None:
        """Stores terminal heartbeat and account stats."""
        conn = self._get_sqlite_conn()
        try:
            with conn:
                conn.execute("""
                INSERT INTO terminal_heartbeats (
                    symbol, balance, equity, daily_pl, open_positions, pending_orders, server_time, client_ip
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    str(data.get('symbol', 'UNKNOWN')),
                    float(data.get('balance', 0.0)),
                    float(data.get('equity', 0.0)),
                    float(data.get('daily_pl', 0.0)),
                    int(data.get('positions', 0)),
                    int(data.get('pending', 0)),
                    int(data.get('server_time', int(time.time()))),
                    client_ip
                ))
        except Exception as e:
            log.error("Failed to record heartbeat: %s", e)
        finally:
            conn.close()

    def get_latest_heartbeat(self) -> Optional[Dict[str, Any]]:
        conn = self._get_sqlite_conn()
        try:
            cur = conn.execute("SELECT * FROM terminal_heartbeats ORDER BY id DESC LIMIT 1")
            row = cur.fetchone()
            if row:
                return dict(row)
            return None
        finally:
            conn.close()

    def get_recent_decisions(self, limit: int = 10) -> List[Dict[str, Any]]:
        conn = self._get_sqlite_conn()
        try:
            cur = conn.execute("SELECT * FROM trade_decisions ORDER BY id DESC LIMIT ?", (limit,))
            return [dict(r) for r in cur.fetchall()]
        finally:
            conn.close()

    def record_access(self, endpoint: str, method: str, status_code: int, 
                      client_ip: str, authenticated: bool, duration_ms: float = 0.0, 
                      error_message: str = "") -> None:
        conn = self._get_sqlite_conn()
        try:
            with conn:
                conn.execute("""
                INSERT INTO api_access_log (endpoint, method, status_code, client_ip, authenticated, duration_ms, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (endpoint, method, status_code, client_ip, 1 if authenticated else 0, duration_ms, error_message[:500]))
        except Exception:
            pass
        finally:
            conn.close()

# Singleton DB instance
db = Database()
