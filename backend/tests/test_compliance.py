"""
Automated PyTest suite for EZShip Hazmat Compliance Engine
Verifies 49 CFR & IATA DGR logic, Lithium Battery Decision Tree, Segregation Matrix, and Document Generation
"""

import pytest
from hazmat_app.hazmat_db import search_hazmat_db, get_by_un_number, HAZMAT_DATABASE
from hazmat_app.segregation_engine import SegregationCheckRequest, evaluate_segregation
from hazmat_app.lithium_battery_engine import LithiumBatteryRequest, evaluate_lithium_battery
from hazmat_app.document_generator import ShipperDeclarationRequest, DocumentItem, generate_documents


def test_hazmat_database_search():
    """Verify UN database lookup for UN 3480 and Gasoline."""
    assert len(HAZMAT_DATABASE) >= 15

    results_un = get_by_un_number("3480")
    assert len(results_un) >= 1
    assert results_un[0].un_number == "UN3480"
    assert "LITHIUM ION" in results_un[0].proper_shipping_name

    results_gas = search_hazmat_db("GASOLINE")
    assert len(results_gas) >= 1
    assert results_gas[0].un_number == "UN1203"
    assert results_gas[0].class_division == "3"


def test_lithium_battery_wizard_standalone_ion_section_ia():
    """Test UN 3480 Standalone Li-ion battery > 100 Wh (Section IA - Fully Regulated Class 9)."""
    req = LithiumBatteryRequest(
        chemistry="ION",
        packaging_format="STANDALONE",
        is_cell=False,
        watt_hours=120.0,
        net_weight_kg=15.0,
        transport_mode="AIR",
        state_of_charge_percent=25.0
    )
    res = evaluate_lithium_battery(req)

    assert res.un_number == "UN3480"
    assert res.section_classification == "Section IA"
    assert res.requires_dg_declaration is True
    assert res.requires_un_packaging is True
    assert res.requires_state_of_charge_verification is True
    assert res.soc_compliant is True
    assert "Cargo Aircraft Only (CAO) Label" in res.required_labels


def test_lithium_battery_wizard_standalone_ion_soc_violation():
    """Test UN 3480 State of Charge > 30% warning for Air transport."""
    req = LithiumBatteryRequest(
        chemistry="ION",
        packaging_format="STANDALONE",
        is_cell=False,
        watt_hours=50.0,
        net_weight_kg=1.0,
        transport_mode="AIR",
        state_of_charge_percent=60.0 # Violation
    )
    res = evaluate_lithium_battery(req)

    assert res.un_number == "UN3480"
    assert res.soc_compliant is False
    assert any("30% State of Charge" in note for note in res.regulatory_notes)


def test_lithium_battery_wizard_contained_in_equipment_excepted():
    """Test UN 3481 Li-ion contained in equipment <= 100Wh (Section II Excepted)."""
    req = LithiumBatteryRequest(
        chemistry="ION",
        packaging_format="CONTAINED_IN_EQUIPMENT",
        is_cell=False,
        watt_hours=45.0,
        net_weight_kg=1.2,
        transport_mode="AIR"
    )
    res = evaluate_lithium_battery(req)

    assert res.un_number == "UN3481"
    assert "Section II" in res.section_classification
    assert res.requires_dg_declaration is False
    assert res.requires_un_packaging is False


def test_segregation_flammable_liquid_and_oxidizer_incompatible():
    """Test Class 3 Flammable Liquid (UN 1203) with Class 5.1 Oxidizer (UN 2014) -> Forbidden (X)."""
    req = SegregationCheckRequest(
        items=[
            {"id": "1", "un_number": "UN1203", "proper_shipping_name": "GASOLINE", "class_division": "3"},
            {"id": "2", "un_number": "UN2014", "proper_shipping_name": "HYDROGEN PEROXIDE", "class_division": "5.1"}
        ],
        mode="49CFR"
    )
    res = evaluate_segregation(req)

    assert res.is_compliant is False
    assert len(res.conflicts) == 1
    assert res.conflicts[0].conflict_type == "X"
    assert "PROHIBITED" in res.conflicts[0].rule_summary


def test_segregation_compatible_items():
    """Test Class 3 Flammable Liquid with Class 9 Lithium Batteries -> Compatible."""
    req = SegregationCheckRequest(
        items=[
            {"id": "1", "un_number": "UN1203", "proper_shipping_name": "GASOLINE", "class_division": "3"},
            {"id": "2", "un_number": "UN3481", "proper_shipping_name": "LITHIUM ION BATTERIES IN EQUIPMENT", "class_division": "9"}
        ],
        mode="49CFR"
    )
    res = evaluate_segregation(req)

    assert res.is_compliant is True
    assert len(res.conflicts) == 0


