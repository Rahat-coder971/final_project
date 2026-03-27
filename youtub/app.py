import json
import os
import shutil
import subprocess
import tempfile
import time
from pathlib import Path
from typing import Optional
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from google import genai
from pydantic import BaseModel


ROOT_DIR = Path(__file__).resolve().parent

def load_env_file(env_path: Path) -> None:
    if not env_path.exists():
        return

    for line in env_path.read_text(encoding="utf-8").splitlines():
        trimmed = line.strip()
        if not trimmed or trimmed.startswith("#") or "=" not in trimmed:
            continue

        key, value = trimmed.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


load_env_file(ROOT_DIR / ".env")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
PORT = int(os.getenv("PORT", "3000"))

app = FastAPI(title="YouTube Video Summarizer")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SummarizeRequest(BaseModel):
    url: str = ""
    transcript: str = ""


@app.exception_handler(Exception)
async def unhandled_exception_handler(_, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal server error: {str(exc) or 'Unknown error.'}"},
    )


def require_api_key() -> str:
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Missing GEMINI_API_KEY in .env")
    return api_key


def get_gemini_client() -> genai.Client:
    return genai.Client(api_key=require_api_key())


def extract_video_id(input_url: str) -> Optional[str]:
    try:
        parsed = urlparse(input_url.strip())
    except ValueError:
        return None

    host = parsed.netloc.replace("www.", "")
    if host == "youtu.be":
        return parsed.path.strip("/").split("/")[0] or None

    if host in {"youtube.com", "m.youtube.com"}:
        if parsed.path == "/watch":
            query = parse_qs(parsed.query)
            return query.get("v", [None])[0]

        if parsed.path.startswith("/shorts/") or parsed.path.startswith("/embed/"):
            parts = [part for part in parsed.path.split("/") if part]
            return parts[1] if len(parts) > 1 else None

    return None


def ensure_tool(name: str) -> str:
    tool_path = shutil.which(name)
    if tool_path:
        return tool_path

    candidates = [
        ROOT_DIR / ".venv" / "Scripts" / f"{name}.exe",
        ROOT_DIR / ".venv" / "Scripts" / name,
    ]

    for candidate in candidates:
        if candidate.exists():
            return str(candidate)

    raise HTTPException(
        status_code=500,
        detail=f"Missing required tool: {name}. Install it and restart the app.",
    )


def fetch_video_metadata(video_url: str) -> dict:
    yt_dlp = ensure_tool("yt-dlp")
    command = [yt_dlp, "--dump-single-json", "--no-playlist", video_url]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)

    if completed.returncode != 0:
        raise HTTPException(
            status_code=500,
            detail=completed.stderr.strip() or "yt-dlp failed to load the video metadata.",
        )

    try:
        return json.loads(completed.stdout)
    except json.JSONDecodeError as error:
        raise HTTPException(status_code=500, detail=f"Unable to parse video metadata: {error}") from error


def download_audio(video_url: str) -> tuple[Path, dict]:
    yt_dlp = ensure_tool("yt-dlp")
    metadata = fetch_video_metadata(video_url)
    temp_dir = Path(tempfile.mkdtemp(prefix="yt_summarizer_"))
    output_template = str(temp_dir / "%(id)s.%(ext)s")

    command = [
        yt_dlp,
        "--no-playlist",
        "-f",
        "bestaudio[ext=m4a][abr<=64]/bestaudio[ext=m4a]/bestaudio[abr<=64]/bestaudio/best",
        "-o",
        output_template,
        video_url,
    ]
    completed = subprocess.run(command, capture_output=True, text=True, check=False)

    if completed.returncode != 0:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=500,
            detail=completed.stderr.strip() or "yt-dlp failed to download audio.",
        )

    downloaded_files = [path for path in temp_dir.iterdir() if path.is_file()]
    if not downloaded_files:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(status_code=500, detail="yt-dlp finished, but no audio file was created.")

    audio_path = downloaded_files[0]
    max_bytes = 25 * 1024 * 1024
    if audio_path.stat().st_size > max_bytes:
        shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=400,
            detail="The downloaded audio is larger than 25 MB. Try a shorter video or a shorter clip.",
        )

    return audio_path, {"title": metadata.get("title") or "YouTube Video", "temp_dir": temp_dir}


def wait_for_file_active(client: genai.Client, uploaded_file, timeout_seconds: int = 120):
    deadline = time.time() + timeout_seconds
    current_file = uploaded_file

    while time.time() < deadline:
        state = getattr(current_file, "state", None)
        state_name = getattr(state, "name", None) if state else None

        if state_name == "ACTIVE":
            return current_file

        if state_name == "FAILED":
            raise HTTPException(status_code=502, detail="Gemini file processing failed.")

        time.sleep(2)
        current_file = client.files.get(name=uploaded_file.name)

    raise HTTPException(status_code=504, detail="Timed out while waiting for Gemini to process the uploaded audio file.")


def transcribe_audio(audio_path: Path) -> str:
    client = get_gemini_client()

    last_error = None

    for _ in range(3):
        try:
            uploaded_file = client.files.upload(file=str(audio_path))
            active_file = wait_for_file_active(client, uploaded_file)
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=[
                    "Generate a clean transcript of the speech in this audio. Return only the transcript text.",
                    active_file,
                ],
            )
            text = (getattr(response, "text", None) or "").strip()
            if not text:
                raise HTTPException(status_code=500, detail="Gemini returned an empty transcript.")
            return text
        except HTTPException:
            raise
        except Exception as error:
            last_error = error
            time.sleep(3)

    raise HTTPException(status_code=502, detail=f"Gemini transcription failed after retries: {last_error}")


def summarize_text(title: str, source_url: str, transcript: str) -> str:
    client = get_gemini_client()
    prompt = (
        "You summarize YouTube videos clearly and accurately.\n"
        "Format the answer in markdown with these sections: Overview, Key Points, Action Items, and One-Sentence TL;DR.\n\n"
        f"Video title: {title}\n"
        f"Video URL: {source_url}\n"
        f"Transcript:\n{transcript}"
    )

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
    except Exception as error:
        raise HTTPException(status_code=502, detail=f"Gemini summary failed: {error}") from error

    summary = (getattr(response, "text", None) or "").strip()
    if not summary:
        raise HTTPException(status_code=500, detail="Gemini returned an empty summary.")
    return summary




@app.post("/api/summarize")
async def summarize(payload: SummarizeRequest) -> dict:
    manual_transcript = payload.transcript.strip()
    if manual_transcript:
        summary = summarize_text("YouTube Video", payload.url or "Manual transcript", manual_transcript)
        return {
            "title": "YouTube Video",
            "language": "Manual transcript",
            "summary": summary,
        }

    video_url = payload.url.strip()
    if not extract_video_id(video_url):
        raise HTTPException(status_code=400, detail="Please paste a valid YouTube video link.")

    temp_dir = None
    try:
        audio_path, metadata = download_audio(video_url)
        temp_dir = metadata["temp_dir"]
        transcript = transcribe_audio(audio_path)
        summary = summarize_text(metadata["title"], video_url, transcript)
        return {
            "title": metadata["title"],
            "language": "Auto transcription",
            "summary": summary,
        }
    finally:
        if temp_dir:
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=PORT, reload=False)
