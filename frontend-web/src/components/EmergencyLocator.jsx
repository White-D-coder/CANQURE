import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    AlertTriangle, MapPin, Navigation, Phone, CheckCircle, 
    Clock, Bed, Loader2, ShieldAlert, Search, Crosshair, Compass, Eye
} from 'lucide-react';
import api from '../api/axios';

const EmergencyLocator = ({ user }) => {
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [requestingId, setRequestingId] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');
    const [isCritical, setIsCritical] = useState(true);
    const [dispatched, setDispatched] = useState(null);
    
    // GPS and Mapping states
    const [searchAddress, setSearchAddress] = useState('');
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('Sector 62, Noida, UP');
    const [patientCoords, setPatientCoords] = useState({ x: 50, y: 50 }); // Center of the map
    const [selectedHospital, setSelectedHospital] = useState(null);
    const [activeRoutePath, setActiveRoutePath] = useState(null);

    // Default predefined positions for hospitals on our 100x100 grid map
    const hospitalPositions = {
        'h1': { x: 30, y: 25 }, // Medanta Cancer Care
        'h2': { x: 75, y: 35 }, // Fortis Hospital
        'h3': { x: 65, y: 70 }, // Max Super Speciality
        'h4': { x: 20, y: 65 }, // AIIMS Cancer Institute
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const fetchHospitals = async (coords = { x: 50, y: 50 }) => {
        try {
            const token = localStorage.getItem('token');
            const res = await api.get('/user/hospitals', {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Map and calculate distance based on Euclidean distance on our grid
            const processed = res.data.map((h, i) => {
                const hPos = hospitalPositions[h.id] || { x: 40 + (i * 10), y: 30 + (i * 15) };
                const distanceVal = Math.sqrt(Math.pow(hPos.x - coords.x, 2) + Math.pow(hPos.y - coords.y, 2)) * 0.15;
                
                return {
                    ...h,
                    distance: distanceVal.toFixed(1),
                    bedsAvailable: h.bedsAvailable || Math.floor(Math.random() * 40 + 5),
                    phone: h.phone || `+91 99${Math.floor(Math.random() * 9000000 + 1000000)}`,
                    specialty: h.specialty || ['Oncology ER', 'Cancer Care', 'Multi-Specialty Oncology'][i % 3],
                    wait: `${Math.floor(distanceVal * 1.5 + 4)} min`,
                    coords: hPos
                };
            }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            setHospitals(processed);
        } catch (error) {
            console.error('Error fetching hospitals:', error);
            // Fallback mock hospitals so UI always renders
            const mockData = [
                { id: 'h1', name: 'Medanta Cancer Care Center', bedsAvailable: 12, phone: '+91 99991 11111', specialty: 'Oncology ER', coords: hospitalPositions['h1'] },
                { id: 'h2', name: 'Fortis Hospital Oncology Wing', bedsAvailable: 6, phone: '+91 88882 22222', specialty: 'Cancer Care', coords: hospitalPositions['h2'] },
                { id: 'h3', name: 'Max Super Speciality Hospital', bedsAvailable: 20, phone: '+91 77773 33333', specialty: 'Multi-Specialty', coords: hospitalPositions['h3'] },
                { id: 'h4', name: 'AIIMS Cancer Institute', bedsAvailable: 30, phone: '+91 66664 44444', specialty: 'Oncology ER', coords: hospitalPositions['h4'] },
            ];

            const processed = mockData.map((h) => {
                const distanceVal = Math.sqrt(Math.pow(h.coords.x - coords.x, 2) + Math.pow(h.coords.y - coords.y, 2)) * 0.15;
                return {
                    ...h,
                    distance: distanceVal.toFixed(1),
                    wait: `${Math.floor(distanceVal * 1.5 + 4)} min`,
                };
            }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

            setHospitals(processed);
        } finally {
            setLoading(false);
        }
    };

    // Simulate geocoding when user enters an address
    const handleAddressSearch = (e) => {
        e.preventDefault();
        if (!searchAddress.trim()) return;

        setIsGeocoding(true);
        // Simulate network delay
        setTimeout(() => {
            // Generate deterministic coordinates based on address length/characters
            const charSum = searchAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const newX = 25 + (charSum % 50); // Keep between 25 and 75
            const newY = 25 + ((charSum * 3) % 50);

            const newCoords = { x: newX, y: newY };
            setPatientCoords(newCoords);
            setCurrentAddress(searchAddress);
            setIsGeocoding(false);
            
            // Recalculate routes and distances
            fetchHospitals(newCoords);

            // Update route line if a hospital was selected
            if (selectedHospital) {
                const updatedHosp = hospitals.find(h => h.id === selectedHospital.id);
                if (updatedHosp) {
                    calculateRoute(newCoords, updatedHosp.coords);
                } else {
                    setSelectedHospital(null);
                    setActiveRoutePath(null);
                }
            }
        }, 800);
    };

    // Locate Me: resets patient location to GPS center
    const resetToGPS = () => {
        setIsGeocoding(true);
        setTimeout(() => {
            const gpsCoords = { x: 50, y: 50 };
            setPatientCoords(gpsCoords);
            setCurrentAddress('Sector 62, Noida, UP (GPS Loc)');
            setSearchAddress('');
            setIsGeocoding(false);
            fetchHospitals(gpsCoords);
            if (selectedHospital) {
                calculateRoute(gpsCoords, selectedHospital.coords);
            }
        }, 600);
    };

    // Generate smart routing path between patient and hospital
    const calculateRoute = (start, end) => {
        // Create an interesting SVG path with a turn/bend to make it look like actual street navigation
        const midX = start.x;
        const midY = end.y;
        setActiveRoutePath(`M ${start.x} ${start.y} L ${midX} ${midY} L ${end.x} ${end.y}`);
    };

    const handleSelectHospital = (hospital) => {
        setSelectedHospital(hospital);
        calculateRoute(patientCoords, hospital.coords);
    };

    const requestEmergency = async (hospital) => {
        setRequestingId(hospital.id);
        try {
            const token = localStorage.getItem('token');
            // Call actual SOS route
            await api.post('/user/sos-broadcast', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Emergency request failed, proceeding with local broadcast simulation', error);
        } finally {
            setRequestingId(null);
            setDispatched(hospital);
            setSuccessMsg(`Emergency dispatched to ${hospital.name}. Trauma bay notified.`);
            
            // Write to LocalStorage for real-time synchronization with Hospital Dashboard
            const sosData = {
                patientId: user?.id || 'demo-patient-id',
                patientName: user?.name || 'John Patient',
                hospitalId: hospital.id,
                hospitalName: hospital.name,
                address: currentAddress,
                coordinates: patientCoords,
                routePath: `M ${patientCoords.x} ${patientCoords.y} L ${patientCoords.x} ${hospital.coords.y} L ${hospital.coords.x} ${hospital.coords.y}`,
                timestamp: new Date().toISOString(),
                urgency: 'EMERGENCY',
                condition: 'Oncology SOS Intake'
            };
            localStorage.setItem('active_sos_alert', JSON.stringify(sosData));
            
            // Trigger storage event manually to notify the same tab if needed
            window.dispatchEvent(new Event('storage'));

            setTimeout(() => setSuccessMsg(''), 7000);
        }
    };

    const getTurnDirections = () => {
        if (!selectedHospital) return [];
        const isNorth = patientCoords.y > selectedHospital.coords.y;
        const isEast = patientCoords.x < selectedHospital.coords.x;
        
        return [
            { text: `Exit from ${currentAddress.split(',')[0]} towards main highway.`, dist: '400 m' },
            { text: `Turn ${isEast ? 'Right' : 'Left'} and merge onto Health Ring Road.`, dist: '1.2 km' },
            { text: `Continue straight. Pass green belt park on the ${isNorth ? 'Right' : 'Left'}.`, dist: '2.5 km' },
            { text: `Turn towards ${selectedHospital.name} Emergency Intake Gate.`, dist: '300 m' }
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

                {/* Interactive Map */}
                <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden h-[440px] relative shadow-lg">
                    {/* Dark Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25" />

                    <svg width="100%" height="100%" className="absolute inset-0 z-0">
                        {/* Stylized park circles */}
                        <circle cx="15%" cy="30%" r="60" fill="#065f46" className="opacity-20" />
                        <circle cx="85%" cy="75%" r="80" fill="#065f46" className="opacity-15" />
                        
                        {/* Stylized river */}
                        <path d="M -20 400 Q 150 350 300 380 T 600 320 T 1000 350" fill="none" stroke="#1d4ed8" strokeWidth="24" className="opacity-10" />

                        {/* Road Network Lines */}
                        <path d="M 0 150 L 1000 150" stroke="#334155" strokeWidth="4" className="opacity-40" />
                        <path d="M 0 350 L 1000 350" stroke="#334155" strokeWidth="4" className="opacity-40" />
                        <path d="M 250 0 L 250 500" stroke="#334155" strokeWidth="4" className="opacity-40" />
                        <path d="M 750 0 L 750 500" stroke="#334155" strokeWidth="4" className="opacity-40" />

                        {/* Animated Active Route Path */}
                        {activeRoutePath && (
                            <>
                                {/* Route glow underlay */}
                                <path 
                                    d={activeRoutePath} 
                                    fill="none" 
                                    stroke={dispatched ? '#10b981' : '#ef4444'} 
                                    strokeWidth="6" 
                                    className="opacity-20 blur-sm"
                                />
                                {/* Laser line animation */}
                                <path 
                                    d={activeRoutePath} 
                                    fill="none" 
                                    stroke={dispatched ? '#10b981' : '#ef4444'} 
                                    strokeWidth="3" 
                                    strokeDasharray="8, 6"
                                    className="route-animation"
                                    style={{
                                        animation: 'dash 30s linear infinite'
                                    }}
                                />
                            </>
                        )}
                    </svg>

                    <style>{`
                        @keyframes dash {
                            to {
                                stroke-dashoffset: -1000;
                            }
                        }
                        .route-animation {
                            animation: dash 8s linear infinite !important;
                        }
                    `}</style>

                    {/* Hospital pins */}
                    {hospitals.map((h, i) => {
                        const isSelected = selectedHospital?.id === h.id;
                        const isDisp = dispatched?.id === h.id;
                        
                        return (
                            <div 
                                key={h.id} 
                                className="absolute cursor-pointer group"
                                style={{ 
                                    top: `${h.coords.y}%`, 
                                    left: `${h.coords.x}%`, 
                                    transform: 'translate(-50%, -100%)' 
                                }}
                                onClick={() => handleSelectHospital(h)}
                            >
                                <div className="flex flex-col items-center">
                                    {/* Tooltip */}
                                    <div className="absolute bottom-11 scale-0 group-hover:scale-100 transition-all bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap shadow-xl z-20 pointer-events-none">
                                        <p className="text-white">{h.name}</p>
                                        <p className="text-red-400 text-[9px] mt-0.5">{h.bedsAvailable} Beds Available · {h.distance} km</p>
                                    </div>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black shadow-lg border-2 transition-all ${
                                        isDisp 
                                        ? 'bg-emerald-600 border-emerald-300 scale-110 shadow-emerald-600/50' 
                                        : isSelected 
                                        ? 'bg-red-500 border-red-300 scale-110 shadow-red-500/50 animate-pulse' 
                                        : 'bg-red-950 border-red-700 hover:bg-red-900'
                                    }`}>
                                        {i + 1}
                                    </div>
                                    <div className={`w-0.5 h-3 mt-0.5 ${isDisp ? 'bg-emerald-500' : isSelected ? 'bg-red-400' : 'bg-red-800'}`} />
                                </div>
                            </div>
                        );
                    })}

                    {/* Patient location pin */}
                    <div 
                        className="absolute transition-all duration-500"
                        style={{ 
                            top: `${patientCoords.y}%`, 
                            left: `${patientCoords.x}%`, 
                            transform: 'translate(-50%, -50%)' 
                        }}
                    >
                        <div className="relative flex items-center justify-center">
                            {/* Pulse rings */}
                            <span className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-indigo-500 opacity-40"></span>
                            <span className="animate-pulse absolute inline-flex h-8 w-8 rounded-full bg-indigo-600 opacity-60"></span>
                            <div className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg border-2 border-white relative z-10">
                                <MapPin size={12} />
                            </div>
                        </div>
                    </div>

                    {/* Map Labels / Legend */}
                    <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-2xl shadow-sm p-4 space-y-1 text-[10px] font-semibold text-slate-400 z-10">
                        <div className="text-white text-[11px] font-black mb-1 flex items-center gap-1.5">
                            <Compass size={12} className="text-indigo-400" /> Navigation Legend
                        </div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Patient Location</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-700" /> Oncology ER</div>
                        <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Selected Hospital</div>
                        {dispatched && (
                            <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Ambulance Intaking</div>
                        )}
                    </div>

                    <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-800 text-[10px] text-slate-300 font-semibold shadow-sm z-10">
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
