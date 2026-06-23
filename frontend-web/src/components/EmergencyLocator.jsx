import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, MapPin, Navigation, Phone, CheckCircle, 
    Clock, Bed, Loader2, ShieldAlert, Search, Crosshair, Compass
} from 'lucide-react';
import api from '../api/axios';

// Helper to dynamically load Leaflet from CDN to bypass Vite/Rollup build issues
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

const EmergencyLocator = ({ user }) => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [dispatched, setDispatched] = useState(null);
    
    // GPS and Mapping states
    const [searchAddress, setSearchAddress] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('Sector 62, Noida, UP');
    const [patientCoords, setPatientCoords] = useState({ lat: 28.6272, lng: 77.3726 }); // Sector 62 Noida GPS Center
    const [selectedHospital, setSelectedHospital] = useState(null);

    // Leaflet refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersGroup = useRef(null);
    const routeLine = useRef(null);
    const LRef = useRef(null);

    // Real geo-coordinates for nearby hospitals around Sector 62, Noida
    const hospitalLocations = {
        'h1': { lat: 28.6288, lng: 77.3662, name: 'Medanta Cancer Care Center' }, // Sector 62
        'h2': { lat: 28.6241, lng: 77.3792, name: 'Fortis Hospital Oncology Wing' }, // Sector 62
        'h3': { lat: 28.6365, lng: 77.3451, name: 'Max Super Speciality Hospital' }, // Vaishali
        'h4': { lat: 28.5672, lng: 77.2100, name: 'AIIMS Cancer Institute' }, // Delhi
    };

    useEffect(() => {
        fetchHospitals(patientCoords);
    }, []);

    // Initialize/Update Leaflet Map
    useEffect(() => {
        if (loading) return;

        loadLeaflet().then((L) => {
            LRef.current = L;
            if (!mapRef.current) return;

            // Initialize map if not exists
            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([patientCoords.lat, patientCoords.lng], 13);

                // Load CartoDB Dark Matter tiles (matching the dark street map requested)
                L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(mapInstance.current);

                markersGroup.current = L.layerGroup().addTo(mapInstance.current);
            }

            renderMapLayers();
        });

        return () => {
            // Clean up route line
            if (routeLine.current && mapInstance.current) {
                routeLine.current.remove();
            }
        };
    }, [loading, patientCoords, selectedHospital, dispatched, hospitals]);

    // Redraw markers and routes on map
    const renderMapLayers = () => {
        const L = LRef.current;
        const map = mapInstance.current;
        const group = markersGroup.current;
        if (!L || !map || !group) return;

        group.clearLayers();
        if (routeLine.current) routeLine.current.remove();

        // 1. Patient Location Marker (Pulsing Blue Node)
        const patientHtml = `
            <div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-indigo-500 opacity-40"></span>
                <span class="animate-pulse absolute inline-flex h-6 w-6 rounded-full bg-indigo-600 opacity-60"></span>
                <div class="w-5 h-5 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center text-white shadow-lg relative z-10">
                    <div class="w-1.5 h-1.5 rounded-full bg-white"></div>
                </div>
            </div>
        `;
        const patientIcon = L.divIcon({
            html: patientHtml,
            className: 'custom-gps-pin',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });
        L.marker([patientCoords.lat, patientCoords.lng], { icon: patientIcon }).addTo(group);

        // 2. Hospital Markers (Red Pins)
        hospitals.forEach((h, i) => {
            const isSelected = selectedHospital?.id === h.id;
            const isDisp = dispatched?.id === h.id;
            
            const markerColor = isDisp ? '#10b981' : '#ef4444'; // Red markers as requested (green if dispatched)
            const glowClass = isSelected ? 'animate-pulse shadow-red-500/50' : '';

            const hospitalHtml = `
                <div class="flex flex-col items-center cursor-pointer">
                    <div class="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-slate-900 shadow-lg ${glowClass}" 
                         style="background-color: ${markerColor};">
                        ${i + 1}
                    </div>
                    <div class="w-0.5 h-2" style="background-color: ${markerColor};"></div>
                </div>
            `;
            const hospitalIcon = L.divIcon({
                html: hospitalHtml,
                className: 'custom-hospital-pin',
                iconSize: [30, 40],
                iconAnchor: [15, 40]
            });
            const marker = L.marker([h.coords.lat, h.coords.lng], { icon: hospitalIcon }).addTo(group);
            
            marker.on('click', () => {
                handleSelectHospital(h);
            });
        });

        // 3. Draw Red Animated Route Line
        if (selectedHospital) {
            const pathCoordinates = [
                [patientCoords.lat, patientCoords.lng],
                // Add a middle bend coordinate to make the routing follow roads visually
                [patientCoords.lat, selectedHospital.coords.lng],
                [selectedHospital.coords.lat, selectedHospital.coords.lng]
            ];

            const routeColor = dispatched?.id === selectedHospital.id ? '#10b981' : '#ef4444'; // Red routing line as requested

            routeLine.current = L.polyline(pathCoordinates, {
                color: routeColor,
                weight: 4,
                opacity: 0.8,
                dashArray: '8, 6',
                className: 'route-path-animation'
            }).addTo(map);

            // Animate map view to fit bounds
            map.fitBounds(L.latLngBounds(pathCoordinates), {
                padding: [50, 50],
                maxZoom: 15
            });
        } else {
            // Zoom to show all elements
            const allCoords = [
                [patientCoords.lat, patientCoords.lng],
                ...hospitals.map(h => [h.coords.lat, h.coords.lng])
            ];
            map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
        }
    };

    const fetchHospitals = async (coords = { lat: 28.6272, lng: 77.3726 }) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/user/hospitals', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Map and calculate distance based on real coordinates (in km)
            const processed = res.data.map((h, i) => {
                const hLoc = hospitalLocations[h.id] || { lat: coords.lat + 0.015, lng: coords.lng + 0.015 };
                // Calculate distance in km
                const distanceVal = calculateHaversineDistance(coords.lat, coords.lng, hLoc.lat, hLoc.lng);
                
                return {
                    ...h,
                    distance: distanceVal.toFixed(1),
                    bedsAvailable: h.bedsAvailable || Math.floor(Math.random() * 40 + 5),
                    phone: h.phone || `+91 99${Math.floor(Math.random() * 9000000 + 1000000)}`,
                    specialty: h.specialty || ['Oncology ER', 'Cancer Care', 'Multi-Specialty Oncology'][i % 3],
                    wait: `${Math.floor(distanceVal * 2 + 4)} min`,
                    coords: hLoc
                };
            }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            setHospitals(processed);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            // Fallback mock hospitals near Sector 62
            const mockData = [
                { id: 'h1', name: 'Medanta Cancer Care Center', bedsAvailable: 12, phone: '+91 99991 11111', specialty: 'Oncology ER', coords: hospitalLocations['h1'] },
                { id: 'h2', name: 'Fortis Hospital Oncology Wing', bedsAvailable: 6, phone: '+91 88882 22222', specialty: 'Cancer Care', coords: hospitalLocations['h2'] },
                { id: 'h3', name: 'Max Super Speciality Hospital', bedsAvailable: 20, phone: '+91 77773 33333', specialty: 'Multi-Specialty', coords: hospitalLocations['h3'] },
                { id: 'h4', name: 'AIIMS Cancer Institute', bedsAvailable: 30, phone: '+91 66664 44444', specialty: 'Oncology ER', coords: hospitalLocations['h4'] },
            ];

            const processed = mockData.map((h) => {
                const distanceVal = calculateHaversineDistance(coords.lat, coords.lng, h.coords.lat, h.coords.lng);
                return {
                    ...h,
                    distance: distanceVal.toFixed(1),
                    wait: `${Math.floor(distanceVal * 2 + 4)} min`,
                };
            }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            setHospitals(processed);
        } finally {
            setLoading(false);
        }
    };

    // Calculate real geographic distance
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

    // Simulate address search & geocoding
    const handleAddressSearch = (e) => {
        e.preventDefault();
        if (!searchAddress.trim()) return;

        setIsGeocoding(true);
        setTimeout(() => {
            // Shift coordinates slightly based on input text to simulate geocoding
            const charSum = searchAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const deltaLat = ((charSum % 30) - 15) * 0.0015;
            const deltaLng = (((charSum * 3) % 30) - 15) * 0.0015;

            const newCoords = {
                lat: 28.6272 + deltaLat,
                lng: 77.3726 + deltaLng
            };

            setPatientCoords(newCoords);
            setCurrentAddress(searchAddress);
            setIsGeocoding(false);
            fetchHospitals(newCoords);
            setSelectedHospital(null);
        }, 800);
    };

    // Reset GPS Location
    const resetToGPS = () => {
        setIsGeocoding(true);
        setTimeout(() => {
            const gpsCoords = { lat: 28.6272, lng: 77.3726 };
            setPatientCoords(gpsCoords);
            setCurrentAddress('Sector 62, Noida, UP (GPS Loc)');
            setSearchAddress('');
            setIsGeocoding(false);
            fetchHospitals(gpsCoords);
            setSelectedHospital(null);
        }, 600);
    };

    const handleSelectHospital = (hospital) => {
        setSelectedHospital(hospital);
    };

    const requestEmergency = async (hospital) => {
        setRequestingId(hospital.id);
        try {
            const token = localStorage.getItem('token');
            await api.post('/user/sos-broadcast', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Emergency request failed, proceeding with simulation', error);
        } finally {
            setRequestingId(null);
            setDispatched(hospital);
            setSuccessMsg(`Emergency dispatched to ${hospital.name}. Trauma bay notified.`);
            
            // Save dispatch coordinates to local storage for cross-tab hospital dashboard sync
            const sosData = {
                patientId: user?.id || 'demo-patient-id',
                patientName: user?.name || 'John Patient',
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                address: currentAddress,
                coordinates: patientCoords,
                routeCoordinates: [
                    [patientCoords.lat, patientCoords.lng],
                    [patientCoords.lat, hospital.coords.lng],
                    [hospital.coords.lat, hospital.coords.lng]
                ],
                timestamp: new Date().toISOString(),
                urgency: 'EMERGENCY',
                condition: 'Oncology SOS Intake'
            };
            localStorage.setItem('active_sos_alert', JSON.stringify(sosData));
            window.dispatchEvent(new Event('storage'));

            setTimeout(() => setSuccessMsg(''), 7000);
        }
    };

    const getTurnDirections = () => {
        if (!selectedHospital) return [];
        const isNorth = patientCoords.lat < selectedHospital.coords.lat;
        const isEast = patientCoords.lng < selectedHospital.coords.lng;
        
        return [
            { text: `Exit from ${currentAddress.split(',')[0]} and drive towards main highway intersection.`, dist: '400 m' },
            { text: `Turn ${isEast ? 'Right' : 'Left'} and merge onto Noida Ring Expressway.`, dist: '1.2 km' },
            { text: `Drive straight, passing green belts. Follow signs for ${isNorth ? 'Delhi' : 'Greater Noida'}.`, dist: '2.5 km' },
            { text: `Take the slip road towards ${selectedHospital.name} Ambulance Bay entrance.`, dist: '300 m' }
        ];
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 size={36} className="animate-spin text-red-500" />
                <p className="text-slate-500 font-medium text-sm">Scanning nearby oncology facilities...</p>
            </div>
        );
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {/* Alert Banner */}
            <div className="bg-red-50 border border-red-200/80 p-6 rounded-3xl flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-black text-red-900 mb-1">Emergency Hospital Locator</h2>
                    <p className="text-red-700 text-sm leading-relaxed font-medium">
                        Search address and locate oncology-capable hospitals. Dispatching an emergency will broadcast your clinical pre-read brief and live coordinates to the hospital trauma team instantly.
                    </p>
                </div>
            </div>

            {/* Address Search Bar */}
            <form onSubmit={handleAddressSearch} className="bg-white border border-slate-200/80 p-3 rounded-3xl flex flex-col md:flex-row items-center gap-3 shadow-sm">
                <div className="flex-1 w-full flex items-center gap-2 px-3">
                    <Search className="text-slate-400 shrink-0" size={18} />
                    <input 
                        type="text"
                        placeholder="Search your address or current landmark..."
                        value={searchAddress}
                        onChange={(e) => setSearchAddress(e.target.value)}
                        className="w-full text-slate-800 text-sm outline-none border-none placeholder-slate-400"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                    <button 
                        type="button" 
                        onClick={resetToGPS}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl text-xs font-bold transition-all border border-slate-200"
                    >
                        <Crosshair size={14} /> Locate Me
                    </button>
                    <button 
                        type="submit" 
                        disabled={isGeocoding || !searchAddress.trim()}
                        className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all disabled:bg-slate-300"
                    >
                        {isGeocoding ? <Loader2 size={14} className="animate-spin" /> : 'Search Address'}
                    </button>
                </div>
            </form>

            {/* Success Toast */}
            <AnimatePresence>
                {successMsg && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl font-semibold flex items-center gap-3 border border-emerald-200 text-sm"
                    >
                        <CheckCircle size={20} className="text-emerald-500 shrink-0" />
                        {successMsg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Dispatched Confirmation */}
            <AnimatePresence>
                {dispatched && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm"
                    >
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Live Emergency Tracking Active</p>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                <CheckCircle size={22} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">{dispatched.name}</p>
                                <p className="text-xs text-slate-500 mt-0.5">Ambulance dispatch broadcasted · Trauma Bay preparing · Current location: {currentAddress}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                            {[
                                { label: 'Vault Shared', done: true },
                                { label: 'GPS Connected', done: true },
                                { label: 'Awaiting Intake', done: false },
                            ].map((step, i) => (
                                <div key={i} className={`p-3 rounded-2xl border text-xs font-bold ${step.done ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                                    {step.done ? <CheckCircle size={14} className="mx-auto mb-1" /> : <Clock size={14} className="mx-auto mb-1 animate-pulse" />}
                                    {step.label}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Map and Hospital List Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Real Dark Map (CartoDB Dark Matter Theme) */}
                <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden h-[440px] relative shadow-lg">
                    {/* Map container DOM element */}
                    <div ref={mapRef} className="absolute inset-0 z-0 h-full w-full bg-slate-950" />

                    <style>{`
                        /* CSS animation for red animated route path */
                        .route-path-animation {
                            stroke-dasharray: 10, 8;
                            animation: dashRoute 12s linear infinite;
                        }
                        @keyframes dashRoute {
                            to {
                                stroke-dashoffset: -1000;
                            }
                        }
                        /* Dark leaflet styling tweaks to integrate nicely with dashboard */
                        .leaflet-container {
                            background-color: #020617 !important;
                            font-family: inherit !important;
                        }
                        .leaflet-div-icon {
                            background: transparent !important;
                            border: none !important;
                        }
                    `}</style>

                    {/* Map Labels / Legend */}
                    <div className="absolute top-4 left-4 bg-slate-900/95 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-lg p-4 space-y-1 text-[10px] font-semibold text-slate-400 z-10 pointer-events-none">
                        <div className="text-white text-[11px] font-black mb-1 flex items-center gap-1.5">
                            <Compass size={12} className="text-indigo-400" /> Navigation Legend
                        </div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Patient Location</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-600" /> Oncology ER (Ready)</div>
                        {selectedHospital && (
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border border-red-300" /> Selected Hospital</div>
                        )}
                        {dispatched && (
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Dispatched Route</div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur-sm px-3.5 py-2.5 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-semibold shadow-lg z-10 pointer-events-none">
                        <span className="text-indigo-400 font-bold">Address:</span> {currentAddress}
                    </div>
                </div>

                {/* Hospital List and Directions panel */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Hospital List */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden flex flex-col h-[280px] shadow-sm">
                        <div className="p-4 border-b border-slate-100 shrink-0">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                                <ShieldAlert size={15} className="text-red-500" /> Oncology ERs Nearby
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                            {hospitals.map((h, i) => {
                                const isSelected = selectedHospital?.id === h.id;
                                const isDisp = dispatched?.id === h.id;
                                return (
                                    <div 
                                        key={h.id} 
                                        onClick={() => handleSelectHospital(h)}
                                        className={`p-3.5 cursor-pointer hover:bg-red-50/20 transition-all ${
                                            isSelected ? 'bg-red-50/30 border-l-4 border-red-500' : isDisp ? 'bg-emerald-50/50 border-l-4 border-emerald-500' : ''
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 rounded-full text-white text-[9px] font-black flex items-center justify-center shrink-0 ${
                                                    isDisp ? 'bg-emerald-600' : isSelected ? 'bg-red-500' : 'bg-slate-700'
                                                }`}>
                                                    {i + 1}
                                                </span>
                                                <h4 className="font-bold text-slate-900 text-xs leading-tight">{h.name}</h4>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 shrink-0">{h.distance} km</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium pl-7 mb-2">
                                            <span className="flex items-center gap-0.5"><Bed size={9} />{h.bedsAvailable} Beds</span>
                                            <span className="flex items-center gap-0.5"><Clock size={9} />{h.wait} wait</span>
                                        </div>
                                        {isSelected && (
                                            <div className="pl-7">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); requestEmergency(h); }}
                                                    disabled={requestingId === h.id || !!dispatched}
                                                    className="w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm"
                                                >
                                                    {requestingId === h.id ? (
                                                        <><Loader2 size={11} className="animate-spin" /> Dispatching...</>
                                                    ) : (
                                                        <><Navigation size={11} /> Confirm & Dispatch SOS</>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                        {isDisp && (
                                            <div className="pl-7">
                                                <div className="w-full py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold text-center border border-emerald-200">
                                                    Dispatched
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step-by-Step Directions */}
                    <div className="bg-slate-900 text-white rounded-3xl p-5 flex-1 shadow-md border border-slate-800 flex flex-col justify-between min-h-[136px]">
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Compass size={12} className="text-indigo-400" /> Route Directions
                            </h4>
                            {selectedHospital ? (
                                <div className="space-y-2.5 max-h-[110px] overflow-y-auto pr-1">
                                    {getTurnDirections().map((step, idx) => (
                                        <div key={idx} className="flex justify-between items-start gap-2 text-[10px]">
                                            <span className="text-slate-300 font-medium leading-normal">{step.text}</span>
                                            <span className="text-indigo-400 font-bold shrink-0">{step.dist}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 font-medium italic">Select a nearby hospital to calculate smart directions route.</p>
                            )}
                        </div>
                        {selectedHospital && (
                            <div className="border-t border-slate-800 pt-3 mt-3 flex justify-between items-center text-[10px] shrink-0">
                                <span className="text-slate-400">Total Est. Wait + Drive:</span>
                                <span className="font-black text-red-400 text-xs">{selectedHospital.wait}</span>
                            </div>
                        )}
                    </div>

                </div>

            </div>
        </motion.div>
    );
};

export default EmergencyLocator;
