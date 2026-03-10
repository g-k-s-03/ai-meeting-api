# 🎙️ AI Meeting API

An intelligent meeting analysis backend built with **FastAPI**, **Supabase**, **AssemblyAI**, and **Groq LLaMA**. Upload audio/video recordings and get AI-powered transcripts, summaries, keywords, action items, and decisions automatically.

---

## 🚀 Live Demo

> API Base URL: `https://your-deployment-url.com`
> Swagger Docs: `https://your-deployment-url.com/docs`

---

## ✨ Features

- 🎤 **Audio/Video Upload** — Upload mp3, mp4, wav, m4a files to Supabase cloud storage
- 📝 **AI Transcription** — Automatic speech-to-text via AssemblyAI
- 🤖 **AI Summary** — Intelligent meeting summaries via Groq LLaMA 3
- 🔑 **Keyword Extraction** — Auto-extracted meeting keywords
- ✅ **Action Items** — Extracted tasks with owner and deadline
- 🏛️ **Decision Tracking** — Key decisions made during the meeting
- 🔐 **JWT Authentication** — Secure register/login system
- 📤 **Export** — Download meeting reports as JSON or TXT
- 🔍 **Search** — Search meetings by transcript, summary, or keywords

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python) |
| Database | PostgreSQL (Supabase) |
| File Storage | Supabase Storage |
| Speech-to-Text | AssemblyAI |
| AI Summarization | Groq LLaMA 3.3 70B |
| Authentication | JWT (python-jose) |
| Password Hashing | bcrypt (passlib) |
| Deployment | Render / Railway |

---

## 📁 Project Structure

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
├── uploads/                 # Local temp storage
├── .env                     # Environment variables
├── requirements.txt         # Python dependencies
└── README.md
```

---

## ⚙️ Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-meeting-api.git
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
Create a `.env` file in the root directory:
```bash
# Database
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# Supabase Storage
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_KEY=your_service_role_key

# AI Services
ASSEMBLYAI_API_KEY=your_assemblyai_key
GROQ_API_KEY=your_groq_key

# JWT Auth
SECRET_KEY=your_secret_key
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

## 📡 API Endpoints

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

## 🔄 API Workflow

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

## 📋 Example Response

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

## 🔐 Authentication Example

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

---

## 📦 Requirements

```
fastapi
uvicorn
sqlalchemy
psycopg2-binary
python-dotenv
supabase
assemblyai
groq
python-jose[cryptography]
passlib[bcrypt]
python-multipart
email-validator
```

---

## 🌐 Deployment

This API is deployed on **Render**:
- Auto-deploy from GitHub
- Environment variables configured in dashboard
- PostgreSQL via Supabase (external)

---

## 👨‍💻 Author

**Govind** — Backend & AI Developer
- GitHub: [@yourusername](https://github.com/yourusername)
- Portfolio: [yourportfolio.com](https://yourportfolio.com)

---

## 📄 License

MIT License — feel free to use this project for learning or freelancing portfolio.
