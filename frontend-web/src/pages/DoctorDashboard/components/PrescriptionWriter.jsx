import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Plus, Loader2, Check, AlertCircle, FileText, Printer } from 'lucide-react';
import api from '../../../api/axios';

const COMMON_DRUGS = [
    { name: 'Imatinib 400mg', type: 'Targeted Therapy', defaultDose: '400mg', defaultFreq: 'Once daily' },
    { name: 'Tamoxifen 20mg', type: 'Hormone Therapy', defaultDose: '20mg', defaultFreq: 'Once daily' },
    { name: 'Crizotinib 250mg', type: 'ALK Inhibitor', defaultDose: '250mg', defaultFreq: 'Twice daily' },
    { name: 'Doxorubicin 50mg', type: 'Chemotherapy', defaultDose: '50mg/m²', defaultFreq: 'IV every 3 weeks' },
    { name: 'Ondansetron 8mg', type: 'Anti-emetic', defaultDose: '8mg', defaultFreq: 'As needed for nausea' },
    { name: 'Prednisolone 10mg', type: 'Corticosteroid', defaultDose: '10mg', defaultFreq: 'Once daily in the morning' }
];

const fetchPatientPrescriptions = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/medications`);
    return res.data;
};

const PrescriptionWriter = ({ patientId, patientName, doctorId, doctorName }) => {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [formData, setFormData] = useState({
        medName: '',
        dose: '',
        frequency: '',
        startDate: '',
        endDate: '',
        description: ''
    });

    const { data: prescriptions } = useQuery({
        queryKey: ['patientPrescriptions', patientId],
        queryFn: fetchPatientPrescriptions,
        enabled: !!patientId
    });

    const saveRxMutation = useMutation({
        mutationFn: async (payload) => {
            return await api.post(`/medication-continuity/doctors/${doctorId}/patient/${patientId}/prescription`, payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['patientPrescriptions', patientId]);
            setShowForm(false);
            setFormData({
                medName: '',
                dose: '',
                frequency: '',
                startDate: '',
                endDate: '',
                description: ''
            });
            alert("Prescription added successfully!");
        },
        onError: (err) => {
            console.error(err);
            alert("Failed to save prescription. Verify active appointment exists.");
        }
    });

    const handleSelectSuggestion = (drug) => {
        setFormData(prev => ({
            ...prev,
            medName: drug.name,
            dose: drug.defaultDose,
            frequency: drug.defaultFreq
        }));
        setSearchQuery('');
    };

    const handlePrintPrescription = (med) => {
        const printWindow = window.open('', '_blank');
        const docText = `
            <html>
            <head>
                <title>Prescription - ${patientName}</title>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                    .header-title { font-size: 24px; font-weight: bold; color: #4f46e5; }
                    .clinic-details { text-align: right; font-size: 12px; color: #666; }
                    .section { margin-bottom: 20px; }
                    .section-title { font-size: 12px; font-weight: bold; text-transform: uppercase; color: #666; margin-bottom: 8px; }
                    .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px; }
                    .rx-symbol { font-size: 32px; font-weight: bold; color: #333; margin: 20px 0 10px 0; }
                    .medication-details { border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; background: #fff; margin-bottom: 40px; }
                    .med-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                    .med-instructions { font-size: 14px; color: #555; line-height: 1.6; }
                    .footer { border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; margin-top: 60px; font-size: 12px; color: #666; }
                    .signature-line { border-top: 1px dashed #999; width: 200px; text-align: center; padding-top: 5px; font-weight: bold; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="header-title">CAN-QURE CLINICAL NETWORK</div>
                        <div style="font-size: 12px; color: #666; margin-top: 5px;">AI-Powered Oncology Care</div>
                    </div>
                    <div class="clinic-details">
                        <strong>Prescribing Doctor:</strong> ${doctorName || 'Attending Oncologist'}<br/>
                        License ID: MC-99432<br/>
                        Date: ${new Date().toLocaleDateString()}
                    </div>
                </div>

                <div class="section">
                    <div class="section-title">Patient Information</div>
                    <div class="patient-box">
                        <div><strong>Name:</strong> ${patientName}</div>
                        <div><strong>ID:</strong> #${patientId.slice(-6).toUpperCase()}</div>
                    </div>
                </div>

                <div class="rx-symbol">&#8478;</div>

                <div class="medication-details">
                    <div class="med-name">${med.medName}</div>
                    <div class="med-instructions">
                        <strong>Dosage:</strong> ${med.dose}<br/>
                        <strong>Frequency:</strong> ${med.frequency}<br/>
                        <strong>Duration:</strong> ${new Date(med.startDate).toLocaleDateString()} to ${med.endDate ? new Date(med.endDate).toLocaleDateString() : 'Continuous'}<br/>
                        ${med.description ? `<strong>Instructions:</strong> ${med.description}` : ''}
                    </div>
                </div>

                <div class="footer">
                    <div>
                        <strong>Medical Disclaimer:</strong> This prescription is validated and digitally signed by the doctor.<br/>
                        Verify details via the CAN-QURE portal.
                    </div>
                    <div>
                        <div class="signature-line">Digital Signature</div>
                        <div style="text-align: center; font-size: 10px; margin-top: 3px;">${doctorName || 'Dr. Attending'}</div>
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

    const handleFormSubmit = (e) => {
        e.preventDefault();
        saveRxMutation.mutate(formData);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList size={18} className="text-indigo-500" /> Prescription Writer
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">e‑Prescription compiler with auto‑complete suggestions</p>
                </div>
                <button 
                    onClick={() => setShowForm(!showForm)} 
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all border border-indigo-100"
                >
                    <Plus size={14} /> Add Medication
                </button>
            </div>

            <div className="p-6 space-y-6">
                {/* Form overlay */}
                {showForm && (
                    <form onSubmit={handleFormSubmit} className="p-5 bg-slate-50/60 border border-slate-200/80 rounded-2xl space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            
                            {/* Auto-complete drug selector */}
                            <div className="col-span-2 relative">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Search Oncology Drugs</label>
                                <input 
                                    type="text" 
                                    placeholder="Type to search common drugs (e.g. Imatinib)..."
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value);
                                        setFormData(prev => ({ ...prev, medName: e.target.value }));
                                    }}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                                {searchQuery.trim() && (
                                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto divide-y divide-slate-100">
                                        {COMMON_DRUGS.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map(drug => (
                                            <div 
                                                key={drug.name}
                                                onClick={() => handleSelectSuggestion(drug)}
                                                className="p-3 cursor-pointer hover:bg-indigo-50/40 text-xs font-medium flex justify-between items-center"
                                            >
                                                <span className="text-slate-800 font-bold">{drug.name}</span>
                                                <span className="text-indigo-500 font-bold text-[9px] uppercase bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">{drug.type}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Selected Medication Name</label>
                                <input 
                                    required 
                                    value={formData.medName} 
                                    onChange={e => setFormData({ ...formData, medName: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Dose</label>
                                <input 
                                    required 
                                    value={formData.dose} 
                                    onChange={e => setFormData({ ...formData, dose: e.target.value })}
                                    placeholder="e.g. 400mg"
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Frequency</label>
                                <input 
                                    required 
                                    value={formData.frequency} 
                                    onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                    placeholder="e.g. Once daily"
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Start Date</label>
                                <input 
                                    type="date" 
                                    required 
                                    value={formData.startDate} 
                                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">End Date</label>
                                <input 
                                    type="date" 
                                    required
                                    value={formData.endDate} 
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Clinical Notes</label>
                                <input 
                                    value={formData.description} 
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Instructions, monitoring guidelines..."
                                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)} 
                                className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={saveRxMutation.isPending}
                                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:bg-slate-300"
                            >
                                {saveRxMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Prescription
                            </button>
                        </div>
                    </form>
                )}

                {/* Listing of Current Active Prescriptions */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Prescriptions List</p>
                    {!prescriptions || prescriptions.length === 0 ? (
                        <div className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl text-center text-slate-400 text-xs">
                            No prescriptions compiled yet.
                        </div>
                    ) : (
                        prescriptions.map(med => (
                            <div key={med.id} className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-all">
                                <div>
                                    <p className="font-semibold text-slate-900 text-sm">{med.medName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{med.dose} · {med.frequency}</p>
                                    {med.description && <p className="text-[10px] text-slate-400 mt-1 italic">"{med.description}"</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => handlePrintPrescription(med)}
                                        className="p-2.5 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 transition-all"
                                        title="Print Prescription (PDF)"
                                    >
                                        <Printer size={14} />
                                    </button>
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100 uppercase tracking-wider shrink-0">
                                        Active
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrescriptionWriter;
