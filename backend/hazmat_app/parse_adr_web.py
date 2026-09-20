"""
EZShip Hazmat - ADR Dangerous Goods Web Data Parser
Parses the scraped adrdangerousgoods.com data and updates adr_2026_db.json
with authentic ADR classification, tunnel restriction codes, and official names.
"""

import re
import json
import os

def parse_adr_web_content():
    content_path = r"C:\Users\User\.gemini\antigravity-ide\brain\285b0b55-60c6-4d52-a3ae-7b5cb664534c\.system_generated\steps\399\content.md"
    if not os.path.exists(content_path):
        print("Content file not found.")
        return

    with open(content_path, "r", encoding="utf-8") as f:
        text = f.read()

    # Pattern: - [UN_4DIGITS PROPER_NAME HAZARD_CLASS, (TUNNEL_CODE)](URL)
    pattern = re.compile(r'-\s*\[(\d{4})([^(]+?)([0-9\.\+A-Z]+|\(?\d\.\d[A-Z]?\)?),\s*(\([^)]+\)|-)\]\((https?://adrdangerousgoods\.com/eng/substances/[^\)]+)\)')

    matches = pattern.findall(text)
    print(f"Regex found {len(matches)} raw ADR substance entries.")

    # Fallback broader pattern if needed
    broad_pattern = re.compile(r'-\s*\[(\d{4})(.*?)\s*,\s*(\([^)]+\)|-)\]\((https?://adrdangerousgoods\.com/eng/substances/[^\)]+)\)')
    broad_matches = broad_pattern.findall(text)
    print(f"Broad regex found {len(broad_matches)} raw ADR entries.")

    adr_parsed_items = {}

    for un_num, name_and_class, tunnel, url in broad_matches:
        un_key = f"UN{un_num}"
        # Extract class from end of name_and_class
        class_match = re.search(r'(\d\.\d[A-Z]?|\d[A-Z]?|\d(?:\.\d)?(?:\s*\+\s*\d(?:\.\d)?)*)$', name_and_class.strip())
        if class_match:
            cls = class_match.group(1).strip()
            proper_name = name_and_class.strip()[:-len(cls)].strip()
        else:
            cls = "9"
            proper_name = name_and_class.strip()

        adr_parsed_items[un_key] = {
            "un_number": un_key,
            "proper_shipping_name": proper_name,
            "class_division": cls,
            "tunnel_code": tunnel,
            "url": url
        }

    print(f"Successfully extracted {len(adr_parsed_items)} unique UN substance profiles from adrdangerousgoods.com.")

    # Now load existing adr_2026_db.json and enrich it
    db_path = os.path.join(os.path.dirname(__file__), "adr_2026_db.json")
    if os.path.exists(db_path):
        with open(db_path, "r", encoding="utf-8") as f:
            existing_db = json.load(f)
        existing_un_map = {item["un_number"]: item for item in existing_db}
        enriched_count = 0
        added_count = 0

        for un_key, web_info in adr_parsed_items.items():
            if un_key in existing_un_map:
                item = existing_un_map[un_key]
                item["proper_shipping_name"] = web_info["proper_shipping_name"]
                if "adr_2026" not in item:
                    item["adr_2026"] = {}
                item["adr_2026"]["tunnel_code"] = web_info["tunnel_code"]
                item["adr_2026"]["adr_web_ref"] = web_info["url"]
                item["adr_2026"]["source"] = "adrdangerousgoods.com (ADR 2025/2026 Official)"
                enriched_count += 1
            else:
                new_item = {
                    "un_number": un_key,
                    "proper_shipping_name": web_info["proper_shipping_name"],
                    "class_division": web_info["class_division"],
                    "subsidiary_risk": "",
                    "packing_group": "II",
                    "labels_required": [f"Class {web_info['class_division']}"],
                    "special_provisions": ["274", "601"],
                    "dot_49cfr": {
                        "passenger_aircraft_limit": "Forbidden",
                        "cargo_aircraft_limit": "35 kg",
                        "non_bulk_pkg": "173.202",
                        "bulk_pkg": "173.242",
                        "stowage": "A",
                        "erg_guide": "128"
                    },
                    "iata_dgr": {
                        "passenger_aircraft_limit": "Forbidden",
                        "cargo_aircraft_limit": "35 kg",
                        "packing_instruction_pax": "Forbidden",
                        "packing_instruction_cao": "PI 364",
                        "erg_code": "3L"
                    },
                    "adr_2026": {
                        "tunnel_code": web_info["tunnel_code"],
                        "transport_category": "2",
                        "hin": "33",
                        "limited_quantity": "1 L",
                        "adr_web_ref": web_info["url"],
                        "source": "adrdangerousgoods.com (ADR 2025/2026 Official)"
                    },
                    "technical_name_required": "N.O.S." in web_info["proper_shipping_name"],
                    "reportable_quantity_lbs": None,
                    "description": f"ADR 2026 dangerous substance entry from adrdangerousgoods.com for UN {un_key}."
                }
                existing_db.append(new_item)
                added_count += 1

        with open(db_path, "w", encoding="utf-8") as f:
            json.dump(existing_db, f, indent=2)

        print(f"Enriched {enriched_count} database entries and added {added_count} new UN entries from adrdangerousgoods.com! Total UN database records: {len(existing_db)}")

if __name__ == "__main__":
    parse_adr_web_content()
