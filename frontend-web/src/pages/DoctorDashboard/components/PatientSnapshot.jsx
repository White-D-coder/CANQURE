import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, MapPin, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../api/axios';

const fetchPatientSnapshot = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/snapshot`);
    return res.data;
};

const PatientSnapshot = ({ patientId, patientName }) => {
    const { data: snapshot, isLoading, error } = useQuery({
        queryKey: ['patientSnapshot', patientId],
        queryFn: fetchPatientSnapshot,
        enabled: !!patientId,
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <span className="ml-2 text-slate-500 text-sm font-medium">Loading snapshot...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">Failed to load patient snapshot details.</p>
            </div>
        );
    }

    const {
        age,
        gender,
        bloodType,
        cancerType,
        stage,
        ecog,
        allergies,
        caregiver,
        caregiverPhone,
        pharmacy,
        lastConsult
    } = snapshot || {};

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                {/* Demographics Block */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-250/60 flex items-center justify-center text-slate-700 font-black text-2xl shrink-0">
                        {patientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">{patientName}</h2>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                            {age} years old · {gender} · Blood Type: <span className="font-bold text-slate-700">{bloodType || 'N/A'}</span>
                        </p>
                        <div className="flex gap-1.5 mt-2.5 flex-wrap">
                            <span className="px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-bold rounded-lg">
                                {cancerType} · Stage {stage}
                            </span>
                            {ecog !== undefined && (
                                <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-650 text-[10px] font-bold rounded-lg">
                                    ECOG Performance: {ecog}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Panels Grid */}
                <div className="w-full lg:w-auto flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 lg:max-w-2xl">
                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Caregiver</p>
                        <p className="text-xs font-semibold text-slate-800">{caregiver || 'None Registered'}</p>
                        {caregiverPhone && (
                            <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                                <Phone size={10} className="text-slate-400" /> {caregiverPhone}
                            </p>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Pharmacy Link</p>
                        <p className="text-xs font-semibold text-slate-800">{pharmacy || 'Not Selected'}</p>
                        <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-1 font-medium">
                            <MapPin size={10} className="text-slate-400" /> Local Partner
                        </p>
                    </div>

                    <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Allergies</p>
                        <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100/60 px-2 py-0.5 rounded-lg inline-block">
                            {allergies || 'None Reported'}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">Last Consult: {lastConsult || 'Never'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientSnapshot;
