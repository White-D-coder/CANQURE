import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
    getDoctorAppointments,
    getPatientDetails,
    addPrescription,
    updatePrescription,
    getDoctorSlots,
    approveSlot
} from '../../api/doctor';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Calendar,
    Users,
    Clock,
    Pill,
    FileText,
    Activity,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Check,
    AlertCircle,
    Plus,
    Search,
    X,
    Brain,
    ExternalLink,
    ShieldAlert,
    Bell,
    Settings,
    TrendingUp,
    Stethoscope,
    MapPin,
    Phone,
    FileHeart,
    CheckCircle,
    ClipboardList,
    Zap,
    Loader2,
    Video,
    Upload,
    Send,
    Package,
    ChevronDown,
    MoreVertical,
    ArrowRight,
    Microscope,
    HeartPulse
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SOSButton from '../../components/SOSButton';
import ConsultationInterface from '../../components/ConsultationInterface';

// ─── Mock enrichment helpers ────────────────────────────────────────────────
const CANCER_TYPES = [
    'Stage III Breast Cancer',
    'Stage IV Lung Adenocarcinoma',
    'Stage II Colon Cancer',
    'Stage III Blood Cancer (CML)',
    'Stage II Ovarian Cancer',
    'Stage IV Pancreatic Cancer',
];

const getMockPatientMeta = (patientId) => {
    const idx = patientId?.charCodeAt(patientId.length - 1) % CANCER_TYPES.length || 0;
    return {
        age: 38 + (idx * 5),
        gender: idx % 2 === 0 ? 'Male' : 'Female',
        bloodType: ['A+', 'B+', 'O+', 'AB+'][idx % 4],
        cancerType: CANCER_TYPES[idx],
        stage: ['II', 'III', 'IV'][idx % 3],
        caregiver: 'Priya Sharma (Spouse)',
        caregiverPhone: '+91 98765 43210',
        pharmacy: 'Apollo Pharmacy, Sector 12',
        allergies: ['Penicillin', 'Sulfa drugs'][idx % 2] || 'None reported',
        lastConsult: '2026-06-10',
        priority: idx < 2 ? 'EMERGENCY' : idx < 4 ? 'SCHEDULED' : 'MONITORING',
    };
};

const getMockMedications = (patientId) => {
    const idx = patientId?.charCodeAt(patientId.length - 1) % 3 || 0;
    const sets = [
        [
            { id: 'm1', name: 'Imatinib 400mg', dosage: 'Once daily', daysLeft: 5, totalDays: 30, adherence: 92, color: 'amber', pharmacy: 'Apollo Pharmacy', stock: true, eta: '2 hours' },
            { id: 'm2', name: 'Tamoxifen 20mg', dosage: 'Once daily', daysLeft: 18, totalDays: 30, adherence: 100, color: 'green', pharmacy: 'MedPlus Chemist', stock: true, eta: '4 hours' },
            { id: 'm3', name: 'Zoledronic Acid 4mg', dosage: 'Every 4 weeks', daysLeft: 2, totalDays: 28, adherence: 75, color: 'red', pharmacy: 'Fortis Medstore', stock: false, eta: 'Out of stock' },
        ],
        [
            { id: 'm4', name: 'Crizotinib 250mg', dosage: 'Twice daily', daysLeft: 12, totalDays: 30, adherence: 88, color: 'green', pharmacy: 'Apollo Pharmacy', stock: true, eta: '2 hours' },
            { id: 'm5', name: 'Prednisolone 10mg', dosage: 'Once daily', daysLeft: 6, totalDays: 28, adherence: 79, color: 'amber', pharmacy: 'MedPlus Chemist', stock: true, eta: '3 hours' },
        ],
        [
            { id: 'm6', name: 'Doxorubicin 50mg', dosage: 'IV every 3 weeks', daysLeft: 21, totalDays: 21, adherence: 100, color: 'green', pharmacy: 'Hospital Dispensary', stock: true, eta: 'In-house' },
            { id: 'm7', name: 'Ondansetron 8mg', dosage: 'As needed', daysLeft: 3, totalDays: 14, adherence: 95, color: 'red', pharmacy: 'Apollo Pharmacy', stock: true, eta: '1 hour' },
        ],
    ];
    return sets[idx];
};

const getMockCareGaps = (patientId) => {
    const idx = patientId?.charCodeAt(patientId.length - 1) % 2 || 0;
    const sets = [
        [
            { id: 'g1', priority: 'CRITICAL', title: 'CBC blood test overdue by 12 days', color: 'red', actions: ['Order Lab Test', 'View History'] },
            { id: 'g2', priority: 'HIGH', title: 'Follow-up appointment overdue by 20 days', color: 'amber', actions: ['Schedule Appointment'] },
            { id: 'g3', priority: 'MEDIUM', title: 'PET-CT scan not taken in last 6 months', color: 'blue', actions: ['Order Scan'] },
        ],
        [
            { id: 'g4', priority: 'CRITICAL', title: 'Medication refill for Imatinib needed within 5 days', color: 'red', actions: ['Issue Refill', 'Contact Pharmacy'] },
            { id: 'g5', priority: 'HIGH', title: 'Bone marrow biopsy recommended but not scheduled', color: 'amber', actions: ['Schedule Biopsy'] },
        ],
    ];
    return sets[idx];
};

