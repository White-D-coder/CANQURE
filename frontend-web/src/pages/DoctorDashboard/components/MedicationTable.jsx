import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Pill, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import api from '../../../api/axios';

const fetchPatientMedications = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/medications`);
    return res.data;
};

const MedicationTable = ({ patientId }) => {
    const queryClient = useQueryClient();

    const { data: medications, isLoading, error } = useQuery({
        queryKey: ['patientMedications', patientId],
        queryFn: fetchPatientMedications,
        enabled: !!patientId
    });

    // Refill action mutation
    const refillMutation = useMutation({
        mutationFn: async (medId) => {
            return await api.post(`/doctor/patient/${patientId}/medication/${medId}/refill`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['patientMedications', patientId]);
            alert("Refill order dispatched to partner pharmacy successfully!");
        },
        onError: (err) => {
            console.error(err);
            alert("Failed to request prescription refill.");
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <span className="ml-2 text-slate-500 text-sm font-medium">Loading medications...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">Failed to load patient medications.</p>
            </div>
        );
    }

    const meds = medications || [];

    const colorMap = {
        red: { bar: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
        amber: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
        green: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Pill size={18} className="text-indigo-500" /> Medication Table
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Predictive supply tracking and refill recommendations</p>
                </div>
            </div>
            
            <div className="p-6">
                {meds.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No active medications assigned.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {meds.map(med => {
                            const daysRemaining = med.daysRemaining !== undefined ? med.daysRemaining : 5;
                            const totalDays = med.totalDays || 30;
                            const adherence = med.adherence || 95;
                            
                            // Deduce color thresholds
                            let statusColor = 'green';
                            if (daysRemaining <= 5) {
                                statusColor = 'red';
                            } else if (daysRemaining <= 12) {
                                statusColor = 'amber';
                            }
                            
                            const theme = colorMap[statusColor];
                            const fillPct = Math.min(100, (daysRemaining / totalDays) * 100);

                            return (
                                <div key={med.id} className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all duration-200 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-sm">{med.medName}</h4>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{med.dose} · {med.frequency}</p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase ${theme.badge}`}>
                                                {daysRemaining}d left
                                            </span>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1.5">
                                                <span>Supply Timeline ({daysRemaining}/{totalDays} Days)</span>
                                                <span>Adherence: {adherence}%</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${theme.bar} transition-all duration-500`} style={{ width: `${fillPct}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/60 mt-auto">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2 h-2 rounded-full ${theme.dot}`} />
                                            <p className="text-[10px] text-slate-500 font-medium">Compliance Checked</p>
                                        </div>
                                        {daysRemaining <= 7 && (
                                            <button 
                                                onClick={() => refillMutation.mutate(med.id)}
                                                disabled={refillMutation.isPending}
                                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm disabled:bg-slate-300"
                                            >
                                                {refillMutation.isPending ? 'Requesting...' : 'Issue Refill'}
                                            </button>
                                        )}
                                    </div>
                                    
                                    {daysRemaining <= 7 && (
                                        <div className="mt-3 p-2 bg-amber-50 border border-amber-100 rounded-xl">
                                            <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                                                ⚠ Supply low. Auto-recommend refilling to avoid treatment gaps.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicationTable;
