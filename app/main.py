from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.models import meeting  # noqa: F401
from app.models import user     # noqa: F401
from app.routes import meetings
from app.routes import auth

app = FastAPI(
    title="AI Meeting API",
    description="Upload meeting recordings and get AI-generated transcripts, summaries, action items and decisions.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-meeting-api.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(meetings.router)
app.include_router(auth.router)

try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")
except Exception as e:
    print(f"Could not connect to database on startup: {e}")

@app.get("/")
def root():
    return {"status": "ok", "message": "AI Meeting API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "AI Meeting API"}
