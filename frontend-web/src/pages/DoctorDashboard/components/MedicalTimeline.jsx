import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, ChevronDown, Brain, Stethoscope, Microscope, 
    Pill, FileText, HeartPulse, Loader2, AlertCircle 
} from 'lucide-react';
import api from '../../../api/axios';

const iconMap = {
    AI: Brain,
    CONSULT: Stethoscope,
    SCAN: Microscope,
    MEDS: Pill,
    LAB: FileText,
    DIAGNOSIS: HeartPulse
};

const colorMap = {
    indigo: 'border-indigo-400 text-indigo-600 bg-indigo-50',
    blue: 'border-blue-400 text-blue-600 bg-blue-50',
    emerald: 'border-emerald-400 text-emerald-600 bg-emerald-50',
    amber: 'border-amber-400 text-amber-600 bg-amber-50',
    rose: 'border-rose-400 text-rose-600 bg-rose-50',
    slate: 'border-slate-400 text-slate-600 bg-slate-50'
};

const fetchPatientTimeline = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/timeline`);
    return res.data;
};

const MedicalTimeline = ({ patientId }) => {
    const [filter, setFilter] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);

    const { data: timelineEvents, isLoading, error } = useQuery({
        queryKey: ['patientTimeline', patientId],
        queryFn: fetchPatientTimeline,
        enabled: !!patientId
    });

    const filters = [
        { id: 'ALL', label: 'All History' },
        { id: 'CONSULT', label: 'Consults' },
        { id: 'LAB', label: 'Labs' },
        { id: 'SCAN', label: 'Scans' },
        { id: 'MEDS', label: 'Medications' },
        { id: 'DIAGNOSIS', label: 'Diagnosis' }
    ];

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <span className="ml-2 text-slate-500 text-sm font-medium">Loading timeline...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">Failed to load treatment timeline details.</p>
            </div>
        );
    }

    const events = timelineEvents || [];
    const filteredEvents = filter === 'ALL' ? events : events.filter(e => e.type === filter);

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <TrendingUp size={18} className="text-indigo-500" /> Treatment Timeline
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Complete chronological clinical history</p>
                </div>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none max-w-full">
                    {filters.map(f => (
                        <button 
                            key={f.id} 
                            onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${
                                filter === f.id 
                                    ? 'bg-slate-900 text-white border-slate-900' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-6">
                {filteredEvents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        No events found matching this filter.
                    </div>
                ) : (
                    <div className="relative ml-5 space-y-6">
                        <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-indigo-200 via-slate-100 to-slate-100" />
                        {filteredEvents.map(event => {
                            const IconComponent = iconMap[event.type] || FileText;
                            const colors = colorMap[event.color] || colorMap.slate;
                            return (
                                <div key={event.id} className="relative pl-12 group">
                                    <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${colors}`}>
                                        <IconComponent size={14} />
                                    </div>
                                    <div 
                                        className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-pointer"
                                        onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colors.replace('bg-', 'border-').replace('-50', '-100')}`}>
                                                    {event.type}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-semibold">{event.date}</span>
                                            </div>
                                            <ChevronDown size={14} className={`text-slate-300 transition-transform ${expandedId === event.id ? 'rotate-180' : ''}`} />
                                        </div>
                                        <h4 className="font-semibold text-slate-900 text-sm">{event.title}</h4>
                                        <AnimatePresence>
                                            {expandedId === event.id && (
                                                <motion.p 
                                                    initial={{ opacity: 0, height: 0 }} 
                                                    animate={{ opacity: 1, height: 'auto' }} 
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-xs text-slate-500 mt-2 leading-relaxed"
                                                >
                                                    {event.desc}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalTimeline;
