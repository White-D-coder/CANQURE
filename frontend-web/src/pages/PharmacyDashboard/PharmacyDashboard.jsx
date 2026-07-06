import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { 
    LayoutDashboard, 
    Pill, 
    LogOut, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Search, 
    Menu, 
    X, 
    Activity, 
    TrendingUp,
    Settings,
    MoreVertical,
    ClipboardList,
    ChevronRight,
    ArrowRight,
    MapPin,
    Package,
    Truck,
    ShieldAlert,
    TrendingDown,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function PharmacyDashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    // UI layouts
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('orders'); // orders | inventory | settings

    // Pharmacy simulator selector (Apollo Pharmacy, MedPlus Chemist, Fortis Medstore)
    const [activePharmacy, setActivePharmacy] = useState(user?.pharmacyName || 'Apollo Pharmacy');

    useEffect(() => {
        if (user?.pharmacyName) {
            setActivePharmacy(user.pharmacyName);
        }
    }, [user]);
    
    // API Data
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    // Inventory status (Local simulated state for pharmacy product listings)
    const [inventory, setInventory] = useState([
        { id: 1, name: 'Imatinib 400mg', stock: 150, price: '₹2,000', category: 'Targeted Therapy', status: 'IN_STOCK' },
        { id: 2, name: 'Tamoxifen 20mg', stock: 320, price: '₹1,200', category: 'Hormone Therapy', status: 'IN_STOCK' },
        { id: 3, name: 'Zoledronic Acid 4mg', stock: 12, price: '₹3,500', category: 'Bone Health', status: 'LOW_STOCK' },
        { id: 4, name: 'Doxorubicin 50mg', stock: 45, price: '₹4,500', category: 'Chemotherapy', status: 'IN_STOCK' },
        { id: 5, name: 'Pembrolizumab 100mg', stock: 8, price: '₹85,000', category: 'Immunotherapy', status: 'LOW_STOCK' },
    ]);

    const fetchOrders = async (showRefreshIndicator = false) => {
        if (showRefreshIndicator) setRefreshing(true);
        try {
            const response = await api.get('/refill-orders/all');
            setOrders(response.data);
            setError('');
        } catch (err) {
            console.error("Failed to load pharmacy orders:", err);
            setError("Failed to fetch refill orders from server.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        // Set up polling interval for real-time order notifications (e.g. every 10 seconds)
        const interval = setInterval(() => fetchOrders(), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleUpdateStatus = async (orderId, currentStatus) => {
        const statusMap = {
            'PENDING': 'CONFIRMED',
            'CONFIRMED': 'PREPARING',
            'PREPARING': 'PACKED',
            'PACKED': 'OUT_FOR_DELIVERY',
            'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
            'ARRIVING': 'ARRIVING',
            'HANDOVER_PENDING': 'HANDOVER_PENDING',
            'DELIVERED': 'DELIVERED'
        };
        const nextStatus = statusMap[currentStatus];
        if (nextStatus === currentStatus) return; 

        try {
            await api.put(`/refill-orders/${orderId}/status`, { status: nextStatus });
            // Re-fetch orders list instantly
            fetchOrders();
        } catch (err) {
            console.error("Failed to update status", err);
            alert("Error updating order: " + (err.response?.data?.message || err.message));
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Filter orders by active simulation pharmacy & search query
    const filteredOrders = orders
        .filter(order => order.pharmacyName === activePharmacy)
        .filter(order => {
            const query = searchQuery.toLowerCase();
            return (
                order.patientName.toLowerCase().includes(query) ||
                order.medName.toLowerCase().includes(query) ||
                order.id.toLowerCase().includes(query)
            );
        })
        // Priority Sorting: Sort by daysRemaining ascending (Critical medication continuity threats first)
        .sort((a, b) => {
            if (a.status === 'DELIVERED' && b.status !== 'DELIVERED') return 1;
            if (b.status === 'DELIVERED' && a.status !== 'DELIVERED') return -1;
            return a.daysRemaining - b.daysRemaining;
        });

    // KPI statistics (computed from filtered pharmacy orders)
    const stats = {
        total: filteredOrders.length,
        critical: filteredOrders.filter(o => o.daysRemaining <= 5 && o.status !== 'DELIVERED').length,
        activeShipments: filteredOrders.filter(o => ['PREPARING', 'OUT_FOR_DELIVERY'].includes(o.status)).length,
        delivered: filteredOrders.filter(o => o.status === 'DELIVERED').length
    };

    const renderOrdersContent = () => {
        return (
            <div className="space-y-6">
                {/* Stats Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Refills Routed</span>
                            <span className="p-2 bg-slate-50 rounded-xl border border-slate-200/40 text-slate-700"><ClipboardList size={18} /></span>
                        </div>
                        <h4 className="text-3xl font-semibold text-slate-900 mt-4">{stats.total}</h4>
                        <p className="text-xs text-slate-400 mt-2">Active routed prescriptions</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className={`bg-white p-6 rounded-3xl border ${stats.critical > 0 ? 'border-red-200 bg-red-50/10' : 'border-slate-200/80'} shadow-[0_1px_3px_rgba(0,0,0,0.02)]`}
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Continuity Threat</span>
                            <span className={`p-2 rounded-xl border text-red-600 ${stats.critical > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200/40'}`}><ShieldAlert size={18} /></span>
                        </div>
                        <h4 className={`text-3xl font-semibold mt-4 ${stats.critical > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.critical}</h4>
                        <p className="text-xs text-slate-400 mt-2">Patients with &le; 5 days of supply left</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Prep / Delivery</span>
                            <span className="p-2 bg-slate-50 rounded-xl border border-slate-200/40 text-blue-600"><Truck size={18} /></span>
                        </div>
                        <h4 className="text-3xl font-semibold text-slate-900 mt-4">{stats.activeShipments}</h4>
                        <p className="text-xs text-slate-400 mt-2">Currently being fulfilled</p>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
                    >
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed Today</span>
                            <span className="p-2 bg-slate-50 rounded-xl border border-slate-200/40 text-green-600"><CheckCircle size={18} /></span>
                        </div>
                        <h4 className="text-3xl font-semibold text-slate-900 mt-4">{stats.delivered}</h4>
                        <p className="text-xs text-slate-400 mt-2">Successfully delivered refills</p>
                    </motion.div>
                </div>

                {/* Orders Queue list */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
                    <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Refill Routing Queue</h3>
                            <p className="text-xs text-slate-400 mt-1">Medication Continuity Priority Queue. Urgent refills are placed at the top.</p>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="relative flex-1 sm:flex-none">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Search order or patient..." 
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-slate-400 bg-slate-50/50"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button 
                                onClick={() => fetchOrders(true)} 
                                className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 transition-all flex items-center gap-1.5"
                                title="Refresh Orders"
                            >
                                <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-24 text-center text-slate-400">
                            <Activity className="animate-spin mx-auto text-slate-300 mb-3" size={32} />
                            <p className="text-sm">Fetching incoming routing requests...</p>
                        </div>
                    ) : filteredOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 font-semibold">
                                        <th className="py-4 px-6">Order ID</th>
                                        <th className="py-4 px-6">Patient</th>
                                        <th className="py-4 px-6">Medication Details</th>
                                        <th className="py-4 px-6 text-center">Supply Status</th>
                                        <th className="py-4 px-6">Total Price</th>
                                        <th className="py-4 px-6">Routing Status</th>
                                        <th className="py-4 px-6 text-right">Actions / Transitions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map((order) => {
                                        const isCritical = order.daysRemaining <= 5 && order.status !== 'DELIVERED';
                                        return (
                                            <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-all duration-200">
                                                <td className="py-4 px-6 font-semibold text-slate-700">
                                                    #{order.id.slice(-6).toUpperCase()}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-semibold text-slate-900">{order.patientName}</div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">Cancer Care Patient</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                                                        <Pill size={13} className="text-slate-500" />
                                                        {order.medName}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 mt-0.5">Route: Apollo Pharmacy (Express)</div>
                                                </td>
                                                <td className="py-4 px-6 text-center">
                                                    <div className="inline-flex flex-col items-center">
                                                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] ${
                                                            isCritical 
                                                                ? 'bg-red-50 text-red-600 border border-red-200/50 animate-pulse' 
                                                                : 'bg-slate-100 text-slate-600'
                                                        }`}>
                                                            {order.daysRemaining} days left
                                                        </span>
                                                        {isCritical && (
                                                            <span className="text-[8px] text-red-500 font-semibold mt-1">Continuity Alert</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 font-bold text-slate-900">{order.price}</td>
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`w-2 h-2 rounded-full ${
                                                            order.status === 'DELIVERED' ? 'bg-green-500' :
                                                            order.status === 'OUT_FOR_DELIVERY' ? 'bg-blue-500 animate-pulse' :
                                                            order.status === 'ARRIVING' ? 'bg-indigo-500 animate-pulse' :
                                                            order.status === 'HANDOVER_PENDING' ? 'bg-purple-500 animate-pulse' :
                                                            order.status === 'PREPARING' ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                                                        }`}></span>
                                                        <span className={`font-semibold uppercase text-[10px] ${
                                                            order.status === 'DELIVERED' ? 'text-green-600' :
                                                            order.status === 'OUT_FOR_DELIVERY' ? 'text-blue-600' :
                                                            order.status === 'ARRIVING' ? 'text-indigo-600' :
                                                            order.status === 'HANDOVER_PENDING' ? 'text-purple-600 font-bold' :
                                                            order.status === 'PREPARING' ? 'text-amber-600' : 'text-slate-500'
                                                        }`}>
                                                            {order.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    {order.status === 'DELIVERED' ? (
                                                        <span className="text-green-600 font-semibold flex items-center justify-end gap-1">
                                                            <CheckCircle size={14} /> Completed
                                                        </span>
                                                    ) : ['OUT_FOR_DELIVERY', 'ARRIVING', 'HANDOVER_PENDING'].includes(order.status) ? (
                                                        <button 
                                                            disabled
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-400 rounded-lg font-semibold text-[10px] cursor-not-allowed"
                                                        >
                                                            <span>Awaiting Handover</span>
                                                            <Clock size={12} className="animate-spin text-slate-300" />
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(order.id, order.status)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold text-[10px] transition-all shadow-sm"
                                                        >
                                                            <span>
                                                                {order.status === 'PENDING' ? 'Confirm Order' :
                                                                 order.status === 'CONFIRMED' ? 'Start Preparing' :
                                                                 order.status === 'PREPARING' ? 'Pack Refill' :
                                                                 order.status === 'PACKED' ? 'Ship Refill' : 'Next Step'}
                                                            </span>
                                                            <ArrowRight size={12} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-24 text-center text-slate-400">
                            <Package className="mx-auto text-slate-200 mb-3" size={32} />
                            <p className="text-sm font-medium">No prescription refills pending for {activePharmacy}</p>
                            <p className="text-xs text-slate-400 mt-1">Use the active pharmacy dropdown to simulate Apollo Pharmacy or MedPlus Chemist orders.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderInventoryContent = () => {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">Oncology Drug Inventory</h3>
                            <p className="text-xs text-slate-400 mt-1">Manage chemotherapy and critical cancer care medicine stocks for {activePharmacy}.</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs transition-all shadow-sm">
                            + Add New Drug
                        </button>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/30 text-slate-500 font-semibold">
                                    <th className="py-4 px-6">Drug Name</th>
                                    <th className="py-4 px-6">Therapeutic Class</th>
                                    <th className="py-4 px-6">Base Cost</th>
                                    <th className="py-4 px-6">Stock Status</th>
                                    <th className="py-4 px-6 text-right">Available Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventory.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/30 transition-all duration-200">
                                        <td className="py-4 px-6 font-semibold text-slate-900">{item.name}</td>
                                        <td className="py-4 px-6 text-slate-500">{item.category}</td>
                                        <td className="py-4 px-6 font-semibold text-slate-800">{item.price}</td>
                                        <td className="py-4 px-6">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                                                item.stock <= 15 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                                            }`}>
                                                {item.stock <= 15 ? 'Low Stock Alert' : 'In Stock'}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right font-semibold text-slate-900">{item.stock} Units</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50/50 flex">
            {/* Sidebar section */}
            <motion.aside 
                animate={{ width: isSidebarCollapsed ? 80 : 288 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="hidden md:flex flex-col bg-white border-r border-slate-200/80 sticky top-0 h-screen shrink-0 z-40"
            >
                <div className="h-16 px-6 border-b border-slate-200/60 flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">C</div>
                            <span className="font-bold text-slate-900 text-md tracking-tight">CANQURE <span className="text-[10px] text-slate-400 font-normal">PHARMA</span></span>
                        </div>
                    )}
                    {isSidebarCollapsed && (
                        <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm mx-auto">C</div>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-2.5">
                    {[
                        { tab: 'orders', label: 'Refill Requests', icon: ClipboardList },
                        { tab: 'inventory', label: 'Drug Inventory', icon: Pill },
                    ].map((item) => {
                        const IconComponent = item.icon;
                        const isActive = activeTab === item.tab;
                        return (
                            <button
                                key={item.tab}
                                onClick={() => setActiveTab(item.tab)}
                                className={`flex items-center rounded-xl transition-all duration-200 relative group font-semibold text-xs ${
                                    isActive ? 'text-slate-900 bg-slate-50 border border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50 border border-transparent'
                                } ${isSidebarCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'w-full gap-3 px-4 py-2.5 h-11'}`}
                                title={isSidebarCollapsed ? item.label : ""}
                            >
                                <IconComponent size={16} />
                                {!isSidebarCollapsed && <span>{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200/60 space-y-4">
                    <button 
                        onClick={handleLogout}
                        className={`flex items-center rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50/40 transition-all font-semibold text-xs border border-transparent ${
                            isSidebarCollapsed ? 'w-12 h-12 p-3' : 'w-full gap-3 px-4 py-3'
                        }`}
                        title={isSidebarCollapsed ? "Logout" : ""}
                    >
                        <LogOut size={16} />
                        {!isSidebarCollapsed && <span className="text-xs">Logout</span>}
                    </button>
                </div>
            </motion.aside>

            {/* Main Content Area */}
            <motion.main 
                animate={{ marginLeft: 0 }}
                className="flex-grow min-w-0 flex flex-col min-h-screen"
            >
                {/* Header panel */}
                <header className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex justify-between items-center z-30 sticky top-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-1 text-slate-500 hover:bg-slate-50 rounded-lg"><Menu size={20} /></button>
                        <div className="hidden sm:block text-slate-400 font-semibold text-[10px] uppercase tracking-wider">Pharmacy Admin Workspace</div>
                    </div>

                    {/* Pharmacy Switcher dropdown simulating the network routed channels */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Active Pharmacy:</span>
                            {user?.pharmacyName ? (
                                <span className="px-3 py-1.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs font-semibold text-slate-900 shadow-sm">
                                    {user.pharmacyName}
                                </span>

                            ) : (
                                <select 
                                    value={activePharmacy}
                                    onChange={(e) => setActivePharmacy(e.target.value)}
                                    className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 bg-slate-50/50 hover:bg-slate-50 focus:outline-none cursor-pointer shadow-sm transition-all"
                                >
                                    <option value="Apollo Pharmacy">Apollo Pharmacy (Express)</option>
                                    <option value="MedPlus Chemist">MedPlus Chemist</option>
                                    <option value="Fortis Medstore">Fortis Medstore</option>
                                </select>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 border-l border-slate-200/80 pl-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200/40 flex items-center justify-center text-xs font-bold text-slate-600">
                                {user?.pharmacyName ? user.pharmacyName.substring(0, 2).toUpperCase() : 'PA'}
                            </div>
                            <div className="text-left hidden lg:block">
                                <p className="text-xs font-semibold text-slate-900">{user?.username || 'Pharma Admin'}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{user?.email || 'apollo@canqure.com'}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard body contents */}
                <div className="p-6 sm:p-8 flex-1 max-w-7xl w-full mx-auto space-y-8">
                    {/* Welcome Banner */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-[0_1.5px_3px_rgba(0,0,0,0.025)] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">Welcome to CANQURE Refills</h2>
                            <p className="text-slate-500 mt-1.5 text-xs sm:text-sm">Manage prescription routing, track medication continuity compliance, and verify live delivery handovers.</p>
                        </div>
                        <div className="flex gap-3">
                            <span className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                                <Activity size={12} className="text-green-500" /> System Active
                            </span>
                        </div>
                    </div>

                    {activeTab === 'orders' ? renderOrdersContent() : renderInventoryContent()}
                </div>
            </motion.main>

            {/* Mobile Drawer Drawer */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <div className="fixed inset-0 z-50 md:hidden flex">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
                        <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} className="relative bg-white w-72 h-full flex flex-col p-6 shadow-2xl z-10 border-r border-slate-200">
                            <button onClick={() => setIsSidebarOpen(false)} className="absolute top-5 right-5 p-1 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-700"><X size={20} /></button>
                            
                            <div className="flex items-center gap-2 mb-8">
                                <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-sm">C</div>
                                <span className="font-bold text-slate-900 text-md tracking-tight">CANQURE <span className="text-[10px] text-slate-400 font-normal">PHARMA</span></span>
                            </div>

                            <nav className="flex-grow space-y-2">
                                {[
                                    { tab: 'orders', label: 'Refill Requests', icon: ClipboardList },
                                    { tab: 'inventory', label: 'Drug Inventory', icon: Pill },
                                ].map((item) => {
                                    const IconComponent = item.icon;
                                    const isActive = activeTab === item.tab;
                                    return (
                                        <button
                                            key={item.tab}
                                            onClick={() => { setActiveTab(item.tab); setIsSidebarOpen(false); }}
                                            className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 relative group font-semibold text-xs border ${
                                                isActive ? 'text-slate-900 bg-slate-50 border-slate-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.02)]' : 'text-slate-500 border-transparent'
                                            }`}
                                        >
                                            <IconComponent size={16} />
                                            <span>{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all font-semibold text-xs mt-auto">
                                <LogOut size={16} />
                                <span>Logout</span>
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default PharmacyDashboard;
