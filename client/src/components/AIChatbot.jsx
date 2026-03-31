import React, { useState, useRef, useEffect } from 'react';
import { MdChat, MdClose, MdSend, MdPerson, MdSmartToy } from 'react-icons/md';
import { chatWithBot } from '../api';

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'model', text: 'Hi there! I am the Elevate Hub AI Assistant. How can I help you understand our features today?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input.trim();
        setInput('');
        
        // Add user message to UI
        const newMessages = [...messages, { role: 'user', text: userMsg }];
        setMessages(newMessages);
        setIsLoading(true);

        try {
            // Format history for Gemini API: [{role: 'user', parts: [{text: '...'}]}]
            // Note: Our API backend takes history in this format
            const formattedHistory = messages.map(msg => ({
                role: msg.role === 'model' ? 'model' : 'user',
                parts: [{ text: msg.text }]
            }));

            const res = await chatWithBot({ message: userMsg, history: formattedHistory });
            
            setMessages([...newMessages, { role: 'model', text: res.data.reply }]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages([...newMessages, { role: 'model', text: "Sorry, I'm having trouble connecting right now. Please try again later." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="bg-white w-80 sm:w-96 max-w-[calc(100vw-3rem)] h-[450px] max-h-[calc(100vh-6rem)] rounded-2xl shadow-2xl border border-gray-100 flex flex-col mb-4 overflow-hidden transform transition-all duration-300">
                    {/* Header */}
                    <div className="bg-indigo-600 text-white p-4 flex justify-between items-center rounded-t-2xl shadow-sm z-10">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/20 p-1.5 rounded-lg">
                                <MdSmartToy className="text-xl" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Elevate AI Assistant</h3>
                                <p className="text-[10px] text-indigo-100 opacity-90">Always here to help</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-white/20 rounded-md transition-colors"
                            aria-label="Close Chat"
                        >
                            <MdClose className="text-xl" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50 flex flex-col gap-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center -mt-1 shadow-sm ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-white border border-gray-200 text-indigo-600'}`}>
                                    {msg.role === 'user' ? <MdPerson size={16} /> : <MdSmartToy size={16} />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2 max-w-[85%] self-start">
                                <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center -mt-1 shadow-sm bg-white border border-gray-200 text-indigo-600">
                                    <MdSmartToy size={16} />
                                </div>
                                <div className="p-3 bg-white text-gray-400 text-sm rounded-2xl rounded-tl-none shadow-sm border border-gray-100 flex gap-1 items-center">
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 z-10">
                        <form onSubmit={handleSend} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about platform features..."
                                disabled={isLoading}
                                className="w-full bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
                            />
                            <button 
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-1 w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center transition-colors focus:outline-none flex-shrink-0"
                                aria-label="Send Message"
                            >
                                <MdSend size={18} className="ml-1" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center transform transition-all duration-300 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-indigo-300 ${isOpen ? 'bg-red-500 text-white rotate-90' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                aria-label="Toggle AI Assistant"
            >
                {isOpen ? <MdClose className="text-2xl" /> : <MdChat className="text-2xl" />}
            </button>
        </div>
    );
};

export default AIChatbot;
