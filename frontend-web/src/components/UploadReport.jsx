import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, File, X, AlertCircle, FileText, Camera } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../contexts/AuthContext';

const UploadReport = ({ onUploadSuccess }) => {
    const { user } = useAuth();
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (selectedFile.size > 5 * 1024 * 1024) {
                setError("File size exceeds 5MB limit.");
                return;
            }
            setFile(selectedFile);
            setError('');
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            setFile(droppedFile);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        setError('');
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('report', file);
            formData.append('userId', user?.id || '');
            formData.append('reportName', file.name);

            setProgress(40);
            const res = await api.post('/reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setProgress(100);
            setTimeout(() => {
                onUploadSuccess?.(res.data);
                setFile(null);
                setIsUploading(false);
            }, 500);

        } catch (err) {
            console.error("Upload error:", err);
            setError(err.response?.data?.message || "Failed to upload and process report.");
            setIsUploading(false);
        }
    };

    return (
        <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} color="var(--primary-color)" /> Upload Medical Report
            </h3>

            {/* Mobile Dual Option: Camera vs File Browser */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <label 
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '14px',
                        background: '#0f172a',
                        color: '#ffffff',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        minHeight: '48px'
                    }}
                >
                    <Camera size={20} />
                    <span>Scan with Camera</span>
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        onChange={handleFileSelect} 
                        style={{ display: 'none' }}
                    />
                </label>

                <label 
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '14px',
                        background: '#f1f5f9',
                        color: '#334155',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.85rem',
                        minHeight: '48px',
                        border: '1px solid #cbd5e1'
                    }}
                >
                    <Upload size={20} />
                    <span>Choose File</span>
                    <input 
                        type="file" 
                        accept=".pdf,image/*" 
                        onChange={handleFileSelect} 
                        style={{ display: 'none' }}
                    />
                </label>
            </div>

            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragging ? 'var(--primary-color)' : '#e2e8f0'}`,
                    borderRadius: '16px',
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: isDragging ? 'rgba(2, 132, 199, 0.05)' : '#f8fafc',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                }}
            >
                <AnimatePresence mode="wait">
                    {!file ? (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: '0 0 4px' }}>
                                Drag report file here
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Supported formats: PDF, PNG, JPG (Max 5MB)
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="selected"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <File size={20} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <p style={{ fontWeight: '600', margin: 0, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: 'none', color: '#94a3b8', minWidth: '44px', minHeight: '44px' }}>
                                <X size={20} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {error && (
                <div style={{ marginTop: '16px', color: 'var(--error-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <AlertCircle size={14} /> {error}
                </div>
            )}

            {file && !isUploading && (
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="btn"
                    onClick={handleUpload}
                    style={{ width: '100%', marginTop: '16px', minHeight: '48px', fontWeight: '700' }}
                >
                    Process Report with AI
                </motion.button>
            )}

            {isUploading && (
                <div style={{ marginTop: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '600', color: 'var(--primary-color)' }}>AI Analysis in Progress...</span>
                        <span>{progress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <motion.div 
                            style={{ height: '100%', background: 'var(--primary-color)', width: `${progress}%` }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadReport;
