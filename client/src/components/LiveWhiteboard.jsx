import React, { useRef, useState, useEffect } from 'react';
import { FaEraser, FaPalette, FaCheckCircle, FaTrashAlt, FaRobot, FaSpinner, FaTimes } from 'react-icons/fa';

const LiveWhiteboard = ({ socket, roomId, isMentor, onClose }) => {
    const canvasRef = useRef(null);
    const contextRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ffffff');
    const [lineWidth, setLineWidth] = useState(5);
    const [studentCanDraw, setStudentCanDraw] = useState(false);

    // Refs for Socket Handlers to avoid stale closures
    const localSettings = useRef({ color: '#ffffff', lineWidth: 5 });

    // Update local settings ref
    useEffect(() => {
        localSettings.current = { color, lineWidth };
    }, [color, lineWidth]);

    // AI Features state
    const [studentCanUseAI, setStudentCanUseAI] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [generatedNotes, setGeneratedNotes] = useState(null);

    // Initialize Canvas Context and ensure proper sizing
    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;

        const resizeCanvas = () => {
            if (!parent) return;
            // Prevent 0x0 canvas bug
            canvas.width = parent.clientWidth > 0 ? parent.clientWidth : window.innerWidth;
            canvas.height = parent.clientHeight > 0 ? parent.clientHeight : window.innerHeight;

            if (contextRef.current) {
                // Restore styles after resize clears them
                contextRef.current.strokeStyle = localSettings.current.color;
                contextRef.current.lineWidth = localSettings.current.lineWidth;
            }
        };

        const resizeObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        if (parent) resizeObserver.observe(parent);

        resizeCanvas();

        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        contextRef.current = context;

        return () => {
            if (parent) resizeObserver.unobserve(parent);
        };
    }, []);

    // Effect for handling incoming socket events
    useEffect(() => {
        if (!socket) return;

        const handleDraw = (data) => {
            if (!contextRef.current) return;
            const context = contextRef.current;
            const { x0, y0, x1, y1, color: drawColor, width } = data;

            context.beginPath();
            context.moveTo(x0, y0);
            context.lineTo(x1, y1);
            context.strokeStyle = drawColor;
            context.lineWidth = width;
            context.stroke();
            context.closePath();

            // Restore current local settings from Ref
            context.strokeStyle = localSettings.current.color;
            context.lineWidth = localSettings.current.lineWidth;
        };

        const handleClear = () => {
            if (!contextRef.current || !canvasRef.current) return;
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        };

        const handlePermission = (permission) => setStudentCanDraw(permission);
        const handleAIPermission = (permission) => setStudentCanUseAI(permission);

        socket.on('whiteboard_draw', handleDraw);
        socket.on('whiteboard_clear', handleClear);
        socket.on('whiteboard_permission', handlePermission);
        socket.on('whiteboard_ai_permission', handleAIPermission);

        return () => {
            socket.off('whiteboard_draw', handleDraw);
            socket.off('whiteboard_clear', handleClear);
            socket.off('whiteboard_permission', handlePermission);
            socket.off('whiteboard_ai_permission', handleAIPermission);
        };
    }, [socket]); // Only depend on socket

    // Update context whenever color or line width changes locally
    useEffect(() => {
        if (contextRef.current) {
            contextRef.current.strokeStyle = color;
            contextRef.current.lineWidth = lineWidth;
        }
    }, [color, lineWidth]);

    // Helper logic to capture previous coordinates for smooth lines
    const prevPos = useRef({ x: 0, y: 0 });

    const getMousePos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const startDrawing = (e) => {
        if (!isMentor && !studentCanDraw) return;

        const pos = getMousePos(e);
        prevPos.current = pos;
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        if (!isMentor && !studentCanDraw) return;

        const currentPos = getMousePos(e);

        // Draw locally
        contextRef.current.beginPath();
        contextRef.current.moveTo(prevPos.current.x, prevPos.current.y);
        contextRef.current.lineTo(currentPos.x, currentPos.y);
        contextRef.current.stroke();
        contextRef.current.closePath();

        // Emit over socket
        if (socket) {
            socket.emit('whiteboard_draw', {
                roomId,
                x0: prevPos.current.x,
                y0: prevPos.current.y,
                x1: currentPos.x,
                y1: currentPos.y,
                color,
                width: lineWidth
            });
        }

        prevPos.current = currentPos;
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
    };

    const clearBoard = () => {
        if (!isMentor) return; // Only mentors can clear
        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (socket) {
            socket.emit('whiteboard_clear', roomId);
        }
    };

    const toggleStudentPermission = () => {
        const newPerm = !studentCanDraw;
        setStudentCanDraw(newPerm);
        if (socket) {
            socket.emit('whiteboard_permission', { roomId, permission: newPerm });
        }
    };

    const toggleAIPermission = () => {
        const newPerm = !studentCanUseAI;
        setStudentCanUseAI(newPerm);
        if (socket) {
            socket.emit('whiteboard_ai_permission', { roomId, permission: newPerm });
        }
    };

    const generateNotes = async () => {
        setAiLoading(true);
        try {
            const image = canvasRef.current.toDataURL("image/png");
            const profile = JSON.parse(localStorage.getItem('profile'));
            const token = profile?.token;

            const res = await fetch('http://localhost:5001/api/ai/whiteboard-notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ meetingId: roomId, image })
            });
            const data = await res.json();
            if (data.notes && data.notes.content) {
                setGeneratedNotes(data.notes.content);
            } else {
                alert("Failed to extract notes. " + (data.message || ''));
            }
        } catch (err) {
            console.error("AI Error:", err);
            alert("Failed to generate notes.");
        } finally {
            setAiLoading(false);
        }
    };

    return (
        <div className="absolute inset-x-8 inset-y-8 z-50 flex flex-col bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-700 shadow-2xl overflow-hidden shadow-cyan-500/20">
            {/* Toolbar */}
            <div className="bg-gray-800/90 text-white p-3 flex justify-between items-center border-b border-gray-700">
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-cyan-400">Live Whiteboard</span>

                    {/* Controls (Only active for mentor or if student has permission) */}
                    {(isMentor || studentCanDraw) && (
                        <div className="flex items-center gap-3 border-l border-gray-600 pl-4">
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                            />
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-400">Brush:</label>
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={lineWidth}
                                    onChange={(e) => setLineWidth(e.target.value)}
                                    className="w-24 accent-cyan-400 cursor-pointer"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Mentor only controls */}
                    {isMentor && (
                        <>
                            <button
                                onClick={toggleAIPermission}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${studentCanUseAI ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                                title="Allow AI Assistant"
                            >
                                <FaRobot /> {studentCanUseAI ? 'AI Allowed' : 'Allow AI Assistant'}
                            </button>
                            <button
                                onClick={toggleStudentPermission}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${studentCanDraw ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                    }`}
                                title="Allow Student to Draw"
                            >
                                <FaCheckCircle /> {studentCanDraw ? 'Student Can Draw' : 'Allow Student'}
                            </button>
                            <button
                                onClick={clearBoard}
                                className="flex items-center gap-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            >
                                <FaTrashAlt /> Clear
                            </button>
                        </>
                    )}

                    {/* Student AI Control */}
                    {!isMentor && studentCanUseAI && (
                        <button
                            onClick={generateNotes}
                            disabled={aiLoading}
                            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                        >
                            {aiLoading ? <FaSpinner className="animate-spin" /> : <FaRobot />}
                            {aiLoading ? 'Analyzing...' : 'Generate Notes'}
                        </button>
                    )}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ml-4"
                    >
                        Close Whiteboard
                    </button>
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseOut={stopDrawing}
                    className="absolute top-0 left-0 w-full h-full"
                />

                {/* AI Overlay Modal */}
                {generatedNotes && (
                    <div className="absolute top-4 right-4 bottom-4 w-1/3 min-w-[300px] bg-gray-900 border border-purple-500/50 rounded-xl shadow-2xl shadow-purple-900/20 flex flex-col z-50 overflow-hidden">
                        <div className="bg-purple-900/40 p-3 border-b border-purple-500/30 flex justify-between items-center">
                            <h3 className="font-bold text-purple-300 flex items-center gap-2">
                                <FaRobot /> AI Meeting Notes
                            </h3>
                            <button onClick={() => setGeneratedNotes(null)} className="text-gray-400 hover:text-white">
                                <FaTimes />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1 text-sm text-gray-200 whitespace-pre-wrap">
                            {generatedNotes}
                        </div>
                        <div className="p-3 bg-gray-800/80 text-xs text-center text-gray-400 italic border-t border-gray-700">
                            Automatically saved to your Meeting Notes.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveWhiteboard;
