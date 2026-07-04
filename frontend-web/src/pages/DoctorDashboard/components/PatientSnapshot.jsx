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
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-7">
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Demographics Block */}
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-black text-3xl shrink-0">
                        {patientName?.charAt(0) || 'P'}
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">{patientName}</h2>
                        <p className="text-slate-500 mt-1">{age}y · {gender} · Blood: {bloodType || 'N/A'}</p>
                        <div className="flex gap-2 mt-2 flex-wrap">
                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">
                                {cancerType} · Stage {stage}
                            </span>
                            {ecog !== undefined && (
                                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-100">
                                    ECOG: {ecog}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Details Panels */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Caregiver & Emergency Contact</p>
                        <p className="text-sm font-semibold text-slate-900">{caregiver || 'None Registered'}</p>
                        {caregiverPhone && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                                <Phone size={10} /> {caregiverPhone}
                            </p>
                        )}
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Preferred Pharmacy</p>
                        <p className="text-sm font-semibold text-slate-900">{pharmacy || 'Not Selected'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                            <MapPin size={10} /> Local Partner
                        </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Allergies & Last Consult</p>
                        <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg inline-block mb-1.5">
                            Allergies: {allergies || 'None'}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">Last Consult: {lastConsult || 'Never'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientSnapshot;
