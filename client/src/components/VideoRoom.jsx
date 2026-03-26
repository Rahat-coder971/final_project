import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaPhoneSlash, FaChalkboard } from 'react-icons/fa';
import io from 'socket.io-client';
import LiveWhiteboard from './LiveWhiteboard';

const VideoRoom = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [showWhiteboard, setShowWhiteboard] = useState(false);
    const socketRef = useRef(null);

    // In a real app, we would fetch the user's name from context/auth
    const user = JSON.parse(localStorage.getItem('profile')) || { name: 'Guest', role: 'student' };
    const displayName = user.name;
    const isMentor = user.role === 'mentor';

    // Socket Initialization
    useEffect(() => {
        socketRef.current = io.connect("http://localhost:5001");

        socketRef.current.emit("join_room", roomId);

        // Listen for whiteboard toggle from mentor
        socketRef.current.on("whiteboard_toggle", (isOpen) => {
            setShowWhiteboard(isOpen);
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [roomId]);

    // Jitsi URL construction
    const domain = 'meet.jit.si';
    const roomName = roomId || 'ElevateHub-General';
    const jitsiUrl = `https://${domain}/${roomName}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false`;

    const handleLeave = () => {
        if (socketRef.current) socketRef.current.disconnect();
        navigate(-1);
    };

    const toggleWhiteboard = () => {
        const newState = !showWhiteboard;
        setShowWhiteboard(newState);
        if (socketRef.current && isMentor) {
            socketRef.current.emit("whiteboard_toggle", { roomId, isOpen: newState });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-900 relative">
            {/* Custom Toolbar / Header if needed, though Jitsi has one. 
                 We can add a "Return to Dashboard" overly or header. 
             */}
            <div className="bg-gray-800 text-white p-3 flex justify-between items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <span className="font-semibold tracking-wide">Live Session: {roomName}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleWhiteboard}
                        className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors ${showWhiteboard ? 'bg-cyan-600 text-white hover:bg-cyan-700' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            }`}
                    >
                        <FaChalkboard /> {showWhiteboard ? 'Hide Whiteboard' : 'Open Whiteboard'}
                    </button>
                    <button
                        onClick={handleLeave}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                    >
                        <FaPhoneSlash /> Leave Meeting
                    </button>
                </div>
            </div>

            <div className="flex-1 relative bg-black">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                        <div className="flex flex-col items-center gap-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
                            <p>Connecting to secure room...</p>
                        </div>
                    </div>
                )}
                <iframe
                    src={jitsiUrl}
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                    onLoad={() => setLoading(false)}
                    title="Jitsi Meeting"
                />

                {/* Whiteboard Overlay */}
                {showWhiteboard && (
                    <LiveWhiteboard
                        socket={socketRef.current}
                        roomId={roomId}
                        isMentor={isMentor}
                        onClose={() => toggleWhiteboard()}
                    />
                )}
            </div>
        </div>
    );
};

export default VideoRoom;
