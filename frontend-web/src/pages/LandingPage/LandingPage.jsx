import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Users, ArrowRight, Heart, Stethoscope, Award, Clock, Menu, X } from 'lucide-react';

const LandingPage = () => {
    const [isOpen, setIsOpen] = useState(false);

    const doctors = [
        {
            id: 1,
            name: "Dr. Sarah Johnson",
            specialization: "Senior Oncologist",
            experience: "15+ Years Experience",
            image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop"
        },
        {
            id: 2,
            name: "Dr. Michael Chen",
            specialization: "Radiation Specialist",
            experience: "12+ Years Experience",
            image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop"
        },
        {
            id: 3,
            name: "Dr. Emily Williams",
            specialization: "Hematologist",
            experience: "18+ Years Experience",
            image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=2070&auto=format&fit=crop"
        }
    ];

    return (
        <div className="min-h-screen flex flex-col font-['Plus_Jakarta_Sans']">
            <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-50 p-2 rounded-lg">
                            <Activity className="w-6 h-6 text-primary-600" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                            CANQURE
                        </span>
                    </div>

                    <button
                        className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#home" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Home</a>
                        <a href="#doctors" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Specialists</a>
                        <a href="#features" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">Features</a>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-gray-600 hover:text-primary-600 font-medium transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/40"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="md:hidden bg-white border-b border-gray-100 overflow-hidden"
                        >
                            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
                                <a
                                    href="#home"
                                    className="text-gray-600 hover:text-primary-600 font-medium py-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Home
                                </a>
                                <a
                                    href="#doctors"
                                    className="text-gray-600 hover:text-primary-600 font-medium py-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Specialists
                                </a>
                                <a
                                    href="#features"
                                    className="text-gray-600 hover:text-primary-600 font-medium py-2"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Features
                                </a>
                                <hr className="border-gray-100" />
                                <Link
                                    to="/login"
                                    className="text-gray-600 hover:text-primary-600 font-medium py-2"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/signup"
                                    className="bg-primary-600 text-white text-center py-3 rounded-xl font-medium shadow-lg shadow-primary-500/30"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            <header id="home" className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50 via-white to-white" />

                <div className="container mx-auto px-6 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center max-w-4xl mx-auto"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-medium text-sm mb-8 border border-primary-100">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                            </span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 tracking-tight leading-tight">
                            Find the Right Cure <br />
                            <span className="bg-gradient-to-r from-primary-600 to-sky-400 bg-clip-text text-transparent">
                                & Right Doctor
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Your comprehensive platform to discover proper treatment options, connect with specialized oncologists, and securely maintain your medical history and reports in one place.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <Link
                                to="/signup"
                                className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-lg transition-all shadow-xl shadow-primary-500/30 hover:shadow-primary-500/40 hover:-translate-y-1 flex items-center gap-2 group"
                            >
                                Start Your Journey
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/login"
                                className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-semibold text-lg transition-all hover:-translate-y-1 shadow-sm hover:shadow-md"
                            >
                                Doctor Login
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </header>

            <section id="doctors" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Top Specialists</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Connect with world-class oncologists and specialists dedicated to providing the best care possible.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {doctors.map((doctor, index) => (
                            <motion.div
                                key={doctor.id}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="group relative h-[400px] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300"
                            >
                                <img
                                    src={doctor.image}
                                    alt={doctor.name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                        <h3 className="text-2xl font-bold text-white mb-1">{doctor.name}</h3>
                                        <p className="text-primary-300 font-medium mb-3">{doctor.specialization}</p>

                                        <div className="flex items-center gap-2 text-gray-300 text-sm bg-white/10 backdrop-blur-sm py-2 px-3 rounded-lg w-fit">
                                            <Clock className="w-4 h-4" />
                                            <span>{doctor.experience}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg transition-opacity duration-300 group-hover:opacity-0">
                                    <h3 className="text-lg font-bold text-gray-900">{doctor.name}</h3>
                                    <p className="text-primary-600 text-sm">{doctor.specialization}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="features" className="py-24 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose CAN-QURE?</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            We combine advanced technology with compassionate care to provide a comprehensive solution for cancer management.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Activity className="w-8 h-8 text-primary-600" />}
                            title="Find Proper Treatment"
                            description="Discover the best hospitals and doctors for your specific needs. Get guidance on where to get the right care."
                            delay={0.1}
                        />
                        <FeatureCard
                            icon={<Shield className="w-8 h-8 text-primary-600" />}
                            title="Maintain Medical History"
                            description="Keep a chronologically organized digital record of your entire treatment journey, ensuring no detail is ever lost."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon={<Users className="w-8 h-8 text-primary-600" />}
                            title="Secure Report Storage"
                            description="Upload and manage all your diagnostic reports securely. Share them instantly with your doctors when needed."
                            delay={0.3}
                        />
                    </div>
                </div>
            </section>

            <footer className="bg-gray-50 py-12 mt-auto border-t border-gray-100">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" />
                            <span className="text-lg font-bold text-gray-700">CAN-QURE</span>
                        </div>
                        <div className="text-gray-500 text-sm">
                            © {new Date().getFullYear()} CAN-QURE. All rights reserved.
                        </div>
                        <div className="flex gap-6">
                            <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">Privacy</a>
                            <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">Terms</a>
                            <a href="#" className="text-gray-400 hover:text-primary-600 transition-colors">Contact</a>
                        </div>
                    </div>
                </div>
            </footer>

        </div>
    );
};

const FeatureCard = ({ icon, title, description, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="group p-8 rounded-2xl bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
    >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:bg-primary-100">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-primary-700 transition-colors">{title}</h3>
            <p className="text-gray-600 leading-relaxed">
                {description}
            </p>
        </div>
    </motion.div>
);

export default LandingPage;