const getMockTimeline = () => [
    { id: 't1', date: 'Today', title: 'AI Brief Generated', type: 'AI', desc: 'Pre-consultation summary auto-compiled from latest records.', icon: Brain, color: 'indigo' },
    { id: 't2', date: 'Jun 18, 2026', title: 'Chemotherapy Review – Cycle 3', type: 'CONSULT', desc: 'Cycle 3 completed. Mild nausea managed with Ondansetron. CBC within acceptable range. Schedule cycle 4 in 3 weeks.', icon: Stethoscope, color: 'blue' },
    { id: 't3', date: 'Jun 10, 2026', title: 'PET-CT Scan Report Uploaded', type: 'SCAN', desc: '14% reduction in index node size. Positive treatment response confirmed. Next imaging in 3 months.', icon: Microscope, color: 'emerald' },
    { id: 't4', date: 'May 28, 2026', title: 'Imatinib Refill – 30 days supply', type: 'MEDS', desc: 'Prescription refilled via Apollo Pharmacy. Delivered same day. Next refill due: June 27.', icon: Pill, color: 'amber' },
    { id: 't5', date: 'May 12, 2026', title: 'CBC Lab Report', type: 'LAB', desc: 'Hb: 11.2 g/dL (low), WBC: 3.8k/mcL (low-normal), Platelets: 190k/mcL. Monitoring required.', icon: FileText, color: 'rose' },
    { id: 't6', date: 'Apr 02, 2026', title: 'Diagnosis Confirmed', type: 'DIAGNOSIS', desc: 'Stage III CML confirmed via bone marrow biopsy. BCR-ABL1 mutation detected. Treatment initiated.', icon: HeartPulse, color: 'slate' },
];

const formatDoctorName = (name) => {
    if (!name) return '';
    return name.startsWith('Dr.') ? name : `Dr. ${name}`;
};

