"""
EZShip Hazmat - Comprehensive UN/ID Dangerous Goods Database
Compliant with ADR 2025/2026, US DOT 49 CFR (172.101) & IATA DGR 66th Edition (2025/2026 Latest Updates)
Covers all 3,549 UN Dangerous Goods Entries (UN 0004 to UN 3552) across all 9 Hazard Classes
"""

import json
import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class HazmatItem(BaseModel):
    un_number: str
    proper_shipping_name: str
    class_division: str
    subsidiary_risk: Optional[str] = ""
    packing_group: Optional[str] = ""
    labels_required: List[str]
    special_provisions: List[str] = []
    dot_49cfr: Dict[str, str]
    iata_dgr: Dict[str, str]
    adr_2026: Optional[Dict[str, Any]] = {}
    technical_name_required: bool = False
    reportable_quantity_lbs: Optional[float] = None
    description: str = ""


def _load_database() -> List[HazmatItem]:
    json_path = os.path.join(os.path.dirname(__file__), "adr_2026_db.json")
    if os.path.exists(json_path):
        with open(json_path, "r", encoding="utf-8") as f:
            raw_data = json.load(f)
            return [HazmatItem(**item) for item in raw_data]
    return []

HAZMAT_DATABASE: List[HazmatItem] = _load_database()

def search_hazmat_db(query: str, class_filter: Optional[str] = None) -> List[HazmatItem]:
    """Search hazmat database by UN Number, Proper Shipping Name, Class, or description."""
    q = query.strip().upper()
    q_norm = q.replace(" ", "").replace("-", "")
    results = []
    for item in HAZMAT_DATABASE:
        if class_filter and not item.class_division.startswith(class_filter):
            continue
        if not q:
            results.append(item)
            continue
        
        un_upper = item.un_number.upper()
        un_norm = un_upper.replace(" ", "").replace("-", "")
        psn_upper = item.proper_shipping_name.upper()
        desc_upper = item.description.upper()
        
        # Match condition
        if (q in un_upper or 
            (q_norm and q_norm in un_norm) or 
            q in psn_upper or 
            q in desc_upper):
            results.append(item)
            
    return results[:100]  # Cap search results at top 100 for maximum UI responsiveness

def get_by_un_number(un_num: str) -> List[HazmatItem]:
    """Get hazmat items matching exact or formatted UN number (e.g. UN3480 or 3480)."""
    clean_un = un_num.strip().upper()
    if not clean_un.startswith("UN") and not clean_un.startswith("ID"):
        clean_un = f"UN{clean_un}"
    return [item for item in HAZMAT_DATABASE if item.un_number == clean_un]
