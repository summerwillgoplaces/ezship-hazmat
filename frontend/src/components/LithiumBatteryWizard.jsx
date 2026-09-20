import React, { useState, useEffect } from 'react';
import { BatteryCharging, AlertTriangle, ShieldCheck, CheckCircle2, Info, ArrowRight, Zap } from 'lucide-react';
import PackageMarkingDiagram from './PackageMarkingDiagram';

export default function LithiumBatteryWizard({ regMode, onSyncToGuide }) {
  const [chemistry, setChemistry] = useState('ION');
  const [packagingFormat, setPackagingFormat] = useState('STANDALONE');
  const [isCell, setIsCell] = useState(false);
  const [wattHours, setWattHours] = useState(45.0);
  const [lithiumGrams, setLithiumGrams] = useState(0.8);
  const [socPercent, setSocPercent] = useState(25.0);
  const [netWeightKg, setNetWeightKg] = useState(1.5);
  const [qty, setQty] = useState(2);
  const [result, setResult] = useState(null);

  useEffect(() => {
    evaluateBattery();
  }, [chemistry, packagingFormat, isCell, wattHours, lithiumGrams, socPercent, netWeightKg, qty, regMode]);

  const evaluateBattery = async () => {
    try {
      const res = await fetch('/api/hazmat/lithium-battery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chemistry,
          packaging_format: packagingFormat,
          is_cell: isCell,
          watt_hours: parseFloat(wattHours) || 0,
          lithium_grams: parseFloat(lithiumGrams) || 0,
          quantity_cells_or_batteries: parseInt(qty) || 1,
          net_weight_kg: parseFloat(netWeightKg) || 0.1,
          transport_mode: regMode === 'IATA' ? 'AIR' : 'GROUND',
          state_of_charge_percent: parseFloat(socPercent) || 0
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to evaluate battery:', err);
    }
  };

  const handleSyncBattery = () => {
    if (!result || !onSyncToGuide) return;
    const batteryItem = {
      un_number: result.un_number,
      proper_shipping_name: result.proper_shipping_name,
      class_division: '9',
      packing_group: '',
      description: `${result.section_classification} - ${result.packing_instruction}`,
      labels_required: result.required_labels || [],
      markings_required: result.required_markings || [],
      battery_details: {
        chemistry,
        packagingFormat,
        wattHours,
        lithiumGrams,
        socPercent,
        netWeightKg,
        qty,
        section: result.section_classification,
        packing_instruction: result.packing_instruction
      }
    };
    onSyncToGuide(batteryItem);
  };

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
      
      {/* Wizard Interactive Form Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BatteryCharging size={22} color="#ff9900" /> Lithium & Sodium-Ion Battery Wizard
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Step 1: Battery Chemistry */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
              1. Battery Chemistry Type (IATA 66th Ed 2025/2026)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                className={`btn-secondary ${chemistry === 'ION' ? 'active' : ''}`}
                onClick={() => setChemistry('ION')}
                style={{
                  fontSize: '11px', padding: '8px 4px',
                  background: chemistry === 'ION' ? 'linear-gradient(135deg, rgba(255,153,0,0.3), rgba(255,85,0,0.3))' : '',
                  borderColor: chemistry === 'ION' ? '#ff9900' : ''
                }}
              >
                🔋 Lithium Ion (UN 3480/3481)
              </button>
              <button
                className={`btn-secondary ${chemistry === 'METAL' ? 'active' : ''}`}
                onClick={() => setChemistry('METAL')}
                style={{
                  fontSize: '11px', padding: '8px 4px',
                  background: chemistry === 'METAL' ? 'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(0,136,255,0.3))' : '',
                  borderColor: chemistry === 'METAL' ? '#00f0ff' : ''
                }}
              >
                ⚡ Lithium Metal (UN 3090/3091)
              </button>
              <button
                className={`btn-secondary ${chemistry === 'SODIUM_ION' ? 'active' : ''}`}
                onClick={() => setChemistry('SODIUM_ION')}
                style={{
                  fontSize: '11px', padding: '8px 4px',
                  background: chemistry === 'SODIUM_ION' ? 'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(5,150,105,0.3))' : '',
                  borderColor: chemistry === 'SODIUM_ION' ? '#10b981' : ''
                }}
              >
                🧪 Sodium Ion (UN 3551/3552)
              </button>
            </div>
          </div>

          {/* Step 2: Packaging Configuration */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
              2. Packaging & Equipment Integration
            </label>
            <select
              className="input-field"
              value={packagingFormat}
              onChange={(e) => setPackagingFormat(e.target.value)}
            >
              <option value="STANDALONE">Standalone Batteries / Power Banks</option>
              <option value="PACKED_WITH_EQUIPMENT">Packed With Equipment (In Same Package)</option>
              <option value="CONTAINED_IN_EQUIPMENT">Contained IN Equipment (Installed inside device)</option>
            </select>
          </div>

          {/* Step 3: Single Cell vs Battery Pack */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>
              3. Component Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn-secondary"
                onClick={() => setIsCell(true)}
                style={{ borderColor: isCell ? '#ff9900' : '', background: isCell ? 'rgba(255,153,0,0.2)' : '' }}
              >
                Single Cell (e.g. 18650 cell)
              </button>
              <button
                className="btn-secondary"
                onClick={() => setIsCell(false)}
                style={{ borderColor: !isCell ? '#ff9900' : '', background: !isCell ? 'rgba(255,153,0,0.2)' : '' }}
              >
                Battery Pack / Power Module
              </button>
            </div>
          </div>

          {/* Step 4: Rating Threshold Inputs */}
          {chemistry === 'ION' || chemistry === 'SODIUM_ION' ? (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                4. Watt-Hour (Wh) Rating
              </label>
              <input
                type="number"
                className="input-field"
                value={wattHours}
                onChange={(e) => setWattHours(e.target.value)}
                placeholder="Watt-hours (e.g. 45 Wh)"
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Threshold: ≤20Wh (cell) or ≤100Wh (battery pack) for Excepted Section II.
              </span>
            </div>
          ) : (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                4. Lithium Content (Grams)
              </label>
              <input
                type="number"
                className="input-field"
                value={lithiumGrams}
                onChange={(e) => setLithiumGrams(e.target.value)}
                placeholder="Lithium content in grams (e.g. 0.8g)"
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'block' }}>
                Threshold: ≤1.0g (cell) or ≤2.0g (battery pack) for Excepted Section II.
              </span>
            </div>
          )}

          {/* State of Charge (Air Standalone PI 965/976 trigger) */}
          {(chemistry === 'ION' || chemistry === 'SODIUM_ION') && packagingFormat === 'STANDALONE' && regMode === 'IATA' && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <label style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={16} /> Air State of Charge (SoC %)
              </label>
              <input
                type="number"
                className="input-field"
                value={socPercent}
                onChange={(e) => setSocPercent(e.target.value)}
                style={{ marginTop: '6px' }}
              />
              <span style={{ fontSize: '11px', color: '#f87171', marginTop: '4px', display: 'block' }}>
                IATA DGR Mandatory: Must be ≤ 30% SoC for standalone air transport.
              </span>
            </div>
          )}

          {/* Net Weight per Package */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Package Net Mass (kg)
              </label>
              <input
                type="number"
                className="input-field"
                value={netWeightKg}
                onChange={(e) => setNetWeightKg(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Quantity per Package
              </label>
              <input
                type="number"
                className="input-field"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>
          </div>

        </div>
      </div>

      {/* Compliance Engine Result Output */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {result ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: '800', color: '#ff9900' }}>
                  {result.un_number}
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                  {result.proper_shipping_name}
                </h3>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-amber" style={{ fontSize: '13px', padding: '6px 12px' }}>
                  {result.packing_instruction}
                </span>
              </div>
            </div>

            {/* Sync to Shipping Guide Action Button */}
            {onSyncToGuide && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  className="btn-primary"
                  onClick={handleSyncBattery}
                  style={{
                    width: '100%',
                    justify: 'center',
                    padding: '12px 20px',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  🚀 Sync Battery Evaluation to Shipping Guide
                </button>
              </div>
            )}

            {/* Classification Section Banner */}
            <div className="glass-card" style={{
              background: result.section_classification.includes('Section II') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 153, 0, 0.15)',
              borderColor: result.section_classification.includes('Section II') ? '#10b981' : '#ff9900',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: '700', color: result.section_classification.includes('Section II') ? '#10b981' : '#ff9900' }}>
                    Classification Result
                  </span>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '2px' }}>
                    {result.section_classification}
                  </h2>
                </div>
                <span className={`badge ${result.requires_dg_declaration ? 'badge-red' : 'badge-green'}`}>
                  {result.requires_dg_declaration ? '📄 DG Dec Required' : '✅ Excepted (No DG Dec)'}
                </span>
              </div>
            </div>

            {/* State of Charge Alert if any */}
            {result.requires_state_of_charge_verification && (
              <div style={{
                padding: '12px 16px', borderRadius: '10px', marginBottom: '20px',
                background: result.soc_compliant ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)',
                border: `1px solid ${result.soc_compliant ? '#10b981' : '#ef4444'}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', color: result.soc_compliant ? '#10b981' : '#ef4444' }}>
                  {result.soc_compliant ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                  State of Charge (SoC) Status: {result.soc_compliant ? 'COMPLIANT (≤ 30%)' : 'NON-COMPLIANT (> 30% SoC)'}
                </div>
              </div>
            )}

            {/* Checklist Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
              <div className="glass-card">
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>UN Spec Packaging</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: result.requires_un_packaging ? '#ff5500' : '#10b981', marginTop: '2px' }}>
                  {result.requires_un_packaging ? '4G UN Specification Required' : 'Strong Rigid Outer Box (1.2m Drop Tested)'}
                </div>
              </div>

              <div className="glass-card">
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Max Allowed Net Mass</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#00f0ff', marginTop: '2px' }}>
                  {result.max_net_weight_allowed_kg} kg / package
                </div>
              </div>
            </div>

            {/* Required Markings & Labels */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Required Package Labels & Marks (IATA 66th Ed)
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {result.required_labels.map((l, i) => (
                  <span key={i} className="badge badge-amber" style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '12px' }}>
                    🏷️ {l}
                  </span>
                ))}
                {result.required_markings.map((m, i) => (
                  <span key={i} className="badge badge-cyan" style={{ justifyContent: 'flex-start', padding: '8px 12px', fontSize: '12px' }}>
                    📦 {m}
                  </span>
                ))}
              </div>
            </div>

            {/* Notes List */}
            {result.regulatory_notes.length > 0 && (
              <div className="glass-card" style={{ borderLeft: '4px solid #00f0ff', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#00f0ff', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Instruction Notes
                </h4>
                <ul style={{ paddingLeft: '16px', fontSize: '12px', color: '#cbd5e1' }}>
                  {result.regulatory_notes.map((note, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Visual Lithium Battery Package Marking & Label Placement Diagram */}
            <div style={{ marginTop: '24px' }}>
              <PackageMarkingDiagram
                unNumber={result.un_number}
                psn={result.proper_shipping_name}
                hazardClass="9"
                packingGroup=""
                netQty={`${netWeightKg} kg (${qty} battery pkgs)`}
                pkgType={result.requires_un_packaging ? '4G UN Spec Outer Box' : 'Strong Rigid Outer Box'}
                regMode={regMode}
                isOverpack={false}
                shipperName="BATTERY LOGISTICS CORP"
                shipperAddress="200 Energy Way, Austin TX 78701"
                consigneeName="GLOBAL ELECTRONICS DISTRIBUTORS"
                consigneeAddress="400 Tech Blvd, San Jose CA 95110"
                trackingNumber="7948 2940 9988"
              />
            </div>

          </div>

        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <BatteryCharging size={48} style={{ marginBottom: '12px', opacity: '0.4' }} />
            <p>Select battery parameters to compute compliance classification.</p>
          </div>
        )}
      </div>

    </div>
  );
}
