import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDashboardData, getDoctors, bookAppointment, createRefillOrder, getPatientRefillOrders, confirmRefillDelivery } from '../../api/user';
import RefillDeliveryMap from './components/RefillDeliveryMap';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Calendar, 
    FileText, 
    Pill, 
    LogOut, 
    User, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Plus, 
    Search, 
    ChevronRight,
    ChevronLeft,
    Menu, 
    X, 
    Scan, 
    ShieldAlert, 
    ShieldCheck,
    Database, 
    Activity,
    UploadCloud,
    TrendingUp,
    Users,
    Brain,
    MapPin,
    Bell,
    Share2,
    Settings,
    FileHeart,
    DollarSign,
    Check,
    Navigation,
    PhoneCall,
    Info,
    MoreVertical,
    FileSpreadsheet,
    Trash2,
    Video,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import SOSButton from '../../components/SOSButton';
import MedicinalRecord from '../../components/MedicinalRecord';
import RiskAssessment from '../RiskAssessment/RiskAssessment';
import ReportHistory from '../ReportHistory/ReportHistory';
import UploadReport from '../../components/UploadReport';
import EmergencyLocator from '../../components/EmergencyLocator';

const getMedRefillDetails = (medName) => {
    if (!medName) return { pharmacy: 'Apollo Pharmacy', price: '₹2,000', distance: '2km', deliveryTime: '2 hours' };
    const nameLower = medName.toLowerCase();
    if (nameLower.includes('imatinib')) {
        return { pharmacy: 'Apollo Pharmacy', price: '₹2,000', distance: '2km', deliveryTime: '2 hours' };
    } else if (nameLower.includes('zoledronic')) {
        return { pharmacy: 'MedPlus Chemist', price: '₹1,500', distance: '1km', deliveryTime: '1 hour' };
    } else if (nameLower.includes('tamoxifen')) {
        return { pharmacy: 'Fortis Medstore', price: '₹800', distance: '4km', deliveryTime: '4 hours' };
    }
    return { pharmacy: 'Apollo Pharmacy', price: '₹2,000', distance: '2km', deliveryTime: '2 hours' };
};

const formatDoctorName = (name) => {
    if (!name) return "";
    return name.startsWith("Dr.") ? name : `Dr. ${name}`;
};

const UserDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Active Permission Role (For Demo/Dev toggle & JWT)
    const [activeRole, setActiveRole] = useState(() => {
        return user?.role === 'admin' ? 'patient' : (user?.role || 'patient');
    });

    // Sub-modals and panel states
    const [showNotifications, setShowNotifications] = useState(false);
    const [showAdherenceModal, setShowAdherenceModal] = useState(false);
    const [showRefillModal, setShowRefillModal] = useState(false);
    const [selectedMedForRefill, setSelectedMedForRefill] = useState(null);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [showBookModal, setShowBookModal] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    // In-app delivery toast notification (replaces browser alert)
    const [deliveryToast, setDeliveryToast] = useState(null); // { medName, pharmacyName }

    // Medication continuity mock list
    const [medications, setMedications] = useState([
        { id: 1, name: 'Imatinib 400mg', dosage: 'Once daily', daysLeft: 5, totalDays: 30, adherence: 92, completed: 23, total: 25, color: 'amber' },
        { id: 2, name: 'Tamoxifen 20mg', dosage: 'Once daily', daysLeft: 45, totalDays: 60, adherence: 100, completed: 45, total: 45, color: 'green' },
        { id: 3, name: 'Zoledronic Acid 4mg', dosage: 'Every 4 weeks', daysLeft: 2, totalDays: 28, adherence: 75, completed: 3, total: 4, color: 'red' }
    ]);

    // Live notifications state
    const [notifications, setNotifications] = useState([
        { id: 1, title: 'Blood test report CBC overdue', desc: 'Required for next consult cycle.', time: '2h ago', urgent: true },
        { id: 2, title: 'Imatinib 400mg stock alert', desc: '5 days left. Refill order available.', time: '1d ago', urgent: false },
        { id: 3, title: 'Upcoming Video Consultation', desc: 'With Dr. Sarah Wilson on March 15.', time: '3d ago', urgent: false }
    ]);

    // Track processed delivered orders to avoid double stock additions and repeat pop-up alerts
    const processedOrdersRef = useRef([]);
    const hasLoadedInitialRefills = useRef(false);


    // Gap missing list
    const [gaps, setGaps] = useState([
        { id: 1, priority: 'CRITICAL', title: 'Blood test report (CBC) overdue by 15 days.', color: 'red', actions: ['Upload Report', 'Schedule Test'] },
        { id: 2, priority: 'HIGH', title: 'Follow-up with Dr. Sarah Wilson overdue by 30 days.', color: 'amber', actions: ['Schedule Follow-up', 'Contact Doctor'] },
        { id: 3, priority: 'MEDIUM', title: 'PET-CT scan last taken 8 months ago.', color: 'green', actions: ['Schedule Imaging'] }
    ]);

    // Telemedicine booking states
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [bookingStep, setBookingStep] = useState('select'); // select -> time -> pay -> success
    const [successApt, setSuccessApt] = useState(null);

    // Pharmacy routing states
    const [selectedPharmacy, setSelectedPharmacy] = useState(null);
    const [refillStep, setRefillStep] = useState('list'); // list -> confirm -> tracking
    const [deliveryEstimate, setDeliveryEstimate] = useState('');
    const [refillOrders, setRefillOrders] = useState([]);
    const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);
    const [journeyFilter, setJourneyFilter] = useState('ALL');
    const [doctorFilter, setDoctorFilter] = useState('recommended');
    const [selectedCalendarDate, setSelectedCalendarDate] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [consultBookingSuccess, setConsultBookingSuccess] = useState(false);

    const pendingRefillsCount = refillOrders.filter(order => order.status !== 'DELIVERED').length;



    // Sharing generation brief state
    const [shareProgress, setShareProgress] = useState(0);
    const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

    // Emergency tracking state
    const [emergencyStep, setEmergencyStep] = useState('warning'); // warning -> locating -> hospitals -> sending -> tracking -> resolved
    const [hospitalLogs, setHospitalLogs] = useState([]);
    const [selectedHospital, setSelectedHospital] = useState(null);

    // Caregiver access states
    const [caregivers, setCaregivers] = useState([
        { id: 'cg_1', name: 'Anjali Bhunia', phone: '+91 98765 43210', role: 'primary_caregiver', status: 'ACTIVE', relation: 'Spouse' },
        { id: 'cg_2', name: 'Rahul Sharma', phone: '+91 87654 32109', role: 'secondary_caregiver', status: 'ACTIVE', relation: 'Son' }
    ]);
    const [newCaregiverPhone, setNewCaregiverPhone] = useState('');
    const [newCaregiverName, setNewCaregiverName] = useState('');
    const [newCaregiverRole, setNewCaregiverRole] = useState('secondary_caregiver');

    // Report upload states
    const [uploadStep, setUploadStep] = useState('source'); // source -> preview -> progress -> review
    const [uploadedFile, setUploadedFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [ocrConfidence, setOcrConfidence] = useState(95);
    const [extractedData, setExtractedData] = useState({
        patientName: 'John Patient',
        testDate: '2026-06-20',
        testName: 'Complete Blood Count (CBC)',
        hemoglobin: '12.5 g/dL',
        wbc: '8,000 /mcL',
        platelets: '250,000 /mcL'
    });

    // Time-based greeting helper
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    // Permission check helper based on activeRole feature flags
    const hasPermission = (flag) => {
        const flags = {
            can_upload: activeRole === 'patient' || activeRole === 'primary_caregiver',
            can_share: activeRole === 'patient' || activeRole === 'primary_caregiver',
            can_book: activeRole === 'patient' || activeRole === 'primary_caregiver',
            can_trigger_emergency: activeRole === 'patient' || activeRole === 'primary_caregiver',
            can_grant_access: activeRole === 'patient',
            can_delete_account: activeRole === 'patient',
            can_view_audit: activeRole === 'patient' || activeRole === 'primary_caregiver'
        };
        return !!flags[flag];
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getDashboardData();
                setDashboardData(data);
                const docs = await getDoctors();
                setDoctors(docs);
            } catch (err) {
                setError("Failed to load dashboard data");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [activeTab]);

    useEffect(() => {
        const fetchRefills = async () => {
            try {
                const refills = await getPatientRefillOrders();
                setRefillOrders(refills);
            } catch (err) {
                console.error("Failed to poll refill orders", err);
            }
        };
        fetchRefills();
        const interval = setInterval(fetchRefills, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!refillOrders || refillOrders.length === 0) return;

        // On first load of refillOrders, populate processedOrdersRef to avoid spamming alerts for past deliveries
        if (!hasLoadedInitialRefills.current) {
            refillOrders.forEach(order => {
                if (order.status === 'DELIVERED') {
                    processedOrdersRef.current.push(order.id);
                }
            });
            hasLoadedInitialRefills.current = true;
            return;
        }

        // Check for newly delivered orders
        const newlyDelivered = refillOrders.filter(
            order => order.status === 'DELIVERED' && !processedOrdersRef.current.includes(order.id)
        );

        if (newlyDelivered.length === 0) return;

        // Mark all as processed
        newlyDelivered.forEach(order => processedOrdersRef.current.push(order.id));

        // Use functional state updates to avoid stale closure issues
        newlyDelivered.forEach(order => {
            // 1. Update medication daysLeft using functional update (no stale closure)
            setMedications(prevMeds => prevMeds.map(med => {
                const matchWord = med.name.toLowerCase().split(' ')[0];
                if (order.medName.toLowerCase().includes(matchWord)) {
                    const newDaysLeft = med.daysLeft + 30;
                    return {
                        ...med,
                        daysLeft: newDaysLeft > med.totalDays ? newDaysLeft : med.totalDays,
                        color: 'green'
                    };
                }
                return med;
            }));

            // 2. Add notification using functional update
            setNotifications(prev => [{
                id: Date.now() + Math.random(),
                title: `${order.medName} Refill Delivered`,
                desc: `Your refill from ${order.pharmacyName} has been received. Stock updated (+30 days).`,
                time: 'Just now',
                urgent: false
            }, ...prev]);

            // 3. Show in-app toast (auto-dismisses after 6 seconds)
            setDeliveryToast({ medName: order.medName, pharmacyName: order.pharmacyName });
            setTimeout(() => setDeliveryToast(null), 6000);
        });
    }, [refillOrders]);



    const handleUploadSuccess = () => {
        setActiveTab('vault');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleConfirmRefill = async () => {
        try {
            const orderData = {
                medicationId: selectedMedForRefill?.id ? String(selectedMedForRefill.id) : null,
                medName: selectedMedForRefill?.name || "Unknown Medicine",
                pharmacyName: selectedPharmacy?.name,
                price: selectedPharmacy?.price,
                deliveryTime: selectedPharmacy?.time || '2 hours',
                daysRemaining: selectedMedForRefill?.daysLeft !== undefined ? selectedMedForRefill.daysLeft : 5
            };
            await createRefillOrder(orderData);
            setDeliveryEstimate(selectedPharmacy?.time || '2 hours');
            setRefillStep('tracking');
            const refills = await getPatientRefillOrders();
            setRefillOrders(refills);
        } catch (err) {
            console.error("Failed to place refill order", err);
            alert("Failed to place refill order: " + (err.response?.data?.message || err.message));
        }
    };

    const handleConfirmHandover = async (orderId) => {
        const executeConfirmation = async (retryCount = 0) => {
            try {
                const res = await confirmRefillDelivery(orderId);
                
                // Refresh data
                const refills = await getPatientRefillOrders();
                setRefillOrders(refills);
                
                const freshDashboard = await getDashboardData();
                setDashboardData(freshDashboard);
                if (freshDashboard.medications) {
                    setMedications(freshDashboard.medications);
                }
                
                setDeliveryToast({
                    medName: res.medName || "Medication Refill",
                    status: "delivered",
                    message: "Verification successful! Supply extended (+30 days)."
                });
                
                setTimeout(() => setDeliveryToast(null), 4000);
            } catch (err) {
                console.error(`Handover confirmation failed (Attempt ${retryCount + 1}):`, err);
                
                if (err.response?.status === 409 || err.message?.includes("already delivered")) {
                    const refills = await getPatientRefillOrders();
                    setRefillOrders(refills);
                    return;
                }
                
                if (retryCount < 5) {
                    const delays = [5000, 10000, 20000, 40000, 80000];
                    const delay = delays[retryCount];
                    console.log(`Queued handover confirmation locally. Retrying in ${delay / 1000}s...`);
                    
                    setDeliveryToast({
                        medName: "Network Connection Issue",
                        status: "offline",
                        message: `Offline queue active. Retrying confirmation in ${delay / 1000}s...`
                    });
                    
                    setTimeout(() => {
                        executeConfirmation(retryCount + 1);
                    }, delay);
                } else {
                    alert("Verification failed after 5 retries. Please check your internet connection.");
                    setDeliveryToast(null);
                }
            }
        };

        await executeConfirmation();
    };

    // Mock functions for workflows
    const handleCloseAllModals = () => {

        setShowAdherenceModal(false);
        setShowRefillModal(false);
        setShowShareModal(false);
        setShowEmergencyModal(false);
        setShowUploadModal(false);
        setShowBookModal(false);
        setShowConfirmDelete(false);
        setUploadedFile(null);
        setSelectedDoctor(null);
    };

    const handleConfirmAdherence = (medId, dayIndex) => {
        setMedications(prev => prev.map(med => {
            if (med.id === medId) {
                const updatedCompleted = med.completed + 1;
                const newAdherence = Math.round((updatedCompleted / med.total) * 100);
                return {
                    ...med,
                    completed: updatedCompleted,
                    adherence: newAdherence > 100 ? 100 : newAdherence
                };
            }
            return med;
        }));
    };

    const triggerOcrProgress = () => {
        setUploadStep('progress');
        setUploadProgress(10);
        const timer1 = setTimeout(() => setUploadProgress(40), 1000);
        const timer2 = setTimeout(() => setUploadProgress(80), 2000);
        const timer3 = setTimeout(() => {
            setUploadProgress(100);
            setUploadStep('review');
        }, 3200);
    };

    const startBriefGeneration = () => {
        setIsGeneratingBrief(true);
        setShareProgress(10);
        const timer1 = setTimeout(() => setShareProgress(45), 600);
        const timer2 = setTimeout(() => setShareProgress(85), 1200);
        const timer3 = setTimeout(() => {
            setShareProgress(100);
            setIsGeneratingBrief(false);
        }, 1800);
    };

    const startEmergencyPipeline = () => {
        setEmergencyStep('locating');
        const timer1 = setTimeout(() => {
            setEmergencyStep('hospitals');
        }, 1500);
    };

    const sendEmergencyAlert = (hospital) => {
        setSelectedHospital(hospital);
        setEmergencyStep('sending');
        const timer1 = setTimeout(() => {
            setEmergencyStep('tracking');
        }, 2000);
    };

    const inviteNewCaregiver = (e) => {
        e.preventDefault();
        if (!newCaregiverPhone || !newCaregiverName) return;
        const newCg = {
            id: `cg_${Date.now()}`,
            name: newCaregiverName,
            phone: newCaregiverPhone,
            role: newCaregiverRole,
            status: 'PENDING',
            relation: 'Caregiver'
        };
        setCaregivers(prev => [...prev, newCg]);
        setNewCaregiverName('');
        setNewCaregiverPhone('');
    };

    const revokeCaregiver = (id) => {
        setCaregivers(prev => prev.filter(c => c.id !== id));
    };

    const scrollMedicationContinuity = () => {
        const element = document.getElementById('medication-continuity-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Sub-component rendering for overview
    const renderOverviewContent = () => {
        return (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                {/* Header Welcome banner */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] gap-6 relative overflow-hidden">
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">{getGreeting()}, {user?.name || 'John'}</h2>

                            <span className="px-3 py-1 bg-slate-50 text-slate-700 text-xs font-semibold rounded-full border border-slate-200/80 flex items-center gap-1.5 uppercase">
                                <Activity size={12} className="text-slate-500 animate-pulse" /> Active Treatment
                            </span>
                        </div>
                        <p className="text-slate-500 mt-2 text-md flex items-center gap-2">
                            <span>Your health team is online.</span>
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                            <span className="text-slate-400 font-medium">Role:</span>
                            <span className="font-semibold text-slate-700 bg-slate-50 px-2.5 py-0.5 rounded-lg border border-slate-200/60 text-sm">
                                {activeRole === 'patient' ? 'Owner (Patient)' : activeRole === 'primary_caregiver' ? 'Delegate (Primary Caregiver)' : 'Viewer (Secondary Caregiver)'}
                            </span>
                        </p>
                    </div>

                    {/* Developer/Role Switcher & Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto z-10">
                        <div className="flex items-center bg-slate-50 px-3 py-2 rounded-2xl border border-slate-200/80 gap-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">Switch Role:</span>
                            <select 
                                value={activeRole} 
                                onChange={(e) => setActiveRole(e.target.value)}
                                className="bg-white text-xs font-semibold text-slate-800 rounded-lg p-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300"
                            >
                                <option value="patient">Owner (Patient)</option>
                                <option value="primary_caregiver">Delegate (Caregiver)</option>
                                <option value="secondary_caregiver">Viewer (Caregiver)</option>
                            </select>
                        </div>
                        <button 
                            onClick={() => setShowNotifications(true)} 
                            className="w-12 h-12 bg-white hover:bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 border border-slate-200 relative transition-all"
                        >
                            <Bell size={20} />
                            <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-slate-900 rounded-full ring-2 ring-white"></span>
                        </button>
                    </div>
                </header>

                {/* Hero Section (The Calm Welcome Actions Deck) */}
                <section className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Quick Actions Center</h3>
                    
                    <div className="flex flex-wrap gap-3">
                        <motion.button 
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!hasPermission('can_upload')}
                            onClick={() => { setUploadStep('source'); setShowUploadModal(true); }}
                            className={`h-11 px-6 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                                hasPermission('can_upload') 
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900' 
                                : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                        >
                            <UploadCloud size={16} /> Upload Report
                        </motion.button>
                        <motion.button 
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab('journey')}
                            className="h-11 px-6 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-2 transition-all"
                        >
                            <TrendingUp size={16} /> View Timeline
                        </motion.button>
                        <motion.button 
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!hasPermission('can_book')}
                            onClick={() => { setBookingStep('select'); setShowBookModal(true); }}
                            className={`h-11 px-6 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                                hasPermission('can_book')
                                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-slate-900'
                                : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                        >
                            <Calendar size={16} /> Book Consultation
                        </motion.button>
                        <motion.button 
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={scrollMedicationContinuity}
                            className="h-11 px-6 rounded-xl font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 flex items-center gap-2 transition-all"
                        >
                            <Pill size={16} /> Check Medicine
                        </motion.button>
                        <motion.button 
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!hasPermission('can_share')}
                            onClick={() => { startBriefGeneration(); setShowShareModal(true); }}
                            className={`h-11 px-6 rounded-xl font-semibold flex items-center gap-2 transition-all ${
                                hasPermission('can_share')
                                ? 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                                : 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                        >
                            <Share2 size={16} /> Share Summary
                        </motion.button>
                        {hasPermission('can_trigger_emergency') && (
                            <motion.button 
                                whileHover={{ y: -1 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => { setEmergencyStep('warning'); setShowEmergencyModal(true); }}
                                className="h-11 px-6 rounded-xl font-semibold text-red-600 bg-red-50 hover:bg-red-100/60 border border-red-200/60 transition-all flex items-center gap-2"
                            >
                                <AlertCircle size={16} className="animate-pulse" /> Emergency
                            </motion.button>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Meds card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: "0 12px 20px -8px rgba(0,0,0,0.08)", borderColor: "rgba(2, 132, 199, 0.2)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={scrollMedicationContinuity}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 cursor-pointer flex flex-col justify-between h-[165px] transition-all duration-300 relative group"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Active Meds</span>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                <Pill size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{medications.length} Active</p>
                            <p className="text-sm text-slate-400 font-medium mt-1">
                                {medications.filter(m => m.daysLeft > 7).length} on Track
                                {pendingRefillsCount > 0 ? `, ${pendingRefillsCount} Pending Refill${pendingRefillsCount > 1 ? 's' : ''}` : ''}
                            </p>
                        </div>
                    </motion.div>

                    {/* Adherence card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: "0 12px 20px -8px rgba(0,0,0,0.08)", borderColor: "rgba(16, 185, 129, 0.2)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAdherenceModal(true)}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 cursor-pointer flex flex-col justify-between h-[165px] transition-all duration-300 relative group"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Adherence Rate</span>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                                <Activity size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">92%</p>
                            <span className="inline-block mt-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-full uppercase border border-emerald-100">
                                Excellent
                            </span>
                        </div>
                    </motion.div>

                    {/* Next Appt card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: "0 12px 20px -8px rgba(0,0,0,0.08)", borderColor: "rgba(245, 158, 11, 0.2)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { setBookingStep('select'); setShowBookModal(true); }}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 cursor-pointer flex flex-col justify-between h-[165px] transition-all duration-300 relative group"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Next Appt</span>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform duration-300">
                                <Calendar size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-lg font-black text-slate-900 leading-tight">15 Mar, 10:00 AM</p>
                            <p className="text-xs text-slate-400 font-bold mt-1 truncate">Dr. Sarah Wilson · Video</p>
                        </div>
                    </motion.div>

                    {/* Documents card */}
                    <motion.div 
                        whileHover={{ y: -5, boxShadow: "0 12px 20px -8px rgba(0,0,0,0.08)", borderColor: "rgba(147, 51, 234, 0.2)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab('vault')}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100/80 cursor-pointer flex flex-col justify-between h-[165px] transition-all duration-300 relative group"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-slate-400 text-xs font-black uppercase tracking-widest">Recent Docs</span>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform duration-300">
                                <FileText size={20} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-900">{dashboardData?.Reports?.length || 5}</p>
                            <p className="text-sm text-slate-400 font-medium mt-1 truncate">CBC (2 days ago)</p>
                        </div>
                    </motion.div>
                </div>

                {/* Row 2: Medication Continuity Engine */}
                <section id="medication-continuity-section" className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                                    <Pill className="text-primary-600" /> Medication Continuity
                                </h3>
                                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold rounded-full">
                                    All on Track
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 mt-1">Predictive supply monitoring and adherence tracking.</p>
                        </div>
                        <button onClick={() => setActiveTab('prescriptions')} className="text-sm font-black text-primary-600 hover:text-primary-700 flex items-center gap-1">
                            View All Medications <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="p-8">
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin">
                            {medications.map(med => (
                                <div key={med.id} className="min-w-[280px] max-w-[320px] bg-slate-50 p-6 rounded-2xl border border-slate-100 flex-1 flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-slate-900 leading-tight">{med.name}</h4>
                                            <span className={`w-2.5 h-2.5 rounded-full bg-${med.color === 'green' ? 'emerald' : med.color === 'amber' ? 'amber' : 'red'}-500`}></span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1">{med.dosage}</p>
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1.5">
                                            <span>Stock Progress</span>
                                            <span className={med.daysLeft <= 7 ? 'text-amber-600 font-bold' : ''}>{med.daysLeft} days left</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full bg-${med.color === 'green' ? 'emerald' : med.color === 'amber' ? 'amber' : 'red'}-500`}
                                                style={{ width: `${Math.min(100, (med.daysLeft / med.totalDays) * 100)}%` }}
                                            ></div>

                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                                        <div className="text-xs">
                                            <p className="text-slate-400 font-medium">Adherence</p>
                                            <p className="font-bold text-slate-800">{med.adherence}% ({med.completed}/{med.total})</p>
                                        </div>
                                        {med.daysLeft <= 7 && (
                                            <button 
                                                disabled={activeRole === 'secondary_caregiver'}
                                                onClick={() => { setSelectedMedForRefill(med); setRefillStep('list'); setShowRefillModal(true); }}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                    activeRole === 'secondary_caregiver'
                                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                                }`}
                                            >
                                                Refill
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Persistent Refill Planning Banner */}
                        {(() => {
                            const lowStockMeds = medications.filter(m => m.daysLeft <= 7);
                            if (lowStockMeds.length === 0 || activeRole === 'secondary_caregiver') return null;

                            // Sort to get the most critical one (lowest daysLeft)
                            const criticalMed = [...lowStockMeds].sort((a, b) => a.daysLeft - b.daysLeft)[0];
                            const details = getMedRefillDetails(criticalMed.name);

                            return (
                                <div className="mt-8 bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-amber-900">{criticalMed.name} is running low</h4>
                                            <p className="text-sm text-amber-700 mt-1">
                                                Only {criticalMed.daysLeft} days of supply remaining. Available at **{details.pharmacy} ({details.distance})** for **{details.price}**. Est. delivery: {details.deliveryTime}.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 shrink-0">
                                        <button 
                                            onClick={() => { 
                                                setSelectedMedForRefill(criticalMed); 
                                                setRefillStep('confirm'); 
                                                setSelectedPharmacy({ name: details.pharmacy, price: details.price, distance: details.distance, time: details.deliveryTime }); 
                                                setShowRefillModal(true); 
                                            }}
                                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-black transition-all shadow-sm"
                                        >
                                            Order Now
                                        </button>
                                        <button 
                                            onClick={() => { 
                                                setSelectedMedForRefill(criticalMed); 
                                                setRefillStep('list'); 
                                                setShowRefillModal(true); 
                                            }}
                                            className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-amber-200 rounded-xl text-sm font-bold transition-all"
                                        >
                                            Compare Stock
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </section>

                {/* Row 3: "What's Missing?" (Care Gap Detection) */}
                <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                                <Brain className="text-primary-600" /> What's Missing?
                            </h3>
                            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-black flex items-center justify-center">
                                {gaps.length}
                            </span>
                        </div>
                        <p className="text-sm text-slate-400 mt-1">Clinical gap analyzer has identified items needing your attention.</p>
                    </div>

                    <div className="p-8 divide-y divide-slate-100">
                        {gaps.map(gap => (
                            <div key={gap.id} className="py-5 first:pt-0 last:pb-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex gap-3">
                                    <span className={`px-2.5 py-1 bg-${gap.color}-100 text-${gap.color}-700 border border-${gap.color}-200/50 text-[10px] font-black uppercase tracking-wider rounded-md shrink-0 h-6 flex items-center justify-center`}>
                                        {gap.priority}
                                    </span>
                                    <p className="font-bold text-slate-800 text-sm leading-relaxed">{gap.title}</p>
                                </div>
                                <div className="flex gap-2">
                                    {gap.actions.map((act, index) => (
                                        <button 
                                            key={index}
                                            disabled={activeRole === 'secondary_caregiver' && (act.startsWith('Upload') || act.startsWith('Schedule'))}
                                            onClick={() => {
                                                if (act.includes('Upload')) { setUploadStep('source'); setShowUploadModal(true); }
                                                else if (act.includes('Schedule') || act.includes('Book')) { setBookingStep('select'); setShowBookModal(true); }
                                                else { alert(`Triggered: ${act}`); }
                                            }}
                                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                                activeRole === 'secondary_caregiver' && (act.startsWith('Upload') || act.startsWith('Schedule'))
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : index === 0 
                                                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {act}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Row 4: Quick Share & Emergency Access */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Share with doctor */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
                        <div>
                            <h3 className="font-black text-slate-800 text-xl flex items-center gap-2">
                                <Share2 className="text-primary-600" /> Share with Doctor
                            </h3>
                            <p className="text-sm text-slate-400 mt-2">
                                Generate a secure, doctor-ready patient summary brief including diagnostics history, timeline, and current medications.
                            </p>
                        </div>
                        <button 
                            disabled={!hasPermission('can_share')}
                            onClick={() => { startBriefGeneration(); setShowShareModal(true); }}
                            className={`w-full py-3.5 rounded-2xl font-black transition-all text-center flex items-center justify-center gap-2 ${
                                hasPermission('can_share')
                                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-200'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            }`}
                        >
                            Share Now
                        </button>
                    </div>

                    {/* Emergency locator */}
                    {hasPermission('can_trigger_emergency') && (
                        <div className="bg-red-50/50 p-8 rounded-3xl border border-red-100 shadow-sm flex flex-col justify-between gap-6">
                            <div>
                                <h3 className="font-black text-red-800 text-xl flex items-center gap-2">
                                    <ShieldAlert className="text-red-600 animate-pulse" /> Emergency Control Panel
                                </h3>
                                <p className="text-sm text-red-700/80 mt-2">
                                    Only use in true medical emergencies. Clicking below triggers instant summary sharing with the nearest oncology hospital and maps navigation.
                                </p>
                            </div>
                            <button 
                                onClick={() => { setEmergencyStep('warning'); setShowEmergencyModal(true); }}
                                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-200 transition-all text-center flex items-center justify-center gap-2"
                            >
                                <AlertCircle size={18} /> Trigger Emergency Response
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderCareHubContent = () => {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-8"
            >
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <FileHeart className="text-primary-600 animate-pulse" /> Care Hub
                        </h2>
                        <p className="text-slate-500 mt-2 text-lg">Your integrated clinical ecosystem: pharmacy prescriptions, medication logistics, and supportive care.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowRefillModal(true)}
                            className="px-5 py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-2 transition-all shadow-md"
                        >
                            <Pill size={16} /> Order Refill
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Pharmacy Refills */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h3 className="text-lg font-black text-slate-800 mb-2 flex items-center gap-2">
                                <Pill className="text-primary-500" /> Prescriptions & Pharmacy
                            </h3>
                            <p className="text-xs text-slate-400 mb-6">Manage supply delivery for your oncology medicines.</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {medications.map((med) => {
                                    const details = getMedRefillDetails(med.name);
                                    return (
                                        <div key={med.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between hover:border-primary-300 transition-all duration-300">
                                            <div className="mb-4">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="font-bold text-slate-900 text-sm">{med.name}</h4>
                                                    <span className={`px-2 py-0.5 text-[9px] font-black rounded-full uppercase border ${
                                                        med.daysLeft <= 7 
                                                        ? 'bg-amber-50 text-amber-700 border-amber-100' 
                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                    }`}>
                                                        {med.daysLeft} Days Left
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-1">{details.pharmacy} ({details.distance}) · Est. {details.deliveryTime}</p>
                                            </div>
                                            <button 
                                                onClick={() => { setSelectedMedForRefill(med); setRefillStep('list'); setShowRefillModal(true); }}
                                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-sm"
                                            >
                                                Order Refill
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Supportive Care Guides */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                                <FileHeart className="text-primary-500" /> Supportive Care Guides
                            </h3>
                            <p className="text-xs text-slate-400">Curated materials from oncology experts.</p>

                            <div className="space-y-3">
                                {[
                                    { title: 'Nutritional Care During Chemotherapy', time: '10 min read', category: 'DIET' },
                                    { title: 'Managing Fatigue & Stress Levels', time: '6 min read', category: 'WELLNESS' },
                                    { title: 'Emergency Warning Signs to Monitor', time: '4 min read', category: 'SAFETY' }
                                ].map((res, idx) => (
                                    <a key={idx} href="#" onClick={(e) => e.preventDefault()} className="p-3.5 bg-slate-50 hover:bg-primary-50/40 rounded-xl border border-slate-100 flex justify-between items-center group transition-all">
                                        <div>
                                            <span className="text-[9px] font-black text-primary-600 tracking-widest uppercase block mb-1">{res.category}</span>
                                            <h4 className="font-bold text-xs text-slate-800 group-hover:text-primary-700 transition-colors">{res.title}</h4>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-400 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderConsultationsContent = () => {
        const patientCancerType = dashboardData?.CancerType?.[0]?.name || "Breast Cancer";

        // Dynamic Filtering
        const filteredDoctors = (() => {
            if (!doctors) return [];
            if (doctorFilter === 'recommended') {
                const ctLower = patientCancerType.toLowerCase();
                return doctors.filter(doc => {
                    const specLower = doc.specialist.toLowerCase();
                    if (ctLower.includes('breast')) {
                        return (specLower.includes('oncologist') || specLower.includes('radiation') || specLower.includes('surgical')) && !specLower.includes('pediatric');
                    }
                    if (ctLower.includes('blood') || ctLower.includes('leukemia') || ctLower.includes('lymphoma')) {
                        return specLower.includes('hematologist') || specLower.includes('hematology');
                    }
                    if (ctLower.includes('pediatric') || ctLower.includes('child')) {
                        return specLower.includes('pediatric');
                    }
                    return specLower.includes('oncologist') && !specLower.includes('pediatric');
                });
            }
            if (doctorFilter === 'all') return doctors;
            return doctors.filter(doc => doc.specialist.toLowerCase().includes(doctorFilter.toLowerCase()));
        })();

        // Auto-select first doctor if none is selected
        const displayDoctor = selectedDoctor || filteredDoctors[0] || null;

        // Generate calendar days for current month
        const today = new Date();
        const calYear = today.getFullYear();
        const calMonth = today.getMonth();
        const firstDay = new Date(calYear, calMonth, 1).getDay();
        const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
        const monthName = today.toLocaleString('default', { month: 'long' });
        const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
        const blanksBefore = Array.from({ length: firstDay }, (_, i) => i);

        const timeSlots = ['09:00', '10:00', '11:30', '12:00', '13:00', '14:00', '15:30', '16:00', '17:00'];
        const bookedSlots = ['10:00', '13:00', '17:00'];

        // Specialist filter tabs
        const filterTabs = [
            { id: 'recommended', label: 'Recommended' },
            { id: 'all', label: 'All Specialists' },
            { id: 'Oncologist', label: 'Oncology' },
            { id: 'Radiation', label: 'Radiation' },
            { id: 'Surgical', label: 'Surgical' },
            { id: 'Hematologist', label: 'Hematology' },
            { id: 'Pediatric', label: 'Pediatric' },
        ];

        // Doctor specialty detail enrichment (mock)
        const getDoctorDetails = (doc) => {
            if (!doc) return {};
            const specMap = {
                'Oncologist': {
                    education: 'MBBS, MD – Oncology, AIIMS Delhi',
                    certificate: 'DM Medical Oncology, ESMO Certified',
                    availability: 'Online Consultation · Offline at AIIMS, Delhi',
                    workingHours: 'Mon – Sat  9:00 – 12:00 · 14:00 – 18:00',
                    symptoms: 'Tumor markers, Chemo side-effects, Palliative care',
                    procedures: ['Targeted Therapy Protocol', 'Immunotherapy Review', 'Chemotherapy Planning'],
                    reviews: [
                        { name: 'Priya Sharma', ago: '3 days ago', text: 'Very thorough and patient. Explained my treatment plan clearly.' },
                        { name: 'Rahul Verma', ago: '1 week ago', text: 'Excellent doctor, always available for queries post-consultation.' },
                    ]
                },
                'Hematologist': {
                    education: 'MBBS, MD – Hematology, CMC Vellore',
                    certificate: 'DM Hematology, ASH Member',
                    availability: 'Online Consultation · Offline at CMC Hospital',
                    workingHours: 'Mon – Fri  9:00 – 12:00 · 14:00 – 17:00',
                    symptoms: 'Blood disorders, Leukemia, Lymphoma workup',
                    procedures: ['Bone Marrow Biopsy Review', 'Stem Cell Therapy', 'CBC Interpretation'],
                    reviews: [
                        { name: 'Anjali Mehta', ago: '2 days ago', text: 'Very knowledgeable about blood cancer treatment options.' },
                        { name: 'Suresh Patel', ago: '5 days ago', text: 'Reassuring and detail-oriented. Highly recommend.' },
                    ]
                },
            };
            const specKey = Object.keys(specMap).find(k => doc.specialist?.toLowerCase().includes(k.toLowerCase()));
            return specMap[specKey] || {
                education: `MBBS, MD – ${doc.specialist}, Reputed Medical College`,
                certificate: `Board Certified ${doc.specialist}`,
                availability: 'Online Consultation · Offline at Partner Hospital',
                workingHours: 'Mon – Sat  9:00 – 13:00 · 14:00 – 18:00',
                symptoms: 'Cancer diagnosis, treatment planning, follow-up',
                procedures: ['Oncology Consultation', 'Treatment Protocol Review', 'Palliative Care'],
                reviews: [
                    { name: 'Patient A', ago: '1 week ago', text: 'Great doctor and very helpful throughout treatment.' },
                    { name: 'Patient B', ago: '2 weeks ago', text: 'Thorough examination and clear communication.' },
                ]
            };
        };

        const docDetails = getDoctorDetails(displayDoctor);

        const handleInlineBook = async () => {
            if (!displayDoctor || !selectedCalendarDate || !selectedTimeSlot) return;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(selectedCalendarDate).padStart(2, '0')}`;
            try {
                await bookAppointment(displayDoctor.doctorId, dateStr, selectedTimeSlot);
                setConsultBookingSuccess(true);
                setTimeout(() => setConsultBookingSuccess(false), 4000);
            } catch (e) {
                alert('Booking failed: ' + (e.response?.data?.message || e.message));
            }
        };

        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
            >
                {/* Page Title */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Book Appointment</h2>
                    <p className="text-xs text-slate-400 mt-1">Select a specialist, pick a date, and confirm your appointment in seconds.</p>
                </div>

                {/* Specialty Filter Tabs */}
                <div className="flex gap-1 mb-6 overflow-x-auto pb-1 scrollbar-none">
                    {filterTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => { setDoctorFilter(tab.id); setSelectedDoctor(null); }}
                            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                                doctorFilter === tab.id
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                                : 'bg-white text-slate-600 border-slate-200/80 hover:border-slate-400 hover:text-slate-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Success Banner */}
                <AnimatePresence>
                    {consultBookingSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-700"
                        >
                            <CheckCircle size={18} className="shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Appointment Confirmed!</p>
                                <p className="text-xs mt-0.5 text-emerald-600">Your session with {formatDoctorName(displayDoctor?.name)} on {selectedCalendarDate}/{calMonth+1} at {selectedTimeSlot} is scheduled.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 3-Column Layout */}
                <div className="grid grid-cols-12 gap-0 bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.04)] overflow-hidden">

                    {/* LEFT: Doctor List */}
                    <div className="col-span-12 md:col-span-3 border-r border-slate-100 overflow-y-auto max-h-[680px] scrollbar-thin">
                        <div className="p-4 border-b border-slate-100">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Choose Doctor</h3>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {filteredDoctors.length > 0 ? filteredDoctors.map((doc) => {
                                const isActive = displayDoctor?.doctorId === doc.doctorId;
                                const initials = doc.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DR';
                                const colors = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700'];
                                const colorClass = colors[doc.name?.length % colors.length] || colors[0];
                                return (
                                    <motion.button
                                        key={doc.doctorId}
                                        onClick={() => { setSelectedDoctor(doc); setSelectedTimeSlot(null); setConsultBookingSuccess(false); }}
                                        whileHover={{ backgroundColor: '#f8fafc' }}
                                        className={`w-full text-left p-4 transition-all relative ${
                                            isActive ? 'bg-slate-50 border-l-4 border-l-slate-900' : 'border-l-4 border-l-transparent'
                                        }`}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-sm font-bold ${colorClass}`}>
                                                {initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-slate-900 truncate">{formatDoctorName(doc.name)}</p>
                                                <p className="text-[11px] text-slate-500 truncate">{doc.specialist}</p>
                                                <p className="text-[10px] text-slate-400 mt-0.5">{doc.experience} yrs exp</p>
                                                <div className="flex items-center gap-0.5 mt-1.5">
                                                    {[1,2,3,4].map(s => <span key={s} className="text-amber-400 text-[10px]">★</span>)}
                                                    <span className="text-[9px] text-slate-400 ml-1">4.{(doc.experience % 10) + 0}/5</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            disabled={!hasPermission('can_book')}
                                            onClick={(e) => { e.stopPropagation(); setSelectedDoctor(doc); setSelectedTimeSlot(null); }}
                                            className={`mt-3 w-full py-2 rounded-xl text-[11px] font-bold transition-all ${
                                                hasPermission('can_book')
                                                ? (isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                                                : 'bg-slate-50 text-slate-400 cursor-not-allowed'
                                            }`}
                                        >
                                            {isActive ? 'Selected ✓' : 'Book an appointment'}
                                        </button>
                                    </motion.button>
                                );
                            }) : (
                                <div className="p-8 text-center text-slate-400 text-xs">
                                    <Users size={28} className="mx-auto mb-2 text-slate-200" />
                                    No specialists found for this category.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CENTER: Doctor Profile Detail */}
                    {displayDoctor ? (
                        <motion.div
                            key={displayDoctor.doctorId}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="col-span-12 md:col-span-5 border-r border-slate-100 overflow-y-auto max-h-[680px] scrollbar-thin"
                        >
                            {/* Doctor Header */}
                            <div className="p-6 border-b border-slate-100">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex gap-4">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${
                                            ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-rose-100 text-rose-700', 'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700'][displayDoctor.name?.length % 5]
                                        }`}>
                                            {displayDoctor.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">{formatDoctorName(displayDoctor.name)}</h2>
                                            <p className="text-sm text-slate-500">{displayDoctor.specialist} · {displayDoctor.experience} years experience</p>
                                            <div className="flex items-center gap-1 mt-1.5">
                                                {[1,2,3,4].map(s => <span key={s} className="text-amber-400 text-xs">★</span>)}
                                                <span className="text-amber-400 text-xs">☆</span>
                                                <span className="text-[10px] text-slate-400 ml-1">4.{(displayDoctor.experience % 10)}/5 · ({30 + displayDoctor.experience * 5} reviews)</span>
                                            </div>
                                            <span className="mt-2 inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-wider">{displayDoctor.specialist?.split(' ')[0]}</span>
                                        </div>
                                    </div>
                                    <button
                                        disabled={!hasPermission('can_book') || !selectedCalendarDate || !selectedTimeSlot}
                                        onClick={handleInlineBook}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                            hasPermission('can_book') && selectedCalendarDate && selectedTimeSlot
                                            ? 'bg-slate-900 hover:bg-slate-700 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                        }`}
                                    >
                                        Book an appointment
                                    </button>
                                </div>
                            </div>

                            {/* Doctor Details */}
                            <div className="p-6 space-y-5">
                                {/* Education + Certificate Row */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Education</p>
                                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">{docDetails.education}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Certificate</p>
                                        <p className="text-xs font-semibold text-slate-800 leading-relaxed">{docDetails.certificate}</p>
                                    </div>
                                </div>

                                {/* Availability */}
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Available Today</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl text-xs font-semibold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            Online Consultation
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold">
                                            <MapPin size={11} /> {docDetails.availability?.split('·')[1]?.trim() || 'Partner Hospital'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2.5 font-medium">{docDetails.workingHours}</p>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Symptoms Treated</p>
                                    <p className="text-xs text-slate-700 leading-relaxed">{docDetails.symptoms}</p>
                                </div>

                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Specialty Procedures</p>
                                    <div className="flex flex-wrap gap-2">
                                        {docDetails.procedures?.map((proc, i) => (
                                            <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700">
                                                + {proc}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Reviews</p>
                                    <div className="space-y-4">
                                        {docDetails.reviews?.map((rev, i) => (
                                            <div key={i} className="flex gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                                    {rev.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-xs font-bold text-slate-800">{rev.name}</p>
                                                        <span className="text-[9px] text-slate-400">{rev.ago}</span>
                                                    </div>
                                                    <div className="flex mb-1.5">
                                                        {[1,2,3,4,5].map(s => <span key={s} className={`text-[10px] ${s <= 4 ? 'text-amber-400' : 'text-slate-300'}`}>★</span>)}
                                                    </div>
                                                    <p className="text-[11px] text-slate-600 leading-relaxed">{rev.text}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="col-span-12 md:col-span-5 border-r border-slate-100 flex items-center justify-center p-12 text-slate-300">
                            <div className="text-center">
                                <Users size={40} className="mx-auto mb-3" />
                                <p className="text-sm font-medium text-slate-400">Select a doctor to view details</p>
                            </div>
                        </div>
                    )}

                    {/* RIGHT: Calendar + Time Slots */}
                    <div className="col-span-12 md:col-span-4 overflow-y-auto max-h-[680px] scrollbar-thin">
                        {/* Calendar */}
                        <div className="p-5 border-b border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900">Calendar</h3>
                                <span className="text-xs text-slate-400 font-medium">{monthName} {calYear}</span>
                            </div>
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                    <div key={d} className="text-[9px] font-bold text-slate-400 text-center py-1">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {blanksBefore.map(b => <div key={`b-${b}`} />)}
                                {calendarDays.map(day => {
                                    const isPast = day < today.getDate() && calMonth <= today.getMonth();
                                    const isToday = day === today.getDate();
                                    const isSelected = selectedCalendarDate === day;
                                    return (
                                        <button
                                            key={day}
                                            disabled={isPast}
                                            onClick={() => { setSelectedCalendarDate(day); setSelectedTimeSlot(null); }}
                                            className={`h-8 w-full text-[11px] font-semibold rounded-lg transition-all ${
                                                isPast ? 'text-slate-200 cursor-not-allowed' :
                                                isSelected ? 'bg-slate-900 text-white shadow-sm' :
                                                isToday ? 'bg-blue-50 text-blue-700 border border-blue-200 font-bold' :
                                                'hover:bg-slate-100 text-slate-700'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Visit Hours / Time Slots */}
                        <div className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-slate-900">Visit Hours</h3>
                                {selectedCalendarDate && (
                                    <span className="text-[10px] text-slate-400 font-medium">{selectedCalendarDate} {monthName}</span>
                                )}
                            </div>

                            {!selectedCalendarDate ? (
                                <div className="text-center py-8">
                                    <Clock size={24} className="mx-auto text-slate-200 mb-2" />
                                    <p className="text-xs text-slate-400">Select a date to see available slots</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 gap-2 mb-5">
                                        {timeSlots.map(slot => {
                                            const isBooked = bookedSlots.includes(slot);
                                            const isSelected = selectedTimeSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    disabled={isBooked}
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`py-2.5 rounded-xl text-[11px] font-bold transition-all border ${
                                                        isBooked ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed line-through' :
                                                        isSelected ? 'bg-slate-900 text-white border-slate-900 shadow-sm' :
                                                        'bg-white text-slate-700 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                                                    }`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <button
                                        disabled={!hasPermission('can_book') || !selectedTimeSlot || !displayDoctor}
                                        onClick={handleInlineBook}
                                        className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                                            hasPermission('can_book') && selectedTimeSlot && displayDoctor
                                            ? 'bg-slate-900 hover:bg-slate-700 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {!selectedTimeSlot ? 'Select a time slot' :
                                         !displayDoctor ? 'Select a doctor first' :
                                         `Book — ${selectedTimeSlot}, ${selectedCalendarDate} ${monthName}`
                                        }
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* AI Roadmaps below */}
                <div className="mt-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
                        <Brain size={16} className="text-primary-500" /> AI Consultation Roadmaps
                    </h3>
                    <p className="text-xs text-slate-400 mb-5">Summaries auto-generated from your doctor visits and appointment notes.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { date: 'June 18, 2026', doctor: 'Dr. Sarah Wilson', type: 'Chemotherapy Review', summary: 'Chemotherapy cycle 1 completed with mild nausea. Prescribed Ondansetron. Schedule blood work 3 days before cycle 2. Maintain hydration above 2.5L daily.' },
                            { date: 'May 12, 2026', doctor: 'Dr. James Chen', type: 'Radiology Scan Discussion', summary: 'PET-CT scan analysis reveals positive response — 14% reduction in index node size. Continue current TKI inhibitor dosing. Next imaging scheduled in 3 months.' },
                        ].map((roadmap, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <p className="text-xs font-bold text-slate-800">{roadmap.type}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{roadmap.doctor}</p>
                                    </div>
                                    <span className="text-[9px] text-slate-400 font-bold bg-white px-2 py-1 rounded-lg border border-slate-100">{roadmap.date}</span>
                                </div>
                                <p className="text-[11px] text-slate-600 leading-relaxed mt-2">{roadmap.summary}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderPrescriptionsContent = () => {
        return (
            <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="space-y-8"
            >
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-4xl font-semibold text-slate-900 tracking-tight flex items-center gap-3">
                            <Pill className="text-slate-900" /> My Medicines
                        </h2>
                        <p className="text-slate-500 mt-2 text-lg">Monitor oncology prescriptions, track adherence compliance, and request express refills.</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Active Meds & Adherence */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                    <Activity size={18} className="text-slate-500" /> Active Prescriptions
                                </h3>
                                <button 
                                    onClick={() => setShowAdherenceModal(true)} 
                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50"
                                >
                                    Log Daily Dose
                                </button>
                            </div>

                            <div className="space-y-4">
                                {medications.map((med) => (
                                    <div key={med.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:border-slate-300 transition-all duration-200">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-slate-900">{med.name}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                                    med.daysLeft <= 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                                                }`}>
                                                    {med.daysLeft} Days Left
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 font-medium">Dosage: {med.dosage} · Adherence rate: {med.adherence}%</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => { setSelectedMedForRefill(med); setRefillStep('list'); setShowRefillModal(true); }}
                                                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                                            >
                                                Order Refill
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Pharmacy Refill Tracking status */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <Clock size={18} className="text-slate-500" /> Active Shipments
                            </h3>
                            <p className="text-xs text-slate-400 mb-6">Track delivery status for pending prescription refills.</p>

                            {refillOrders && refillOrders.filter(o => o.status !== 'DELIVERED').length > 0 ? (
                                <div className="space-y-4">
                                    {refillOrders.filter(o => o.status !== 'DELIVERED').map((order) => {
                                        const isMapExpanded = expandedMapOrderId === order.id;
                                        const canTrack = ['OUT_FOR_DELIVERY', 'ARRIVING', 'HANDOVER_PENDING'].includes(order.status);
                                        return (
                                            <div key={order.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-200/60 flex flex-col gap-4 hover:border-slate-300 transition-all duration-200">
                                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                                    <div className="space-y-1">
                                                        <h4 className="font-semibold text-slate-900 text-sm">Order #{order.id.slice(-6).toUpperCase()}</h4>
                                                        <p className="text-xs text-slate-500">{order.medName} · {order.pharmacyName}</p>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className={`w-2.5 h-2.5 rounded-full ${
                                                                order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500 animate-pulse' :
                                                                order.status === 'ARRIVING' ? 'bg-indigo-500 animate-pulse' :
                                                                order.status === 'HANDOVER_PENDING' ? 'bg-purple-500 animate-pulse' :
                                                                order.status === 'PREPARING' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400 animate-pulse'
                                                            }`}></span>
                                                            <span className={`text-[10px] font-bold uppercase ${
                                                                order.status === 'OUT_FOR_DELIVERY' ? 'text-blue-600' :
                                                                order.status === 'ARRIVING' ? 'text-indigo-600' :
                                                                order.status === 'HANDOVER_PENDING' ? 'text-purple-600 font-bold' :
                                                                order.status === 'PREPARING' ? 'text-amber-600' : 'text-slate-500'
                                                            }`}>
                                                                {order.status.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        {canTrack && (
                                                            <button
                                                                onClick={() => setExpandedMapOrderId(isMapExpanded ? null : order.id)}
                                                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-all"
                                                            >
                                                                {isMapExpanded ? 'Hide Map' : 'Track Delivery'}
                                                            </button>
                                                        )}
                                                        {['OUT_FOR_DELIVERY', 'ARRIVING', 'HANDOVER_PENDING'].includes(order.status) && (
                                                            <button
                                                                onClick={() => handleConfirmHandover(order.id)}
                                                                className={`px-4 py-2 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-1 ${
                                                                    order.status === 'HANDOVER_PENDING'
                                                                        ? 'bg-emerald-600 hover:bg-emerald-700'
                                                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                                                }`}
                                                            >
                                                                <ShieldCheck size={14} /> {order.status === 'HANDOVER_PENDING' ? 'Verify Handover' : 'Confirm Handover'}
                                                            </button>
                                                        )}
                                                        <span className="text-xs font-semibold text-slate-500 shrink-0 ml-2">Est: {order.deliveryTime}</span>
                                                    </div>
                                                </div>

                                                {/* Expanded Delivery Map */}
                                                {isMapExpanded && canTrack && (
                                                    <div className="w-full">
                                                        <RefillDeliveryMap orderId={order.id} status={order.status} />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                                    No active shipments. Click "Order Refill" under My Medicines to place one.
                                </div>
                            )}
                        </div>

                        {/* Delivery History (Previous Deliveries) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <CheckCircle size={18} className="text-slate-500" /> Previous Deliveries
                            </h3>
                            <p className="text-xs text-slate-400 mb-6">Completed medication handovers.</p>

                            {refillOrders && refillOrders.filter(o => o.status === 'DELIVERED').length > 0 ? (
                                <div className="space-y-3">
                                    {refillOrders.filter(o => o.status === 'DELIVERED').map((order) => (
                                        <div key={order.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-900 text-sm">{order.medName}</h4>
                                                    <span className="px-2 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded text-[9px] font-bold uppercase">
                                                        Delivered
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-500">Order #{order.id.slice(-6).toUpperCase()} · {order.pharmacyName} · Tracking: {order.trackingId || 'N/A'}</p>
                                            </div>
                                            <span className="text-xs font-semibold text-slate-500 shrink-0">
                                                Delivered on: {new Date(order.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-xs">
                                    No completed deliveries found.
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Right Column: AI Prescription Scans & ML */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                            <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                <Scan size={18} className="text-slate-500" /> Clinical Scans & Assess
                            </h3>
                            <p className="text-xs text-slate-400 mb-6">Extract prescription indicators or run ML survival assessments.</p>
                            <MedicinalRecord user={user} readonly={activeRole === 'secondary_caregiver'} />
                        </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'consultations':
                return renderConsultationsContent();
            case 'carehub':
                return renderCareHubContent();
            case 'prescriptions':
                return renderPrescriptionsContent();
            case 'overview':
                return renderOverviewContent();
            case 'upload':
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-3xl mx-auto space-y-8">
                        <header className="text-center mb-8">
                            <h2 className="text-3xl font-black text-slate-900">Medical Report Vault</h2>
                            <p className="text-slate-500">Upload your blood reports, biopsy, or prescriptions for AI extraction.</p>
                        </header>
                        <UploadReport onUploadSuccess={handleUploadSuccess} />
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-amber-500" /> Security Note
                            </h4>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your reports are encrypted and stored in your private Google Drive vault. Only you and authorized medical staff can access them.
                            </p>
                        </div>
                    </motion.div>
                );
            case 'emergency':
                return <EmergencyLocator user={user} />;
            case 'appointments':
                return (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-3xl font-black text-slate-900">Schedules</h3>
                                <p className="text-slate-500">Track and manage your upcoming visits.</p>
                            </div>
                            <button 
                                disabled={!hasPermission('can_book')}
                                onClick={() => { setBookingStep('select'); setShowBookModal(true); }}
                                className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all ${
                                    hasPermission('can_book')
                                    ? 'bg-slate-900 text-white hover:bg-slate-800'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                }`}
                            >
                                <Plus size={18} /> New Appointment
                            </button>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Doctor</th>
                                        <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Date & Time</th>
                                        <th className="p-6 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {dashboardData?.Appointments?.map((apt) => (
                                        <tr key={apt.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900">{formatDoctorName(apt.doctor?.name)}</p>
                                                <p className="text-xs text-slate-500">{apt.doctor?.specialist}</p>
                                            </td>
                                            <td className="p-6">
                                                <p className="font-bold text-slate-900">{apt.time}</p>
                                                <p className="text-xs text-slate-500">{new Date(apt.date).toLocaleDateString()}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${apt.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700' : apt.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : apt.status === 'EMERGENCY' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{apt.status || 'Scheduled'}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );
            case 'risk':
                return <RiskAssessment />;
            case 'vault':
                return <ReportHistory />;
            case 'journey':
                const allEvents = [
                    { 
                        date: 'Today', 
                        title: 'Consultation with Dr. Sarah Wilson', 
                        type: 'CONSULT', 
                        desc: 'Discussed chemotherapy cycle 1 side effects.',
                        icon: Users,
                        color: 'primary',
                        tabLink: 'consultations'
                    },
                    { 
                        date: '2 Days Ago', 
                        title: 'PET-CT Scan Uploaded', 
                        type: 'REPORT', 
                        desc: 'AI extracted 3cm mass in lower lobe. Priority flagged.',
                        icon: FileText,
                        color: 'emerald',
                        tabLink: 'vault'
                    },
                    { 
                        date: 'Last Week', 
                        title: 'Started New Medication', 
                        type: 'MEDS', 
                        desc: 'Prescribed: Medication Z (500mg). Status: Ongoing.',
                        icon: Pill,
                        color: 'amber',
                        tabLink: 'prescriptions'
                    },
                    { 
                        date: 'Oct 12, 2024', 
                        title: 'First Symptom Logged', 
                        type: 'INTAKE', 
                        desc: 'Patient reported persistent chest pain and cough.',
                        icon: Activity,
                        color: 'slate',
                        tabLink: 'overview'
                    }
                ];

                const filteredEvents = allEvents.filter(e => journeyFilter === 'ALL' || e.type === journeyFilter);

                return (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
                        <header className="mb-8">
                            <h2 className="text-4xl font-black text-slate-900 tracking-tight">Care Journey</h2>
                            <p className="text-sm text-slate-500 mt-2 text-md">Your longitudinal clinical history, mapped chronologically.</p>
                        </header>

                        {/* Interactive Pill Filter Bar */}
                        <div className="flex gap-2 pb-4 overflow-x-auto border-b border-slate-100 mb-8 scrollbar-thin">
                            {[
                                { id: 'ALL', label: 'All History' },
                                { id: 'CONSULT', label: 'Consultations' },
                                { id: 'REPORT', label: 'Diagnostic Scans' },
                                { id: 'MEDS', label: 'Medications' },
                                { id: 'INTAKE', label: 'Symptoms & Intake' }
                            ].map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setJourneyFilter(f.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                                        journeyFilter === f.id
                                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="relative ml-8 space-y-10 pb-12">
                            {/* Thin vertical timeline line */}
                            <div className="absolute left-[31px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200"></div>

                            {filteredEvents.length > 0 ? (
                                filteredEvents.map((event, idx) => (
                                    <div key={idx} className="relative pl-16 group">
                                        {/* Timeline Node Icon (white glass card outline) */}
                                        <div className={`absolute left-[12px] top-1.5 w-10 h-10 rounded-full bg-white border-2 flex items-center justify-center shadow-[0_1.5px_3px_rgba(0,0,0,0.03)] transition-all duration-300 group-hover:scale-110 ${
                                            event.color === 'primary' ? 'border-indigo-500 text-indigo-600' :
                                            event.color === 'emerald' ? 'border-emerald-500 text-emerald-600' :
                                            event.color === 'amber' ? 'border-amber-500 text-amber-600' :
                                            'border-slate-400 text-slate-600'
                                        }`}>
                                            <event.icon size={18} />
                                        </div>

                                        {/* Clinical Card Details */}
                                        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] group-hover:border-slate-300/90 group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.035)] transition-all duration-300">
                                            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                                    event.type === 'CONSULT' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100/50' :
                                                    event.type === 'REPORT' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50' :
                                                    event.type === 'MEDS' ? 'bg-amber-50 text-amber-600 border border-amber-100/50' :
                                                    'bg-slate-50 text-slate-600 border border-slate-200/50'
                                                }`}>
                                                    {event.type}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-semibold">{event.date}</span>
                                            </div>

                                            <h3 className="text-sm font-bold text-slate-900 mb-1">{event.title}</h3>
                                            <p className="text-xs text-slate-500 leading-relaxed">{event.desc}</p>
                                            
                                            <button 
                                                onClick={() => {
                                                    if (event.tabLink) {
                                                        setActiveTab(event.tabLink);
                                                    }
                                                }}
                                                className="mt-4 text-xs font-semibold text-slate-400 hover:text-slate-950 flex items-center gap-1 transition-all"
                                            >
                                                View Details <ChevronRight size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-16 text-center text-slate-400 text-xs">
                                    No timeline events match the selected category.
                                </div>
                            )}
                        </div>
                    </motion.div>
                );

            case 'circle':
                return (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
                        <header className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-10">
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Circle of Care</h2>
                                <p className="text-slate-500 mt-2 text-lg">Manage family access and caregiver coordination.</p>
                            </div>
                        </header>

                        {/* Invitation form (Owner only) */}
                        {hasPermission('can_grant_access') ? (
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <Users className="text-primary-600" /> Invite Caregiver (Owner Control)
                                </h3>
                                <form onSubmit={inviteNewCaregiver} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Caregiver Name</label>
                                        <input 
                                            type="text" 
                                            value={newCaregiverName}
                                            onChange={(e) => setNewCaregiverName(e.target.value)}
                                            placeholder="e.g. Anjali Bhunia"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Caregiver Phone</label>
                                        <input 
                                            type="text" 
                                            value={newCaregiverPhone}
                                            onChange={(e) => setNewCaregiverPhone(e.target.value)}
                                            placeholder="e.g. +91 98765 43210"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Permission Tier</label>
                                        <select 
                                            value={newCaregiverRole}
                                            onChange={(e) => setNewCaregiverRole(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        >
                                            <option value="primary_caregiver">Delegate (Primary Caregiver)</option>
                                            <option value="secondary_caregiver">Viewer (Secondary Caregiver)</option>
                                        </select>
                                    </div>
                                    <button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white font-black py-3 rounded-xl shadow-sm text-sm">
                                        Send Invite
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-3 text-amber-800 text-sm font-bold">
                                <Info size={20} className="shrink-0" />
                                <span>Only the Owner (Patient) can manage caregivers and grant new access.</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {caregivers.map(cg => (
                                <div key={cg.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-start gap-6 relative group hover:border-primary-200 transition-all">
                                    <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-black text-2xl border-2 border-white shadow-sm shrink-0">
                                        {cg.name[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-xl font-bold text-slate-900 truncate">{cg.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${cg.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{cg.status}</span>
                                        </div>
                                        <p className="text-slate-500 font-medium mt-1">{cg.relation}</p>
                                        <p className="text-slate-400 text-xs font-semibold mt-1">{cg.phone}</p>
                                        <div className="mt-4 flex flex-wrap gap-1.5">
                                            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                                                {cg.role === 'primary_caregiver' ? 'Delegate (Operational)' : 'Viewer (Read-Only)'}
                                            </span>
                                        </div>
                                    </div>
                                    {hasPermission('can_grant_access') && (
                                        <button 
                                            onClick={() => revokeCaregiver(cg.id)}
                                            className="absolute top-6 right-6 text-slate-300 hover:text-red-500 transition-colors p-1"
                                            title="Revoke Access"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                );
            case 'settings':
                return (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                        <header className="border-b border-slate-100 pb-4">
                            <h2 className="text-2xl font-black text-slate-900">Account Settings</h2>
                            <p className="text-slate-500 text-sm mt-1">Manage security, permissions, and accounts.</p>
                        </header>

                        <div>
                            <h3 className="text-md font-bold text-slate-800 mb-2">Role Permissions Summary</h3>
                            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 divide-y divide-slate-200/60 text-sm space-y-2">
                                <div className="flex justify-between py-2 text-slate-700">
                                    <span>Current Active View:</span>
                                    <span className="font-bold text-primary-600">{activeRole.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between py-2 text-slate-700">
                                    <span>Emergency Control Access:</span>
                                    <span className={hasPermission('can_trigger_emergency') ? 'text-green-600 font-bold' : 'text-slate-400 font-semibold'}>{hasPermission('can_trigger_emergency') ? 'ENABLED' : 'DISABLED'}</span>
                                </div>
                                <div className="flex justify-between py-2 text-slate-700">
                                    <span>Caregiver Settings Access:</span>
                                    <span className={hasPermission('can_grant_access') ? 'text-green-600 font-bold' : 'text-slate-400 font-semibold'}>{hasPermission('can_grant_access') ? 'ENABLED' : 'DISABLED'}</span>
                                </div>
                            </div>
                        </div>

                        {hasPermission('can_delete_account') && (
                            <div className="pt-6 border-t border-slate-100">
                                <h3 className="text-red-800 font-black text-lg mb-2">Zone of Risk</h3>
                                <p className="text-slate-500 text-sm mb-4">
                                    Once you delete your patient team dashboard account, all stored data, clinical reports, and prescriptions will be deleted permanently.
                                </p>
                                <button 
                                    onClick={() => setShowConfirmDelete(true)}
                                    className="px-5 py-3 bg-red-100 hover:bg-red-600 hover:text-white text-red-700 rounded-2xl font-black text-sm transition-all"
                                >
                                    Delete Account Permanent
                                </button>
                            </div>
                        )}
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans relative">
            {/* Sidebar drawer */}
            <motion.aside 
                animate={{ width: isSidebarCollapsed ? 80 : 288 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 z-50 flex flex-col h-screen overflow-hidden"
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-center h-24 shrink-0">
                    <div className="flex items-center gap-3 text-slate-950 font-semibold text-xl tracking-tight overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
                            <span className="text-white text-lg font-bold">C</span>
                        </div>
                        {!isSidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="whitespace-nowrap font-bold"
                            >
                                CanQure
                            </motion.span>
                        )}
                    </div>
                    {!isSidebarCollapsed && (
                        <button 
                            onClick={() => setIsSidebarCollapsed(true)}
                            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200"
                            title="Collapse Sidebar"
                        >
                            <ChevronLeft size={16} />
                        </button>
                    )}
                </div>

                {isSidebarCollapsed && (
                    <div className="flex justify-center py-4 border-b border-slate-100 shrink-0">
                        <button 
                            onClick={() => setIsSidebarCollapsed(false)}
                            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 border border-slate-200 animate-pulse"
                            title="Expand Sidebar"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto relative py-6">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'journey', icon: TrendingUp, label: 'My Journey' },
                        { id: 'prescriptions', icon: Pill, label: 'My Medicines' },
                        { id: 'vault', icon: Database, label: 'Medical Vault' },
                        { id: 'upload', icon: UploadCloud, label: 'Report Vault' },
                        { id: 'circle', icon: Users, label: 'Circle of Care' },
                        { id: 'appointments', icon: Calendar, label: 'Schedules' },
                        { id: 'consultations', icon: Video, label: 'Consultations' },
                        { id: 'risk', icon: Brain, label: 'AI Care Insights' },
                        { id: 'carehub', icon: FileHeart, label: 'Care Hub' },
                        { id: 'emergency', icon: ShieldAlert, label: 'Emergency Center' },
                        { id: 'settings', icon: Settings, label: 'Settings' }
                    ].map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <motion.button
                                key={item.id}
                                onClick={() => { setActiveTab(item.id); }}
                                className={`flex items-center rounded-xl font-medium relative group transition-all duration-150 focus:outline-none overflow-hidden ${
                                    isSidebarCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'w-full gap-3 px-4 py-2.5 h-11'
                                }`}
                                title={isSidebarCollapsed ? item.label : ""}
                                whileHover={{ x: isSidebarCollapsed ? 0 : 2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabPill"
                                        className={`absolute inset-0 rounded-xl ${
                                            item.id === 'emergency'
                                                ? 'bg-red-50 border border-red-200/50'
                                                : 'bg-slate-100'
                                        }`}
                                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                    />
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabStripe"
                                        className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-r-md ${
                                            item.id === 'emergency' ? 'bg-red-500' : 'bg-slate-900'
                                        }`}
                                        transition={{ type: "spring", stiffness: 400, damping: 32 }}
                                    />
                                )}
                                <item.icon
                                    size={18}
                                    className={`relative z-10 transition-colors duration-150 shrink-0 ${
                                        isActive
                                            ? item.id === 'emergency' ? 'text-red-600' : 'text-slate-900'
                                            : item.id === 'emergency'
                                                ? 'text-red-500 group-hover:text-red-600'
                                                : 'text-slate-500 group-hover:text-slate-800'
                                    }`}
                                />
                                {!isSidebarCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        className={`relative z-10 transition-colors duration-150 text-sm whitespace-nowrap overflow-hidden ${
                                            isActive
                                                ? item.id === 'emergency' ? 'text-red-600 font-semibold' : 'text-slate-900 font-semibold'
                                                : item.id === 'emergency'
                                                    ? 'text-red-500 group-hover:text-red-600'
                                                    : 'text-slate-500 group-hover:text-slate-800'
                                        }`}
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                <div className={`p-4 border-t border-slate-100 flex justify-center shrink-0`}>
                    <button 
                        onClick={handleLogout} 
                        className={`flex items-center justify-center font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50/50 transition-all rounded-xl ${
                            isSidebarCollapsed ? 'w-12 h-12 p-3' : 'w-full gap-3 px-4 py-3'
                        }`}
                        title={isSidebarCollapsed ? "Logout" : ""}
                    >
                        <LogOut size={18} className="shrink-0" />
                        {!isSidebarCollapsed && <span className="text-sm">Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Content main block */}
            <motion.main 
                animate={{ marginLeft: isSidebarCollapsed ? 80 : 288 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 p-6 lg:p-12 max-w-7xl mx-auto w-full min-w-0 pb-24"
            >
                {renderContent()}
            </motion.main>

            <SOSButton />

            {/* Delivery Toast Notification */}
            <AnimatePresence>
                {deliveryToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.96 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 260 }}
                        className="fixed bottom-8 right-8 z-[9999] max-w-sm w-full"
                    >
                        <div className="bg-white border border-emerald-200 rounded-2xl shadow-2xl shadow-emerald-100/60 p-5 flex gap-4 items-start">
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                                <CheckCircle size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-sm">Medicine Delivered</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Your refill for <span className="font-semibold text-slate-800">{deliveryToast.medName}</span> has been delivered by <span className="font-semibold text-slate-800">{deliveryToast.pharmacyName}</span>. Stock updated (+30 days).
                                </p>
                            </div>
                            <button
                                onClick={() => setDeliveryToast(null)}
                                className="text-slate-400 hover:text-slate-700 shrink-0 p-1 rounded-lg hover:bg-slate-50 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- WORKFLOW MODALS --- */}

            {/* Notification Center Side drawer */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="fixed inset-0 bg-black z-50 cursor-pointer"
                        ></motion.div>
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 w-full max-w-md bg-white border-l border-slate-100 z-50 shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Bell className="text-primary-600" /> Notifications</h3>
                                <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-50 rounded-lg"><X size={20} /></button>
                            </div>
                            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                                {notifications.map(notif => (
                                    <div key={notif.id} className={`p-4 rounded-2xl border flex gap-3 ${notif.urgent ? 'bg-red-50/50 border-red-100 text-red-900' : 'bg-slate-50 border-slate-100'}`}>
                                        <AlertCircle size={20} className={notif.urgent ? 'text-red-500 shrink-0 mt-0.5' : 'text-primary-500 shrink-0 mt-0.5'} />
                                        <div>
                                            <h4 className="font-bold text-sm leading-snug">{notif.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.desc}</p>
                                            <span className="text-[10px] text-slate-400 font-bold mt-2 block">{notif.time}</span>
                                        </div>
                                    </div>
                                ))}

                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Adherence Rate Mini-Modal Grid */}
            <AnimatePresence>
                {showAdherenceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2"><CheckCircle className="text-emerald-500" /> Adherence Tracking</h3>
                            <p className="text-sm text-slate-400 mb-6">Confirm and log daily medicine consumption.</p>

                            <div className="space-y-6">
                                {medications.map(med => (
                                    <div key={med.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-slate-800 text-sm">{med.name}</h4>
                                            <span className="text-xs font-black text-emerald-600">{med.adherence}% Rate</span>
                                        </div>

                                        {/* 7-day adherence grid */}
                                        <div className="grid grid-cols-7 gap-2">
                                            {Array.from({ length: 7 }).map((_, index) => {
                                                const day = index + 1;
                                                const isCompleted = day <= Math.round(med.completed % 7) || day <= 4;
                                                return (
                                                    <button 
                                                        key={index}
                                                        onClick={() => handleConfirmAdherence(med.id, index)}
                                                        className={`h-10 rounded-xl flex flex-col items-center justify-center border font-bold text-[10px] transition-all ${
                                                            isCompleted 
                                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <span>D{day}</span>
                                                        {isCompleted ? <Check size={12} className="mt-0.5" /> : <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1"></span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Pharmacy Refill & Comparison Modal */}
            <AnimatePresence>
                {showRefillModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-lg border border-slate-200/80 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-semibold text-slate-900 flex items-center gap-2 mb-1">
                                <Pill className="text-slate-800" size={20} /> Refill: {selectedMedForRefill?.name}
                            </h3>
                            <p className="text-sm text-slate-500 mb-6">Compare stock, pricing, and place a refill routing order.</p>

                            {refillStep === 'list' && (
                                <div className="space-y-4">
                                    {[
                                        { name: 'Apollo Pharmacy', price: '₹2,000', distance: '2km', time: '2 hours', best: true },
                                        { name: 'Fortis Medstore', price: '₹2,250', distance: '4km', time: '4 hours', best: false },
                                        { name: 'MedPlus Chemist', price: '₹1,950', distance: '7km', time: '1 day', best: false }
                                    ].map((pharm, i) => (
                                        <div key={i} className="p-4 bg-slate-50/50 border border-slate-200/60 rounded-xl flex justify-between items-center hover:border-slate-300 transition-all duration-200">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-slate-900 text-sm">{pharm.name}</h4>
                                                    {pharm.best && <span className="bg-slate-900 text-white text-[9px] font-semibold uppercase px-2 py-0.5 rounded-md">Best Choice</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{pharm.distance} away · Est. delivery: {pharm.time}</p>
                                            </div>
                                            <div className="text-right flex items-center gap-4">
                                                <div>
                                                    <p className="font-semibold text-slate-900 text-sm">{pharm.price}</p>
                                                </div>
                                                <button 
                                                    onClick={() => { setSelectedPharmacy(pharm); setRefillStep('confirm'); }}
                                                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {refillStep === 'confirm' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50/50 rounded-xl border border-slate-200/60 space-y-4">
                                        <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                            <span className="text-slate-500 text-sm">Medication:</span>
                                            <span className="font-semibold text-slate-900">{selectedMedForRefill?.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                            <span className="text-slate-500 text-sm">Supplier:</span>
                                            <span className="font-semibold text-slate-900">{selectedPharmacy?.name}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                            <span className="text-slate-500 text-sm">Distance:</span>
                                            <span className="font-semibold text-slate-900">{selectedPharmacy?.distance}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold text-md pt-1">
                                            <span className="text-slate-900">Total Price:</span>
                                            <span className="text-slate-900">{selectedPharmacy?.price}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setRefillStep('list')} className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold rounded-lg text-sm transition-all">
                                            Back
                                        </button>
                                        <button 
                                            onClick={handleConfirmRefill}
                                            className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all shadow-sm"
                                        >
                                            Confirm Order
                                        </button>

                                    </div>
                                </div>
                            )}

                            {refillStep === 'tracking' && (
                                <div className="text-center py-6 space-y-6">
                                    <div className="w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-semibold text-slate-900">Order Placed Successfully!</h4>
                                        <p className="text-sm text-slate-500 mt-2">
                                            Your prescription has been routed to <strong className="text-slate-900">{selectedPharmacy?.name}</strong>. Est. delivery is <strong className="text-slate-900">{deliveryEstimate}</strong>.
                                        </p>
                                    </div>
                                    <button onClick={handleCloseAllModals} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-sm transition-all shadow-sm">
                                        Done
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Doctor-Ready Brief / Sharing Modal */}
            <AnimatePresence>
                {showShareModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-100 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2"><Share2 className="text-primary-600" /> Share Patient Brief</h3>
                            <p className="text-sm text-slate-400 mb-6">Generate and share a structured consultation brief.</p>

                            {isGeneratingBrief ? (
                                <div className="text-center py-12 space-y-4">
                                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Generating Document...</h4>
                                        <p className="text-xs text-slate-400 mt-1">Consolidating lab reports, timeline, and prescriptions.</p>
                                    </div>
                                    <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                        <div className="h-full bg-primary-600" style={{ width: `${shareProgress}%` }}></div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Mock PDF preview */}
                                    <div className="border border-slate-200 rounded-2xl bg-slate-50 p-6 max-h-[300px] overflow-y-auto space-y-6 text-slate-800 shadow-inner">
                                        <div className="border-b border-slate-200 pb-4 text-center">
                                            <h4 className="font-bold text-lg text-slate-900">CAN-QURE CLINICAL BRIEF</h4>
                                            <p className="text-xs text-slate-400">Generated on {new Date().toLocaleDateString()} for Doctor Review</p>
                                        </div>
                                        <div>
                                            <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-2">Patient Profile</h5>
                                            <p className="text-sm font-semibold">Name: John Patient · Stage III Breast Cancer</p>
                                        </div>
                                        <div>
                                            <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-2">Active Regimen</h5>
                                            <p className="text-sm font-semibold">Imatinib 400mg (Daily) · Tamoxifen 20mg (Daily)</p>
                                        </div>
                                        <div>
                                            <h5 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-2">Recent Reports (OCR Parsed)</h5>
                                            <p className="text-xs text-slate-600">CBC (2 days ago): Hb: 12.5 g/dL · WBC: 8.0k · Platelets: 250k</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <button className="py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-black transition-colors flex flex-col items-center justify-center gap-1.5 border border-emerald-100">
                                            <Share2 size={18} /> WhatsApp
                                        </button>
                                        <button className="py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-black transition-colors flex flex-col items-center justify-center gap-1.5 border border-blue-100">
                                            <FileText size={18} /> Email PDF
                                        </button>
                                        <button className="py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-black transition-colors flex flex-col items-center justify-center gap-1.5 border border-purple-100">
                                            <Scan size={18} /> QR Code
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Telemedicine Appointment Booking Modal */}
            <AnimatePresence>
                {showBookModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2"><Calendar className="text-primary-600" /> Book Consultation</h3>
                            <p className="text-sm text-slate-400 mb-6">Schedule tele-visit or clinical checkups with specialized oncologists.</p>

                            {bookingStep === 'select' && (
                                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                                    {doctors.length > 0 ? (
                                        doctors.map(doc => (
                                            <div key={doc.doctorId} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                                <div>
                                                    <h4 className="font-bold text-slate-800 text-sm">{formatDoctorName(doc.name)}</h4>
                                                    <p className="text-xs text-slate-400 mt-1">{doc.specialist} · {doc.experience}y Exp</p>
                                                    <p className="text-xs text-primary-600 font-bold mt-1">Consultation fee: ₹800</p>
                                                </div>
                                                <button 
                                                    onClick={() => { setSelectedDoctor(doc); setBookingStep('time'); }}
                                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-black transition-colors"
                                                >
                                                    Select
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8">
                                            <Loader2 className="animate-spin mx-auto text-primary-600" />
                                            <p className="text-xs text-slate-400 mt-2">Loading oncologists directory...</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {bookingStep === 'time' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Pick Date</label>
                                            <input 
                                                type="date" 
                                                value={bookingDate}
                                                onChange={(e) => setBookingDate(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
                                                min={new Date().toISOString().split('T')[0]}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Pick Time Slot</label>
                                            <select 
                                                value={bookingTime}
                                                onChange={(e) => setBookingTime(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
                                            >
                                                <option value="">-- Choose Slot --</option>
                                                <option value="09:00 AM">09:00 AM</option>
                                                <option value="11:00 AM">11:00 AM</option>
                                                <option value="03:00 PM">03:00 PM</option>
                                                <option value="05:30 PM">05:30 PM</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setBookingStep('select')} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-2xl text-sm transition-all">
                                            Back
                                        </button>
                                        <button 
                                            disabled={!bookingDate || !bookingTime}
                                            onClick={() => setBookingStep('pay')}
                                            className={`flex-1 py-3 font-black rounded-2xl text-sm transition-all ${
                                                bookingDate && bookingTime 
                                                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-100' 
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            }`}
                                        >
                                            Proceed to Pay
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bookingStep === 'pay' && (
                                <div className="space-y-6">
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4">
                                        <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                            <span className="text-slate-500 text-sm">Consultant:</span>
                                            <span className="font-bold text-slate-800">{formatDoctorName(selectedDoctor?.name)}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-200/60 pb-3">
                                            <span className="text-slate-500 text-sm">Date & Time:</span>
                                            <span className="font-bold text-slate-800">{bookingDate} @ {bookingTime}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-md pt-1">
                                            <span className="text-slate-800">Fee Amount:</span>
                                            <span className="text-primary-600">₹800</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setBookingStep('time')} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-2xl text-sm transition-all">
                                            Back
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const res = await bookAppointment(selectedDoctor.doctorId, bookingDate, bookingTime);
                                                    setSuccessApt(res);
                                                    setBookingStep('success');
                                                } catch (e) {
                                                    alert("Booking failed: " + e.message);
                                                }
                                            }}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-emerald-100"
                                        >
                                            Pay ₹800 (Mock Gateway)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {bookingStep === 'success' && (
                                <div className="text-center py-6 space-y-6">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">Appointment Scheduled!</h4>
                                        <p className="text-sm text-slate-400 mt-2">
                                            Your session with **{formatDoctorName(selectedDoctor?.name)}** is confirmed for **{bookingDate}** at **{bookingTime}**. Confirmation details sent.
                                        </p>
                                    </div>
                                    <button onClick={handleCloseAllModals} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors">
                                        Done
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Emergency Alerts Confirmation and Hospital Dispatch Modal */}
            <AnimatePresence>
                {showEmergencyModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-black text-red-700 flex items-center gap-2 mb-2">
                                <ShieldAlert className="text-red-600" /> Emergency Dispatch System
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">Confirm triggers, locate nearest critical oncology emergency rooms.</p>

                            {emergencyStep === 'warning' && (
                                <div className="space-y-6">
                                    <div className="p-5 bg-red-50 border border-red-100 rounded-2xl text-red-900 text-sm space-y-4">
                                        <p className="font-bold">WARNING: THIS WILL AUTO-SHARE CLINICAL BRIEFS AND COORDINATES.</p>

                                        <p className="leading-relaxed">
                                            This action is reserved for urgent medical situations only. It will automatically pinpoint your location, scan for the nearest oncology-capable hospital, and send your medical brief.
                                        </p>
                                        <p className="font-bold uppercase leading-none">Always call local emergency services (108 / 112) first.</p>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={handleCloseAllModals} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-2xl text-sm transition-all">
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={startEmergencyPipeline}
                                            className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-red-100 animate-pulse"
                                        >
                                            Locate Hospital
                                        </button>
                                    </div>
                                </div>
                            )}

                            {emergencyStep === 'locating' && (
                                <div className="text-center py-12 space-y-4">
                                    <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Pinpointing GPS Coordinates...</h4>
                                        <p className="text-xs text-slate-400 mt-1">Scanning hospitals registry within 50km radius.</p>
                                    </div>
                                </div>
                            )}

                            {emergencyStep === 'hospitals' && (
                                <div className="space-y-6">
                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-2">Nearest Oncology Emergency Centers</h4>
                                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                                        {[
                                            { name: 'Medanta Care Hospital (Oncology ER)', distance: '4.2 km', phone: '+91 99999 11111' },
                                            { name: 'Fortis Cancer Care Center', distance: '8.7 km', phone: '+91 88888 22222' },
                                            { name: 'Max Super Speciality Hospital', distance: '12.1 km', phone: '+91 77777 33333' }
                                        ].map((hosp, i) => (
                                            <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                                <div>
                                                    <h5 className="font-bold text-slate-800 text-sm">{hosp.name}</h5>
                                                    <p className="text-xs text-slate-400 mt-1">{hosp.distance} away · Direct emergency line: {hosp.phone}</p>
                                                </div>
                                                <button 
                                                    onClick={() => sendEmergencyAlert(hosp)}
                                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black"
                                                >
                                                    Dispatch
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {emergencyStep === 'sending' && (
                                <div className="text-center py-12 space-y-4">
                                    <Loader2 className="w-12 h-12 text-red-600 animate-spin mx-auto" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Dispatching Brief to {selectedHospital?.name}...</h4>
                                        <p className="text-xs text-slate-400 mt-1">Encrypting patient health vault records for transmission.</p>
                                    </div>
                                </div>
                            )}

                            {emergencyStep === 'tracking' && (
                                <div className="space-y-6 text-slate-800">
                                    <div className="p-4 bg-red-50 border border-red-100 rounded-2xl space-y-4 text-center">
                                        <div className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-red-800">Emergency Alert Sent!</h4>
                                            <p className="text-xs text-red-700 mt-1">Your case brief is sent to **{selectedHospital?.name}**.</p>
                                        </div>
                                    </div>

                                    {/* Sending status timeline */}
                                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl space-y-4 text-sm font-semibold">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle size={16} className="text-emerald-500" />
                                            <span className="text-slate-800">Triggered</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle size={16} className="text-emerald-500" />
                                            <span className="text-slate-800">Brief Generated & Uploaded</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle size={16} className="text-emerald-500" />
                                            <span className="text-slate-800">Sent to Hospital Dashboard</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Clock size={16} className="text-amber-500 animate-spin" />
                                            <span className="text-slate-800">Awaiting Acknowledgment</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <a 
                                            href="https://maps.google.com" 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm transition-all text-center flex items-center justify-center gap-2"
                                        >
                                            <Navigation size={16} /> Open Maps (Route)
                                        </a>
                                        <button 
                                            onClick={() => setEmergencyStep('resolved')}
                                            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm transition-all shadow-md"
                                        >
                                            Mark as Resolved
                                        </button>
                                    </div>
                                </div>
                            )}

                            {emergencyStep === 'resolved' && (
                                <div className="text-center py-6 space-y-6">
                                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                                        <CheckCircle size={32} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-black text-slate-800">Emergency Resolved</h4>
                                        <p className="text-sm text-slate-400 mt-2">
                                            Glad the situation is resolved. Your coordination logs and access tracking have been saved to the audit log safely.
                                        </p>
                                    </div>
                                    <button onClick={handleCloseAllModals} className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors">
                                        Close Panel
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Custom Report Upload OCR Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-2"><UploadCloud className="text-primary-600" /> Upload Report</h3>
                            <p className="text-sm text-slate-400 mb-6">Choose source and process file using AI OCR.</p>

                            {uploadStep === 'source' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => { setUploadedFile({ name: 'blood_report_june.pdf', size: '1.2 MB' }); setUploadStep('preview'); }}
                                            className="p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-center flex flex-col items-center gap-2 transition-all"
                                        >
                                            <FileText size={32} className="text-primary-600" />
                                            <span className="font-bold text-sm text-slate-800">Select File</span>
                                        </button>
                                        <button 
                                            onClick={() => { setUploadedFile({ name: 'camera_capture_report.png', size: '2.4 MB' }); setUploadStep('preview'); }}
                                            className="p-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-center flex flex-col items-center gap-2 transition-all"
                                        >
                                            <Scan size={32} className="text-primary-600" />
                                            <span className="font-bold text-sm text-slate-800">Camera / Scan</span>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {uploadStep === 'preview' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800 text-sm">{uploadedFile?.name}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">{uploadedFile?.size}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setUploadedFile(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
                                    </div>

                                    <div className="flex gap-4">
                                        <button onClick={() => setUploadStep('source')} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-2xl text-sm transition-all">
                                            Back
                                        </button>
                                        <button 
                                            onClick={triggerOcrProgress}
                                            className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-primary-100"
                                        >
                                            Start AI Scan
                                        </button>
                                    </div>
                                </div>
                            )}

                            {uploadStep === 'progress' && (
                                <div className="text-center py-8 space-y-4">
                                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto" />
                                    <div>
                                        <h4 className="font-bold text-slate-800">Processing OCR extraction...</h4>
                                        <p className="text-xs text-slate-400 mt-1">Reading clinical values and medicine prescriptions.</p>
                                    </div>
                                    <div className="w-full max-w-xs h-2 bg-slate-100 rounded-full mx-auto overflow-hidden">
                                        <div className="h-full bg-primary-600" style={{ width: `${uploadProgress}%` }}></div>
                                    </div>
                                </div>
                            )}

                            {uploadStep === 'review' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider">Review Extracted Data</h4>
                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                                            {ocrConfidence}% Match Confidence
                                        </span>
                                    </div>

                                    <div className="space-y-4 max-h-[250px] overflow-y-auto pr-1">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Test Name</label>
                                            <input 
                                                type="text" 
                                                value={extractedData.testName} 
                                                onChange={(e) => setExtractedData({...extractedData, testName: e.target.value})}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-bold"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Hemoglobin</label>
                                                <input 
                                                    type="text" 
                                                    value={extractedData.hemoglobin} 
                                                    onChange={(e) => setExtractedData({...extractedData, hemoglobin: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">WBC Count</label>
                                                <input 
                                                    type="text" 
                                                    value={extractedData.wbc} 
                                                    onChange={(e) => setExtractedData({...extractedData, wbc: e.target.value})}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => { handleCloseAllModals(); handleUploadSuccess(); }}
                                        className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-sm transition-all shadow-md shadow-emerald-100"
                                    >
                                        Confirm & Save in Vault
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Account Deletion Confirmation Modal */}
            <AnimatePresence>
                {showConfirmDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative"
                        >
                            <button onClick={handleCloseAllModals} className="absolute top-6 right-6 p-1 text-slate-400 hover:text-slate-700 rounded-lg"><X size={20} /></button>
                            <h3 className="text-xl font-black text-red-700 flex items-center gap-2 mb-2">Delete Account Permanently</h3>
                            <p className="text-sm text-slate-400 mb-6">This action cannot be undone.</p>

                            <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-950 text-xs leading-relaxed mb-6 font-semibold">
                                Deleting this account will permanently destroy all records, settings, and team access. Type **DELETE** in the console to confirm.
                            </div>

                            <div className="flex gap-4">
                                <button onClick={handleCloseAllModals} className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-2xl text-sm transition-all">
                                    Cancel
                                </button>
                                <button 
                                    onClick={() => { alert("Account deleted. Logging out."); handleLogout(); }}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-sm transition-all"
                                >
                                    Confirm Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delivery Toast Alert */}
            <AnimatePresence>
                {deliveryToast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-6 right-6 z-[9999] p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl flex items-center gap-3 max-w-sm"
                    >
                        {deliveryToast.status === 'offline' ? (
                            <Clock className="text-amber-400 animate-spin shrink-0" size={20} />
                        ) : (
                            <CheckCircle className="text-emerald-400 shrink-0" size={20} />
                        )}
                        <div>
                            <p className="font-bold text-xs">{deliveryToast.medName}</p>
                            <p className="text-[11px] text-slate-300 mt-0.5">{deliveryToast.message}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserDashboard;