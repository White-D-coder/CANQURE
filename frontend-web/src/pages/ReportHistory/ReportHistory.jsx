import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, 
    Download, 
    Search, 
    Filter, 
    Calendar, 
    ExternalLink,
    ChevronRight,
    Table as TableIcon,
    AlertCircle,
    Activity
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const ReportHistory = () => {
    const { user } = useAuth();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedReport, setSelectedReport] = useState(null);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get(`/reports/patient/${user.id}`);
                setReports(res.data.data || []); // Accessing the data wrapper from BaseController
            } catch (err) {
                console.error("Failed to fetch reports:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user?.id) fetchReports();
    }, [user?.id]);

    const filteredReports = reports.filter(report => 
        report.reportName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="container" style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
                <div>
                    <motion.h1 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ fontSize: '2rem', fontWeight: '800', margin: 0 }}
                    >
                        Medical <span style={{ color: 'var(--primary-color)' }}>Vault</span>
                    </motion.h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Access and manage your diagnostic history and OCR records.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input 
                            type="text" 
                            placeholder="Search reports..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ 
                                padding: '10px 16px 10px 40px', 
                                borderRadius: '12px', 
                                border: '1px solid #e2e8f0',
                                width: '250px'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedReport ? '1fr 400px' : '1fr', gap: '24px', transition: 'all 0.3s ease' }}>
                {/* Reports List */}
                <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <div className="animate-spin" style={{ margin: '0 auto 16px' }}>
                                <Activity size={32} color="var(--primary-color)" />
                            </div>
                            Loading your vault...
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div style={{ padding: '60px', textAlign: 'center' }}>
                            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
                            <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>No reports found</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>You haven't uploaded any medical reports yet.</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Report Name</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Upload Date</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</th>
                                    <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredReports.map((report) => (
                                    <motion.tr 
                                        key={report.reportId}
                                        whileHover={{ background: 'rgba(2, 132, 199, 0.02)' }}
                                        onClick={() => setSelectedReport(report)}
                                        style={{ 
                                            borderBottom: '1px solid #f1f5f9', 
                                            cursor: 'pointer',
                                            background: selectedReport?.reportId === report.reportId ? 'rgba(2, 132, 199, 0.05)' : 'transparent'
                                        }}
                                    >
                                        <td style={{ padding: '20px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <FileText size={20} />
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{report.reportName}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '20px 24px', color: 'var(--text-secondary)' }}>
                                            {formatDate(report.date)}
                                        </td>
                                        <td style={{ padding: '20px 24px' }}>
                                            <span style={{ 
                                                padding: '4px 12px', 
                                                borderRadius: '20px', 
                                                fontSize: '0.75rem', 
                                                fontWeight: '700',
                                                background: report.status === 'PROCESSED' ? '#ecfdf5' : '#fef2f2',
                                                color: report.status === 'PROCESSED' ? '#10b981' : '#ef4444'
                                            }}>
                                                {report.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <ChevronRight size={20} color="#cbd5e1" />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Report Detail Sidebar */}
                <AnimatePresence>
                    {selectedReport && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="card"
                            style={{ height: 'fit-content', padding: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <h3 style={{ fontWeight: '700', fontSize: '1.2rem', margin: 0 }}>Report Details</h3>
                                <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: '#94a3b8' }}>✕</button>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Original File</label>
                                <a 
                                    href={selectedReport.reportUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '8px', 
                                        padding: '12px', 
                                        background: '#f8fafc', 
                                        borderRadius: '12px', 
                                        marginTop: '8px',
                                        fontSize: '0.9rem',
                                        color: 'var(--primary-color)'
                                    }}
                                >
                                    <ExternalLink size={16} /> View in Google Drive
                                </a>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Extracted Medicines</label>
                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {selectedReport.extractedMedicines && Array.isArray(selectedReport.extractedMedicines) ? (
                                        selectedReport.extractedMedicines.map((med, idx) => (
                                            <div key={idx} style={{ padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                                <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{med.name}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                    {med.dosage} • {med.frequency}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                            No structured data available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ReportHistory;
