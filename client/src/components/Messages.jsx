import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaPaperPlane, FaSearch, FaCircle } from 'react-icons/fa';
import io from 'socket.io-client';
import * as api from '../api';

// Initialize socket outside component to avoid multiple connections
const socket = io.connect("http://localhost:5001");

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    // Get current user ID (Assuming it's stored in localStorage or decoded from token)
    // For now, let's assume we can get it from localStorage profile
    const user = JSON.parse(localStorage.getItem('profile'));
    const currentUserId = user?._id || user?.result?._id;

    // Socket Connection & Cleanup
    useEffect(() => {
        if (currentUserId) {
            socket.emit("join_room", currentUserId);
        }

        socket.on("receive_message", (data) => {
            // Only append if the message is from the active conversation
            // data = { receiverId, content, senderId }
            // If senderId matches activeConversation._id, append it.
            if (activeConversation && data.senderId === activeConversation._id) {
                setMessages((prev) => [...prev, {
                    _id: Date.now(), // Temp ID
                    content: data.content,
                    sender: { _id: data.senderId, name: activeConversation.name }, // Construct sender obj
                    createdAt: new Date().toISOString()
                }]);
            }
            // Also refresh conversations list to show unread or top up
            fetchConversations();
        });

        return () => {
            socket.off("receive_message");
        };
    }, [activeConversation, currentUserId]); // Re-run if active conversation changes (to ensure closure has correct value)? 
    // Actually, socket.on listener captures activeConversation from closure. So dependency is needed.

    // Initial Load: Get Conversations
    useEffect(() => {
        fetchConversations();
    }, []);

    // Handle deep linking from Mentors page
    useEffect(() => {
        if (location.state?.startChatWith && conversations.length >= 0) {
            const target = location.state.startChatWith;
            const existing = conversations.find(c => c._id === target.id || c._id === target._id);

            if (existing) {
                setActiveConversation(existing);
            } else {
                // Create temp conversation object
                setActiveConversation({
                    _id: target.id || target._id,
                    name: target.name,
                });
            }
        }
    }, [location.state, conversations]);

    // Fetch messages when active conversation changes
    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation._id);
            // Polling is now optional / backup. Let's keep it but longer interval or remove.
            // Removing polling for cleaner socket exp.
        }
    }, [activeConversation]);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const { data } = await api.fetchConversations();
            setConversations(data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching conversations", error);
            setLoading(false);
        }
    };

    const fetchMessages = async (userId) => {
        try {
            const { data } = await api.fetchMessages(userId);
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const msgContent = newMessage;
        const receiverId = activeConversation._id;

        try {
            // Optimistic UI Update
            const tempMsg = {
                _id: Date.now(),
                content: msgContent,
                sender: { _id: 'me', name: 'Me' },
                createdAt: new Date().toISOString()
            };
            setMessages((prev) => [...prev, tempMsg]);
            setNewMessage('');

            // Emit Socket Message
            socket.emit("send_message", {
                receiverId: receiverId,
                content: msgContent,
                senderId: currentUserId // We need to send our ID so receiver knows who sent it
            });

            // Persist to DB
            await api.sendMessage({
                receiverId: receiverId,
                content: msgContent
            });

            // Optionally refresh to get real ID, but optimistic is fine
            fetchConversations();
        } catch (error) {
            console.error("Error sending message", error);
            alert("Failed to send message");
        }
    };

    const selectConversation = (user) => {
        setActiveConversation(user);
        setMessages([]);
    };

    if (loading) return <div className="p-10 text-center">Loading chats...</div>;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex overflow-hidden">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-100 flex flex-col bg-gray-50/50">
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search chats"
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {conversations.length > 0 ? (
                        conversations.map(conv => (
                            <div
                                key={conv._id}
                                onClick={() => selectConversation(conv)}
                                className={`p-4 flex gap-3 cursor-pointer transition-colors border-b border-gray-100 hover:bg-white ${activeConversation?._id === conv._id ? 'bg-white border-l-4 border-l-primary' : ''}`}
                            >
                                <img
                                    src={`https://ui-avatars.com/api/?name=${conv.name}&background=random`}
                                    alt={conv.name}
                                    className="w-12 h-12 rounded-full"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-gray-900 truncate">{conv.name}</h4>
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                            {conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate mt-1 ${conv.unreadCount > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                                        {conv.lastMessage}
                                    </p>
                                </div>
                                {conv.unreadCount > 0 && (
                                    <div className="flex flex-col justify-center">
                                        <FaCircle className="text-blue-500 text-[10px]" />
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            No conversations yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-100 flex items-center gap-3 bg-white shadow-sm z-10">
                            <img
                                src={`https://ui-avatars.com/api/?name=${activeConversation.name}&background=random`}
                                alt={activeConversation.name}
                                className="w-10 h-10 rounded-full"
                            />
                            <div>
                                <h3 className="font-bold text-gray-900">{activeConversation.name}</h3>
                                <div className="text-xs text-green-500 flex items-center gap-1">
                                    <FaCircle className="text-[8px]" /> Online
                                </div>
                            </div>
                        </div>

                        {/* Messages List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                            {messages.map((msg, index) => {
                                // Check if message is from 'me' (optimistic) or from the current user ID
                                // Or if sender field is populated object
                                const isMe = (msg.sender?._id === 'me') || (msg.sender?._id === currentUserId) || (msg.sender === currentUserId);

                                return (
                                    <div key={index} className={`flex ${!isMe ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm text-sm ${!isMe ? 'bg-white text-gray-800' : 'bg-blue-600 text-white'}`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${!isMe ? 'text-gray-400' : 'text-blue-200'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type a message..."
                                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all"
                                />
                                <button
                                    type="submit"
                                    className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 shadow-md transition-transform hover:scale-105"
                                >
                                    <FaPaperPlane />
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-slate-50">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mb-4 text-3xl">
                            💬
                        </div>
                        <p className="text-lg font-medium text-gray-500">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;
