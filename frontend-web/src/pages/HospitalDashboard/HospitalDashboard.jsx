import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Building, LogOut, Bed, Activity, Users, Settings, 
    Plus, X, Save, CheckCircle, ShieldAlert, Navigation, 
    Truck, FileText, AlertCircle, MapPin, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

// Helper to dynamically load Leaflet from CDN
const loadLeaflet = () => {
    return new Promise((resolve) => {
        if (window.L) {
            resolve(window.L);
            return;
        }

        // Inject Leaflet CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        // Inject Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve(window.L);
        document.head.appendChild(script);
    });
};

function HospitalDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLoading, setLoadingState] = useState(false);
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
    
    // Live SOS emergency states
    const [activeSos, setActiveSos] = useState(null);
    const [ambulancePos, setAmbulancePos] = useState({ lat: 28.6272, lng: 77.3726 });
    const [eta, setEta] = useState(10);
    const [progress, setProgress] = useState(0);

    // Leaflet map refs for mini-tracker
    const miniMapRef = useRef(null);
    const miniMapInstance = useRef(null);
    const markersGroup = useRef(null);
    const routeLine = useRef(null);
    const ambulanceMarker = useRef(null);
    const LRef = useRef(null);
    const trackingInterval = useRef(null);

    const hospitalLocations = {
        'h1': { lat: 28.6288, lng: 77.3662, name: 'Medanta Cancer Care Center' },
        'h2': { lat: 28.6241, lng: 77.3792, name: 'Fortis Hospital Oncology Wing' },
        'h3': { lat: 28.6365, lng: 77.3451, name: 'Max Super Speciality Hospital' },
        'h4': { lat: 28.5672, lng: 77.2100, name: 'AIIMS Cancer Institute' },
    };

    useEffect(() => {
        if (activeTab === 'routing') {
            fetchReferrals();
        }
    }, [activeTab]);

    useEffect(() => {
        checkActiveSos();

        const handleStorageChange = () => {
            checkActiveSos();
        };
        window.addEventListener('storage', handleStorageChange);
        
        const pollInterval = setInterval(() => {
            if (activeTab === 'routing') {
                fetchReferrals();
            }
        }, 5000);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(pollInterval);
            if (trackingInterval.current) clearInterval(trackingInterval.current);
            if (miniMapInstance.current) {
                miniMapInstance.current.remove();
                miniMapInstance.current = null;
            }
        };
    }, [activeTab]);

    // Animate ambulance tracking progress along real geolocations
    useEffect(() => {
        if (activeSos) {
            const start = activeSos.coordinates || { lat: 28.6272, lng: 77.3726 };
            const hospitalId = activeSos.hospitalId;
            const destination = hospitalLocations[hospitalId] || hospitalLocations['h1'];

            setAmbulancePos(start);
            setProgress(0);
            setEta(Math.floor(Math.random() * 5 + 6));

            if (trackingInterval.current) clearInterval(trackingInterval.current);

            trackingInterval.current = setInterval(() => {
                setProgress(prev => {
                    const nextProgress = prev + 5;
                    if (nextProgress >= 100) {
                        clearInterval(trackingInterval.current);
                        setEta(0);
                        setAmbulancePos(destination);
                        return 100;
                    }
                    
                    const ratio = nextProgress / 100;
                    // Interpolate latitude and longitude
                    const currentLat = start.lat + (destination.lat - start.lat) * ratio;
                    const currentLng = start.lng + (destination.lng - start.lng) * ratio;

                    const newPos = { lat: currentLat, lng: currentLng };
                    setAmbulancePos(newPos);
                    setEta(Math.max(1, Math.floor((1 - ratio) * 8)));
                    return nextProgress;
                });
            }, 3000);
        } else {
            if (trackingInterval.current) clearInterval(trackingInterval.current);
            if (miniMapInstance.current) {
                miniMapInstance.current.remove();
                miniMapInstance.current = null;
            }
        }
    }, [activeSos]);

    // Initialize/Update Live Map Tracker inside Hospital Portal
    useEffect(() => {
        if (!activeSos || activeTab !== 'routing') return;

        loadLeaflet().then((L) => {
            LRef.current = L;
            if (!miniMapRef.current) return;

            const start = activeSos.coordinates || { lat: 28.6272, lng: 77.3726 };
            const hospitalId = activeSos.hospitalId;
            const destination = hospitalLocations[hospitalId] || hospitalLocations['h1'];

            if (!miniMapInstance.current) {
                miniMapInstance.current = L.map(miniMapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([start.lat, start.lng], 13);

                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(miniMapInstance.current);

                markersGroup.current = L.layerGroup().addTo(miniMapInstance.current);

                // Draw red polyline routing
                const pathCoordinates = [
                    [start.lat, start.lng],
                    [start.lat, destination.lng],
                    [destination.lat, destination.lng]
                ];

                routeLine.current = L.polyline(pathCoordinates, {
                    color: '#ef4444', // Red routing path
                    weight: 3,
                    opacity: 0.8,
                    dashArray: '5, 5',
                    className: 'route-path-animation'
                }).addTo(miniMapInstance.current);

                // Patient Start Marker (Pulsing Blue)
                const patientHtml = `<div class="w-3.5 h-3.5 rounded-full bg-indigo-500 border border-white"></div>`;
                const patientIcon = L.divIcon({ html: patientHtml, iconSize: [14, 14], iconAnchor: [7, 7] });
                L.marker([start.lat, start.lng], { icon: patientIcon }).addTo(markersGroup.current);

                // Hospital Destination Marker (Green/Red pin)
                const destHtml = `<div class="w-5 h-5 rounded-full bg-emerald-600 border border-white flex items-center justify-center text-[7px] font-black text-white">H</div>`;
                const destIcon = L.divIcon({ html: destHtml, iconSize: [20, 20], iconAnchor: [10, 10] });
                L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(markersGroup.current);

                // Ambulance Marker (Moving red truck icon)
                const ambulanceHtml = `
                    <div class="relative flex items-center justify-center">
                        <span class="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-60"></span>
                        <div class="w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center border border-white shadow-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.5-1.1L18 7h-4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                        </div>
                    </div>
                `;
                const ambulanceIcon = L.divIcon({ html: ambulanceHtml, iconSize: [20, 20], iconAnchor: [10, 10] });
                ambulanceMarker.current = L.marker([start.lat, start.lng], { icon: ambulanceIcon }).addTo(miniMapInstance.current);

                miniMapInstance.current.fitBounds(L.latLngBounds(pathCoordinates), { padding: [20, 20] });
            }
        });
    }, [activeSos, activeTab]);

    // Update ambulance marker coordinates on position change
    useEffect(() => {
        if (ambulanceMarker.current && miniMapInstance.current && LRef.current) {
            ambulanceMarker.current.setLatLng([ambulancePos.lat, ambulancePos.lng]);
        }
    }, [ambulancePos]);

    const checkActiveSos = () => {
        try {
            const rawAlert = localStorage.getItem('active_sos_alert');
            if (rawAlert) {
                const parsed = JSON.parse(rawAlert);
                setActiveSos(parsed);
            } else {
                setActiveSos(null);
            }
        } catch (error) {
            console.error('Failed to parse SOS alert:', error);
        }
    };

    const fetchReferrals = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/hospitals/dashboard/appointments', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReferrals(res.data);

            const activeDbSos = res.data.find(apt => apt.status === 'SOS_BROADCAST');
            if (activeDbSos && !activeSos) {
                setActiveSos({
                    patientId: activeDbSos.dbId,
                    patientName: activeDbSos.name,
                    hospitalId: 'h1',
                    hospitalName: hospitalInfo.name,
                    address: 'GPS Pinpoint Coordinates',
                    coordinates: { lat: 28.6272, lng: 77.3726 },
                    urgency: 'EMERGENCY',
                    condition: activeDbSos.condition || 'Oncology SOS Intake'
                });
            }
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
            
            if (activeSos && (activeSos.patientId === dbId || activeSos.patientName === referrals.find(r => r.dbId === dbId)?.name)) {
                localStorage.removeItem('active_sos_alert');
                setActiveSos(null);
                window.dispatchEvent(new Event('storage'));
            }

            if (newStatus === 'ACCEPTED') {
                setHospitalInfo(prev => ({
                    ...prev,
                    bedsAvailable: Math.max(0, prev.bedsAvailable - 1)
                }));
            }

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
        setLoadingState(true);
        setTimeout(() => {
            setHospitalInfo({ ...editForm });
            setIsEditing(false);
            setLoadingState(false);
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
                        <div className="relative">
                            <Users size={20} />
                            {activeSos && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-600 rounded-full animate-ping"></span>
                            )}
                        </div>
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
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Patient Routing & Triage</h1>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Manage incoming patient referrals and active emergencies.</p>
                            </div>

                            {/* Success Toast */}
                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl font-semibold flex items-center gap-3 border border-emerald-200 text-sm mb-6"
                                    >
                                        <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                                        {successMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Active SOS Emergency Intake Stream Panel */}
                            <AnimatePresence>
                                {activeSos && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.96 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.96 }}
                                        className="bg-slate-900 border-2 border-red-600 rounded-3xl p-6 mb-8 text-white relative shadow-xl shadow-red-900/10 overflow-hidden"
                                    >
                                        {/* Glow effect */}
                                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-red-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>

                                        <div className="flex flex-col lg:flex-row gap-6 relative z-10">
                                            
                                            {/* Intake details & clinical brief */}
                                            <div className="flex-1 space-y-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="flex h-3 w-3 relative">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                                    </span>
                                                    <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">CRITICAL SOS INTAKE ACTIVE</span>
                                                </div>

                                                <div>
                                                    <h3 className="text-xl font-black text-white">{activeSos.patientName}</h3>
                                                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                                        <MapPin size={12} className="text-red-500" /> Dispatch Location: {activeSos.address}
                                                    </p>
                                                </div>

                                                {/* Pre-read Snippet */}
                                                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-1.5 text-red-400 font-bold text-[10px] uppercase tracking-wider">
                                                        <FileText size={12} /> Live AI Pre-Read Summary
                                                    </div>
                                                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                                                        Stage 2 Invasive Ductal Carcinoma. Patient currently undergoing targeted hormone therapy (Tamoxifen). Side effects checked: acute chest discomfort and shortness of breath (flagged as critical). No known medicine allergies.
                                                    </p>
                                                    <div className="flex flex-wrap gap-2 pt-1">
                                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-red-950 text-red-400 rounded-full border border-red-900/50">Urgent Triage</span>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-900 text-slate-400 rounded-full">Ambulance Dispatch</span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button 
                                                        onClick={() => {
                                                            const referralObj = referrals.find(r => r.name === activeSos.patientName || r.urgency === 'EMERGENCY');
                                                            if (referralObj) {
                                                                handleStatusUpdate(referralObj.dbId, 'ACCEPTED');
                                                            } else {
                                                                localStorage.removeItem('active_sos_alert');
                                                                setActiveSos(null);
                                                            }
                                                        }}
                                                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/30"
                                                    >
                                                        <CheckCircle size={15} /> Accept Intake & Acknowledge
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const referralObj = referrals.find(r => r.name === activeSos.patientName || r.urgency === 'EMERGENCY');
                                                            if (referralObj) {
                                                                handleStatusUpdate(referralObj.dbId, 'REROUTED');
                                                            } else {
                                                                localStorage.removeItem('active_sos_alert');
                                                                setActiveSos(null);
                                                            }
                                                        }}
                                                        className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition-all border border-slate-700"
                                                    >
                                                        Reroute
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Live Route Map Tracker */}
                                            <div className="w-full lg:w-[280px] bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[280px]">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Truck size={12} className="text-red-500" /> Ambulance GPS
                                                        </h4>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-red-950/60 text-red-400 rounded-full border border-red-900/40 animate-pulse">
                                                            Live Tracker
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Mini Map Container */}
                                                    <div className="h-[156px] rounded-xl relative border border-slate-800 overflow-hidden bg-slate-950">
                                                        <div ref={miniMapRef} className="absolute inset-0 h-full w-full bg-slate-950" />
                                                        
                                                        <style>{`
                                                            .route-path-animation {
                                                                stroke-dasharray: 6, 6;
                                                                animation: dashRoute 8s linear infinite;
                                                            }
                                                        `}</style>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2 border-t border-slate-800 pt-3">
                                                    <span>Estimated Intake:</span>
                                                    <span className="font-black text-red-400 text-xs flex items-center gap-1">
                                                        <Clock size={11} /> {eta > 0 ? `~${eta} mins` : 'ARRIVED'}
                                                    </span>
                                                </div>
                                            </div>

                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Referrals & Routing Table */}
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
                                        {referrals.map((patient, i) => {
                                            const isSos = patient.status === 'SOS_BROADCAST' || patient.urgency === 'EMERGENCY';
                                            return (
                                                <tr 
                                                    key={patient.dbId} 
                                                    style={{ 
                                                        borderBottom: '1px solid #f3f4f6',
                                                        background: isSos ? '#fff5f5' : 'white'
                                                    }}
                                                >
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
                                                                background: patient.status === 'ACCEPTED' ? '#dcfce7' : patient.status === 'REROUTED' ? '#f3f4f6' : patient.status === 'SOS_BROADCAST' ? '#fef2f2' : '#fef3c7',
                                                                color: patient.status === 'ACCEPTED' ? '#166534' : patient.status === 'REROUTED' ? '#4b5563' : patient.status === 'SOS_BROADCAST' ? '#ef4444' : '#b45309',
                                                                borderColor: patient.status === 'SOS_BROADCAST' ? '#fca5a5' : '#e5e7eb'
                                                            }}
                                                        >
                                                            <option value="PENDING" style={{ background: 'white', color: 'black' }}>Pending</option>
                                                            <option value="SOS_BROADCAST" style={{ background: 'white', color: 'black' }}>SOS Broadcast</option>
                                                            <option value="ACCEPTED" style={{ background: 'white', color: 'black' }}>Accepted</option>
                                                            <option value="REROUTED" style={{ background: 'white', color: 'black' }}>Rerouted</option>
                                                            <option value="SCHEDULED" style={{ background: 'white', color: 'black' }}>Scheduled</option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
