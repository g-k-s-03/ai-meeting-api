# AI Meeting API

> Save hours on meeting notes — upload any recording and get AI-generated transcripts, summaries, action items and decisions instantly.

![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.135-green?style=flat-square&logo=fastapi)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## Why I built this

Manually writing meeting notes and chasing action items wastes 30–60 minutes after every meeting. This API automates the entire process — transcription, summarization, and decision capture — in one upload.

---

## Live Demo

> **Fill in your URL after deploying to Render:**
>
>API Base URL: https://ai-meeting-api-1.onrender.com
Swagger Docs: https://ai-meeting-api-1.onrender.com/docs

---

## Features

- **Audio/Video Upload** — Upload mp3, mp4, wav, m4a files to Supabase cloud storage
- **AI Transcription** — Automatic speech-to-text via AssemblyAI
- **AI Summary** — Intelligent meeting summaries via Groq LLaMA 3
- **Keyword Extraction** — Auto-extracted meeting keywords
- **Action Items** — Extracted tasks with owner and deadline
- **Decision Tracking** — Key decisions made during the meeting
- **JWT Authentication** — Secure register/login system
- **Export** — Download meeting reports as JSON or TXT
- **Search** — Search meetings by transcript, summary, or keywords

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase) |
| File Storage | Supabase Storage |
| Speech-to-Text | AssemblyAI |
| AI Summarization | Groq LLaMA 3.3 70B |
| Authentication | JWT (python-jose) |
| Password Hashing | bcrypt (passlib) |
| Deployment | Render |

---

## Requirements

```
fastapi
uvicorn
SQLAlchemy
psycopg2-binary
python-dotenv
pydantic
email-validator
python-jose[cryptography]
passlib[bcrypt]
python-multipart
assemblyai
groq
supabase
```

---

## Project Structure

```
ai-meeting-api/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # Database connection
│   ├── models/
│   │   ├── meeting.py       # Meeting database model
│   │   └── user.py          # User database model
│   ├── schemas/
│   │   ├── meeting.py       # Meeting Pydantic schemas
│   │   └── user.py          # User Pydantic schemas
│   ├── routes/
│   │   ├── meetings.py      # Meeting API endpoints
│   │   └── auth.py          # Auth API endpoints
│   ├── services/
│   │   └── meeting.py       # AI transcription & summarization
│   └── utils/
│       ├── file_handler.py  # Supabase file upload
│       └── auth.py          # JWT token utilities
├── .env.example             # Environment variable template
├── requirements.txt         # Python dependencies
├── render.yaml              # Render deployment config
├── Procfile                 # Backup deployment config
└── README.md
```

---

## Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/g-k-s-03/ai-meeting-api.git
cd ai-meeting-api
```

### 2. Create virtual environment
```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
source .venv/bin/activate  # Mac/Linux
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Setup environment variables
```bash
cp .env.example .env
# Then fill in your real values in .env
```

```env
DATABASE_URL=postgresql://postgres:PASSWORD@db.REF.supabase.co:5432/postgres
SUPABASE_URL=https://REF.supabase.co
SUPABASE_KEY=your_service_role_key
ASSEMBLYAI_API_KEY=your_assemblyai_key
GROQ_API_KEY=your_groq_key
SECRET_KEY=your_random_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 5. Run the server
```bash
uvicorn app.main:app --reload
```

### 6. Open API docs
```
http://127.0.0.1:8000/docs
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and get JWT token |

### Meetings
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/meetings/upload` | Upload audio/video file |
| GET | `/meetings/` | Get all meetings |
| GET | `/meetings/{id}` | Get single meeting |
| DELETE | `/meetings/{id}` | Delete meeting |
| GET | `/meetings/{id}/transcript` | Get transcript only |
| GET | `/meetings/{id}/summary` | Get summary + keywords |
| GET | `/meetings/{id}/action-items` | Get action items |
| GET | `/meetings/search/?q=keyword` | Search meetings |
| GET | `/meetings/{id}/export/json` | Export as JSON |
| GET | `/meetings/{id}/export/txt` | Export as TXT |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | API status |
| GET | `/health` | Health check |

---

## API Workflow

```
1. Register/Login → get JWT token
        ↓
2. Upload audio/video file
        ↓
3. File saved to Supabase Storage
        ↓
4. Status: "uploaded" → "processing"
        ↓
5. AssemblyAI transcribes audio
        ↓
6. Groq LLaMA generates:
   - Summary
   - Keywords
   - Action items
   - Decisions
        ↓
7. Status: "completed"
        ↓
8. Fetch results via GET /meetings/{id}
```

---

## Example Response

```json
{
  "id": "ec6b33e5-0331-422d-8a7d-8f708067858d",
  "file_path": "https://supabase.co/storage/v1/object/public/meetings/file.mp4",
  "transcript": "In this meeting, we discussed the project timeline...",
  "summary": "Discussion of project timeline and decision on production day",
  "keywords": "project timeline, production day, launch",
  "action_items": [
    {
      "task": "Finalize production schedule",
      "owner": "Govind",
      "deadline": "Friday"
    }
  ],
  "decisions": "Team decided to launch on March 20th",
  "status": "completed",
  "created_at": "2026-03-10T01:55:46.053596",
  "updated_at": "2026-03-10T01:56:00.508469"
}
```

---

## Authentication Example

### Register
```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Login
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Using protected endpoints
```bash
curl -X GET "http://localhost:8000/meetings/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Deployment on Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Add your environment variables in the Render dashboard
6. Deploy — health check hits `/health`

---

## Author

**Govind** — Backend & AI Developer
- GitHub: [@g-k-s-03](https://github.com/g-k-s-03)
- Portfolio: [portfolio-github-io-teal-one.vercel.app](https://portfolio-github-io-teal-one.vercel.app)

---

## License

MIT License — feel free to use this project for learning or as a portfolio piece.
