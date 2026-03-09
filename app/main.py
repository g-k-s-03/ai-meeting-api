# main.py
from fastapi import FastAPI
from app.database import Base, engine

app = FastAPI()  # ← this was missing

# Wrap in try/except so server still starts even if DB is briefly unreachable
try:
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️  Could not connect to database on startup: {e}")

@app.get("/")
def root():
    return {"message": "API is running"}