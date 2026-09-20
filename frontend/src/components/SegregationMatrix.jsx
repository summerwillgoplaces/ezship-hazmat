import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldCheck, Plus, Trash2, ShieldAlert, CheckCircle2, Truck } from 'lucide-react';

export default function SegregationMatrix({ regMode }) {
  const [basket, setBasket] = useState([
    { id: '1', un_number: 'UN1203', proper_shipping_name: 'GASOLINE', class_division: '3' },
    { id: '2', un_number: 'UN2014', proper_shipping_name: 'HYDROGEN PEROXIDE, AQUEOUS SOLUTION', class_division: '5.1' }
  ]);
  const [unInput, setUnInput] = useState('');
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    evaluateMatrix();
  }, [basket, regMode]);

  const evaluateMatrix = async () => {
    if (basket.length < 2) {
      setEvaluation(null);
      return;
    }
    try {
      const res = await fetch('/api/hazmat/segregation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: basket,
          mode: regMode
        })
      });
      const data = await res.json();
      setEvaluation(data);
    } catch (err) {
      console.error('Failed to evaluate segregation matrix:', err);
    }
  };

  const addItemByUN = async () => {
    if (!unInput.trim()) return;
    try {
      const res = await fetch(`/api/hazmat/search?q=${encodeURIComponent(unInput.trim())}`);
      const data = await res.json();
      if (data.length > 0) {
        const item = data[0];
        setBasket([...basket, {
          id: Date.now().toString(),
          un_number: item.un_number,
          proper_shipping_name: item.proper_shipping_name,
          class_division: item.class_division
        }]);
        setUnInput('');
      } else {
        alert(`UN Number '${unInput}' not found in database.`);
      }
    } catch (err) {
      console.error('Add item error:', err);
    }
  };

  const removeItem = (id) => {
    setBasket(basket.filter(it => it.id !== id));
  };

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px' }}>
      
      {/* Shipment Item Basket Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={22} color="#ff9900" /> Multi-Item Shipment Basket
        </h2>

        {/* Add UN Item Input */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Add UN Number (e.g. UN1830, UN1072, 3480)..."
            value={unInput}
            onChange={(e) => setUnInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItemByUN()}
          />
          <button className="btn-primary" onClick={addItemByUN}>
            <Plus size={18} /> Add
          </button>
        </div>

        {/* Quick Add Presets */}
        <div style={{ marginBottom: '20px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>Quick Add Presets:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="badge badge-amber" style={{ cursor: 'pointer' }} onClick={() => setUnInput('1203')}>+ Gasoline (Class 3)</button>
            <button className="badge badge-cyan" style={{ cursor: 'pointer' }} onClick={() => setUnInput('2014')}>+ Oxidizer (Class 5.1)</button>
            <button className="badge badge-red" style={{ cursor: 'pointer' }} onClick={() => setUnInput('1830')}>+ Sulfuric Acid (Class 8)</button>
            <button className="badge badge-green" style={{ cursor: 'pointer' }} onClick={() => setUnInput('3480')}>+ Li-ion Battery (Class 9)</button>
          </div>
        </div>

        {/* Item List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {basket.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '30px' }}>No items in shipment basket. Add items to evaluate segregation.</p>
          ) : (
            basket.map(item => (
              <div key={item.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#ff9900' }}>{item.un_number}</span>
                    <span className="badge badge-amber">Class {item.class_division}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', marginTop: '2px' }}>{item.proper_shipping_name}</div>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Segregation Matrix Evaluation Results */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={22} color="#00f0ff" /> Segregation Compliance Results
        </h2>

        {evaluation ? (
          <div>
            {/* Status Banner */}
            <div style={{
              padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
              background: evaluation.is_compliant ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${evaluation.is_compliant ? '#10b981' : '#ef4444'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {evaluation.is_compliant ? <ShieldCheck size={28} color="#10b981" /> : <AlertTriangle size={28} color="#ef4444" />}
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: evaluation.is_compliant ? '#10b981' : '#ef4444' }}>
                    {evaluation.is_compliant ? 'COMPLIANT FOR CO-LOADING' : 'PROHIBITED INCOMPATIBILITY DETECTED'}
                  </h3>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                    Evaluated under {regMode === '49CFR' ? 'US DOT 49 CFR 177.848 Segregation Table' : 'IATA DGR Section 9.3.11 Air Segregation Rules'}.
                  </p>
                </div>
              </div>
            </div>

            {/* Conflicts List */}
            {evaluation.conflicts.length > 0 ? (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#ef4444', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Identified Co-Loading Conflicts ({evaluation.conflicts.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {evaluation.conflicts.map((conf, idx) => (
                    <div key={idx} className="glass-card" style={{ borderLeft: '4px solid #ef4444' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', color: '#ff9900', fontSize: '13px' }}>
                          {conf.item1_un} (Class {conf.item1_class}) ⚡ {conf.item2_un} (Class {conf.item2_class})
                        </span>
                        <span className="badge badge-red">Code {conf.conflict_type}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: '#f1f5f9' }}>{conf.rule_summary}</p>
                      <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Ref: {conf.regulatory_reference}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ borderLeft: '4px solid #10b981', marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>
                  No Direct Incompatibilities
                </h4>
                <p style={{ fontSize: '13px', color: '#cbd5e1' }}>All items in this shipment basket are allowed to be co-transported in the same freight container/vehicle.</p>
              </div>
            )}

            {/* Vehicle Placarding Calculator Summary */}
            {regMode === '49CFR' && (
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Truck size={18} color="#ff9900" />
                  <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>49 CFR 172.504 Vehicle Placarding Guide</h4>
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1' }}>
                  Table 2 materials (Class 3, Class 8, Class 9) require vehicle placarding when aggregate gross weight exceeds <strong>1,001 lbs (454 kg)</strong>. Table 1 materials (Poison Gas 2.3, Dangerous When Wet 4.3, Organics 5.2) require placarding at any quantity.
                </p>
              </div>
            )}

          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
            <AlertTriangle size={48} style={{ marginBottom: '12px', opacity: '0.4' }} />
            <p>Add at least 2 items to the shipment basket to evaluate segregation rules.</p>
          </div>
        )}
      </div>

    </div>
  );
}
