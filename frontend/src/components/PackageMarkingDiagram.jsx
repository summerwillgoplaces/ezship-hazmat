import React, { useState, useEffect } from 'react';
import {
  Box,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ShieldCheck,
  PackageCheck,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Flame,
  Zap,
  Tag,
  Layers,
  PhoneCall,
  Scale,
  Edit3
} from 'lucide-react';
import { validateShippingQuantity } from '../utils/regulatoryValidator';

/**
 * PackageMarkingDiagram
 * 
 * Interactive 2D Package Marking & Label Placement Guide.
 * Fully compliant with US DOT 49 CFR 172, IATA DGR Section 7, and ADR 2026 Chapter 5.2.
 * Supports Single Packages, Overpacks, Subsidiary Risks, Lithium Batteries, and UN Spec Marks.
 */
export default function PackageMarkingDiagram({
  unNumber = 'UN1203',
  psn = 'GASOLINE',
  techName = '',
  hazardClass = '3',
  subRisk = '',
  packingGroup = 'PG II',
  netQty = '5.0 L',
  onNetQtyChange,
  pkgType = '4G Fibreboard Outer Box (UN Spec)',
  onPkgTypeChange,
  regMode = 'IATA',
  isOverpack = false,
  overpackItems = [],
  onUpdateOverpackItem,
  shipperName = 'ACME HAZMAT CORP',
  shipperAddress = '100 Industrial Pkwy, Houston TX 77001',
  consigneeName = 'GLOBAL CHEMICAL DISTRIBUTORS',
  consigneeAddress = '500 Logistics Way, Chicago IL 60601',
  emergencyPhone = '1-800-424-9300 (CHEMTREC)',
  trackingNumber = '7948 2940 1849'
}) {
  const [carrier, setCarrier] = useState('fedex_express');
  const [activeStep, setActiveStep] = useState(1);
  const [localNetQty, setLocalNetQty] = useState(netQty);
  const [localPkgType, setLocalPkgType] = useState(pkgType);
  const [isEditingQtyInline, setIsEditingQtyInline] = useState(false);
  const [isEditingPkgInline, setIsEditingPkgInline] = useState(false);
  const [checklist, setChecklist] = useState({
    carrierLabel: true,
    unPsn: true,
    netQty: true,
    hazardDiamond: true,
    arrows: true,
    unSpec: true
  });

  useEffect(() => {
    setLocalNetQty(netQty);
  }, [netQty]);

  useEffect(() => {
    setLocalPkgType(pkgType);
  }, [pkgType]);

  const handleNetQtyChange = (val) => {
    setLocalNetQty(val);
    if (onNetQtyChange) onNetQtyChange(val);
  };

  const handlePkgTypeChange = (val) => {
    setLocalPkgType(val);
    if (onPkgTypeChange) onPkgTypeChange(val);
  };

  // Detection helpers
  const cleanUn = String(unNumber).toUpperCase().replace(/\s+/g, '');
  const isBattery = ['UN3480', 'UN3481', 'UN3090', 'UN3091', 'UN3551', 'UN3552'].includes(cleanUn);
  const isLiquid = String(localNetQty).toLowerCase().includes('l') || String(localNetQty).toLowerCase().includes('ml') ||
                   String(psn).toLowerCase().includes('solution') || String(psn).toLowerCase().includes('liquid') ||
                   ['3', '8'].includes(String(hazardClass));

  // Compute display net quantity string
  const displayNetQty = isOverpack
    ? overpackItems.map(it => `${it.un_number}: ${it.quantity_and_unit}`).join(', ') || 'Various Net Quantities'
    : localNetQty || '1.0 L';

  // Compute calculated UN Spec code based on packaging type
  const getUnSpecCode = (pType) => {
    const p = (pType || '').toUpperCase();
    if (p.includes('4GV')) return 'UN 4GV / X 2.0 / S / 26 / USA / +AA9999';
    if (p.includes('4G')) return 'UN 4G / Y 1.5 / S / 26 / USA / +AA1234';
    if (p.includes('1A1')) return 'UN 1A1 / Y 1.8 / 300 / 26 / USA / +AA5678';
    if (p.includes('1A2')) return 'UN 1A2 / Y 1.6 / 250 / 26 / USA / +AA5679';
    if (p.includes('1H1')) return 'UN 1H1 / Y 1.9 / 250 / 26 / USA / +AA4321';
    if (p.includes('1H2')) return 'UN 1H2 / Y 1.5 / 200 / 26 / USA / +AA4322';
    if (p.includes('3H1')) return 'UN 3H1 / Y 1.4 / 150 / 26 / USA / +AA9012';
    if (p.includes('1G')) return 'UN 1G / Y 25 / S / 26 / USA / +AA7788';
    if (p.includes('4D')) return 'UN 4D / Y 30 / S / 26 / USA / +AA3344';
    if (p.includes('STRONG') || p.includes('EXCEPTED') || p.includes('NON-UN')) {
      return 'STRONG OUTER PACKAGING (1.2m Drop Tested)';
    }
    return 'UN 4G / Y 1.5 / S / 26 / USA / +AA1234';
  };

  const unSpecCode = getUnSpecCode(localPkgType);

  // Compute real-time regulatory compliance validation for the current net quantity
  const currentItem = {
    un_number: unNumber,
    proper_shipping_name: psn,
    class_division: hazardClass,
    subsidiary_risk: subRisk,
    packing_group: packingGroup
  };
  const qtyValidation = validateShippingQuantity(localNetQty, currentItem, regMode);

  // Helper for hazard class diamond styles and glyphs
  const getHazardDiamondStyle = (cls, isSub = false) => {
    const s = String(cls || '').trim();
    if (s.startsWith('3') || s === '2.1') {
      return { bg: '#dc2626', text: '#ffffff', symbol: '🔥', label: s === '2.1' ? 'FLAMMABLE GAS' : 'FLAMMABLE LIQUID', division: s };
    }
    if (s.startsWith('8')) {
      return { bg: '#0f172a', text: '#ffffff', symbol: '🧪', label: 'CORROSIVE', division: s, border: '2px solid #ffffff' };
    }
    if (s.startsWith('9')) {
      return { bg: '#ffffff', text: '#000000', symbol: isBattery ? '🔋' : '|||||||', label: isBattery ? 'LITHIUM BATTERY' : 'MISCELLANEOUS', division: '9', isStriped: true };
    }
    if (s.startsWith('6.1') || s === '2.3') {
      return { bg: '#ffffff', text: '#000000', symbol: '☠️', label: s === '2.3' ? 'TOXIC GAS' : 'TOXIC', division: s, border: '2px solid #000' };
    }
    if (s.startsWith('5.1')) {
      return { bg: '#eab308', text: '#000000', symbol: '⭕🔥', label: 'OXIDIZER', division: '5.1' };
    }
    if (s.startsWith('5.2')) {
      return { bg: 'linear-gradient(to bottom, #dc2626 50%, #eab308 50%)', text: '#ffffff', symbol: '🔥', label: 'ORGANIC PEROXIDE', division: '5.2' };
    }
    if (s === '2.2') {
      return { bg: '#16a34a', text: '#ffffff', symbol: '💨', label: 'NON-FLAMMABLE GAS', division: '2.2' };
    }
    if (s.startsWith('4.3')) {
      return { bg: '#2563eb', text: '#ffffff', symbol: '🌊🔥', label: 'DANGEROUS WHEN WET', division: '4.3' };
    }
    return { bg: '#ea580c', text: '#ffffff', symbol: '⚠️', label: `CLASS ${s}`, division: s };
  };

  // Comprehensive Step Placement Guidance Dictionary
  const stepInfo = {
    1: {
      stepNum: 1,
      title: 'Carrier Shipping Label (4" x 6")',
      location: 'Upper Left Face of Outer Packaging',
      rule: 'Affix flat on the largest package surface. Do NOT fold over edges, seams, strapping, or tape lines.',
      dimensions: '4.0 in × 6.0 in (101.6 mm × 152.4 mm)',
      citation: 'FedEx / UPS / DHL Dangerous Goods Tariff & 49 CFR 172.406',
      badgeColor: '#00f0ff'
    },
    2: {
      stepNum: 2,
      title: 'UN Number & Proper Shipping Name Marking',
      location: 'Upper Right Face (Within 6" of Hazard Class Diamond)',
      rule: `Must be clearly printed with font height at least 6mm (or 12mm if capacity > 30L/kg). Must display '${unNumber} ${psn}' ${techName ? `(${techName})` : ''}.`,
      dimensions: 'Minimum 6 mm letter height (12 mm for packages > 30 L / 30 kg)',
      citation: 'US DOT 49 CFR 172.301 / IATA DGR 7.1.4.4 / ADR 5.2.1.1',
      badgeColor: '#ff9900'
    },
    3: {
      stepNum: 3,
      title: 'Package Net Quantity Marking & Limit Verification',
      location: 'Directly Below UN Number & Proper Shipping Name',
      rule: `${qtyValidation.message} Net quantity must be legibly marked on the outer packaging for carrier compliance, airline acceptance, and customs clearance.`,
      dimensions: 'Standard legible character height (min 6 mm recommended)',
      citation: qtyValidation.regulatoryCitation,
      badgeColor: qtyValidation.badgeColor
    },
    4: {
      stepNum: 4,
      title: 'Primary Hazard Class Diamond Label',
      location: 'Bottom Right Face (Square-on-Point 45° Orientation)',
      rule: `Must be affixed on the same surface near the Proper Shipping Name. Label must be weather-resistant (withstand 3 months outdoor exposure without substantial color fading).`,
      dimensions: 'Minimum 100 mm × 100 mm (4 in × 4 in) on point',
      citation: 'US DOT 49 CFR 172.407 / IATA DGR 7.2.2.3 / ADR 5.2.2.2.1',
      badgeColor: '#a855f7'
    },
    5: {
      stepNum: 5,
      title: subRisk ? 'Subsidiary Risk Hazard Class Diamond' : 'Secondary Hazard Verification',
      location: 'Adjacent to Primary Hazard Class Diamond (< 150mm distance)',
      rule: subRisk
        ? `Mandatory secondary hazard class label (Class ${subRisk}) must be placed on point directly adjacent to the primary Class ${hazardClass} diamond label.`
        : `No subsidiary hazard assigned for this item. If secondary risk applies, the subsidiary label must be set on point next to the primary label.`,
      dimensions: 'Minimum 100 mm × 100 mm (4 in × 4 in) on point',
      citation: 'US DOT 49 CFR 172.402 / IATA DGR 7.2.6.2 / ADR 5.2.2.1.1',
      badgeColor: '#ec4899'
    },
    6: {
      stepNum: 6,
      title: '"THIS SIDE UP" Package Orientation Arrows',
      location: 'Two Opposite Vertical Side Faces',
      rule: isLiquid
        ? 'Mandatory red or black arrows on white background on 2 opposite vertical sides of combination packagings containing liquid dangerous goods.'
        : 'Recommended for liquids; optional for non-liquid packaging unless inner containers must maintain specific orientation.',
      dimensions: 'Standard ISO 780 orientation symbol (min 74 mm × 105 mm recommended)',
      citation: 'US DOT 49 CFR 172.312 / IATA DGR 7.2.4.4 / ADR 5.2.1.10',
      badgeColor: '#ef4444'
    },
    7: {
      stepNum: 7,
      title: 'Cargo Aircraft Only (CAO) Handling Label',
      location: 'Directly Adjacent to Hazard Class Diamond on Same Face',
      rule: regMode === 'IATA'
        ? 'Mandatory rectangular orange label for any shipment prohibited on passenger aircraft. Must be on same face as hazard labels.'
        : 'Required under 49 CFR 172.402(c) for ground-to-air intermodal shipments forbidden on passenger aircraft.',
      dimensions: 'Minimum 110 mm width × 120 mm height (4.3 in × 4.7 in)',
      citation: 'IATA DGR 7.2.4.2 & Figure 7.4.B / US DOT 49 CFR 172.448',
      badgeColor: '#ea580c'
    },
    8: {
      stepNum: 8,
      title: 'UN Specification Packaging Certification Mark',
      location: 'Lower Left Face or Bottom Exterior Surface of Box',
      rule: `Official embossed or printed UN symbol with packaging code (${unSpecCode}). Confirms packaging successfully passed 1.2m drop test, stacking test, and internal pressure tests.`,
      dimensions: 'UN symbol height min 12 mm for packaging > 30 kg/L',
      citation: 'US DOT 49 CFR 178.503 / IATA DGR 6.0.4 / ADR 6.1.3',
      badgeColor: '#38bdf8'
    },
    9: {
      stepNum: 9,
      title: isBattery ? 'Lithium Battery Mark (UN 3480 / UN 3481)' : 'Lithium Battery Mark Verification',
      location: 'Main Exterior Face (Adjacent to Consignee / Carrier Label)',
      rule: isBattery
        ? `Mandatory rectangular label with red hatched border (min 5mm border width). Must display ${cleanUn} and active 24-hour emergency phone number.`
        : 'Only required when shipping standalone or contained Lithium Ion / Metal batteries (UN 3480, UN 3481, UN 3090, UN 3091).',
      dimensions: 'Minimum 100 mm wide × 100 mm high (or 100 mm × 70 mm if box is small)',
      citation: 'IATA DGR 7.1.5.5 / 49 CFR 173.185(c)(3) / ADR Special Provision 188',
      badgeColor: '#f43f5e'
    },
    10: {
      stepNum: 10,
      title: 'Consolidated OVERPACK Marking',
      location: 'Top / Front Surface of Outer Enclosure',
      rule: isOverpack
        ? `The word "OVERPACK" must be prominently marked in capital letters with lettering at least 12 mm (0.5 in) high. All enclosed package hazard labels and markings must be reproduced on the overpack unless clearly visible.`
        : 'Applicable when 2 or more packages are placed into a single consolidated outer box, crate, or shrink-wrapped pallet.',
      dimensions: 'Minimum 12 mm (0.5 in) lettering height',
      citation: 'IATA DGR 7.1.7.1 / US DOT 49 CFR 173.25 / ADR 5.1.2',
      badgeColor: '#ff9900'
    }
  };

  const currentStep = stepInfo[activeStep] || stepInfo[1];

  const toggleCheck = (k) => {
    setChecklist(prev => ({ ...prev, [k]: !prev[k] }));
  };

  return (
    <div className="glass-card" style={{ padding: '24px', background: '#0b1120', border: '1px solid rgba(255, 153, 0, 0.4)', borderRadius: '16px' }}>
      
      {/* Header Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px',
        marginBottom: '20px',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '16px 20px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className={`badge ${isOverpack ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: '11px', fontWeight: '800' }}>
              {isOverpack ? '📦 CONSOLIDATED OVERPACK SHIPMENT' : '📦 SINGLE UN SPEC PACKAGE'}
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '11px' }}>
              {regMode === 'IATA' ? '✈️ IATA DGR (Air)' : regMode === 'ADR' ? '🇪🇺 ADR 2026 (Road)' : '🚛 US DOT 49 CFR'}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PackageCheck color={isOverpack ? '#ff9900' : '#10b981'} size={24} />
            {isOverpack
              ? `Overpack: ${overpackItems.map(it => it.un_number).join(', ') || unNumber}`
              : `${unNumber} ${psn}`}
          </h2>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
            Class {hazardClass} {subRisk ? `(Sub-risk ${subRisk})` : ''} | Packing Group: <strong style={{ color: '#fff' }}>{packingGroup || 'None'}</strong> | Net Qty: <strong style={{ color: '#00f0ff' }}>{displayNetQty}</strong>
          </div>
        </div>

        {/* Carrier Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>Carrier:</span>
          {[
            { id: 'fedex_express', label: 'FedEx Express', color: '#4d148c' },
            { id: 'fedex_ground', label: 'FedEx Ground', color: '#008a00' },
            { id: 'ups_ground', label: 'UPS', color: '#351c75' },
            { id: 'dhl_express', label: 'DHL', color: '#d40511' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCarrier(c.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '800',
                cursor: 'pointer',
                border: carrier === c.id ? `2px solid ${c.color}` : '1px solid rgba(255,255,255,0.1)',
                background: carrier === c.id ? c.color : 'rgba(255,255,255,0.05)',
                color: '#ffffff',
                boxShadow: carrier === c.id ? `0 0 12px ${c.color}80` : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* DIRECT PACKAGING & QUANTITY INPUT PANEL FOR PACKAGE GUIDE */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        border: '2px solid #ff9900',
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 4px 20px rgba(255, 153, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Box color="#ff9900" size={22} />
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.3px' }}>
              Package Guide: Packaging Being Used & Quantity Input
            </h3>
          </div>
          <span className="badge badge-amber" style={{ fontSize: '11px' }}>
            ⚡ Live Interactive Specification Sync
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isOverpack ? '1fr' : '1fr 1fr', gap: '16px', alignItems: 'start' }}>
          
          {/* Packaging Being Used Input */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Box size={14} /> Packaging Being Used
            </label>
            <input
              type="text"
              className="input-field"
              value={localPkgType}
              onChange={(e) => handlePkgTypeChange(e.target.value)}
              placeholder="e.g. 4G Fibreboard Box (UN Spec) or 1A1 Steel Drum"
              style={{ marginBottom: '8px', fontSize: '13px' }}
            />
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { label: '4G Box', val: '4G Fibreboard Outer Box (UN Spec)' },
                { label: '1A1 Steel Drum', val: '1A1 Steel Non-Removable Head Drum' },
                { label: '1A2 Removable Drum', val: '1A2 Steel Removable Head Drum' },
                { label: '3H1 Jerrican', val: '3H1 Plastic Jerrican' },
                { label: '1H1 Plastic Drum', val: '1H1 Plastic Non-Removable Head Drum' },
                { label: '4GV High-Hazard Box', val: '4GV Special Combination Packaging' },
                { label: 'Strong Outer Box', val: 'Strong Outer Box (Section II Excepted)' }
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePkgTypeChange(p.val)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: '700',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    background: localPkgType === p.val ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.06)',
                    color: localPkgType === p.val ? '#00f0ff' : '#cbd5e1',
                    border: localPkgType === p.val ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
              Certified UN Spec Mark: <code style={{ color: '#38bdf8', fontWeight: '700' }}>{unSpecCode}</code>
            </div>
          </div>

          {/* Quantity Being Used Input (for Single Package or Overpack Summary) */}
          {!isOverpack ? (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: `1px solid ${qtyValidation.badgeColor}66` }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: '700', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Scale size={14} /> Net Quantity Being Used
                </label>
                <span style={{
                  fontSize: '10px',
                  fontWeight: '800',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(0,0,0,0.5)',
                  color: qtyValidation.badgeColor,
                  border: `1px solid ${qtyValidation.badgeColor}`
                }}>
                  {qtyValidation.status === 'COMPLIANT' ? '✓ VALID' : qtyValidation.status === 'CAO_REQUIRED' ? '✈️ CAO ONLY' : '⛔ EXCEEDED'}
                </span>
              </div>
              <input
                type="text"
                className="input-field"
                value={localNetQty}
                onChange={(e) => handleNetQtyChange(e.target.value)}
                placeholder="e.g. 5.0 L or 10 kg"
                style={{
                  marginBottom: '8px',
                  fontSize: '13px',
                  fontWeight: '700',
                  borderColor: qtyValidation.badgeColor
                }}
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['0.5 L', '1.0 L', '2.5 L', '5.0 L', '10.0 L', '25.0 L', '1.0 kg', '5.0 kg', '15.0 kg'].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleNetQtyChange(q)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: localNetQty === q ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)',
                      color: localNetQty === q ? '#10b981' : '#cbd5e1',
                      border: localNetQty === q ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Real-time Regulatory Validation Box */}
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: qtyValidation.status === 'COMPLIANT'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : qtyValidation.status === 'CAO_REQUIRED'
                  ? 'rgba(234, 88, 12, 0.15)'
                  : 'rgba(239, 68, 68, 0.18)',
                border: `1px solid ${qtyValidation.badgeColor}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '800', color: qtyValidation.badgeColor }}>
                    {qtyValidation.status === 'COMPLIANT'
                      ? '✅ REGULATORY QUANTITY VALID'
                      : qtyValidation.status === 'CAO_REQUIRED'
                      ? '✈️ CARGO AIRCRAFT ONLY (CAO) MANDATORY'
                      : qtyValidation.status === 'FORBIDDEN'
                      ? '⛔ FORBIDDEN AIR TRANSPORT'
                      : '⛔ LEGAL PACKAGE LIMIT EXCEEDED'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: '4px' }}>
                    {qtyValidation.regulatoryCitation}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '4px', lineHeight: '1.3' }}>
                  {qtyValidation.message}
                </div>
                {qtyValidation.requiresAbsorbent && (
                  <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '6px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>💧</span> Liquid Dangerous Good: Absorbent material and secondary leakproof liner required (49 CFR 173.24a / IATA 5.0.2.12.1).
                  </div>
                )}
              </div>

              <div style={{ marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                Active Box Face Marking: <strong style={{ color: '#10b981' }}>{displayNetQty}</strong> (Updates Step 3)
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#ff9900', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Layers size={14} /> Overpack Inner Package Quantities & Packagings
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '8px' }}>
                {overpackItems.map(it => {
                  const itQv = validateShippingQuantity(it.quantity_and_unit, it, regMode);
                  return (
                    <div key={it.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', border: `1px solid ${itQv.badgeColor}55` }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontWeight: '800', color: '#ff9900' }}>{it.un_number} - {it.proper_shipping_name}</div>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: itQv.badgeColor, background: 'rgba(0,0,0,0.5)', padding: '1px 5px', borderRadius: '3px' }}>
                          {itQv.status === 'COMPLIANT' ? '✓ OK' : itQv.status === 'CAO_REQUIRED' ? '✈️ CAO' : '⛔ LIMIT'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="text"
                          className="input-field"
                          value={it.quantity_and_unit}
                          onChange={(e) => onUpdateOverpackItem?.(it.id, 'quantity_and_unit', e.target.value)}
                          placeholder="Qty"
                          style={{ padding: '4px 8px', fontSize: '11px', width: '90px', borderColor: itQv.badgeColor }}
                        />
                        <input
                          type="text"
                          className="input-field"
                          value={it.number_and_type_of_packagings}
                          onChange={(e) => onUpdateOverpackItem?.(it.id, 'number_and_type_of_packagings', e.target.value)}
                          placeholder="Packaging"
                          style={{ padding: '4px 8px', fontSize: '11px', flex: 1 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* INTERACTIVE STEP INSPECTOR PANEL (Connected to Step Click Events) */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: `2px solid ${currentStep.badgeColor || '#00f0ff'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: `0 0 20px ${currentStep.badgeColor || '#00f0ff'}33`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: currentStep.badgeColor, color: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '18px', boxShadow: `0 0 12px ${currentStep.badgeColor}`
            }}>
              {currentStep.stepNum}
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '800', color: currentStep.badgeColor, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                📍 {currentStep.location}
              </span>
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
                {currentStep.title}
              </h3>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setActiveStep(prev => prev > 1 ? prev - 1 : 10)}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '700' }}>
              {currentStep.stepNum} / 10
            </span>
            <button
              onClick={() => setActiveStep(prev => prev < 10 ? prev + 1 : 1)}
              style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '700' }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', fontSize: '12px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Regulatory Rule:</div>
            <p style={{ color: '#e2e8f0', marginTop: '4px', lineHeight: '1.4' }}>{currentStep.rule}</p>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Required Dimensions:</div>
            <div style={{ color: '#00f0ff', fontWeight: '800', marginTop: '4px' }}>{currentStep.dimensions}</div>
          </div>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700' }}>Authority Citation:</div>
            <div style={{ color: '#ff9900', fontWeight: '700', marginTop: '4px' }}>{currentStep.citation}</div>
          </div>
        </div>

        {/* Step 3 Contextual Net Quantity Input in Inspector */}
        {activeStep === 3 && !isOverpack && (
          <div style={{
            marginTop: '14px',
            paddingTop: '12px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background: qtyValidation.status === 'COMPLIANT'
              ? 'rgba(16, 185, 129, 0.08)'
              : qtyValidation.status === 'CAO_REQUIRED'
              ? 'rgba(234, 88, 12, 0.12)'
              : 'rgba(239, 68, 68, 0.15)',
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${qtyValidation.badgeColor}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={18} color={qtyValidation.badgeColor} />
                <div>
                  <span style={{ fontSize: '12px', fontWeight: '800', color: qtyValidation.badgeColor }}>
                    Input Net Quantity for Package Face:
                  </span>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Type quantity or click a quick preset to update box marking & validate live
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  className="input-field"
                  value={localNetQty}
                  onChange={(e) => handleNetQtyChange(e.target.value)}
                  placeholder="e.g. 5.0 L"
                  style={{
                    width: '130px',
                    padding: '6px 10px',
                    fontSize: '13px',
                    fontWeight: '700',
                    color: qtyValidation.badgeColor,
                    borderColor: qtyValidation.badgeColor
                  }}
                />
                {['1.0 L', '5.0 L', '20.0 L', '5.0 kg'].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleNetQtyChange(q)}
                    style={{
                      padding: '5px 8px',
                      fontSize: '11px',
                      fontWeight: '700',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: localNetQty === q ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)',
                      color: localNetQty === q ? '#10b981' : '#fff',
                      border: localNetQty === q ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            {/* Live Regulatory Evaluation verification line */}
            <div style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px dashed rgba(255,255,255,0.15)',
              fontSize: '12px',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ color: qtyValidation.badgeColor }}>
                  {qtyValidation.status === 'COMPLIANT' ? '✅ COMPLIANT' : qtyValidation.status === 'CAO_REQUIRED' ? '✈️ CAO REQUIRED' : '⛔ NON-COMPLIANT'}:
                </strong>
                <span>{qtyValidation.message}</span>
              </div>
              <span style={{
                color: '#ff9900',
                fontWeight: '700',
                fontSize: '11px',
                background: 'rgba(0,0,0,0.4)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(255,153,0,0.3)'
              }}>
                {qtyValidation.regulatoryCitation}
              </span>
            </div>
          </div>
        )}

        {/* Step 8 Contextual Packaging Type Input in Inspector */}
        {activeStep === 8 && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0, 240, 255, 0.08)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={18} color="#00f0ff" />
              <div>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#00f0ff' }}>Input Packaging Type Being Used:</span>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>Type packaging description or select a UN spec type below</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="input-field"
                value={localPkgType}
                onChange={(e) => handlePkgTypeChange(e.target.value)}
                placeholder="e.g. 4G Fibreboard Box"
                style={{ width: '220px', padding: '6px 10px', fontSize: '13px', fontWeight: '700', color: '#00f0ff' }}
              />
              {[
                { l: '4G Box', v: '4G Fibreboard Outer Box (UN Spec)' },
                { l: '1A1 Drum', v: '1A1 Steel Non-Removable Head Drum' },
                { l: '3H1 Jerrican', v: '3H1 Plastic Jerrican' },
                { l: '4GV Box', v: '4GV Special Combination Packaging' }
              ].map(p => (
                <button
                  key={p.l}
                  type="button"
                  onClick={() => handlePkgTypeChange(p.v)}
                  style={{ padding: '5px 8px', fontSize: '11px', fontWeight: '700', borderRadius: '4px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MAIN 2D CARDBOARD PACKAGE MARKING CONTAINER */}
      <div style={{
        background: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
        borderRadius: '16px',
        border: '3px solid #f59e0b',
        padding: '28px',
        boxShadow: '0 16px 40px rgba(0,0,0,0.7)',
        position: 'relative',
        marginBottom: '24px'
      }}>
        {/* Box Surface Identification Label */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '16px',
          background: 'rgba(0,0,0,0.6)',
          color: '#f59e0b',
          border: '1px solid #f59e0b',
          padding: '2px 10px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          📦 OUTER PACKAGE - MAIN FRONT FACE
        </div>

        {/* OVERPACK Banner if Overpack (Step 10) */}
        {isOverpack && (
          <div
            onClick={() => setActiveStep(10)}
            style={{
              background: '#0f172a',
              color: '#ff9900',
              border: activeStep === 10 ? '4px solid #00f0ff' : '3px solid #ff9900',
              borderRadius: '8px',
              padding: '12px',
              textAlign: 'center',
              fontWeight: '900',
              fontSize: '24px',
              letterSpacing: '6px',
              marginTop: '24px',
              marginBottom: '20px',
              boxShadow: activeStep === 10 ? '0 0 24px #00f0ff' : '0 0 16px rgba(255,153,0,0.5)',
              position: 'relative',
              cursor: 'pointer'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', right: '-10px',
              background: activeStep === 10 ? '#00f0ff' : '#ff9900',
              color: '#000', width: '26px', height: '26px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
            }}>
              10
            </div>
            OVERPACK
            <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#cbd5e1', marginTop: '2px', fontWeight: '700' }}>
              LETTERING MINIMUM 12 MM (0.5 IN) HEIGHT | IATA DGR 7.1.7 / 49 CFR 173.25
            </div>
          </div>
        )}

        {/* Top Face Row: 1. Carrier Shipping Label & 2/3. UN Number & Net Qty Marking */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: isOverpack ? '0' : '28px', marginBottom: '20px' }}>
          
          {/* 1. CARRIER 4x6 SHIPPING LABEL MOCKUP */}
          <div
            onClick={() => setActiveStep(1)}
            style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '14px',
              border: activeStep === 1 ? '4px solid #00f0ff' : '2px solid #000',
              boxShadow: activeStep === 1 ? '0 0 24px #00f0ff' : '0 4px 12px rgba(0,0,0,0.5)',
              color: '#000000',
              fontFamily: 'monospace',
              fontSize: '10px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', right: '-10px',
              background: activeStep === 1 ? '#00f0ff' : '#000',
              color: activeStep === 1 ? '#000' : '#fff', width: '26px', height: '26px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}>
              1
            </div>

            <div style={{ fontSize: '8px', fontWeight: '900', color: '#0077ff', background: '#e0f2fe', padding: '2px 6px', borderRadius: '3px', marginBottom: '6px', display: 'inline-block' }}>
              📍 FRONT FACE - TOP LEFT
            </div>

            {/* Carrier Specific Brand Header */}
            {carrier === 'fedex_express' && (
              <div style={{ borderBottom: '2px solid #4d148c', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', fontSize: '15px', color: '#4d148c' }}>FedEx <span style={{ color: '#ff6600' }}>Express</span></span>
                <span style={{ fontSize: '9px', background: '#ff6600', color: '#fff', padding: '2px 6px', fontWeight: '800', borderRadius: '2px' }}>PRIORITY OVERNIGHT</span>
              </div>
            )}

            {carrier === 'fedex_ground' && (
              <div style={{ borderBottom: '2px solid #008a00', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', fontSize: '15px', color: '#4d148c' }}>FedEx <span style={{ color: '#008a00' }}>Ground</span></span>
                <span style={{ fontSize: '9px', background: '#008a00', color: '#fff', padding: '2px 6px', fontWeight: '800', borderRadius: '2px' }}>HAZMAT OP-900</span>
              </div>
            )}

            {carrier === 'ups_ground' && (
              <div style={{ borderBottom: '2px solid #351c75', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', fontSize: '15px', color: '#351c75' }}>UPS NEXT DAY AIR</span>
                <span style={{ fontSize: '9px', background: '#ffb703', color: '#000', padding: '2px 6px', fontWeight: '800', borderRadius: '2px' }}>HAZMAT</span>
              </div>
            )}

            {carrier === 'dhl_express' && (
              <div style={{ borderBottom: '2px solid #d40511', paddingBottom: '4px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '900', fontSize: '15px', color: '#d40511' }}>DHL EXPRESS</span>
                <span style={{ fontSize: '9px', background: '#d40511', color: '#fff', padding: '2px 6px', fontWeight: '800', borderRadius: '2px' }}>DANGEROUS GOODS</span>
              </div>
            )}

            {/* Address Details */}
            <div style={{ fontSize: '9px', lineHeight: '1.3', marginBottom: '6px' }}>
              <strong>FROM:</strong> {shipperName}<br />
              {shipperAddress}<br />
              <div style={{ borderTop: '1px dashed #ccc', marginTop: '4px', paddingTop: '4px' }}>
                <strong>TO:</strong> {consigneeName}<br />
                {consigneeAddress}
              </div>
            </div>

            {/* Barcode Mock */}
            <div style={{ background: '#000', height: '28px', margin: '6px 0', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ color: '#fff', fontSize: '8px', letterSpacing: '4px' }}>||| | |||| | ||| |||| ||</div>
            </div>
            <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: '800' }}>
              TRK# {trackingNumber}
            </div>

            <div style={{ marginTop: '4px', background: '#fee2e2', border: '1px solid #ef4444', color: '#991b1b', padding: '3px', textAlign: 'center', fontWeight: '900', fontSize: '8px' }}>
              ⚠️ DANGEROUS GOODS - DECLARATION ATTACHED
            </div>
          </div>

          {/* 2 & 3. UN NUMBER, PROPER SHIPPING NAME & USER NET QTY MARKING */}
          <div
            onClick={() => setActiveStep(activeStep === 3 ? 3 : 2)}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              borderRadius: '8px',
              padding: '16px',
              border: (activeStep === 2 || activeStep === 3) ? '4px solid #00f0ff' : '2px solid #ff9900',
              boxShadow: (activeStep === 2 || activeStep === 3) ? '0 0 24px #00f0ff' : 'none',
              fontFamily: 'monospace',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', right: '-10px',
              background: (activeStep === 2 || activeStep === 3) ? '#00f0ff' : '#ff9900',
              color: '#000', width: '26px', height: '26px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}>
              2
            </div>

            <div>
              <div style={{ fontSize: '8px', fontWeight: '900', color: '#ff9900', background: 'rgba(255,153,0,0.2)', padding: '2px 6px', borderRadius: '3px', marginBottom: '8px', display: 'inline-block' }}>
                📍 FRONT FACE - TOP RIGHT (ADJACENT TO HAZARD LABEL)
              </div>

              <div style={{ fontSize: '18px', fontWeight: '900', color: '#ff9900', letterSpacing: '1px' }}>
                {isOverpack && overpackItems.length > 0
                  ? overpackItems.map(it => it.un_number).join(', ')
                  : unNumber}
              </div>
              <div style={{ fontSize: '13px', fontWeight: '800', textTransform: 'uppercase', color: '#ffffff', marginTop: '2px' }}>
                {isOverpack && overpackItems.length > 0
                  ? overpackItems.map(it => it.proper_shipping_name).join(' / ')
                  : psn}
              </div>
              {techName && !isOverpack && (
                <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>({techName})</div>
              )}
            </div>

            {/* 3. EXACT USER INPUT NET QUANTITY MARKING */}
            <div
              onClick={(e) => { e.stopPropagation(); setActiveStep(3); }}
              style={{
                marginTop: '12px',
                borderTop: `2px dashed ${qtyValidation.badgeColor}`,
                paddingTop: '8px',
                background: activeStep === 3 ? `${qtyValidation.badgeColor}26` : 'transparent',
                borderRadius: '6px',
                padding: '8px',
                color: qtyValidation.badgeColor,
                fontWeight: '900',
                fontSize: '13px',
                position: 'relative'
              }}
            >
              <div style={{
                position: 'absolute', top: '-8px', right: '-8px',
                background: activeStep === 3 ? '#00f0ff' : qtyValidation.badgeColor,
                color: '#000', width: '20px', height: '20px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '11px'
              }}>
                3
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#fff' }}>NET QTY: </span>
                  <span style={{ color: '#00f0ff', fontSize: '15px' }}>{displayNetQty}</span>
                  {!isOverpack && (
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '800',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      background: 'rgba(0,0,0,0.6)',
                      color: qtyValidation.badgeColor,
                      border: `1px solid ${qtyValidation.badgeColor}`
                    }}>
                      {qtyValidation.status === 'COMPLIANT' ? '✓ OK' : qtyValidation.status === 'CAO_REQUIRED' ? '✈️ CAO' : '⛔ EXCEEDED'}
                    </span>
                  )}
                </div>
                {!isOverpack && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingQtyInline(!isEditingQtyInline);
                      setActiveStep(3);
                    }}
                    style={{
                      background: `${qtyValidation.badgeColor}33`,
                      border: `1px solid ${qtyValidation.badgeColor}`,
                      color: qtyValidation.badgeColor,
                      borderRadius: '4px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}
                  >
                    <Edit3 size={11} /> {isEditingQtyInline ? 'Done' : 'Input Qty'}
                  </button>
                )}
              </div>

              {isEditingQtyInline && !isOverpack && (
                <div style={{ marginTop: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    className="input-field"
                    value={localNetQty}
                    onChange={(e) => handleNetQtyChange(e.target.value)}
                    placeholder="e.g. 5.0 L"
                    style={{
                      padding: '4px 8px',
                      fontSize: '12px',
                      width: '100%',
                      background: 'rgba(0,0,0,0.85)',
                      borderColor: qtyValidation.badgeColor,
                      color: qtyValidation.badgeColor,
                      fontWeight: '700'
                    }}
                    autoFocus
                  />
                  <div style={{ fontSize: '10px', color: qtyValidation.badgeColor, marginTop: '4px', fontWeight: '600' }}>
                    {qtyValidation.message}
                  </div>
                </div>
              )}

              <div style={{ fontSize: '9px', color: '#94a3b8', marginTop: '4px' }}>
                24-HR EMERGENCY PHONE: 1-800-424-9300 (CHEMTREC)
              </div>
            </div>
          </div>
        </div>

        {/* 8. UN SPECIFICATION PACKAGING MARK (STEP 8) */}
        <div
          onClick={() => setActiveStep(8)}
          style={{
            background: 'rgba(0,0,0,0.6)',
            border: activeStep === 8 ? '3px solid #00f0ff' : '1px dashed #38bdf8',
            boxShadow: activeStep === 8 ? '0 0 20px #00f0ff' : 'none',
            borderRadius: '8px',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div style={{
            position: 'absolute', top: '-10px', right: '-10px',
            background: activeStep === 8 ? '#00f0ff' : '#38bdf8',
            color: '#000', width: '24px', height: '24px',
            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '900', fontSize: '12px'
          }}>
            8
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #38bdf8',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '10px', lineHeight: '1', color: '#38bdf8'
            }}>
              <span>u</span><span>n</span>
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>
                📍 LOWER FACE - UN SPECIFICATION PACKAGING CERTIFICATION MARK
              </div>
              <div style={{ fontSize: '14px', fontWeight: '900', color: '#38bdf8', fontFamily: 'monospace' }}>
                {unSpecCode}
              </div>
              <div style={{ fontSize: '11px', color: '#00f0ff', marginTop: '2px' }}>
                Packaging: <strong style={{ color: '#fff' }}>{localPkgType}</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#cbd5e1' }}>
              Drop Test: <strong style={{ color: '#fff' }}>{packingGroup || 'Y (PG II)'}</strong>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingPkgInline(!isEditingPkgInline);
                setActiveStep(8);
              }}
              style={{
                background: 'rgba(0,240,255,0.2)', border: '1px solid #00f0ff', color: '#00f0ff',
                borderRadius: '4px', padding: '3px 8px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
              }}
            >
              <Edit3 size={11} /> {isEditingPkgInline ? 'Done' : 'Change Packaging'}
            </button>
          </div>

          {isEditingPkgInline && (
            <div style={{ width: '100%', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }} onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                className="input-field"
                value={localPkgType}
                onChange={(e) => handlePkgTypeChange(e.target.value)}
                placeholder="Enter packaging description or select below..."
                style={{ padding: '6px 10px', fontSize: '12px', width: '100%', marginBottom: '6px' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['4G Fibreboard Box (UN Spec)', '1A1 Steel Drum', '1A2 Removable Drum', '3H1 Plastic Jerrican', '4GV High-Hazard Box'].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePkgTypeChange(p)}
                    style={{ padding: '3px 6px', fontSize: '10px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                  >
                    {p.split(' ')[0]} {p.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 9. LITHIUM BATTERY HANDLING MARK (FOR BATTERY SHIPMENTS - STEP 9) */}
        {isBattery && (
          <div
            onClick={() => setActiveStep(9)}
            style={{
              background: '#ffffff',
              border: activeStep === 9 ? '4px solid #00f0ff' : '3px dashed #dc2626',
              boxShadow: activeStep === 9 ? '0 0 24px #00f0ff' : '0 4px 12px rgba(0,0,0,0.5)',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '20px',
              maxWidth: '320px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', right: '-10px',
              background: activeStep === 9 ? '#00f0ff' : '#dc2626',
              color: activeStep === 9 ? '#000' : '#fff', width: '26px', height: '26px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '13px'
            }}>
              9
            </div>
            <div style={{ border: '4px dashed #dc2626', padding: '10px', textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '24px' }}>
                🔋⚡
              </div>
              <div style={{ fontSize: '16px', fontWeight: '900', color: '#000', letterSpacing: '1px', marginTop: '4px' }}>
                {cleanUn}
              </div>
              <div style={{ fontSize: '9px', fontWeight: '800', color: '#000', marginTop: '2px' }}>
                FOR MORE INFORMATION: {emergencyPhone}
              </div>
            </div>
          </div>
        )}

        {/* Bottom Face Row: 5. Orientation Arrows, 7. CAO Label, 4. Primary Hazard Diamond & 5. Subsidiary Hazard Diamond */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          
          {/* 6. THIS SIDE UP ORIENTATION ARROWS */}
          <div
            onClick={() => setActiveStep(6)}
            style={{
              background: '#ffffff',
              color: '#000000',
              border: activeStep === 6 ? '4px solid #00f0ff' : '2px solid #000',
              boxShadow: activeStep === 6 ? '0 0 24px #00f0ff' : '0 4px 10px rgba(0,0,0,0.4)',
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: '900',
              fontSize: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              position: 'absolute', top: '-10px', left: '-10px',
              background: activeStep === 6 ? '#00f0ff' : '#ef4444',
              color: activeStep === 6 ? '#000' : '#fff', width: '26px', height: '26px',
              borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
            }}>
              6
            </div>
            <div style={{ fontSize: '8px', fontWeight: '900', color: '#ef4444', background: '#fee2e2', padding: '1px 6px', borderRadius: '3px', marginBottom: '2px' }}>
              📍 2 OPPOSITE SIDES
            </div>
            <div style={{ display: 'flex', gap: '8px', color: '#ef4444', fontSize: '20px' }}>
              <ArrowUp size={24} strokeWidth={3.5} />
              <ArrowUp size={24} strokeWidth={3.5} />
            </div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>THIS SIDE UP</span>
          </div>

          {/* 7. CARGO AIRCRAFT ONLY LABEL */}
          {(regMode === 'IATA' || qtyValidation.isCaoRequired) && (
            <div
              onClick={() => setActiveStep(7)}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: activeStep === 7 ? '4px solid #00f0ff' : qtyValidation.isCaoRequired ? '3px solid #facc15' : '2px solid #000',
                boxShadow: activeStep === 7 ? '0 0 24px #00f0ff' : qtyValidation.isCaoRequired ? '0 0 16px rgba(234,88,12,0.7)' : '0 4px 10px rgba(0,0,0,0.4)',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: '900',
                fontSize: '11px',
                textAlign: 'center',
                position: 'relative',
                maxWidth: '160px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{
                position: 'absolute', top: '-10px', right: '-10px',
                background: activeStep === 7 ? '#00f0ff' : '#ea580c',
                color: activeStep === 7 ? '#000' : '#fff', width: '26px', height: '26px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
              }}>
              7
            </div>
              <div style={{ fontSize: '8px', fontWeight: '900', color: '#fff', background: 'rgba(0,0,0,0.4)', padding: '1px 5px', borderRadius: '2px', marginBottom: '4px' }}>
                📍 FRONT (ADJACENT TO CLASS)
              </div>
              ✈️ CARGO AIRCRAFT ONLY
              <div style={{ fontSize: '8px', fontWeight: '700', marginTop: '2px', color: qtyValidation.isCaoRequired ? '#fef08a' : '#fff' }}>
                {qtyValidation.isCaoRequired ? '⚠️ MANDATORY FOR EXCEEDED PAX QTY' : 'FORBIDDEN ON PASSENGER AIRCRAFT'}
              </div>
            </div>
          )}

          {/* 4 & 5. HAZARD CLASS DIAMOND LABELS (Primary & Subsidiary Risk) */}
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            
            {/* Primary Hazard Class Diamond */}
            <div
              onClick={() => setActiveStep(4)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{
                position: 'absolute', top: '-14px', right: '-14px',
                background: activeStep === 4 ? '#00f0ff' : '#a855f7',
                color: '#000', width: '26px', height: '26px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '900', fontSize: '13px', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
              }}>
                4
              </div>

              <div style={{ fontSize: '8px', fontWeight: '900', color: '#00f0ff', background: '#0f172a', padding: '2px 6px', borderRadius: '3px', marginBottom: '8px' }}>
                📍 FRONT FACE - BOTTOM RIGHT
              </div>

              {/* Diamonds flex array */}
              <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                {(isOverpack && overpackItems.length > 0
                  ? Array.from(new Set(overpackItems.map(it => it.class_division)))
                  : [hazardClass]
                ).map((cls, idx) => {
                  const dStyle = getHazardDiamondStyle(cls);
                  return (
                    <div
                      key={idx}
                      className="class-diamond"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: dStyle.bg,
                        border: activeStep === 4 ? '4px solid #00f0ff' : (dStyle.border || '2px solid #ffffff'),
                        boxShadow: activeStep === 4 ? '0 0 24px #00f0ff' : '0 6px 16px rgba(0,0,0,0.7)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div className="class-diamond-content" style={{ color: dStyle.text, textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{dStyle.symbol}</div>
                        <span style={{ fontSize: '16px', fontWeight: '900' }}>{cls}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <span style={{ fontSize: '10px', fontWeight: '800', marginTop: '8px', color: '#ffffff', background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '4px' }}>
                PRIMARY CLASS {hazardClass}
              </span>
            </div>

            {/* 5. Subsidiary Risk Hazard Diamond (if subRisk exists) */}
            {subRisk && (
              <div
                onClick={() => setActiveStep(5)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
              >
                <div style={{
                  position: 'absolute', top: '-14px', right: '-14px',
                  background: activeStep === 5 ? '#00f0ff' : '#ec4899',
                  color: '#000', width: '26px', height: '26px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: '900', fontSize: '13px', zIndex: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                }}>
                  5
                </div>

                <div style={{ fontSize: '8px', fontWeight: '900', color: '#ec4899', background: '#0f172a', padding: '2px 6px', borderRadius: '3px', marginBottom: '8px' }}>
                  📍 ADJACENT TO PRIMARY
                </div>

                {(() => {
                  const subStyle = getHazardDiamondStyle(subRisk, true);
                  return (
                    <div
                      className="class-diamond"
                      style={{
                        width: '64px',
                        height: '64px',
                        background: subStyle.bg,
                        border: activeStep === 5 ? '4px solid #00f0ff' : (subStyle.border || '2px solid #ffffff'),
                        boxShadow: activeStep === 5 ? '0 0 24px #00f0ff' : '0 6px 16px rgba(0,0,0,0.7)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      <div className="class-diamond-content" style={{ color: subStyle.text, textAlign: 'center' }}>
                        <div style={{ fontSize: '14px' }}>{subStyle.symbol}</div>
                        <span style={{ fontSize: '16px', fontWeight: '900' }}>{subRisk}</span>
                      </div>
                    </div>
                  );
                })()}

                <span style={{ fontSize: '10px', fontWeight: '800', marginTop: '8px', color: '#ec4899', background: 'rgba(0,0,0,0.7)', padding: '2px 8px', borderRadius: '4px' }}>
                  SUB-RISK {subRisk}
                </span>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* VERIFICATION CHECKLIST FOR SHIPPERS & AUDITORS */}
      <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#ff9900', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 color="#10b981" size={20} /> Pre-Shipment Labeling & Packaging Compliance Verification
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          {[
            { id: 'carrierLabel', step: 1, title: 'Carrier Label Affixed Flat', text: 'Label applied without wrinkling, edge folding, or covering box seams/tape.' },
            { id: 'unPsn', step: 2, title: 'UN Number & PSN Marked', text: `Marked "${unNumber} ${psn}" with minimum 6mm character height within 6" of hazard label.` },
            { id: 'netQty', step: 3, title: 'Net Quantity Marked', text: `Exact net quantity (${displayNetQty}) clearly printed for customs and carrier verification.` },
            { id: 'hazardDiamond', step: 4, title: 'Hazard Diamond Set On Point', text: '4"x4" diamond label affixed at 45° angle with sharp color contrast.' },
            { id: 'arrows', step: 6, title: 'Orientation Arrows (2 Sides)', text: isLiquid ? 'Mandatory package arrows affixed to 2 opposite vertical sides.' : 'Verified package orientation is upright and secure.' },
            { id: 'unSpec', step: 8, title: 'UN Spec Packaging Verified', text: `Certified outer box rating (${unSpecCode}) meets packing group drop test standards.` },
          ].map(item => (
            <div
              key={item.id}
              onClick={() => { toggleCheck(item.id); setActiveStep(item.step); }}
              style={{
                padding: '12px',
                background: checklist[item.id] ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.02)',
                border: checklist[item.id] ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color={checklist[item.id] ? '#10b981' : '#64748b'} />
                <span style={{ fontWeight: '800', color: checklist[item.id] ? '#10b981' : '#ffffff', fontSize: '12px' }}>
                  {item.title}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
