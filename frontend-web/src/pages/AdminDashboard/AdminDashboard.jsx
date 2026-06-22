import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getSystemStats,
    getAllUsers,
    getAllDoctors,
    createDoctor,
    updateDoctor,
    deleteDoctor,
    createPatient,
    updatePatient,
    deletePatient,
    createTimeSlots,
    updateSlotStatus,
    getDoctorSlots,
    getAllHospitals,
    createHospital,
    updateHospital,
    deleteHospital
} from '../../api/admin';
import {
    Users,
    UserPlus,
    Calendar,
    Activity,
    Trash2,
    Edit,
    Plus,
    LogOut,
    CheckCircle,
    AlertCircle,
    Shield,
    Stethoscope,
    Clock,
    Lock,
    Unlock,
    LayoutDashboard,
    Search,
    ChevronRight,
    X,
    Menu,
    Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [doctors, setDoctors] = useState([]);
    const [patients, setPatients] = useState([]);
    const [stats, setStats] = useState({ doctors: 0, patients: 0, appointments: 0 });
    const [activeTab, setActiveTab] = useState('overview');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [hospitals, setHospitals] = useState([]);


    const [doctorFormData, setDoctorFormData] = useState({
        name: '',
        specialist: '',
        experience: '',
        email: '',
        password: 'password123',
        hospitalId: ''
    });
    const [editingDoctorId, setEditingDoctorId] = useState(null);
    const [isDoctorFormOpen, setIsDoctorFormOpen] = useState(false);


    const [patientFormData, setPatientFormData] = useState({
        name: '',
        email: '',
        password: 'password123'
    });
    const [editingPatientId, setEditingPatientId] = useState(null);
    const [isPatientFormOpen, setIsPatientFormOpen] = useState(false);


    const [scheduleData, setScheduleData] = useState({
        doctorId: '',
        date: '',
        slots: []
    });
    const [doctorSlots, setDoctorSlots] = useState([]);
    const [newSlotTime, setNewSlotTime] = useState('');

    const [hospitalFormData, setHospitalFormData] = useState({
        name: '',
        address: '',
        city: '',
        contact: '',
        email: ''
    });
    const [editingHospitalId, setEditingHospitalId] = useState(null);
    const [isHospitalFormOpen, setIsHospitalFormOpen] = useState(false);

    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [doctorsRes, statsRes, patientsRes, hospitalsRes] = await Promise.all([
                getAllDoctors(),
                getSystemStats(),
                getAllUsers(),
                getAllHospitals()
            ]);
            setDoctors(doctorsRes);
            setStats(statsRes);
            setPatients(patientsRes);
            setHospitals(hospitalsRes);
            setError('');
        } catch (err) {
            console.error('Error fetching admin data:', err);
            setError('Failed to load dashboard data.');
        }
    };

    const fetchHospitals = async () => {
        try {
            const response = await getAllHospitals();
            setHospitals(response);
        } catch (err) {
            console.error('Error fetching hospitals:', err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const response = await getAllDoctors();
            setDoctors(response);
            const statsRes = await getSystemStats();
            setStats(statsRes);
        } catch (err) {
            console.error('Error fetching doctors:', err);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await getAllUsers();
            setPatients(response);
            const statsRes = await getSystemStats();
            setStats(statsRes);
        } catch (err) {
            console.error('Error fetching patients:', err);
        }
    };

    const handleDoctorSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                ...doctorFormData,
                experience: parseInt(doctorFormData.experience)
            };

            if (editingDoctorId) {
                await updateDoctor(editingDoctorId, data);
            } else {
                await createDoctor(data);
            }

            setDoctorFormData({ name: 'Dr. ', specialist: '', experience: '', email: '', password: 'password123', hospitalId: '' });
            setEditingDoctorId(null);
            setIsDoctorFormOpen(false);
            setError('');
            setSuccessMsg('Doctor saved successfully');
            fetchDoctors();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Error saving doctor:', err);
            setError('Failed to save doctor. Please try again.');
        }
    };

    const handlePatientSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingPatientId) {
                await updatePatient(editingPatientId, patientFormData);
            } else {
                await createPatient(patientFormData);
            }

            setPatientFormData({ name: '', email: '', password: 'password123' });
            setEditingPatientId(null);
            setIsPatientFormOpen(false);
            setError('');
            setSuccessMsg('Patient saved successfully');
            fetchPatients();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            console.error('Error saving patient:', err);
            setError('Failed to save patient. Please try again.');
        }
    };

    const handleHospitalSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingHospitalId) {
                await updateHospital(editingHospitalId, hospitalFormData);
            } else {
                await createHospital(hospitalFormData);
            }
            setHospitalFormData({ name: '', address: '', city: '', contact: '', email: '' });
            setEditingHospitalId(null);
            setIsHospitalFormOpen(false);
            setSuccessMsg('Hospital saved successfully');
            fetchHospitals();
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to save hospital');
        }
    };


    const handleFetchSlots = async () => {
        if (!scheduleData.doctorId || !scheduleData.date) return;
        try {
            const slots = await getDoctorSlots(scheduleData.doctorId, scheduleData.date);
            setDoctorSlots(slots);
        } catch (err) {
            console.error("Error fetching slots:", err);
        }
    };

    useEffect(() => {
        if (activeTab === 'schedule') {
            handleFetchSlots();
        }
    }, [scheduleData.doctorId, scheduleData.date, activeTab]);

    const handleCreateSlot = async () => {
        if (!newSlotTime) return;
        try {
            await createTimeSlots({
                doctorId: scheduleData.doctorId,
                date: scheduleData.date,
                slots: [newSlotTime]
            });
            setNewSlotTime('');
            handleFetchSlots();
            setSuccessMsg('Slot created successfully');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError('Failed to create slot');
        }
    };

    const handleToggleFreeze = async (slot) => {
        try {
            const newStatus = slot.status === 'FROZEN' ? 'PENDING' : 'FROZEN';
            await updateSlotStatus({
                slotId: slot.id,
                status: newStatus
            });
            handleFetchSlots();
        } catch (err) {
            setError('Failed to update slot status');
        }
    };

    const handleEditDoctor = (doctor) => {
        setDoctorFormData({
            name: doctor.name,
            specialist: doctor.specialist,
            experience: doctor.experience,
            email: doctor.email,
            password: '',
            hospitalId: doctor.hospitalId || ''
        });
        setEditingDoctorId(doctor.doctorId);
        setIsDoctorFormOpen(true);
    };

    const handleEditPatient = (patient) => {
        setPatientFormData({
            name: patient.name,
            email: patient.email,
            password: ''
        });
        setEditingPatientId(patient.id);
        setIsPatientFormOpen(true);
    };

    const handleDeleteDoctor = async (id) => {
        if (window.confirm('Are you sure you want to delete this doctor?')) {
            try {
                await deleteDoctor(id);
                fetchDoctors();
            } catch (err) {
                console.error('Error deleting doctor:', err);
                setError('Failed to delete doctor.');
            }
        }
    };

    const handleDeletePatient = async (id) => {
        if (window.confirm('Are you sure you want to delete this patient?')) {
            try {
                await deletePatient(id);
                fetchPatients();
            } catch (err) {
                console.error('Error deleting patient:', err);
                setError('Failed to delete patient.');
            }
        }
    };

    const handleEditHospital = (hospital) => {
        setHospitalFormData({
            name: hospital.name,
            address: hospital.address,
            city: hospital.city,
            contact: hospital.contact,
            email: hospital.email || ''
        });
        setEditingHospitalId(hospital.id);
        setIsHospitalFormOpen(true);
    };

    const handleDeleteHospital = async (id) => {
        if (window.confirm('Are you sure you want to delete this hospital?')) {
            try {
                await deleteHospital(id);
                fetchHospitals();
            } catch (err) {
                setError('Failed to delete hospital');
            }
        }
    };

    const menuItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'hospitals', label: 'Hospitals', icon: Building },
        { id: 'doctors', label: 'Doctors', icon: Stethoscope },
        { id: 'patients', label: 'Patients', icon: Users },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
    ];

    const renderOverview = () => (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Doctors</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.doctors}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Total Patients</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.patients}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">Appointments</p>
                            <p className="text-3xl font-bold text-slate-900">{stats.appointments}</p>
                        </div>
                    </div>
                </div>
            </div>


            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Shield size={120} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-2xl font-bold mb-2">System Administration</h2>
                    <p className="text-slate-300 max-w-xl">
                        Manage your medical staff, patient records, and scheduling system efficiently from this central dashboard.
                    </p>
                </div>
            </div>
        </motion.div>
    );

    const renderHospitals = () => (
        <>
            {isHospitalFormOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsHospitalFormOpen(false)} />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                {editingHospitalId ? <Edit size={18} className="text-blue-500" /> : <Plus size={18} className="text-blue-500" />}
                                {editingHospitalId ? 'Edit Hospital' : 'Add New Hospital'}
                            </h3>
                            <button onClick={() => setIsHospitalFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleHospitalSubmit} className="p-6 space-y-5">
                            <div className="input-group">
                                <label className="input-label">Hospital Name</label>
                                <input type="text" value={hospitalFormData.name} onChange={(e) => setHospitalFormData({ ...hospitalFormData, name: e.target.value })} required placeholder="City Cancer Hospital" className="input-field" />
                            </div>
                            <div className="input-group">
                                <label className="input-label">Address</label>
                                <input type="text" value={hospitalFormData.address} onChange={(e) => setHospitalFormData({ ...hospitalFormData, address: e.target.value })} required placeholder="123 Health Lane" className="input-field" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="input-group">
                                    <label className="input-label">City</label>
                                    <input type="text" value={hospitalFormData.city} onChange={(e) => setHospitalFormData({ ...hospitalFormData, city: e.target.value })} required placeholder="Mumbai" className="input-field" />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Contact</label>
                                    <input type="text" value={hospitalFormData.contact} onChange={(e) => setHospitalFormData({ ...hospitalFormData, contact: e.target.value })} required placeholder="+91 9876543210" className="input-field" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label className="input-label">Email (Optional)</label>
                                <input type="email" value={hospitalFormData.email} onChange={(e) => setHospitalFormData({ ...hospitalFormData, email: e.target.value })} placeholder="info@hospital.com" className="input-field" />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button type="submit" className="flex-1 btn btn-primary">
                                    {editingHospitalId ? 'Update Hospital' : 'Save Hospital'}
                                </button>
                                <button type="button" onClick={() => setIsHospitalFormOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl">Cancel</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                            <tr>
                                <th className="p-4 px-6">Hospital Name</th>
                                <th className="p-4">Location</th>
                                <th className="p-4">Contact</th>
                                <th className="p-4">Doctors</th>
                                <th className="p-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {hospitals.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-slate-500">No hospitals found.</td>
                                </tr>
                            ) : (
                                hospitals.map((hospital) => (
                                    <tr key={hospital.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="p-4 px-6 font-semibold text-slate-900">{hospital.name}</td>
                                        <td className="p-4 text-slate-600">{hospital.city}</td>
                                        <td className="p-4 text-slate-600">{hospital.contact}</td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
                                                {hospital._count?.doctors || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEditHospital(hospital)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={16} /></button>
                                                <button onClick={() => handleDeleteHospital(hospital.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">

            <aside className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-50 flex flex-col transition-transform duration-300 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3 text-white">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold leading-none">Admin</h1>
                            <p className="text-slate-400 text-xs mt-1">Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${activeTab === item.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} className={activeTab === item.id ? 'animate-pulse-slow' : ''} />
                            <span className="font-medium">{item.label}</span>
                            {activeTab === item.id && (
                                <ChevronRight size={16} className="ml-auto opacity-50" />
                            )}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                </div>
            </aside>


            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}


            <main className="flex-1 lg:ml-64 p-4 lg:p-8 min-h-screen transition-all">

                <div className="lg:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                        <Shield className="text-blue-600" size={24} />
                        <span className="font-bold text-slate-900">Admin Portal</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
                    >
                        <Menu size={24} />
                    </button>
                </div>


                <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </h2>
                        <p className="text-slate-500 text-sm mt-1">Welcome back, Admin</p>
                    </div>

                    <div className="flex gap-3">
                        {activeTab === 'doctors' && (
                            <button
                                onClick={() => {
                                    setEditingDoctorId(null);
                                    setDoctorFormData({ name: 'Dr. ', specialist: '', experience: '', email: '', password: 'password123' });
                                    setIsDoctorFormOpen(true);
                                }}
                                className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Plus size={18} />
                                Add Doctor
                            </button>
                        )}
                        {activeTab === 'patients' && (
                            <button
                                onClick={() => {
                                    setEditingPatientId(null);
                                    setPatientFormData({ name: '', email: '', password: 'password123' });
                                    setIsPatientFormOpen(true);
                                }}
                                className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <UserPlus size={18} />
                                Add Patient
                            </button>
                        )}
                        {activeTab === 'hospitals' && (
                            <button
                                onClick={() => {
                                    setEditingHospitalId(null);
                                    setHospitalFormData({ name: '', address: '', city: '', contact: '', email: '' });
                                    setIsHospitalFormOpen(true);
                                }}
                                className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
                            >
                                <Building size={18} />
                                Add Hospital
                            </button>
                        )}
                    </div>
                </header>

                <AnimatePresence mode='wait'>
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {error && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-xl flex items-center gap-3 shadow-sm">
                                <AlertCircle className="text-red-500" size={20} />
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}
                        {successMsg && (
                            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-6 rounded-r-xl flex items-center gap-3 shadow-sm">
                                <CheckCircle className="text-emerald-500" size={20} />
                                <p className="text-emerald-700 font-medium">{successMsg}</p>
                            </div>
                        )}


                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'hospitals' && renderHospitals()}


                        {activeTab === 'doctors' && (
                            <>

                                {isDoctorFormOpen && (
                                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDoctorFormOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
                                        >
                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    {editingDoctorId ? <Edit size={18} className="text-blue-500" /> : <Plus size={18} className="text-blue-500" />}
                                                    {editingDoctorId ? 'Edit Doctor' : 'Add New Doctor'}
                                                </h3>
                                                <button onClick={() => setIsDoctorFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <form onSubmit={handleDoctorSubmit} className="p-6 space-y-5">
                                                <div className="input-group">
                                                    <label className="input-label">Name</label>
                                                    <input type="text" value={doctorFormData.name} onChange={(e) => setDoctorFormData({ ...doctorFormData, name: e.target.value })} required placeholder="Dr. John Doe" className="input-field" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="input-group">
                                                        <label className="input-label">Specialist</label>
                                                        <input type="text" value={doctorFormData.specialist} onChange={(e) => setDoctorFormData({ ...doctorFormData, specialist: e.target.value })} required placeholder="Cardiologist" className="input-field" />
                                                    </div>
                                                    <div className="input-group">
                                                        <label className="input-label">Exp (Years)</label>
                                                        <input type="number" value={doctorFormData.experience} onChange={(e) => setDoctorFormData({ ...doctorFormData, experience: e.target.value })} required placeholder="5" min="0" className="input-field" />
                                                    </div>
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Email</label>
                                                    <input type="email" value={doctorFormData.email} onChange={(e) => setDoctorFormData({ ...doctorFormData, email: e.target.value })} required placeholder="doctor@example.com" className="input-field" />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Affiliated Hospital</label>
                                                    <select 
                                                        value={doctorFormData.hospitalId || ''} 
                                                        onChange={(e) => setDoctorFormData({ ...doctorFormData, hospitalId: e.target.value })}
                                                        className="input-field"
                                                    >
                                                        <option value="">-- Select Hospital --</option>
                                                        {hospitals.map(h => (
                                                            <option key={h.id} value={h.id}>{h.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Password</label>
                                                    <input type="text" value={doctorFormData.password} onChange={(e) => setDoctorFormData({ ...doctorFormData, password: e.target.value })} required={!editingDoctorId} placeholder={editingDoctorId ? "Leave blank to keep" : "password123"} className="input-field" />
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button type="submit" className="flex-1 btn btn-primary flex justify-center items-center gap-2">
                                                        {editingDoctorId ? 'Update Doctor' : 'Save Doctor'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                                        onClick={() => setIsDoctorFormOpen(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    </div>
                                )}

                                <div className="card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4 px-6">Doctor Name</th>
                                                    <th className="p-4">Specialization</th>
                                                    <th className="p-4">Hospital</th>
                                                    <th className="p-4">Experience</th>
                                                    <th className="p-4 px-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {doctors.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-slate-500">
                                                            No doctors found. Add one to get started.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    doctors.map((doctor) => (
                                                        <tr key={doctor.doctorId} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="p-4 px-6">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                                        {doctor.name.charAt(0)}
                                                                    </div>
                                                                    <span className="font-semibold text-slate-900">{doctor.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                                                                    {doctor.specialist}
                                                                </span>
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-900 font-medium">{doctor.hospital?.name || 'Private Practice'}</span>
                                                                    <span className="text-slate-400 text-[10px]">{doctor.email}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-slate-600">{doctor.experience} Years</td>
                                                            <td className="p-4 px-6 text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleEditDoctor(doctor)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteDoctor(doctor.doctorId)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}



                        {activeTab === 'patients' && (
                            <>

                                {isPatientFormOpen && (
                                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
                                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPatientFormOpen(false)} />
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden"
                                        >
                                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                                    {editingPatientId ? <Edit size={18} className="text-blue-500" /> : <UserPlus size={18} className="text-blue-500" />}
                                                    {editingPatientId ? 'Edit Patient' : 'Add New Patient'}
                                                </h3>
                                                <button onClick={() => setIsPatientFormOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                                    <X size={20} />
                                                </button>
                                            </div>
                                            <form onSubmit={handlePatientSubmit} className="p-6 space-y-5">
                                                <div className="input-group">
                                                    <label className="input-label">Name</label>
                                                    <input type="text" value={patientFormData.name} onChange={(e) => setPatientFormData({ ...patientFormData, name: e.target.value })} required placeholder="John Doe" className="input-field" />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Email</label>
                                                    <input type="email" value={patientFormData.email} onChange={(e) => setPatientFormData({ ...patientFormData, email: e.target.value })} required placeholder="patient@example.com" className="input-field" />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">Password</label>
                                                    <input type="text" value={patientFormData.password} onChange={(e) => setPatientFormData({ ...patientFormData, password: e.target.value })} required={!editingPatientId} placeholder={editingPatientId ? "Leave blank to keep" : "password123"} className="input-field" />
                                                </div>
                                                <div className="flex gap-3 pt-2">
                                                    <button type="submit" className="flex-1 btn btn-primary flex justify-center items-center gap-2">
                                                        {editingPatientId ? 'Update Patient' : 'Save Patient'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                                                        onClick={() => setIsPatientFormOpen(false)}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </motion.div>
                                    </div>
                                )}

                                <div className="card overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="p-4 px-6">Patient ID</th>
                                                    <th className="p-4">Name</th>
                                                    <th className="p-4">Email</th>
                                                    <th className="p-4">Active Appts</th>
                                                    <th className="p-4 px-6 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {patients.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="p-8 text-center text-slate-500">
                                                            No patients found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    patients.map((patient) => (
                                                        <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors group">
                                                            <td className="p-4 px-6">
                                                                <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">#{patient.id}</span>
                                                            </td>
                                                            <td className="p-4 font-semibold text-slate-900">{patient.name}</td>
                                                            <td className="p-4 text-slate-600">{patient.email}</td>
                                                            <td className="p-4">
                                                                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                                                    {patient._count?.Appointments || 0}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 px-6 text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        onClick={() => handleEditPatient(patient)}
                                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                        title="Edit"
                                                                    >
                                                                        <Edit size={16} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeletePatient(patient.id)}
                                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}



                        {activeTab === 'schedule' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="card h-fit p-6 space-y-6">
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-1">Manage Schedule</h3>
                                        <p className="text-slate-500 text-sm">Create and manage doctor availability.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="input-group">
                                            <label className="input-label">Select Doctor</label>
                                            <select
                                                value={scheduleData.doctorId}
                                                onChange={(e) => setScheduleData({ ...scheduleData, doctorId: e.target.value })}
                                                className="input-field"
                                            >
                                                <option value="">-- Select Doctor --</option>
                                                {doctors.map(doc => (
                                                    <option key={doc.doctorId} value={doc.doctorId}>{doc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="input-group">
                                            <label className="input-label">Select Date</label>
                                            <input
                                                type="date"
                                                value={scheduleData.date}
                                                onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                                min={new Date().toISOString().split('T')[0]}
                                                className="input-field"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100">
                                        <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                            <Plus size={16} className="text-blue-500" /> Add Time Slot
                                        </h4>
                                        <div className="flex gap-2">
                                            <input
                                                type="time"
                                                value={newSlotTime}
                                                onChange={(e) => setNewSlotTime(e.target.value)}
                                                className="input-field"
                                            />
                                            <button
                                                onClick={handleCreateSlot}
                                                className="btn btn-primary px-6"
                                                disabled={!scheduleData.doctorId || !scheduleData.date || !newSlotTime}
                                            >
                                                Add
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card lg:col-span-2 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-bold text-slate-800">
                                            Available Slots
                                        </h3>
                                        {scheduleData.date && (
                                            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                {scheduleData.date}
                                            </span>
                                        )}
                                    </div>

                                    {!scheduleData.doctorId || !scheduleData.date ? (
                                        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                                <Clock className="text-slate-300" size={32} />
                                            </div>
                                            <p className="text-slate-500 font-medium">Select a doctor and date to view slots.</p>
                                        </div>
                                    ) : (
                                        <div>
                                            {doctorSlots.length === 0 ? (
                                                <div className="text-center py-12">
                                                    <p className="text-slate-500">No slots created yet for this date.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                                                    {doctorSlots.map(slot => (
                                                        <motion.div
                                                            layout
                                                            initial={{ opacity: 0, scale: 0.9 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            key={slot.id}
                                                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden group ${slot.status === 'FROZEN' ? 'bg-red-50 border-red-200' :
                                                                    slot.status === 'BOOKED' ? 'bg-blue-50 border-blue-200' :
                                                                        'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
                                                                }`}
                                                        >
                                                            <div className={`absolute top-0 right-0 p-1 rounded-bl-lg ${slot.status === 'FROZEN' ? 'bg-red-100 text-red-600' :
                                                                    slot.status === 'BOOKED' ? 'bg-blue-100 text-blue-600' :
                                                                        'bg-emerald-100 text-emerald-600'
                                                                }`}>
                                                                {slot.status === 'FROZEN' && <Lock size={12} />}
                                                                {slot.status === 'BOOKED' && <CheckCircle size={12} />}
                                                                {slot.status === 'AVAILABLE' && <CheckCircle size={12} />}
                                                            </div>

                                                            <span className={`font-bold text-lg ${slot.status === 'FROZEN' ? 'text-red-700' :
                                                                    slot.status === 'BOOKED' ? 'text-blue-700' :
                                                                        'text-slate-700'
                                                                }`}>
                                                                {slot.time}
                                                            </span>

                                                            <span className={`text-[10px] uppercase tracking-wider font-bold ${slot.status === 'FROZEN' ? 'text-red-600' :
                                                                    slot.status === 'BOOKED' ? 'text-blue-600' :
                                                                        'text-emerald-600'
                                                                }`}>
                                                                {slot.status}
                                                            </span>

                                                            {slot.status !== 'BOOKED' && (
                                                                <button
                                                                    onClick={() => handleToggleFreeze(slot)}
                                                                    className={`w-full text-xs py-2 rounded-lg font-semibold transition-colors flex items-center justify-center gap-1.5 ${slot.status === 'FROZEN'
                                                                            ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50'
                                                                            : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-white hover:shadow-sm'
                                                                        }`}
                                                                >
                                                                    {slot.status === 'FROZEN' ? (
                                                                        <><Unlock size={12} /> Unlock</>
                                                                    ) : (
                                                                        <><Lock size={12} /> Freeze</>
                                                                    )}
                                                                </button>
                                                            )}
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminDashboard;