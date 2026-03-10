# app/utils/file_handler.py
import os
import uuid
from fastapi import UploadFile, HTTPException
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

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
    #  Check file type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Use audio/video files only."
        )

    # Read file and check size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 100MB."
        )

    # Generate unique filename to avoid overwriting
    extension = ALLOWED_TYPES[file.content_type]
    unique_filename = f"{uuid.uuid4()}{extension}"

    # Upload to Supabase Storage
    try:
        response = supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=file_bytes,
            file_options={"content-type": file.content_type}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"File upload failed: {str(e)}"
        )

    # Return public URL
    public_url = supabase.storage.from_(BUCKET_NAME).get_public_url(unique_filename)
    return public_url