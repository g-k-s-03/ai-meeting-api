# main.py
from fastapi import FastAPI
from app.database import Base, engine
from app.models import meeting
from app.routes import meetings

app = FastAPI()

app.include_router(meetings.router)

# Wrap in try/except so server still starts even if DB is briefly unreachable
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️  Could not connect to database on startup: {e}")

@app.get("/")
def root():
    return {"message": "API is running"}

