import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  UserCheck,
  Building,
  Plus,
  Trash2,
  CheckCircle,
  X,
  Phone,
  Mail,
  MapPin,
  Star,
  Users,
  ShieldCheck,
  Search
} from 'lucide-react';

export default function AddressBookModal({ isOpen, onClose, onSelectContact, defaultTab = 'shippers' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'shippers', 'consignees', 'users'
  const [contacts, setContacts] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State: New Contact
  const [contactForm, setContactForm] = useState({
    type: 'SHIPPER',
    company_name: '',
    contact_person: '',
    street_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'USA',
    phone: '',
    emergency_phone: '',
    email: '',
    is_default: false,
    notes: ''
  });

  // Form State: New User
  const [userForm, setUserForm] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'Certified Hazmat Specialist',
    phone: ''
  });

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchContacts();
      fetchUsers();
      setIsAddingContact(false);
      setIsAddingUser(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter contacts based on tab & search
  const filteredContacts = contacts.filter(c => {
    if (activeTab === 'shippers' && c.type !== 'SHIPPER' && c.type !== 'BOTH') return false;
    if (activeTab === 'consignees' && c.type !== 'CONSIGNEE' && c.type !== 'BOTH') return false;
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (c.company_name && c.company_name.toLowerCase().includes(term)) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(term)) ||
      (c.city && c.city.toLowerCase().includes(term)) ||
      (c.street_address && c.street_address.toLowerCase().includes(term))
    );
  });

  const filteredUsers = users.filter(u => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(term)) ||
      (u.username && u.username.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.role && u.role.toLowerCase().includes(term))
    );
  });

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!contactForm.company_name || !contactForm.street_address || !contactForm.city) return;
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm)
      });
      if (res.ok) {
        await fetchContacts();
        setIsAddingContact(false);
        setContactForm({
          type: activeTab === 'consignees' ? 'CONSIGNEE' : 'SHIPPER',
          company_name: '',
          contact_person: '',
          street_address: '',
          city: '',
          state_province: '',
          postal_code: '',
          country: 'USA',
          phone: '',
          emergency_phone: '',
          email: '',
          is_default: false,
          notes: ''
        });
      }
    } catch (err) {
      console.error('Error creating contact:', err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!userForm.username || !userForm.full_name || !userForm.email) return;
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm)
      });
      if (res.ok) {
        await fetchUsers();
        setIsAddingUser(false);
        setUserForm({
          username: '',
          full_name: '',
          email: '',
          role: 'Certified Hazmat Specialist',
          phone: ''
        });
      }
    } catch (err) {
      console.error('Error creating user:', err);
    }
  };

  const handleDeleteContact = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this contact from the database?')) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) fetchContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
    }
  };

  const handleSetDefaultContact = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/contacts/${id}/default`, { method: 'POST' });
      if (res.ok) fetchContacts();
    } catch (err) {
      console.error('Error setting default contact:', err);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 10, 20, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: '#0b1120',
        border: '1px solid rgba(0, 240, 255, 0.4)',
        boxShadow: '0 0 40px rgba(0, 240, 255, 0.2)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(15, 23, 42, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BookOpen color="#00f0ff" size={24} />
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                Dangerous Goods Address Book & Specialist Registry
              </h2>
              <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>
                SQLite Database: Shippers, Consignees, and Certified Personnel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div style={{
          padding: '12px 24px',
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'shippers', label: 'Shippers', icon: Building, count: contacts.filter(c => c.type === 'SHIPPER' || c.type === 'BOTH').length },
              { id: 'consignees', label: 'Consignees', icon: MapPin, count: contacts.filter(c => c.type === 'CONSIGNEE' || c.type === 'BOTH').length },
              { id: 'users', label: 'Hazmat Specialists', icon: Users, count: users.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsAddingContact(false);
                    setIsAddingUser(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: isActive ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255,255,255,0.05)',
                    color: isActive ? '#00f0ff' : '#94a3b8',
                    border: isActive ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  <Icon size={14} />
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '180px', padding: '6px 10px 6px 30px', fontSize: '12px' }}
              />
            </div>

            {activeTab !== 'users' ? (
              <button
                onClick={() => {
                  setIsAddingContact(!isAddingContact);
                  setContactForm(prev => ({
                    ...prev,
                    type: activeTab === 'consignees' ? 'CONSIGNEE' : 'SHIPPER'
                  }));
                }}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add {activeTab === 'consignees' ? 'Consignee' : 'Shipper'}
              </button>
            ) : (
              <button
                onClick={() => setIsAddingUser(!isAddingUser)}
                className="btn btn-primary"
                style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> Add Specialist
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

          {/* Add Contact Form Drawer */}
          {isAddingContact && (
            <div className="glass-card" style={{ marginBottom: '20px', padding: '16px', background: 'rgba(15,23,42,0.9)', borderColor: '#00f0ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#00f0ff' }}>
                  ➕ Add New {contactForm.type} Profile
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingContact(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateContact}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Profile Type</label>
                    <select
                      className="input-field"
                      value={contactForm.type}
                      onChange={e => setContactForm({ ...contactForm, type: e.target.value })}
                    >
                      <option value="SHIPPER">Shipper</option>
                      <option value="CONSIGNEE">Consignee</option>
                      <option value="BOTH">Both (Shipper & Consignee)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Company Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={contactForm.company_name}
                      onChange={e => setContactForm({ ...contactForm, company_name: e.target.value })}
                      placeholder="e.g. Apex Global Chemical"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Contact Person / Signatory</label>
                    <input
                      type="text"
                      className="input-field"
                      value={contactForm.contact_person}
                      onChange={e => setContactForm({ ...contactForm, contact_person: e.target.value })}
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>24-Hr Emergency Phone</label>
                    <input
                      type="text"
                      className="input-field"
                      value={contactForm.emergency_phone}
                      onChange={e => setContactForm({ ...contactForm, emergency_phone: e.target.value })}
                      placeholder="e.g. 1-800-424-9300 (CHEMTREC)"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Street Address *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={contactForm.street_address}
                      onChange={e => setContactForm({ ...contactForm, street_address: e.target.value })}
                      placeholder="100 Industrial Pkwy"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>City *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={contactForm.city}
                      onChange={e => setContactForm({ ...contactForm, city: e.target.value })}
                      placeholder="Houston"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>State / Prov</label>
                    <input
                      type="text"
                      className="input-field"
                      value={contactForm.state_province}
                      onChange={e => setContactForm({ ...contactForm, state_province: e.target.value })}
                      placeholder="TX"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Postal Code</label>
                    <input
                      type="text"
                      className="input-field"
                      value={contactForm.postal_code}
                      onChange={e => setContactForm({ ...contactForm, postal_code: e.target.value })}
                      placeholder="77001"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Country</label>
                    <input
                      type="text"
                      className="input-field"
                      value={contactForm.country}
                      onChange={e => setContactForm({ ...contactForm, country: e.target.value })}
                      placeholder="USA"
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={contactForm.is_default}
                      onChange={e => setContactForm({ ...contactForm, is_default: e.target.checked })}
                    />
                    Set as default {contactForm.type}
                  </label>
                  <button type="submit" className="btn btn-success" style={{ padding: '6px 16px', fontSize: '12px' }}>
                    Save to Database
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Add User Form Drawer */}
          {isAddingUser && (
            <div className="glass-card" style={{ marginBottom: '20px', padding: '16px', background: 'rgba(15,23,42,0.9)', borderColor: '#00f0ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#00f0ff' }}>
                  ➕ Register New Dangerous Goods Specialist
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Username *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={userForm.username}
                      onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                      placeholder="e.g. jdoe"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Full Name *</label>
                    <input
                      type="text"
                      className="input-field"
                      required
                      value={userForm.full_name}
                      onChange={e => setUserForm({ ...userForm, full_name: e.target.value })}
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Email Address *</label>
                    <input
                      type="email"
                      className="input-field"
                      required
                      value={userForm.email}
                      onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8' }}>Certification Role</label>
                    <input
                      type="text"
                      className="input-field"
                      value={userForm.role}
                      onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                      placeholder="Dangerous Goods Officer"
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button type="submit" className="btn btn-success" style={{ padding: '6px 16px', fontSize: '12px' }}>
                    Register Specialist
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Contacts Grid */}
          {activeTab !== 'users' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
              {filteredContacts.map(c => (
                <div
                  key={c.id}
                  onClick={() => onSelectContact && onSelectContact(c)}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: c.is_default ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.08)',
                    boxShadow: c.is_default ? '0 0 12px rgba(0,240,255,0.15)' : 'none',
                    borderRadius: '10px',
                    padding: '16px',
                    cursor: onSelectContact ? 'pointer' : 'default',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${c.type === 'SHIPPER' ? 'badge-amber' : 'badge-cyan'}`} style={{ fontSize: '10px', fontWeight: '800' }}>
                          {c.type}
                        </span>
                        {c.is_default === 1 && (
                          <span style={{ fontSize: '10px', color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: '700' }}>
                            <Star size={11} fill="#00f0ff" /> DEFAULT
                          </span>
                        )}
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#ffffff', marginTop: '6px' }}>
                        {c.company_name}
                      </h3>
                      {c.contact_person && (
                        <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '600' }}>
                          Attn: {c.contact_person}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {c.is_default === 0 && (
                        <button
                          title="Set as Default"
                          onClick={(e) => handleSetDefaultContact(c.id, e)}
                          style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        title="Delete Profile"
                        onClick={(e) => handleDeleteContact(c.id, e)}
                        style={{ background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', borderRadius: '4px', padding: '4px', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                      <MapPin size={12} color="#00f0ff" />
                      <span>{c.street_address}, {c.city}, {c.state_province} {c.postal_code} {c.country}</span>
                    </div>
                    {c.emergency_phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', color: '#ef4444', fontWeight: '700', fontSize: '11px' }}>
                        <Phone size={11} />
                        <span>24-HR: {c.emergency_phone}</span>
                      </div>
                    )}
                    {c.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', color: '#94a3b8', fontSize: '11px' }}>
                        <Mail size={11} />
                        <span>{c.email}</span>
                      </div>
                    )}
                  </div>

                  {onSelectContact && (
                    <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Select Profile →
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Users / Specialists Grid */
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '14px' }}>
              {filteredUsers.map(u => (
                <div
                  key={u.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '10px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'rgba(0, 240, 255, 0.15)',
                      color: '#00f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800'
                    }}>
                      {u.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                        {u.full_name}
                      </h4>
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>@{u.username}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginBottom: '6px' }}>
                    <ShieldCheck size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    {u.role}
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1' }}>
                    <div>✉️ {u.email}</div>
                    {u.phone && <div>📞 {u.phone}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '12px 24px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(15, 23, 42, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#94a3b8'
        }}>
          <div>
            SQLite Engine: <code>backend/ezship_addressbook.db</code> | Compliant with 49 CFR § 172.201 / IATA DGR 8.1.3
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
