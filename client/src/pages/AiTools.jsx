import React, { useState, useRef, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { FaYoutube, FaFilePdf, FaFileAlt, FaCloudUploadAlt, FaMagic, FaPaperPlane, FaUser, FaRobot, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import * as api from '../api';

const AiTools = () => {
    const [activeTab, setActiveTab] = useState('youtube');
    const [videoUrl, setVideoUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [loadingDots, setLoadingDots] = useState('');

    const loadingMessages = [
        'Analyzing video',
        'Extracting audio',
        'Understanding content',
        'Generating summary',
        'Almost done'
    ];

    // PDF Chat States
    const [pdfFile, setPdfFile] = useState(null);
    const [pdfContext, setPdfContext] = useState('');
    const [pdfChat, setPdfChat] = useState([]);
    const [pdfInput, setPdfInput] = useState('');
    const chatEndRef = useRef(null);

    // Resume States
    const [resumeScore, setResumeScore] = useState(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [pdfChat]);

    // Loading Simulation Effect
    useEffect(() => {
        let messageInterval, dotsInterval;
        if (isLoading) {
            messageInterval = setInterval(() => {
                setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
            }, 2000);

            dotsInterval = setInterval(() => {
                setLoadingDots((prev) => prev.length >= 3 ? '' : prev + '.');
            }, 500);
        } else {
            setLoadingMessageIndex(0);
            setLoadingDots('');
        }
        return () => {
            clearInterval(messageInterval);
            clearInterval(dotsInterval);
        };
    }, [isLoading]);

    const handleSummarize = async () => {
        if (!videoUrl) return;
        setIsLoading(true);
        setError('');
        setSummary('');

        try {
            let transcriptText = '';

            // 1. Extract Video ID
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = videoUrl.match(regExp);
            const videoId = (match && match[2].length === 11) ? match[2] : null;

            if (videoId) {
                // 2. Try Standard Client-Side Fetch (might fail CORS)
                try {
                    const { YoutubeTranscript } = await import('youtube-transcript');
                    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
                    transcriptText = transcriptItems.map(item => item.text).join(' ');
                } catch (e) {
                    console.warn("Direct fetch failed (CORS likely). Trying Invidious...");

                    // 3. Fallback: Invidious API (CORS Friendly)
                    const instances = [
                        'https://inv.tux.pizza',
                        'https://invidious.drgns.space',
                        'https://vid.puffyan.us',
                        'https://invidious.fdn.fr',
                        'https://yt.artemislena.eu'
                    ];

                    for (const instance of instances) {
                        try {
                            // Get Video Info
                            const infoRes = await fetch(`${instance}/api/v1/videos/${videoId}`);
                            if (!infoRes.ok) continue;
                            const info = await infoRes.json();

                            // Find English Caption
                            const track = info.captions?.find(c => c.label.toLowerCase().includes('english') || c.language === 'en') || info.captions?.[0];

                            if (track) {
                                // Fetch Caption Content
                                const captionRes = await fetch(`${instance}${track.url}`);
                                if (!captionRes.ok) continue;
                                const vttText = await captionRes.text();

                                // Clean VTT
                                transcriptText = vttText
                                    .replace(/WEBVTT/g, '')
                                    .replace(/(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})/g, '')
                                    .replace(/align:start position:0%/g, '')
                                    .replace(/<[^>]*>/g, '')
                                    .replace(/\s+/g, ' ')
                                    .trim();

                                console.log(`Fetched via ${instance}`);
                                break; // Success
                            }
                        } catch (invErr) {
                            console.warn(`Invidious instance ${instance} failed:`, invErr);
                        }
                    }
                }
            }

            // 4. Send to Backend
            const response = await fetch("http://localhost:8765/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: videoUrl, transcript: transcriptText })
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || errorData.message || 'Failed to summarize video');
            }
            const data = await response.json();
            setSummary(data.summary);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to summarize video. Captions might be disabled or blocked (server & client).');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePdfUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setPdfFile(file);
        setIsLoading(true);
        setError('');
        
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await api.extractPdfContext(formData);
            setPdfContext(res.data.text);
            setPdfChat([{ role: 'model', text: 'PDF loaded successfully! What would you like to know about it?' }]);
        } catch(err) {
            console.error(err);
            setError('Failed to extract PDF text.');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePdfChatSend = async (e) => {
        e.preventDefault();
        if(!pdfInput.trim() || isLoading) return;
        
        const userMsg = pdfInput.trim();
        const newChat = [...pdfChat, { role: 'user', text: userMsg }];
        setPdfChat(newChat);
        setPdfInput('');
        setIsLoading(true);
        
        try {
            const history = newChat.map(msg => ({ role: msg.role === 'model' ? 'model' : 'user', parts: [{ text: msg.text }] }));
            const res = await api.sendPdfChat({ message: userMsg, context: pdfContext, history });
            setPdfChat([...newChat, { role: 'model', text: res.data.reply }]);
        } catch(err) {
            setPdfChat([...newChat, { role: 'model', text: 'Error: Could not get response from AI.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if(!file) return;
        setIsLoading(true);
        setError('');
        setResumeScore(null);
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await api.generateResumeScore(formData);
            setResumeScore(res.data);
        } catch(err) {
            console.error(err);
            setError('Failed to score resume.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">AI Toolbox</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                {/* Toolbox Tabs */}
                <div className="flex border-b border-gray-100 flex-wrap">
                    <button
                        onClick={() => setActiveTab('youtube')}
                        className={`flex-1 min-w-[150px] py-4 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'youtube' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FaYoutube className="text-lg" /> YouTube Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('pdf')}
                        className={`flex-1 min-w-[150px] py-4 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'pdf' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FaFilePdf className="text-lg" /> PDF Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`flex-1 min-w-[150px] py-4 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'resume' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FaFileAlt className="text-lg" /> Resume Score
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-4 md:p-8 flex-1 bg-slate-50/50 flex flex-col justify-center items-center">

                    {/* YOUTUBE TOOL */}
                    {activeTab === 'youtube' && (
                        <div className="w-full max-w-2xl mx-auto text-center">
                            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaYoutube className="text-3xl text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Summarize YouTube Videos</h2>
                                <p className="text-gray-500 mb-8">Paste a link to any educational video and get a bullet-point summary instantly.</p>

                                <div className="flex flex-col sm:flex-row gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="Paste YouTube Link here..."
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleSummarize}
                                        disabled={isLoading}
                                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                                    >
                                        {isLoading ? <span className="animate-spin text-lg">↻</span> : <FaMagic />} Summarize
                                    </button>
                                </div>

                                {isLoading && (
                                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl border border-blue-100/50 animate-pulse transition-all">
                                        <div className="flex items-center justify-center gap-3">
                                            <span className="text-sm font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%]">
                                                {loadingMessages[loadingMessageIndex]}
                                                <span className="inline-block w-8 text-left">{loadingDots}</span>
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm mb-4">
                                        {error}
                                    </div>
                                )}

                                {summary && (
                                    <div className="mt-8 text-left bg-gray-50 p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <FaMagic className="text-amber-500" /> AI Summary
                                        </h3>
                                        <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">
                                            {summary}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* PDF CHAT TOOL */}
                    {activeTab === 'pdf' && (
                        <div className="w-full max-w-3xl mx-auto flex flex-col h-full items-center justify-center w-full">
                            {!pdfContext ? (
                                <div className="bg-white p-8 w-full max-w-2xl rounded-2xl shadow-sm border border-gray-100 border-dashed border-2 hover:border-blue-400 transition-colors text-center relative cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={handlePdfUpload}
                                        disabled={loading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                    />
                                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                        {loading ? <span className="animate-spin text-2xl text-blue-600">↻</span> : <FaCloudUploadAlt className="text-3xl text-blue-600" />}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Upload your PDF</h2>
                                    <p className="text-gray-500 mb-8">Drag & drop your study notes or textbooks here to chat with them.</p>
                                    <button disabled={loading} className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 pointer-events-none">
                                        {loading ? 'Processing...' : 'Select File'}
                                    </button>
                                    {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full flex flex-col h-[600px] overflow-hidden">
                                    <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <FaFilePdf className="text-xl" />
                                            <span className="font-semibold">{pdfFile?.name}</span>
                                        </div>
                                        <button onClick={() => { setPdfContext(''); setPdfChat([]); setPdfFile(null); }} className="text-blue-100 hover:text-white text-sm underline">Upload Another</button>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 flex flex-col gap-4">
                                        {pdfChat.map((msg, idx) => (
                                            <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white border border-gray-200 text-blue-600'}`}>
                                                    {msg.role === 'user' ? <FaUser size={14} /> : <FaRobot size={14} />}
                                                </div>
                                                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {loading && (
                                            <div className="flex gap-3 max-w-[85%] self-start">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200 text-blue-600 flex-shrink-0 shadow-sm"><FaRobot size={14}/></div>
                                                <div className="p-4 bg-white rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-75"></div>
                                                    <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse delay-150"></div>
                                                </div>
                                            </div>
                                        )}
                                        <div ref={chatEndRef} />
                                    </div>

                                    <div className="p-4 bg-white border-t border-gray-100">
                                        <form onSubmit={handlePdfChatSend} className="relative flex items-center">
                                            <input
                                                type="text"
                                                value={pdfInput}
                                                onChange={(e) => setPdfInput(e.target.value)}
                                                placeholder="Ask a question about this document..."
                                                disabled={loading}
                                                className="w-full bg-slate-50 border border-gray-200 text-gray-800 text-sm rounded-full pl-5 pr-14 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                                            />
                                            <button 
                                                type="submit"
                                                disabled={!pdfInput.trim() || loading}
                                                className="absolute right-1.5 w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none flex-shrink-0"
                                            >
                                                <FaPaperPlane size={14} className="ml-0.5" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RESUME SCORE TOOL */}
                    {activeTab === 'resume' && (
                        <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
                            {!resumeScore ? (
                                <div className="bg-white p-8 rounded-2xl w-full max-w-2xl shadow-sm border border-gray-100 border-dashed border-2 hover:border-green-400 transition-colors text-center relative cursor-pointer">
                                    <input 
                                        type="file" 
                                        accept=".pdf" 
                                        onChange={handleResumeUpload}
                                        disabled={loading}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-wait"
                                    />
                                    <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                        {loading ? <span className="animate-spin text-2xl text-green-600">↻</span> : <FaFileAlt className="text-3xl text-green-600" />}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Resume</h2>
                                    <p className="text-gray-500 mb-8">Upload your resume to get an AI score and improvement tips.</p>
                                    <button disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 pointer-events-none">
                                        {loading ? 'Analyzing Application...' : 'Upload Resume PDF'}
                                    </button>
                                    {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                                </div>
                            ) : (
                                <div className="w-full bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 text-left">
                                    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start mb-10">
                                        {/* Score Circle */}
                                        <div className="relative w-40 h-40 flex-shrink-0">
                                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="#f3f4f6" strokeWidth="8" />
                                                <circle 
                                                    cx="50" cy="50" r="45" fill="none" 
                                                    stroke={resumeScore.score >= 80 ? '#22c55e' : resumeScore.score >= 60 ? '#f59e0b' : '#ef4444'} 
                                                    strokeWidth="8" 
                                                    strokeDasharray={`${(resumeScore.score / 100) * 283} 283`}
                                                    className="transition-all duration-1000 ease-out"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-4xl font-extrabold text-gray-900">{resumeScore.score}</span>
                                                <span className="text-xs font-bold text-gray-400">ATS SCORE</span>
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-gray-900 mb-3">AI Verdict</h3>
                                            <p className="text-gray-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-gray-100">{resumeScore.verdict}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                                            <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                                                <FaCheckCircle className="text-green-500" /> Key Strengths
                                            </h4>
                                            <ul className="space-y-3">
                                                {resumeScore.strengths?.map((str, idx) => (
                                                    <li key={idx} className="flex gap-2 text-sm text-green-900">
                                                        <span className="text-green-500 mt-0.5">•</span> 
                                                        <span>{str}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        
                                        <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                                            <h4 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                                <FaExclamationTriangle className="text-red-500" /> Areas to Improve
                                            </h4>
                                            <ul className="space-y-3">
                                                {resumeScore.weaknesses?.map((weak, idx) => (
                                                    <li key={idx} className="flex gap-2 text-sm text-red-900">
                                                        <span className="text-red-500 mt-0.5">•</span> 
                                                        <span>{weak}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="mt-10 text-center">
                                        <button onClick={() => setResumeScore(null)} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold transition-colors">
                                            Upload New Resume
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
};

export default AiTools;
