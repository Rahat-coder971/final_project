const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (to, subject, htmlContent) => {
    try {
        const mailOptions = {
            from: `"Elevate Hub" <${process.env.EMAIL_USER}>`,
            to: to,
            subject: subject,
            html: htmlContent,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

const sendBookingConfirmation = async (studentEmail, studentName, mentorName, meetingTime, joinUrl) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-w-600px; margin: 0 auto; color: #333;">
            <h2 style="color: #2563EB;">Booking Confirmed!</h2>
            <p>Hi ${studentName},</p>
            <p>Your session with <strong>${mentorName}</strong> is confirmed.</p>
            <p><strong>Time:</strong> ${meetingTime}</p>
            <br>
            <a href="${joinUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Zoom Meeting</a>
            <br><br>
            <p>See you there,<br>The Elevate Hub Team</p>
        </div>
    `;
    await sendEmail(studentEmail, 'Mentorship Session Confirmed ✅', html);
};

const sendNewBookingNotification = async (mentorEmail, mentorName, studentName, meetingTime) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-w-600px; margin: 0 auto; color: #333;">
            <h2 style="color: #2563EB;">New Booking!</h2>
            <p>Hi ${mentorName},</p>
            <p><strong>${studentName}</strong> has booked a session with you.</p>
            <p><strong>Time:</strong> ${meetingTime}</p>
            <br>
            <p>Please check your dashboard for details.</p>
            <br>
            <p>Best,<br>The Elevate Hub Team</p>
        </div>
    `;
    await sendEmail(mentorEmail, 'New Student Booking 📅', html);
};

const sendMentorScheduledNotification = async (studentEmail, studentName, mentorName, meetingTime, joinUrl) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-w-600px; margin: 0 auto; color: #333;">
            <h2 style="color: #2563EB;">Mentor Scheduled a Session!</h2>
            <p>Hi ${studentName},</p>
            <p>Your mentor, <strong>${mentorName}</strong>, has scheduled a milestone review session with you.</p>
            <p><strong>Time:</strong> ${meetingTime}</p>
            <br>
            <a href="${joinUrl}" style="background-color: #2563EB; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Join Zoom Meeting</a>
            <br><br>
            <p>Please be ready on time!</p>
            <p>Best,<br>The Elevate Hub Team</p>
        </div>
    `;
    await sendEmail(studentEmail, 'Milestone Review Scheduled 📅', html);
};

module.exports = { sendEmail, sendBookingConfirmation, sendNewBookingNotification, sendMentorScheduledNotification };
