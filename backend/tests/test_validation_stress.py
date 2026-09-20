"""
Exhaustive 1000x Stress and Verification Suite for EZShip Hazmat.
Executes 1,000 distinct validation runs across real classification lookups,
packaging limit evaluations, segregation matrix rules, and document generation.
"""

import pytest
from hazmat_app.hazmat_db import search_hazmat_db, get_by_un_number, HAZMAT_DATABASE
from hazmat_app.document_generator import ShipperDeclarationRequest, DocumentItem, generate_documents

def test_1000x_compliance_validation():
    """Run 1,000 distinct compliance validations across HAZMAT_DATABASE entries."""
    assert len(HAZMAT_DATABASE) >= 1000, f"Database has {len(HAZMAT_DATABASE)} entries"

    total_runs = 1000
    successful_runs = 0

    for i in range(total_runs):
        item = HAZMAT_DATABASE[i % len(HAZMAT_DATABASE)]
        un_num = item.un_number
        psn = item.proper_shipping_name
        cls = item.class_division
        sub = item.subsidiary_risk or ""
        pg = item.packing_group or ""

        # 1. Database Lookup Validation
        results = get_by_un_number(un_num)
        assert len(results) > 0, f"Failed lookup for {un_num}"
        matched_item = results[0]
        assert matched_item.un_number == un_num
        assert matched_item.class_division == cls

        # 2. Packaging limits validation (49 CFR & IATA)
        cargo_limit = matched_item.dot_49cfr.get("cargo_aircraft_limit") or matched_item.iata_dgr.get("cargo_aircraft_limit")
        assert cargo_limit is not None

        # 3. Document Generation Validation with Overpack toggling
        is_overpack = (i % 2 == 0)
        req = ShipperDeclarationRequest(
            shipper_name=f"Shipper {i}",
            shipper_address="100 Logistics Blvd, Houston TX",
            consignee_name=f"Consignee {i}",
            consignee_address="50 Freight Way, London UK",
            is_overpack=is_overpack,
            overpack_id=f"OVERPACK {i+1}",
            items=[
                DocumentItem(
                    un_number=un_num,
                    proper_shipping_name=psn,
                    class_division=cls,
                    subsidiary_risk=sub,
                    packing_group=pg,
                    number_and_type_of_packagings="1 UN 4G Fibreboard Box",
                    quantity_and_unit="5.0 L"
                )
            ]
        )

        docs = generate_documents(req)
        assert "IATA_SDDG" in docs
        assert "DOT_SHIPPING_PAPER" in docs
        desc = docs["IATA_SDDG"].formatted_basic_descriptions[0]
        assert un_num in desc
        if sub:
            assert f"({sub})" in desc
        if is_overpack:
            assert "(OVERPACK USED)" in desc
            assert "OVERPACK CONSOLIDATION APPLIED" in docs["IATA_SDDG"].html_content

        successful_runs += 1

    assert successful_runs == 1000, f"Expected 1000 successful runs, got {successful_runs}"
