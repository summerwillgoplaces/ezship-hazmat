"""
EZShip Hazmat - Address Book & User Database Module
Provides persistent SQLite storage for users and shipper/consignee address profiles.
"""

import sqlite3
import os
from typing import List, Optional, Dict, Any

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ezship_addressbook.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_address_book_db():
    """Initialize database tables and seed default users and shippers/consignees."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'Certified Hazmat Specialist',
        phone TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Shippers & Consignees Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('SHIPPER', 'CONSIGNEE', 'BOTH')),
        company_name TEXT NOT NULL,
        contact_person TEXT,
        street_address TEXT NOT NULL,
        city TEXT NOT NULL,
        state_province TEXT,
        postal_code TEXT,
        country TEXT NOT NULL DEFAULT 'USA',
        phone TEXT,
        emergency_phone TEXT,
        email TEXT,
        is_default INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Check if users need seeding
    cursor.execute("SELECT COUNT(*) FROM users;")
    user_count = cursor.fetchone()[0]
    if user_count == 0:
        default_users = [
            ("admin", "Alex Mercer", "alex.mercer@ezship.com", "Dangerous Goods Safety Advisor (DGSA)", "1-800-555-0199"),
            ("jdoe", "Jane Doe", "jdoe@acmelogistics.com", "Certified IATA/DOT Hazmat Shipper", "1-800-424-9300"),
            ("mross", "Marcus Ross", "mross@metrochem.org", "Logistics Compliance Officer", "1-713-555-8822")
        ]
        cursor.executemany("""
        INSERT INTO users (username, full_name, email, role, phone)
        VALUES (?, ?, ?, ?, ?);
        """, default_users)

    # Check if contacts need seeding
    cursor.execute("SELECT COUNT(*) FROM contacts;")
    contact_count = cursor.fetchone()[0]
    if contact_count == 0:
        default_contacts = [
            (
                "SHIPPER",
                "ACME Global Logistics",
                "Jane Doe",
                "100 Industrial Pkwy, Suite 400",
                "Houston",
                "TX",
                "77001",
                "USA",
                "+1 (713) 555-0144",
                "1-800-424-9300 (CHEMTREC #12345)",
                "shipping@acmeglobal.com",
                1,
                "Primary headquarters facility with certified packing team."
            ),
            (
                "SHIPPER",
                "Apex Chemical Solutions",
                "Dr. Robert Vance",
                "4500 Petrochemical Way, Dock 7",
                "Baytown",
                "TX",
                "77520",
                "USA",
                "+1 (281) 555-3921",
                "1-800-535-5053 (INFOTRAC #67890)",
                "hazmat@apexchemsolutions.com",
                0,
                "Chemical synthesis and specialty flammable liquids warehouse."
            ),
            (
                "CONSIGNEE",
                "Metro Power Systems",
                "David Sterling",
                "50 Freight Way, Unit 12",
                "London",
                "Heathrow",
                "TW6 2GW",
                "United Kingdom",
                "+44 20 7946 0912",
                "+44 20 7946 0999",
                "d.sterling@metropower.co.uk",
                1,
                "LHR Cargo Terminal receiving station for energy equipment."
            ),
            (
                "CONSIGNEE",
                "Pacific BioTech Labs",
                "Dr. Kenji Sato",
                "3-14-1 Innovation Center, Koto-ku",
                "Tokyo",
                "Tokyo",
                "135-0064",
                "Japan",
                "+81 3 5555 0188",
                "+81 3 5555 0199",
                "logistics@pacificbiotech.jp",
                0,
                "Advanced battery research lab and clinical analysis."
            ),
            (
                "CONSIGNEE",
                "Global Chemical Distributors",
                "Sarah Jenkins",
                "500 Logistics Way, Bay 3",
                "Chicago",
                "IL",
                "60601",
                "USA",
                "+1 (312) 555-7744",
                "1-800-424-9300",
                "receiving@globalchemdist.com",
                0,
                "Midwest distribution center."
            )
        ]
        cursor.executemany("""
        INSERT INTO contacts (
            type, company_name, contact_person, street_address, city, state_province,
            postal_code, country, phone, emergency_phone, email, is_default, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        """, default_contacts)

    conn.commit()
    conn.close()

# ----------------- User CRUD ----------------- #

def get_all_users() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users ORDER BY id ASC;")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?;", (user_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO users (username, full_name, email, role, phone)
    VALUES (?, ?, ?, ?, ?);
    """, (
        data["username"],
        data["full_name"],
        data["email"],
        data.get("role", "Certified Hazmat Specialist"),
        data.get("phone", "")
    ))
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM users WHERE id = ?;", (new_id,))
    user = dict(cursor.fetchone())
    conn.close()
    return user

