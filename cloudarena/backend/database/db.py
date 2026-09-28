"""SQLite storage manager for CloudArena events, participants, users, and leaderboard."""

import json
import sqlite3
import time
from pathlib import Path
from typing import Any, Optional

from cloudarena.core.paths import CLOUDARENA_HOME

DEFAULT_DB_PATH = CLOUDARENA_HOME / "leaderboard.db"


def get_connection(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Open SQLite connection and initialize tables if missing."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    init_schema(conn)
    return conn


def init_schema(conn: sqlite3.Connection) -> None:
    """Create events, participants, users, event_config, and scores tables if they do not exist."""
    with conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS events (
                event_id TEXT PRIMARY KEY,
                title TEXT,
                created_at REAL
            );

            CREATE TABLE IF NOT EXISTS event_config (
                event_id TEXT PRIMARY KEY,
                title TEXT,
                status TEXT DEFAULT 'OPEN',
                mode TEXT DEFAULT 'self_paced',
                is_frozen INTEGER DEFAULT 0,
                active_wave INTEGER DEFAULT 1,
                wave_durations TEXT DEFAULT '{"1": 300, "2": 420, "3": 480, "4": 600}',
                updated_at REAL
            );

            CREATE TABLE IF NOT EXISTS users (
                uid TEXT PRIMARY KEY,
                email TEXT,
                handle TEXT,
                arena_token TEXT UNIQUE,
                role TEXT DEFAULT 'player',
                created_at REAL
            );

            CREATE TABLE IF NOT EXISTS participants (
                handle TEXT,
                event_id TEXT,
                joined_at REAL,
                PRIMARY KEY (handle, event_id)
            );

            CREATE TABLE IF NOT EXISTS scores (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_id TEXT,
                handle TEXT,
                wave_number INTEGER,
                base_points INTEGER,
                speed_bonus INTEGER,
                hint_penalty INTEGER,
                reset_penalty INTEGER,
                net_score INTEGER,
                elapsed_seconds INTEGER,
                completed_at REAL,
                UNIQUE(event_id, handle, wave_number) ON CONFLICT REPLACE
            );

            CREATE TABLE IF NOT EXISTS heartbeats (
                handle TEXT,
                event_id TEXT,
                live_wave INTEGER,
                status TEXT,
                elapsed_s INTEGER,
                traffic_pct REAL,
                updated_at REAL,
                PRIMARY KEY (handle, event_id)
            );
        """)


def upsert_user(
    uid: str,
    email: str,
    handle: str,
    arena_token: str,
    role: str = "player",
    db_path: Path = DEFAULT_DB_PATH,
) -> dict[str, Any]:
    """Insert or update user profile with unique Arena Token."""
    conn = get_connection(db_path)
    now = time.time()
    with conn:
        conn.execute(
            """
            INSERT INTO users (uid, email, handle, arena_token, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(uid) DO UPDATE SET
                email = excluded.email,
                handle = excluded.handle,
                arena_token = excluded.arena_token,
                role = excluded.role
            """,
            (uid, email, handle, arena_token, role, now),
        )
    conn.close()
    return {
        "uid": uid,
        "email": email,
        "handle": handle,
        "arena_token": arena_token,
        "role": role,
    }


def get_user_by_token(arena_token: str, db_path: Path = DEFAULT_DB_PATH) -> Optional[dict[str, Any]]:
    """Retrieve user profile by personal Arena Token."""
    conn = get_connection(db_path)
    cursor = conn.execute(
        "SELECT uid, email, handle, arena_token, role, created_at FROM users WHERE arena_token = ?",
        (arena_token,),
    )
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None


def get_event_config(event_id: str, db_path: Path = DEFAULT_DB_PATH) -> dict[str, Any]:
    """Retrieve event settings or initialize default settings."""
    conn = get_connection(db_path)
    cursor = conn.execute(
        "SELECT event_id, title, status, mode, is_frozen, active_wave, wave_durations, updated_at FROM event_config WHERE event_id = ?",
        (event_id,),
    )
    row = cursor.fetchone()
    if not row:
        now = time.time()
        durations = json.dumps({"1": 300, "2": 420, "3": 480, "4": 600})
        with conn:
            conn.execute(
                """
                INSERT INTO event_config (event_id, title, status, mode, is_frozen, active_wave, wave_durations, updated_at)
                VALUES (?, ?, 'OPEN', 'self_paced', 0, 1, ?, ?)
                """,
                (event_id, f"Event {event_id}", durations, now),
            )
        conn.close()
        return {
            "event_id": event_id,
            "title": f"Event {event_id}",
            "status": "OPEN",
            "mode": "self_paced",
            "is_frozen": False,
            "active_wave": 1,
            "wave_durations": {"1": 300, "2": 420, "3": 480, "4": 600},
            "updated_at": now,
        }
    
    conn.close()
    durations = json.loads(row["wave_durations"]) if row["wave_durations"] else {}
    return {
        "event_id": row["event_id"],
        "title": row["title"],
        "status": row["status"],
        "mode": row["mode"],
        "is_frozen": bool(row["is_frozen"]),
        "active_wave": row["active_wave"],
        "wave_durations": durations,
        "updated_at": row["updated_at"],
    }


def update_event_config(
    event_id: str,
    title: Optional[str] = None,
    status: Optional[str] = None,
    mode: Optional[str] = None,
    is_frozen: Optional[bool] = None,
    active_wave: Optional[int] = None,
    wave_durations: Optional[dict[str, int]] = None,
    db_path: Path = DEFAULT_DB_PATH,
) -> dict[str, Any]:
    """Update event configuration parameters with admin authority."""
    current = get_event_config(event_id, db_path)
    new_title = title if title is not None else current["title"]
    new_status = status if status is not None else current["status"]
    new_mode = mode if mode is not None else current["mode"]
    new_is_frozen = is_frozen if is_frozen is not None else current["is_frozen"]
    new_active_wave = active_wave if active_wave is not None else current["active_wave"]
    new_durations = wave_durations if wave_durations is not None else current["wave_durations"]
    now = time.time()

    conn = get_connection(db_path)
    with conn:
        conn.execute(
            """
            INSERT INTO event_config (event_id, title, status, mode, is_frozen, active_wave, wave_durations, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(event_id) DO UPDATE SET
                title = excluded.title,
                status = excluded.status,
                mode = excluded.mode,
                is_frozen = excluded.is_frozen,
                active_wave = excluded.active_wave,
                wave_durations = excluded.wave_durations,
                updated_at = excluded.updated_at
            """,
            (
                event_id,
                new_title,
                new_status,
                new_mode,
                1 if new_is_frozen else 0,
                new_active_wave,
                json.dumps(new_durations),
                now,
            ),
        )
    conn.close()
    return get_event_config(event_id, db_path)


def record_heartbeat(
    handle: str,
    event_id: str,
    live_wave: int,
    status: str,
    elapsed_s: int,
    traffic_pct: float = 100.0,
    db_path: Path = DEFAULT_DB_PATH,
) -> None:
    """Record participant telemetry heartbeat."""
    conn = get_connection(db_path)
    now = time.time()
    with conn:
        join_event(event_id, handle, db_path)
        conn.execute(
            """
            INSERT INTO heartbeats (handle, event_id, live_wave, status, elapsed_s, traffic_pct, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(handle, event_id) DO UPDATE SET
                live_wave = excluded.live_wave,
                status = excluded.status,
                elapsed_s = excluded.elapsed_s,
                traffic_pct = excluded.traffic_pct,
                updated_at = excluded.updated_at
            """,
            (handle, event_id, live_wave, status, elapsed_s, traffic_pct, now),
        )
    conn.close()


def get_active_participants(
    event_id: Optional[str] = None,
    db_path: Path = DEFAULT_DB_PATH,
) -> list[dict[str, Any]]:
    """Query live participant status and recent heartbeats for organizer radar."""
    conn = get_connection(db_path)
    query = """
        SELECT 
            p.handle,
            p.event_id,
            COALESCE(h.live_wave, 0) AS live_wave,
            COALESCE(h.status, 'IDLE') AS status,
            COALESCE(h.elapsed_s, 0) AS elapsed_s,
            COALESCE(h.traffic_pct, 100.0) AS traffic_pct,
            COALESCE(h.updated_at, p.joined_at) AS last_seen,
            COALESCE(SUM(s.net_score), 0) AS total_score,
            COUNT(s.wave_number) AS waves_cleared
        FROM participants p
        LEFT JOIN heartbeats h ON p.handle = h.handle AND p.event_id = h.event_id
        LEFT JOIN scores s ON p.handle = s.handle AND p.event_id = s.event_id
    """
    params: list[Any] = []
    if event_id:
        query += " WHERE p.event_id = ?"
        params.append(event_id)

    query += " GROUP BY p.handle, p.event_id ORDER BY total_score DESC, p.handle ASC"

    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    results = [dict(r) for r in rows]
    conn.close()
    return results


def join_event(event_id: str, handle: str, db_path: Path = DEFAULT_DB_PATH) -> None:
    """Register participant in an event."""
    conn = get_connection(db_path)
    now = time.time()
    with conn:
        conn.execute(
            "INSERT OR IGNORE INTO events (event_id, title, created_at) VALUES (?, ?, ?)",
            (event_id, f"Event {event_id}", now),
        )
        conn.execute(
            "INSERT OR REPLACE INTO participants (handle, event_id, joined_at) VALUES (?, ?, ?)",
            (handle, event_id, now),
        )
    conn.close()


def submit_score(
    event_id: str,
    handle: str,
    wave_number: int,
    base_points: int,
    speed_bonus: int,
    hint_penalty: int,
    reset_penalty: int,
    net_score: int,
    elapsed_seconds: int,
    db_path: Path = DEFAULT_DB_PATH,
) -> None:
    """Record or update a wave completion score for a participant."""
    conn = get_connection(db_path)
    now = time.time()
    with conn:
        join_event(event_id, handle, db_path)
        conn.execute(
            """
            INSERT OR REPLACE INTO scores (
                event_id, handle, wave_number, base_points, speed_bonus,
                hint_penalty, reset_penalty, net_score, elapsed_seconds, completed_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                event_id, handle, wave_number, base_points, speed_bonus,
                hint_penalty, reset_penalty, net_score, elapsed_seconds, now
            ),
        )
    conn.close()


def get_leaderboard_standings(event_id: Optional[str] = None, db_path: Path = DEFAULT_DB_PATH) -> list[dict[str, Any]]:
    """Retrieve ranked participants ordered by total score DESC, then elapsed time ASC."""
    conn = get_connection(db_path)
    query = """
        SELECT 
            p.handle,
            p.event_id,
            COALESCE(SUM(s.net_score), 0) AS total_score,
            COUNT(s.wave_number) AS waves_cleared,
            COALESCE(SUM(s.elapsed_seconds), 0) AS total_time,
            COALESCE(SUM(s.hint_penalty), 0) AS total_hints_cost,
            MAX(s.completed_at) AS last_activity
        FROM participants p
        LEFT JOIN scores s ON p.handle = s.handle AND p.event_id = s.event_id
    """
    params: list[Any] = []
    if event_id:
        query += " WHERE p.event_id = ?"
        params.append(event_id)

    query += """
        GROUP BY p.handle, p.event_id
        ORDER BY total_score DESC, total_time ASC, p.handle ASC
    """

    cursor = conn.execute(query, params)
    rows = cursor.fetchall()
    standings = []
    for rank, row in enumerate(rows, start=1):
        standings.append({
            "rank": rank,
            "handle": row["handle"],
            "event_id": row["event_id"],
            "total_score": row["total_score"],
            "waves_cleared": row["waves_cleared"],
            "total_time": row["total_time"],
            "total_hints_cost": row["total_hints_cost"],
            "last_activity": row["last_activity"],
        })
    conn.close()
    return standings

