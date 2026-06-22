import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Video, 
    Mic, 
    MicOff, 
    VideoOff, 
    PhoneOff, 
    MessageSquare, 
    FileText, 
    Activity, 
    CheckCircle,
    Brain,
    AlertCircle,
    ChevronRight,
    Save,
    Users
} from 'lucide-react';
import api from '../api/axios';

const ConsultationInterface = ({ appointment, onComplete, onCancel }) => {
    const [isMicOn, setIsMicOn] = useState(true);
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isTranscribing, setIsTranscribing] = useState(true);
    const [transcript, setTranscript] = useState([]);
    const [liveText, setLiveText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [summary, setSummary] = useState(null);
    const [roadmap, setRoadmap] = useState([]);

    // Simulate Live Transcription for MVP
    useEffect(() => {
        if (isTranscribing) {
            const interval = setInterval(() => {
                const medicalPhrases = [
                    "Patient reports persistent chest pain for 3 days.",
                    "Reviewing biopsy results: confirmed stage 1 adenocarcinoma.",
                    "Starting Chemotherapy Cycle 1 next week.",
                    "Recommend low-sodium diet and increased hydration.",
                    "Prescribing medication Z, 500mg twice daily."
                ];
                const randomPhrase = medicalPhrases[Math.floor(Math.random() * medicalPhrases.length)];
                setTranscript(prev => [...prev, { sender: 'Doctor', text: randomPhrase, time: new Date().toLocaleTimeString() }]);
                
                // Sync with backend
                api.post(`/consultations/${appointment.id}/transcript`, { text: randomPhrase });
            }, 8000);
            return () => clearInterval(interval);
        }
    }, [isTranscribing, appointment.id]);

    const handleEndConsultation = async () => {
        setIsSummarizing(true);
        try {
            const res = await api.post(`/consultations/${appointment.id}/summarize`);
            setSummary(res.data.appointment.aiSummary);
            setRoadmap(res.data.appointment.patientRoadmap || []);
            // Move to summary view after a small delay
        } catch (err) {
            console.error("Summarization failed", err);
        } finally {
            setIsSummarizing(false);
        }
    };

    if (summary) {
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-4xl mx-auto shadow-2xl border border-slate-100">
                <header className="flex justify-between items-center mb-8 border-b border-slate-100 pb-6">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">Consultation Summary</h2>
                        <p className="text-slate-500">AI-generated visit summary and patient roadmap</p>
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2">
                        <CheckCircle size={20} /> Verified
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <section className="space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Brain className="text-primary-600" /> Clinical Notes
                        </h3>
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {summary}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                            <Activity className="text-amber-500" /> Patient Roadmap
                        </h3>
                        <div className="space-y-4">
                            {roadmap.map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                                        <span className="text-amber-600 font-bold">{idx + 1}</span>
                                    </div>
                                    <p className="text-slate-800 font-medium text-sm">{item}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                <div className="mt-12 flex justify-end gap-4">
                    <button onClick={onComplete} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:shadow-xl transition-all">
                        Finalize & Close Case
                    </button>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col">
            <header className="p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900">
                <div className="flex items-center gap-4 text-white">
                    <div className={`w-12 h-12 rounded-2xl ${appointment.urgencyLevel === 'EMERGENCY' ? 'bg-red-600' : 'bg-primary-600'} flex items-center justify-center font-black animate-pulse`}>
                        {appointment.user.name.charAt(0)}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-bold text-lg">{appointment.user.name}</h2>
                            {appointment.urgencyLevel === 'EMERGENCY' && (
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-tighter animate-bounce">Emergency</span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium tracking-wider uppercase">Oncology Consultation • {appointment.time}</p>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Live
                    </div>
                    <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
                        <PhoneOff size={24} />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden">
                {/* Video Area */}
                <div className="flex-1 relative bg-slate-900 p-6">
                    <div className="w-full h-full bg-slate-800 rounded-3xl relative overflow-hidden flex items-center justify-center">
                        <Users size={80} className="text-slate-700 opacity-20" />
                        <div className="absolute bottom-8 left-8 w-48 h-32 bg-slate-700 rounded-2xl border-2 border-slate-600 shadow-2xl overflow-hidden flex items-center justify-center">
                            <Video size={40} className="text-slate-600" />
                        </div>
                    </div>

                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-slate-950/80 backdrop-blur-xl p-4 rounded-3xl border border-slate-800 shadow-2xl">
                        <button onClick={() => setIsMicOn(!isMicOn)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500 text-white'}`}>
                            {isMicOn ? <Mic size={24} /> : <MicOff size={24} />}
                        </button>
                        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isVideoOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-500 text-white'}`}>
                            {isVideoOn ? <Video size={24} /> : <VideoOff size={24} />}
                        </button>
                        <div className="w-px h-8 bg-slate-800" />
                        <button onClick={handleEndConsultation} className="px-8 h-14 bg-red-600 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-red-700 transition-all shadow-lg shadow-red-900/40">
                            <PhoneOff size={20} /> End Call
                        </button>
                    </div>
                </div>

                {/* Intelligence Panel */}
                <aside className="w-[450px] border-l border-slate-800 flex flex-col bg-slate-900">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="text-white font-bold flex items-center gap-2">
                            <Brain className="text-primary-400" /> Intelligence Panel
                        </h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Transcription</p>
                            <div className="space-y-4">
                                {transcript.map((msg, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-primary-400">{msg.sender}</span>
                                            <span className="text-[10px] text-slate-500 font-bold">{msg.time}</span>
                                        </div>
                                        <div className="bg-slate-800/50 p-3 rounded-2xl border border-slate-800 text-sm text-slate-300">
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-800 bg-slate-950">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Next Action Suggestion</p>
                        <div className="bg-primary-600/10 border border-primary-500/20 p-4 rounded-2xl">
                            <p className="text-sm text-primary-300 font-bold leading-relaxed italic">
                                "The patient mentioned chemotherapy side effects. Consider updating medication plan."
                            </p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ConsultationInterface;