// ─── Sub-component: AI Pre-Read Brief ────────────────────────────────────────
const AIPreReadBrief = ({ patient, meta, medications }) => {
    const [expanded, setExpanded] = useState(true);
    const lowMeds = medications.filter(m => m.daysLeft <= 7);

    return (
        <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-7 text-white relative overflow-hidden">
            <Brain size={120} className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none" />
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                        <Brain size={20} className="text-indigo-300" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">AI Doctor-Ready Pre-Read</h3>
                        <p className="text-indigo-300 text-[10px] font-medium">Auto-generated by Canqure Intelligence · Updated just now</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider">94% Confidence</span>
                    <button onClick={() => setExpanded(!expanded)} className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                        <ChevronDown size={14} className={`text-slate-300 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {expanded && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Primary Diagnosis</p>
                                <p className="text-sm font-semibold text-white leading-relaxed">{meta.cancerType} · Stage {meta.stage}</p>
                                <p className="text-xs text-indigo-300 mt-1">Diagnosed: Apr 2026 · Treatment Active</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Active Medications ({medications.length})</p>
                                <div className="space-y-1.5">
                                    {medications.map(med => (
                                        <div key={med.id} className="flex items-center justify-between">
                                            <p className="text-xs text-white font-medium">{med.name}</p>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${med.daysLeft <= 7 ? 'bg-red-500/30 text-red-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                                                {med.daysLeft}d left
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Known Allergies</p>
                                <span className="text-xs font-semibold text-rose-300 bg-rose-500/20 px-2 py-1 rounded-lg">{meta.allergies}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Recent Labs (May 2026)</p>
                                <div className="space-y-1.5">
                                    {[
                                        { label: 'Hemoglobin', value: '11.2 g/dL', status: 'low' },
                                        { label: 'WBC Count', value: '3.8k/mcL', status: 'normal' },
                                        { label: 'Platelets', value: '190k/mcL', status: 'normal' },
                                        { label: 'LDH', value: '480 U/L', status: 'high' },
                                    ].map((lab, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <p className="text-xs text-indigo-200 font-medium">{lab.label}</p>
                                            <span className={`text-[10px] font-bold ${lab.status === 'high' || lab.status === 'low' ? 'text-amber-300' : 'text-emerald-300'}`}>{lab.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {lowMeds.length > 0 && (
                                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl">
                                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1.5">Medication Alerts</p>
                                    {lowMeds.map(med => (
                                        <p key={med.id} className="text-xs text-amber-200 font-semibold">{med.name} — only {med.daysLeft} days left</p>
                                    ))}
                                </div>
                            )}
                            <div>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Missing Actions</p>
                                <div className="space-y-1.5">
                                    {['CBC repeat overdue 12d', 'CT scan due next month', 'Follow-up unscheduled'].map((item, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                                            <p className="text-xs text-rose-300">{item}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Sub-component: Treatment Timeline ────────────────────────────────────────
const TreatmentTimeline = ({ events }) => {
    const [filter, setFilter] = useState('ALL');
    const [expandedId, setExpandedId] = useState(null);
    const filters = [
        { id: 'ALL', label: 'All History' },
        { id: 'CONSULT', label: 'Consults' },
        { id: 'LAB', label: 'Labs' },
        { id: 'SCAN', label: 'Scans' },
        { id: 'MEDS', label: 'Medications' },
        { id: 'DIAGNOSIS', label: 'Diagnosis' },
    ];
    const filtered = filter === 'ALL' ? events : events.filter(e => e.type === filter);
    const colorMap = {
        indigo: 'border-indigo-400 text-indigo-600 bg-indigo-50',
        blue: 'border-blue-400 text-blue-600 bg-blue-50',
        emerald: 'border-emerald-400 text-emerald-600 bg-emerald-50',
        amber: 'border-amber-400 text-amber-600 bg-amber-50',
        rose: 'border-rose-400 text-rose-600 bg-rose-50',
        slate: 'border-slate-400 text-slate-600 bg-slate-50',
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><TrendingUp size={18} className="text-indigo-500" /> Treatment Timeline</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Complete chronological clinical history</p>
                </div>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                    {filters.map(f => (
                        <button key={f.id} onClick={() => setFilter(f.id)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all border ${filter === f.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-6">
                <div className="relative ml-5 space-y-6">
                    <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-indigo-200 via-slate-100 to-slate-100" />
                    {filtered.map(event => (
                        <div key={event.id} className="relative pl-12 group">
                            <div className={`absolute left-0 top-1.5 w-8 h-8 rounded-full bg-white border-2 flex items-center justify-center transition-all duration-200 group-hover:scale-110 ${colorMap[event.color] || colorMap.slate}`}>
                                <event.icon size={14} />
                            </div>
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-slate-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 cursor-pointer"
                                onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${colorMap[event.color]?.replace('bg-', 'border-').replace('-50', '-100')}`}>{event.type}</span>
                                        <span className="text-[10px] text-slate-400 font-semibold">{event.date}</span>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-300 transition-transform ${expandedId === event.id ? 'rotate-180' : ''}`} />
                                </div>
                                <h4 className="font-semibold text-slate-900 text-sm">{event.title}</h4>
                                <AnimatePresence>
                                    {expandedId === event.id && (
                                        <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                            className="text-xs text-slate-500 mt-2 leading-relaxed">{event.desc}</motion.p>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Sub-component: Medication Continuity Engine ──────────────────────────────
const MedicationContinuityEngine = ({ medications, onRefill }) => {
    const colorMap = {
        red: { bar: 'bg-red-500', badge: 'bg-red-50 text-red-700 border-red-100', dot: 'bg-red-500' },
        amber: { bar: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'bg-amber-500' },
        green: { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'bg-emerald-500' },
    };
    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><Pill size={18} className="text-indigo-500" /> Medication Continuity Engine</h3>
                <p className="text-xs text-slate-400 mt-0.5">Predictive supply tracking and refill recommendations</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {medications.map(med => {
                    const c = colorMap[med.color] || colorMap.green;
                    const pct = Math.min(100, (med.daysLeft / med.totalDays) * 100);
                    return (
                        <div key={med.id} className="p-5 bg-slate-50/60 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all duration-200">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{med.dosage}</p>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border uppercase ${c.badge}`}>{med.daysLeft}d left</span>
                            </div>
                            <div className="mb-3">
                                <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-1.5">
                                    <span>Supply Progress</span>
                                    <span>{Math.round(pct)}% remaining</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${c.bar} transition-all duration-500`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-slate-200/60">
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${med.stock ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <p className="text-[10px] text-slate-500 font-medium">{med.pharmacy}</p>
                                </div>
                                {med.daysLeft <= 7 && (
                                    <button onClick={() => onRefill(med)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all shadow-sm">
                                        Issue Refill
                                    </button>
                                )}
                            </div>
                            {med.daysLeft <= 7 && (
                                <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-xl">
                                    <p className="text-[10px] text-amber-700 font-semibold">Refill recommended now · Est. delivery: {med.eta}</p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Sub-component: Care Gap Detection ────────────────────────────────────────
const CareGapDetection = ({ gaps }) => {
    const colorMap = {
        red: 'bg-red-100 text-red-700 border-red-200/60',
        amber: 'bg-amber-100 text-amber-700 border-amber-200/60',
        blue: 'bg-blue-100 text-blue-700 border-blue-200/60',
    };
    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <Brain size={18} className="text-rose-500" /> Care Gap Detection
                        <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-[9px] font-black flex items-center justify-center">{gaps.length}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">AI-identified gaps requiring clinical attention</p>
                </div>
            </div>
            <div className="p-6 divide-y divide-slate-100">
                {gaps.map(gap => (
                    <div key={gap.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="flex gap-3 items-start">
                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md border shrink-0 ${colorMap[gap.color] || colorMap.blue}`}>{gap.priority}</span>
                            <p className="text-sm font-semibold text-slate-800 leading-relaxed">{gap.title}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {gap.actions.map((act, i) => (
                                <button key={i} className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${i === 0 ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                                    {act}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── Sub-component: Emergency Intelligence Package ─────────────────────────────
const EmergencyIntelligencePackage = ({ patient, meta, medications }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-red-50/60 border border-red-200/60 rounded-3xl overflow-hidden">
            <button onClick={() => setOpen(!open)} className="w-full p-6 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                        <ShieldAlert size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-900 text-sm">Emergency Intelligence Package</h3>
                        <p className="text-[10px] text-red-700 mt-0.5">Auto-compiled critical patient data for emergency response</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase text-red-600 bg-red-100 px-2.5 py-1 rounded-full border border-red-200">Ready</span>
                    <ChevronDown size={16} className={`text-red-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-3">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Diagnosis & Allergies</p>
                                <p className="text-sm font-semibold text-slate-900">{meta.cancerType}</p>
                                <p className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-1 rounded-lg inline-block">Allergy: {meta.allergies}</p>
                            </div>
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-2">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Active Medications</p>
                                {medications.map(med => (
                                    <div key={med.id} className="flex justify-between text-xs">
                                        <span className="font-semibold text-slate-800">{med.name}</span>
                                        <span className="text-slate-500">{med.dosage}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-2">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Recent Labs</p>
                                {[{ l: 'Hemoglobin', v: '11.2 g/dL' }, { l: 'WBC', v: '3.8k/mcL' }, { l: 'LDH', v: '480 U/L HIGH' }].map((r, i) => (
                                    <div key={i} className="flex justify-between text-xs">
                                        <span className="text-slate-600">{r.l}</span>
                                        <span className="font-bold text-slate-900">{r.v}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-white border border-red-100 rounded-2xl space-y-2">
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Emergency Contacts</p>
                                <p className="text-sm font-semibold text-slate-900">{meta.caregiver}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1"><Phone size={11} /> {meta.caregiverPhone}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} /> {meta.pharmacy}</p>
                            </div>
                            <div className="md:col-span-2">
                                <button className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                                    <Send size={16} /> Share Emergency Package with Hospital
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Sub-component: Consultation Workspace ────────────────────────────────────
const ConsultationWorkspace = ({ patient, doctorId, onRefresh }) => {
    const [notes, setNotes] = useState('');
    const [showRxForm, setShowRxForm] = useState(false);
    const [rxForm, setRxForm] = useState({ medName: '', description: '', dose: '', frequency: '', startDate: '', endDate: '' });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [followUpDate, setFollowUpDate] = useState('');

    const handleSaveRx = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await addPrescription(doctorId, patient.id, rxForm);
            setSaved(true);
            setShowRxForm(false);
            setRxForm({ medName: '', description: '', dose: '', frequency: '', startDate: '', endDate: '' });
            onRefresh();
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><ClipboardList size={18} className="text-indigo-500" /> Consultation Workspace</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Notes, prescriptions, and follow-up scheduling</p>
                </div>
                {saved && (
                    <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                        <CheckCircle size={14} /> Prescription saved
                    </motion.span>
                )}
            </div>
            <div className="p-6 space-y-6">
                {/* Notes */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Consultation Notes</label>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Enter clinical findings, observations, and assessment..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all font-medium"
                    />
                </div>

                {/* Prescription */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Prescriptions</label>
                        <button onClick={() => setShowRxForm(!showRxForm)} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition-all border border-indigo-100">
                            <Plus size={14} /> Add Medication
                        </button>
                    </div>

                    <AnimatePresence>
                        {showRxForm && (
                            <motion.form initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                                onSubmit={handleSaveRx} className="p-5 bg-slate-50/60 border border-slate-200/80 rounded-2xl space-y-4 mb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Medication Name</label>
                                        <input required value={rxForm.medName} onChange={e => setRxForm({ ...rxForm, medName: e.target.value })}
                                            placeholder="e.g. Imatinib 400mg"
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Dose</label>
                                        <input required value={rxForm.dose} onChange={e => setRxForm({ ...rxForm, dose: e.target.value })}
                                            placeholder="e.g. 400mg"
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Frequency</label>
                                        <input required value={rxForm.frequency} onChange={e => setRxForm({ ...rxForm, frequency: e.target.value })}
                                            placeholder="e.g. Once daily"
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Start Date</label>
                                        <input type="date" required value={rxForm.startDate} onChange={e => setRxForm({ ...rxForm, startDate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">End Date</label>
                                        <input type="date" value={rxForm.endDate} onChange={e => setRxForm({ ...rxForm, endDate: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase">Clinical Notes</label>
                                        <input value={rxForm.description} onChange={e => setRxForm({ ...rxForm, description: e.target.value })}
                                            placeholder="Instructions, side-effect monitoring notes..."
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowRxForm(false)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-all">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save Prescription
                                    </button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>

                    {/* Existing Meds */}
                    {patient.medicines?.length > 0 && (
                        <div className="space-y-2">
                            {patient.medicines.map(med => (
                                <div key={med.medId} className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl flex justify-between items-center hover:border-slate-200 transition-all">
                                    <div>
                                        <p className="font-semibold text-slate-900 text-sm">{med.medName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">{med.dose} · {med.frequency || med.description}</p>
                                    </div>
                                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full border border-indigo-100">Active</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Follow-up */}
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Schedule Follow-up</label>
                    <div className="flex gap-3">
                        <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium" />
                        <button className="px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                            <Calendar size={14} /> Schedule
                        </button>
                    </div>
                </div>

                {/* Save Notes */}
                <button className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2">
                    <Send size={16} /> Save Consultation Notes
                </button>
            </div>
        </div>
    );
};

// ─── Sub-component: Pharmacy Coordination Status ──────────────────────────────
const PharmacyCoordination = ({ medications }) => (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Package size={18} className="text-emerald-500" /> Pharmacy Coordination</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time stock availability and delivery ETAs</p>
        </div>
        <div className="divide-y divide-slate-100">
            {medications.map(med => (
                <div key={med.id} className="p-5">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-slate-900 text-sm">{med.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${med.stock ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                            {med.stock ? 'In Stock' : 'Out of Stock'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                            { name: 'Apollo Pharmacy', distance: '2km', eta: '2 hours', stock: true, price: '₹2,000' },
                            { name: 'MedPlus Chemist', distance: '4km', eta: '3 hours', stock: true, price: '₹1,950' },
                            { name: 'Fortis Medstore', distance: '7km', eta: '1 day', stock: med.stock, price: '₹2,100' },
                        ].map((pharm, i) => (
                            <div key={i} className={`p-3 rounded-xl border text-xs ${pharm.stock ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/30 border-slate-100 opacity-60'}`}>
                                <p className="font-bold text-slate-800 truncate">{pharm.name}</p>
                                <p className="text-slate-400 mt-0.5 flex items-center gap-1"><MapPin size={9} /> {pharm.distance}</p>
                                <p className="text-indigo-600 font-bold mt-1">{pharm.price}</p>
                                <p className="text-slate-400">ETA: {pharm.eta}</p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Main Doctor Dashboard Component ─────────────────────────────────────────
const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('command');
    const [appointments, setAppointments] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientMeta, setPatientMeta] = useState(null);
    const [patientMedications, setPatientMedications] = useState([]);
    const [patientCareGaps, setPatientCareGaps] = useState([]);
    const [patientTimeline, setPatientTimeline] = useState([]);
    const [loading, setLoading] = useState(true);
    const [patientLoading, setPatientLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCall, setActiveCall] = useState(null);
    const [showBriefing, setShowBriefing] = useState(null);
    const [refillToast, setRefillToast] = useState(null);
    const [activeWorkspaceSection, setActiveWorkspaceSection] = useState('overview');

    const workspaceSections = [
        { id: 'overview', label: 'Overview' },
        { id: 'timeline', label: 'Timeline' },
        { id: 'medications', label: 'Medications' },
        { id: 'pharmacy', label: 'Pharmacy' },
        { id: 'consultation', label: 'Consultation' },
        { id: 'emergency', label: 'Emergency' },
    ];

    useEffect(() => {
        if (user?.id) fetchAppointments();
    }, [user]);

    const fetchAppointments = async () => {
        try {
            const data = await getDoctorAppointments(user.id);
            setAppointments(data);
        } catch (err) {
            console.error(err);
            setError('Failed to load appointments.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPatient = async (patientId) => {
        setPatientLoading(true);
        try {
            const data = await getPatientDetails(user.id, patientId);
            const meta = getMockPatientMeta(patientId);
            const meds = getMockMedications(patientId);
            const gaps = getMockCareGaps(patientId);
            const timeline = getMockTimeline();
            setSelectedPatient(data);
            setPatientMeta(meta);
            setPatientMedications(meds);
            setPatientCareGaps(gaps);
            setPatientTimeline(timeline);
            setActiveWorkspaceSection('overview');
        } catch (err) {
            console.error(err);
            setError('Failed to load patient details.');
        } finally {
            setPatientLoading(false);
        }
    };

    const closePatientView = () => {
        setSelectedPatient(null);
        setPatientMeta(null);
        setPatientMedications([]);
        setPatientCareGaps([]);
        setPatientTimeline([]);
    };

    const handleRefillRequest = (med) => {
        setRefillToast(med);
        setTimeout(() => setRefillToast(null), 5000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredAppointments = appointments.filter(apt =>
        apt.user?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const emergencyCount = appointments.filter((_, i) => i === 0).length; // mock: first patient as emergency
    const lowMedCount = 3; // mock

    // ── Loading State
    if (loading && !selectedPatient) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-500 font-medium">Loading Clinical Dashboard...</p>
                </div>
            </div>
        );
    }

    // ── Main Render
    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">

            {/* ── Sidebar ── */}
            <motion.aside
                animate={{ width: 272 }}
                className="fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 z-50 flex flex-col h-screen overflow-hidden"
                style={{ width: 272 }}
            >
                {/* Logo */}
                <div className="p-6 border-b border-slate-800 flex items-center gap-3 h-20 shrink-0">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-900/40 shrink-0">
                        <span className="text-white font-black text-base">C</span>
                    </div>
                    <div>
                        <p className="text-white font-bold text-base tracking-tight leading-none">CanQure</p>
                        <p className="text-indigo-400 text-[10px] font-semibold mt-0.5">Doctor Portal</p>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto py-5">
                    {[
                        { id: 'command', icon: LayoutDashboard, label: 'Command Center' },
                        { id: 'appointments', icon: Users, label: 'Patient Queue' },
                        { id: 'schedule', icon: Calendar, label: 'My Schedule' },
                        { id: 'prescriptions', icon: Pill, label: 'Prescriptions' },
                        { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                        { id: 'settings', icon: Settings, label: 'Settings' },
                    ].map(item => {
                        const isActive = activeTab === item.id && !selectedPatient;
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); closePatientView(); }}
                                whileHover={{ x: 2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 h-11 rounded-xl font-medium text-sm relative overflow-hidden transition-all duration-150 focus:outline-none ${isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                            >
                                {isActive && (
                                    <motion.div layoutId="sidebarActive" className="absolute inset-0 bg-indigo-600 rounded-xl"
                                        transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                                )}
                                <item.icon size={18} className="relative z-10 shrink-0" />
                                <span className="relative z-10 whitespace-nowrap">{item.label}</span>
                            </motion.button>
                        );
                    })}
                </nav>

                {/* Doctor Profile */}
                <div className="p-4 border-t border-slate-800 shrink-0">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 mb-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {user?.name?.charAt(0) || 'D'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-bold truncate">{formatDoctorName(user?.name)}</p>
                            <p className="text-slate-400 text-[10px] truncate">{user?.specialist || 'Oncologist'}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/30 transition-all text-sm font-medium">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </motion.aside>

            {/* ── Main Content ── */}
            <main className="flex-1 min-w-0 pb-20" style={{ marginLeft: 272 }}>

                {/* ── Patient Workspace ── */}
                <AnimatePresence mode="wait">
                    {selectedPatient ? (
                        <motion.div key="workspace" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                            {/* Patient Header */}
                            <div className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                                <div className="px-8 py-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <button onClick={closePatientView} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold text-sm transition-colors">
                                            <ChevronLeft size={18} /> Back to Queue
                                        </button>
                                        <div className="w-px h-6 bg-slate-200" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base">
                                                {selectedPatient.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 text-sm leading-none">{selectedPatient.name}</p>
                                                {patientMeta && (
                                                    <p className="text-[11px] text-slate-400 mt-0.5">{patientMeta.age}y · {patientMeta.gender} · {patientMeta.cancerType}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {patientMeta?.priority === 'EMERGENCY' && (
                                            <span className="px-3 py-1.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full border border-red-200 uppercase tracking-wider animate-pulse">Emergency</span>
                                        )}
                                        <button
                                            onClick={async () => {
                                                const details = await getPatientDetails(user.id, selectedPatient.id);
                                                setShowBriefing({ ...details, ...selectedPatient });
                                            }}
                                            className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-1.5">
                                            <FileText size={13} /> Pre-Read Brief
                                        </button>
                                        <button
                                            onClick={() => setActiveCall({ ...selectedPatient, id: selectedPatient.id })}
                                            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5">
                                            <Video size={13} /> Start Video Consult
                                        </button>
                                    </div>
                                </div>

                                {/* Workspace Section Tabs */}
                                <div className="px-8 flex gap-1 overflow-x-auto scrollbar-none pb-0">
                                    {workspaceSections.map(sec => (
                                        <button key={sec.id} onClick={() => setActiveWorkspaceSection(sec.id)}
                                            className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all -mb-px ${activeWorkspaceSection === sec.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                                            {sec.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {patientLoading ? (
                                <div className="flex items-center justify-center py-32">
                                    <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="p-8">

                                    {/* Overview Section */}
                                    {activeWorkspaceSection === 'overview' && (
                                        <div className="space-y-8">
                                            {/* Patient Snapshot */}
                                            {patientMeta && (
                                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-7">
                                                    <div className="flex flex-col md:flex-row gap-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-700 font-black text-3xl shrink-0">
                                                                {selectedPatient.name?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h2 className="text-2xl font-black text-slate-900">{selectedPatient.name}</h2>
                                                                <p className="text-slate-500 mt-1">{patientMeta.age}y · {patientMeta.gender} · Blood: {patientMeta.bloodType}</p>
                                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100">{patientMeta.cancerType}</span>
                                                                    <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">ID: #{selectedPatient.id?.slice(-6)?.toUpperCase()}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Caregiver</p>
                                                                <p className="text-sm font-semibold text-slate-900">{patientMeta.caregiver}</p>
                                                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1"><Phone size={10} />{patientMeta.caregiverPhone}</p>
                                                            </div>
                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pharmacy</p>
                                                                <p className="text-sm font-semibold text-slate-900">{patientMeta.pharmacy}</p>
                                                                <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1"><MapPin size={10} />2.4 km away</p>
                                                            </div>
                                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Last Consult</p>
                                                                <p className="text-sm font-semibold text-slate-900">{patientMeta.lastConsult}</p>
                                                                <p className="text-[11px] text-red-500 font-bold mt-1">Follow-up overdue</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AI Brief */}
                                            {patientMeta && patientMedications.length > 0 && (
                                                <AIPreReadBrief patient={selectedPatient} meta={patientMeta} medications={patientMedications} />
                                            )}

                                            {/* Care Gaps + Medical Vault side by side */}
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <CareGapDetection gaps={patientCareGaps} />

                                                {/* Medical Vault */}
                                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
                                                    <div className="p-6 border-b border-slate-100">
                                                        <h3 className="font-bold text-slate-900 flex items-center gap-2"><FileHeart size={18} className="text-emerald-500" /> Medical Vault</h3>
                                                        <p className="text-xs text-slate-400 mt-0.5">Uploaded reports and clinical documents</p>
                                                    </div>
                                                    <div className="p-6 space-y-3">
                                                        {selectedPatient.Reports?.length > 0 ? selectedPatient.Reports.map(report => (
                                                            <div key={report.id} className="p-4 bg-slate-50/60 border border-slate-100 rounded-2xl flex justify-between items-center group hover:border-slate-200 transition-all">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center">
                                                                        <FileText size={15} className="text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold text-slate-800 text-sm truncate max-w-[180px]">{report.reportName}</p>
                                                                        <p className="text-[10px] text-slate-400">{new Date(report.date).toLocaleDateString()}</p>
                                                                    </div>
                                                                </div>
                                                                <a href={report.reportUrl} target="_blank" rel="noreferrer"
                                                                    className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                                                    <ExternalLink size={14} />
                                                                </a>
                                                            </div>
                                                        )) : (
                                                            <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                                                                No reports uploaded yet.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline Section */}
                                    {activeWorkspaceSection === 'timeline' && (
                                        <TreatmentTimeline events={patientTimeline} />
                                    )}

                                    {/* Medications Section */}
                                    {activeWorkspaceSection === 'medications' && patientMedications.length > 0 && (
                                        <MedicationContinuityEngine medications={patientMedications} onRefill={handleRefillRequest} />
                                    )}

                                    {/* Pharmacy Section */}
                                    {activeWorkspaceSection === 'pharmacy' && patientMedications.length > 0 && (
                                        <PharmacyCoordination medications={patientMedications} />
                                    )}

                                    {/* Consultation Section */}
                                    {activeWorkspaceSection === 'consultation' && (
                                        <ConsultationWorkspace patient={selectedPatient} doctorId={user.id} onRefresh={() => handleViewPatient(selectedPatient.id)} />
                                    )}

                                    {/* Emergency Section */}
                                    {activeWorkspaceSection === 'emergency' && patientMeta && (
                                        <EmergencyIntelligencePackage patient={selectedPatient} meta={patientMeta} medications={patientMedications} />
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ) : (

                        /* ── Command Center / Home ── */
                        <motion.div key="command" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 space-y-8">

                            {/* Header */}
                            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                        {activeTab === 'command' ? 'Command Center' :
                                         activeTab === 'appointments' ? 'Patient Queue' :
                                         activeTab === 'schedule' ? 'My Schedule' :
                                         activeTab === 'prescriptions' ? 'Prescriptions' :
                                         activeTab === 'analytics' ? 'Analytics' : 'Settings'}
                                    </h1>
                                    <p className="text-slate-500 mt-1 text-sm">
                                        {activeTab === 'command' ? `Welcome back, ${formatDoctorName(user?.name)}. Here's your clinical overview for today.` :
                                         activeTab === 'appointments' ? 'All scheduled patients and consultation queue.' :
                                         'Manage your availability and time slots.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search patients..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 w-56"
                                        />
                                    </div>
                                    <button className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 relative transition-all">
                                        <Bell size={18} />
                                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                                    </button>
                                </div>
                            </header>

                            {/* Command Center Content */}
                            {(activeTab === 'command' || activeTab === 'appointments') && (
                                <>
                                    {/* Today's Summary Bar */}
                                    {activeTab === 'command' && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                            {[
                                                { label: 'Scheduled Today', value: appointments.length, color: 'indigo', icon: Calendar },
                                                { label: 'Emergency Alerts', value: emergencyCount, color: 'red', icon: ShieldAlert },
                                                { label: 'Pending Reviews', value: 3, color: 'amber', icon: ClipboardList },
                                                { label: 'Med Gaps', value: lowMedCount, color: 'rose', icon: Pill },
                                                { label: 'Teleconsult Requests', value: 2, color: 'emerald', icon: Video },
                                            ].map((stat, i) => (
                                                <motion.div key={i} whileHover={{ y: -3 }}
                                                    className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[120px] cursor-default`}>
                                                    <div className="flex justify-between items-start">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</span>
                                                        <div className={`w-9 h-9 rounded-2xl flex items-center justify-center bg-${stat.color}-50 text-${stat.color}-600`}>
                                                            <stat.icon size={16} />
                                                        </div>
                                                    </div>
                                                    <p className={`text-4xl font-black text-${stat.color}-600`}>{stat.value}</p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Priority Queue */}
                                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
                                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                            <div>
                                                <h3 className="font-bold text-slate-900">Patient Queue</h3>
                                                <p className="text-xs text-slate-400 mt-0.5">Sorted by priority: Emergencies first</p>
                                            </div>
                                            <div className="flex gap-2">
                                                {['All', 'Emergency', 'Scheduled', 'Follow-up'].map(f => (
                                                    <button key={f} className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-900 transition-all bg-white">{f}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {filteredAppointments.length === 0 ? (
                                            <div className="p-12 text-center text-slate-400">
                                                <Users size={40} className="mx-auto mb-3 text-slate-200" />
                                                <p className="text-sm font-medium">No patients in queue</p>
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-slate-50">
                                                {filteredAppointments.map((apt, idx) => {
                                                    const meta = getMockPatientMeta(apt.userId);
                                                    const meds = getMockMedications(apt.userId);
                                                    const lowMed = meds.some(m => m.daysLeft <= 7);
                                                    const gaps = getMockCareGaps(apt.userId);
                                                    const isEmergency = idx === 0; // mock first as emergency
                                                    return (
                                                        <motion.div key={apt.id} whileHover={{ backgroundColor: '#f8fafc' }}
                                                            className={`p-5 flex items-center gap-4 transition-colors ${isEmergency ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}`}>
                                                            {/* Avatar */}
                                                            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${isEmergency ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                {apt.user?.name?.charAt(0)}
                                                            </div>

                                                            {/* Info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    <p className="font-bold text-slate-900 text-sm">{apt.user?.name}</p>
                                                                    {isEmergency && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black rounded-full uppercase border border-red-200">Emergency</span>}
                                                                    {lowMed && <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold rounded-full border border-amber-100">Med Low</span>}
                                                                    {gaps.some(g => g.priority === 'CRITICAL') && <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded-full border border-rose-100">Gap Alert</span>}
                                                                </div>
                                                                <p className="text-[11px] text-slate-400 mt-0.5">{meta.cancerType} · Age {meta.age}</p>
                                                                <p className="text-[10px] text-slate-400 mt-0.5">Consult: {apt.time} · {new Date(apt.date).toLocaleDateString()}</p>
                                                            </div>

                                                            {/* Status */}
                                                            <div className="hidden md:block shrink-0">
                                                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border uppercase ${
                                                                    apt.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                    apt.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                    'bg-slate-50 text-slate-600 border-slate-200'
                                                                }`}>{apt.status || 'Scheduled'}</span>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <button
                                                                    onClick={async () => {
                                                                        const details = await getPatientDetails(user.id, apt.userId);
                                                                        setShowBriefing({ ...details, appointmentId: apt.id });
                                                                    }}
                                                                    className="px-3.5 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded-xl hover:bg-indigo-100 transition-all border border-indigo-100 flex items-center gap-1.5">
                                                                    <FileText size={13} /> Brief
                                                                </button>
                                                                <button
                                                                    onClick={() => handleViewPatient(apt.userId)}
                                                                    className="px-3.5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-all flex items-center gap-1.5">
                                                                    Open <ArrowRight size={13} />
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Schedule Tab */}
                            {activeTab === 'schedule' && (
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="font-bold text-slate-900">Weekly Schedule</h3>
                                        <div className="flex gap-2">
                                            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50">Today</button>
                                            <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl">Add Slot</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 mb-4">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                                            <div key={d} className="text-center">
                                                <p className="text-[10px] font-bold text-slate-400 mb-2">{d}</p>
                                                <div className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-sm font-bold transition-all ${i === new Date().getDay() ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                                                    {new Date(Date.now() + (i - new Date().getDay()) * 86400000).getDate()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-3">
                                        {['09:00 – 09:30', '10:00 – 10:30', '11:00 – 11:30', '14:00 – 14:30', '15:00 – 15:30'].map((slot, i) => (
                                            <div key={i} className={`p-4 rounded-2xl border flex justify-between items-center ${i < appointments.length ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100 border-dashed'}`}>
                                                <div className="flex items-center gap-3">
                                                    <Clock size={15} className={i < appointments.length ? 'text-indigo-500' : 'text-slate-300'} />
                                                    <span className="text-sm font-semibold text-slate-700">{slot}</span>
                                                    {i < appointments.length && <span className="text-xs font-bold text-indigo-600">{appointments[i]?.user?.name}</span>}
                                                </div>
                                                {i < appointments.length
                                                    ? <span className="text-[10px] font-bold px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 uppercase">Booked</span>
                                                    : <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full border border-slate-200 uppercase">Open</span>
                                                }
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Prescriptions Tab */}
                            {activeTab === 'prescriptions' && (
                                <div className="bg-white rounded-3xl border border-slate-200/80 p-8">
                                    <p className="text-sm text-slate-500">Open a patient from the queue to view and manage their prescriptions.</p>
                                </div>
                            )}

                            {/* Analytics Tab */}
                            {activeTab === 'analytics' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { label: 'Total Patients', value: appointments.length, sub: 'Under active care', color: 'indigo' },
                                        { label: 'Consultations This Month', value: 28, sub: '+12% vs last month', color: 'emerald' },
                                        { label: 'Avg. Prep Time', value: '4.2 min', sub: 'Saved by AI brief', color: 'amber' },
                                        { label: 'Medication Gap Closures', value: '87%', sub: 'Resolution rate', color: 'rose' },
                                    ].map((stat, i) => (
                                        <div key={i} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                            <p className={`text-5xl font-black text-${stat.color}-600 mt-3`}>{stat.value}</p>
                                            <p className="text-sm text-slate-400 mt-2">{stat.sub}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <div className="max-w-2xl bg-white rounded-3xl border border-slate-200/80 p-8 space-y-6">
                                    <h3 className="font-bold text-slate-900 text-lg">Account Settings</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Name', value: formatDoctorName(user?.name) },
                                            { label: 'Email', value: user?.email },
                                            { label: 'Specialization', value: user?.specialist || 'Oncologist' },
                                            { label: 'Role', value: 'Doctor' },
                                        ].map((f, i) => (
                                            <div key={i} className="flex justify-between items-center py-3 border-b border-slate-100">
                                                <span className="text-sm text-slate-500">{f.label}:</span>
                                                <span className="text-sm font-bold text-slate-900">{f.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* ── Pre-Call Briefing Modal ── */}
            <AnimatePresence>
                {showBriefing && (
                    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
                            className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                            <header className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 shrink-0">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900">Pre-Consultation Briefing</h2>
                                    <p className="text-slate-400 mt-1 text-xs font-medium">Case #{showBriefing.id?.slice(-6)?.toUpperCase()} · Prepared by CanQure Intelligence</p>
                                </div>
                                <button onClick={() => setShowBriefing(null)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20} className="text-slate-400" /></button>
                            </header>
                            <div className="flex-1 overflow-y-auto p-7">
                                <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl p-7 text-white mb-7">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center"><Brain size={18} className="text-indigo-300" /></div>
                                        <div>
                                            <p className="font-bold text-sm">AI Doctor-Ready Pre-Read</p>
                                            <p className="text-indigo-300 text-[10px]">Auto-generated by CanQure Intelligence</p>
                                        </div>
                                        <span className="ml-auto px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold rounded-full">94% Confidence</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Patient</p>
                                                <p className="text-sm font-bold">{showBriefing.name} · {getMockPatientMeta(showBriefing.id)?.cancerType}</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Recent Symptoms</p>
                                                {['Chest pain for 2 weeks', 'Persistent cough', 'Difficulty breathing at night'].map((s, i) => (
                                                    <div key={i} className="flex gap-2 text-xs text-indigo-200 font-medium mt-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0" />{s}</div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">AI Intelligence Findings</p>
                                                <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-xl">
                                                    <p className="text-xs text-amber-200 leading-relaxed">PET scan: 3cm mass in right lower lobe. CEA elevated (8.2). Prior biopsy recommended. LDH trending high over 3 months.</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-center">
                                                    <p className="text-emerald-300 font-black text-lg">94%</p>
                                                    <p className="text-[9px] text-emerald-400 uppercase font-bold">Confidence</p>
                                                </div>
                                                <div className="p-3 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-center">
                                                    <p className="text-indigo-300 font-black text-lg">{showBriefing.Reports?.length || 3}</p>
                                                    <p className="text-[9px] text-indigo-400 uppercase font-bold">Reports</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <footer className="p-7 bg-slate-900 flex justify-end gap-4 shrink-0">
                                <button onClick={() => setShowBriefing(null)} className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-white transition-colors text-sm">Close</button>
                                <button
                                    onClick={() => {
                                        setActiveCall({ ...showBriefing, id: showBriefing.appointmentId || showBriefing.id });
                                        setShowBriefing(null);
                                    }}
                                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-900/40 hover:bg-indigo-700 transition-all flex items-center gap-2 text-sm">
                                    <Video size={16} /> Start Video Consult
                                </button>
                            </footer>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ── Active Call ── */}
            {activeCall && (
                <ConsultationInterface
                    appointment={activeCall}
                    onComplete={() => { setActiveCall(null); fetchAppointments(); }}
                    onCancel={() => setActiveCall(null)}
                />
            )}

            {/* ── Refill Toast ── */}
            <AnimatePresence>
                {refillToast && (
                    <motion.div initial={{ opacity: 0, y: 40, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        className="fixed bottom-8 right-8 z-[9999] max-w-sm w-full">
                        <div className="bg-white border border-indigo-200 rounded-2xl shadow-2xl p-5 flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                <Pill size={18} />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900 text-sm">Refill Issued</p>
                                <p className="text-xs text-slate-500 mt-1">Refill request sent to <span className="font-semibold text-slate-800">{refillToast.pharmacy}</span> for <span className="font-semibold">{refillToast.name}</span>. Est: {refillToast.eta}.</p>
                            </div>
                            <button onClick={() => setRefillToast(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-50"><X size={14} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <SOSButton />
        </div>
    );
};

export default DoctorDashboard;