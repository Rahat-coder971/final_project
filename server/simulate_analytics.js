const mongoose = require('mongoose');
const Student = require('./models/Student');
const { getStudentAnalytics } = require('./controllers/analyticsController'); // We might need to mock req/res if we can't import directly easily
// Actually, let's just reverse engineer the logic or use a script that imports the controller function? 
// Controllers usually expect req, res. 
// Easier to just duplicate the logic in a script to verify what it *would* return.

async function runCheck() {
    try {
        await mongoose.connect('mongodb://localhost:27017/elevatehubproject', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const student = await Student.findOne({ user: '69944520a34f6bd0caff7cdc' }); // wait, that's booking ID. 
        // Student ID from debug output: 698f0e0bc81a8c13818745ad (User ID) or internal student ID?
        // Analytics controller usually takes Student User ID or Student Doc ID?

        // Let's find the student doc first
        // User Name: Rahat Husain khan -> ID: 698f0e0bc81a8c13818745ad
        const userId = '698f0e0bc81a8c13818745ad';

        const studentDoc = await Student.findOne({ user: userId });
        if (!studentDoc) {
            console.log("Student not found");
            return;
        }

        console.log("Found Student. Weak Topics:", studentDoc.weakTopics.length);

        // Simulating Analytics Logic:
        // const weakAreas = student.weakTopics.sort((a, b) => b.missedQuestionsCount - a.missedQuestionsCount).slice(0, 5);
        const needsAttention = studentDoc.weakTopics
            .sort((a, b) => b.missedQuestionsCount - a.missedQuestionsCount)
            .slice(0, 5)
            .map(t => ({
                topic: t.topic,
                priority: 'High',
                source: t.source || 'Quiz'
            }));

        console.log("--- Analytics API Response Simulation ---");
        console.log("needsAttention:", JSON.stringify(needsAttention, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        setTimeout(() => mongoose.connection.close(), 1000);
    }
}

runCheck();
