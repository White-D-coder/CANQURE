import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Phone, MapPin, Loader2, AlertCircle, QrCode, Printer } from 'lucide-react';
import api from '../../../api/axios';

const fetchEmergencyData = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/emergency`);
    return res.data;
};

const QREmergencyCard = ({ patientId, patientName }) => {
    const [open, setOpen] = useState(false);

    const { data: emergency, isLoading, error } = useQuery({
        queryKey: ['patientEmergency', patientId],
        queryFn: fetchEmergencyData,
        enabled: !!patientId
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <span className="ml-2 text-slate-500 text-sm font-medium">Loading emergency details...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">Failed to load emergency data.</p>
            </div>
        );
    }

    const {
        cancerType,
        stage,
        allergies,
        bloodType,
        caregiver,
        caregiverPhone,
        pharmacy,
        medications = []
    } = emergency || {};

    // Generate scannable text payload for the QR code
    const qrPayload = JSON.stringify({
        name: patientName,
        id: patientId.slice(-6).toUpperCase(),
        blood: bloodType || 'N/A',
        allergies: allergies || 'None',
        diag: `${cancerType} Stage ${stage}`,
        ice: `${caregiver} (${caregiverPhone})`
    }, null, 2);

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrPayload)}`;

    const handlePrintCard = () => {
        const printWindow = window.open('', '_blank');
        const docText = `
            <html>
            <head>
                <title>Emergency Card - ${patientName}</title>
                <style>
                    body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f1f5f9; }
                    .card { width: 450px; background: white; border: 3px solid #ef4444; border-radius: 16px; padding: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
                    .header { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-bottom: 15px; }
                    .header-title { font-size: 18px; font-weight: bold; color: #b91c1c; }
                    .details { display: grid; grid-template-columns: 2fr 1fr; gap: 15px; font-size: 12px; }
                    .info-group { margin-bottom: 10px; }
                    .label { font-size: 9px; text-transform: uppercase; color: #7f1d1d; font-weight: bold; }
                    .val { font-size: 13px; font-weight: bold; color: #1e293b; margin-top: 2px; }
                    .qr-container { text-align: center; }
                    .qr-container img { border: 1px solid #e2e8f0; padding: 5px; border-radius: 8px; width: 120px; height: 120px; }
                    .allergy-badge { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; padding: 4px 8px; border-radius: 6px; display: inline-block; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="header">
                        <div style="font-size: 24px;">🚨</div>
                        <div class="header-title">EMERGENCY MEDICAL CARD</div>
                    </div>
                    <div class="details">
                        <div>
                            <div class="info-group">
                                <div class="label">Patient Name</div>
                                <div class="val">${patientName}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Primary Diagnosis</div>
                                <div class="val">${cancerType} · Stage ${stage}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Critical Allergies</div>
                                <div class="allergy-badge">${allergies || 'NONE REPORTED'}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Emergency Contact</div>
                                <div class="val">${caregiver}</div>
                                <div style="color: #64748b; font-size: 11px; font-weight: 600; margin-top: 2px;">📞 ${caregiverPhone}</div>
                            </div>
                            <div class="info-group">
                                <div class="label">Blood Type</div>
                                <div class="val">${bloodType || 'N/A'}</div>
                            </div>
                        </div>
                        <div class="qr-container">
                            <div class="label" style="margin-bottom: 8px;">Scan for Medical Summary</div>
                            <img src="${qrCodeUrl}" alt="Emergency QR"/>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(docText);
        printWindow.document.close();
    };

    return (
        <div className="bg-red-50/60 border border-red-200/60 rounded-3xl overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full p-6 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 text-sm">Emergency Intelligence Package</h3>
                        <p className="text-[10px] text-red-700 mt-0.5">Scannable emergency QR card and critical care summary</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">Active</span>
                    <ChevronDown size={16} className={`text-red-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>
            
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            
                            {/* Diagnostic details */}
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-3">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Diagnosis & Blood Type</p>
                                <p className="text-sm font-semibold text-slate-900">{cancerType} · Stage {stage}</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg inline-block">
                                        Allergies: {allergies || 'None'}
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg inline-block">
                                        Blood: {bloodType || 'N/A'}
                                    </span>
                                </div>
                            </div>

                            {/* Live medications checklist */}
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-2">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Active Medications</p>
                                {medications.length === 0 ? (
                                    <p className="text-xs text-slate-400">No active medications found.</p>
                                ) : (
                                    medications.slice(0, 3).map((med, idx) => (
                                        <div key={idx} className="flex justify-between text-xs">
                                            <span className="font-semibold text-slate-800">{med.medName}</span>
                                            <span className="text-slate-500">{med.dose}</span>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Emergency Contact */}
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-2">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Emergency Contacts</p>
                                <p className="text-sm font-semibold text-slate-900">{caregiver || 'Not Set'}</p>
                                {caregiverPhone && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <Phone size={11} /> {caregiverPhone}
                                    </p>
                                )}
                                {pharmacy && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <MapPin size={11} /> {pharmacy}
                                    </p>
                                )}
                            </div>

                            {/* Scannable Card */}
                            <div className="p-4 bg-white border border-red-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-center sm:text-left">
                                    <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">QR Emergency Card</p>
                                    <p className="text-xs text-slate-500 font-medium max-w-[180px] leading-relaxed">
                                        Print this layout for the patient's wallet. Paramedics can scan it to access allergies and medication history.
                                    </p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <img src={qrCodeUrl} alt="Patient QR Code" className="w-24 h-24 border border-slate-200 rounded-xl p-1 shrink-0" />
                                    <button 
                                        onClick={handlePrintCard}
                                        className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1 flex items-center gap-1 hover:bg-red-100 transition-all"
                                    >
                                        <Printer size={10} /> Print Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default QREmergencyCard;
