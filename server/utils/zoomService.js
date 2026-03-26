const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const getZoomAccessToken = async () => {
    try {
        const credentials = Buffer.from(`${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`).toString('base64');

        const response = await axios.post('https://zoom.us/oauth/token?grant_type=account_credentials&account_id=' + process.env.ZOOM_ACCOUNT_ID, {}, {
            headers: {
                'Authorization': `Basic ${credentials}`
            }
        });

        return response.data.access_token;
    } catch (error) {
        console.error('Error getting Zoom access token', error.response ? error.response.data : error.message);
        throw new Error('Failed to connect to Zoom');
    }
};

const createMeeting = async (topic, startTime) => {
    try {
        const token = await getZoomAccessToken();

        const response = await axios.post('https://api.zoom.us/v2/users/me/meetings', {
            topic: topic,
            type: 2, // Scheduled meeting
            start_time: startTime, // '2024-02-20T10:00:00'
            duration: 60, // 1 hour
            settings: {
                host_video: true,
                participant_video: true,
                join_before_host: false,
                mute_upon_entry: true,
                waiting_room: true
            }
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        return {
            joinUrl: response.data.join_url,
            startUrl: response.data.start_url,
            password: response.data.password
        };

    } catch (error) {
        console.error('Error creating Zoom meeting', error.response ? error.response.data : error.message);
        throw new Error('Failed to create Zoom meeting: ' + (error.response?.data?.message || error.message));
    }
};

module.exports = { createMeeting };
