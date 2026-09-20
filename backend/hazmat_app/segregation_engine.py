"""
EZShip Hazmat - Segregation & Incompatibility Matrix Engine
Implements US DOT 49 CFR 177.848 (Highway/Rail) & IATA DGR 9.3.11 (Air Transport)
"""

from typing import List, Dict, Tuple, Optional
from pydantic import BaseModel

class SegregationCheckRequest(BaseModel):
    items: List[Dict[str, str]] # Each item: {"id": "1", "un_number": "UN1203", "proper_shipping_name": "GASOLINE", "class_division": "3"}
    mode: str = "49CFR" # "49CFR" or "IATA"

class SegregationConflict(BaseModel):
    item1_un: str
    item1_psn: str
    item1_class: str
    item2_un: str
    item2_psn: str
    item2_class: str
    conflict_type: str # "X" (Forbidden), "O" (Separated by distance), "*" (Special rule)
    rule_summary: str
    regulatory_reference: str

class SegregationCheckResult(BaseModel):
    is_compliant: bool
    conflicts: List[SegregationConflict]
    recommendations: List[str]

# 49 CFR 177.848(e) Segregation Table Matrix
# Key classes: "1.1", "1.2", "1.3", "1.4", "1.5", "2.1", "2.2", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "7", "8", "9"
DOT_SEGREGATION_TABLE: Dict[Tuple[str, str], str] = {
    # Class 3 (Flammable Liquids) vs Others
    ("3", "5.1"): "X",
    ("5.1", "3"): "X",
    ("3", "5.2"): "X",
    ("5.2", "3"): "X",
    ("3", "2.3"): "X", # Toxic gas zone A
    ("2.3", "3"): "X",
    ("3", "4.2"): "O",
    ("4.2", "3"): "O",

    # Class 5.1 (Oxidizers) vs Flammables & Organics
    ("5.1", "2.1"): "X",
    ("2.1", "5.1"): "X",
    ("5.1", "4.1"): "X",
    ("4.1", "5.1"): "X",
    ("5.1", "4.2"): "X",
    ("4.2", "5.1"): "X",
    ("5.1", "4.3"): "X",
    ("4.3", "5.1"): "X",
    ("5.1", "8"): "O", # Cyanides/acids
    ("8", "5.1"): "O",

    # Class 4.3 (Dangerous When Wet) vs Liquids
    ("4.3", "8"): "O",
    ("8", "4.3"): "O",
    ("4.3", "3"): "O",
    ("3", "4.3"): "O",

    # Class 8 (Corrosives) Acid vs Alkali / Cyanides
    ("8", "6.1"): "*", # Cyanides or cyanate mixtures with acids generate HCN gas
    ("6.1", "8"): "*",
}

# IATA DGR Section 9.3.11 Segregation Table
IATA_SEGREGATION_TABLE: Dict[Tuple[str, str], str] = {
    ("3", "5.1"): "X",
    ("5.1", "3"): "X",
    ("2.1", "5.1"): "X",
    ("5.1", "2.1"): "X",
    ("4.1", "5.1"): "X",
    ("5.1", "4.1"): "X",
    ("4.2", "5.1"): "X",
    ("5.1", "4.2"): "X",
    ("4.3", "5.1"): "X",
    ("5.1", "4.3"): "X",
    ("5.1", "5.2"): "X",
    ("5.2", "5.1"): "X",
    ("8", "5.1"): "X",
    ("5.1", "8"): "X",
}

def evaluate_segregation(request: SegregationCheckRequest) -> SegregationCheckResult:
    conflicts: List[SegregationConflict] = []
    recommendations: List[str] = []
    items = request.items
    mode = request.mode.upper()
    table = DOT_SEGREGATION_TABLE if mode == "49CFR" else IATA_SEGREGATION_TABLE
    ref_name = "49 CFR 177.848" if mode == "49CFR" else "IATA DGR Section 9.3.11"

    for i in range(len(items)):
        for j in range(i + 1, len(items)):
            it1 = items[i]
            it2 = items[j]
            c1 = it1.get("class_division", "").strip()
            c2 = it2.get("class_division", "").strip()

            # Normalize primary class prefix (e.g. 2.1 -> 2.1 or 3 -> 3)
            pair = (c1, c2)
            conflict_code = table.get(pair)

            if conflict_code:
                rule_desc = ""
                if conflict_code == "X":
                    rule_desc = f"PROHIBITED: Class {c1} and Class {c2} must NOT be loaded, transported, or stored together in the same compartment/vehicle under {ref_name}."
                elif conflict_code == "O":
                    rule_desc = f"SEPARATION REQUIRED: Class {c1} and Class {c2} may only be co-transported if separated by full vehicle length or non-combustible partitions."
                elif conflict_code == "*":
                    rule_desc = f"SPECIAL PROVISION: Verify chemical compatibility (e.g., cyanides with acids generate toxic HCN gas)."

                conflicts.append(
                    SegregationConflict(
                        item1_un=it1.get("un_number", ""),
                        item1_psn=it1.get("proper_shipping_name", ""),
                        item1_class=c1,
                        item2_un=it2.get("un_number", ""),
                        item2_psn=it2.get("proper_shipping_name", ""),
                        item2_class=c2,
                        conflict_type=conflict_code,
                        rule_summary=rule_desc,
                        regulatory_reference=ref_name
                    )
                )

    is_compliant = not any(c.conflict_type == "X" for c in conflicts)

    if not is_compliant:
        recommendations.append("Separate incompatible items into distinct shipments or separate transport units.")
    elif conflicts:
        recommendations.append("Ensure required physical separation distance or approved partitions are utilized.")
    else:
        recommendations.append("All selected items are compatible for co-loading under transport regulations.")

    return SegregationCheckResult(
        is_compliant=is_compliant,
        conflicts=conflicts,
        recommendations=recommendations
    )
