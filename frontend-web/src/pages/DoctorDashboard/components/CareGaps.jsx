import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Brain, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../../api/axios';

const fetchPatientCareGaps = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/caregaps`);
    return res.data;
};

const CareGaps = ({ patientId }) => {
    const queryClient = useQueryClient();

    const { data: gaps, isLoading, error } = useQuery({
        queryKey: ['patientCareGaps', patientId],
        queryFn: fetchPatientCareGaps,
        enabled: !!patientId
    });

    const closeGapMutation = useMutation({
        mutationFn: async (gapId) => {
            return await api.post(`/doctor/patient/${patientId}/caregap/${gapId}/resolve`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['patientCareGaps', patientId]);
            alert("Care gap resolved/action requested!");
        },
        onError: (err) => {
            console.error(err);
            alert("Failed to resolve care gap.");
        }
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <span className="ml-2 text-slate-500 text-sm font-medium">Scanning care gaps...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">Failed to scan for care gaps.</p>
            </div>
        );
    }

    const careGaps = gaps || [];

    const colorMap = {
        CRITICAL: 'bg-red-100 text-red-700 border-red-200/60',
        HIGH: 'bg-amber-100 text-amber-700 border-amber-200/60',
        MEDIUM: 'bg-blue-100 text-blue-700 border-blue-200/60',
        LOW: 'bg-slate-100 text-slate-700 border-slate-200/60'
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Brain size={18} className="text-rose-500" /> Care Gap Detection
                        {careGaps.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[9px] font-black flex items-center justify-center shrink-0">
                                {careGaps.length}
                            </span>
                        )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">AI-identified gaps requiring clinical attention</p>
                </div>
            </div>
            
            <div className="p-6 divide-y divide-slate-100">
                {careGaps.length === 0 ? (
                    <div className="py-4 text-center text-slate-400 text-xs">
                        🎉 Zero care gaps detected. Treatment plan fully up to date.
                    </div>
                ) : (
                    careGaps.map(gap => (
                        <div key={gap.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex gap-3 items-start">
                                <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border shrink-0 ${colorMap[gap.priority] || colorMap.LOW}`}>
                                    {gap.priority}
                                </span>
                                <p className="text-sm font-semibold text-slate-800 leading-relaxed">
                                    {gap.title}
                                </p>
                            </div>
                            
                            <div className="flex gap-2 shrink-0">
                                {gap.actions && gap.actions.map((act, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => closeGapMutation.mutate(gap.id)}
                                        disabled={closeGapMutation.isPending}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                            idx === 0 
                                                ? 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300' 
                                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                        }`}
                                    >
                                        {closeGapMutation.isPending && idx === 0 ? 'Loading...' : act}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CareGaps;
