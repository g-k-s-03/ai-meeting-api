# app/routes/meetings.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingCreate, MeetingResponse
from typing import List

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

# ✅ Create a meeting
@router.post("/", response_model=MeetingResponse)
def create_meeting(meeting: MeetingCreate, db: Session = Depends(get_db)):
    new_meeting = Meeting(file_path=meeting.file_path)
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    return new_meeting

# ✅ Get all meetings
@router.get("/", response_model=List[MeetingResponse])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(Meeting).all()

# ✅ Get single meeting by ID
@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(meeting_id: UUID, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

# ✅ Delete a meeting
@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: UUID, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}