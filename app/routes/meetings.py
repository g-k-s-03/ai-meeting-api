# app/routes/meetings.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, PlainTextResponse
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db, SessionLocal
from app.models.meeting import Meeting
from app.schemas.meeting import MeetingResponse
from app.utils.file_handler import upload_file_to_supabase
from app.services.meeting import process_meeting
from app.utils.auth import get_current_user
from app.models.user import User
from typing import List
import json

router = APIRouter(
    prefix="/meetings",
    tags=["Meetings"]
)

def process_meeting_background(meeting_id: UUID, file_url: str):
    # Opens its own session — the request session is already closed by this point
    db = SessionLocal()
    meeting = None
    try:
        meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
        if not meeting:
            print(f"Meeting {meeting_id} not found in background task")
            return
        meeting.status = "processing"
        db.commit()
        result = process_meeting(file_url)
        meeting.transcript = result["transcript"]
        meeting.summary = result["summary"]
        meeting.keywords = result["keywords"]
        meeting.action_items = result["action_items"]
        meeting.decisions = result["decisions"]
        meeting.status = "completed"
        db.commit()
        print(f"Meeting {meeting_id} completed successfully")
    except Exception as e:
        print(f"Processing failed for {meeting_id}: {str(e)}")
        if meeting:
            meeting.status = "failed"
            db.commit()
    finally:
        db.close()

# ✅ POST /meetings/upload 🔒
@router.post("/upload", response_model=MeetingResponse)
async def upload_meeting(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    file_url = await upload_file_to_supabase(file)
    new_meeting = Meeting(file_path=file_url, status="uploaded")
    db.add(new_meeting)
    db.commit()
    db.refresh(new_meeting)
    background_tasks.add_task(process_meeting_background, new_meeting.id, file_url)
    return new_meeting

# ✅ GET /meetings 🔒
@router.get("/", response_model=List[MeetingResponse])
def get_meetings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    return db.query(Meeting).all()

# ✅ GET /meetings/search 🔒
@router.get("/search/")
def search_meetings(
    q: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    results = db.query(Meeting).filter(
        Meeting.transcript.ilike(f"%{q}%") |
        Meeting.summary.ilike(f"%{q}%") |
        Meeting.keywords.ilike(f"%{q}%")
    ).all()
    return results

# ✅ GET /meetings/{id} 🔒
@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting

# ✅ GET /meetings/{id}/transcript 🔒
@router.get("/{meeting_id}/transcript")
def get_transcript(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"id": meeting_id, "transcript": meeting.transcript}

# ✅ GET /meetings/{id}/summary 🔒
@router.get("/{meeting_id}/summary")
def get_summary(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"id": meeting_id, "summary": meeting.summary, "keywords": meeting.keywords}

# ✅ GET /meetings/{id}/action-items 🔒
@router.get("/{meeting_id}/action-items")
def get_action_items(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    action_items = json.loads(meeting.action_items) if meeting.action_items else []
    return {"id": meeting_id, "action_items": action_items}

# ✅ GET /meetings/{id}/export/json 🔒
@router.get("/{meeting_id}/export/json")
def export_json(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    export_data = {
        "id": str(meeting.id),
        "file_path": meeting.file_path,
        "transcript": meeting.transcript,
        "summary": meeting.summary,
        "keywords": meeting.keywords,
        "action_items": json.loads(meeting.action_items) if meeting.action_items else [],
        "decisions": meeting.decisions,
        "status": meeting.status,
        "created_at": str(meeting.created_at),
        "updated_at": str(meeting.updated_at)
    }
    return JSONResponse(content=export_data)

# ✅ GET /meetings/{id}/export/txt 🔒
@router.get("/{meeting_id}/export/txt")
def export_txt(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    content = f"""
MEETING REPORT
==============
ID: {meeting.id}
Date: {meeting.created_at}
Status: {meeting.status}

TRANSCRIPT
----------
{meeting.transcript or 'No transcript available'}

SUMMARY
-------
{meeting.summary or 'No summary available'}

KEYWORDS
--------
{meeting.keywords or 'No keywords available'}

ACTION ITEMS
------------
{meeting.action_items or 'No action items available'}

DECISIONS
---------
{meeting.decisions or 'No decisions available'}
""".strip()
    return PlainTextResponse(content=content)

# ✅ DELETE /meetings/{id} 🔒
@router.delete("/{meeting_id}")
def delete_meeting(
    meeting_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔒
):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    db.delete(meeting)
    db.commit()
    return {"message": "Meeting deleted successfully"}