def test_document_generation():
    """Test generation of IATA Shipper's Declaration and DOT Shipping Paper."""
    req = ShipperDeclarationRequest(
        shipper_name="ACME Chemicals Inc",
        shipper_address="100 Industrial Pkwy, Houston, TX 77001",
        consignee_name="Global Tech Ltd",
        consignee_address="50 Logistics Way, London, UK",
        airway_bill_number="016-12345678",
        emergency_phone="1-800-424-9300",
        emergency_contact_name="CHEMTREC",
        items=[
            DocumentItem(
                un_number="UN1203",
                proper_shipping_name="GASOLINE",
                class_division="3",
                packing_group="II",
                number_and_type_of_packagings="1 Steel Drum (1A1)",
                quantity_and_unit="50.0 L",
                packing_instruction="PI 364"
            )
        ]
    )

    docs = generate_documents(req)
    assert "IATA_SDDG" in docs
    assert "DOT_SHIPPING_PAPER" in docs

    iata_doc = docs["IATA_SDDG"]
    assert "SHIPPER'S DECLARATION FOR DANGEROUS GOODS" in iata_doc.html_content
    assert "UN1203" in iata_doc.html_content
    assert "ACME Chemicals Inc" in iata_doc.html_content

    dot_doc = docs["DOT_SHIPPING_PAPER"]
    assert "HAZARDOUS MATERIALS SHIPPING PAPER" in dot_doc.html_content
    assert "UN1203, GASOLINE, Class 3, PG II" in dot_doc.formatted_basic_descriptions[0]


def test_un1814_potassium_hydroxide_search():
    """Verify UN 1814 Potassium Hydroxide Solution search functionality."""
    # Test UN search with space
    res_space = search_hazmat_db("UN 1814")
    assert len(res_space) >= 1
    assert res_space[0].un_number == "UN1814"
    assert "POTASSIUM HYDROXIDE" in res_space[0].proper_shipping_name

    # Test search by name
    res_name = search_hazmat_db("POTASSIUM HYDROXIDE")
    assert len(res_name) >= 1
    un_nums = [item.un_number for item in res_name]
    assert "UN1814" in un_nums


def test_overpack_document_generation():
    """Verify Overpack combined shipment document generation and notation."""
    req = ShipperDeclarationRequest(
        shipper_name="ACME Overpack Logistics",
        shipper_address="100 Industrial Pkwy, Houston, TX",
        consignee_name="Global Express",
        consignee_address="1 Logistics Blvd, London, UK",
        is_overpack=True,
        overpack_id="OVERPACK 1",
        items=[
            DocumentItem(
                un_number="UN1203",
                proper_shipping_name="GASOLINE",
                class_division="3",
                packing_group="II",
                number_and_type_of_packagings="1 Fibreboard Box (4G) (OVERPACK USED)",
                quantity_and_unit="5.0 L"
            ),
            DocumentItem(
                un_number="UN3480",
                proper_shipping_name="LITHIUM ION BATTERIES",
                class_division="9",
                packing_group="",
                number_and_type_of_packagings="1 Fibreboard Box (4G) (OVERPACK USED)",
                quantity_and_unit="2.0 kg G"
            )
        ]
    )

    docs = generate_documents(req)
    assert "OVERPACK USED" in docs["IATA_SDDG"].formatted_basic_descriptions[0]
    assert "OVERPACK CONSOLIDATION APPLIED" in docs["IATA_SDDG"].html_content


def test_subsidiary_risk_document_formatting():
    """Verify hazardous materials with subsidiary risks format correctly with primary (sub) classes."""
    req = ShipperDeclarationRequest(
        shipper_name="ACME Dual Hazard Logistics",
        shipper_address="200 Chemical Way, Houston, TX",
        consignee_name="Global Pharma",
        consignee_address="10 Research Park, Basel, Switzerland",
        items=[
            DocumentItem(
                un_number="UN1230",
                proper_shipping_name="METHANOL",
                class_division="3",
                subsidiary_risk="6.1",
                packing_group="II",
                number_and_type_of_packagings="1 Steel Drum (1A1)",
                quantity_and_unit="60.0 L",
                packing_instruction="PI 364"
            )
        ]
    )
    docs = generate_documents(req)
    iata_desc = docs["IATA_SDDG"].formatted_basic_descriptions[0]
    dot_desc = docs["DOT_SHIPPING_PAPER"].formatted_basic_descriptions[0]

    assert "UN1230, METHANOL, Class 3 (6.1), PG II" in iata_desc
    assert "UN1230, METHANOL, Class 3 (6.1), PG II" in dot_desc


