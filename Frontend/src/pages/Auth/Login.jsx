import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { User, Lock, Activity, ArrowRight, AlertCircle } from 'lucide-react';

function Login() {
    const [email, setEmail] = useState('sarah.wilson@medcan.com');
    const [password, setPassword] = useState('password123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            setError("Both fields are required");
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const res = await api.post('/login', {
                identifier: email,
                password
            });

            login(res.data.token, {
                ...res.data.user,
                role: res.data.role
            });

            if (res.data.role === 'admin') {
                navigate('/admin');
            } else if (res.data.role === 'hospital_admin') {
                navigate('/hospital');
            } else if (res.data.role === 'doctor') {
                navigate('/doctors');
            } else if (res.data.role === 'pharmacy') {
                navigate('/pharmacy');
            } else {
                navigate('/dashboard');
            }

        } catch (err) {
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Login failed'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-6 sm:p-10"
                style={{ width: '100%', maxWidth: '450px' }}
            >

                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.1
                        }}
                        style={{
                            width: '64px',
                            height: '64px',
                            background:
                                'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow:
                                '0 10px 25px -5px rgba(2, 132, 199, 0.4)'
                        }}
                    >
                        <Activity size={32} color="white" />
                    </motion.div>

                    <h2
                        style={{
                            fontSize: '24px',
                            fontWeight: '700',
                            marginBottom: '8px'
                        }}
                    >
                        Welcome Back
                    </h2>

                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Sign in to access the medical portal
                    </p>
                </div>


                {error && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            color: '#ef4444',
                            padding: '12px',
                            borderRadius: '8px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '0.9rem'
                        }}
                    >
                        <AlertCircle size={18} />
                        {error}
                    </motion.div>
                )}


                <form onSubmit={handleLogin}>

                    <div className="input-group">
                        <label>Email or Username</label>

                        <div style={{ position: 'relative' }}>
                            <User
                                size={20}
                                className="input-icon"
                                style={{
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Enter your email or username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>


                    <div className="input-group">
                        <label>Password</label>

                        <div style={{ position: 'relative' }}>
                            <Lock
                                size={20}
                                className="input-icon"
                                style={{
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>


                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="btn"
                        style={{ width: '100%', marginTop: '8px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            'Signing in...'
                        ) : (
                            <>
                                Sign In <ArrowRight size={18} />
                            </>
                        )}
                    </motion.button>
                </form>

                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #f3f4f6' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', textAlign: 'center', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Demo Access</p>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                        <button
                            onClick={() => { setEmail('admin@canqure.com'); setPassword('admin123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            Admin
                        </button>
                        <button
                            onClick={() => { setEmail('patient@canqure.com'); setPassword('patient123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            Patient
                        </button>
                        <button
                            onClick={() => { setEmail('hospital@canqure.com'); setPassword('hospital123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            Hospital
                        </button>
                        <button
                            onClick={() => { setEmail('sarah.wilson@medcan.com'); setPassword('password123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.7rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '500' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            Doctor
                        </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginTop: '6px' }}>
                        <button
                            onClick={() => { setEmail('apollo@canqure.com'); setPassword('apollo123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.65rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            Apollo Pharma
                        </button>
                        <button
                            onClick={() => { setEmail('medplus@canqure.com'); setPassword('medplus123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.65rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            MedPlus Pharma
                        </button>
                        <button
                            onClick={() => { setEmail('fortis@canqure.com'); setPassword('fortis123'); }}
                            style={{ padding: '8px 2px', fontSize: '0.65rem', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#f9fafb', cursor: 'pointer', transition: 'all 0.2s', fontWeight: '600' }}
                            onMouseOver={(e) => { e.target.style.background = '#eff6ff'; e.target.style.borderColor = '#bfdbfe'; }}
                            onMouseOut={(e) => { e.target.style.background = '#f9fafb'; e.target.style.borderColor = '#e5e7eb'; }}
                        >
                            Fortis Pharma
                        </button>
                    </div>

                </div>


                <p
                    style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem'
                    }}
                >
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ fontWeight: '600' }}>
                        Create Account
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Login;
