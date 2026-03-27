# YouTube Video Summarizer

Paste a YouTube link, let the backend download the audio, transcribe it with Gemini, and generate a summary.

## Why this version is stronger

The earlier caption-scraping approach is fragile because YouTube often rate-limits or withholds transcript text. This Python version is more dependable because it:

- downloads audio with `yt-dlp`
- transcribes audio with Gemini
- summarizes the transcript with Gemini

## Requirements

- Python 3.10+
- `yt-dlp` installed and available on your PATH
- Gemini API key

## Setup

1. Create and activate a virtual environment:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Install dependencies:

   ```powershell
   pip install -r requirements.txt
   pip install yt-dlp
   ```

3. Create `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Add your configuration:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-2.5-flash
   PORT=8765
   ```

5. Start the app:

   ```powershell
   .\.venv\Scripts\python.exe app.py
   ```

6. Open `http://localhost:8765`

## Notes

- This version does not depend on YouTube caption scraping.
- It works best on videos whose downloaded audio stays under the API upload limit.
- A manual transcript box is still included as a fallback.
