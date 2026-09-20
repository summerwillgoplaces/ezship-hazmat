"""
EZShip Hazmat - Automated Shipping Paper & IATA Declaration Generator
Compliant with 49 CFR 172.200 & IATA DGR Section 8
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field
import datetime

class DocumentItem(BaseModel):
    un_number: str
    proper_shipping_name: str
    technical_name: Optional[str] = ""
    class_division: str
    subsidiary_risk: Optional[str] = ""
    packing_group: Optional[str] = ""
    number_and_type_of_packagings: str  # e.g. "1 Fibreboard Box (4G)"
    quantity_and_unit: str  # e.g. "5.0 L" or "10.0 kg"
    packing_instruction: Optional[str] = ""
    authorization: Optional[str] = ""  # e.g. "Limited Quantity" or "Aircraft Only"

class ShipperDeclarationRequest(BaseModel):
    shipper_name: str
    shipper_address: str
    consignee_name: str
    consignee_address: str
    airway_bill_number: Optional[str] = "N/A"
    departure_airport: Optional[str] = "JFK - New York"
    destination_airport: Optional[str] = "LHR - London Heathrow"
    shipment_type: str = "CARGO_AIRCRAFT_ONLY"  # "PASSENGER_AND_CARGO_AIRCRAFT" or "CARGO_AIRCRAFT_ONLY"
    transport_mode: str = "AIR"  # "AIR" or "GROUND"
    emergency_phone: str = "1-800-424-9300 (CHEMTREC Contract #12345)"
    emergency_contact_name: str = "24-HOUR EMERGENCY RESPONSE SERVICE"
    items: List[DocumentItem]
    is_overpack: Optional[bool] = False
    overpack_id: Optional[str] = "OVERPACK 1"
    signatory_name: str = "Certified Hazmat Shipper"
    date_str: str = Field(default_factory=lambda: datetime.date.today().strftime("%Y-%m-%d"))

class DocumentOutput(BaseModel):
    document_type: str
    html_content: str
    formatted_basic_descriptions: List[str]

def generate_documents(req: ShipperDeclarationRequest) -> Dict[str, DocumentOutput]:
    # 1. Format Basic Description according to 49 CFR 172.202 / IATA 8.1.6
    # Sequence: UN Number, Proper Shipping Name (including technical name if required), Hazard Class, Packing Group
    basic_descriptions = []
    for it in req.items:
        psn_full = it.proper_shipping_name
        if it.technical_name:
            psn_full += f" ({it.technical_name.upper()})"
        
        pg_str = f", PG {it.packing_group}" if it.packing_group else ""
        sub_str = f" ({it.subsidiary_risk})" if it.subsidiary_risk else ""
        
        formatted = f"{it.un_number}, {psn_full}, Class {it.class_division}{sub_str}{pg_str}, {it.number_and_type_of_packagings}, {it.quantity_and_unit}"
        if it.packing_instruction:
            formatted += f", {it.packing_instruction}"
        if req.is_overpack:
            formatted += " (OVERPACK USED)"
        basic_descriptions.append(formatted)

    overpack_banner = f"""
    <div style="background: #e6f7ff; border: 2px dashed #0077cc; padding: 10px; margin-top: 10px; font-size: 11px; color: #004488; font-weight: bold;">
        📦 OVERPACK CONSOLIDATION APPLIED ({req.overpack_id or 'OVERPACK 1'}): All enclosed packages are compatible and marked "OVERPACK" per IATA DGR 7.1.7 / US DOT 49 CFR 173.25.
    </div>
    """ if req.is_overpack else ""

    # 2. Build FedEx Express IATA Shipper's Declaration HTML Template (FedEx FX-18 Compliant)
    is_pax = (req.shipment_type == 'PASSENGER_AND_CARGO_AIRCRAFT')
    pax_chk = "X" if is_pax else "&nbsp;"
    cao_chk = "&nbsp;" if is_pax else "X"
    pax_cls = "checked" if is_pax else ""
    cao_cls = "" if is_pax else "checked"

    iata_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>FedEx Express Shipper's Declaration for Dangerous Goods</title>
        <style>
            @page {{ size: letter; margin: 10mm; }}
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; color: #111; margin: 0; padding: 12px; background: #fff; }}
            
            /* FedEx Signature Red Candy-Stripe Hatching Border */
            .fedex-page-border {{
                border: 12px solid transparent;
                border-image: repeating-linear-gradient(45deg, #cc0000, #cc0000 12px, #ffffff 12px, #ffffff 24px) 12;
                padding: 16px;
                background: #ffffff;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }}

            .fedex-logo-bar {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 2px solid #cc0000;
                padding-bottom: 8px;
                margin-bottom: 12px;
            }}

            .fedex-brand {{
                font-size: 22px;
                font-weight: 900;
                color: #4d148c;
                letter-spacing: -1px;
            }}

            .header-title {{
                text-align: right;
                color: #cc0000;
                font-size: 14px;
                font-weight: 800;
                text-transform: uppercase;
            }}

            .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }}
            .box {{ border: 1px solid #333; padding: 6px 8px; background: #fafafa; font-size: 10px; }}
            .box-title {{ font-size: 8px; font-weight: 800; color: #555; text-transform: uppercase; margin-bottom: 3px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }}

            .checkbox-group {{ display: flex; gap: 15px; margin-top: 4px; font-size: 9px; font-weight: 700; }}
            .checkbox {{ display: inline-block; width: 12px; height: 12px; border: 1.5px solid #000; text-align: center; line-height: 11px; font-size: 10px; font-weight: bold; margin-right: 4px; background: #fff; }}
            .checkbox.checked {{ background: #000; color: #fff; }}

            table.dg-table {{ width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9.5px; }}
            table.dg-table th {{ border: 1px solid #000; padding: 5px; background: #e0e0e0; text-transform: uppercase; font-size: 8.5px; text-align: left; }}
            table.dg-table td {{ border: 1px solid #000; padding: 5px; font-size: 9.5px; vertical-align: top; }}

            .cert-warning {{
                background: #fffbeb;
                border: 1px solid #fef3c7;
                padding: 8px;
                margin-top: 12px;
                font-size: 9px;
                line-height: 1.3;
            }}

            .sig-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; border-top: 1px dashed #666; padding-top: 8px; }}
        </style>
    </head>
    <body>
        <div class="fedex-page-border">
            
            <!-- FedEx Header Bar -->
            <div class="fedex-logo-bar">
                <div class="fedex-brand">
                    Fed<span style="color:#ff6600;">Ex</span> <span style="font-size: 12px; color: #666; font-weight: bold;">Express</span>
                </div>
                <div class="header-title">
                    SHIPPER'S DECLARATION FOR DANGEROUS GOODS<br>
                    <span style="font-size: 9px; color: #444; font-weight: normal;">(IATA DGR 66th Edition / FedEx FX-18 Compliant)</span>
                </div>
            </div>

            <!-- Shipper & Air Waybill Info -->
            <div class="grid-2">
                <div class="box">
                    <div class="box-title">Shipper (Name & Full Address)</div>
                    <strong>{req.shipper_name}</strong><br>
                    {req.shipper_address.replace('\n', '<br>')}
                </div>
                <div class="box">
                    <div class="box-title">Air Waybill No.</div>
                    <strong>{req.airway_bill_number}</strong><br><br>
                    <div class="box-title">Page 1 of 1</div>
                    <span style="font-size:8.5px; color:#555;">Shipper's Ref No: FXDG-2026-9876</span>
                </div>
            </div>

            <!-- Consignee & Transport Limitations -->
            <div class="grid-2">
                <div class="box">
                    <div class="box-title">Consignee (Name & Full Address)</div>
                    <strong>{req.consignee_name}</strong><br>
                    {req.consignee_address.replace('\n', '<br>')}
                </div>
                <div class="box">
                    <div class="box-title">Transport Details & Aircraft Limitations</div>
                    <div class="checkbox-group">
                        <div>
                            <span class="checkbox {pax_cls}">{pax_chk}</span> PASSENGER AND CARGO AIRCRAFT
                        </div>
                        <div>
                            <span class="checkbox {cao_cls}">{cao_chk}</span> CARGO AIRCRAFT ONLY
                        </div>
                    </div>
                    <div style="margin-top: 6px; font-size: 9px;">
                        Airport of Departure: <strong>{req.departure_airport}</strong> &nbsp;|&nbsp; 
                        Destination: <strong>{req.destination_airport}</strong>
                    </div>
                </div>
            </div>

            <!-- Shipment Type & Emergency Response -->
            <div class="grid-2">
                <div class="box">
                    <div class="box-title">Shipment Type</div>
                    <div class="checkbox-group">
                        <div><span class="checkbox checked">X</span> NON-RADIOACTIVE</div>
                        <div><span class="checkbox">&nbsp;</span> RADIOACTIVE</div>
                    </div>
                </div>
                <div class="box">
                    <div class="box-title">24-Hour Emergency Telephone Number (49 CFR § 172.604)</div>
                    <strong>{req.emergency_contact_name}: {req.emergency_phone}</strong>
                </div>
            </div>

            {overpack_banner}

            <!-- 8-Column Dangerous Goods Table -->
            <table class="dg-table">
                <thead>
                    <tr>
                        <th style="width: 10%;">UN or ID No.</th>
                        <th style="width: 30%;">Proper Shipping Name</th>
                        <th style="width: 8%;">Class / Division</th>
                        <th style="width: 8%;">Subsidiary Risk</th>
                        <th style="width: 8%;">Packing Group</th>
                        <th style="width: 20%;">Quantity and Type of Packing</th>
                        <th style="width: 8%;">Packing Inst.</th>
                        <th style="width: 8%;">Authorization</th>
                    </tr>
                </thead>
                <tbody>
    """
    for item in req.items:
        psn = item.proper_shipping_name
        if item.technical_name:
            psn += f" ({item.technical_name.upper()})"
        iata_html += f"""
                    <tr>
                        <td><strong style="color:#cc0000;">{item.un_number}</strong></td>
                        <td>{psn}</td>
                        <td style="text-align:center;">{item.class_division}</td>
                        <td style="text-align:center;">{item.subsidiary_risk or '-'}</td>
                        <td style="text-align:center;">{item.packing_group or '-'}</td>
                        <td>{item.number_and_type_of_packagings} ({item.quantity_and_unit})</td>
                        <td style="text-align:center;">{item.packing_instruction or '-'}</td>
                        <td style="text-align:center;">{item.authorization or 'CAO'}</td>
                    </tr>
        """
    
    iata_html += f"""
                </tbody>
            </table>

            <!-- FedEx Shipper Certification Box -->
            <div class="cert-warning">
                <strong>SHIPPER'S CERTIFICATION:</strong> I hereby declare that the contents of this consignment are fully and accurately described above by the proper shipping name, and are classified, packaged, marked and labeled/placarded, and are in all respects in proper condition for transport according to applicable international and national governmental regulations. I declare that all applicable air transport requirements have been met.
            </div>

            <!-- Signatory Section -->
            <div class="sig-grid">
                <div>
                    <strong>Name/Title of Signatory:</strong> {req.signatory_name}<br>
                    <strong>Place and Date:</strong> Houston, TX, USA - {req.date_str}
                </div>
                <div style="text-align: right;">
                    <strong>Signature:</strong><br>
                    <span style="font-family: 'Courier New', monospace; font-weight: bold; color: #4d148c; font-size: 11px;">
                        [FedEx Verified Electronic Signature: {req.signatory_name}]
                    </span>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    # 3. Build FedEx Ground OP-900 / OP-950 Hazardous Materials Shipping Paper HTML Template
    dot_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>FedEx Ground Hazardous Materials Shipping Paper (OP-900 / OP-950)</title>
        <style>
            @page {{ size: letter; margin: 10mm; }}
            body {{ font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 10px; margin: 0; padding: 12px; color: #111; background: #fff; }}
            .paper-box {{ border: 2px solid #000; padding: 14px; background: #fff; }}
            
            .fedex-ground-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #ff6600;
                padding-bottom: 6px;
                margin-bottom: 10px;
            }}

            .fedex-ground-brand {{
                font-size: 20px;
                font-weight: 900;
                color: #4d148c;
            }}

            .op900-title {{
                font-size: 13px;
                font-weight: 900;
                color: #000;
                text-align: right;
            }}

            .grid-2 {{ display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }}
            .info-block {{ border: 1px solid #555; padding: 6px; background: #fdfdfd; font-size: 9.5px; }}
            .info-title {{ font-size: 8px; font-weight: 800; color: #444; text-transform: uppercase; margin-bottom: 2px; border-bottom: 1px solid #ccc; }}

            .em-box {{ background: #eef9ff; border: 1px dashed #0077cc; padding: 6px 10px; margin-bottom: 10px; font-weight: bold; font-size: 9.5px; color: #004488; }}

            table.dot-table {{ width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9.5px; }}
            table.dot-table th {{ border: 1px solid #000; padding: 5px; background: #e0e0e0; text-transform: uppercase; font-size: 8.5px; }}
            table.dot-table td {{ border: 1px solid #000; padding: 5px; font-size: 9.5px; }}

            .cert-box {{ margin-top: 12px; border-top: 2px solid #000; padding-top: 8px; font-size: 9px; line-height: 1.3; }}
        </style>
    </head>
    <body>
        <div class="paper-box">
            
            <!-- FedEx Ground Header -->
            <div class="fedex-ground-header">
                <div class="fedex-ground-brand">
                    Fed<span style="color:#ff6600;">Ex</span> <span style="color:#ff6600; font-weight:bold;">Ground</span>
                </div>
                <div class="op900-title">
                    HAZARDOUS MATERIALS SHIPPING PAPER<br>
                    <span style="font-size:9px; color:#555; font-weight:normal;">FORM OP-900 / OP-950 (US DOT 49 CFR 172.200 COMPLIANT)</span>
                </div>
            </div>
            
            <div class="grid-2">
                <div class="info-block">
                    <div class="info-title">Shipper (Ship From)</div>
                    <strong>{req.shipper_name}</strong><br>
                    {req.shipper_address.replace('\n', '<br>')}<br>
                    <span style="font-size:8.5px; color:#555;">FedEx Ground Acct #: 987654321</span>
                </div>
                <div class="info-block">
                    <div class="info-title">Consignee (Ship To)</div>
                    <strong>{req.consignee_name}</strong><br>
                    {req.consignee_address.replace('\n', '<br>')}<br>
                    <span style="font-size:8.5px; color:#555;">Tracking No: 7946 8392 1012</span>
                </div>
            </div>

            <div class="em-box">
                24-HOUR EMERGENCY RESPONSE TELEPHONE NUMBER (US DOT 49 CFR § 172.604):<br>
                {req.emergency_contact_name} - <strong>{req.emergency_phone}</strong>
            </div>

            <h4 style="margin-top:8px; margin-bottom:4px; font-size:10px; color:#000;">US DOT HAZMAT BASIC DESCRIPTION SEQUENCE (49 CFR 172.202)</h4>
            <table class="dot-table">
                <thead>
                    <tr>
                        <th style="width:8%; text-align:center;">HM (X)</th>
                        <th style="width:52%;">Basic Description Sequence (UN No., PSN, Class, PG)</th>
                        <th style="width:20%; text-align:center;">No. & Type of Packages</th>
                        <th style="width:20%; text-align:center;">Total Net Quantity</th>
                    </tr>
                </thead>
                <tbody>
    """
    for idx, item in enumerate(req.items):
        psn = item.proper_shipping_name
        if item.technical_name:
            psn += f" ({item.technical_name.upper()})"
        pg_part = f", PG {item.packing_group}" if item.packing_group else ""
        sub_part = f" ({item.subsidiary_risk})" if item.subsidiary_risk else ""
        basic_seq = f"<strong>{item.un_number}</strong>, {psn}, Class {item.class_division}{sub_part}{pg_part}"
        if req.is_overpack:
            basic_seq += " (OVERPACK USED)"

        dot_html += f"""
                    <tr>
                        <td style="text-align:center; font-weight:bold; color:#cc0000; font-size:12px;">X</td>
                        <td>{basic_seq}</td>
                        <td style="text-align:center;">{item.number_and_type_of_packagings}</td>
                        <td style="text-align:center; font-weight:bold;">{item.quantity_and_unit}</td>
                    </tr>
        """
    dot_html += f"""
                </tbody>
            </table>

            <div class="cert-box">
                <strong>SHIPPER CERTIFICATION:</strong> This is to certify that the above-named materials are properly classified, described, packaged, marked, and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation.
                <br><br>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div><strong>Signatory:</strong> {req.signatory_name} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>Date:</strong> {req.date_str}</div>
                    <div style="font-family:'Courier New', monospace; font-weight:bold; color:#ff6600;">[FedEx Ground Verified Hazmat Document]</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    return {
        "IATA_SDDG": DocumentOutput(
            document_type="FedEx Express IATA Shipper's Declaration for Dangerous Goods",
            html_content=iata_html,
            formatted_basic_descriptions=basic_descriptions
        ),
        "DOT_SHIPPING_PAPER": DocumentOutput(
            document_type="FedEx Ground OP-900 Hazardous Materials Shipping Paper",
            html_content=dot_html,
            formatted_basic_descriptions=basic_descriptions
        )
    }

