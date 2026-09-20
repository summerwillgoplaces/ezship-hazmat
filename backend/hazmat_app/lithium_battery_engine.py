"""
EZShip Hazmat - Specialized Lithium & Sodium-Ion Battery Decision Engine
Implements IATA DGR 66th Edition (2025/2026) Packing Instructions 965-970 & 976-978 + US DOT 49 CFR 173.185
"""

from typing import List, Optional
from pydantic import BaseModel, Field

class LithiumBatteryRequest(BaseModel):
    chemistry: str  # "ION", "METAL", or "SODIUM_ION"
    packaging_format: str  # "STANDALONE", "PACKED_WITH_EQUIPMENT", "CONTAINED_IN_EQUIPMENT"
    is_cell: bool = False  # True = single cell, False = battery pack
    watt_hours: Optional[float] = None  # For Lithium/Sodium-Ion (e.g. 15.0 or 120.0)
    lithium_grams: Optional[float] = None  # For Lithium Metal (e.g. 0.5 or 3.0)
    quantity_cells_or_batteries: int = 1
    net_weight_kg: float = 0.5
    transport_mode: str = "AIR"  # "AIR" (IATA) or "GROUND" (49CFR)
    state_of_charge_percent: Optional[float] = 30.0  # Mandatory <= 30% for PI 965 & PI 976

class LithiumBatteryResult(BaseModel):
    un_number: str
    proper_shipping_name: str
    hazard_class: str
    packing_instruction: str
    section_classification: str  # "Section IA", "Section IB", "Section II (Excepted)"
    requires_dg_declaration: bool
    requires_un_packaging: bool
    requires_state_of_charge_verification: bool
    soc_compliant: bool
    required_labels: List[str]
    required_markings: List[str]
    max_net_weight_allowed_kg: float
    regulatory_notes: List[str]

