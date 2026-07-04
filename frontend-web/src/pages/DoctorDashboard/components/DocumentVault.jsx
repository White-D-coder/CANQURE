import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileHeart, FileText, Search, ExternalLink, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../../api/axios';

const fetchPatientDocuments = async ({ queryKey }) => {
    const [_, patientId] = queryKey;
    const res = await api.get(`/doctor/patient/${patientId}/documents`);
    return res.data;
};

const DocumentVault = ({ patientId }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedDocId, setExpandedDocId] = useState(null);

    const { data: documents, isLoading, error } = useQuery({
        queryKey: ['patientDocuments', patientId],
        queryFn: fetchPatientDocuments,
        enabled: !!patientId
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200/80 p-7 flex justify-center items-center h-48">
                <Loader2 className="animate-spin text-indigo-600" size={24} />
                <span className="ml-2 text-slate-500 text-sm font-medium">Loading documents...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-3xl p-6 text-red-700 flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-sm font-semibold">Failed to load medical documents from vault.</p>
            </div>
        );
    }

    const docs = documents || [];
    
    // Filter documents by title or matching parsed text
    const filteredDocs = docs.filter(doc => {
        const titleMatch = doc.reportName?.toLowerCase().includes(searchQuery.toLowerCase());
        const textMatch = doc.parsedText?.toLowerCase().includes(searchQuery.toLowerCase());
        return titleMatch || textMatch;
    });

    return (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_1px_4px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                        <FileHeart size={18} className="text-emerald-500" /> Medical Vault
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Uploaded reports and clinical documents</p>
                </div>
                
                {/* Search Bar */}
                <div className="relative w-full md:w-64">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Search size={14} />
                    </span>
                    <input 
                        type="text"
                        placeholder="Search by name or content..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300 font-medium"
                    />
                </div>
            </div>

            <div className="p-6 space-y-3 max-h-[360px] overflow-y-auto">
                {filteredDocs.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl">
                        No reports found.
                    </div>
                ) : (
                    filteredDocs.map(doc => {
                        const isExpanded = expandedDocId === doc.id;
                        return (
                            <div key={doc.id} className="border border-slate-100 rounded-2xl bg-slate-50/60 p-4 transition-all">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText size={15} className="text-indigo-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-slate-800 text-sm truncate max-w-[180px] md:max-w-[300px]">
                                                {doc.reportName}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                {new Date(doc.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Toggle OCR Text */}
                                        {doc.parsedText && (
                                            <button 
                                                onClick={() => setExpandedDocId(isExpanded ? null : doc.id)}
                                                className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                                title={isExpanded ? "Collapse OCR text" : "View OCR extracted text"}
                                            >
                                                {isExpanded ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        )}
                                        {/* Open Document URL */}
                                        <a 
                                            href={doc.reportUrl} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                                        >
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                                
                                {/* OCR text overlay panel */}
                                {isExpanded && doc.parsedText && (
                                    <div className="mt-4 p-4 bg-white border border-slate-200/80 rounded-xl max-h-48 overflow-y-auto text-xs text-slate-600 font-mono whitespace-pre-wrap leading-relaxed">
                                        <p className="font-bold text-[9px] text-indigo-500 uppercase tracking-wider mb-2 font-sans">OCR Extracted Text</p>
                                        {doc.parsedText}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default DocumentVault;
