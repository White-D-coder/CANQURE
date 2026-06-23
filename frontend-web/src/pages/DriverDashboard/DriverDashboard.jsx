import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Navigation, ShieldAlert, Clock, MapPin, Compass, Play, 
    Square, Sun, Moon, Volume2, VolumeX, RefreshCw, Cpu, Award, Zap
} from 'lucide-react';
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

// Grid dimensions for the pathfinding visualizer
const GRID_ROWS = 12;
const GRID_COLS = 16;

const DriverDashboard = () => {
    // SOS alert states
    const [activeSos, setActiveSos] = useState(null);
    const [currentAddress, setCurrentAddress] = useState('Standby - Waiting for SOS alert...');
    const [hospitalInfo, setHospitalInfo] = useState(null);
    const [ambulancePos, setAmbulancePos] = useState(null);
    const [routingCoords, setRoutingCoords] = useState([]);
    
    // Map configurations
    const [mapTheme, setMapTheme] = useState('dark');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simSpeed, setSimSpeed] = useState(1); // 1x, 2x, 5x
    const [currentStepIdx, setCurrentStepIdx] = useState(0);
    const [hudSpeed, setHudSpeed] = useState(0);
    const [hudEta, setHudEta] = useState(0);
    const [hudDistance, setHudDistance] = useState(0);
    const [currentDirection, setCurrentDirection] = useState('Standby');

    // Siren and audio synthesizer states
    const [sirenActive, setSirenActive] = useState(false);
    const audioCtxRef = useRef(null);
    const oscillatorRef = useRef(null);
    const modulationInterval = useRef(null);

    // Leaflet refs
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const tileLayerRef = useRef(null);
    const markersGroup = useRef(null);
    const routeLine = useRef(null);
    const ambulanceMarker = useRef(null);
    const LRef = useRef(null);
    const simInterval = useRef(null);

    // Pathfinding visualizer states
    const [visualizerTab, setVisualizerTab] = useState(false); // Toggle grid comparison
    const [grid, setGrid] = useState([]);
    const [startNode, setStartNode] = useState({ r: 2, c: 2 });
    const [endNode, setEndNode] = useState({ r: 9, c: 13 });
    const [gridAlgo, setGridAlgo] = useState('astar'); // 'dijkstra' or 'astar'
    const [visNodesCount, setVisNodesCount] = useState(0);
    const [visTimeTaken, setVisTimeTaken] = useState(0);
    const [isVisRunning, setIsVisRunning] = useState(false);
    const [gridPath, setGridPath] = useState([]);

    // Standard hospital nodes
    const defaultHospitalLocs = {
        'h1': { lat: 28.6288, lng: 77.3662, name: 'Medanta Cancer Care Center' },
        'h2': { lat: 28.6241, lng: 77.3792, name: 'Fortis Hospital Oncology Wing' },
        'h3': { lat: 28.6365, lng: 77.3451, name: 'Max Super Speciality Hospital' },
        'h4': { lat: 28.5672, lng: 77.2100, name: 'AIIMS Cancer Institute' },
    };

    useEffect(() => {
        loadActiveSos();
        const handleStorageChange = () => loadActiveSos();
        window.addEventListener('storage', handleStorageChange);
        
        // Initialize pathfinding visualizer grid
        resetGrid();

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            stopSiren();
            if (simInterval.current) clearInterval(simInterval.current);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Load active SOS data
    const loadActiveSos = () => {
        try {
            const rawAlert = localStorage.getItem('active_sos_alert');
            const customHospitalsRaw = localStorage.getItem('custom_hospital_locations');
            let mergedHospitals = { ...defaultHospitalLocs };
            
            if (customHospitalsRaw) {
                const parsedCustom = JSON.parse(customHospitalsRaw);
                Object.keys(parsedCustom).forEach(key => {
                    mergedHospitals[key] = {
                        name: parsedCustom[key].name,
                        lat: parsedCustom[key].coords.lat,
                        lng: parsedCustom[key].coords.lng
                    };
                });
            }

            if (rawAlert) {
                const parsed = JSON.parse(rawAlert);
                setActiveSos(parsed);
                setCurrentAddress(parsed.address);
                
                const targetHospital = mergedHospitals[parsed.hospitalId] || mergedHospitals['h1'];
                setHospitalInfo(targetHospital);
                
                // Read current ambulance position if driving
                const savedAmbulancePos = localStorage.getItem('active_ambulance_pos');
                if (savedAmbulancePos) {
                    setAmbulancePos(JSON.parse(savedAmbulancePos));
                } else {
                    setAmbulancePos(parsed.coordinates);
                }

                setRoutingCoords(parsed.routeCoordinates || []);
            } else {
                setActiveSos(null);
                setHospitalInfo(null);
                setAmbulancePos(null);
                setRoutingCoords([]);
                localStorage.removeItem('active_ambulance_pos');
            }
        } catch (error) {
            console.error("Failed to parse SOS alert context", error);
        }
    };

    // Load mock SOS alert for demo testing
    const loadDemoSos = () => {
        const patientCoords = { lat: 28.6272, lng: 77.3726 }; // Noida Sec 62
        const hospitalCoords = { lat: 28.6365, lng: 77.3451 }; // Max Hospital Noida
        
        // Fetch real OSRM path for Noida demonstration
        fetch(`https://router.project-osrm.org/route/v1/driving/${patientCoords.lng},${patientCoords.lat};${hospitalCoords.lng},${hospitalCoords.lat}?overview=full&geometries=geojson`)
            .then(res => res.json())
            .then(data => {
                let routeCoords = [
                    [patientCoords.lat, patientCoords.lng],
                    [hospitalCoords.lat, hospitalCoords.lng]
                ];
                if (data && data.routes && data.routes.length > 0) {
                    routeCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                }
                
                const demoData = {
                    patientId: 'demo-patient-99',
                    patientName: 'Elena Rostova (Demo)',
                    hospitalId: 'h3',
                    hospitalName: 'Max Super Speciality Hospital',
                    address: 'Sector 62, Noida, Uttar Pradesh, India',
                    coordinates: patientCoords,
                    routeCoordinates: routeCoords,
                    timestamp: new Date().toISOString(),
                    urgency: 'EMERGENCY',
                    condition: 'Acute chest tightness & shortness of breath. Stage 3 breast cancer patient.'
                };
                
                localStorage.setItem('active_sos_alert', JSON.stringify(demoData));
                localStorage.removeItem('active_ambulance_pos');
                window.dispatchEvent(new Event('storage'));
            });
    };

    const clearAlert = () => {
        localStorage.removeItem('active_sos_alert');
        localStorage.removeItem('active_ambulance_pos');
        window.dispatchEvent(new Event('storage'));
        if (simInterval.current) clearInterval(simInterval.current);
        setIsSimulating(false);
        setHudSpeed(0);
        setHudDistance(0);
        setHudEta(0);
        setCurrentDirection('Standby');
    };

    // Synthesize dual-tone wailing siren via Web Audio API
    const startSiren = () => {
        try {
            if (audioCtxRef.current) return;

            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContextClass();
            audioCtxRef.current = ctx;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.type = 'triangle'; // Smoother siren wave
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            
            gain.gain.setValueAtTime(0.15, ctx.currentTime); // Safe volume

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            
            oscillatorRef.current = osc;

            // Modulate frequency back and forth to create a wailing effect
            let rising = true;
            let currentFreq = 600;
            modulationInterval.current = setInterval(() => {
                if (rising) {
                    currentFreq += 40;
                    if (currentFreq >= 960) rising = false;
                } else {
                    currentFreq -= 40;
                    if (currentFreq <= 600) rising = true;
                }
                if (oscillatorRef.current) {
                    oscillatorRef.current.frequency.setValueAtTime(currentFreq, ctx.currentTime);
                }
            }, 60);

            setSirenActive(true);
        } catch (err) {
            console.error("Audio synthesizer initialization failed", err);
        }
    };

    const stopSiren = () => {
        if (modulationInterval.current) {
            clearInterval(modulationInterval.current);
            modulationInterval.current = null;
        }
        if (oscillatorRef.current) {
            try {
                oscillatorRef.current.stop();
            } catch(e) {}
            oscillatorRef.current = null;
        }
        if (audioCtxRef.current) {
            try {
                audioCtxRef.current.close();
            } catch(e) {}
            audioCtxRef.current = null;
        }
        setSirenActive(false);
    };

    const toggleSiren = () => {
        if (sirenActive) {
            stopSiren();
        } else {
            startSiren();
        }
    };

    // Update map theme layer
    useEffect(() => {
        if (tileLayerRef.current && mapInstance.current) {
            const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
            const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
            tileLayerRef.current.setUrl(mapTheme === 'dark' ? darkUrl : lightUrl);
        }
    }, [mapTheme]);

    // Handle map loading and updates
    useEffect(() => {
        if (!activeSos || !ambulancePos || visualizerTab) return;

        loadLeaflet().then((L) => {
            LRef.current = L;
            if (!mapRef.current) return;

            if (!mapInstance.current) {
                mapInstance.current = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView([ambulancePos.lat, ambulancePos.lng], 14);

                const darkUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
                const lightUrl = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

                tileLayerRef.current = L.tileLayer(mapTheme === 'dark' ? darkUrl : lightUrl, {
                    maxZoom: 19
                }).addTo(mapInstance.current);

                markersGroup.current = L.layerGroup().addTo(mapInstance.current);
            }

            renderMapElements();
        });
    }, [activeSos, ambulancePos, routingCoords, visualizerTab]);

    const renderMapElements = () => {
        const L = LRef.current;
        const map = mapInstance.current;
        const group = markersGroup.current;
        if (!L || !map || !group) return;

        group.clearLayers();
        if (routeLine.current) routeLine.current.remove();

        // 1. Draw routing line (high contrast red solid path)
        if (routingCoords.length > 0) {
            routeLine.current = L.polyline(routingCoords, {
                color: '#ef4444',
                weight: 6,
                opacity: 0.9,
                className: 'ambulance-route-path'
            }).addTo(map);
        }

        // 2. Patient Marker (Blue Pulsing icon)
        const start = activeSos.coordinates;
        const patientHtml = `
            <div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-60"></span>
                <div class="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow-md"></div>
            </div>
        `;
        const patientIcon = L.divIcon({ html: patientHtml, iconSize: [24, 24], iconAnchor: [12, 12] });
        L.marker([start.lat, start.lng], { icon: patientIcon }).addTo(group);

        // 3. Hospital Destination Marker (Red pin)
        if (hospitalInfo) {
            const destHtml = `
                <div class="flex flex-col items-center">
                    <div class="w-8 h-8 rounded-full bg-red-600 text-white border-2 border-slate-900 flex items-center justify-center text-xs font-black shadow-lg">
                        H
                    </div>
                    <div class="w-0.5 h-2 bg-red-600"></div>
                </div>
            `;
            const destIcon = L.divIcon({ html: destHtml, iconSize: [32, 40], iconAnchor: [16, 40] });
            L.marker([hospitalInfo.lat, hospitalInfo.lng], { icon: destIcon }).addTo(group);
        }

        // 4. Ambulance Position Marker (Truck icon with warning strobe)
        const ambHtml = `
            <div class="relative flex items-center justify-center">
                <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-red-500 opacity-40"></span>
                <div class="w-8 h-8 rounded-full bg-slate-950 text-white flex items-center justify-center border-2 border-red-500 shadow-xl relative z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M19 18h2a1 1 0 0 0 1-1v-5.5a1.5 1.5 0 0 0-.5-1.1L18 7h-4"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
                </div>
            </div>
        `;
        const ambIcon = L.divIcon({ html: ambHtml, iconSize: [40, 40], iconAnchor: [20, 20] });
        ambulanceMarker.current = L.marker([ambulancePos.lat, ambulancePos.lng], { icon: ambIcon }).addTo(group);

        // Fit bounds initially if map loads
        if (routingCoords.length > 0 && currentStepIdx === 0) {
            map.fitBounds(L.latLngBounds(routingCoords), { padding: [40, 40] });
        } else {
            map.setView([ambulancePos.lat, ambulancePos.lng]);
        }
    };

    // Drive simulator runner
    const toggleSimulation = () => {
        if (isSimulating) {
            clearInterval(simInterval.current);
            setIsSimulating(false);
            setHudSpeed(0);
        } else {
            if (routingCoords.length === 0) return;
            setIsSimulating(true);
            setHudSpeed(65);

            let step = currentStepIdx;
            simInterval.current = setInterval(() => {
                step += 1;
                if (step >= routingCoords.length) {
                    clearInterval(simInterval.current);
                    setIsSimulating(false);
                    setHudSpeed(0);
                    setHudDistance(0);
                    setHudEta(0);
                    setCurrentDirection('ARRIVED AT TRAUMA BAY');
                    
                    const destination = routingCoords[routingCoords.length - 1];
                    const finalPos = { lat: destination[0], lng: destination[1] };
                    setAmbulancePos(finalPos);
                    localStorage.setItem('active_ambulance_pos', JSON.stringify(finalPos));
                    window.dispatchEvent(new Event('storage'));
                    return;
                }

                setCurrentStepIdx(step);
                const currentCoords = routingCoords[step];
                const newPos = { lat: currentCoords[0], lng: currentCoords[1] };
                setAmbulancePos(newPos);
                
                // Write current position to localStorage to synchronize patient & hospital panels
                localStorage.setItem('active_ambulance_pos', JSON.stringify(newPos));
                window.dispatchEvent(new Event('storage'));

                // Calculate simulator HUD statistics
                const remainingSteps = routingCoords.length - step;
                const distanceVal = remainingSteps * 0.12; // Approx distance
                setHudDistance(distanceVal.toFixed(2));
                setHudEta(Math.max(1, Math.ceil(distanceVal * 1.5)));
                setHudSpeed(Math.floor(55 + Math.random() * 20));

                // Set dynamic turn indicators
                if (remainingSteps < 3) {
                    setCurrentDirection('Arriving at Trauma Intake Bay');
                } else if (step % 5 === 0) {
                    const directions = ['Turn Left onto primary road', 'Turn Right towards Emergency', 'Keep straight under Chirag Delhi flyover', 'Merge into emergency slip road'];
                    setCurrentDirection(directions[(step / 5) % directions.length]);
                }
            }, 3000 / simSpeed);
        }
    };

    // Speed multiplier logic
    const handleSpeedChange = (mult) => {
        setSimSpeed(mult);
        if (isSimulating) {
            // Restart interval with new speed
            clearInterval(simInterval.current);
            setIsSimulating(false);
            setTimeout(() => {
                toggleSimulation();
            }, 50);
        }
    };

    // Geolocation API to fetch driver coordinates
    const locateDriver = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setAmbulancePos(coords);
                    
                    // Reverse geocode driver address
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&zoom=18&addressdetails=1`);
                        const data = await res.json();
                        if (data && data.display_name) {
                            const parts = data.display_name.split(',');
                            setCurrentAddress(parts.slice(0, 3).join(','));
                        }
                    } catch(e) {}
                    
                    if (mapInstance.current) {
                        mapInstance.current.setView([coords.lat, coords.lng], 15);
                    }
                },
                () => alert("Unable to retrieve GPS coordinates.")
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // ==========================================
    // PATHFINDING ALGORITHM GRID SIMULATOR
    // ==========================================
    const resetGrid = () => {
        const initialGrid = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            const currentRow = [];
            for (let c = 0; c < GRID_COLS; c++) {
                // Insert some default wall obstacles to simulate city road blocks
                const isWall = (r === 4 && c > 1 && c < 10) || (r === 7 && c > 5 && c < 14) || (r > 1 && r < 7 && c === 11);
                currentRow.push({
                    row: r,
                    col: c,
                    isStart: r === startNode.r && c === startNode.c,
                    isEnd: r === endNode.r && c === endNode.c,
                    isWall: isWall && !(r === startNode.r && c === startNode.c) && !(r === endNode.r && c === endNode.c),
                    isVisited: false,
                    isPath: false,
                    distance: Infinity,
                    f: Infinity,
                    g: Infinity,
                    h: Infinity,
                    previousNode: null
                });
            }
            initialGrid.push(currentRow);
        }
        setGrid(initialGrid);
        setGridPath([]);
        setVisNodesCount(0);
        setVisTimeTaken(0);
    };

    const toggleWall = (row, col) => {
        if (isVisRunning) return;
        if ((row === startNode.r && col === startNode.c) || (row === endNode.r && col === endNode.c)) return;

        setGrid(prev => {
            const newGrid = prev.map(r => r.map(n => {
                if (n.row === row && n.col === col) {
                    return { ...n, isWall: !n.isWall };
                }
                return n;
            }));
            return newGrid;
        });
    };

    // Dijkstra and A* algorithms implementation
    const runGridPathfinding = async () => {
        if (isVisRunning) return;
        setIsVisRunning(true);
        resetGrid();

        // Small delay helper
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        const nodesToAnimate = [];
        const start = { ...startNode, distance: 0, f: 0, g: 0, h: 0 };
        const target = endNode;
        
        let pathFound = false;
        const startTime = performance.now();

        // 1. A* Algorithm Implementation
        if (gridAlgo === 'astar') {
            const openSet = [];
            const closedSet = new Set();
            
            // Build local copy of node structures
            const nodeGrid = grid.map(r => r.map(n => ({ ...n, distance: Infinity, f: Infinity, g: Infinity, h: Infinity, previousNode: null })));
            const startNodeRef = nodeGrid[start.r][start.c];
            startNodeRef.g = 0;
            startNodeRef.h = Math.abs(start.r - target.r) + Math.abs(start.c - target.c); // Manhattan heuristic
            startNodeRef.f = startNodeRef.h;
            
            openSet.push(startNodeRef);

            while (openSet.length > 0) {
                // Find node in openSet with lowest f value
                openSet.sort((a, b) => a.f - b.f);
                const current = openSet.shift();
                
                if (current.isWall) continue;
                
                closedSet.add(`${current.row},${current.col}`);
                nodesToAnimate.push(current);

                if (current.row === target.r && current.col === target.c) {
                    pathFound = true;
                    // Backtrack path
                    let curr = current;
                    const path = [];
                    while (curr !== null) {
                        path.unshift(curr);
                        curr = curr.previousNode;
                    }
                    
                    // Run animation loops
                    await animateAlgorithm(nodesToAnimate, path, sleep, startTime);
                    break;
                }

                // Evaluate neighbors
                const neighbors = [];
                const { row, col } = current;
                if (row > 0) neighbors.push(nodeGrid[row - 1][col]);
                if (row < GRID_ROWS - 1) neighbors.push(nodeGrid[row + 1][col]);
                if (col > 0) neighbors.push(nodeGrid[row][col - 1]);
                if (col < GRID_COLS - 1) neighbors.push(nodeGrid[row][col + 1]);

                for (const neighbor of neighbors) {
                    if (neighbor.isWall || closedSet.has(`${neighbor.row},${neighbor.col}`)) continue;

                    const tempG = current.g + 1;
                    let newPath = false;

                    if (openSet.includes(neighbor)) {
                        if (tempG < neighbor.g) {
                            neighbor.g = tempG;
                            newPath = true;
                        }
                    } else {
                        neighbor.g = tempG;
                        newPath = true;
                        openSet.push(neighbor);
                    }

                    if (newPath) {
                        neighbor.h = Math.abs(neighbor.row - target.r) + Math.abs(neighbor.col - target.c);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.previousNode = current;
                    }
                }
            }
        } 
        // 2. Dijkstra's Algorithm Implementation
        else {
            const unvisitedNodes = [];
            const nodeGrid = grid.map(r => r.map(n => ({ ...n, distance: Infinity, previousNode: null })));
            
            nodeGrid[start.r][start.c].distance = 0;
            
            for (let r = 0; r < GRID_ROWS; r++) {
                for (let c = 0; c < GRID_COLS; c++) {
                    unvisitedNodes.push(nodeGrid[r][c]);
                }
            }

            while (unvisitedNodes.length > 0) {
                unvisitedNodes.sort((a, b) => a.distance - b.distance);
                const current = unvisitedNodes.shift();

                if (current.distance === Infinity) break;
                if (current.isWall) continue;

                nodesToAnimate.push(current);

                if (current.row === target.r && current.col === target.c) {
                    pathFound = true;
                    let curr = current;
                    const path = [];
                    while (curr !== null) {
                        path.unshift(curr);
                        curr = curr.previousNode;
                    }
                    await animateAlgorithm(nodesToAnimate, path, sleep, startTime);
                    break;
                }

                // Update neighbor distances
                const neighbors = [];
                const { row, col } = current;
                if (row > 0) neighbors.push(nodeGrid[row - 1][col]);
                if (row < GRID_ROWS - 1) neighbors.push(nodeGrid[row + 1][col]);
                if (col > 0) neighbors.push(nodeGrid[row][col - 1]);
                if (col < GRID_COLS - 1) neighbors.push(nodeGrid[row][col + 1]);

                for (const neighbor of neighbors) {
                    if (neighbor.isWall) continue;
                    const tentativeDistance = current.distance + 1;
                    if (tentativeDistance < neighbor.distance) {
                        neighbor.distance = tentativeDistance;
                        neighbor.previousNode = current;
                    }
                }
            }
        }

        if (!pathFound) {
            const endTime = performance.now();
            setVisTimeTaken((endTime - startTime).toFixed(2));
            setVisNodesCount(nodesToAnimate.length);
            alert("No path found on the simulated block.");
            setIsVisRunning(false);
        }
    };

    const animateAlgorithm = async (visitedNodes, pathNodes, sleep, startTime) => {
        // Animate visited nodes
        for (let i = 0; i < visitedNodes.length; i++) {
            const node = visitedNodes[i];
            setGrid(prev => {
                return prev.map(r => r.map(n => {
                    if (n.row === node.row && n.col === node.col && !n.isStart && !n.isEnd) {
                        return { ...n, isVisited: true };
                    }
                    return n;
                }));
            });
            setVisNodesCount(i + 1);
            await sleep(25);
        }

        // Animate final path
        for (let i = 0; i < pathNodes.length; i++) {
            const node = pathNodes[i];
            setGrid(prev => {
                return prev.map(r => r.map(n => {
                    if (n.row === node.row && n.col === node.col && !n.isStart && !n.isEnd) {
                        return { ...n, isPath: true };
                    }
                    return n;
                }));
            });
            await sleep(40);
        }

        const endTime = performance.now();
        setVisTimeTaken((endTime - startTime).toFixed(2));
        setIsVisRunning(false);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#090d16', color: 'white', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            
            {/* Siren visual flashing border when active */}
            {sirenActive && (
                <div style={{
                    position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999,
                    border: '8px solid red', animation: 'sirenBorder 1s infinite alternate'
                }} />
            )}

            <style>{`
                @keyframes sirenBorder {
                    0% { border-color: rgba(239, 68, 68, 0.7); box-shadow: inset 0 0 30px rgba(239, 68, 68, 0.5); }
                    100% { border-color: rgba(59, 130, 246, 0.7); box-shadow: inset 0 0 30px rgba(59, 130, 246, 0.5); }
                }
                .ambulance-route-path {
                    stroke-dasharray: 12, 10;
                    animation: runAmbulanceRoute 30s linear infinite;
                }
                @keyframes runAmbulanceRoute {
                    to { stroke-dashoffset: -1000; }
                }
            `}</style>

            {/* Left sidebar widgets */}
            <div style={{ width: '400px', background: '#0d1527', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', background: 'linear-gradient(135deg, #1e1b4b, #0f172a)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
                            <Navigation size={22} color="white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '800', letterSpacing: '0.5px' }}>Ambulance HUD</h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>Emergency Navigator</p>
                        </div>
                    </div>
                </div>

                {/* Dashboard Tabs Selector */}
                <div style={{ display: 'flex', padding: '16px 24px', gap: '8px' }}>
                    <button 
                        onClick={() => setVisualizerTab(false)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${!visualizerTab ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <Compass size={14} /> GPS Navigation
                    </button>
                    <button 
                        onClick={() => setVisualizerTab(true)}
                        className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${visualizerTab ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                    >
                        <Cpu size={14} /> Compare Dijkstra
                    </button>
                </div>

                <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Active SOS Panel */}
                    {!visualizerTab ? (
                        <>
                            <div style={{ background: '#1e293b/40', border: '1px solid #334155', borderRadius: '20px', padding: '20px', spaceY: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 'bold', padding: '3px 8px', background: activeSos ? '#fef2f2' : '#0f172a', color: activeSos ? '#ef4444' : '#64748b', borderRadius: '20px', border: activeSos ? '1px solid #fee2e2' : '1px solid #1e293b' }}>
                                        <ShieldAlert size={12} className={activeSos ? "animate-pulse" : ""} />
                                        {activeSos ? "ACTIVE SOS INTAKE" : "STANDBY"}
                                    </span>
                                    {activeSos && (
                                        <button 
                                            onClick={clearAlert} 
                                            style={{ background: '#334155', border: 'none', color: '#94a3b8', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '8px', cursor: 'pointer' }}
                                            onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                                            onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                                        >
                                            Reset Alert
                                        </button>
                                    )}
                                </div>

                                {activeSos ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Patient Name</p>
                                            <h4 style={{ margin: '2px 0 0 0', fontSize: '1.05rem', fontWeight: '800' }}>{activeSos.patientName}</h4>
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Triage Destination</p>
                                            <h4 style={{ margin: '2px 0 0 0', fontSize: '0.95rem', color: '#fca5a5', fontWeight: '700' }}>{hospitalInfo?.name}</h4>
                                        </div>
                                        <div style={{ background: '#0b1329', padding: '12px', borderRadius: '12px', border: '1px solid #1e293b' }}>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '0.65rem', fontWeight: 'bold', color: '#f87171' }}>AI CLINICAL BRIEF PRE-READ</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>{activeSos.condition}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', py: '12px' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: '16px' }}>No active emergency. Load a Noida/Delhi demo SOS route to simulate driving.</p>
                                        <button 
                                            onClick={loadDemoSos} 
                                            style={{ width: '100%', padding: '10px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
                                            onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
                                        >
                                            Load Demo SOS Alert
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Siren Synthesizer panel */}
                            <div style={{ background: '#1e293b/40', border: '1px solid #334155', borderRadius: '20px', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.3px' }}>Acoustic Siren Synthesizer</h4>
                                    <span style={{ fontSize: '0.65rem', background: sirenActive ? 'rgba(239,68,68,0.2)' : '#0f172a', color: sirenActive ? '#ef4444' : '#64748b', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                                        {sirenActive ? 'ON' : 'OFF'}
                                    </span>
                                </div>
                                <p style={{ margin: '0 0 16px 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                    Play a dual-tone wailing siren using the browser's Web Audio API oscillator. Audio output adjusts frequency dynamically.
                                </p>
                                <button 
                                    onClick={toggleSiren}
                                    style={{ 
                                        width: '100%', padding: '12px', 
                                        background: sirenActive ? '#334155' : '#ef4444', 
                                        color: 'white', border: 'none', borderRadius: '12px', 
                                        fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    {sirenActive ? <><VolumeX size={16} /> Silence Siren</> : <><Volume2 size={16} /> Synthesize Siren</>}
                                </button>
                            </div>

                            {/* Simulation speed controls */}
                            {activeSos && routingCoords.length > 0 && (
                                <div style={{ background: '#1e293b/40', border: '1px solid #334155', borderRadius: '20px', padding: '20px' }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: '800' }}>Simulation Speed</h4>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '0.75rem', color: '#94a3b8' }}>Fast-forward the driving tracker animation.</p>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {[1, 2, 5].map((multiplier) => (
                                            <button
                                                key={multiplier}
                                                onClick={() => handleSpeedChange(multiplier)}
                                                style={{
                                                    flex: 1, padding: '8px', 
                                                    background: simSpeed === multiplier ? '#ef4444' : '#334155', 
                                                    color: 'white', border: 'none', borderRadius: '8px', 
                                                    fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer'
                                                }}
                                            >
                                                {multiplier}x
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        
                        /* PATHFINDING COMPARISON SIDEBAR DETAILS */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ background: 'linear-gradient(135deg, #312e81, #1e1b4b)', border: '1px solid #4f46e5', borderRadius: '20px', padding: '20px' }}>
                                <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc' }}>
                                    <Cpu size={16} /> Why Dijkstra is slower
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: '#cbd5e1', lineHeight: '1.4' }}>
                                    Dijkstra is an **uninformed search** algorithm. It scans outwards in all directions, evaluating all nodes in concentric circles. 
                                    <br/><br/>
                                    **A\* Search** uses a heuristic (e.g. straight line distance) to direct its search towards the goal, evaluating far fewer nodes.
                                    <br/><br/>
                                    **Contraction Hierarchies (OSRM)** pre-compiles bypasses on real road networks, shrinking queries to $O(1)$/sub-millisecond time.
                                </p>
                            </div>

                            <div style={{ background: '#1e293b/40', border: '1px solid #334155', borderRadius: '20px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800' }}>Algorithm Selector</h4>
                                
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                        onClick={() => setGridAlgo('dijkstra')}
                                        style={{ flex: 1, padding: '8px', background: gridAlgo === 'dijkstra' ? '#4f46e5' : '#334155', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}
                                    >
                                        Dijkstra's
                                    </button>
                                    <button 
                                        onClick={() => setGridAlgo('astar')}
                                        style={{ flex: 1, padding: '8px', background: gridAlgo === 'astar' ? '#4f46e5' : '#334155', border: 'none', borderRadius: '8px', color: 'white', fontSize: '0.75rem', fontWeight: 'bold' }}
                                    >
                                        A* (Heuristic)
                                    </button>
                                </div>

                                <div style={{ borderTop: '1px solid #334155', pt: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>Evaluated Nodes:</span>
                                        <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>{visNodesCount}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: '#94a3b8' }}>Search Time:</span>
                                        <span style={{ fontWeight: 'bold', color: '#34d399' }}>{visTimeTaken} ms</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={runGridPathfinding}
                                    disabled={isVisRunning}
                                    style={{ width: '100%', padding: '10px', background: '#4f46e5', border: 'none', borderRadius: '10px', color: 'white', fontSize: '0.8rem', fontWeight: '800', cursor: 'pointer', mt: '8px' }}
                                >
                                    {isVisRunning ? 'Visualizing...' : 'Run Pathfinding'}
                                </button>
                                <button 
                                    onClick={resetGrid}
                                    disabled={isVisRunning}
                                    style={{ width: '100%', padding: '8px', background: '#334155', border: 'none', borderRadius: '10px', color: '#cbd5e1', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                >
                                    Clear Grid
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right main panel */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                
                {/* HUD Header */}
                <div style={{ height: '70px', borderBottom: '1px solid #1e293b', background: '#0b1329', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>Active Route Navigation</h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <span style={{ fontSize: '0.65rem', background: '#1e293b', color: '#34d399', border: '1px solid #334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                                OSRM Engine (Contraction Hierarchies)
                            </span>
                            <span style={{ fontSize: '0.65rem', background: '#1e293b', color: '#a5b4fc', border: '1px solid #334155', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
                                0 ms (Sub-millisecond)
                            </span>
                        </div>
                    </div>

                    {!visualizerTab && activeSos && (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button 
                                onClick={locateDriver} 
                                style={{ background: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '8px 16px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                                onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
                                onMouseOut={(e) => e.currentTarget.style.background = '#1e293b'}
                            >
                                Locate Driver GPS
                            </button>
                            <button 
                                onClick={toggleSimulation}
                                style={{ 
                                    background: isSimulating ? '#e11d48' : '#34d399', 
                                    color: 'white', border: 'none', padding: '8px 20px', 
                                    borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold', 
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                    boxShadow: isSimulating ? '0 0 15px rgba(225, 29, 72, 0.4)' : '0 0 15px rgba(52, 211, 153, 0.4)'
                                }}
                            >
                                {isSimulating ? <><Square size={12} /> Stop Simulation</> : <><Play size={12} fill="white" /> Engage Simulation</>}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main dynamic panel content */}
                <div style={{ flex: 1, position: 'relative', background: '#070a13' }}>
                    
                    {/* TAB 1: REAL-WORLD MAP HUD */}
                    {!visualizerTab ? (
                        <>
                            {activeSos ? (
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
                                    
                                    {/* Leaflet map container */}
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <div ref={mapRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

                                        {/* Floating Bright/Dark Toggle */}
                                        <button 
                                            onClick={() => setMapTheme(prev => prev === 'dark' ? 'light' : 'dark')}
                                            style={{
                                                position: 'absolute', top: '20px', right: '20px', zIndex: 10,
                                                padding: '10px 16px', borderRadius: '12px', border: '1px solid #1e293b',
                                                background: mapTheme === 'dark' ? '#0f172a/90' : 'white/95',
                                                color: mapTheme === 'dark' ? 'white' : '#0f172a',
                                                fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                                backdropFilter: 'blur(8px)'
                                            }}
                                        >
                                            {mapTheme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
                                            {mapTheme === 'dark' ? 'Bright Map' : 'Dark Map'}
                                        </button>
                                        
                                        {/* Navigation compass instructions banner */}
                                        <div style={{
                                            position: 'absolute', top: '20px', left: '20px', zIndex: 10,
                                            background: '#0f172ab0', border: '1px solid #1e293b', padding: '16px',
                                            borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                                            backdropFilter: 'blur(8px)', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', maxWidth: '440px'
                                        }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justify: 'center', animation: isSimulating ? 'pulseCompass 1.5s infinite' : 'none' }}>
                                                <Compass size={20} color="white" />
                                            </div>
                                            <div>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>CURRENT PILOT INSTRUCTION</span>
                                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: '800', color: 'white', marginTop: '2px' }}>{currentDirection}</p>
                                            </div>
                                        </div>

                                        <style>{`
                                            @keyframes pulseCompass {
                                                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                                                70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                                                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                                            }
                                        `}</style>
                                    </div>

                                    {/* Telemetry Dashboard widgets */}
                                    <div style={{ height: '120px', background: '#0b1329', borderTop: '1px solid #1e293b', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px' }}>
                                        
                                        {/* Speed */}
                                        <div style={{ background: '#0b1329', display: 'flex', flexDirection: 'column', justify: 'center', pl: '32px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Ambulance Speed</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', mt: '4px' }}>
                                                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#ef4444' }}>{hudSpeed}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>KM/H</span>
                                            </div>
                                        </div>

                                        {/* Distance */}
                                        <div style={{ background: '#0b1329', display: 'flex', flexDirection: 'column', justify: 'center', pl: '32px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Remaining Distance</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', mt: '4px' }}>
                                                <span style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>{hudDistance}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>KM</span>
                                            </div>
                                        </div>

                                        {/* ETA */}
                                        <div style={{ background: '#0b1329', display: 'flex', flexDirection: 'column', justify: 'center', pl: '32px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Estimated ETA</span>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', mt: '4px' }}>
                                                <span style={{ fontSize: '2rem', fontWeight: '900', color: '#34d399' }}>{hudEta}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#94a3b8' }}>MIN</span>
                                            </div>
                                        </div>

                                        {/* GPS status */}
                                        <div style={{ background: '#0b1329', display: 'flex', flexDirection: 'column', justify: 'center', pl: '32px' }}>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Telemetry Link</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', mt: '10px' }}>
                                                <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', animation: 'blinkGps 1s infinite alternate' }} />
                                                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>ACTIVE PATH SYNC</span>
                                            </div>
                                            <style>{`
                                                @keyframes blinkGps {
                                                    from { opacity: 0.3; }
                                                    to { opacity: 1; }
                                                }
                                            `}</style>
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: '32px', textAlign: 'center' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#ef4444/10', display: 'flex', alignItems: 'center', justify: 'center', color: '#ef4444', marginBottom: '24px' }}>
                                        <ShieldAlert size={40} />
                                    </div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '8px' }}>Standby Mode</h2>
                                    <p style={{ color: '#94a3b8', maxWidth: '440px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        The Ambulance Driver Nav system is online and listening. When an SOS is triggered, the map and routing telemetry will lock on to the coordinates.
                                    </p>
                                    <button 
                                        onClick={loadDemoSos} 
                                        style={{ marginTop: '24px', padding: '12px 24px', background: '#ef4444', border: 'none', color: 'white', borderRadius: '12px', fontSize: '0.85rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)' }}
                                    >
                                        Trigger Demo SOS Alert
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (

                        /* TAB 2: INTERACTIVE PATHFINDING ALGORITHM VISUALIZER */
                        <div style={{ position: 'absolute', inset: 0, padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', margin: 0 }}>Route Optimization Visualizer</h2>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>
                                        Click nodes on the grid to create walls/traffic. Compare Dijkstra's uninformed scan vs. A*'s heuristic-guided beam.
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '3px' }} /> Start (Ambulance)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }} /> End (Patient/ER)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#475569', borderRadius: '3px' }} /> Wall (Obstacle)</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'rgba(56, 189, 248, 0.3)', borderRadius: '3px', border: '1px solid #38bdf8' }} /> Evaluated Nodes</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }} /> Shortest Path</div>
                                </div>
                            </div>

                            {/* Pathfinding Interactive Grid */}
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ 
                                    background: '#0d1527', border: '1px solid #1e293b', 
                                    borderRadius: '16px', padding: '16px', display: 'inline-block' 
                                }}>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateRows: `repeat(${GRID_ROWS}, 32px)`, 
                                        gridTemplateColumns: `repeat(${GRID_COLS}, 32px)`, 
                                        gap: '2px' 
                                    }}>
                                        {grid.map((row, rIdx) => 
                                            row.map((node, cIdx) => {
                                                const { isStart, isEnd, isWall, isVisited, isPath } = node;
                                                let bg = '#1e293b';
                                                let border = '1px solid #334155';
                                                let scale = 1;
                                                let shadow = 'none';

                                                if (isStart) {
                                                    bg = '#22c55e'; // Start Green
                                                    border = '1px solid #86efac';
                                                } else if (isEnd) {
                                                    bg = '#ef4444'; // End Red
                                                    border = '1px solid #fca5a5';
                                                } else if (isWall) {
                                                    bg = '#475569'; // Wall Grey
                                                    border = '1px solid #64748b';
                                                } else if (isPath) {
                                                    bg = '#ef4444'; // Shortest path Red
                                                    border = '1px solid #fca5a5';
                                                    scale = 1.05;
                                                    shadow = '0 0 10px rgba(239,68,68,0.7)';
                                                } else if (isVisited) {
                                                    bg = gridAlgo === 'astar' ? 'rgba(217, 119, 6, 0.35)' : 'rgba(56, 189, 248, 0.25)';
                                                    border = gridAlgo === 'astar' ? '1px solid #d97706' : '1px solid #38bdf8';
                                                }

                                                return (
                                                    <div 
                                                        key={`${rIdx}-${cIdx}`}
                                                        onClick={() => toggleWall(rIdx, cIdx)}
                                                        style={{ 
                                                            background: bg, border: border, borderRadius: '4px',
                                                            cursor: 'pointer', transition: 'all 0.1s ease',
                                                            transform: `scale(${scale})`, boxShadow: shadow,
                                                            display: 'flex', alignItems: 'center', justify: 'center'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            if (!isStart && !isEnd && !isWall && !isPath && !isVisited) {
                                                                e.currentTarget.style.background = '#334155';
                                                            }
                                                        }}
                                                        onMouseOut={(e) => {
                                                            if (!isStart && !isEnd && !isWall && !isPath && !isVisited) {
                                                                e.currentTarget.style.background = bg;
                                                            }
                                                        }}
                                                    >
                                                        {isStart && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>🚑</span>}
                                                        {isEnd && <span style={{ fontSize: '10px', fontWeight: 'bold' }}>🏥</span>}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Informational Cards comparing OSRM (Contraction Hierarchies) */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                <div style={{ background: '#0d1527', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '6px', borderRadius: '8px', color: '#38bdf8' }}><Zap size={16} /></div>
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>Dijkstra's Algorithm</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                        Checks nodes systematically outwards in all directions. Guaranteed to find the absolute shortest path, but has a search complexity of $O(|E| + |V| \log |V|)$. Scans widely, making it slower on huge networks.
                                    </p>
                                </div>
                                <div style={{ background: '#0d1527', border: '1px solid #1e293b', borderRadius: '16px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(217, 119, 6, 0.15)', padding: '6px', borderRadius: '8px', color: '#fbbf24' }}><Award size={16} /></div>
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold' }}>A* Search Algorithm</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                        Optimized version of Dijkstra. Uses a heuristic (Manhattan or Haversine distance to target) to prioritize nodes closer to the destination. Drastically reduces evaluated nodes, saving CPU and search time.
                                    </p>
                                </div>
                                <div style={{ background: '#0f172a', border: '1px solid #4f46e5', borderRadius: '16px', padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ background: 'rgba(79, 70, 229, 0.15)', padding: '6px', borderRadius: '8px', color: '#818cf8' }}><RefreshCw size={16} /></div>
                                        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 'bold', color: '#a5b4fc' }}>OSRM (Contraction Hierarchies)</h4>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                        State-of-the-art road routing. Pre-contracts highways and core intersections beforehand. During active driving, Dijkstra runs on a shrunk network, yielding route results in sub-milliseconds ($O(1)$) globally!
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </div>
    );
};

export default DriverDashboard;
