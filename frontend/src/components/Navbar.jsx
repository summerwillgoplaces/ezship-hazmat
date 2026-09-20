import React, { useState, useEffect } from 'react';
import { ShieldCheck, Flame, BatteryCharging, AlertTriangle, FileText, Compass, Database } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, regMode, setRegMode }) {
  const [totalRecords, setTotalRecords] = useState(3815);

  useEffect(() => {
    fetch('/api/hazmat/stats')
      .then(res => res.json())
      .then(data => {
        if (data && data.total_records) {
          setTotalRecords(data.total_records);
        }
      })
      .catch(err => console.error('Failed to fetch hazmat stats:', err));
  }, []);

  return (
    <header className="glass-panel" style={{ margin: '16px 24px 0 24px', padding: '16px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #ff9900, #ff5500)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255, 153, 0, 0.4)'
          }}>
            <Flame size={24} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', color: '#ffffff' }}>
              EZShip <span style={{ color: '#ff9900' }}>Hazmat</span>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
              <span className="badge badge-amber">49 CFR, IATA DGR & ADR 2026 Compliant</span>
              <span className="badge badge-purple" style={{ background: 'rgba(168, 85, 247, 0.25)', color: '#d8b4fe', border: '1px solid rgba(168, 85, 247, 0.5)', fontWeight: '800' }}>
                Made by Jubail
              </span>
              <span className="badge badge-cyan" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Database size={12} /> {totalRecords.toLocaleString()} Active UN Records Loaded
              </span>
              <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={12} /> Live Sync Active
              </span>
            </div>
          </div>
        </div>

        {/* Regulation Mode Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <button
            onClick={() => setRegMode('49CFR')}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease',
              background: regMode === '49CFR' ? 'linear-gradient(135deg, #ff9900, #ff5500)' : 'transparent',
              color: regMode === '49CFR' ? '#ffffff' : '#94a3b8'
            }}
          >
            🚛 DOT 49 CFR (Ground)
          </button>
          <button
            onClick={() => setRegMode('IATA')}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease',
              background: regMode === 'IATA' ? 'linear-gradient(135deg, #00f0ff, #0088ff)' : 'transparent',
              color: regMode === 'IATA' ? '#ffffff' : '#94a3b8'
            }}
          >
            ✈️ IATA DGR (Air)
          </button>
          <button
            onClick={() => setRegMode('ADR')}
            style={{
              padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px', transition: 'all 0.2s ease',
              background: regMode === 'ADR' ? 'linear-gradient(135deg, #10b981, #059669)' : 'transparent',
              color: regMode === 'ADR' ? '#ffffff' : '#94a3b8'
            }}
          >
            🇪🇺 ADR 2026 (EU Road)
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '8px', marginTop: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button className={`nav-tab ${activeTab === 'lookup' ? 'active' : ''}`} onClick={() => setActiveTab('lookup')}>
          <Flame size={16} /> UN Hazmat Database
        </button>
        <button className={`nav-tab ${activeTab === 'battery' ? 'active' : ''}`} onClick={() => setActiveTab('battery')}>
          <BatteryCharging size={16} /> Lithium Battery Wizard
        </button>
        <button className={`nav-tab ${activeTab === 'segregation' ? 'active' : ''}`} onClick={() => setActiveTab('segregation')}>
          <AlertTriangle size={16} /> Segregation Matrix
        </button>
        <button className={`nav-tab ${activeTab === 'guide' ? 'active' : ''}`} onClick={() => setActiveTab('guide')}>
          <Compass size={16} /> Shipping Wizard & Package Guide
        </button>
        <button className={`nav-tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
          <FileText size={16} /> Shipper's Declaration & Shipping Paper
        </button>
      </nav>
    </header>
  );
}
