import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../../api/axios';

const fetchPatientRedFlags = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/redflags`);
    return res.data;
};

const RedFlagAlerts = ({ patientId }) => {
    const { data: redFlags, isLoading, error } = useQuery({
        queryKey: ['patientRedFlags', patientId],
        queryFn: fetchPatientRedFlags,
        enabled: !!patientId
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-4 bg-red-50/20 border border-dashed border-red-200 rounded-3xl">
                <Loader2 className="animate-spin text-red-500 mr-2" size={16} />
                <span className="text-xs text-red-700 font-medium">Scanning critical red-flags...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-4 text-red-700 flex items-center gap-3 text-xs">
                <AlertCircle size={16} />
                <span>Failed to query active safety flags.</span>
            </div>
        );
    }

    const alerts = redFlags || [];

    if (alerts.length === 0) return null; // Hide if no alerts exist

    return (
        <div className="space-y-3">
            {alerts.map(alert => (
                <div 
                    key={alert.id} 
                    className="bg-red-50 border-2 border-red-200 p-5 rounded-3xl flex items-start gap-4 shadow-sm relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-100/30 rounded-full translate-x-8 -translate-y-8 flex items-center justify-center pointer-events-none">
                        <ShieldAlert size={48} className="text-red-200/50" />
                    </div>

                    <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0 shadow-inner">
                        <ShieldAlert size={22} className="animate-pulse" />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h4 className="text-base font-black text-red-900 leading-tight">
                                {alert.title || "Critical Clinical Safety Warning"}
                            </h4>
                            <span className="bg-red-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                                {alert.severity || "CRITICAL"}
                            </span>
                        </div>
                        <p className="text-red-700 text-xs mt-1.5 leading-relaxed font-semibold">
                            {alert.message}
                        </p>
                        {alert.actionRecommended && (
                            <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-red-800 bg-red-100/60 rounded-xl px-3 py-1.5 border border-red-200/40 w-fit">
                                <Sparkles size={11} className="text-red-600" /> Action Required: {alert.actionRecommended}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default RedFlagAlerts;
