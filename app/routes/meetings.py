# app/routes/meetings.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingResponse
from app.utils.file_handler import upload_file_to_supabase
from app.services.meeting import process_meeting
from typing import List

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

def process_meeting_background(meeting_id: UUID, file_url: str, db: Session):
    """Runs in background after upload"""
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    try:
        print(f"🔄 Starting processing for meeting {meeting_id}")

        # update status to processing
        meeting.status = "processing"
        db.commit()
        print(f"🔄 Status updated to processing...")

        # run AI pipeline
        print(f"🔄 Sending to AssemblyAI: {file_url}")
        result = process_meeting(file_url)
        print(f"✅ AI processing completed!")

        # save transcript and summary
        meeting.transcript = result["transcript"]
        meeting.summary = result["summary"]
        meeting.status = "completed"
        db.commit()
        print(f"✅ Meeting {meeting_id} completed successfully!")

    except Exception as e:
        meeting.status = "failed"
        db.commit()
        print(f"❌ Processing failed: {str(e)}")

#  POST /meetings/upload
@router.post("/upload", response_model=MeetingResponse)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # upload to Supabase Storage
    file_url = await upload_file_to_supabase(file)

    # save meeting record
    new_meeting = Meeting(
        file_path=file_url,
        status="uploaded"
    )
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)

    # trigger AI processing in background
    background_tasks.add_task(
        process_meeting_background,
        new_meeting.id,
        file_url,
        db
    )

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