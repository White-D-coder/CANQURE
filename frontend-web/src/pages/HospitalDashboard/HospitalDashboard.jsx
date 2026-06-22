import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Building, LogOut, Bed, Activity, Users, Settings, Plus, X, Save, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

function HospitalDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [hospitalInfo, setHospitalInfo] = useState({
        name: "MedCan General Hospital",
        bedsAvailable: 45,
        facilities: ["Emergency Oncology", "Radiotherapy", "Chemotherapy Ward", "ICU", "Blood Bank"]
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ ...hospitalInfo });
    const [newFacility, setNewFacility] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [referrals, setReferrals] = useState([]);

    useEffect(() => {
        if (activeTab === 'routing') {
            fetchReferrals();
        }
    }, [activeTab]);

    const fetchReferrals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/hospitals/dashboard/appointments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReferrals(res.data);
        } catch (error) {
            console.error("Failed to fetch referrals:", error);
        }
    };

    const handleStatusUpdate = async (dbId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await api.put(`/hospitals/dashboard/appointments/${dbId}/status`, { status: newStatus }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReferrals(referrals.map(r => r.dbId === dbId ? { ...r, status: newStatus } : r));
            setSuccessMsg('Patient status updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSave = async () => {
        setIsLoading(true);
        // Here we would typically make an API call to update the backend
        // await api.put('/hospitals/update', editForm);
        
        // Simulating API delay
        setTimeout(() => {
            setHospitalInfo({ ...editForm });
            setIsEditing(false);
            setIsLoading(false);
            setSuccessMsg('Hospital details updated successfully!');
            setTimeout(() => setSuccessMsg(''), 3000);
        }, 800);
    };

    const addFacility = () => {
        if (newFacility.trim() && !editForm.facilities.includes(newFacility.trim())) {
            setEditForm({
                ...editForm,
                facilities: [...editForm.facilities, newFacility.trim()]
            });
            setNewFacility('');
        }
    };

    const removeFacility = (facilityToRemove) => {
        setEditForm({
            ...editForm,
            facilities: editForm.facilities.filter(f => f !== facilityToRemove)
        });
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
            {/* Sidebar */}
            <div style={{ width: '280px', background: 'white', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building size={20} color="white" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>CanCure</h2>
                            <span style={{ fontSize: '0.75rem', color: '#6366f1', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hospital Portal</span>
                        </div>
                    </div>
                </div>

                <nav style={{ flex: 1, padding: '24px 16px' }}>
                    <div 
                        onClick={() => setActiveTab('overview')}
                        style={{ 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            display: 'flex', alignItems: 'center', gap: '12px', 
                            fontWeight: '600', marginBottom: '8px', cursor: 'pointer',
                            background: activeTab === 'overview' ? '#eff6ff' : 'transparent',
                            color: activeTab === 'overview' ? '#1d4ed8' : 'var(--text-secondary)'
                        }}
                    >
                        <Activity size={20} />
                        Facility Overview
                    </div>
                    <div 
                        onClick={() => setActiveTab('routing')}
                        style={{ 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            display: 'flex', alignItems: 'center', gap: '12px', 
                            fontWeight: '600', marginBottom: '8px', cursor: 'pointer',
                            background: activeTab === 'routing' ? '#eff6ff' : 'transparent',
                            color: activeTab === 'routing' ? '#1d4ed8' : 'var(--text-secondary)'
                        }}
                    >
                        <Users size={20} />
                        Patient Routing
                    </div>
                    <div 
                        onClick={() => setActiveTab('network')}
                        style={{ 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            display: 'flex', alignItems: 'center', gap: '12px', 
                            fontWeight: '600', cursor: 'pointer',
                            background: activeTab === 'network' ? '#eff6ff' : 'transparent',
                            color: activeTab === 'network' ? '#1d4ed8' : 'var(--text-secondary)'
                        }}
                    >
                        <Settings size={20} />
                        Network Settings
                    </div>
                </nav>

                <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5', fontWeight: 'bold' }}>
                            HA
                        </div>
                        <div>
                            <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem' }}>Hospital Admin</p>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{user?.email || 'admin@hospital.com'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    
                    {activeTab === 'overview' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                                <div>
                                    <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Facility Status</h1>
                                    <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Manage current bed availability and operational facilities.</p>
                                </div>
                                {!isEditing ? (
                                    <button onClick={() => setIsEditing(true)} className="btn" style={{ background: '#4f46e5', borderColor: '#4f46e5' }}>
                                        Edit Status
                                    </button>
                                ) : (
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => { setIsEditing(false); setEditForm({ ...hospitalInfo }); }} className="btn-secondary">
                                            Cancel
                                        </button>
                                        <button onClick={handleSave} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} disabled={isLoading}>
                                            {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}
                                    >
                                        <CheckCircle size={20} />
                                        {successMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                                
                                {/* Beds Card */}
                                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                        <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '12px', color: '#ef4444' }}>
                                            <Bed size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Available Beds</h3>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Oncology Ward</p>
                                        </div>
                                    </div>
                                    
                                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {!isEditing ? (
                                            <div style={{ textAlign: 'center' }}>
                                                <span style={{ fontSize: '4rem', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1 }}>{hospitalInfo.bedsAvailable}</span>
                                                <span style={{ display: 'block', color: 'var(--text-secondary)', fontWeight: '500', marginTop: '8px' }}>Beds Ready</span>
                                            </div>
                                        ) : (
                                            <div style={{ width: '100%' }}>
                                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>Update Count</label>
                                                <input 
                                                    type="number" 
                                                    min="0"
                                                    value={editForm.bedsAvailable}
                                                    onChange={(e) => setEditForm({...editForm, bedsAvailable: parseInt(e.target.value) || 0})}
                                                    style={{ width: '100%', padding: '16px', fontSize: '2rem', textAlign: 'center', borderRadius: '12px', border: '2px solid #e5e7eb', fontWeight: '700', color: 'var(--text-primary)' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Facilities Card */}
                                <div className="card" style={{ padding: '24px', overflow: 'visible' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                        <div style={{ background: '#e0e7ff', padding: '12px', borderRadius: '12px', color: '#4f46e5' }}>
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Active Facilities</h3>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Services currently operational</p>
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <div style={{ position: 'relative', marginBottom: '24px', zIndex: 10 }}>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <input 
                                                    type="text" 
                                                    placeholder="Type to search facilities..."
                                                    value={newFacility}
                                                    onChange={(e) => setNewFacility(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && addFacility()}
                                                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', outline: 'none' }}
                                                />
                                                <button onClick={addFacility} className="btn" style={{ padding: '12px', background: '#4f46e5', borderColor: '#4f46e5' }}>
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                            
                                            {/* Suggestions Dropdown */}
                                            {newFacility.trim() && (
                                                <div style={{ 
                                                    position: 'absolute', top: '100%', left: 0, right: '52px', 
                                                    background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', 
                                                    marginTop: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 
                                                    maxHeight: '200px', overflowY: 'auto' 
                                                }}>
                                                    {["Emergency Oncology", "Radiotherapy", "Chemotherapy Ward", "ICU", "Blood Bank", "MRI Scanner", "PET Scan", "CT Scan", "Surgical Oncology", "Palliative Care", "Bone Marrow Transplant", "Outpatient Clinic", "Diagnostic Imaging", "Pharmacy", "Pathology Lab", "Immunotherapy"]
                                                        .filter(f => f.toLowerCase().includes(newFacility.toLowerCase()) && !editForm.facilities.includes(f))
                                                        .map((facility, idx) => (
                                                        <div 
                                                            key={idx}
                                                            onClick={() => {
                                                                setEditForm({ ...editForm, facilities: [...editForm.facilities, facility] });
                                                                setNewFacility('');
                                                            }}
                                                            style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6', color: '#374151', fontSize: '0.9rem' }}
                                                            onMouseOver={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                                            onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                                                        >
                                                            {facility}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                        {(isEditing ? editForm.facilities : hospitalInfo.facilities).map((facility, idx) => (
                                            <motion.div 
                                                key={idx}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                style={{ 
                                                    background: '#f3f4f6', 
                                                    padding: '10px 16px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '0.9rem', 
                                                    fontWeight: '500', 
                                                    color: '#374151',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    border: '1px solid #e5e7eb'
                                                }}
                                            >
                                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                                                {facility}
                                                {isEditing && (
                                                    <button 
                                                        onClick={() => removeFacility(facility)}
                                                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: '4px', color: '#9ca3af' }}
                                                        onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                                        onMouseOut={(e) => e.currentTarget.style.color = '#9ca3af'}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                        {(isEditing ? editForm.facilities : hospitalInfo.facilities).length === 0 && (
                                            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', margin: 0 }}>No facilities listed.</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'routing' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Patient Routing</h1>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Manage incoming patient referrals and admissions.</p>
                            </div>

                            <div className="card" style={{ overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead>
                                        <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                            <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Patient ID</th>
                                            <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Name</th>
                                            <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Condition</th>
                                            <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Referred By</th>
                                            <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Urgency</th>
                                            <th style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {referrals.map((patient, i) => (
                                            <tr key={patient.dbId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                                <td style={{ padding: '16px 24px', fontWeight: '500', color: '#6366f1' }}>{patient.id}</td>
                                                <td style={{ padding: '16px 24px', fontWeight: '600', color: 'var(--text-primary)' }}>{patient.name}</td>
                                                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{patient.condition}</td>
                                                <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{patient.ref}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ 
                                                        padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                                                        background: patient.urgency === 'URGENT' || patient.urgency === 'EMERGENCY' ? '#fee2e2' : '#e0e7ff',
                                                        color: patient.urgency === 'URGENT' || patient.urgency === 'EMERGENCY' ? '#b91c1c' : '#4338ca'
                                                    }}>
                                                        {patient.urgency}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <select 
                                                        value={patient.status}
                                                        onChange={(e) => handleStatusUpdate(patient.dbId, e.target.value)}
                                                        style={{ 
                                                            padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600',
                                                            border: '1px solid #e5e7eb', outline: 'none', cursor: 'pointer',
                                                            background: patient.status === 'ACCEPTED' ? '#dcfce7' : patient.status === 'REROUTED' ? '#f3f4f6' : '#fef3c7',
                                                            color: patient.status === 'ACCEPTED' ? '#166534' : patient.status === 'REROUTED' ? '#4b5563' : '#b45309'
                                                        }}
                                                    >
                                                        <option value="PENDING" style={{ background: 'white', color: 'black' }}>Pending</option>
                                                        <option value="ACCEPTED" style={{ background: 'white', color: 'black' }}>Accepted</option>
                                                        <option value="REROUTED" style={{ background: 'white', color: 'black' }}>Rerouted</option>
                                                        <option value="SCHEDULED" style={{ background: 'white', color: 'black' }}>Scheduled</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                        {referrals.length === 0 && (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                                    No incoming referrals found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'network' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            <div style={{ marginBottom: '32px' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Network Settings</h1>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Manage connections with sister clinics and external referral logic.</p>
                            </div>
                            
                            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                                <Settings size={48} color="#9ca3af" style={{ margin: '0 auto 16px' }} />
                                <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Network Configuration</h3>
                                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>Cross-hospital connectivity settings will be available in Phase 2 of the architecture rollout.</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HospitalDashboard;
