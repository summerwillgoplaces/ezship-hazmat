"""
EZShip Hazmat - FastAPI Application Entrypoint
Compliant with US DOT 49 CFR & IATA DGR Standards
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List, Optional
import os
from pathlib import Path

import hazmat_app.hazmat_db as hazmat_db
from hazmat_app.hazmat_db import HazmatItem, search_hazmat_db, get_by_un_number
from hazmat_app.segregation_engine import SegregationCheckRequest, SegregationCheckResult, evaluate_segregation
from hazmat_app.lithium_battery_engine import LithiumBatteryRequest, LithiumBatteryResult, evaluate_lithium_battery
from hazmat_app.document_generator import ShipperDeclarationRequest, DocumentOutput, generate_documents

app = FastAPI(
    title="EZShip Hazmat Compliance Engine",
    description="DOT 49 CFR & IATA DGR Dangerous Goods Shipping Decision Engine API",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "EZShip Hazmat Compliance Engine",
        "regulations": ["US DOT 49 CFR", "IATA DGR 66th Edition (2025/2026)", "ADR 2026"],
        "database_entries": len(hazmat_db.HAZMAT_DATABASE)
    }

@app.get("/api/hazmat/stats")
def get_hazmat_stats():
    return {
        "total_records": len(hazmat_db.HAZMAT_DATABASE),
        "classes_count": 9,
        "regulations": ["US DOT 49 CFR", "IATA DGR 66th Edition", "ADR 2026 European Road"],
        "last_updated": "2026-09-19 Live Data Sync"
    }

@app.get("/api/hazmat/search", response_model=List[HazmatItem])
def search_hazmat(q: str = Query("", description="Search term (UN number or Proper Shipping Name)"),
                  class_filter: Optional[str] = Query(None, description="Hazard class filter e.g. 3 or 9")):
    return search_hazmat_db(q, class_filter)

@app.get("/api/hazmat/{un_number}", response_model=List[HazmatItem])
def get_hazmat_by_un(un_number: str):
    results = get_by_un_number(un_number)
    if not results:
        raise HTTPException(status_code=404, detail=f"UN/ID Number '{un_number}' not found in database.")
    return results

@app.post("/api/hazmat/segregation", response_model=SegregationCheckResult)
def check_segregation(req: SegregationCheckRequest):
    return evaluate_segregation(req)

@app.post("/api/hazmat/lithium-battery", response_model=LithiumBatteryResult)
def evaluate_lithium_battery_shipment(req: LithiumBatteryRequest):
    return evaluate_lithium_battery(req)

@app.post("/api/hazmat/generate-documents")
def create_shipping_documents(req: ShipperDeclarationRequest):
    return generate_documents(req)

import re
from pydantic import BaseModel

class QuantityValidationRequest(BaseModel):
    un_number: str
    quantity_str: str
    reg_mode: str = "IATA"  # '49CFR', 'IATA', 'ADR'
    transport_mode: str = "AIR"  # 'AIR', 'GROUND'

class QuantityValidationResult(BaseModel):
    is_valid: bool
    status: str  # 'COMPLIANT', 'EXCEEDED', 'FORBIDDEN', 'CAO_REQUIRED', 'INVALID_INPUT'
    user_quantity_val: float
    user_quantity_unit: str
    max_allowed_val: float
    max_allowed_str: str
    is_forbidden: bool
    is_cao_required: bool
    requires_absorbent: bool
    message: str
    regulatory_citation: str

def evaluate_quantity_compliance(req: QuantityValidationRequest) -> QuantityValidationResult:
    q_str = req.quantity_str.strip() if req.quantity_str else ""
    num_match = re.search(r"([0-9]+(?:\.[0-9]+)?)", q_str)
    unit_match = re.search(r"([a-zA-Z]+)", q_str)
    
    citation = (
        "IATA DGR Table 4.2 (66th Edition)" if req.reg_mode == "IATA"
        else "US DOT 49 CFR § 172.101 (Col 9)" if req.reg_mode == "49CFR"
        else "ADR 2026 Chapter 3.2 Table A"
    )

    if not num_match or float(num_match.group(1)) <= 0:
        return QuantityValidationResult(
            is_valid=False,
            status="INVALID_INPUT",
            user_quantity_val=0.0,
            user_quantity_unit=unit_match.group(1) if unit_match else "",
            max_allowed_val=0.0,
            max_allowed_str="N/A",
            is_forbidden=False,
            is_cao_required=False,
            requires_absorbent=False,
            message="Please enter a valid numeric quantity greater than zero.",
            regulatory_citation=citation
        )

    user_val = float(num_match.group(1))
    user_unit = unit_match.group(1) if unit_match else ""

    items = get_by_un_number(req.un_number)
    item = items[0] if items else None

    pax_str = "5 L"
    cao_str = "60 L"
    is_forbidden = False

    if item:
        if req.reg_mode == "IATA":
            pax_str = item.iata_dgr.get("passenger_aircraft_limit", "5 L")
            cao_str = item.iata_dgr.get("cargo_aircraft_limit", "60 L")
        elif req.reg_mode == "49CFR":
            pax_str = item.dot_49cfr.get("passenger_aircraft_limit", "5 L")
            cao_str = item.dot_49cfr.get("cargo_aircraft_limit", "60 L")
        else:
            pax_str = item.adr_2026.get("limited_quantity", "1 L") if item.adr_2026 else "1 L"
            cao_str = item.dot_49cfr.get("cargo_aircraft_limit", "60 L")

        if "forbidden" in pax_str.lower() and "forbidden" in cao_str.lower():
            is_forbidden = True

    pax_m = re.search(r"([0-9]+(?:\.[0-9]+)?)", pax_str)
    cao_m = re.search(r"([0-9]+(?:\.[0-9]+)?)", cao_str)
    pax_num = float(pax_m.group(1)) if pax_m and not "forbidden" in pax_str.lower() else 0.0
    cao_num = float(cao_m.group(1)) if cao_m and not "forbidden" in cao_str.lower() else (0.0 if is_forbidden else 60.0)

    requires_absorbent = False
    if item and (item.class_division == "3" or "liquid" in item.proper_shipping_name.lower() or "solution" in item.proper_shipping_name.lower() or "L" in user_unit.upper()):
        requires_absorbent = True

    if is_forbidden or "forbidden" in cao_str.lower():
        return QuantityValidationResult(
            is_valid=False,
            status="FORBIDDEN",
            user_quantity_val=user_val,
            user_quantity_unit=user_unit,
            max_allowed_val=0.0,
            max_allowed_str="FORBIDDEN",
            is_forbidden=True,
            is_cao_required=False,
            requires_absorbent=requires_absorbent,
            message=f"Dangerous good {req.un_number} is FORBIDDEN for air transport under {citation}.",
            regulatory_citation=citation
        )

    if user_val > cao_num:
        return QuantityValidationResult(
            is_valid=False,
            status="EXCEEDED",
            user_quantity_val=user_val,
            user_quantity_unit=user_unit,
            max_allowed_val=cao_num,
            max_allowed_str=cao_str,
            is_forbidden=False,
            is_cao_required=False,
            requires_absorbent=requires_absorbent,
            message=f"Entered quantity {q_str} exceeds the maximum legal limit of {cao_str} per package under {citation}.",
            regulatory_citation=citation
        )

    if req.reg_mode == "IATA" and pax_num > 0 and user_val > pax_num:
        return QuantityValidationResult(
            is_valid=True,
            status="CAO_REQUIRED",
            user_quantity_val=user_val,
            user_quantity_unit=user_unit,
            max_allowed_val=cao_num,
            max_allowed_str=cao_str,
            is_forbidden=False,
            is_cao_required=True,
            requires_absorbent=requires_absorbent,
            message=f"Entered quantity {q_str} exceeds Passenger Aircraft limit ({pax_str}) but is compliant for Cargo Aircraft Only up to {cao_str} under {citation}.",
            regulatory_citation=citation
        )

    return QuantityValidationResult(
        is_valid=True,
        status="COMPLIANT",
        user_quantity_val=user_val,
        user_quantity_unit=user_unit,
        max_allowed_val=cao_num,
        max_allowed_str=cao_str,
        is_forbidden=False,
        is_cao_required=False,
        requires_absorbent=requires_absorbent,
        message=f"Entered quantity {q_str} is within legal shipping limits of {cao_str} under {citation}.",
        regulatory_citation=citation
    )

@app.post("/api/hazmat/validate-quantity", response_model=QuantityValidationResult)
def validate_hazmat_quantity(req: QuantityValidationRequest):
    return evaluate_quantity_compliance(req)

# ==========================================
# Address Book: Users, Shippers & Consignees
# ==========================================

from hazmat_app.address_book_db import (
    init_address_book_db,
    get_all_users,
    get_user_by_id,
    create_user as db_create_user,
    delete_user as db_delete_user,
    get_all_contacts,
    get_contact_by_id,
    create_contact as db_create_contact,
    update_contact as db_update_contact,
    delete_contact as db_delete_contact,
    set_default_contact as db_set_default_contact
)

# Auto-initialize SQLite tables & seed on startup
init_address_book_db()

class UserCreate(BaseModel):
    username: str
    full_name: str
    email: str
    role: Optional[str] = "Certified Hazmat Specialist"
    phone: Optional[str] = ""

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: str
    email: str
    role: str
    phone: Optional[str] = None
    created_at: Optional[str] = None

class ContactCreate(BaseModel):
    type: str  # 'SHIPPER', 'CONSIGNEE', 'BOTH'
    company_name: str
    contact_person: Optional[str] = ""
    street_address: str
    city: str
    state_province: Optional[str] = ""
    postal_code: Optional[str] = ""
    country: str = "USA"
    phone: Optional[str] = ""
    emergency_phone: Optional[str] = ""
    email: Optional[str] = ""
    is_default: Optional[bool] = False
    notes: Optional[str] = ""

class ContactUpdate(BaseModel):
    type: Optional[str] = None
    company_name: Optional[str] = None
    contact_person: Optional[str] = None
    street_address: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    phone: Optional[str] = None
    emergency_phone: Optional[str] = None
    email: Optional[str] = None
    is_default: Optional[bool] = None
    notes: Optional[str] = None

class ContactResponse(BaseModel):
    id: int
    type: str
    company_name: str
    contact_person: Optional[str] = None
    street_address: str
    city: str
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: str
    phone: Optional[str] = None
    emergency_phone: Optional[str] = None
    email: Optional[str] = None
    is_default: int = 0
    notes: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# --- User Endpoints --- #

@app.get("/api/users", response_model=List[UserResponse])
def list_users():
    return get_all_users()

@app.post("/api/users", response_model=UserResponse)
def add_user(req: UserCreate):
    try:
        user = db_create_user(req.model_dump())
        return user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create user: {str(e)}")

@app.get("/api/users/{user_id}", response_model=UserResponse)
def get_single_user(user_id: int):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
    return user

@app.delete("/api/users/{user_id}")
def remove_user(user_id: int):
    success = db_delete_user(user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found.")
    return {"message": f"User {user_id} deleted successfully."}

# --- Contacts (Shippers & Consignees) Endpoints --- #

@app.get("/api/contacts", response_model=List[ContactResponse])
def list_contacts(type: Optional[str] = Query(None, description="Filter by 'SHIPPER', 'CONSIGNEE', or None for all")):
    return get_all_contacts(type)

@app.post("/api/contacts", response_model=ContactResponse)
def add_contact(req: ContactCreate):
    try:
        contact = db_create_contact(req.model_dump())
        return contact
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create contact: {str(e)}")

@app.get("/api/contacts/{contact_id}", response_model=ContactResponse)
def get_single_contact(contact_id: int):
    contact = get_contact_by_id(contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
    return contact

@app.put("/api/contacts/{contact_id}", response_model=ContactResponse)
def update_existing_contact(contact_id: int, req: ContactUpdate):
    updated = db_update_contact(contact_id, req.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
    return updated

@app.delete("/api/contacts/{contact_id}")
def remove_contact(contact_id: int):
    success = db_delete_contact(contact_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
    return {"message": f"Contact {contact_id} deleted successfully."}

@app.post("/api/contacts/{contact_id}/default", response_model=ContactResponse)
def mark_contact_as_default(contact_id: int):
    updated = db_set_default_contact(contact_id)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Contact {contact_id} not found.")
    return updated

# --- Static Frontend Serving (for Unified Single-Container / Render Deployment) --- #
# Check possible dist locations (root ../frontend/dist, ./dist, or ../dist)
DIST_DIR = None
for candidate in [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path(__file__).resolve().parent.parent / "dist",
    Path("frontend/dist"),
    Path("dist")
]:
    if candidate.exists() and (candidate / "index.html").exists():
        DIST_DIR = candidate
        break

if DIST_DIR:
    # Mount assets folder if exists
    assets_dir = DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    # Serve SPA index.html on root and non-API routes
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = DIST_DIR / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")
else:
    @app.get("/")
    def index_fallback():
        return {
            "service": "EZShip Hazmat Compliance Engine API",
            "status": "Online",
            "note": "Frontend dist build not found. If running locally, run 'npm run build' inside /frontend or run Vite dev server on port 5173.",
            "docs": "/docs"
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("hazmat_app.main:app", host="0.0.0.0", port=port, reload=False)