def test_database_packaging_limits_lookup():
    """Verify 49 CFR, IATA DGR and ADR packaging limits in database for key materials."""
    results_un1203 = get_by_un_number("UN1203")
    assert len(results_un1203) > 0
    item = results_un1203[0]
    assert "cargo_aircraft_limit" in item.dot_49cfr
    assert "cargo_aircraft_limit" in item.iata_dgr
    assert item.dot_49cfr["cargo_aircraft_limit"] == "60 L"
    assert item.iata_dgr["cargo_aircraft_limit"] == "60 L"

    results_un1814 = get_by_un_number("UN1814")
    assert len(results_un1814) > 0
    item_1814 = results_un1814[0]
    assert item_1814.class_division == "8"
    assert item_1814.packing_group == "II"


def test_custom_quantity_and_packaging_document_generation():
    """Verify custom packaging types and user-input quantities are preserved in declarations."""
    req = ShipperDeclarationRequest(
        shipper_name="ACME Custom Pack Corp",
        shipper_address="500 Packaging Way, Houston, TX",
        consignee_name="Pacific Dist",
        consignee_address="200 Marine Rd, Sydney, Australia",
        items=[
            DocumentItem(
                un_number="UN1203",
                proper_shipping_name="GASOLINE",
                class_division="3",
                packing_group="II",
                number_and_type_of_packagings="2 Plastic Jerricans (3H1)",
                quantity_and_unit="25.0 L",
                packing_instruction="PI 364"
            ),
            DocumentItem(
                un_number="UN1814",
                proper_shipping_name="POTASSIUM HYDROXIDE SOLUTION",
                class_division="8",
                packing_group="II",
                number_and_type_of_packagings="1 Steel Removable Head Drum (1A2)",
                quantity_and_unit="10.5 L",
                packing_instruction="PI 851"
            )
        ]
    )
    docs = generate_documents(req)
    iata_doc = docs["IATA_SDDG"]
    dot_doc = docs["DOT_SHIPPING_PAPER"]

    assert "2 Plastic Jerricans (3H1)" in iata_doc.html_content
    assert "25.0 L" in iata_doc.html_content
    assert "1 Steel Removable Head Drum (1A2)" in iata_doc.html_content
    assert "10.5 L" in iata_doc.html_content
    assert "2 Plastic Jerricans (3H1)" in dot_doc.html_content


def test_regulatory_quantity_validation():
    """Verify net quantity regulation limits for passenger, CAO, and exceeded cases."""
    from hazmat_app.main import QuantityValidationRequest, evaluate_quantity_compliance

    # Case 1: Compliant within Passenger Aircraft limit (2.0 L Gasoline <= 5.0 L limit)
    res_pax = evaluate_quantity_compliance(QuantityValidationRequest(
        un_number="UN1203",
        quantity_str="2.0 L",
        reg_mode="IATA"
    ))
    assert res_pax.is_valid is True
    assert res_pax.status == "COMPLIANT"
    assert res_pax.is_cao_required is False
    assert res_pax.requires_absorbent is True

    # Case 2: Exceeds Passenger limit but compliant for Cargo Aircraft Only (20.0 L Gasoline > 5 L, <= 60 L)
    res_cao = evaluate_quantity_compliance(QuantityValidationRequest(
        un_number="UN1203",
        quantity_str="20.0 L",
        reg_mode="IATA"
    ))
    assert res_cao.is_valid is True
    assert res_cao.status == "CAO_REQUIRED"
    assert res_cao.is_cao_required is True

    # Case 3: Exceeds maximum legal package limit (100.0 L Gasoline > 60 L CAO limit)
    res_exceeded = evaluate_quantity_compliance(QuantityValidationRequest(
        un_number="UN1203",
        quantity_str="100.0 L",
        reg_mode="IATA"
    ))
    assert res_exceeded.is_valid is False
    assert res_exceeded.status == "EXCEEDED"
    assert "exceeds" in res_exceeded.message.lower()

    # Case 4: Invalid/empty quantity
    res_invalid = evaluate_quantity_compliance(QuantityValidationRequest(
        un_number="UN1203",
        quantity_str="0 L",
        reg_mode="IATA"
    ))
    assert res_invalid.is_valid is False
    assert res_invalid.status == "INVALID_INPUT"

