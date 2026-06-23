import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    Building, LogOut, Bed, Activity, Users, Settings, 
    Plus, X, Save, CheckCircle, ShieldAlert, Navigation, 
    Truck, FileText, AlertCircle, MapPin, Clock, Sun, Moon
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

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

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
    const [hospitalInfo, setHospitalInfo] = useState(() => {
        try {
            const saved = localStorage.getItem('hospital_info_config');
            return saved ? JSON.parse(saved) : {
                name: "MedCan General Hospital",
                bedsAvailable: 45,
                facilities: ["Emergency Oncology", "Radiotherapy", "Chemotherapy Ward", "ICU", "Blood Bank"],
                address: "Sector 62, Noida, Uttar Pradesh, India",
                lat: 28.6288,
                lng: 77.3662
            };
        } catch (e) {
            return {
                name: "MedCan General Hospital",
                bedsAvailable: 45,
                facilities: ["Emergency Oncology", "Radiotherapy", "Chemotherapy Ward", "ICU", "Blood Bank"],
                address: "Sector 62, Noida, Uttar Pradesh, India",
                lat: 28.6288,
                lng: 77.3662
            };
        }
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ ...hospitalInfo });
    const [newFacility, setNewFacility] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [activeTab, setActiveTab] = useState('overview');
    const [referrals, setReferrals] = useState([]);

    // Leaflet refs for settings/config map
    const configMapRef = useRef(null);
    const configMapInstance = useRef(null);
    const configMarkerRef = useRef(null);
    const configTileLayerRef = useRef(null);
    
    // Live SOS emergency states
    const [activeSos, setActiveSos] = useState(null);
    const [ambulancePos, setAmbulancePos] = useState({ lat: 28.6272, lng: 77.3726 });
    const [eta, setEta] = useState(10);
    const [progress, setProgress] = useState(0);
    const [mapTheme, setMapTheme] = useState('dark'); // 'dark' or 'light'

    // Leaflet map refs for mini-tracker
    const miniMapRef = useRef(null);
    const miniMapInstance = useRef(null);
    const tileLayerRef = useRef(null);
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

    // Handle map theme switching in hospital mini map
    useEffect(() => {
        if (tileLayerRef.current && miniMapInstance.current) {
            const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            tileLayerRef.current.setUrl(mapTheme === 'dark' ? darkUrl : lightUrl);
        }
    }, [mapTheme]);

    // Geocode typed address and center the settings map
    const searchConfigAddress = async () => {
        if (!editForm.address || !editForm.address.trim()) return;
        setLoadingState(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(editForm.address)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                setEditForm(prev => ({
                    ...prev,
                    lat: parseFloat(lat.toFixed(5)),
                    lng: parseFloat(lng.toFixed(5))
                }));
                if (configMapInstance.current) {
                    configMapInstance.current.setView([lat, lng], 15);
                }
            } else {
                alert("Address location not found. Drag and place pin manually.");
            }
        } catch (e) {
            console.error("Geocoding failed", e);
            alert("Search service currently offline.");
        } finally {
            setLoadingState(false);
        }
    };

    // Initialize/Update interactive hospital location settings map
    useEffect(() => {
        if (activeTab !== 'location') {
            if (configMapInstance.current) {
                configMapInstance.current.remove();
                configMapInstance.current = null;
            }
            return;
        }

        loadLeaflet().then((L) => {
            if (!configMapRef.current) return;

            const lat = parseFloat(editForm.lat) || 28.6288;
            const lng = parseFloat(editForm.lng) || 77.3662;

            if (!configMapInstance.current) {
                configMapInstance.current = L.map(configMapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([lat, lng], 14);

                const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
                const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

                configTileLayerRef.current = L.tileLayer(mapTheme === 'dark' ? darkUrl : lightUrl, {
                    maxZoom: 19
                }).addTo(configMapInstance.current);

                const hospitalIcon = L.divIcon({
                    html: `
                        <div class="flex flex-col items-center">
                            <div class="w-8 h-8 rounded-full bg-red-600 text-white border-2 border-slate-900 flex items-center justify-center text-xs font-black shadow-lg animate-bounce">
                                H
                            </div>
                            <div class="w-0.5 h-2 bg-red-600"></div>
                        </div>
                    `,
                    className: 'custom-config-pin',
                    iconSize: [32, 40],
                    iconAnchor: [16, 40]
                });

                configMarkerRef.current = L.marker([lat, lng], {
                    draggable: true,
                    icon: hospitalIcon
                }).addTo(configMapInstance.current);

                configMarkerRef.current.on('dragend', () => {
                    const position = configMarkerRef.current.getLatLng();
                    setEditForm(prev => ({
                        ...prev,
                        lat: parseFloat(position.lat.toFixed(5)),
                        lng: parseFloat(position.lng.toFixed(5))
                    }));
                });
            } else {
                configMapInstance.current.setView([lat, lng]);
                configMarkerRef.current.setLatLng([lat, lng]);
            }
        });
    }, [activeTab, editForm.lat, editForm.lng]);

    // Handle map theme switching on config map
    useEffect(() => {
        if (configTileLayerRef.current && configMapInstance.current) {
            const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            configTileLayerRef.current.setUrl(mapTheme === 'dark' ? darkUrl : lightUrl);
        }
    }, [mapTheme]);

    const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    // Animate ambulance tracking progress along OSRM coordinates
    useEffect(() => {
        if (activeSos) {
            const start = activeSos.coordinates || { lat: 28.6272, lng: 77.3726 };
            const hospitalId = activeSos.hospitalId;
            const destination = hospitalLocations[hospitalId] || hospitalLocations['h1'];
            
            // OSRM route coordinates passed from patient dashboard
            const routePath = activeSos.routeCoordinates || [
                [start.lat, start.lng],
                [start.lat, destination.lng],
                [destination.lat, destination.lng]
            ];

            setAmbulancePos(start);
            setProgress(0);
            setEta(Math.floor(Math.random() * 5 + 6));

            if (trackingInterval.current) clearInterval(trackingInterval.current);

            trackingInterval.current = setInterval(() => {
                const savedAmbulancePos = localStorage.getItem('active_ambulance_pos');
                if (savedAmbulancePos) {
                    const parsedPos = JSON.parse(savedAmbulancePos);
                    setAmbulancePos(parsedPos);
                    
                    // Calculate dynamic ETA using Haversine formula
                    const dist = calculateHaversineDistance(parsedPos.lat, parsedPos.lng, destination.lat, destination.lng);
                    setEta(Math.max(0, Math.ceil(dist * 1.5)));
                    return;
                }

                setProgress(prev => {
                    const nextProgress = prev + 5;
                    if (nextProgress >= 100) {
                        clearInterval(trackingInterval.current);
                        setEta(0);
                        setAmbulancePos(destination);
                        return 100;
                    }
                    
                    const ratio = nextProgress / 100;
                    
                    // Stepping ambulance marker along actual OSRM road coordinates
                    const index = Math.floor(ratio * (routePath.length - 1));
                    const currentCoords = routePath[index] || routePath[routePath.length - 1];
                    
                    const newPos = { lat: currentCoords[0], lng: currentCoords[1] };
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
            
            const routePath = activeSos.routeCoordinates || [
                [start.lat, start.lng],
                [start.lat, destination.lng],
                [destination.lat, destination.lng]
            ];

            if (!miniMapInstance.current) {
                miniMapInstance.current = L.map(miniMapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([start.lat, start.lng], 13);

                const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
                const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

                tileLayerRef.current = L.tileLayer(mapTheme === 'dark' ? darkUrl : lightUrl, {
                    maxZoom: 19
                }).addTo(miniMapInstance.current);

                markersGroup.current = L.layerGroup().addTo(miniMapInstance.current);

                // Draw red polyline routing
                routeLine.current = L.polyline(routePath, {
                    color: '#ef4444', // Red routing path
                    weight: 4,
                    opacity: 0.85,
                    dashArray: '8, 6',
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

                miniMapInstance.current.fitBounds(L.latLngBounds(routePath), { padding: [20, 20] });
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
            localStorage.setItem('hospital_info_config', JSON.stringify(editForm));
            
            // Sync with global custom_hospital_locations for patient/driver mapping
            const customLocations = {
                'h1': {
                    name: editForm.name,
                    address: editForm.address,
                    coords: { lat: parseFloat(editForm.lat) || 28.6288, lng: parseFloat(editForm.lng) || 77.3662 },
                    bedsAvailable: editForm.bedsAvailable,
                    facilities: editForm.facilities
                }
            };
            localStorage.setItem('custom_hospital_locations', JSON.stringify(customLocations));
            window.dispatchEvent(new Event('storage'));

            setIsEditing(false);
            setLoadingState(false);
            setSuccessMsg('Hospital details and location updated successfully!');
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
                        onClick={() => setActiveTab('location')}
                        style={{ 
                            padding: '12px 16px', 
                            borderRadius: '12px', 
                            display: 'flex', alignItems: 'center', gap: '12px', 
                            fontWeight: '600', cursor: 'pointer',
                            background: activeTab === 'location' ? '#eff6ff' : 'transparent',
                            color: activeTab === 'location' ? '#1d4ed8' : 'var(--text-secondary)'
                        }}
                    >
                        <MapPin size={20} />
                        Location & Profile
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
                                            <div className="w-full lg:w-[280px] bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-[280px] relative">
                                                
                                                {/* Floating Theme Toggle inside Hospital Mini Tracker */}
                                                <button 
                                                    onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                                                    className="absolute top-6 right-6 z-10 p-1.5 rounded-xl border bg-slate-900/90 border-slate-700 text-slate-100 hover:bg-slate-800 shadow-md backdrop-blur-sm transition-all"
                                                    title={mapTheme === 'dark' ? "Switch to Bright Map" : "Switch to Dark Map"}
                                                    style={{ height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                >
                                                    {mapTheme === 'dark' ? <Sun size={12} className="text-amber-400" /> : <Moon size={12} className="text-slate-400" />}
                                                </button>

                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Truck size={12} className="text-red-500" /> Ambulance GPS
                                                        </h4>
                                                        <span className="text-[9px] font-bold px-2 py-0.5 bg-red-950/60 text-red-400 rounded-full border border-red-900/40 animate-pulse mr-8">
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

                                                <div style={{ marginTop: '6px', textAlign: 'center' }}>
                                                    <a 
                                                        href="/driver" 
                                                        target="_blank" 
                                                        rel="noreferrer" 
                                                        style={{ 
                                                            fontSize: '9px', 
                                                            fontWeight: 'bold', 
                                                            color: '#fca5a5', 
                                                            textDecoration: 'underline', 
                                                            display: 'inline-flex', 
                                                            alignItems: 'center', 
                                                            gap: '3px' 
                                                        }}
                                                    >
                                                        Launch Driver HUD ↗
                                                    </a>
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

                    {activeTab === 'location' && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                            <div style={{ marginBottom: '32px' }}>
                                <h1 style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 8px 0' }}>Hospital Location & Profile</h1>
                                <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '1.1rem' }}>Configure your clinic's physical address, beds availability, and coordinates on the live navigation system.</p>
                            </div>
                            
                            {/* Success Toast */}
                            <AnimatePresence>
                                {successMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        style={{ background: '#dcfce7', color: '#166534', padding: '16px', borderRadius: '12px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500' }}
                                    >
                                        <CheckCircle size={20} />
                                        {successMsg}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                                
                                {/* Form Inputs */}
                                <div className="card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Profile Info</h3>
                                    
                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ fontWeight: '600' }}>Hospital Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.name} 
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            style={{ paddingLeft: '16px', backgroundColor: '#f9fafb' }}
                                        />
                                    </div>

                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ fontWeight: '600' }}>Physical Address</label>
                                        <div style={{ display: 'flex', gap: '12px' }}>
                                            <input 
                                                type="text" 
                                                value={editForm.address} 
                                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                                placeholder="Street, City, Postal Code..."
                                                style={{ paddingLeft: '16px', backgroundColor: '#f9fafb', flex: 1 }}
                                            />
                                            <button 
                                                onClick={searchConfigAddress}
                                                className="btn-secondary"
                                                style={{ padding: '0 16px', fontSize: '0.8rem', fontWeight: '700' }}
                                            >
                                                Pinpoint
                                            </button>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label style={{ fontWeight: '600' }}>Latitude</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                value={editForm.lat} 
                                                onChange={(e) => setEditForm({ ...editForm, lat: parseFloat(e.target.value) || 0 })}
                                                style={{ paddingLeft: '16px', backgroundColor: '#f9fafb' }}
                                            />
                                        </div>
                                        <div className="input-group" style={{ margin: 0 }}>
                                            <label style={{ fontWeight: '600' }}>Longitude</label>
                                            <input 
                                                type="number" 
                                                step="any"
                                                value={editForm.lng} 
                                                onChange={(e) => setEditForm({ ...editForm, lng: parseFloat(e.target.value) || 0 })}
                                                style={{ paddingLeft: '16px', backgroundColor: '#f9fafb' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="input-group" style={{ margin: 0 }}>
                                        <label style={{ fontWeight: '600' }}>Operational Beds Count</label>
                                        <input 
                                            type="number" 
                                            value={editForm.bedsAvailable} 
                                            onChange={(e) => setEditForm({ ...editForm, bedsAvailable: parseInt(e.target.value) || 0 })}
                                            style={{ paddingLeft: '16px', backgroundColor: '#f9fafb' }}
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSave} 
                                        className="btn" 
                                        style={{ marginTop: '16px', background: '#4f46e5', borderColor: '#4f46e5', display: 'flex', alignItems: 'center', justify: 'center', gap: '8px' }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Saving...' : <><Save size={18} /> Save Profile & GPS</>}
                                    </button>
                                </div>

                                {/* Interactive Map Configurator */}
                                <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '480px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>GPS Coordinates Map</h3>
                                        
                                        {/* Bright Map Toggle */}
                                        <button 
                                            onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb',
                                                background: mapTheme === 'dark' ? '#1f2937' : '#f9fafb',
                                                color: mapTheme === 'dark' ? 'white' : '#1f2937',
                                                fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px'
                                            }}
                                        >
                                            {mapTheme === 'dark' ? <Sun size={12} style={{ color: '#fbbf24' }} /> : <Moon size={12} style={{ color: '#4f46e5' }} />}
                                            {mapTheme === 'dark' ? 'Bright Map' : 'Dark Map'}
                                        </button>
                                    </div>

                                    {/* Map Container */}
                                    <div style={{ flex: 1, position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <div ref={configMapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />
                                    </div>

                                    <div style={{ marginTop: '16px', background: '#f3f4f6', padding: '12px', borderRadius: '12px', fontSize: '0.75rem', color: '#4b5563', lineHeight: '1.4' }}>
                                        💡 **Tip**: You can drag the red hospital pin on the map to set your hospital location precisely. The latitude and longitude will update automatically.
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HospitalDashboard;