def delete_user(user_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ?;", (user_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

# ----------------- Contacts (Shippers & Consignees) CRUD ----------------- #

def get_all_contacts(contact_type: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    if contact_type:
        c_type = contact_type.upper()
        cursor.execute("""
        SELECT * FROM contacts 
        WHERE type = ? OR type = 'BOTH'
        ORDER BY is_default DESC, company_name ASC;
        """, (c_type,))
    else:
        cursor.execute("SELECT * FROM contacts ORDER BY type ASC, is_default DESC, company_name ASC;")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_contact_by_id(contact_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM contacts WHERE id = ?;", (contact_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_contact(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # If this contact is marked default, unset other defaults of the same type
    if data.get("is_default"):
        cursor.execute("UPDATE contacts SET is_default = 0 WHERE type = ?;", (data["type"].upper(),))

    cursor.execute("""
    INSERT INTO contacts (
        type, company_name, contact_person, street_address, city, state_province,
        postal_code, country, phone, emergency_phone, email, is_default, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    """, (
        data["type"].upper(),
        data["company_name"],
        data.get("contact_person", ""),
        data["street_address"],
        data["city"],
        data.get("state_province", ""),
        data.get("postal_code", ""),
        data.get("country", "USA"),
        data.get("phone", ""),
        data.get("emergency_phone", ""),
        data.get("email", ""),
        1 if data.get("is_default") else 0,
        data.get("notes", "")
    ))
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT * FROM contacts WHERE id = ?;", (new_id,))
    contact = dict(cursor.fetchone())
    conn.close()
    return contact

def update_contact(contact_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    existing = get_contact_by_id(contact_id)
    if not existing:
        conn.close()
        return None

    if data.get("is_default"):
        c_type = data.get("type", existing["type"]).upper()
        cursor.execute("UPDATE contacts SET is_default = 0 WHERE type = ?;", (c_type,))

    cursor.execute("""
    UPDATE contacts SET
        type = COALESCE(?, type),
        company_name = COALESCE(?, company_name),
        contact_person = COALESCE(?, contact_person),
        street_address = COALESCE(?, street_address),
        city = COALESCE(?, city),
        state_province = COALESCE(?, state_province),
        postal_code = COALESCE(?, postal_code),
        country = COALESCE(?, country),
        phone = COALESCE(?, phone),
        emergency_phone = COALESCE(?, emergency_phone),
        email = COALESCE(?, email),
        is_default = COALESCE(?, is_default),
        notes = COALESCE(?, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?;
    """, (
        data.get("type").upper() if data.get("type") else None,
        data.get("company_name"),
        data.get("contact_person"),
        data.get("street_address"),
        data.get("city"),
        data.get("state_province"),
        data.get("postal_code"),
        data.get("country"),
        data.get("phone"),
        data.get("emergency_phone"),
        data.get("email"),
        1 if data.get("is_default") is True else 0 if data.get("is_default") is False else None,
        data.get("notes"),
        contact_id
    ))
    conn.commit()
    cursor.execute("SELECT * FROM contacts WHERE id = ?;", (contact_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated

def delete_contact(contact_id: int) -> bool:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contacts WHERE id = ?;", (contact_id,))
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0

def set_default_contact(contact_id: int) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT type FROM contacts WHERE id = ?;", (contact_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    c_type = row["type"]
    cursor.execute("UPDATE contacts SET is_default = 0 WHERE type = ?;", (c_type,))
    cursor.execute("UPDATE contacts SET is_default = 1 WHERE id = ?;", (contact_id,))
    conn.commit()
    cursor.execute("SELECT * FROM contacts WHERE id = ?;", (contact_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated
