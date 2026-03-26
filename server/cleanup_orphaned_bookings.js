const mongoose = require('mongoose');
const User = require('./models/User');
const Booking = require('./models/Booking');

async function cleanUp() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Cleanup");

        // 1. Get All Valid User IDs
        const users = await User.find({}, '_id');
        const validUserIds = users.map(u => u._id.toString());
        console.log(`Found ${validUserIds.length} valid users.`);

        // 2. Find Orphaned Bookings
        const bookings = await Booking.find({});
        let deletedCount = 0;

        for (const b of bookings) {
            const studentId = b.student ? b.student.toString() : null;

            if (!studentId || !validUserIds.includes(studentId)) {
                console.log(`Deleting Orphaned Booking: ${b._id} (Student ID: ${studentId})`);
                await Booking.deleteOne({ _id: b._id });
                deletedCount++;
            }
        }

        console.log(`\nCleanup Complete. Deleted ${deletedCount} orphaned bookings.`);

    } catch (error) {
        console.error("Cleanup Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

cleanUp();
