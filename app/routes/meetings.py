# app/routes/meetings.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingResponse
from app.utils.file_handler import upload_file_to_supabase
from typing import List

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

#  POST /meetings/upload
@router.post("/upload", response_model=MeetingResponse)
async def upload_meeting(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # upload to Supabase Storage and get public URL
    file_url = await upload_file_to_supabase(file)

    # save meeting record to database
    new_meeting = Meeting(
        file_path=file_url,
        status="uploaded"
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

#  GET /meetings
@router.get("/", response_model=List[MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).all()

#  GET /meetings/{id}
@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: UUID, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

#  DELETE /meetings/{id}
@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: UUID, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}