# main.py
from fastapi import FastAPI
from app.database import Base, engine, get_db
from app.models import meeting
from app.models import user             
from app.routes import meetings
from app.routes import auth            
from sqlalchemy.orm import Session
from fastapi import Depends

app = FastAPI()

app.include_router(meetings.router)
app.include_router(auth.router)         
# Wrap in try/except so server still starts even if DB is briefly unreachable
try:
    Base.metadata.create_all(bind=engine)
    print(" Database tables created successfully")
except Exception as e:
    print(f"  Could not connect to database on startup: {e}")

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": "disconnected"
        }