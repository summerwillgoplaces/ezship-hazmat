"""
Tests for Address Book SQLite Database & REST Endpoints
Verifies Users and Shippers/Consignees functionality.
"""

import pytest
from fastapi.testclient import TestClient
from hazmat_app.main import app
from hazmat_app.address_book_db import init_address_book_db, get_all_users, get_all_contacts

client = TestClient(app)

def setup_module():
    """Ensure database is initialized prior to tests."""
    init_address_book_db()

def test_users_seeding_and_list():
    """Verify default users were seeded."""
    response = client.get("/api/users")
    assert response.status_code == 200
    users = response.json()
    assert len(users) >= 3
    usernames = [u["username"] for u in users]
    assert "admin" in usernames
    assert "jdoe" in usernames

def test_create_and_delete_user():
    """Verify creating a new user and deleting them."""
    new_user_payload = {
        "username": "test_specialist_99",
        "full_name": "Dr. Alan Grant",
        "email": "agrant@hazmat-lab.com",
        "role": "Dangerous Goods Senior Auditor",
        "phone": "+1 800 555 4321"
    }
    create_res = client.post("/api/users", json=new_user_payload)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["username"] == "test_specialist_99"
    assert created["id"] > 0

    user_id = created["id"]
    get_res = client.get(f"/api/users/{user_id}")
    assert get_res.status_code == 200
    assert get_res.json()["email"] == "agrant@hazmat-lab.com"

    del_res = client.delete(f"/api/users/{user_id}")
    assert del_res.status_code == 200

    not_found = client.get(f"/api/users/{user_id}")
    assert not_found.status_code == 404

def test_contacts_seeding_and_filtering():
    """Verify default contacts seeded and filtering by SHIPPER vs CONSIGNEE works."""
    # List all
    all_res = client.get("/api/contacts")
    assert all_res.status_code == 200
    contacts = all_res.json()
    assert len(contacts) >= 5

    # Filter by SHIPPER
    shippers_res = client.get("/api/contacts?type=SHIPPER")
    assert shippers_res.status_code == 200
    shippers = shippers_res.json()
    assert len(shippers) >= 2
    assert all(s["type"] in ("SHIPPER", "BOTH") for s in shippers)
    shipper_names = [s["company_name"] for s in shippers]
    assert "ACME Global Logistics" in shipper_names

    # Filter by CONSIGNEE
    consignees_res = client.get("/api/contacts?type=CONSIGNEE")
    assert consignees_res.status_code == 200
    consignees = consignees_res.json()
    assert len(consignees) >= 3
    assert all(c["type"] in ("CONSIGNEE", "BOTH") for c in consignees)
    consignee_names = [c["company_name"] for c in consignees]
    assert "Metro Power Systems" in consignee_names

def test_create_update_and_delete_contact():
    """Verify adding a new Shipper/Consignee profile, updating it, and deleting it."""
    contact_data = {
        "type": "SHIPPER",
        "company_name": "Titan Aerospace Chem Co.",
        "contact_person": "Elena Rostova",
        "street_address": "800 Launch Pad Blvd, Hangar 4",
        "city": "Cape Canaveral",
        "state_province": "FL",
        "postal_code": "32920",
        "country": "USA",
        "phone": "+1 (321) 555-9000",
        "emergency_phone": "1-800-424-9300 (CHEMTREC #99887)",
        "email": "hazmat@titanaero.com",
        "is_default": False,
        "notes": "Cryogenic and rocket fuel test facility."
    }

    create_res = client.post("/api/contacts", json=contact_data)
    assert create_res.status_code == 200
    created = create_res.json()
    contact_id = created["id"]
    assert created["company_name"] == "Titan Aerospace Chem Co."

    # Update address
    update_data = {
        "street_address": "850 Launch Pad Blvd, Suite 100",
        "city": "Cape Canaveral"
    }
    update_res = client.put(f"/api/contacts/{contact_id}", json=update_data)
    assert update_res.status_code == 200
    updated = update_res.json()
    assert updated["street_address"] == "850 Launch Pad Blvd, Suite 100"

    # Set as default
    default_res = client.post(f"/api/contacts/{contact_id}/default")
    assert default_res.status_code == 200
    assert default_res.json()["is_default"] == 1

    # Delete
    del_res = client.delete(f"/api/contacts/{contact_id}")
    assert del_res.status_code == 200

    not_found = client.get(f"/api/contacts/{contact_id}")
    assert not_found.status_code == 404
