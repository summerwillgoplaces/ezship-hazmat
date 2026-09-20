# EZShip Hazmat Lessons & Learning Log

### Pre-Flight Verification Notes
- **Component Coordination**: `ShippingGuideWizard` passes state down to `PackageMarkingDiagram` (Package Guide) and `DocumentGenerator`.
- **Packaging & Quantity Inputs**: Must support both direct selection (presets) and free-form custom typing for both single package shipments and consolidated overpacks.
- **Two-Way Synchronization**: Changes made in the Package Guide must propagate back to the Wizard state so that documents generated downstream reflect the user's edits.

### [2026-09-19] Enhancement - Shipping Wizard & Package Guide Quantity and Packaging Inputs
- **Context / Task**: Enable user input for quantity and packaging across Shipping Wizard & Package Guide.
- **Resolution**:
  1. `ShippingGuideWizard.jsx`: Added Packaging & Quantity Quick Setup in Step 1, enriched Step 2 with packaging presets + freeform text input + quick quantity chips, and updated Overpack Manifest table & Add form with editable packaging and quantity inputs.
  2. `PackageMarkingDiagram.jsx`: Added prominent top input bar for Packaging Being Used and Quantity Being Used, added Step 3 (Net Quantity) & Step 8 (UN Spec mark) contextual input fields in the Inspector Panel, and added inline edit buttons on the 2D cardboard package faces.
  3. Two-way synchronization wired between wizard, package guide, and document generator.
- **Validation**: Frontend compiled cleanly via `npm run build` in 1.63s; all 13 backend compliance unit tests passed via `pytest`.

### [2026-09-19] Lesson - Python 3.11 F-String Backslash Compatibility on Cloud Deployments
- **Context / Task**: Render.com Web Service build/startup failure (`SyntaxError: f-string expression part cannot include a backslash`).
- **Failure**: Python 3.11 (running on Render container) does not support backslashes inside f-string interpolation braces `{...}`, unlike Python 3.12+.
- **Root Cause**: `{req.shipper_address.replace('\n', '<br>')}` and `{req.consignee_address.replace('\n', '<br>')}` in `document_generator.py` contained `\n` inside `{...}`.
- **Preventive Rule**: Never use backslashes inside `{...}` within f-strings. Always pre-assign or sanitize variables prior to string interpolation to ensure compatibility across all Python versions >= 3.8.
