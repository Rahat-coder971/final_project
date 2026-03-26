const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const senderId = req.user.id; // From auth middleware

        const newMessage = await Message.create({
            sender: senderId,
            receiver: receiverId,
            content
        });

        // Populate sender details for immediate UI update
        const populatedMessage = await newMessage.populate('sender', 'name img');

        res.status(201).json(populatedMessage);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:otherUserId
// @access  Private
const getMessages = async (req, res) => {
    try {
        const myId = req.user.id;
        const otherId = req.params.otherUserId;

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: otherId },
                { sender: otherId, receiver: myId }
            ]
        })
            .sort({ createdAt: 1 }) // Oldest first
            .populate('sender', 'name img');

        res.json(messages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get list of conversations (users messaged with)
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = async (req, res) => {
    try {
        const myId = req.user.id;

        // Find all unique users communicated with
        const sentTo = await Message.distinct('receiver', { sender: myId });
        const receivedFrom = await Message.distinct('sender', { receiver: myId });

        // Combine unique IDs
        const uniqueUserIds = [...new Set([...sentTo, ...receivedFrom].map(id => id.toString()))];

        // Fetch user details
        const conversations = await User.find({ _id: { $in: uniqueUserIds } })
            .select('name email img');

        // Add last message preview (optional improvement)
        const conversationsWithPreview = await Promise.all(conversations.map(async (user) => {
            const lastMsg = await Message.findOne({
                $or: [
                    { sender: myId, receiver: user._id },
                    { sender: user._id, receiver: myId }
                ]
            }).sort({ createdAt: -1 });

            return {
                ...user.toObject(),
                lastMessage: lastMsg ? lastMsg.content : '',
                lastMessageTime: lastMsg ? lastMsg.createdAt : null,
                unreadCount: await Message.countDocuments({ sender: user._id, receiver: myId, read: false })
            };
        }));

        // Sort by most recent
        conversationsWithPreview.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));

        res.json(conversationsWithPreview);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { sendMessage, getMessages, getConversations };
