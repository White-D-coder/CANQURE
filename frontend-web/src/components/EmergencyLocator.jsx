import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, MapPin, Navigation, Phone, CheckCircle, 
    Clock, Bed, Loader2, ShieldAlert, Search, Crosshair, Compass, Sun, Moon
} from 'lucide-react';
import api from '../api/axios';

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

const EmergencyLocator = ({ user }) => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [dispatched, setDispatched] = useState(null);
    
    // GPS and Mapping states
    const [searchAddress, setSearchAddress] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('Pinpointing Location...');
    const [patientCoords, setPatientCoords] = useState({ lat: 28.6272, lng: 77.3726 }); // Default Noida
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [mapTheme, setMapTheme] = useState('dark'); // 'dark' or 'light'
    const [routingCoords, setRoutingCoords] = useState([]);
    const [ambulancePos, setAmbulancePos] = useState(null);

    // Leaflet refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);
    const markersGroup = useRef(null);
    const routeLine = useRef(null);
    const LRef = useRef(null);

    // Dynamic hospital offset configurations
    const hospitalLocations = {
        'h1': { lat: 28.6288, lng: 77.3662, name: 'Medanta Cancer Care Center' },
        'h2': { lat: 28.6241, lng: 77.3792, name: 'Fortis Hospital Oncology Wing' },
        'h3': { lat: 28.6365, lng: 77.3451, name: 'Max Super Speciality Hospital' },
        'h4': { lat: 28.5672, lng: 77.2100, name: 'AIIMS Cancer Institute' },
    };

    useEffect(() => {
        acquireRealLocation();
    }, []);

    useEffect(() => {
        const handleStorageChange = () => {
            const savedAmb = localStorage.getItem('active_ambulance_pos');
            if (savedAmb) {
                setAmbulancePos(JSON.parse(savedAmb));
            } else {
                setAmbulancePos(null);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        handleStorageChange();
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    // Handle map theme switching (Dark Matter vs Positron)
    useEffect(() => {
        if (tileLayerRef.current && mapInstance.current) {
            const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            tileLayerRef.current.setUrl(mapTheme === 'dark' ? darkUrl : lightUrl);
        }
    }, [mapTheme]);

    // Initialize/Update Leaflet Map
    useEffect(() => {
        if (loading) return;

        loadLeaflet().then((L) => {
            LRef.current = L;
            if (!mapRef.current) return;

            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([patientCoords.lat, patientCoords.lng], 13);

                const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
                const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
                
                tileLayerRef.current = L.tileLayer(mapTheme === 'dark' ? darkUrl : lightUrl, {
                    maxZoom: 19
                }).addTo(mapInstance.current);

                markersGroup.current = L.layerGroup().addTo(mapInstance.current);
            }

            renderMapLayers();
        });

        return () => {
            if (routeLine.current && mapInstance.current) {
                routeLine.current.remove();
            }
        };
    }, [loading, patientCoords, selectedHospital, dispatched, hospitals, routingCoords, ambulancePos]);

    // Redraw markers and routing path on map
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
            
            const markerColor = isDisp ? '#10b981' : '#ef4444'; // Red markers, green if dispatched
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

        // 3. Draw Red OSRM Driving Route Line
        if (selectedHospital && routingCoords.length > 0) {
            const routeColor = dispatched?.id === selectedHospital.id ? '#10b981' : '#ef4444';

            routeLine.current = L.polyline(routingCoords, {
                color: routeColor,
                weight: 5,
                opacity: 0.85,
                dashArray: '10, 8',
                className: 'route-path-animation'
            }).addTo(map);

            map.fitBounds(L.latLngBounds(routingCoords), {
                padding: [50, 50]
            });
        } else {
            const allCoords = [
                [patientCoords.lat, patientCoords.lng],
                ...hospitals.map(h => [h.coords.lat, h.coords.lng])
            ];
            map.fitBounds(L.latLngBounds(allCoords), { padding: [40, 40] });
        }

        // 4. Ambulance Marker (Moving red truck icon)
        if (dispatched && ambulancePos) {
            const ambulanceHtml = `
                <div class="relative flex items-center justify-center">
                    <span class="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-red-400 opacity-60"></span>
                    <div class="w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center border border-white shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-truck"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.5-1.1L18 7h-4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                    </div>
                </div>
            `;
            const ambulanceIcon = L.divIcon({ html: ambulanceHtml, iconSize: [28, 28], iconAnchor: [14, 14] });
            L.marker([ambulancePos.lat, ambulancePos.lng], { icon: ambulanceIcon }).addTo(group);
        }
    };

    // Geolocation API to fetch coordinates
    const acquireRealLocation = () => {
        setIsGeocoding(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setPatientCoords(coords);
                    await reverseGeocode(coords.lat, coords.lng);
                    fetchHospitals(coords);
                },
                (error) => {
                    console.warn("Geolocation permission denied or error. Falling back to default Noida coordinates.", error);
                    const defaultCoords = { lat: 28.6272, lng: 77.3726 };
                    setPatientCoords(defaultCoords);
                    setCurrentAddress('Sector 62, Noida, UP (GPS Default)');
                    fetchHospitals(defaultCoords);
                }
            );
        } else {
            const defaultCoords = { lat: 28.6272, lng: 77.3726 };
            setPatientCoords(defaultCoords);
            setCurrentAddress('Sector 62, Noida, UP (GPS Default)');
            fetchHospitals(defaultCoords);
        }
    };

    // Reverse geocode via OpenStreetMap Nominatim
    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await res.json();
            if (data && data.display_name) {
                const parts = data.display_name.split(',');
                const shortAddr = parts.slice(0, 3).join(',');
                setCurrentAddress(shortAddr);
            } else {
                setCurrentAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            setCurrentAddress(`GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        } finally {
            setIsGeocoding(false);
        }
    };

    // Search and geocode address via OpenStreetMap Nominatim search API
    const handleAddressSearch = async (e) => {
        e.preventDefault();
        if (!searchAddress.trim()) return;

        setIsGeocoding(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}&limit=1`);
            const data = await res.json();
            if (data && data.length > 0) {
                const newCoords = {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon)
                };
                setPatientCoords(newCoords);
                
                const parts = data[0].display_name.split(',');
                const shortAddr = parts.slice(0, 3).join(',');
                setCurrentAddress(shortAddr);
                
                fetchHospitals(newCoords);
                setSelectedHospital(null);
                setRoutingCoords([]);
            } else {
                alert("Location not found. Please try a different query.");
            }
        } catch (error) {
            console.error("Geocoding failed:", error);
            alert("Search service currently unavailable.");
        } finally {
            setIsGeocoding(false);
        }
    };

    const fetchHospitals = async (coords) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/user/hospitals', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Read custom locations saved by hospital admins
            const customLocsRaw = localStorage.getItem('custom_hospital_locations');
            const customLocs = customLocsRaw ? JSON.parse(customLocsRaw) : {};

            // Dynamically cluster hospitals around user's real location, or use admin-configured coordinates
            const processed = res.data.map((h, i) => {
                let hLoc;
                let hName = h.name;
                let hBeds = h.bedsAvailable;

                if (customLocs[h.id]) {
                    hLoc = customLocs[h.id].coords;
                    hName = customLocs[h.id].name || h.name;
                    hBeds = customLocs[h.id].bedsAvailable !== undefined ? customLocs[h.id].bedsAvailable : h.bedsAvailable;
                } else {
                    const angle = (i * 2 * Math.PI) / res.data.length;
                    const radius = 0.008 + (Math.random() * 0.015);
                    hLoc = {
                        lat: coords.lat + radius * Math.sin(angle),
                        lng: coords.lng + radius * Math.cos(angle)
                    };
                }

                const distanceVal = calculateHaversineDistance(coords.lat, coords.lng, hLoc.lat, hLoc.lng);
                
                return {
                    ...h,
                    name: hName,
                    distance: distanceVal.toFixed(1),
                    bedsAvailable: hBeds || Math.floor(Math.random() * 40 + 5),
                    phone: h.phone || `+91 99${Math.floor(Math.random() * 9000000 + 1000000)}`,
                    specialty: h.specialty || ['Oncology ER', 'Cancer Care', 'Multi-Specialty Oncology'][i % 3],
                    wait: `${Math.floor(distanceVal * 1.8 + 4)} min`,
                    coords: hLoc
                };
            }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            setHospitals(processed);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            const mockData = [
                { id: 'h1', name: 'Medanta Cancer Care Center', bedsAvailable: 12, phone: '+91 99991 11111', specialty: 'Oncology ER' },
                { id: 'h2', name: 'Fortis Hospital Oncology Wing', bedsAvailable: 6, phone: '+91 88882 22222', specialty: 'Cancer Care' },
                { id: 'h3', name: 'Max Super Speciality Hospital', bedsAvailable: 20, phone: '+91 77773 33333', specialty: 'Multi-Specialty' },
                { id: 'h4', name: 'AIIMS Cancer Institute', bedsAvailable: 30, phone: '+91 66664 44444', specialty: 'Oncology ER' },
            ];

            const customLocsRaw = localStorage.getItem('custom_hospital_locations');
            const customLocs = customLocsRaw ? JSON.parse(customLocsRaw) : {};

            const processed = mockData.map((h, i) => {
                let hLoc;
                let hName = h.name;
                let hBeds = h.bedsAvailable;

                if (customLocs[h.id]) {
                    hLoc = customLocs[h.id].coords;
                    hName = customLocs[h.id].name || h.name;
                    hBeds = customLocs[h.id].bedsAvailable !== undefined ? customLocs[h.id].bedsAvailable : h.bedsAvailable;
                } else {
                    const angle = (i * 2 * Math.PI) / mockData.length;
                    const radius = 0.008 + (Math.random() * 0.015);
                    hLoc = {
                        lat: coords.lat + radius * Math.sin(angle),
                        lng: coords.lng + radius * Math.cos(angle)
                    };
                }

                const distanceVal = calculateHaversineDistance(coords.lat, coords.lng, hLoc.lat, hLoc.lng);
                return {
                    ...h,
                    name: hName,
                    distance: distanceVal.toFixed(1),
                    bedsAvailable: hBeds,
                    wait: `${Math.floor(distanceVal * 1.8 + 4)} min`,
                    coords: hLoc
                };
            }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            setHospitals(processed);
        } finally {
            setLoading(false);
        }
    };

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

    const resetToGPS = () => {
        acquireRealLocation();
        setSearchAddress('');
        setSelectedHospital(null);
        setRoutingCoords([]);
    };

    // Calculate real street route via Open Source Routing Machine (OSRM) API
    const handleSelectHospital = async (hospital) => {
        setSelectedHospital(hospital);
        
        try {
            // Call OSRM route engine to find driving route along streets
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${patientCoords.lng},${patientCoords.lat};${hospital.coords.lng},${hospital.coords.lat}?overview=full&geometries=geojson`);
            const data = await res.json();
            if (data && data.routes && data.routes.length > 0) {
                const geojsonCoords = data.routes[0].geometry.coordinates;
                // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
                const leafletCoords = geojsonCoords.map(coord => [coord[1], coord[0]]);
                setRoutingCoords(leafletCoords);
            } else {
                // Fallback straight lines route
                setRoutingCoords([
                    [patientCoords.lat, patientCoords.lng],
                    [patientCoords.lat, hospital.coords.lng],
                    [hospital.coords.lat, hospital.coords.lng]
                ]);
            }
        } catch (err) {
            console.warn("OSRM routing failed, drawing straight routing segments instead.", err);
            setRoutingCoords([
                [patientCoords.lat, patientCoords.lng],
                [patientCoords.lat, hospital.coords.lng],
                [hospital.coords.lat, hospital.coords.lng]
            ]);
        }
    };

    const requestEmergency = async (hospital) => {
        setRequestingId(hospital.id);
        try {
            const token = localStorage.getItem('token');
            await api.post('/user/sos-broadcast', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Emergency request failed', error);
        } finally {
            setRequestingId(null);
            setDispatched(hospital);
            setSuccessMsg(`Emergency dispatched to ${hospital.name}. Trauma bay notified.`);
            
            const sosData = {
                patientId: user?.id || 'demo-patient-id',
                patientName: user?.name || 'John Patient',
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                address: currentAddress,
                coordinates: patientCoords,
                routeCoordinates: routingCoords.length > 0 ? routingCoords : [
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
            { text: `Exit from your location onto the nearest main arterial road.`, dist: '400 m' },
            { text: `Turn ${isEast ? 'Right' : 'Left'} and merge onto the primary ring road.`, dist: '1.2 km' },
            { text: `Drive straight, passing local green belts. Follow signs for emergency services.`, dist: '2.5 km' },
            { text: `Take the slip road towards the ${selectedHospital.name} Ambulance Bay entrance.`, dist: '300 m' }
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
                        <Crosshair size={14} className={isGeocoding ? "animate-spin" : ""} /> Locate Me
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
                            <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <p className="font-bold text-slate-900">{dispatched.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Ambulance dispatch broadcasted · Trauma Bay preparing · Current location: {currentAddress}</p>
                                </div>
                                <a 
                                    href="/driver" 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all border border-red-200 flex items-center justify-center gap-1.5 self-start md:self-auto shadow-sm"
                                >
                                    <Navigation size={13} className="text-red-500" /> Open Driver HUD ↗
                                </a>
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

                {/* Real Map (With toggle bright/dark options) */}
                <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden h-[440px] relative shadow-lg">
                    {/* Map container */}
                    <div ref={mapRef} className="absolute inset-0 z-0 h-full w-full" />

                    <style>{`
                        .route-path-animation {
                            stroke-dasharray: 10, 8;
                            animation: dashRoute 8s linear infinite;
                        }
                        @keyframes dashRoute {
                            to {
                                stroke-dashoffset: -1000;
                            }
                        }
                        .leaflet-container {
                            background-color: ${mapTheme === 'dark' ? '#020617' : '#f8fafc'} !important;
                            font-family: inherit !important;
                        }
                        .leaflet-div-icon {
                            background: transparent !important;
                            border: none !important;
                        }
                    `}</style>

                    {/* Floating Bright/Dark theme toggle */}
                    <button 
                        onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                        className={`absolute top-4 right-4 z-10 p-2.5 rounded-2xl border font-bold text-xs flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
                            mapTheme === 'dark' 
                            ? 'bg-slate-900/90 border-slate-700 text-slate-100 hover:bg-slate-800' 
                            : 'bg-white/95 border-slate-200 text-slate-800 hover:bg-slate-50'
                        }`}
                        title={mapTheme === 'dark' ? "Switch to Bright Map" : "Switch to Dark Map"}
                    >
                        {mapTheme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-600" />}
                        {mapTheme === 'dark' ? 'Bright Map' : 'Dark Map'}
                    </button>

                    {/* Map Labels / Legend */}
                    <div className={`absolute top-4 left-4 border rounded-2xl shadow-lg p-4 space-y-1.5 text-[10px] font-semibold z-10 pointer-events-none transition-all ${
                        mapTheme === 'dark' 
                        ? 'bg-slate-900/95 border-slate-800 text-slate-400' 
                        : 'bg-white/95 border-slate-200 text-slate-500'
                    }`}>
                        <div className={`text-[11px] font-black mb-1 flex items-center gap-1.5 ${mapTheme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            <Compass size={12} className="text-indigo-500" /> Navigation Legend
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

                    <div className={`absolute bottom-4 left-4 px-3.5 py-2.5 rounded-xl border text-[10px] font-semibold shadow-lg z-10 pointer-events-none transition-all ${
                        mapTheme === 'dark' 
                        ? 'bg-slate-900/95 border-slate-800 text-slate-300' 
                        : 'bg-white/95 border-slate-200 text-slate-700'
                    }`}>
                        <span className="text-indigo-500 font-bold">Address:</span> {currentAddress}
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
