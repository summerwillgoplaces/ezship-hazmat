import React, { useState, useEffect } from 'react';
import { Search, Filter, AlertCircle, Package, Plane, Truck, FileText, CheckCircle2 } from 'lucide-react';
import PackageMarkingDiagram from './PackageMarkingDiagram';

export default function HazmatLookup({ regMode, onSyncToGuide }) {
  const [query, setQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [results, setResults] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchResults();
  }, [query, selectedClass]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      let url = `/api/hazmat/search?q=${encodeURIComponent(query)}`;
      if (selectedClass) url += `&class_filter=${encodeURIComponent(selectedClass)}`;
      const res = await fetch(url);
      const data = await res.json();
      setResults(data);
      if (data.length > 0 && !selectedItem) {
        setSelectedItem(data[0]);
      }
    } catch (err) {
      console.error('Failed to fetch hazmat db:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
      
      {/* Search & List Panel */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff' }}>
            <Search size={20} color="#ff9900" /> UN Hazardous Materials Database
          </h2>
          <span className="badge badge-amber" style={{ fontSize: '12px', padding: '4px 10px' }}>
            3,815 Substances Registered
          </span>
        </div>

        {/* Search Bar & Filters */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Search UN Number (e.g. UN3551, UN3480, 1203) or Shipping Name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ paddingLeft: '38px' }}
            />
            <Search size={18} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedClass('')}
              className={`badge ${selectedClass === '' ? 'badge-amber' : ''}`}
              style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: selectedClass === '' ? '' : 'rgba(255,255,255,0.05)' }}
            >
              All Classes
            </button>
            {['1', '2.1', '2.2', '2.3', '3', '4.1', '4.2', '4.3', '5.1', '6.1', '8', '9'].map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`badge ${selectedClass === cls ? 'badge-amber' : ''}`}
                style={{ cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: selectedClass === cls ? '' : 'rgba(255,255,255,0.05)' }}
              >
                Class {cls}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
              <AlertCircle size={32} style={{ marginBottom: '8px', opacity: '0.5' }} />
              <p>No dangerous goods matching search query.</p>
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={idx}
                className="glass-card"
                onClick={() => setSelectedItem(item)}
                style={{
                  cursor: 'pointer',
                  borderColor: selectedItem?.un_number === item.un_number && selectedItem?.proper_shipping_name === item.proper_shipping_name ? '#ff9900' : 'rgba(255,255,255,0.08)',
                  background: selectedItem?.un_number === item.un_number && selectedItem?.proper_shipping_name === item.proper_shipping_name ? 'rgba(255, 153, 0, 0.12)' : 'rgba(15, 23, 42, 0.6)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#ff9900', fontSize: '15px' }}>
                    {item.un_number}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span className="badge badge-amber">Class {item.class_division}</span>
                    {item.packing_group && <span className="badge badge-cyan">PG {item.packing_group}</span>}
                  </div>
                </div>
                <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9', lineHeight: '1.3' }}>
                  {item.proper_shipping_name}
                </h4>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Item Inspector Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {selectedItem ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: '800', color: '#ff9900' }}>
                  {selectedItem.un_number}
                </span>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginTop: '4px' }}>
                  {selectedItem.proper_shipping_name}
                </h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-amber" style={{ fontSize: '14px', padding: '6px 14px' }}>
                  Hazard Class {selectedItem.class_division}
                </span>
                {selectedItem.subsidiary_risk && (
                  <div style={{ marginTop: '4px' }}>
                    <span className="badge badge-red">Subsidiary: {selectedItem.subsidiary_risk}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sync to Shipping Guide Quick Action Button */}
            {onSyncToGuide && (
              <div style={{ marginBottom: '20px' }}>
                <button
                  className="btn-primary"
                  onClick={() => onSyncToGuide(selectedItem)}
                  style={{
                    width: '100%',
                    justify: 'center',
                    padding: '12px 20px',
                    fontSize: '14px',
                    background: 'linear-gradient(135deg, #ff9900, #ff5500)',
                    boxShadow: '0 4px 14px rgba(255, 153, 0, 0.4)'
                  }}
                >
                  🚀 Sync to Shipping & Package Guide
                </button>
              </div>
            )}

            {/* Overview Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="glass-card">
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Packing Group</div>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#00f0ff' }}>
                  {selectedItem.packing_group ? `PG ${selectedItem.packing_group}` : 'None / Not Applicable'}
                </div>
              </div>

              <div className="glass-card">
                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Technical Name Requirement</div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: selectedItem.technical_name_required ? '#ef4444' : '#10b981' }}>
                  {selectedItem.technical_name_required ? '⚠️ Required in Parentheses' : 'Not Required'}
                </div>
              </div>
            </div>

            {/* Description & Regulatory Notes */}
            <div className="glass-card" style={{ marginBottom: '20px', borderLeft: '4px solid #ff9900' }}>
              <h4 style={{ fontSize: '13px', color: '#ff9900', fontWeight: '700', textTransform: 'uppercase', marginBottom: '6px' }}>
                Regulatory Overview & Safety Note
              </h4>
              <p style={{ fontSize: '13px', color: '#cbd5e1' }}>
                {selectedItem.description}
              </p>
            </div>

            {/* Regulations Inspector Tabs (49 CFR vs IATA vs ADR 2026) */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <Truck size={18} color="#ff9900" />
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff' }}>
                  {regMode === '49CFR' ? 'US DOT 49 CFR Specifications' : regMode === 'IATA' ? 'IATA DGR Air Transport Specifications' : 'ADR 2026 European Road Transport Specifications'}
                </h3>
              </div>

              {regMode === '49CFR' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Passenger Aircraft Limit:</span><br />
                    <strong style={{ color: '#f1f5f9' }}>{selectedItem.dot_49cfr.passenger_aircraft_limit}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Cargo Aircraft Limit:</span><br />
                    <strong style={{ color: '#f1f5f9' }}>{selectedItem.dot_49cfr.cargo_aircraft_limit}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Non-Bulk Packaging Code:</span><br />
                    <strong style={{ color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>{selectedItem.dot_49cfr.non_bulk_pkg}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Emergency Response (ERG) Guide:</span><br />
                    <strong style={{ color: '#ff9900', fontFamily: 'var(--font-mono)' }}>Guide #{selectedItem.dot_49cfr.erg_guide}</strong>
                  </div>
                </div>
              ) : regMode === 'IATA' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Packing Inst. (Pax Aircraft):</span><br />
                    <strong style={{ color: '#f1f5f9' }}>{selectedItem.iata_dgr.packing_instruction_pax}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Packing Inst. (Cargo Aircraft):</span><br />
                    <strong style={{ color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>{selectedItem.iata_dgr.packing_instruction_cao}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>IATA ERG Code:</span><br />
                    <strong style={{ color: '#ff9900', fontFamily: 'var(--font-mono)' }}>{selectedItem.iata_dgr.erg_code}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Cargo Aircraft Only Required:</span><br />
                    <strong style={{ color: selectedItem.iata_dgr.packing_instruction_pax.includes('Forbidden') ? '#ef4444' : '#10b981' }}>
                      {selectedItem.iata_dgr.packing_instruction_pax.includes('Forbidden') ? 'YES (CAO Mandatory)' : 'No'}
                    </strong>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div>
                    <span style={{ color: '#94a3b8' }}>ADR Tunnel Restriction Code:</span><br />
                    <strong style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontSize: '15px' }}>{selectedItem.adr_2026?.tunnel_code || '(E)'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Transport Category (0-4):</span><br />
                    <strong style={{ color: '#00f0ff', fontFamily: 'var(--font-mono)' }}>Category {selectedItem.adr_2026?.transport_category || '2'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>Kemler / Hazard ID Number (HIN):</span><br />
                    <strong style={{ color: '#ff9900', fontFamily: 'var(--font-mono)' }}>HIN #{selectedItem.adr_2026?.hin || '33'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#94a3b8' }}>ADR Limited Quantity (LQ):</span><br />
                    <strong style={{ color: '#f1f5f9' }}>{selectedItem.adr_2026?.limited_quantity || '1 L'}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Mandatory Labels */}
            <div style={{ marginTop: '20px', marginBottom: '24px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Required Hazard Labels & Package Markings
              </h4>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {selectedItem.labels_required.map((label, i) => (
                  <span key={i} className="badge badge-amber" style={{ padding: '6px 12px', fontSize: '12px' }}>
                    🏷️ {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Visual Packaging Marking & Label Placement Diagram */}
            <div style={{ marginTop: '24px' }}>
              <PackageMarkingDiagram
                unNumber={selectedItem.un_number}
                psn={selectedItem.proper_shipping_name}
                techName={selectedItem.technical_name || ''}
                hazardClass={selectedItem.primary_class}
                subRisk={selectedItem.subsidiary_risk || ''}
                packingGroup={selectedItem.packing_group}
                netQty="5.0 L (Package Limit)"
                pkgType="4G Fibreboard Outer Box (UN Spec)"
                regMode={regMode}
                isOverpack={false}
                shipperName="SHIPPER LOGISTICS DEPT"
                shipperAddress="100 Industrial Pkwy, Houston TX 77001"
                consigneeName="CONSIGNEE RECEIVING DEPT"
                consigneeAddress="500 Logistics Way, Chicago IL 60601"
                trackingNumber="7948 2940 1849"
              />
            </div>

          </div>

        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <Package size={48} style={{ marginBottom: '12px', opacity: '0.4' }} />
            <p>Select a dangerous goods item from the database search list to view detailed regulatory specifications.</p>
          </div>
        )}
      </div>

    </div>
  );
}
