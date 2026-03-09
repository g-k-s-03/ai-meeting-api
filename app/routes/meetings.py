# app/routes/meetings.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingResponse
from typing import List
import shutil
import os

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ POST /meetings/upload
@router.post("/upload", response_model=MeetingResponse)
def upload_meeting(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # validate file type
    allowed_types = ["audio/mpeg", "audio/wav", "audio/mp4", "video/mp4", "audio/x-m4a"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Upload audio/video files only."
        )

    # save file to uploads folder
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # save meeting record to database
    new_meeting = Meeting(
        file_path=file_path,
        status="uploaded"
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

# ✅ GET /meetings
@router.get("/", response_model=List[MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).all()

# ✅ GET /meetings/{id}
@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: UUID, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

# ✅ DELETE /meetings/{id}
@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: UUID, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}