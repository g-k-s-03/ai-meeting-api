# app/schemas/meeting.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional

# used when creating a meeting (request body)
class MeetingCreate(BaseModel):
    file_path: str

# used when returning a meeting (response body)
class MeetingResponse(BaseModel):
    id: UUID
    file_path: str
    transcript: Optional[str] = None
    summary: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # allows SQLAlchemy model → Pydantic conversion