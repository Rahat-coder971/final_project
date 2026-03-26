const mongoose = require('mongoose');
const User = require('./models/User');
const Mentor = require('./models/Mentor');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Manual .env parsing
try {
    const envPath = path.join(__dirname, '.env');
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("Could not read .env file manually", e);
}

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

const mentors = [
    {
        name: "Elena Rodriguez",
        email: "elena.rodriguez@example.com",
        jobTitle: "Senior Frontend Engineer",
        company: "Netflix",
        bio: "Specializing in React performance and large-scale UI architecture. I love helping students verify their component design.",
        skills: ["React", "Performance", "CSS Architecture", "System Design"],
        hourlyRate: 150,
        rating: 4.9,
        availability: ["Monday 10am", "Wednesday 2pm", "Friday 11am"]
    },
    {
        name: "David Chen",
        email: "david.chen@example.com",
        jobTitle: "Staff Backend Engineer",
        company: "Uber",
        bio: "Ex-Google. focused on distributed systems and Go/Node.js microservices. Let's debug your backend logic.",
        skills: ["Node.js", "Microservices", "Go", "System Design", "Databases"],
        hourlyRate: 180,
        rating: 5.0,
        availability: ["Tuesday 9am", "Thursday 4pm", "Saturday 10am"]
    },
    {
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        jobTitle: "Engineering Manager",
        company: "Stripe",
        bio: "passionate about mentorship and career growth. I can help with behavioral interviews and negotiation.",
        skills: ["Leadership", "Career Growth", "Ruby", "API Design"],
        hourlyRate: 200,
        rating: 4.8,
        availability: ["Wednesday 6pm", "Sunday 1pm"]
    },
    {
        name: "Michael Chang",
        email: "michael.chang@example.com",
        jobTitle: "Full Stack Developer",
        company: "Airbnb",
        bio: "Bootcamp grad turned Senior Dev. I understand the struggle and can help you break into the industry.",
        skills: ["JavaScript", "React", "Python", "Interview Prep"],
        hourlyRate: 120,
        rating: 4.7,
        availability: ["Monday 8pm", "Tuesday 8pm", "Thursday 8pm"]
    }
];

const seedMentors = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        for (const data of mentors) {
            // Check if user exists
            let user = await User.findOne({ email: data.email });
            if (!user) {
                const hashedPassword = await bcrypt.hash('password123', 10);
                user = new User({
                    name: data.name,
                    email: data.email,
                    password: hashedPassword,
                    role: 'mentor',
                    bio: data.bio,
                    skills: data.skills,
                    jobTitle: data.jobTitle,
                    availability: data.availability, // Populate widely
                    rating: data.rating
                });
                await user.save();
                console.log(`User created: ${data.name}`);
            } else {
                console.log(`User already exists: ${data.name}. Updating role...`);
                user.role = 'mentor';
                user.bio = data.bio;
                user.skills = data.skills;
                user.jobTitle = data.jobTitle;
                await user.save();
            }

            // Create/Update Mentor Profile
            let mentor = await Mentor.findOne({ user: user._id });
            if (!mentor) {
                mentor = new Mentor({
                    user: user._id,
                    bio: data.bio,
                    skills: data.skills,
                    jobTitle: data.jobTitle,
                    company: data.company,
                    hourlyRate: data.hourlyRate,
                    rating: data.rating,
                    availability: data.availability
                });
                await mentor.save();
                console.log(`Mentor profile created for: ${data.name}`);
            } else {
                // Update existing
                mentor.bio = data.bio;
                mentor.skills = data.skills;
                mentor.jobTitle = data.jobTitle;
                mentor.company = data.company;
                mentor.hourlyRate = data.hourlyRate;
                mentor.rating = data.rating;
                mentor.availability = data.availability;
                await mentor.save();
                console.log(`Mentor profile updated for: ${data.name}`);
            }
        }

        console.log('Mentors Seeded Successfully');
        process.exit();

    } catch (error) {
        console.error('Seeding Error:', error);
        process.exit(1);
    }
};

seedMentors();
