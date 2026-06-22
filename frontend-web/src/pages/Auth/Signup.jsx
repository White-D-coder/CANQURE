import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/axios';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Activity, ArrowRight, AlertCircle } from 'lucide-react';

const Signup = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post('/signup', {
                username,
                email,
                password
            });

            login(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (err) {
            console.error("Signup Error:", err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.message ||
                'Signup failed. Please try again.'
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
                        Create Account
                    </h2>

                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                        Join our medical platform today
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


                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label>Username</label>
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
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                placeholder="Choose a username"
                            />
                        </div>
                    </div>


                    <div className="input-group">
                        <label>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail
                                size={20}
                                className="input-icon"
                                style={{
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                }}
                            />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Create a strong password"
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
                            'Creating Account...'
                        ) : (
                            <>
                                Sign Up <ArrowRight size={18} />
                            </>
                        )}
                    </motion.button>
                </form>


                <p
                    style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        color: 'var(--text-secondary)',
                        fontSize: '0.95rem'
                    }}
                >
                    Already have an account?{' '}
                    <Link to="/login" style={{ fontWeight: '600' }}>
                        Sign In
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
