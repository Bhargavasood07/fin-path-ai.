import sqlite3
import json
import datetime
from pathlib import Path
from app.config import DATABASE_PATH

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS journeys (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        borrower_name TEXT,
        principal REAL NOT NULL,
        tenure_months INTEGER NOT NULL,
        interest_rate REAL NOT NULL,
        monthly_emi REAL NOT NULL,
        total_interest REAL NOT NULL,
        total_payment REAL NOT NULL,
        apr REAL NOT NULL,
        processing_fee REAL DEFAULT 0,
        other_charges REAL DEFAULT 0,
        kfs_score REAL DEFAULT 0,
        kfs_status TEXT DEFAULT 'Pending',
        notes TEXT,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS kfs_audits (
        id TEXT PRIMARY KEY,
        journey_id TEXT,
        lender_name TEXT NOT NULL,
        loan_type TEXT NOT NULL,
        score INTEGER NOT NULL,
        status TEXT NOT NULL,
        findings_json TEXT NOT NULL,
        violations_count INTEGER NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sources_json TEXT,
        mode TEXT NOT NULL,
        created_at TEXT NOT NULL
    );
    """)

    # Check if journeys is empty, if so, seed sample journeys
    cursor.execute("SELECT COUNT(*) FROM journeys;")
    count = cursor.fetchone()[0]
    if count == 0:
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        sample_journeys = [
            (
                "journey-home-01",
                "Bangalore 2BHK Home Loan Option A",
                "Bhargava Sood",
                4500000.0,
                240,
                8.75,
                39775.0,
                5046000.0,
                9546000.0,
                8.92,
                15000.0,
                5000.0,
                94.0,
                "Fully Compliant",
                "Pre-approved home loan by SBI under RBI KFS guidelines.",
                now
            ),
            (
                "journey-car-02",
                "EV Sedan Auto Loan Comparison",
                "Bhargava Sood",
                1200000.0,
                60,
                9.20,
                25032.0,
                301920.0,
                1501920.0,
                9.55,
                7500.0,
                2000.0,
                88.0,
                "Minor Advisory",
                "Includes mandatory processing disclosure, looking into prepayment clause.",
                now
            ),
            (
                "journey-micro-03",
                "Quick Emergency Fintech Advance (Flagged)",
                "Demo User",
                50000.0,
                6,
                36.0,
                9227.0,
                5362.0,
                55362.0,
                52.8,
                4500.0,
                1500.0,
                32.0,
                "High Risk / Non-Compliant",
                "Violates RBI April 2024 circular: lacks cooling-off period and compounds penal rate.",
                now
            )
        ]
        cursor.executemany("""
            INSERT INTO journeys (
                id, title, borrower_name, principal, tenure_months, interest_rate,
                monthly_emi, total_interest, total_payment, apr, processing_fee,
                other_charges, kfs_score, kfs_status, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, sample_journeys)

    conn.commit()
    conn.close()

def list_journeys():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM journeys ORDER BY created_at DESC;")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_journey_by_id(journey_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM journeys WHERE id = ?;", (journey_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def save_journey(data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO journeys (
            id, title, borrower_name, principal, tenure_months, interest_rate,
            monthly_emi, total_interest, total_payment, apr, processing_fee,
            other_charges, kfs_score, kfs_status, notes, created_at
        ) VALUES (:id, :title, :borrower_name, :principal, :tenure_months, :interest_rate,
                  :monthly_emi, :total_interest, :total_payment, :apr, :processing_fee,
                  :other_charges, :kfs_score, :kfs_status, :notes, :created_at);
    """, data)
    conn.commit()
    conn.close()
    return data

def delete_journey(journey_id: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM journeys WHERE id = ?;", (journey_id,))
    conn.commit()
    conn.close()
    return True

def save_kfs_audit(data: dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO kfs_audits (
            id, journey_id, lender_name, loan_type, score, status,
            findings_json, violations_count, created_at
        ) VALUES (:id, :journey_id, :lender_name, :loan_type, :score, :status,
                  :findings_json, :violations_count, :created_at);
    """, data)
    conn.commit()
    conn.close()
    return data
