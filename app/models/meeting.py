# app/models/meeting.py
from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_path = Column(String, nullable=False)
    transcript = Column(Text, nullable=True)    
    summary = Column(Text, nullable=True)       
    keywords = Column(String, nullable=True)    
    status = Column(String, default="uploaded")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)