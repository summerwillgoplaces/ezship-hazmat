import React, { useState, useEffect } from 'react';
import { FileText, Printer, Download, CheckCircle2, AlertCircle, BookOpen, Building, User } from 'lucide-react';
import AddressBookModal from './AddressBookModal';

export default function DocumentGenerator({ regMode, syncedShipment }) {
  const [shipperName, setShipperName] = useState('ACME Global Logistics');
  const [shipperAddress, setShipperAddress] = useState('100 Industrial Pkwy, Suite 400, Houston, TX 77001 USA');
  const [consigneeName, setConsigneeName] = useState('Metro Power Systems');
  const [consigneeAddress, setConsigneeAddress] = useState('50 Freight Way, Unit 12, London Heathrow TW6 2GW, UK');
  const [airwayBill, setAirwayBill] = useState('016-98765432');
  const [emergencyPhone, setEmergencyPhone] = useState('1-800-424-9300 (CHEMTREC #12345)');
  const [signatoryName, setSignatoryName] = useState('Jane Doe (Certified DG Specialist)');
  const [docType, setDocType] = useState('IATA_SDDG');
  const [documents, setDocuments] = useState(null);

  // Address book integration
  const [isAddressBookOpen, setIsAddressBookOpen] = useState(false);
  const [addressBookTarget, setAddressBookTarget] = useState('shippers');
  const [savedContacts, setSavedContacts] = useState([]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setSavedContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts in DocumentGenerator:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const handleSelectContactFromModal = (contact) => {
    if (contact.type === 'SHIPPER' || addressBookTarget === 'shippers') {
      setShipperName(contact.company_name);
      setShipperAddress(`${contact.street_address}, ${contact.city}, ${contact.state_province} ${contact.postal_code} ${contact.country}`);
      if (contact.emergency_phone) setEmergencyPhone(contact.emergency_phone);
      if (contact.contact_person) setSignatoryName(contact.contact_person);
    } else {
      setConsigneeName(contact.company_name);
      setConsigneeAddress(`${contact.street_address}, ${contact.city}, ${contact.state_province} ${contact.postal_code} ${contact.country}`);
    }
    setIsAddressBookOpen(false);
  };

  const [isOverpack, setIsOverpack] = useState(false);
  const [overpackId, setOverpackId] = useState('OVERPACK 1');

  const [items, setItems] = useState([
    {
      un_number: 'UN1203',
      proper_shipping_name: 'GASOLINE',
      class_division: '3',
      packing_group: 'II',
      number_and_type_of_packagings: '1 Steel Drum (1A1)',
      quantity_and_unit: '50.0 L',
      packing_instruction: 'PI 364',
      authorization: 'Cargo Aircraft Only'
    },
    {
      un_number: 'UN3480',
      proper_shipping_name: 'LITHIUM ION BATTERIES',
      class_division: '9',
      packing_group: '',
      number_and_type_of_packagings: '1 Fibreboard Box (4G)',
      quantity_and_unit: '15.0 kg G',
      packing_instruction: 'PI 965 (Sec IA)',
      authorization: 'Cargo Aircraft Only (SoC <= 30%)'
    }
  ]);

  useEffect(() => {
    if (syncedShipment) {
      if (syncedShipment.shipper_name) setShipperName(syncedShipment.shipper_name);
      if (syncedShipment.shipper_address) setShipperAddress(syncedShipment.shipper_address);
      if (syncedShipment.consignee_name) setConsigneeName(syncedShipment.consignee_name);
      if (syncedShipment.consignee_address) setConsigneeAddress(syncedShipment.consignee_address);
      if (syncedShipment.airway_bill_number) setAirwayBill(syncedShipment.airway_bill_number);
      if (syncedShipment.emergency_phone) setEmergencyPhone(syncedShipment.emergency_phone);
      if (syncedShipment.signatory_name) setSignatoryName(syncedShipment.signatory_name);
      if (syncedShipment.is_overpack !== undefined) setIsOverpack(syncedShipment.is_overpack);
      if (syncedShipment.overpack_id) setOverpackId(syncedShipment.overpack_id);
      if (syncedShipment.items && syncedShipment.items.length > 0) {
        setItems(syncedShipment.items);
      }
    }
  }, [syncedShipment]);

  useEffect(() => {
    generateDocs();
  }, [shipperName, shipperAddress, consigneeName, consigneeAddress, airwayBill, emergencyPhone, signatoryName, docType, items, regMode, isOverpack, overpackId]);

  const generateDocs = async () => {
    try {
      const res = await fetch('/api/hazmat/generate-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipper_name: shipperName,
          shipper_address: shipperAddress,
          consignee_name: consigneeName,
          consignee_address: consigneeAddress,
          airway_bill_number: airwayBill,
          departure_airport: 'JFK - New York',
          destination_airport: 'LHR - London Heathrow',
          shipment_type: 'CARGO_AIRCRAFT_ONLY',
          transport_mode: regMode === 'IATA' ? 'AIR' : 'GROUND',
          emergency_phone: emergencyPhone,
          emergency_contact_name: 'CHEMTREC 24-HR RESPONSE',
          signatory_name: signatoryName,
          is_overpack: isOverpack,
          overpack_id: overpackId,
          items: items
        })
      });
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      console.error('Failed to generate shipping documents:', err);
    }
  };

  const handlePrint = () => {
    const activeDoc = docType === 'IATA_SDDG' ? documents?.IATA_SDDG : documents?.DOT_SHIPPING_PAPER;
    if (!activeDoc) return;

    const printWin = window.open('', '_blank');
    printWin.document.write(activeDoc.html_content);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 250);
  };

  return (
    <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
      
      {/* Form & Controls Panel */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={22} color="#ff9900" /> Shipping Document Generator
        </h2>

        {/* Sync Status Alert */}
        {syncedShipment && (
          <div className="badge badge-green" style={{ marginBottom: '16px', width: '100%', justifyContent: 'flex-start', padding: '8px 12px' }}>
            <CheckCircle2 size={16} /> Auto-populated from Shipping Guide ({items.map(i => i.un_number).join(', ')})
          </div>
        )}

        {/* Document Format Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button
            className={`btn-secondary ${docType === 'IATA_SDDG' ? 'active' : ''}`}
            onClick={() => setDocType('IATA_SDDG')}
            style={{
              flex: 1,
              background: docType === 'IATA_SDDG' ? 'linear-gradient(135deg, rgba(255,153,0,0.3), rgba(255,85,0,0.3))' : '',
              borderColor: docType === 'IATA_SDDG' ? '#ff9900' : ''
            }}
          >
            ✈️ IATA Shipper's Declaration
          </button>
          <button
            className={`btn-secondary ${docType === 'DOT_SHIPPING_PAPER' ? 'active' : ''}`}
            onClick={() => setDocType('DOT_SHIPPING_PAPER')}
            style={{
              flex: 1,
              background: docType === 'DOT_SHIPPING_PAPER' ? 'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(0,136,255,0.3))' : '',
              borderColor: docType === 'DOT_SHIPPING_PAPER' ? '#00f0ff' : ''
            }}
          >
            🚛 DOT Shipping Paper (49 CFR)
          </button>
        </div>

        {/* Form Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Shipper Name & Address</label>
              <button
                type="button"
                onClick={() => {
                  setAddressBookTarget('shippers');
                  setIsAddressBookOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f0ff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <BookOpen size={13} /> Select from Address Book
              </button>
            </div>
            <input type="text" className="input-field" value={shipperName} onChange={(e) => setShipperName(e.target.value)} style={{ marginBottom: '6px' }} />
            <textarea className="input-field" rows={2} value={shipperAddress} onChange={(e) => setShipperAddress(e.target.value)} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Consignee Name & Address</label>
              <button
                type="button"
                onClick={() => {
                  setAddressBookTarget('consignees');
                  setIsAddressBookOpen(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#00f0ff',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <BookOpen size={13} /> Select from Address Book
              </button>
            </div>
            <input type="text" className="input-field" value={consigneeName} onChange={(e) => setConsigneeName(e.target.value)} style={{ marginBottom: '6px' }} />
            <textarea className="input-field" rows={2} value={consigneeAddress} onChange={(e) => setConsigneeAddress(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Air Waybill / Tracking #</label>
              <input type="text" className="input-field" value={airwayBill} onChange={(e) => setAirwayBill(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Emergency Phone (49 CFR 172.604)</label>
              <input type="text" className="input-field" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Signatory Name (Certified Shipper)</label>
            <input type="text" className="input-field" value={signatoryName} onChange={(e) => setSignatoryName(e.target.value)} />
          </div>

          {/* Active Items Table Summary */}
          <div className="glass-card">
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#ff9900', textTransform: 'uppercase', marginBottom: '8px' }}>
              Manifest Items ({items.length})
            </h4>
            {items.map((it, idx) => (
              <div key={idx} style={{ fontSize: '12px', borderBottom: idx < items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', paddingBottom: '6px', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: '#00f0ff' }}>{it.un_number}</span> - {it.proper_shipping_name} ({it.quantity_and_unit})
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={handlePrint} style={{ marginTop: '10px' }}>
            <Printer size={18} /> Print / Export Official PDF
          </button>
        </div>
      </div>

      {/* Live Document Preview Panel */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
            Live Document Preview ({docType === 'IATA_SDDG' ? 'IATA DGR' : 'US DOT 49 CFR'})
          </h3>
          <span className="badge badge-green">Ready to Print</span>
        </div>

        {documents ? (
          <div style={{
            flex: 1, background: '#ffffff', borderRadius: '8px', overflow: 'hidden',
            border: '2px solid rgba(255,255,255,0.2)', minHeight: '520px'
          }}>
            <iframe
              srcDoc={docType === 'IATA_SDDG' ? documents.IATA_SDDG.html_content : documents.DOT_SHIPPING_PAPER.html_content}
              title="Document Preview"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
            <FileText size={48} style={{ marginBottom: '12px', opacity: '0.4' }} />
            <p>Generating document preview...</p>
          </div>
        )}
      </div>

      {/* Address Book Modal */}
      <AddressBookModal
        isOpen={isAddressBookOpen}
        onClose={() => {
          setIsAddressBookOpen(false);
          fetchContacts();
        }}
        defaultTab={addressBookTarget}
        onSelectContact={handleSelectContactFromModal}
      />

    </div>
  );
}
