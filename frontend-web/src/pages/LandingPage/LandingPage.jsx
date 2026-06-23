import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Shield, Users, ArrowRight, Heart, Stethoscope, Award, 
    Clock, Menu, X, Phone, Star, HeartPulse, Sparkles, Calendar
} from 'lucide-react';

const LandingPage = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const services = [
        { title: "Medical Oncology", desc: "Advanced cancer treatment and chemotherapy", color: "text-[#0a9396] bg-[#0a9396]/10", icon: Stethoscope },
        { title: "Surgical Oncology", desc: "Expert surgical care and procedures", color: "text-[#005f73] bg-[#005f73]/10", icon: Award },
        { title: "Radiation Therapy", desc: "Precise radiation treatment technology", color: "text-[#9b5de5] bg-[#9b5de5]/10", icon: Sparkles },
        { title: "Immunotherapy", desc: "Advanced immune-based treatment", color: "text-[#ca5c54] bg-[#ca5c54]/10", icon: Heart },
        { title: "Diagnostics", desc: "Advanced diagnostic and imaging services", color: "text-[#008080] bg-[#008080]/10", icon: Activity },
        { title: "Pain Management", desc: "Comprehensive pain management care", color: "text-[#2b4c7e] bg-[#2b4c7e]/10", icon: Shield },
        { title: "Palliative Care", desc: "Compassionate end-of-life care and support", color: "text-[#c71585] bg-[#c71585]/10", icon: HeartPulse },
        { title: "Rehabilitation", desc: "Physical therapy and rehabilitation programs", color: "text-[#20b2aa] bg-[#20b2aa]/10", icon: Users }
    ];

    const journeySteps = [
        { step: "01", title: "Consultation", desc: "Discuss your concerns with our experts" },
        { step: "02", title: "Diagnosis", desc: "Accurate diagnosis and personalized assessment" },
        { step: "03", title: "Treatment Plan", desc: "Customized treatment plan for you" },
        { step: "04", title: "Treatment", desc: "Advanced treatment with constant care and support" },
        { step: "05", title: "Recovery & Beyond", desc: "Ongoing support for a better quality of life" }
    ];

    const testimonials = [
        { name: "Rajesh M.", text: "The care and support I received at CanCure was exceptional. The doctors and staff are highly professional and compassionate.", rating: 5 },
        { name: "Priya S.", text: "CanCure provided me with the best treatment and support throughout my journey. Highly recommended!", rating: 5 },
        { name: "Amit K.", text: "The facilities are excellent and the staff is very caring. Thank you CanCure for giving me a new hope.", rating: 5 }
    ];

    return (
        <div className="min-h-screen flex flex-col font-['Plus_Jakarta_Sans'] bg-slate-50/30">
            {/* Nav Header */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled 
                    ? "bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm py-3" 
                    : "bg-transparent py-5"
            }`}>
                <div className="container mx-auto px-6 flex justify-between items-center">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="bg-[#005f73]/10 p-2 rounded-xl">
                            <Activity className="w-6 h-6 text-[#005f73]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black text-[#005f73] tracking-tight leading-none">
                                CanCure
                            </span>
                            <span className="text-[9px] text-[#0a9396] font-bold tracking-wider uppercase mt-0.5">
                                Care. Connect. Conquer.
                            </span>
                        </div>
                    </div>

                    {/* Nav Links */}
                    <div className="hidden lg:flex items-center gap-8">
                        <a href="#home" className="text-slate-600 hover:text-[#005f73] font-semibold text-sm transition-colors">Home</a>
                        <a href="#services" className="text-slate-600 hover:text-[#005f73] font-semibold text-sm transition-colors">Services</a>
                        <a href="#journey" className="text-slate-600 hover:text-[#005f73] font-semibold text-sm transition-colors">For Patients</a>
                        <a href="#doctors" className="text-slate-600 hover:text-[#005f73] font-semibold text-sm transition-colors">For Doctors</a>
                        <a href="#testimonials" className="text-slate-600 hover:text-[#005f73] font-semibold text-sm transition-colors">About Us</a>
                    </div>

                    {/* Contact & CTA */}
                    <div className="hidden lg:flex items-center gap-6">
                        <a href="tel:+919876543210" className="flex items-center gap-2 text-slate-700 font-bold text-sm hover:text-[#005f73] transition-colors">
                            <Phone className="w-4 h-4 text-[#0a9396]" />
                            +91 98765 43210
                        </a>
                        <Link
                            to="/login"
                            className="px-4 py-2 text-slate-600 hover:text-[#005f73] font-semibold text-sm transition-colors"
                        >
                            Login
                        </Link>
                        <Link
                            to="/signup"
                            className="px-5 py-2.5 bg-[#005f73] hover:bg-[#004b5c] text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-[#005f73]/20"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile menu trigger */}
                    <button
                        className="lg:hidden p-2 text-slate-600 hover:text-[#005f73] transition-colors"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="lg:hidden bg-white border-b border-slate-100 overflow-hidden"
                        >
                            <div className="container mx-auto px-6 py-4 flex flex-col gap-4">
                                <a href="#home" className="text-slate-600 hover:text-[#005f73] font-semibold py-2" onClick={() => setIsOpen(false)}>Home</a>
                                <a href="#services" className="text-slate-600 hover:text-[#005f73] font-semibold py-2" onClick={() => setIsOpen(false)}>Services</a>
                                <a href="#journey" className="text-slate-600 hover:text-[#005f73] font-semibold py-2" onClick={() => setIsOpen(false)}>For Patients</a>
                                <a href="#doctors" className="text-slate-600 hover:text-[#005f73] font-semibold py-2" onClick={() => setIsOpen(false)}>For Doctors</a>
                                <a href="#testimonials" className="text-slate-600 hover:text-[#005f73] font-semibold py-2" onClick={() => setIsOpen(false)}>About Us</a>
                                <hr className="border-slate-100" />
                                <a href="tel:+919876543210" className="flex items-center gap-2 text-slate-700 font-bold py-2">
                                    <Phone className="w-4 h-4 text-[#0a9396]" />
                                    +91 98765 43210
                                </a>
                                <div className="flex gap-4 pt-2">
                                    <Link to="/login" className="flex-1 text-center py-2.5 border border-slate-200 text-slate-700 rounded-xl font-bold text-sm">
                                        Login
                                    </Link>
                                    <Link to="/signup" className="flex-1 text-center py-2.5 bg-[#005f73] text-white rounded-xl font-bold text-sm">
                                        Get Started
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Hero Section */}
            <header id="home" className="relative pt-32 md:pt-40 pb-24 overflow-hidden bg-gradient-to-b from-[#005f73]/5 via-white to-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Hero Text */}
                        <div className="lg:col-span-7 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#9b5de5]/10 text-[#9b5de5] font-bold text-xs border border-[#9b5de5]/20 uppercase tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Comprehensive Cancer Care
                            </div>
                            
                            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] max-w-xl">
                                Compassionate Care. <br/>
                                Advanced Treatment. <br/>
                                <span className="bg-gradient-to-r from-[#005f73] to-[#0a9396] bg-clip-text text-transparent">
                                    Better Outcomes.
                                </span>
                            </h1>

                            <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-xl">
                                CanCure is your trusted partner in cancer care. We provide comprehensive support, advanced treatment options, and personalized care for patients and their families.
                            </p>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <Link
                                    to="/signup"
                                    className="px-6 py-3.5 bg-[#005f73] hover:bg-[#004b5c] text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-[#005f73]/20 hover:-translate-y-0.5 flex items-center gap-2"
                                >
                                    <Calendar className="w-4 h-4" /> Book Appointment
                                </Link>
                                <a
                                    href="#services"
                                    className="px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 flex items-center gap-2 shadow-sm"
                                >
                                    Explore Services <ArrowRight className="w-4 h-4 text-[#0a9396]" />
                                </a>
                            </div>

                            {/* Trust Badge */}
                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 max-w-md">
                                <div className="flex -space-x-3">
                                    <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="Patient 1" />
                                    <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="Patient 2" />
                                    <img className="w-9 h-9 rounded-full border-2 border-white object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" alt="Patient 3" />
                                </div>
                                <div>
                                    <div className="text-sm font-black text-slate-800">5000+</div>
                                    <div className="text-[11px] text-slate-500 font-semibold">Patients Trust Us</div>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image Block */}
                        <div className="lg:col-span-5 relative flex items-center justify-center py-8">
                            {/* Decorative background blob */}
                            <div 
                                className="absolute w-[112%] h-[112%] bg-[#0a9396]/10 opacity-70 -z-10" 
                                style={{ 
                                    borderRadius: '55% 45% 68% 32% / 40% 50% 60% 50%',
                                    transform: 'rotate(-4deg)'
                                }} 
                            />
                            
                            {/* Decorative purple heart outline */}
                            <div className="absolute top-[6%] left-[46%] -z-10 text-[#6366f1] animate-bounce" style={{ animationDuration: '4s' }}>
                                <Heart className="w-9 h-9 stroke-[1.5] fill-[#6366f1]/10" />
                            </div>

                            {/* Decorative dots pattern in top right */}
                            <svg className="absolute -top-4 -right-4 w-28 h-28 text-slate-300 -z-10 opacity-75" fill="currentColor" viewBox="0 0 100 100">
                                <defs>
                                    <pattern id="dot-grid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                                        <circle cx="2" cy="2" r="2" className="text-[#0a9396]/20" fill="currentColor" />
                                    </pattern>
                                </defs>
                                <rect width="100" height="100" fill="url(#dot-grid)" />
                            </svg>

                            {/* White Asymmetric Frame Container */}
                            <div 
                                className="relative w-full max-w-[390px] md:max-w-[490px] aspect-square p-2.5 bg-white border-[6px] border-white shadow-[0_20px_50px_rgba(8,112,117,0.15)] transition-all duration-500 hover:shadow-[0_30px_60px_rgba(8,112,117,0.22)]"
                                style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
                            >
                                <img 
                                    src="/hero_doctors_patient.png" 
                                    alt="CanCure Specialists"
                                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                                    style={{ borderRadius: 'inherit' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Expertise Core Pillars Row */}
            <section className="bg-white border-y border-slate-100 py-10">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: "Expert Doctors", desc: "Experienced oncologists and specialists", icon: Stethoscope, color: "text-[#005f73]" },
                            { title: "Advanced Technology", desc: "State-of-the-art equipment and facilities", icon: Activity, color: "text-[#0a9396]" },
                            { title: "Personalized Care", desc: "Tailored treatment for every patient", icon: HeartPulse, color: "text-[#9b5de5]" },
                            { title: "Patient Support", desc: "24/7 support for patients and families", icon: Users, color: "text-[#ca5c54]" }
                        ].map((pillar, idx) => (
                            <div key={idx} className="flex gap-4">
                                <div className={`w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center shrink-0 ${pillar.color}`}>
                                    <pillar.icon className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-bold text-slate-900 text-sm">{pillar.title}</h4>
                                    <p className="text-xs text-slate-500 font-medium leading-normal">{pillar.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Services Under One Roof Section */}
            <section id="services" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                        {/* Heading & Image Left */}
                        <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-28">
                            <div className="space-y-3">
                                <p className="text-[#0a9396] font-bold text-xs uppercase tracking-wider">Our Services</p>
                                <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                                    Comprehensive Care <br/>
                                    Under <span className="text-[#005f73]">One Roof</span>
                                </h2>
                            </div>
                            <div className="rounded-3xl border border-slate-100 shadow-sm overflow-hidden bg-slate-50 p-4 max-w-sm">
                                <img 
                                    src="/doctor_consultation_vector.png" 
                                    alt="Medical consult"
                                    className="w-full object-contain"
                                />
                            </div>
                        </div>

                        {/* Services Grid Right */}
                        <div className="lg:col-span-7 space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {services.map((srv, idx) => (
                                    <div key={idx} className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-slate-200 transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.02)] space-y-4 group">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${srv.color} transition-transform duration-300 group-hover:scale-105`}>
                                            <srv.icon className="w-5 h-5" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-bold text-slate-800 text-base">{srv.title}</h3>
                                            <p className="text-xs text-slate-500 font-medium leading-relaxed">{srv.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-2 text-center md:text-left">
                                <Link
                                    to="/signup"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#005f73] hover:bg-[#004b5c] text-white rounded-xl font-bold text-sm transition-all"
                                >
                                    View All Services <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Care Journey Steps Section */}
            <section id="journey" className="py-24 bg-slate-50/50 border-y border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
                        <p className="text-[#0a9396] font-bold text-xs uppercase tracking-wider">Your Care Journey</p>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            We're With You Every Step of the Way
                        </h2>
                    </div>

                    {/* Timeline Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 max-w-6xl mx-auto relative">
                        {journeySteps.map((step, idx) => (
                            <div key={idx} className="relative space-y-4 text-center md:text-left">
                                {/* Connection indicator dotted line */}
                                {idx < 4 && (
                                    <div className="hidden md:block absolute top-6 left-[60%] right-[-40%] h-0.5 border-t-2 border-dashed border-slate-200" />
                                )}

                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-white border-2 border-slate-100 text-[#005f73] font-bold text-sm flex items-center justify-center shadow-sm">
                                        {step.step}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <h4 className="font-bold text-slate-800 text-sm">{step.title}</h4>
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Statistics Banner */}
            <section className="bg-[#005f73] py-16 text-white">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-8 text-center divide-x divide-white/10">
                        {[
                            { num: "5000+", label: "Patients Treated" },
                            { num: "15+", label: "Years of Experience" },
                            { num: "50+", label: "Expert Doctors" },
                            { num: "10+", label: "Specialized Centers" },
                            { num: "98%", label: "Patient Satisfaction" }
                        ].map((stat, idx) => (
                            <div key={idx} className="space-y-2 first:divide-none">
                                <div className="text-3xl md:text-4xl font-black">{stat.num}</div>
                                <div className="text-[10px] md:text-xs text-slate-300 font-bold uppercase tracking-wider">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Doctors / Specialists Section (KEEP CARDS EXACTLY AS-IS) */}
            <section id="doctors" className="py-24 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-[#0a9396] font-bold text-xs uppercase tracking-wider mb-3">Our Specialists</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Expert Doctors</h2>
                        <p className="text-sm md:text-base text-gray-600 max-w-xl mx-auto font-medium">
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

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 bg-slate-50/50 border-t border-slate-100">
                <div className="container mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto space-y-4 mb-16">
                        <p className="text-[#0a9396] font-bold text-xs uppercase tracking-wider">Patient Stories</p>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                            What Our Patients Say
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {testimonials.map((test, idx) => (
                            <div key={idx} className="p-8 bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.01)] flex flex-col justify-between">
                                <div className="space-y-4">
                                    {/* Stars */}
                                    <div className="flex gap-1 text-amber-400">
                                        {[...Array(test.rating)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">
                                        "{test.text}"
                                    </p>
                                </div>
                                <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                                    <span className="font-bold text-slate-800 text-sm">- {test.name}</span>
                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">Verified Patient</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-400 py-16 mt-auto">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-4 md:col-span-2">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/10 p-2 rounded-xl text-white">
                                    <Activity className="w-5 h-5" />
                                </div>
                                <span className="text-lg font-black text-white">CanCure</span>
                            </div>
                            <p className="text-xs leading-relaxed text-slate-400 max-w-xs">
                                Connecting cancer patients with top specialists, secure digital vault records, and emergency trauma routing. Proactive support for a better life.
                            </p>
                        </div>

                        {/* Fast Links */}
                        <div className="space-y-4">
                            <h4 className="text-white font-bold text-sm">Services</h4>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold">
                                <a href="#services" className="hover:text-white transition-colors">Oncology ER</a>
                                <a href="#services" className="hover:text-white transition-colors">Radiation Speciality</a>
                                <a href="#services" className="hover:text-white transition-colors">Diagnostics & Labs</a>
                            </div>
                        </div>

                        {/* Auth Link Actions */}
                        <div className="space-y-4">
                            <h4 className="text-white font-bold text-sm">Portals</h4>
                            <div className="flex flex-col gap-2.5 text-xs font-semibold">
                                <Link to="/login" className="hover:text-white transition-colors">Doctor Portal</Link>
                                <Link to="/login" className="hover:text-white transition-colors">Hospital Portal</Link>
                                <Link to="/login" className="hover:text-white transition-colors">Patient Account</Link>
                            </div>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-semibold">
                        <span>© {new Date().getFullYear()} CanCure. All rights reserved.</span>
                        <div className="flex gap-6">
                            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
