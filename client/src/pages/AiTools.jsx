import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { FaYoutube, FaFilePdf, FaFileAlt, FaCloudUploadAlt, FaMagic } from 'react-icons/fa';
import * as api from '../api';

const AiTools = () => {
    const [activeTab, setActiveTab] = useState('youtube');
    const [videoUrl, setVideoUrl] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSummarize = async () => {
        if (!videoUrl) return;
        setLoading(true);
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
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <h1 className="text-2xl font-bold text-gray-900 mb-8">AI Toolbox</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px] flex flex-col">
                {/* Toolbox Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('youtube')}
                        className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'youtube' ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FaYoutube className="text-lg" /> YouTube Summary
                    </button>
                    <button
                        onClick={() => setActiveTab('pdf')}
                        className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'pdf' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FaFilePdf className="text-lg" /> PDF Chat
                    </button>
                    <button
                        onClick={() => setActiveTab('resume')}
                        className={`flex-1 py-4 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'resume' ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <FaFileAlt className="text-lg" /> Resume Score
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-8 flex-1 bg-slate-50/50">

                    {activeTab === 'youtube' && (
                        <div className="max-w-2xl mx-auto text-center mt-10">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaYoutube className="text-3xl text-red-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Summarize YouTube Videos</h2>
                                <p className="text-gray-500 mb-8">Paste a link to any educational video and get a bullet-point summary instantly.</p>

                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        value={videoUrl}
                                        onChange={(e) => setVideoUrl(e.target.value)}
                                        placeholder="Paste YouTube Link here..."
                                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    />
                                    <button
                                        onClick={handleSummarize}
                                        disabled={loading}
                                        className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50"
                                    >
                                        {loading ? <span className="animate-spin">↻</span> : <FaMagic />} Summarize
                                    </button>
                                </div>

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

                    {activeTab === 'pdf' && (
                        <div className="max-w-2xl mx-auto text-center mt-10">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 border-dashed border-2 border-blue-200 hover:border-blue-400 transition-colors cursor-pointer">
                                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaCloudUploadAlt className="text-3xl text-blue-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Upload your PDF</h2>
                                <p className="text-gray-500 mb-8">Drag & drop your study notes or textbooks here to chat with them.</p>
                                <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20">
                                    Select File
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'resume' && (
                        <div className="max-w-2xl mx-auto text-center mt-10">
                            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <FaFileAlt className="text-3xl text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 mb-2">Check Your Resume</h2>
                                <p className="text-gray-500 mb-8">Upload your resume to get an AI score and improvement tips.</p>
                                <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20">
                                    Upload Resume
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </DashboardLayout>
    );
};

export default AiTools;
