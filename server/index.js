const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    // Only log body for write operations
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        console.log(`${req.method} ${req.url}`, req.body);
    } else {
        console.log(`${req.method} ${req.url}`);
    }
    next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/roadmap', require('./routes/roadmapRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
const mentorRoutes = require('./routes/mentorRoutes');
app.use('/api/mentors', mentorRoutes);
const studentRoutes = require('./routes/studentRoutes');
app.use('/api/students', studentRoutes);

// Test Route
app.get('/', (req, res) => {
    res.send('Elevate Hub API is running');
});

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5174"], // Adjust if deployment URL differs
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User Connected:', socket.id);

    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`User with ID: ${socket.id} joined room: ${userId}`);
    });

    socket.on('send_message', (data) => {
        // data expects: { receiverId, content, senderId }
        // We emit to the receiver's room
        socket.to(data.receiverId).emit('receive_message', data);
    });

    // --- Whiteboard Events ---
    socket.on('whiteboard_draw', (data) => {
        socket.to(data.roomId).emit('whiteboard_draw', data);
    });

    socket.on('whiteboard_clear', (roomId) => {
        socket.to(roomId).emit('whiteboard_clear');
    });

    socket.on('whiteboard_toggle', (data) => {
        socket.to(data.roomId).emit('whiteboard_toggle', data.isOpen);
    });

    socket.on('whiteboard_permission', (data) => {
        socket.to(data.roomId).emit('whiteboard_permission', data.permission);
    });

    socket.on('whiteboard_ai_permission', (data) => {
        socket.to(data.roomId).emit('whiteboard_ai_permission', data.permission);
    });
    // -------------------------

    socket.on('disconnect', () => {
        console.log('User Disconnected', socket.id);
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