def evaluate_lithium_battery(req: LithiumBatteryRequest) -> LithiumBatteryResult:
    notes: List[str] = []
    labels: List[str] = []
    markings: List[str] = []
    soc_req = False
    soc_ok = True
    chem = req.chemistry.upper()

    # 1. Determine UN Number & Proper Shipping Name
    if chem == "SODIUM_ION":
        if req.packaging_format == "STANDALONE":
            un_num = "UN3551"
            psn = "SODIUM ION BATTERIES with organic electrolyte"
            pi_code = "PI 976"
            soc_req = True
            if req.state_of_charge_percent is not None and req.state_of_charge_percent > 30.0:
                soc_ok = False
                notes.append("CRITICAL: Standalone Sodium-Ion batteries (UN 3551) shipped by air MUST NOT exceed 30% State of Charge (SoC).")
        elif req.packaging_format == "PACKED_WITH_EQUIPMENT":
            un_num = "UN3552"
            psn = "SODIUM ION BATTERIES PACKED WITH EQUIPMENT with organic electrolyte"
            pi_code = "PI 978"
        else:
            un_num = "UN3552"
            psn = "SODIUM ION BATTERIES CONTAINED IN EQUIPMENT with organic electrolyte"
            pi_code = "PI 977"
    elif chem == "ION":
        if req.packaging_format == "STANDALONE":
            un_num = "UN3480"
            psn = "LITHIUM ION BATTERIES (including lithium ion polymer batteries)"
            pi_code = "PI 965"
            soc_req = True
            if req.state_of_charge_percent is not None and req.state_of_charge_percent > 30.0:
                soc_ok = False
                notes.append("CRITICAL: Standalone Li-ion batteries (UN 3480) shipped by air MUST NOT exceed 30% State of Charge (SoC).")
        elif req.packaging_format == "PACKED_WITH_EQUIPMENT":
            un_num = "UN3481"
            psn = "LITHIUM ION BATTERIES PACKED WITH EQUIPMENT"
            pi_code = "PI 966"
        else:
            un_num = "UN3481"
            psn = "LITHIUM ION BATTERIES CONTAINED IN EQUIPMENT"
            pi_code = "PI 967"
    else:  # METAL
        if req.packaging_format == "STANDALONE":
            un_num = "UN3090"
            psn = "LITHIUM METAL BATTERIES"
            pi_code = "PI 968"
        elif req.packaging_format == "PACKED_WITH_EQUIPMENT":
            un_num = "UN3091"
            psn = "LITHIUM METAL BATTERIES PACKED WITH EQUIPMENT"
            pi_code = "PI 969"
        else:
            un_num = "UN3091"
            psn = "LITHIUM METAL BATTERIES CONTAINED IN EQUIPMENT"
            pi_code = "PI 970"

    # 2. Determine Small vs Large Cell/Battery Rating Thresholds
    is_small = False
    if chem in ["ION", "SODIUM_ION"]:
        wh = req.watt_hours or 0.0
        if req.is_cell:
            is_small = (wh <= 20.0)
        else:
            is_small = (wh <= 100.0)
    else:
        grams = req.lithium_grams or 0.0
        if req.is_cell:
            is_small = (grams <= 1.0)
        else:
            is_small = (grams <= 2.0)

    # 3. Determine Section Classification (IA, IB, II) & Requirements
    section = "Section IA"
    requires_dg_dec = True
    requires_un_pkg = True
    max_net_wt = 35.0

    if not is_small:
        section = "Section IA"
        requires_dg_dec = True
        requires_un_pkg = True
        labels.append("Class 9 Battery Mark (Lithium/Sodium)")
        if req.packaging_format == "STANDALONE" and req.transport_mode == "AIR":
            labels.append("Cargo Aircraft Only (CAO) Label")
            notes.append("Forbidden on Passenger Aircraft. Cargo Aircraft Only label mandatory.")
        markings.append(f"{un_num} {psn}")
        markings.append("UN Specification Packaging Mark (e.g. 4G/Y...)")
        max_net_wt = 35.0 if req.transport_mode == "AIR" else 300.0
    else:
        # Small batteries can be Section IB or Section II based on quantity/weight
        if req.packaging_format == "STANDALONE":
            if req.net_weight_kg > 2.5 and req.transport_mode == "AIR":
                section = "Section IB"
                requires_dg_dec = True
                requires_un_pkg = True
                labels.append("Class 9 Battery Mark (Lithium/Sodium)")
                labels.append("Cargo Aircraft Only (CAO) Label")
                markings.append("Battery Mark with UN Number & Telephone Number")
                max_net_wt = 10.0
            else:
                section = "Section II (Excepted)"
                requires_dg_dec = False
                requires_un_pkg = False
                markings.append("Battery Mark with UN Number & Telephone Number")
                notes.append("Excepted from full DG Declaration. Strong rigid outer packaging required (1.2m drop test compliant).")
                max_net_wt = 2.5 if req.transport_mode == "AIR" else 30.0
        else:
            # Contained or Packed with Equipment
            if req.net_weight_kg > 5.0 and req.transport_mode == "AIR":
                section = "Section I"
                requires_dg_dec = True
                requires_un_pkg = True
                labels.append("Class 9 Battery Mark (Lithium/Sodium)")
                max_net_wt = 35.0
            else:
                section = "Section II (Excepted)"
                requires_dg_dec = False
                requires_un_pkg = False
                if req.packaging_format == "CONTAINED_IN_EQUIPMENT" and req.quantity_cells_or_batteries <= 4 and req.is_cell:
                    notes.append("Excepted from Battery Mark if consignment contains <= 2 packages of equipment with <= 4 cells.")
                else:
                    markings.append("Battery Mark with UN Number & Telephone Number")
                max_net_wt = 5.0 if req.transport_mode == "AIR" else 30.0

    return LithiumBatteryResult(
        un_number=un_num,
        proper_shipping_name=psn,
        hazard_class="9",
        packing_instruction=pi_code,
        section_classification=section,
        requires_dg_declaration=requires_dg_dec,
        requires_un_packaging=requires_un_pkg,
        requires_state_of_charge_verification=soc_req,
        soc_compliant=soc_ok,
        required_labels=labels,
        required_markings=markings,
        max_net_weight_allowed_kg=max_net_wt,
        regulatory_notes=notes
    )
