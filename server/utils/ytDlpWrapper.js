const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');

const ytDlpPath = path.join(__dirname, '..', 'bin', 'yt-dlp.exe');

/**
 * Fetches transcript using yt-dlp binary.
 * @param {string} videoUrl 
 * @returns {Promise<string>} Cleaned transcript text
 */
const fetchTranscriptWithYtDlp = (videoUrl) => {
    return new Promise((resolve, reject) => {
        const tempId = Date.now().toString();
        const outputTemplate = path.join(__dirname, '..', 'temp', `subs_${tempId}`);

        // Ensure temp dir exists
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        const args = [
            '--skip-download',
            '--write-sub',
            '--write-auto-sub',
            '--sub-lang', 'en',
            '--output', outputTemplate,
            videoUrl
        ];

        console.log(`[yt-dlp] Fetching for: ${videoUrl}`);

        execFile(ytDlpPath, args, (error, stdout, stderr) => {
            if (error) {
                console.error('[yt-dlp] Error:', stderr);
                return reject(new Error('yt-dlp failed to fetch captions.'));
            }

            // yt-dlp appends .en.vtt or .en.ttml etc.
            // Check for likely files
            const possibleFiles = [
                outputTemplate + '.en.vtt',
                outputTemplate + '.vtt'
            ];

            const foundFile = possibleFiles.find(f => fs.existsSync(f));

            if (foundFile) {
                try {
                    const content = fs.readFileSync(foundFile, 'utf-8');
                    // Simple VTT cleanup
                    const cleanText = content
                        .replace(/WEBVTT/g, '')
                        .replace(/(\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3})/g, '') // Timestamps
                        .replace(/align:start position:0%/g, '')
                        .replace(/<[^>]*>/g, '') // Tags
                        .replace(/\s+/g, ' ')
                        .trim();

                    resolve(cleanText);
                } catch (readErr) {
                    reject(readErr);
                } finally {
                    // Cleanup
                    if (fs.existsSync(foundFile)) fs.unlinkSync(foundFile);
                }
            } else {
                reject(new Error('No subtitle file created by yt-dlp.'));
            }
        });
    });
};

module.exports = { fetchTranscriptWithYtDlp };
