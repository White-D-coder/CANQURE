import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import { getRefillTracking } from '../../../api/user';

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

const RefillDeliveryMap = ({ orderId, status }) => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersGroup = useRef(null);
    const routeLine = useRef(null);
    const LRef = useRef(null);

    const [tracking, setTracking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 1. Poll tracking status from API
    useEffect(() => {
        let isMounted = true;

        const fetchTracking = async () => {
            try {
                const data = await getRefillTracking(orderId);
                if (isMounted) {
                    setTracking(data);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching tracking data", err);
                if (isMounted) {
                    setError("Failed to fetch live coordinates.");
                    setLoading(false);
                }
            }
        };

        fetchTracking();
        const interval = setInterval(fetchTracking, 3000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [orderId]);

    // 2. Initialize Leaflet Map
    useEffect(() => {
        if (loading || !tracking) return;

        loadLeaflet().then((L) => {
            LRef.current = L;
            if (!mapRef.current) return;

            const pharmacyPos = [tracking.pharmacyCoords.lat, tracking.pharmacyCoords.lng];
            const patientPos = [tracking.patientCoords.lat, tracking.patientCoords.lng];

            if (!mapInstance.current) {
                // Initialize map
                mapInstance.current = L.map(mapRef.current, {
                    zoomControl: false,
                    attributionControl: false
                }).setView(patientPos, 14);

                // Add CartoDB sleek tile layer
                L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                    maxZoom: 19
                }).addTo(mapInstance.current);

                // Add scale or zoom controls at bottom-right
                L.control.zoom({ position: 'bottomright' }).addTo(mapInstance.current);

                markersGroup.current = L.layerGroup().addTo(mapInstance.current);
            }

            // Draw/Redraw markers and path
            updateMapLayers();
        });

        return () => {
            // Clean up leaflet route lines or markers
        };
    }, [loading, tracking]);

    // 3. Render Markers & Path
    const updateMapLayers = () => {
        const L = LRef.current;
        const map = mapInstance.current;
        const group = markersGroup.current;
        if (!L || !map || !group) return;

        // Clear existing markers
        group.clearLayers();
        if (routeLine.current) {
            routeLine.current.remove();
        }

        const patientCoords = [tracking.patientCoords.lat, tracking.patientCoords.lng];
        const pharmacyCoords = [tracking.pharmacyCoords.lat, tracking.pharmacyCoords.lng];
        const riderCoords = [tracking.riderCoords.lat, tracking.riderCoords.lng];

        // 3.1 Patient Marker
        const patientIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 border-2 border-white shadow-lg text-sm">🏠</div>`,
            className: 'custom-patient-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        L.marker(patientCoords, { icon: patientIcon })
            .addTo(group)
            .bindPopup("<b>Your Location</b><br/>Delivery destination.");

        // 3.2 Pharmacy Marker
        const pharmacyIcon = L.divIcon({
            html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-600 border-2 border-white shadow-lg text-sm">💊</div>`,
            className: 'custom-pharmacy-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
        });
        L.marker(pharmacyCoords, { icon: pharmacyIcon })
            .addTo(group)
            .bindPopup("<b>Pharmacy Hub</b><br/>Source store.");

        // 3.3 Rider Marker (Only show if OUT_FOR_DELIVERY, ARRIVING, or HANDOVER_PENDING)
        const activeStatuses = ["OUT_FOR_DELIVERY", "ARRIVING", "HANDOVER_PENDING"];
        if (activeStatuses.includes(tracking.status)) {
            const isArrived = tracking.status === 'HANDOVER_PENDING';
            const riderIcon = L.divIcon({
                html: `<div class="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500 border-2 border-white shadow-xl text-lg ${!isArrived ? 'animate-bounce' : ''}">🚚</div>`,
                className: 'custom-rider-marker',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });
            L.marker(riderCoords, { icon: riderIcon })
                .addTo(group)
                .bindPopup(`<b>Refill Rider</b><br/>Current status: ${tracking.status.replace(/_/g, ' ')}`);
        }

        // 3.4 Draw Polyline Route
        if (tracking.routePolyline && tracking.routePolyline.length > 0) {
            routeLine.current = L.polyline(tracking.routePolyline, {
                color: '#6366f1',
                weight: 4,
                opacity: 0.8,
                dashArray: '5, 8',
                lineCap: 'round'
            }).addTo(map);
        }

        // Fit map bounds to contain all points
        try {
            const bounds = L.latLngBounds([patientCoords, pharmacyCoords, riderCoords]);
            map.fitBounds(bounds, { padding: [40, 40] });
        } catch (e) {
            // ignore
        }
    };

    if (loading) {
        return (
            <div className="h-64 rounded-2xl bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-2 border border-slate-200">
                <Loader2 className="animate-spin text-slate-500" size={24} />
                <span className="text-xs font-semibold">Initializing Tracking Map...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-64 rounded-2xl bg-red-50/50 flex flex-col items-center justify-center text-red-500 gap-2 border border-red-100">
                <span className="text-xs font-bold">{error}</span>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
            {/* Live Map Frame */}
            <div ref={mapRef} className="h-64 w-full z-0 bg-slate-100" />

            {/* Tracking Status Card (Overlay) */}
            <div className="absolute top-3 left-3 right-3 z-[1000] bg-white/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-lg flex justify-between items-center">
                <div className="space-y-0.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Courier Status</span>
                    <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                            tracking.status === 'HANDOVER_PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-blue-500 animate-pulse'
                        }`}></span>
                        {tracking.status === 'HANDOVER_PENDING' 
                            ? 'Rider has arrived!' 
                            : tracking.status === 'ARRIVING' 
                            ? 'Arriving shortly...' 
                            : 'Out for delivery (In Transit)'
                        }
                    </h5>
                    <p className="text-[10px] text-slate-500 font-medium">Refill ID: #{tracking.id.slice(-6).toUpperCase()} · Tracking: {tracking.trackingId}</p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estimated ETA</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold mt-1">
                        <Clock size={11} /> {tracking.etaLabel}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RefillDeliveryMap;
