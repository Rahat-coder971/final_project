const mongoose = require('mongoose');
const User = require('./models/User');
const Student = require('./models/Student');
const Booking = require('./models/Booking');
const analyticsController = require('./controllers/analyticsController');
require('dotenv').config();

// Mock req, res
const req = { params: {} };
const res = {
    json: (data) => {
        console.log("--- Analytics API Response ---");
        console.log("Needs Attention List:", JSON.stringify(data.needsAttention, null, 2));
    },
    status: (code) => ({
        json: (data) => console.log(`Error ${code}:`, data)
    })
};

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const studentUser = await User.findOne({ name: "Rahat Husain khan" });
        if (!studentUser) throw new Error("User not found");

        console.log("Testing for User ID:", studentUser._id);
        req.params.studentId = studentUser._id.toString();

        await analyticsController.getAnalyticsDashboard(req, res);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
};

verify();
