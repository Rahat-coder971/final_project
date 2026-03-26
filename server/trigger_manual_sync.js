const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Student = require('./models/Student');

const TARGET_BOOKING_ID = '69944520a34f6bd0caff7cdc';

async function runManualSync() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB for Manual Sync");

        const booking = await Booking.findById(TARGET_BOOKING_ID);
        if (!booking) {
            console.error("Booking not found");
            return;
        }

        console.log(`Booking Found. Focus Area: "${booking.outcome?.focusArea}"`);

        let conceptsToSync = [];
        if (booking.outcome && booking.outcome.focusArea) {
            conceptsToSync = booking.outcome.focusArea.split(',').map(c => c.trim()).filter(c => c);
        }

        if (conceptsToSync.length === 0) {
            console.log("No concepts to sync found in focusArea.");
            return;
        }

        console.log(`Syncing Concepts: ${JSON.stringify(conceptsToSync)}`);

        // Update Booking
        booking.outcome.weakConcepts = conceptsToSync;
        await booking.save();
        console.log("Booking Updated.");

        // Update Student
        const studentDoc = await Student.findOne({ user: booking.student });
        if (studentDoc) {
            conceptsToSync.forEach(concept => {
                const existing = studentDoc.weakTopics.find(t => t.topic.toLowerCase() === concept.toLowerCase());
                if (existing) {
                    existing.missedQuestionsCount += 5;
                    existing.lastMissed = new Date();
                } else {
                    studentDoc.weakTopics.push({
                        topic: concept,
                        missedQuestionsCount: 5,
                        lastMissed: new Date(),
                        source: 'mentor'
                    });
                }
            });
            await studentDoc.save();
            console.log("Student Profile Updated Successfully.");
        } else {
            console.error("Student Profile not found.");
        }

    } catch (error) {
        console.error("Sync Failed:", error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runManualSync();
