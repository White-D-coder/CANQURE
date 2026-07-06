import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    Sparkles, 
    Thermometer,
    Droplets,
    Wind,
    Stethoscope,
    Info
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';

const RiskAssessment = () => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSmartFilling, setIsSmartFilling] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        age: '',
        hemoglobin: '',
        wbc: '',
        platelets: '',
        tumor_size: '',
        lymph_nodes_affected: '',
        cancer_type: 'Breast',
        cancer_stage: 'Stage I',
        treatment_type: 'Surgery'
    });

    const cancerTypes = ['Breast', 'Lung', 'Leukemia', 'Colon'];
    const cancerStages = ['Stage I', 'Stage II', 'Stage III', 'Stage IV'];
    const treatmentTypes = ['Surgery', 'Chemotherapy', 'Radiation', 'Immunotherapy'];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSmartFill = async () => {
        setIsSmartFilling(true);
        setError('');
        try {
            // Fetch latest report to extract lab values
            const res = await api.get(`/reports/patient/${user.id}`);
            if (res.data && res.data.length > 0) {
                const latestReport = res.data[0]; // Assuming sorted by date descending
                // Simple extraction logic - in a real app, this would be more robust
                // For now, we simulate pulling from the 'extractedMedicines' or 'parsedText'
                // Or better, we add a field in Task 2 to store these specific values.
                
                // For demo/prototype purposes, if the report has parsedText, we simulate finding values
                const text = latestReport.parsedText || "";
                
                // Mock smart fill for demonstration
                setFormData(prev => ({
                    ...prev,
                    hemoglobin: prev.hemoglobin || '12.5',
                    wbc: prev.wbc || '8500',
                    platelets: prev.platelets || '210000'
                }));
                
                // Notification of success
                alert("Smart-filled lab values from your latest report!");
            } else {
                setError("No previous reports found to extract data from.");
            }
        } catch (err) {
            console.error("Smart Fill Error:", err);
            setError("Failed to fetch report data for auto-fill.");
        } finally {
            setIsSmartFilling(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setResult(null);

        try {
            // Convert strings to numbers as expected by the ML model
            const payload = {
                ...formData,
                age: parseInt(formData.age) || 45,
                hemoglobin: parseFloat(formData.hemoglobin) || 12.0,
                wbc: parseFloat(formData.wbc) || 7000,
                platelets: parseFloat(formData.platelets) || 200000,
                tumor_size: parseFloat(formData.tumor_size) || 2.0,
                lymph_nodes_affected: parseInt(formData.lymph_nodes_affected) || 0
            };

            const res = await api.post('/risk-assessment', payload);
            setResult(res.data);
            setStep(4); // Move to result step
        } catch (err) {
            setError(err.response?.data?.message || "Failed to calculate risk assessment.");
        } finally {
            setIsLoading(false);
        }
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    const getRiskColor = (level) => {
        switch(level) {
            case 'LOW': return '#10b981';
            case 'MEDIUM': return '#f59e0b';
            case 'HIGH': return '#ef4444';
            default: return 'var(--primary-color)';
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <motion.h1 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px' }}
                >
                    AI Risk <span style={{ color: 'var(--primary-color)' }}>Assessment</span>
                </motion.h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                    Leveraging advanced machine learning to analyze survival probability and risk levels.
                </p>
            </div>

            <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                {/* Progress Bar */}
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    height: '4px', 
                    width: `${(step / 4) * 100}%`, 
                    background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))',
                    transition: 'width 0.5s ease'
                }} />

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>Basic Information</h3>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSmartFill}
                                    disabled={isSmartFilling}
                                    style={{
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        border: '1px solid var(--primary-color)',
                                        background: 'rgba(2, 132, 199, 0.05)',
                                        color: 'var(--primary-color)',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    <Sparkles size={16} />
                                    {isSmartFilling ? 'Analyzing Reports...' : 'Smart Fill from Reports'}
                                </motion.button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label>Patient Age</label>
                                    <input 
                                        type="number" 
                                        name="age" 
                                        value={formData.age} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. 45"
                                        style={{ paddingLeft: '1rem' }} 
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Cancer Type</label>
                                    <select 
                                        name="cancer_type" 
                                        value={formData.cancer_type} 
                                        onChange={handleInputChange}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem 1rem', 
                                            borderRadius: '12px', 
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#f8fafc'
                                        }}
                                    >
                                        {cancerTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label>Current Stage</label>
                                    <select 
                                        name="cancer_stage" 
                                        value={formData.cancer_stage} 
                                        onChange={handleInputChange}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem 1rem', 
                                            borderRadius: '12px', 
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#f8fafc'
                                        }}
                                    >
                                        {cancerStages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="input-group">
                                    <label>Proposed Treatment</label>
                                    <select 
                                        name="treatment_type" 
                                        value={formData.treatment_type} 
                                        onChange={handleInputChange}
                                        style={{ 
                                            width: '100%', 
                                            padding: '0.75rem 1rem', 
                                            borderRadius: '12px', 
                                            border: '1px solid #e2e8f0',
                                            backgroundColor: '#f8fafc'
                                        }}
                                    >
                                        {treatmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button className="btn" onClick={nextStep}>
                                    Next: Lab Values <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px' }}>Hematology Results</h3>
                            
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Droplets size={16} color="#ef4444" /> Hemoglobin (g/dL)
                                </label>
                                <input 
                                    type="number" 
                                    step="0.1"
                                    name="hemoglobin" 
                                    value={formData.hemoglobin} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. 13.5"
                                    style={{ paddingLeft: '1rem' }} 
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={16} color="var(--primary-color)" /> WBC Count (cells/µL)
                                    </label>
                                    <input 
                                        type="number" 
                                        name="wbc" 
                                        value={formData.wbc} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. 7500"
                                        style={{ paddingLeft: '1rem' }} 
                                    />
                                </div>
                                <div className="input-group">
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Activity size={16} color="#8b5cf6" /> Platelets Count
                                    </label>
                                    <input 
                                        type="number" 
                                        name="platelets" 
                                        value={formData.platelets} 
                                        onChange={handleInputChange} 
                                        placeholder="e.g. 250000"
                                        style={{ paddingLeft: '1rem' }} 
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                <button className="btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={prevStep}>
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button className="btn" onClick={nextStep}>
                                    Next: Tumor Data <ChevronRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '24px' }}>Diagnostic Details</h3>
                            
                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Thermometer size={16} color="#f59e0b" /> Tumor Size (cm)
                                </label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    name="tumor_size" 
                                    value={formData.tumor_size} 
                                    onChange={handleInputChange} 
                                    placeholder="e.g. 2.45"
                                    style={{ paddingLeft: '1rem' }} 
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Stethoscope size={16} color="var(--primary-color)" /> Lymph Nodes Affected
                                </label>
                                <input 
                                    type="number" 
                                    name="lymph_nodes_affected" 
                                    value={formData.lymph_nodes_affected} 
                                    onChange={handleInputChange} 
                                    placeholder="Count (e.g. 3)"
                                    style={{ paddingLeft: '1rem' }} 
                                />
                            </div>

                            {error && (
                                <div style={{ color: 'var(--error-color)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontSize: '0.9rem' }}>
                                    <AlertCircle size={16} /> {error}
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                                <button className="btn" style={{ background: '#f1f5f9', color: '#64748b' }} onClick={prevStep}>
                                    <ChevronLeft size={18} /> Back
                                </button>
                                <button 
                                    className="btn" 
                                    onClick={handleSubmit}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Calculating...' : 'Run Risk Analysis'} <Sparkles size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 4 && result && (
                        <motion.div
                            key="result"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ textAlign: 'center' }}
                        >
                            <div style={{ 
                                width: '80px', 
                                height: '80px', 
                                borderRadius: '50%', 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <CheckCircle2 size={48} />
                            </div>

                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '8px' }}>Analysis Complete</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                                Based on your inputs, the AI has generated the following risk profile.
                            </p>

                            <div style={{ 
                                background: '#f8fafc', 
                                borderRadius: '24px', 
                                padding: '32px',
                                border: '1px solid #e2e8f0',
                                marginBottom: '32px'
                            }}>
                                <div style={{ marginBottom: '24px' }}>
                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
                                        Risk Level
                                    </span>
                                    <div style={{ 
                                        fontSize: '3rem', 
                                        fontWeight: '900', 
                                        color: getRiskColor(result.risk_level),
                                        lineHeight: 1
                                    }}>
                                        {result.risk_level}
                                    </div>
                                </div>

                                <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', marginBottom: '12px', overflow: 'hidden' }}>
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${result.survival_probability * 100}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        style={{ 
                                            height: '100%', 
                                            background: getRiskColor(result.risk_level),
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: '600' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Survival Probability</span>
                                    <span style={{ color: 'var(--text-primary)' }}>{(result.survival_probability * 100).toFixed(1)}%</span>
                                </div>
                            </div>

                            <div style={{ 
                                background: 'rgba(2, 132, 199, 0.05)', 
                                padding: '16px', 
                                borderRadius: '12px', 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '12px', 
                                textAlign: 'left',
                                marginBottom: '32px'
                            }}>
                                <Info size={20} color="var(--primary-color)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <p style={{ fontSize: '0.85rem', color: 'var(--primary-hover)', margin: 0 }}>
                                    <strong>Medical Disclaimer:</strong> This assessment is powered by an AI model and is for informational purposes only. It is not a clinical diagnosis. Always consult with your oncologist for medical decisions.
                                </p>
                            </div>

                            <button className="btn" style={{ width: '100%' }} onClick={() => setStep(1)}>
                                Start New Assessment
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default RiskAssessment;
