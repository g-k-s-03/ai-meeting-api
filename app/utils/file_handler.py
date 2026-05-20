# app/utils/file_handler.py
import os
import uuid
from fastapi import UploadFile, HTTPException
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

BUCKET_NAME = "meetings"
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB

ALLOWED_TYPES = {
    "audio/mpeg":  ".mp3",
    "audio/wav":   ".wav",
    "audio/mp4":   ".m4a",
    "audio/x-m4a": ".m4a",
    "video/mp4":   ".mp4",
    "video/webm":  ".webm",
}

async def upload_file_to_supabase(file: UploadFile) -> str:
    SUPABASE_URL = os.getenv("SUPABASE_URL")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY")

    print(f"[upload] Supabase URL set: {bool(SUPABASE_URL)}")
    print(f"[upload] Supabase KEY set: {bool(SUPABASE_KEY)}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise HTTPException(status_code=500, detail="Supabase credentials not configured")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use audio/video files only."
        )

    file_bytes = await file.read()
    print(f"[upload] File size: {len(file_bytes)} bytes, type: {file.content_type}")

    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File too large. Maximum size is 100MB."
        )

    extension = ALLOWED_TYPES[file.content_type]
    unique_filename = f"{uuid.uuid4()}{extension}"
    print(f"[upload] Uploading as: {unique_filename} to bucket: {BUCKET_NAME}")

    try:
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
        print(f"[upload] Upload response: {response}")
    except Exception as e:
        print(f"[upload] Upload failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )

    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
    print(f"[upload] Public URL: {public_url}")
    return public_url